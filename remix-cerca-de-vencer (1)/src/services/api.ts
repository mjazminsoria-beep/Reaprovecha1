import {
  User,
  Merchant,
  Product,
  Reservation,
  GlobalImpactStats,
  UserPersonalImpact,
  ProductFilters,
  AIPricingSuggestion,
} from '../types';

export const apiClient = {
  // Auth
  async register(data: {
    nombre: string;
    email: string;
    password: string;
    tipo_usuario: 'consumidor' | 'comercio';
    telefono?: string;
    ciudad?: string;
    nombre_comercio?: string;
    direccion?: string;
    categoria?: string;
  }): Promise<{ user: User; merchant?: Merchant }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al registrar usuario');
    return json;
  },

  async login(email: string, password: string): Promise<{ user: User; merchant?: Merchant }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Credenciales inválidas');
    return json;
  },

  async getDemoUsers(): Promise<{ consumers: User[]; merchants: any[] }> {
    const res = await fetch('/api/auth/demo-users');
    if (!res.ok) throw new Error('Error al cargar usuarios de prueba');
    return res.json();
  },

  // Merchants
  async getMerchants(): Promise<Merchant[]> {
    const res = await fetch('/api/merchants');
    if (!res.ok) throw new Error('Error al obtener comercios');
    return res.json();
  },

  async getMerchant(id: string): Promise<Merchant> {
    const res = await fetch(`/api/merchants/${id}`);
    if (!res.ok) throw new Error('Error al obtener comercio');
    return res.json();
  },

  async getMerchantByUserId(userId: string): Promise<Merchant> {
    const res = await fetch(`/api/merchants/user/${userId}`);
    if (!res.ok) throw new Error('Comercio no encontrado');
    return res.json();
  },

  async updateMerchant(id: string, updates: Partial<Merchant>): Promise<Merchant> {
    const res = await fetch(`/api/merchants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar comercio');
    return json;
  },

  async getMerchantStats(id: string) {
    const res = await fetch(`/api/merchants/${id}/stats`);
    if (!res.ok) throw new Error('Error al cargar estadísticas');
    return res.json();
  },

  // Products & Search Filters
  async getProducts(filters?: Partial<ProductFilters>): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters?.searchQuery) params.set('q', filters.searchQuery);
    if (filters?.category && filters.category !== 'Todas') params.set('category', filters.category);
    if (filters?.merchantId && filters.merchantId !== 'Todos') params.set('merchantId', filters.merchantId);
    if (filters?.maxDistanceKm) params.set('maxDistance', String(filters.maxDistanceKm));
    if (filters?.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    if (filters?.minDiscountPercent) params.set('minDiscount', String(filters.minDiscountPercent));
    if (filters?.pickupTodayOnly) params.set('pickupToday', 'true');
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);

    const res = await fetch(`/api/products?${params.toString()}`);
    if (!res.ok) throw new Error('Error al consultar productos');
    return res.json();
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Producto no encontrado');
    return res.json();
  },

  async createProduct(data: any): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al publicar producto');
    return json;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al editar producto');
    return json;
  },

  async setProductStatus(id: string, estado: Product['estado']): Promise<void> {
    const res = await fetch(`/api/products/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) throw new Error('Error al actualizar estado del producto');
  },

  async updateProductStock(id: string, stock: number): Promise<void> {
    const res = await fetch(`/api/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    });
    if (!res.ok) throw new Error('Error al actualizar stock');
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar producto');
  },

  // Reservations
  async createReservation(data: {
    usuario_id: string;
    producto_id: string;
    cantidad: number;
    cliente_nombre?: string;
    cliente_telefono?: string;
    cliente_email?: string;
  }): Promise<{ success: boolean; reservation: Reservation; message: string }> {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear la reserva');
    return json;
  },

  async getUserReservations(userId: string): Promise<Reservation[]> {
    const res = await fetch(`/api/reservations/user/${userId}`);
    if (!res.ok) throw new Error('Error al cargar reservas de usuario');
    return res.json();
  },

  async getReservationsByIds(ids: string[]): Promise<Reservation[]> {
    if (!ids || ids.length === 0) return [];
    const res = await fetch(`/api/reservations/by-ids?ids=${encodeURIComponent(ids.join(','))}`);
    if (!res.ok) throw new Error('Error al cargar reservas');
    return res.json();
  },

  async getMerchantReservations(merchantId: string): Promise<Reservation[]> {
    const res = await fetch(`/api/reservations/merchant/${merchantId}`);
    if (!res.ok) throw new Error('Error al cargar reservas del comercio');
    return res.json();
  },

  async updateReservationStatus(
    id: string,
    estado: Reservation['estado']
  ): Promise<void> {
    const res = await fetch(`/api/reservations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) throw new Error('Error al actualizar estado de la reserva');
  },

  // Impact
  async getGlobalImpact(): Promise<GlobalImpactStats> {
    const res = await fetch('/api/impact/global');
    if (!res.ok) throw new Error('Error al cargar impacto global');
    return res.json();
  },

  async getUserImpact(userId: string): Promise<UserPersonalImpact> {
    const res = await fetch(`/api/impact/user/${userId}`);
    if (!res.ok) throw new Error('Error al cargar impacto personal');
    return res.json();
  },

  // AI Assistant
  async suggestPricingWithAI(data: {
    productName: string;
    category: string;
    originalPrice: number;
    quantity: number;
    daysRemaining: number;
    expirationDate?: string;
    pickupDeadline?: string;
  }): Promise<AIPricingSuggestion> {
    const res = await fetch('/api/ai/suggest-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al obtener sugerencia de precio con IA');
    return json;
  },

  async analyzeUrgencyWithAI(data: {
    productName: string;
    category: string;
    daysRemaining: number;
    quantity: number;
    originalPrice: number;
  }): Promise<any> {
    const res = await fetch('/api/ai/analyze-urgency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async resetSeedDatabase(): Promise<void> {
    await fetch('/api/seed/reset', { method: 'POST' });
  },
};
