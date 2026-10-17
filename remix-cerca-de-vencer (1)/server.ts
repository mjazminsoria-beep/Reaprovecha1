import express, { Request, Response } from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { cloudSqlRepo } from './src/db/repository.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Runtime Environment requires dev server to run on port 3000 (nginx reverse-proxy runs on 8080)
const PORT = 3000;

app.use(express.json());
app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));
app.use('/images', express.static(path.resolve(__dirname, 'public/images')));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { nombre, email, password, tipo_usuario, telefono, ciudad, nombre_comercio, direccion, categoria } =
    req.body;

  if (!nombre || !email || !password || !tipo_usuario) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para el registro.' });
  }

  const result = await cloudSqlRepo.registerUser({
    nombre,
    email,
    password,
    tipo_usuario,
    telefono,
    ciudad,
  });

  if (!result.success || !result.user) {
    return res.status(400).json({ error: result.message || 'Error en el registro.' });
  }

  // If registering a merchant, create merchant profile right away in Cloud SQL
  let merchantProfile = null;
  if (tipo_usuario === 'comercio') {
    merchantProfile = await cloudSqlRepo.createMerchant({
      usuario_id: result.user.id,
      nombre: nombre_comercio || nombre,
      descripcion: `Proveedor de alimentos frescos y excedentes en ${ciudad || 'Tandil, Buenos Aires'}.`,
      direccion: direccion || 'Av. España 750, Tandil, Buenos Aires',
      ciudad: ciudad || 'Tandil, Buenos Aires',
      latitud: -37.3288 + (Math.random() - 0.5) * 0.02,
      longitud: -59.1367 + (Math.random() - 0.5) * 0.02,
      categoria: categoria || 'Panadería y Pastelería',
      horario_apertura: '09:00',
      horario_cierre: '20:00',
      telefono: telefono || '+54 9 249 400-0000',
    });
  }

  return res.json({
    user: result.user,
    merchant: merchantProfile,
    message: 'Usuario registrado con éxito en la base de datos.',
  });
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Ingresá email y contraseña.' });
  }

  const result = await cloudSqlRepo.authenticateUser(email, password);
  if (!result.success || !result.user) {
    return res.status(401).json({ error: result.message || 'Credenciales inválidas.' });
  }

  let merchant = null;
  if (result.user.tipo_usuario === 'comercio') {
    merchant = await cloudSqlRepo.findMerchantByUserId(result.user.id);
  }

  return res.json({
    user: result.user,
    merchant,
    message: 'Inicio de sesión exitoso.',
  });
});

// Demo quick-login accounts list
app.get('/api/auth/demo-users', async (_req: Request, res: Response) => {
  try {
    const users = await cloudSqlRepo.getUsers();
    const consumers = users.filter((u) => u.tipo_usuario === 'consumidor');
    const merchants = users.filter((u) => u.tipo_usuario === 'comercio');

    const merchantsWithDetails = [];
    for (const m of merchants.slice(0, 3)) {
      const merchantDetails = await cloudSqlRepo.findMerchantByUserId(m.id);
      merchantsWithDetails.push({
        ...m,
        merchantDetails,
      });
    }

    res.json({
      consumers: consumers.slice(0, 2),
      merchants: merchantsWithDetails,
    });
  } catch (error: any) {
    console.error('Error fetching demo users from Cloud SQL:', error);
    res.status(500).json({ error: 'Error al cargar usuarios de la base de datos.' });
  }
});

// ==========================================
// 2. MERCHANTS
// ==========================================

app.get('/api/merchants', async (_req: Request, res: Response) => {
  try {
    const merchants = await cloudSqlRepo.getMerchants();
    res.json(merchants);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar comercios.' });
  }
});

app.get('/api/merchants/:id', async (req: Request, res: Response) => {
  try {
    const merchant = await cloudSqlRepo.findMerchantById(req.params.id);
    if (!merchant) {
      return res.status(404).json({ error: 'Comercio no encontrado.' });
    }
    res.json(merchant);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar comercio.' });
  }
});

app.get('/api/merchants/user/:userId', async (req: Request, res: Response) => {
  try {
    const merchant = await cloudSqlRepo.findMerchantByUserId(req.params.userId);
    if (!merchant) {
      return res.status(404).json({ error: 'No se encontró comercio para este usuario.' });
    }
    res.json(merchant);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar comercio de usuario.' });
  }
});

