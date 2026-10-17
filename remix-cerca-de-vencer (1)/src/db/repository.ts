import { query, pool } from './index.ts';
import crypto from 'crypto';
import {
  User,
  Merchant,
  Product,
  Reservation,
  ReservationDetail,
  GlobalImpactStats,
  UserPersonalImpact,
  ProductFilters,
  ReservationStatus,
  ProductStatus,
} from '../types/index.ts';

// Reference coordinates for distance calculation (Plaza Independencia / Tandil Centro: -37.3288, -59.1367)
const DEFAULT_USER_LAT = -37.3288;
const DEFAULT_USER_LNG = -59.1367;

export const categoryNameToId: Record<string, string> = {
  'Lácteos': 'cat-1',
  'Panadería y Repostería': 'cat-2',
  'Carnes y Embutidos': 'cat-3',
  'Frutas y Verduras': 'cat-4',
  'Almacén y Pastas': 'cat-5',
  'Bebidas y Jugos': 'cat-6',
  'Comidas Preparadas': 'cat-7',
  'Otro': 'cat-8',
};

export const categoryIdToName: Record<string, string> = {
  'cat-1': 'Lácteos',
  'cat-2': 'Panadería y Repostería',
  'cat-3': 'Carnes y Embutidos',
  'cat-4': 'Frutas y Verduras',
  'cat-5': 'Almacén y Pastas',
  'cat-6': 'Bebidas y Jugos',
  'cat-7': 'Comidas Preparadas',
  'cat-8': 'Otro',
};

