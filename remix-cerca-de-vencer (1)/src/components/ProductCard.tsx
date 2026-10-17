import React from 'react';
import { Product, normalizeProductStatus } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatExpirationDate, formatDistance } from '../utils/date';
import { Clock, MapPin, Sparkles, Store, Flame, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openReservationModal } = useApp();

  const normalizedStatus = normalizeProductStatus(product.estado);
  const isAvailable = normalizedStatus === 'disponible' && product.cantidad_disponible > 0;
  const isReserved = normalizedStatus === 'reservado' || (normalizedStatus === 'disponible' && product.cantidad_disponible <= 0);
  const isSold = normalizedStatus === 'vendido';
  const isRetired = normalizedStatus === 'retirado';
  const isReservable = isAvailable;

  const isVeryUrgent = product.dias_restantes <= 1;
  const isUrgent = product.dias_restantes <= 2;
  const isLowStock = product.cantidad_disponible <= 5 && product.cantidad_disponible > 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Product Image and Overlay Tags */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={product.imagen}
          alt={product.nombre}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* State or Discount Badge */}
        {isReserved ? (
          <div className="absolute top-3 left-3 bg-amber-500 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1">
            <span>Reservado</span>
          </div>
        ) : isSold ? (
          <div className="absolute top-3 left-3 bg-slate-700 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1">
            <span>Vendido</span>
          </div>
        ) : isRetired ? (
          <div className="absolute top-3 left-3 bg-rose-700 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1">
            <span>Retirado</span>
          </div>
        ) : (
          <div className="absolute top-3 left-3 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1">
            <span>{product.porcentaje_descuento}% OFF</span>
          </div>
        )}

        {/* Expiration Badge */}
        <div
          className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-md shadow-xs flex items-center gap-1.5 ${
            isVeryUrgent
              ? 'bg-rose-600 text-white animate-pulse'
              : isUrgent
              ? 'bg-amber-500 text-white'
              : 'bg-gray-900/80 text-white'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>
            {product.dias_restantes === 0
              ? 'Vence hoy'
              : product.dias_restantes === 1
              ? 'Vence mañana'
              : `${product.dias_restantes} días`}
          </span>
        </div>

        {/* Approximate distance badge */}
        {product.comercio?.distancia_km !== undefined && (
          <div className="absolute bottom-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>a {formatDistance(product.comercio.distancia_km)}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Category & Commerce */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
              {product.categoria}
            </span>
            <span className="text-[11px] text-gray-500">
              Vence: <strong>{formatExpirationDate(product.fecha_vencimiento)}</strong>
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
            {product.nombre}
          </h3>

          {/* Reason for offer / Motivo */}
          {product.motivo_oferta && (
            <div className="pt-0.5">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 max-w-full"
                title={product.motivo_detalle || product.motivo_oferta}
              >
                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">{product.motivo_oferta}</span>
              </span>
            </div>
          )}

          {/* Provider Name & Location */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 pt-0.5">
            <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium text-gray-800 truncate">
              {product.comercio?.nombre || 'Proveedor de Tandil'}
            </span>
          </div>

          {/* Pricing Row: Precio Original tachado + Precio Reaprovecha */}
          <div className="pt-2 flex items-baseline gap-2.5">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              {formatCurrency(product.precio_reaprovecha)}
            </span>
            <span className="text-sm font-medium text-gray-400 line-through">
              {formatCurrency(product.precio_original)}
            </span>
          </div>

          {/* Stock & Pickup Deadline Details */}
          <div className="pt-2 border-t border-gray-100 text-xs space-y-1.5 text-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">
                {isReservable ? 'Unidades disponibles:' : 'Estado actual:'}
              </span>
              {isAvailable ? (
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    isLowStock
                      ? 'bg-rose-100 text-rose-700 font-extrabold animate-pulse'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {product.cantidad_disponible} disponibles
                </span>
              ) : isReserved ? (
                <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-amber-100 text-amber-800">
                  Reservado (0 disp.)
                </span>
              ) : isSold ? (
                <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-800">
                  Vendido
                </span>
              ) : (
                <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-rose-100 text-rose-800">
                  Retirado
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-gray-500 text-[11px]">
              <span>Horario límite de retiro:</span>
              <span className="font-semibold text-gray-800">
                {product.hora_limite_retiro || 'Durante el día'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Reservar / Reservado / Vendido / Retirado */}
        <div>
          {isReservable ? (
            <button
              onClick={() => openReservationModal(product)}
              className="w-full py-3 px-4 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              Reservar
            </button>
          ) : isReserved ? (
            <button
              disabled
              className="w-full py-3 px-4 rounded-2xl font-bold text-sm bg-amber-100 text-amber-800 border border-amber-200/80 cursor-not-allowed flex items-center justify-center gap-2 shadow-none"
            >
              <span>Reservado</span>
            </button>
          ) : isSold ? (
            <button
              disabled
              className="w-full py-3 px-4 rounded-2xl font-bold text-sm bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed flex items-center justify-center gap-2 shadow-none"
            >
              <span>Vendido</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 px-4 rounded-2xl font-bold text-sm bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed flex items-center justify-center gap-2 shadow-none"
            >
              <span>Retirado</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