app.put('/api/merchants/:id', async (req: Request, res: Response) => {
  try {
    const updated = await cloudSqlRepo.updateMerchant(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Comercio no encontrado.' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar comercio.' });
  }
});

app.get('/api/merchants/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await cloudSqlRepo.getMerchantStats(req.params.id);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener métricas del comercio.' });
  }
});

// ==========================================
// 3. PRODUCTS & CATALOG
// ==========================================

// Get products with complete search, multi-filter & sort
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      merchantId,
      maxDistance,
      maxPrice,
      minDiscount,
      pickupToday,
      sortBy,
      userLat,
      userLng,
    } = req.query;

    const filters = {
      searchQuery: q ? String(q) : '',
      category: category ? String(category) : '',
      merchantId: merchantId ? String(merchantId) : '',
      maxDistanceKm: maxDistance ? parseFloat(String(maxDistance)) : 0,
      maxPrice: maxPrice ? parseFloat(String(maxPrice)) : 0,
      minDiscountPercent: minDiscount ? parseFloat(String(minDiscount)) : 0,
      pickupTodayOnly: pickupToday === 'true',
      sortBy: (sortBy as any) || 'cercanos',
      userLat: userLat ? parseFloat(String(userLat)) : undefined,
      userLng: userLng ? parseFloat(String(userLng)) : undefined,
    };

    const products = await cloudSqlRepo.getProducts(filters);
    res.json(products);
  } catch (error: any) {
    console.error('Error in GET /api/products:', error);
    res.status(500).json({ error: 'Error al consultar productos desde la base de datos.' });
  }
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await cloudSqlRepo.findProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al buscar producto.' });
  }
});

// Create product (Merchant)
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const {
      comercio_id,
      nombre,
      descripcion,
      categoria,
      imagen,
      precio_original,
      precio_reaprovecha,
      cantidad_disponible,
      fecha_vencimiento,
      hora_limite_retiro,
      peso_estimado_kg,
      aiPriority,
      aiPriorityLabel,
      aiExplanation,
    } = req.body;

    if (
      !comercio_id ||
      !nombre ||
      !precio_original ||
      !precio_reaprovecha ||
      !cantidad_disponible ||
      !fecha_vencimiento
    ) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para publicar el producto.' });
    }

    const result = await cloudSqlRepo.createProduct({
      comercio_id,
      nombre,
      descripcion: descripcion || '',
      categoria: categoria || 'Lácteos',
      imagen: imagen || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
      precio_original: Number(precio_original),
      precio_reaprovecha: Number(precio_reaprovecha),
      cantidad_disponible: Number(cantidad_disponible),
      fecha_vencimiento,
      hora_limite_retiro: hora_limite_retiro || 'Hoy hasta las 20:00 hs',
      peso_estimado_kg: Number(peso_estimado_kg || 0.5),
      aiPriority,
      aiPriorityLabel,
      aiExplanation,
    });

    if (!result.success || !result.product) {
      return res.status(400).json({ error: result.message || 'Error al guardar producto.' });
    }

    res.status(201).json(result.product);
  } catch (error: any) {
    console.error('Error creating product in Cloud SQL:', error);
    res.status(500).json({ error: 'Error interno al insertar producto en la base de datos.' });
  }
});

// Edit product
app.put('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const result = await cloudSqlRepo.updateProduct(req.params.id, req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result.product);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar producto en la base de datos.' });
  }
});

// Update product status (activo, pausado, agotado)
app.patch('/api/products/:id/status', async (req: Request, res: Response) => {
  try {
    const { estado } = req.body;
    const ok = await cloudSqlRepo.setProductStatus(req.params.id, estado);
    if (!ok) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json({ success: true, estado });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar estado del producto.' });
  }
});

// Update product stock
app.patch('/api/products/:id/stock', async (req: Request, res: Response) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || Number(stock) < 0) {
      return res.status(400).json({ error: 'Stock inválido.' });
    }
    const ok = await cloudSqlRepo.updateProductStock(req.params.id, Number(stock));
    if (!ok) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json({ success: true, stock });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar stock del producto.' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const ok = await cloudSqlRepo.deleteProduct(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json({ success: true, message: 'Producto eliminado correctamente de la base de datos.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al eliminar producto.' });
  }
});

// ==========================================
// 4. RESERVATIONS
// ==========================================

