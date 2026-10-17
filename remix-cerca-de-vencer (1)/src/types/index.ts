export type UserRole = 'consumidor' | 'comercio';

export type PriorityLevel = 'alta' | 'media' | 'baja';

export type ProductCategory =
  | 'Lácteos'
  | 'Panadería y Repostería'
  | 'Carnes y Embutidos'
  | 'Frutas y Verduras'
  | 'Almacén y Pastas'
  | 'Bebidas y Jugos'
  | 'Comidas Preparadas'
  | 'Otro';

export type MerchantCategory =
  | 'Supermercado y Almacén'
  | 'Panadería y Pastelería'
  | 'Lácteos y Quesería'
  | 'Verdulería y Frutería'
  | 'Carnicería y Granja'
  | 'Restaurante y Café'
  | 'Fábrica de Pastas'
  | 'Otro';

export type ReservationStatus =
  | 'pendiente'
  | 'confirmada'
  | 'lista_para_retirar'
  | 'retirada'
  | 'cancelada';

export type ProductStatus =
  | 'disponible'
  | 'reservado'
  | 'vendido'
  | 'retirado'
  | 'activo'
  | 'pausado'
  | 'agotado'
  | 'eliminado';

export function normalizeProductStatus(
  status?: string
): 'disponible' | 'reservado' | 'vendido' | 'retirado' {
  if (!status) return 'disponible';
  const s = status.toLowerCase();
  if (s === 'reservado' || s === 'agotado') return 'reservado';
  if (s === 'vendido') return 'vendido';
  if (s === 'retirado' || s === 'eliminado' || s === 'pausado') return 'retirado';
  return 'disponible';
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  contraseña_hash?: string;
  telefono?: string;
  tipo_usuario: UserRole;
  ciudad?: string;
  fecha_creacion: string;
}

export interface Merchant {
  id: string;
  usuario_id: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  categoria: MerchantCategory;
  horario_apertura: string;
  horario_cierre: string;
  telefono: string;
  fecha_creacion: string;
}

export interface Product {
  id: string;
  comercio_id: string;
  nombre: string;
  descripcion: string;
  categoria: ProductCategory;
  imagen: string;
  precio_original: number;
  precio_reaprovecha: number;
  porcentaje_descuento: number;
  cantidad_disponible: number;
  cantidad_inicial: number;
  fecha_vencimiento: string; // YYYY-MM-DD
  hora_limite_retiro: string; // e.g. "19:30" or "Hoy hasta las 20:00"
  dias_restantes: number;
  estado: ProductStatus;
  peso_estimado_kg: number;
  fecha_creacion: string;
  motivo_oferta?: string; // e.g. "Próximo a vencer", "Baja rotación", "Envase dañado (alimento 100% apto)", etc.
  motivo_detalle?: string; // Descriptive detail explaining aesthetic/commercial condition
  // Joined merchant info for frontend display
  comercio?: {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    categoria: string;
    telefono: string;
    latitud: number;
    longitud: number;
    horario_apertura: string;
    horario_cierre: string;
    distancia_km?: number;
  };
  // AI recommendations
  aiPriority?: PriorityLevel;
  aiPriorityLabel?: string;
  aiExplanation?: string;
  aiSuggestedPrice?: number;
}

export interface ReservationDetail {
  id: string;
  reserva_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto_nombre?: string;
  producto_imagen?: string;
}

export interface Reservation {
  id: string; // Código de reserva ej. REP-5921
  usuario_id: string;
  comercio_id: string;
  fecha: string;
  total: number;
  ahorro_total: number;
  estado: ReservationStatus;
  fecha_creacion: string;
  // Joined info
  comercio_nombre?: string;
  comercio_direccion?: string;
  comercio_telefono?: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  hora_limite_retiro?: string;
  items: ReservationDetail[];
}

export interface ImpactRecord {
  id: string;
  usuario_id: string;
  reserva_id: string;
  cantidad_alimentos: number;
  peso_kg: number;
  ahorro_usuario: number;
  impacto_ambiental_estimado: number; // kg CO2 eq evitado
  fecha: string;
}

export interface GlobalImpactStats {
  kilos_recuperados: number;
  productos_recuperados: number;
  dinero_ahorrado: number;
  comercios_participantes: number;
  reservas_realizadas: number;
  co2_evitado_kg: number;
}

export interface UserPersonalImpact {
  kilos_recuperados: number;
  productos_recuperados: number;
  dinero_ahorrado: number;
  reservas_realizadas: number;
  co2_evitado_kg: number;
  compras_count: number;
}

export interface ProductFilters {
  searchQuery: string;
  category: string;
  merchantId: string;
  maxDistanceKm: number;
  maxPrice: number;
  minDiscountPercent: number;
  pickupTodayOnly: boolean;
  sortBy: 'cercanos' | 'descuento' | 'precio_menor' | 'recientes';
}

export interface AIPricingSuggestion {
  suggestedPrice: number;
  suggestedDiscountPercent: number;
  reasons: string[];
  priority: PriorityLevel;
  explanation: string;
}
