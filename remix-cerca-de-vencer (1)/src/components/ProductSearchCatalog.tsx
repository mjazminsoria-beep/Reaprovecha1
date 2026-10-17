import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { ProductCategory, normalizeProductStatus } from '../types';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Clock,
  TrendingDown,
  DollarSign,
  Store,
  Filter,
  RefreshCw,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';

const CATEGORIES: ('Todas' | ProductCategory)[] = [
  'Todas',
  'Lácteos',
  'Panadería y Repostería',
  'Carnes y Embutidos',
  'Frutas y Verduras',
  'Almacén y Pastas',
  'Bebidas y Jugos',
  'Comidas Preparadas',
];

export const ProductSearchCatalog: React.FC = () => {
  const { products, merchants, filters, updateFilter, resetFilters, isLoadingProducts } = useApp();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'disponibles' | 'reservados'>('todos');

  const disponiblesCount = products.filter(
    (p) => normalizeProductStatus(p.estado) === 'disponible' && p.cantidad_disponible > 0
  ).length;
  const reservadosCount = products.filter(
    (p) => normalizeProductStatus(p.estado) === 'reservado' || p.cantidad_disponible <= 0
  ).length;

  const displayedProducts = products.filter((p) => {
    const norm = normalizeProductStatus(p.estado);
    const isAvail = norm === 'disponible' && p.cantidad_disponible > 0;
    if (statusFilter === 'disponibles') return isAvail;
    if (statusFilter === 'reservados') return !isAvail;
    return true;
  });

  return (
    <div className="space-y-8 py-6">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-700/60">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>Alimentos geolocalizados en Tandil</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Encontrá productos cerca tuyo
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Filtrá por cercanía, proveedor, precio o descuento. Reservá online y retirá en el local antes del horario límite.
          </p>
        </div>
        <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Search and Quick Filters Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200 shadow-xs space-y-5">
        {/* Search bar & Sort dropdown */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search by product name */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              placeholder="Buscar por nombre de producto (ej. yogur, medialunas, ensalada, pan)..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50"
            />
            {filters.searchQuery && (
              <button
                onClick={() => updateFilter('searchQuery', '')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value as any)}
                className="py-3 px-4 pr-9 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
              >
                <option value="cercanos">Ordenar: Más cercanos</option>
                <option value="descuento">Ordenar: Mayor descuento</option>
                <option value="precio_menor">Ordenar: Menor precio</option>
                <option value="recientes">Ordenar: Más recientes</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Toggle advanced filters button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                showAdvancedFilters
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros {showAdvancedFilters ? '▲' : '▼'}</span>
            </button>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter('category', cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filters.category === cat
                  ? 'bg-emerald-600 text-white shadow-xs scale-102'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Advanced Filters Panel (Distance, Merchant, Price, Min Discount, Retiro hoy) */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn text-xs">
            {/* Filter by Merchant / Provider */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                Filtro por proveedor
              </label>
              <select
                value={filters.merchantId}
                onChange={(e) => updateFilter('merchantId', e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Todos">Todos los proveedores</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.ciudad.split(',')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Distance */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Filtro por distancia máxima
              </label>
              <select
                value={filters.maxDistanceKm}
                onChange={(e) => updateFilter('maxDistanceKm', Number(e.target.value))}
                className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={15}>Cualquier distancia (hasta 15 km)</option>
                <option value={1}>Hasta 1 km (caminando)</option>
                <option value={3}>Hasta 3 km (en bicicleta)</option>
                <option value={5}>Hasta 5 km</option>
                <option value={10}>Hasta 10 km</option>
              </select>
            </div>

            {/* Filter by Min Discount */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                Descuento mínimo %
              </label>
              <select
                value={filters.minDiscountPercent}
                onChange={(e) => updateFilter('minDiscountPercent', Number(e.target.value))}
                className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={0}>Todos los descuentos</option>
                <option value={20}>Al menos 20% OFF</option>
                <option value={30}>Al menos 30% OFF</option>
                <option value={40}>Al menos 40% OFF</option>
                <option value={50}>Al menos 50% OFF (Super rebaja)</option>
              </select>
            </div>

            {/* Filter: Retiro hoy */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => updateFilter('pickupTodayOnly', !filters.pickupTodayOnly)}
                className={`py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  filters.pickupTodayOnly
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Solo retiro hoy</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Header and status filter pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 text-sm text-gray-600">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'todos'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('disponibles')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'disponibles'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Disponibles ({disponiblesCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('reservados')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'reservados'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300" />
              <span>Reservados ({reservadosCount})</span>
            </button>
          </div>

          {filters.pickupTodayOnly && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
              Retiro hoy
            </span>
          )}
        </div>

        {(filters.searchQuery ||
          filters.category !== 'Todas' ||
          filters.merchantId !== 'Todos' ||
          filters.minDiscountPercent > 0 ||
          filters.pickupTodayOnly ||
          statusFilter !== 'todos') && (
          <button
            onClick={() => {
              resetFilters();
              setStatusFilter('todos');
            }}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
          >
            Limpiar todos los filtros
          </button>
        )}
      </div>

      {/* Products Grid */}
      {isLoadingProducts ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-600">Buscando alimentos en proveedores cercanos de Tandil...</p>
        </div>
      ) : displayedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="font-black text-xl text-gray-900">No encontramos productos con esos filtros</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Probá quitando el filtro de distancia o cambiando la categoría para encontrar más excedentes disponibles.
          </p>
          <button
            onClick={resetFilters}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Ver todos los productos disponibles
          </button>
        </div>
      )}
    </div>
  );
};