// Create reservation (Consumer)
app.post('/api/reservations', async (req: Request, res: Response) => {
  try {
    const { usuario_id, producto_id, cantidad, cliente_nombre, cliente_telefono, cliente_email } =
      req.body;

    if (!usuario_id || typeof usuario_id !== 'string' || !usuario_id.trim()) {
      return res.status(401).json({ error: 'Debes iniciar sesión para realizar una reserva.' });
    }

    if (!producto_id || !cantidad || Number(cantidad) < 1) {
      return res.status(400).json({ error: 'Faltan parámetros válidos para crear la reserva.' });
    }

    const result = await cloudSqlRepo.createReservation({
      usuario_id,
      producto_id,
      cantidad: Number(cantidad),
      cliente_nombre,
      cliente_telefono,
      cliente_email,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating reservation in Cloud SQL:', error);
    res.status(500).json({ error: 'Error al crear reserva en la base de datos.' });
  }
});

// Get reservations by IDs (for guest / local session tracking)
app.get('/api/reservations/by-ids', async (req: Request, res: Response) => {
  try {
    const idsQuery = req.query.ids;
    if (!idsQuery) return res.json([]);
    const ids = String(idsQuery).split(',').map((s) => s.trim()).filter(Boolean);
    const reservations = await cloudSqlRepo.getReservationsByIds(ids);
    res.json(reservations);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al cargar reservas.' });
  }
});

// Get user reservations
app.get('/api/reservations/user/:userId', async (req: Request, res: Response) => {
  try {
    const reservations = await cloudSqlRepo.getReservationsForUser(req.params.userId);
    res.json(reservations);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al cargar reservas del usuario.' });
  }
});

// Get merchant reservations
app.get('/api/reservations/merchant/:merchantId', async (req: Request, res: Response) => {
  try {
    const reservations = await cloudSqlRepo.getReservationsForMerchant(req.params.merchantId);
    res.json(reservations);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al cargar reservas del comercio.' });
  }
});

// Update reservation status (Merchant or Consumer cancellation)
app.patch('/api/reservations/:id/status', async (req: Request, res: Response) => {
  try {
    const { estado } = req.body;
    if (!['pendiente', 'confirmada', 'lista_para_retirar', 'retirada', 'cancelada'].includes(estado)) {
      return res.status(400).json({ error: 'Estado de reserva inválido.' });
    }

    const ok = await cloudSqlRepo.updateReservationStatus(req.params.id, estado);
    if (!ok) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    res.json({ success: true, id: req.params.id, estado });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar estado de reserva.' });
  }
});

// ==========================================
// 5. IMPACT METRICS
// ==========================================

app.get('/api/impact/global', async (_req: Request, res: Response) => {
  try {
    const stats = await cloudSqlRepo.getGlobalImpactStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al calcular impacto global.' });
  }
});

app.get('/api/impact/user/:userId', async (req: Request, res: Response) => {
  try {
    const userImpact = await cloudSqlRepo.getUserPersonalImpact(req.params.userId);
    res.json(userImpact);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al calcular impacto personal.' });
  }
});

// ==========================================
// 6. AI INTELLIGENCE & PRICING ASSISTANT
// ==========================================

// AI Pricing suggestion for merchants
app.post('/api/ai/suggest-price', async (req: Request, res: Response) => {
  const {
    productName,
    category,
    originalPrice,
    quantity,
    daysRemaining,
    expirationDate,
    pickupDeadline,
  } = req.body;

  if (!productName || !originalPrice || originalPrice <= 0) {
    return res.status(400).json({ error: 'Faltan datos del producto para calcular el precio.' });
  }

  const origPrice = Number(originalPrice);
  const qty = Number(quantity || 10);
  const days = Number(daysRemaining !== undefined ? daysRemaining : 2);

  // Fallback heuristic pricing calculation
  const calculateHeuristic = () => {
    let discount = 35;
    const reasons: string[] = [];

    if (days <= 0) {
      discount = 60;
      reasons.push('El producto vence hoy y requiere liquidación inmediata.');
    } else if (days === 1) {
      discount = 50;
      reasons.push('El producto vence en las próximas 24 horas.');
    } else if (days === 2) {
      discount = 40;
      reasons.push('Vence en 2 días, ventana óptima para consumo rápido.');
    } else if (days <= 4) {
      discount = 30;
      reasons.push('Margen de 3 a 4 días; incentiva compras familiares planificadas.');
    } else {
      discount = 25;
      reasons.push('Vencimiento holgado; descuento promocional preventivo.');
    }

    if (qty >= 25) {
      discount = Math.min(70, discount + 10);
      reasons.push(`Existe stock elevado (${qty} u.), se sugiere mayor descuento para acelerar rotación.`);
    } else if (qty <= 5) {
      reasons.push(`Stock bajo (${qty} u.), se preserva mayor margen comercial.`);
    }

    if (category === 'Comidas Preparadas' || category === 'Panadería y Repostería') {
      reasons.push(`Productos de categoría "${category}" tienen pico de demanda durante la tarde.`);
    } else {
      reasons.push('Precios de alimentos similares mostraron un 92% de efectividad de retiro.');
    }

    const suggestedPrice = Math.round(origPrice * (1 - discount / 100));
    return {
      suggestedPrice,
      suggestedDiscountPercent: discount,
      reasons,
      priority: days <= 1 ? ('alta' as const) : days <= 3 ? ('media' as const) : ('baja' as const),
      explanation: `Precio sugerido: $${suggestedPrice.toLocaleString('es-AR')} (${discount}% OFF). Basado en ${days} días restantes y ${qty} unidades en stock.`,
    };
  };

  if (!ai) {
    return res.json(calculateHeuristic());
  }

  try {
    const prompt = `Actúa como el motor de Inteligencia Artificial de "Reaprovecha", la plataforma sustentable que ayuda a comercios a definir precios para sus excedentes y alimentos próximos a vencer.
Analiza los siguientes datos del producto:
- Nombre: ${productName}
- Categoría: ${category || 'General'}
- Precio original: $${origPrice}
- Cantidad disponible: ${qty} unidades
- Días restantes hasta vencimiento: ${days} días (${expirationDate || 'próximo'})
- Horario límite de retiro: ${pickupDeadline || 'Durante el día'}

Toma en cuenta:
1. Tiempo restante hasta el vencimiento.
2. Cantidad disponible en stock.
3. Categoría del producto y sensibilidad a perecibilidad.
4. Horarios y demanda histórica estimada para alimentos de rescate.

Genera una sugerencia de precio razonable y redondeado, el porcentaje de descuento sugerido (entre 20% y 70%), una lista de 3 a 4 motivos concretos y explicativos (ej: "El producto vence hoy.", "Existe stock elevado de 30 unidades.", "Productos similares tuvieron mayor demanda durante la tarde."), y la prioridad ("alta", "media", "baja").`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPrice: {
              type: Type.NUMBER,
              description: 'Precio sugerido redondeado en pesos argentinos',
            },
            suggestedDiscountPercent: {
              type: Type.NUMBER,
              description: 'Porcentaje de descuento recomendado (entre 20 y 70)',
            },
            reasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 o 4 motivos puntuales y concretos que explican el precio sugerido',
            },
            priority: {
              type: Type.STRING,
              description: '"alta", "media" o "baja"',
            },
            explanation: {
              type: Type.STRING,
              description: 'Breve párrafo explicativo para el comerciante',
            },
          },
          required: ['suggestedPrice', 'suggestedDiscountPercent', 'reasons', 'priority', 'explanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const discount = Number(parsed.suggestedDiscountPercent) || 35;
    const finalPrice =
      Number(parsed.suggestedPrice) || Math.round(origPrice * (1 - discount / 100));

    let cleanPriority: 'alta' | 'media' | 'baja' = 'media';
    if (parsed.priority?.toLowerCase().includes('alta')) cleanPriority = 'alta';
    else if (parsed.priority?.toLowerCase().includes('baja')) cleanPriority = 'baja';

    return res.json({
      suggestedPrice: finalPrice,
      suggestedDiscountPercent: discount,
      reasons: parsed.reasons && parsed.reasons.length > 0 ? parsed.reasons : calculateHeuristic().reasons,
      priority: cleanPriority,
      explanation: parsed.explanation || `Precio sugerido: $${finalPrice.toLocaleString('es-AR')}`,
    });
  } catch (err: any) {
    console.error('Gemini pricing suggestion error, using heuristic fallback:', err?.message);
    return res.json(calculateHeuristic());
  }
});

// Urgency analysis for products
app.post('/api/ai/analyze-urgency', async (req: Request, res: Response) => {
  const { productName, category, daysRemaining, quantity, originalPrice, discountPercent } = req.body;

  const days = Number(daysRemaining || 2);
  const qty = Number(quantity || 10);
  const origPrice = Number(originalPrice || 2000);

  let priority: 'alta' | 'media' | 'baja' = days <= 2 ? 'alta' : days <= 4 ? 'media' : 'baja';
  let suggestedDiscount = days <= 1 ? 50 : days <= 2 ? 40 : days <= 4 ? 30 : 20;

  const explanation =
    priority === 'alta'
      ? `Este producto vence en ${days} día${days === 1 ? '' : 's'} y tiene ${qty} unidades disponibles. Se recomienda darle prioridad para acelerar su venta y evitar pérdidas.`
      : priority === 'media'
      ? `Vence en ${days} días con ${qty} unidades. Ritmo de salida moderado sugerido para evitar acumulación.`
      : `Vence en ${days} días con ${qty} unidades. Margen holgado que permite rotación constante.`;

  return res.json({
    priority,
    priorityLabel:
      priority === 'alta' ? 'Prioridad alta' : priority === 'media' ? 'Prioridad media' : 'Prioridad baja',
    explanation,
    suggestedDiscountPercent: suggestedDiscount,
    suggestedPrice: Math.round(origPrice * (1 - suggestedDiscount / 100)),
  });
});

// Reset demo database to initial state
app.post('/api/seed/reset', async (_req: Request, res: Response) => {
  try {
    await cloudSqlRepo.resetToInitialSeed();
    res.json({ success: true, message: 'Base de datos en Cloud SQL reiniciada con éxito con los datos reales.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al reiniciar la base de datos.' });
  }
});

// Database Schema SQL Download / View
app.get('/api/database/schema.sql', (_req: Request, res: Response) => {
  const schemaPath = path.resolve(__dirname, 'database', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="reaprovecha_schema.sql"');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    return res.send(content);
  }
  return res.status(404).json({ error: 'Archivo schema.sql no encontrado.' });
});

// Database Status & Diagnostics for PostgreSQL / Relational DB
app.get('/api/database/status', async (_req: Request, res: Response) => {
  const isPgConfigured = !!(
    (process.env.SQL_HOST && process.env.SQL_DB_NAME && process.env.SQL_USER) ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL
  );

  let pgConnected = false;
  let pgError: string | null = null;

  if (isPgConfigured) {
    try {
      await cloudSqlRepo.getUsers();
      pgConnected = true;
    } catch (err: any) {
      pgError = err?.message || 'Error al conectar con PostgreSQL';
    }
  }

  const products = await cloudSqlRepo.getProducts();
  const merchants = await cloudSqlRepo.getMerchants();
  const users = await cloudSqlRepo.getUsers();

  res.json({
    engine: pgConnected ? 'PostgreSQL (Neon Cloud DB - odd-frost)' : 'Motor Relacional Local Persistente (Tandil DB)',
    isPostgresConfigured: isPgConfigured,
    isPostgresConnected: pgConnected,
    connectionError: pgError,
    config: {
      host: process.env.DATABASE_URL ? 'ep-summer-resonance-b5x41gp5-pooler.c-7.us-east-2.aws.neon.tech' : (process.env.SQL_HOST || 'No configurado'),
      database: process.env.DATABASE_URL ? 'neondb' : (process.env.SQL_DB_NAME || 'reaprovecha_db'),
      user: process.env.DATABASE_URL ? 'neondb_owner' : (process.env.SQL_USER || 'postgres'),
      port: 5432,
    },
    tables: [
      'usuarios',
      'comercios',
      'categorias_producto',
      'productos',
      'reservas',
      'detalle_reserva',
      'impacto_ambiental',
      'historial_stock',
    ],
    schemaSqlAvailable: fs.existsSync(path.resolve(__dirname, 'database', 'schema.sql')),
    totalProducts: products.length,
    totalMerchants: merchants.length,
    totalUsers: users.length,
  });
});

// Setup Vite middlewares in dev or static files in production
async function startServer() {
  // Initialize Cloud SQL PostgreSQL with schema check & seed if empty
  await cloudSqlRepo.initialize();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server "reaprovecha" listening on port ${PORT} connected to Cloud SQL PostgreSQL`);
  });
}

startServer();