export function hashPassword(password: string): string {
  const salt = 'reaprovecha_salt_v1';
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

export function calculateDaysRemaining(dateStr: string): number {
  if (!dateStr) return 0;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const diffTime = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export class CloudSqlRepository {
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      // Verify connection to Neon PostgreSQL
      await query('SELECT 1');
      this.initialized = true;
      console.log('PostgreSQL Neon conectado y verificado correctamente.');
    } catch (err) {
      console.error('Error al inicializar conexión con Neon:', err);
      this.initialized = true;
    }
  }

  // --- Users & Auth ---
  public async getUsers(): Promise<User[]> {
    const res = await query('SELECT * FROM usuarios ORDER BY nombre ASC');
    return res.rows.map((r) => this.formatUser(r));
  }

  public async findUserById(id: string): Promise<User | undefined> {
    const res = await query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (res.rows.length === 0) return undefined;
    return this.formatUser(res.rows[0]);
  }

  public async findUserByEmail(email: string): Promise<(User & { contraseña_hash?: string }) | undefined> {
    const res = await query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (res.rows.length === 0) return undefined;
    const r = res.rows[0];
    return {
      ...this.formatUser(r),
      contraseña_hash: r.password_hash || undefined,
    };
  }

  public async registerUser(userData: {
    nombre: string;
    email: string;
    password?: string;
    tipo_usuario: 'consumidor' | 'comercio';
    telefono?: string;
    ciudad?: string;
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const existing = await this.findUserByEmail(userData.email);
      if (existing) {
        return { success: false, message: 'El correo electrónico ya se encuentra registrado.' };
      }

      const id = `usr-${userData.tipo_usuario}-${Math.random().toString(36).substring(2, 9)}`;
      const passwordHash = userData.password ? hashPassword(userData.password) : hashPassword('consumidor123');

      const res = await query(
        `INSERT INTO usuarios (id, nombre, email, password_hash, telefono, tipo_usuario, ciudad, activo, fecha_creacion, fecha_actualizacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
         RETURNING *`,
        [
          id,
          userData.nombre.trim(),
          userData.email.toLowerCase().trim(),
          passwordHash,
          userData.telefono?.trim() || null,
          userData.tipo_usuario,
          userData.ciudad?.trim() || 'Tandil, Buenos Aires',
        ]
      );

      return {
        success: true,
        user: this.formatUser(res.rows[0]),
      };
    } catch (error: any) {
      console.error('Error registering user in Neon:', error);
      return { success: false, message: error.message || 'Error al registrar usuario.' };
    }
  }

  public async authenticateUser(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        return { success: false, message: 'No existe una cuenta con este correo electrónico.' };
      }

      if (user.contraseña_hash && !verifyPassword(password, user.contraseña_hash)) {
        return { success: false, message: 'Contraseña incorrecta.' };
      }

      const { contraseña_hash, ...safeUser } = user;
      return { success: true, user: safeUser as User };
    } catch (error: any) {
      console.error('Error authenticating user in Neon:', error);
      return { success: false, message: error.message || 'Error al autenticar.' };
    }
  }

  // --- Merchants ---
  public async getMerchants(): Promise<Merchant[]> {
    const res = await query('SELECT * FROM comercios ORDER BY nombre ASC');
    return res.rows.map((r) => this.formatMerchant(r));
  }

  public async findMerchantById(id: string): Promise<Merchant | undefined> {
    const res = await query('SELECT * FROM comercios WHERE id = $1', [id]);
    if (res.rows.length === 0) return undefined;
    return this.formatMerchant(res.rows[0]);
  }

  public async findMerchantByUserId(userId: string): Promise<Merchant | undefined> {
    const res = await query('SELECT * FROM comercios WHERE usuario_id = $1 LIMIT 1', [userId]);
    if (res.rows.length === 0) return undefined;
    return this.formatMerchant(res.rows[0]);
  }

  public async createMerchant(merchantData: Partial<Merchant>): Promise<Merchant> {
    const id = merchantData.id || `com-${Math.random().toString(36).substring(2, 9)}`;
    const res = await query(
      `INSERT INTO comercios (
        id, usuario_id, nombre, descripcion, direccion, ciudad,
        latitud, longitud, categoria, horario_apertura, horario_cierre,
        telefono, logo_url, verificado, calificacion_promedio, total_resenas,
        fecha_creacion, fecha_actualizacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, 5.0, 0, NOW(), NOW())
      RETURNING *`,
      [
        id,
        merchantData.usuario_id,
        merchantData.nombre || 'Comercio Tandil',
        merchantData.descripcion || '',
        merchantData.direccion || 'Tandil, Buenos Aires',
        merchantData.ciudad || 'Tandil, Buenos Aires',
        merchantData.latitud ?? DEFAULT_USER_LAT,
        merchantData.longitud ?? DEFAULT_USER_LNG,
        merchantData.categoria || 'Panadería y Pastelería',
        merchantData.horario_apertura || '09:00:00',
        merchantData.horario_cierre || '20:00:00',
        merchantData.telefono || '+54 9 249 400-0000',
        null,
      ]
    );
    return this.formatMerchant(res.rows[0]);
  }

  public async updateMerchant(id: string, updates: Partial<Merchant>): Promise<Merchant | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.nombre !== undefined) {
      fields.push(`nombre = $${idx++}`);
      values.push(updates.nombre);
    }
    if (updates.descripcion !== undefined) {
      fields.push(`descripcion = $${idx++}`);
      values.push(updates.descripcion);
    }
    if (updates.direccion !== undefined) {
      fields.push(`direccion = $${idx++}`);
      values.push(updates.direccion);
    }
    if (updates.telefono !== undefined) {
      fields.push(`telefono = $${idx++}`);
      values.push(updates.telefono);
    }
    if (updates.categoria !== undefined) {
      fields.push(`categoria = $${idx++}`);
      values.push(updates.categoria);
    }
    if (updates.horario_apertura !== undefined) {
      fields.push(`horario_apertura = $${idx++}`);
      values.push(updates.horario_apertura);
    }
    if (updates.horario_cierre !== undefined) {
      fields.push(`horario_cierre = $${idx++}`);
      values.push(updates.horario_cierre);
    }

    if (fields.length === 0) return this.findMerchantById(id);

    fields.push(`fecha_actualizacion = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE comercios SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (res.rows.length === 0) return undefined;
    return this.formatMerchant(res.rows[0]);
  }

  public async getMerchantStats(merchantId: string) {
    const productsRes = await query('SELECT * FROM productos WHERE comercio_id = $1', [merchantId]);
    const reservationsRes = await query('SELECT * FROM reservas WHERE comercio_id = $1', [merchantId]);

    const products = productsRes.rows;
    const reservations = reservationsRes.rows;

    const activos = products.filter((p) => p.estado === 'activo' || p.estado === 'disponible');
    const totalVentas = reservations
      .filter((r) => r.estado === 'retirada' || r.estado === 'confirmada')
      .reduce((acc, r) => acc + Number(r.total || 0), 0);

    const totalAhorroGenerado = reservations
      .filter((r) => r.estado === 'retirada' || r.estado === 'confirmada')
      .reduce((acc, r) => acc + Number(r.ahorro_total || 0), 0);

    const impactoRes = await query(
      'SELECT COALESCE(SUM(peso_kg), 0) as total_kg, COALESCE(SUM(co2_evitado_kg), 0) as total_co2 FROM impacto_ambiental WHERE comercio_id = $1',
      [merchantId]
    );

    return {
      productos_activos: activos.length,
      productos_totales: products.length,
      reservas_totales: reservations.length,
      reservas_pendientes: reservations.filter((r) => r.estado === 'pendiente').length,
      dinero_facturado: totalVentas,
      ahorro_generado: totalAhorroGenerado,
      kilos_rescatados: Number(impactoRes.rows[0]?.total_kg || 0),
      co2_evitado_kg: Number(impactoRes.rows[0]?.total_co2 || 0),
    };
  }

  // --- Products ---
  public async getProducts(filters?: ProductFilters): Promise<Product[]> {
    let sqlText = `
      SELECT p.*,
             c.id as comercio_id_joined,
             c.nombre as comercio_nombre,
             c.direccion as comercio_direccion,
             c.ciudad as comercio_ciudad,
             c.categoria as comercio_categoria,
             c.telefono as comercio_telefono,
             c.latitud as comercio_latitud,
             c.longitud as comercio_longitud,
             c.horario_apertura as comercio_horario_apertura,
             c.horario_cierre as comercio_horario_cierre,
             c.calificacion_promedio as comercio_calificacion,
             cat.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN comercios c ON p.comercio_id = c.id
      LEFT JOIN categorias_producto cat ON p.categoria_id = cat.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (filters?.merchantId) {
      sqlText += ` AND p.comercio_id = $${idx++}`;
      params.push(filters.merchantId);
    }

    if (filters?.category && filters.category !== 'all') {
      const catId = categoryNameToId[filters.category];
      if (catId) {
        sqlText += ` AND p.categoria_id = $${idx++}`;
        params.push(catId);
      }
    }

    if (filters?.maxPrice && filters.maxPrice > 0) {
      sqlText += ` AND p.precio_reaprovecha <= $${idx++}`;
      params.push(filters.maxPrice);
    }

    if (filters?.minDiscountPercent && filters.minDiscountPercent > 0) {
      sqlText += ` AND p.porcentaje_descuento >= $${idx++}`;
      params.push(filters.minDiscountPercent);
    }

    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = `%${filters.searchQuery.trim().toLowerCase()}%`;
      sqlText += ` AND (LOWER(p.nombre) LIKE $${idx} OR LOWER(p.descripcion) LIKE $${idx} OR LOWER(c.nombre) LIKE $${idx})`;
      params.push(q);
      idx++;
    }

    // Default sorting
    if (filters?.sortBy === 'precio_menor') {
      sqlText += ` ORDER BY p.precio_reaprovecha ASC`;
    } else if (filters?.sortBy === 'descuento') {
      sqlText += ` ORDER BY p.porcentaje_descuento DESC`;
    } else if (filters?.sortBy === 'recientes') {
      sqlText += ` ORDER BY p.fecha_creacion DESC`;
    } else {
      sqlText += ` ORDER BY p.cantidad_disponible > 0 DESC, p.fecha_creacion DESC`;
    }

    const res = await query(sqlText, params);
    let items = res.rows.map((r) => this.formatProduct(r));

    if (filters?.pickupTodayOnly) {
      items = items.filter((p) => p.dias_restantes <= 1);
    }

    if (filters?.maxDistanceKm && filters.maxDistanceKm > 0) {
      items = items.filter((p) => (p.comercio?.distancia_km ?? 0) <= filters.maxDistanceKm);
    }

    if (filters?.sortBy === 'cercanos') {
      items.sort((a, b) => (a.comercio?.distancia_km ?? 99) - (b.comercio?.distancia_km ?? 99));
    }

    return items;
  }

  public async findProductById(id: string): Promise<Product | undefined> {
    const res = await query(
      `SELECT p.*,
              c.id as comercio_id_joined,
              c.nombre as comercio_nombre,
              c.direccion as comercio_direccion,
              c.ciudad as comercio_ciudad,
              c.categoria as comercio_categoria,
              c.telefono as comercio_telefono,
              c.latitud as comercio_latitud,
              c.longitud as comercio_longitud,
              c.horario_apertura as comercio_horario_apertura,
              c.horario_cierre as comercio_horario_cierre,
              c.calificacion_promedio as comercio_calificacion,
              cat.nombre as categoria_nombre
       FROM productos p
       LEFT JOIN comercios c ON p.comercio_id = c.id
       LEFT JOIN categorias_producto cat ON p.categoria_id = cat.id
       WHERE p.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return undefined;
    return this.formatProduct(res.rows[0]);
  }

  public async createProduct(productData: any): Promise<{ success: boolean; product?: Product; message?: string }> {
    try {
      const id = productData.id || `prod-${Math.random().toString(36).substring(2, 9)}`;
      const catId = categoryNameToId[productData.categoria] || productData.categoria_id || 'cat-8';
      const original = Number(productData.precio_original || 1000);
      const reaprovecha = Number(productData.precio_reaprovecha || 700);
      const discount = Math.round(((original - reaprovecha) / original) * 100);

      const res = await query(
        `INSERT INTO productos (
          id, comercio_id, categoria_id, nombre, descripcion, imagen_url,
          precio_original, precio_reaprovecha, porcentaje_descuento,
          cantidad_inicial, cantidad_disponible, fecha_vencimiento,
          hora_limite_retiro, peso_estimado_kg, motivo_oferta, motivo_detalle,
          estado, ai_priority, ai_priority_label, ai_explanation, ai_suggested_price,
          fecha_creacion, fecha_actualizacion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
        RETURNING *`,
        [
          id,
          productData.comercio_id,
          catId,
          productData.nombre,
          productData.descripcion || '',
          productData.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
          original,
          reaprovecha,
          discount,
          Number(productData.cantidad_inicial || productData.cantidad_disponible || 5),
          Number(productData.cantidad_disponible || 5),
          productData.fecha_vencimiento || new Date().toISOString().split('T')[0],
          productData.hora_limite_retiro || 'Hoy hasta 20:00 hs',
          Number(productData.peso_estimado_kg || 0.5),
          productData.motivo_oferta || 'Próximo a vencer',
          productData.motivo_detalle || null,
          productData.estado || 'activo',
          productData.aiPriority || 'media',
          productData.aiPriorityLabel || null,
          productData.aiExplanation || null,
          productData.aiSuggestedPrice ? Number(productData.aiSuggestedPrice) : null,
        ]
      );

      const created = await this.findProductById(res.rows[0].id);
      return { success: true, product: created };
    } catch (error: any) {
      console.error('Error creating product in Neon:', error);
      return { success: false, message: error.message || 'Error al guardar el producto.' };
    }
  }

  public async updateProduct(id: string, updates: any): Promise<{ success: boolean; product?: Product; message?: string }> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (updates.nombre !== undefined) {
        fields.push(`nombre = $${idx++}`);
        values.push(updates.nombre);
      }
      if (updates.descripcion !== undefined) {
        fields.push(`descripcion = $${idx++}`);
        values.push(updates.descripcion);
      }
      if (updates.imagen !== undefined) {
        fields.push(`imagen_url = $${idx++}`);
        values.push(updates.imagen);
      }
      if (updates.categoria !== undefined) {
        const catId = categoryNameToId[updates.categoria] || 'cat-8';
        fields.push(`categoria_id = $${idx++}`);
        values.push(catId);
      }
      if (updates.precio_original !== undefined) {
        fields.push(`precio_original = $${idx++}`);
        values.push(Number(updates.precio_original));
      }
      if (updates.precio_reaprovecha !== undefined) {
        fields.push(`precio_reaprovecha = $${idx++}`);
        values.push(Number(updates.precio_reaprovecha));
      }
      if (updates.cantidad_disponible !== undefined) {
        fields.push(`cantidad_disponible = $${idx++}`);
        values.push(Number(updates.cantidad_disponible));
      }
      if (updates.fecha_vencimiento !== undefined) {
        fields.push(`fecha_vencimiento = $${idx++}`);
        values.push(updates.fecha_vencimiento);
      }
      if (updates.hora_limite_retiro !== undefined) {
        fields.push(`hora_limite_retiro = $${idx++}`);
        values.push(updates.hora_limite_retiro);
      }
      if (updates.estado !== undefined) {
        fields.push(`estado = $${idx++}`);
        values.push(updates.estado);
      }

      if (fields.length === 0) {
        const p = await this.findProductById(id);
        return { success: true, product: p };
      }

      fields.push(`fecha_actualizacion = NOW()`);
      values.push(id);

      await query(
        `UPDATE productos SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );

      const updated = await this.findProductById(id);
      return { success: true, product: updated };
    } catch (error: any) {
      console.error('Error updating product in Neon:', error);
      return { success: false, message: error.message || 'Error al actualizar el producto.' };
    }
  }

  public async setProductStatus(id: string, estado: ProductStatus): Promise<boolean> {
    const res = await query(
      'UPDATE productos SET estado = $1, fecha_actualizacion = NOW() WHERE id = $2',
      [estado, id]
    );
    return (res.rowCount ?? 0) > 0;
  }

  public async updateProductStock(id: string, newStock: number): Promise<boolean> {
    const newEstado = newStock <= 0 ? 'agotado' : 'activo';
    const res = await query(
      'UPDATE productos SET cantidad_disponible = $1, estado = $2, fecha_actualizacion = NOW() WHERE id = $3',
      [newStock, newEstado, id]
    );
    return (res.rowCount ?? 0) > 0;
  }

  public async deleteProduct(id: string): Promise<boolean> {
    const res = await query('DELETE FROM productos WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // --- Reservations ---
  public async createReservation(data: {
    usuario_id: string;
    producto_id: string;
    cantidad: number;
    cliente_nombre?: string;
    cliente_telefono?: string;
    cliente_email?: string;
  }): Promise<{ success: boolean; reservation?: Reservation; message?: string }> {
    try {
      const product = await this.findProductById(data.producto_id);
      if (!product) {
        return { success: false, message: 'El producto no existe.' };
      }

      if (product.cantidad_disponible < data.cantidad) {
        return {
          success: false,
          message: `Stock insuficiente. Solo quedan ${product.cantidad_disponible} unidades disponibles.`,
        };
      }

      // Strictly require an authenticated and registered user
      if (!data.usuario_id || !data.usuario_id.trim()) {
        return {
          success: false,
          message: 'Debes iniciar sesión para realizar una reserva.',
        };
      }

      const finalUserId = data.usuario_id.trim();
      const userCheck = await query('SELECT id, nombre, email, telefono FROM usuarios WHERE id = $1', [finalUserId]);
      if (userCheck.rows.length === 0) {
        return {
          success: false,
          message: 'Usuario no registrado. Debes iniciar sesión con una cuenta válida para reservar.',
        };
      }

      const dbUser = userCheck.rows[0];
      const clienteNombre = data.cliente_nombre?.trim() || dbUser.nombre || 'Consumidor Tandil';
      const clienteTelefono = data.cliente_telefono?.trim() || dbUser.telefono || '+54 9 249 400-0000';
      const clienteEmail = data.cliente_email?.trim() || dbUser.email || '';

      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const reservationId = `REP-${randomCode}`;
      const nowIso = new Date().toISOString();

      const unitPrice = product.precio_reaprovecha;
      const subtotal = unitPrice * data.cantidad;
      const originalTotal = product.precio_original * data.cantidad;
      const ahorroTotal = Math.max(0, originalTotal - subtotal);

      // 1. Insert reservation into Neon
      await query(
        `INSERT INTO reservas (
          id, codigo_retiro, usuario_id, comercio_id, estado,
          total, ahorro_total, cliente_nombre, cliente_telefono, cliente_email,
          hora_limite_retiro, fecha_reserva, fecha_creacion, fecha_actualizacion
        ) VALUES ($1, $2, $3, $4, 'pendiente', $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())`,
        [
          reservationId,
          `RET-${reservationId}`,
          finalUserId,
          product.comercio_id,
          subtotal,
          ahorroTotal,
          clienteNombre,
          clienteTelefono,
          clienteEmail,
          product.hora_limite_retiro || 'Hoy hasta 20:00 hs',
        ]
      );

      // 2. Insert detail into Neon
      const detailId = `det-${Math.random().toString(36).substring(2, 9)}`;
      await query(
        `INSERT INTO detalle_reserva (
          id, reserva_id, producto_id, cantidad,
          precio_unitario, precio_original_unitario, subtotal,
          nombre_snapshot, imagen_snapshot, fecha_creacion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          detailId,
          reservationId,
          product.id,
          data.cantidad,
          unitPrice,
          product.precio_original,
          subtotal,
          product.nombre,
          product.imagen,
        ]
      );

      // 3. Decrement available stock
      const remainingStock = Math.max(0, product.cantidad_disponible - data.cantidad);
      await this.updateProductStock(product.id, remainingStock);

      // 4. Record environmental impact
      const weightRescuedKg = Math.round(product.peso_estimado_kg * data.cantidad * 10) / 10;
      const co2AvoidedKg = Math.round(weightRescuedKg * 2.5 * 10) / 10;
      const waterSavedLitres = Math.round(weightRescuedKg * 400);

      await query(
        `INSERT INTO impacto_ambiental (
          id, reserva_id, usuario_id, comercio_id,
          cantidad_alimentos, peso_kg, ahorro_usuario, co2_evitado_kg, agua_ahorrada_litros, fecha
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          `imp-${Math.random().toString(36).substring(2, 9)}`,
          reservationId,
          finalUserId,
          product.comercio_id,
          data.cantidad,
          weightRescuedKg,
          ahorroTotal,
          co2AvoidedKg,
          waterSavedLitres,
        ]
      );

      const fullReservation: Reservation = {
        id: reservationId,
        usuario_id: finalUserId,
        comercio_id: product.comercio_id,
        fecha: nowIso,
        total: subtotal,
        ahorro_total: ahorroTotal,
        estado: 'pendiente',
        fecha_creacion: nowIso,
        comercio_nombre: product.comercio?.nombre,
        comercio_direccion: product.comercio?.direccion,
        comercio_telefono: product.comercio?.telefono,
        cliente_nombre: data.cliente_nombre,
        cliente_telefono: data.cliente_telefono,
        cliente_email: data.cliente_email,
        hora_limite_retiro: product.hora_limite_retiro,
        items: [
          {
            id: detailId,
            reserva_id: reservationId,
            producto_id: product.id,
            cantidad: data.cantidad,
            precio_unitario: unitPrice,
            subtotal,
            producto_nombre: product.nombre,
            producto_imagen: product.imagen,
          },
        ],
      };

      return {
        success: true,
        reservation: fullReservation,
        message: `¡Reserva ${reservationId} creada con éxito! Presentate en el local con este código para abonar y retirar.`,
      };
    } catch (error: any) {
      console.error('Error creating reservation in Neon:', error);
      return { success: false, message: error.message || 'Error al procesar reserva en la base de datos.' };
    }
  }

  public async getReservationsForUser(userId: string): Promise<Reservation[]> {
    try {
      const res = await query(
        `SELECT r.*,
                c.nombre as comercio_nombre,
                c.direccion as comercio_direccion,
                c.telefono as comercio_telefono
         FROM reservas r
         LEFT JOIN comercios c ON r.comercio_id = c.id
         WHERE r.usuario_id = $1
         ORDER BY r.fecha_creacion DESC`,
        [userId]
      );

      const list: Reservation[] = [];
      for (const row of res.rows) {
        const detailsRes = await query(
          'SELECT * FROM detalle_reserva WHERE reserva_id = $1',
          [row.id]
        );
        list.push(this.formatReservation(row, detailsRes.rows));
      }
      return list;
    } catch (error) {
      console.error('Error fetching reservations for user in Neon:', error);
      return [];
    }
  }

  public async getReservationsByIds(ids: string[]): Promise<Reservation[]> {
    if (!ids || ids.length === 0) return [];
    try {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      const res = await query(
        `SELECT r.*,
                c.nombre as comercio_nombre,
                c.direccion as comercio_direccion,
                c.telefono as comercio_telefono
         FROM reservas r
         LEFT JOIN comercios c ON r.comercio_id = c.id
         WHERE r.id IN (${placeholders})
         ORDER BY r.fecha_creacion DESC`,
        ids
      );

      const list: Reservation[] = [];
      for (const row of res.rows) {
        const detailsRes = await query(
          'SELECT * FROM detalle_reserva WHERE reserva_id = $1',
          [row.id]
        );
        list.push(this.formatReservation(row, detailsRes.rows));
      }
      return list;
    } catch (error) {
      console.error('Error fetching reservations by IDs in Neon:', error);
      return [];
    }
  }

  public async getReservationsForMerchant(merchantId: string): Promise<Reservation[]> {
    try {
      const res = await query(
        `SELECT r.*,
                c.nombre as comercio_nombre,
                c.direccion as comercio_direccion,
                c.telefono as comercio_telefono
         FROM reservas r
         LEFT JOIN comercios c ON r.comercio_id = c.id
         WHERE r.comercio_id = $1
         ORDER BY r.fecha_creacion DESC`,
        [merchantId]
      );

      const list: Reservation[] = [];
      for (const row of res.rows) {
        const detailsRes = await query(
          'SELECT * FROM detalle_reserva WHERE reserva_id = $1',
          [row.id]
        );
        list.push(this.formatReservation(row, detailsRes.rows));
      }
      return list;
    } catch (error) {
      console.error('Error fetching reservations for merchant in Neon:', error);
      return [];
    }
  }

  public async updateReservationStatus(id: string, newStatus: ReservationStatus): Promise<boolean> {
    const res = await query(
      'UPDATE reservas SET estado = $1, fecha_actualizacion = NOW() WHERE id = $2',
      [newStatus, id]
    );
    return (res.rowCount ?? 0) > 0;
  }

  // --- Impact Metrics ---
  public async getGlobalImpactStats(): Promise<GlobalImpactStats> {
    const impactRes = await query(`
      SELECT 
        COALESCE(SUM(peso_kg), 0) as total_kg,
        COALESCE(SUM(cantidad_alimentos), 0) as total_alimentos,
        COALESCE(SUM(ahorro_usuario), 0) as total_ahorro,
        COALESCE(SUM(co2_evitado_kg), 0) as total_co2
      FROM impacto_ambiental
    `);

    const merchantsCount = await query('SELECT count(*) FROM comercios');
    const reservationsCount = await query('SELECT count(*) FROM reservas');

    const imp = impactRes.rows[0];

    return {
      kilos_recuperados: Math.round(Number(imp.total_kg || 0) * 10) / 10,
      productos_recuperados: Number(imp.total_alimentos || 0),
      dinero_ahorrado: Math.round(Number(imp.total_ahorro || 0)),
      comercios_participantes: Number(merchantsCount.rows[0]?.count || 0),
      reservas_realizadas: Number(reservationsCount.rows[0]?.count || 0),
      co2_evitado_kg: Math.round(Number(imp.total_co2 || 0) * 10) / 10,
    };
  }

  public async getUserPersonalImpact(userId: string): Promise<UserPersonalImpact> {
    const impactRes = await query(
      `SELECT 
        COALESCE(SUM(peso_kg), 0) as total_kg,
        COALESCE(SUM(cantidad_alimentos), 0) as total_alimentos,
        COALESCE(SUM(ahorro_usuario), 0) as total_ahorro,
        COALESCE(SUM(co2_evitado_kg), 0) as total_co2
       FROM impacto_ambiental
       WHERE usuario_id = $1`,
      [userId]
    );

    const userReservations = await query('SELECT estado FROM reservas WHERE usuario_id = $1', [userId]);
    const imp = impactRes.rows[0];

    const completed = userReservations.rows.filter(
      (r) => r.estado === 'retirada' || r.estado === 'confirmada' || r.estado === 'lista_para_retirar'
    );

    return {
      kilos_recuperados: Math.round(Number(imp.total_kg || 0) * 10) / 10,
      productos_recuperados: Number(imp.total_alimentos || 0),
      dinero_ahorrado: Math.round(Number(imp.total_ahorro || 0)),
      reservas_realizadas: userReservations.rows.length,
      co2_evitado_kg: Math.round(Number(imp.total_co2 || 0) * 10) / 10,
      compras_count: completed.length,
    };
  }

  public resetToInitialSeed(): void {
    console.log('resetToInitialSeed omitido (conectado directamente a Neon).');
  }

  // --- Formatters ---
  private formatUser(r: any): User {
    return {
      id: r.id,
      nombre: r.nombre,
      email: r.email,
      telefono: r.telefono || undefined,
      tipo_usuario: r.tipo_usuario,
      ciudad: r.ciudad || undefined,
      fecha_creacion: r.fecha_creacion instanceof Date ? r.fecha_creacion.toISOString() : String(r.fecha_creacion || ''),
    };
  }

  private formatMerchant(r: any): Merchant {
    return {
      id: r.id,
      usuario_id: r.usuario_id,
      nombre: r.nombre,
      descripcion: r.descripcion || '',
      direccion: r.direccion,
      ciudad: r.ciudad || 'Tandil, Buenos Aires',
      latitud: Number(r.latitud || DEFAULT_USER_LAT),
      longitud: Number(r.longitud || DEFAULT_USER_LNG),
      categoria: r.categoria,
      horario_apertura: String(r.horario_apertura || '09:00:00').substring(0, 5),
      horario_cierre: String(r.horario_cierre || '20:00:00').substring(0, 5),
      telefono: r.telefono || '',
      fecha_creacion: r.fecha_creacion instanceof Date ? r.fecha_creacion.toISOString() : String(r.fecha_creacion || ''),
    };
  }

  private formatProduct(r: any): Product {
    const lat = Number(r.comercio_latitud || DEFAULT_USER_LAT);
    const lng = Number(r.comercio_longitud || DEFAULT_USER_LNG);
    const distanceKm = calculateDistanceKm(DEFAULT_USER_LAT, DEFAULT_USER_LNG, lat, lng);

    const expDateStr = r.fecha_vencimiento instanceof Date
      ? r.fecha_vencimiento.toISOString().split('T')[0]
      : String(r.fecha_vencimiento || '');

    const catName = r.categoria_nombre || categoryIdToName[r.categoria_id] || 'Otro';

    return {
      id: r.id,
      comercio_id: r.comercio_id,
      nombre: r.nombre,
      descripcion: r.descripcion || '',
      categoria: catName as any,
      imagen: r.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
      precio_original: Number(r.precio_original || 0),
      precio_reaprovecha: Number(r.precio_reaprovecha || 0),
      porcentaje_descuento: Number(r.porcentaje_descuento || 0),
      cantidad_disponible: Number(r.cantidad_disponible || 0),
      cantidad_inicial: Number(r.cantidad_inicial || r.cantidad_disponible || 0),
      fecha_vencimiento: expDateStr,
      hora_limite_retiro: r.hora_limite_retiro || 'Hoy hasta 20:00 hs',
      dias_restantes: calculateDaysRemaining(expDateStr),
      estado: r.estado,
      peso_estimado_kg: Number(r.peso_estimado_kg || 0.5),
      fecha_creacion: r.fecha_creacion instanceof Date ? r.fecha_creacion.toISOString() : String(r.fecha_creacion || ''),
      motivo_oferta: r.motivo_oferta || 'Próximo a vencer',
      motivo_detalle: r.motivo_detalle || undefined,
      comercio: r.comercio_nombre
        ? {
            id: r.comercio_id_joined || r.comercio_id,
            nombre: r.comercio_nombre,
            direccion: r.comercio_direccion || '',
            ciudad: r.comercio_ciudad || 'Tandil, Buenos Aires',
            categoria: r.comercio_categoria || 'Comercio',
            telefono: r.comercio_telefono || '',
            latitud: lat,
            longitud: lng,
            horario_apertura: String(r.comercio_horario_apertura || '09:00').substring(0, 5),
            horario_cierre: String(r.comercio_horario_cierre || '20:00').substring(0, 5),
            distancia_km: distanceKm,
          }
        : undefined,
      aiPriority: r.ai_priority,
      aiPriorityLabel: r.ai_priority_label,
      aiExplanation: r.ai_explanation,
      aiSuggestedPrice: r.ai_suggested_price ? Number(r.ai_suggested_price) : undefined,
    };
  }

  private formatReservation(r: any, details: any[]): Reservation {
    const nowIso = r.fecha_creacion instanceof Date ? r.fecha_creacion.toISOString() : String(r.fecha_creacion || new Date().toISOString());

    const items: ReservationDetail[] = details.map((d) => ({
      id: d.id,
      reserva_id: d.reserva_id,
      producto_id: d.producto_id,
      cantidad: Number(d.cantidad || 1),
      precio_unitario: Number(d.precio_unitario || 0),
      subtotal: Number(d.subtotal || 0),
      producto_nombre: d.nombre_snapshot,
      producto_imagen: d.imagen_snapshot,
    }));

    return {
      id: r.id,
      usuario_id: r.usuario_id,
      comercio_id: r.comercio_id,
      fecha: nowIso,
      total: Number(r.total || 0),
      ahorro_total: Number(r.ahorro_total || 0),
      estado: r.estado,
      fecha_creacion: nowIso,
      comercio_nombre: r.comercio_nombre,
      comercio_direccion: r.comercio_direccion,
      comercio_telefono: r.comercio_telefono,
      cliente_nombre: r.cliente_nombre,
      cliente_telefono: r.cliente_telefono,
      cliente_email: r.cliente_email,
      hora_limite_retiro: r.hora_limite_retiro,
      items,
    };
  }
}

export const cloudSqlRepo = new CloudSqlRepository();
