import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatExpirationDate } from '../utils/date';
import {
  X,
  CheckCircle2,
  MapPin,
  Clock,
  Phone,
  User,
  ShoppingBag,
  Store,
  AlertCircle,
  ShieldCheck,
  Package,
  Calendar,
  Sparkles,
  Lock,
} from 'lucide-react';

export const ReservationModal: React.FC = () => {
  const {
    activeReservationProduct,
    closeReservationModal,
    createReservation,
    setCurrentView,
    openAuthModal,
  } = useApp();
  const { currentUser } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState(currentUser?.nombre || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.telefono || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success state
  const [createdReservation, setCreatedReservation] = useState<any | null>(null);

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.nombre || '');
      setCustomerPhone(currentUser.telefono || '');
      setCustomerEmail(currentUser.email || '');
    }
  }, [currentUser]);

  if (!activeReservationProduct) return null;

  const product = activeReservationProduct;
  const maxStock = product.cantidad_disponible;
  const unitPrice = product.precio_reaprovecha;
  const totalPrice = unitPrice * quantity;
  const totalSavings = (product.precio_original - product.precio_reaprovecha) * quantity;

  const handleClose = () => {
    setCreatedReservation(null);
    setQuantity(1);
    setErrorMessage('');
    closeReservationModal();
  };

  // 1. Mandatory Login Guard: If user is not logged in, show mandatory identification alert modal
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 relative animate-fadeIn p-6 sm:p-8 text-center space-y-6">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-10 h-10 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
              Identificación requerida
            </div>
            <h2 className="text-2xl font-black text-gray-900">
              ¡Tenés que ingresar para reservar!
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Para poder reservar alimentos y asegurar tu pedido en los comercios de Tandil, es obligatorio iniciar sesión con tu cuenta de consumidor o crear una nueva.
            </p>
          </div>

          {/* Product preview */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-left">
            <img
              src={product.imagen}
              alt={product.nombre}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-emerald-200"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-gray-900 truncate">{product.nombre}</h4>
              <p className="text-xs text-gray-600 truncate">{product.comercio?.nombre || 'Comercio asociado'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(product.precio_reaprovecha)}
                </span>
                <span className="text-[11px] text-gray-400 line-through">
                  {formatCurrency(product.precio_original)}
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                  {product.porcentaje_descuento}% OFF
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => {
                closeReservationModal();
                openAuthModal('login');
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>

            <button
              onClick={() => {
                closeReservationModal();
                openAuthModal('register-consumer');
              }}
              className="w-full py-3 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm transition-colors cursor-pointer"
            >
              Registrarme como Consumidor
            </button>

            <button
              onClick={handleClose}
              className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Cancelar y volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) {
      setErrorMessage('Debes iniciar sesión para realizar una reserva.');
      return;
    }

    if (quantity < 1 || quantity > maxStock) {
      setErrorMessage(`La cantidad debe ser entre 1 y ${maxStock}.`);
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Por favor ingresá tu nombre completo para el retiro.');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Por favor ingresá un teléfono o WhatsApp de contacto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createReservation({
        productId: product.id,
        quantity,
        cliente_nombre: customerName.trim(),
        cliente_telefono: customerPhone.trim(),
        cliente_email: currentUser.email || customerEmail.trim() || undefined,
      });

      if (res.success && res.reservation) {
        setCreatedReservation(res.reservation);
      } else {
        setErrorMessage(res.message || 'No se pudo completar la reserva.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error al procesar tu reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {createdReservation ? (
          /* Confirmation Screen */
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-18 h-18 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                Código único de retiro
              </div>
              <div className="text-3xl font-black font-mono tracking-wider text-gray-900">
                {createdReservation.id}
              </div>
              <h2 className="text-2xl font-black text-gray-900">
                ¡Reserva confirmada con éxito!
              </h2>
              <p className="text-xs text-gray-600">
                Guardá este código o mencionalo al presentarte en el local para retirar tu pedido.
              </p>
            </div>

            {/* Summary Ticket */}
            <div className="bg-gray-50 rounded-2xl p-5 text-left text-xs space-y-3 border border-gray-200">
              <div className="flex justify-between items-start pb-2 border-b border-gray-200">
                <div>
                  <div className="font-extrabold text-sm text-gray-900">
                    {createdReservation.comercio_nombre}
                  </div>
                  <div className="text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{createdReservation.comercio_direccion}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  Pendiente de retiro
                </span>
              </div>

              <div className="space-y-1.5 text-gray-700">
                <div className="flex justify-between">
                  <span>Alimento:</span>
                  <strong className="text-gray-900">{product.nombre}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Cantidad:</span>
                  <strong className="text-gray-900">{quantity} unidades</strong>
                </div>
                <div className="flex justify-between">
                  <span>Horario límite de retiro:</span>
                  <strong className="text-rose-700 font-bold">
                    {product.hora_limite_retiro || 'Hoy'}
                  </strong>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-sm font-bold text-gray-800">Total a pagar en el local:</span>
                  <strong className="text-lg font-black text-emerald-700">
                    {formatCurrency(totalPrice)}
                  </strong>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold text-[11px]">
                  <span>Ahorraste en esta compra:</span>
                  <span>{formatCurrency(totalSavings)} ({product.porcentaje_descuento}% OFF)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  handleClose();
                  setCurrentView('mis-reservas');
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                Ver en "Mis Reservas"
              </button>

              <button
                onClick={handleClose}
                className="w-full py-2.5 px-4 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Seguir explorando alimentos
              </button>
            </div>
          </div>
        ) : (
          /* Form to Select Quantity and Submit */
          <div>
            {/* Header banner with product preview */}
            <div className="relative h-44 bg-gray-100 overflow-hidden">
              <img
                src={product.imagen}
                alt={product.nombre}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/80">
                  {product.categoria}
                </span>
                <h3 className="text-lg font-black mt-1 line-clamp-1">{product.nombre}</h3>
                <div className="flex items-center gap-3 text-xs text-white/90 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    Vence en {product.dias_restantes} días (
                    {formatExpirationDate(product.fecha_vencimiento)})
                  </span>
                  <span className="bg-rose-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded">
                    {product.porcentaje_descuento}% OFF
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmReservation} className="p-6 space-y-4">
              {/* Authenticated user indicator badge */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex items-center justify-between text-emerald-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Reserva a nombre de: <strong>{currentUser.nombre}</strong></span>
                </div>
                <span className="text-[11px] text-emerald-700 font-mono hidden sm:inline">{currentUser.email}</span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Quantity Stepper (1 to available stock) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Cantidad a reservar *</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    Stock disponible: <strong>{maxStock} u.</strong>
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-800 font-bold text-lg flex items-center justify-center transition-colors cursor-pointer"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={maxStock}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.min(maxStock, Math.max(1, val)));
                    }}
                    className="w-20 text-center py-2 rounded-xl border border-gray-200 font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    disabled={quantity >= maxStock}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-800 font-bold text-lg flex items-center justify-center transition-colors cursor-pointer"
                  >
                    +
                  </button>

                  <div className="ml-auto text-right">
                    <span className="text-xs text-gray-400">Total a pagar:</span>
                    <div className="text-xl font-black text-emerald-700">
                      {formatCurrency(totalPrice)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nombre de quien retira *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre y apellido"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Teléfono / WhatsApp de contacto *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="Ej. +54 9 249 455-6677"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Motivo de la oferta y garantía de inocuidad */}
              {product.motivo_oferta && (
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Motivo de la oferta: {product.motivo_oferta}</span>
                  </div>
                  {product.motivo_detalle && (
                    <p className="text-[11px] text-amber-800 leading-relaxed pl-5">
                      {product.motivo_detalle}
                    </p>
                  )}
                </div>
              )}

              {/* Commerce & Deadline Info */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1 text-gray-600">
                <div className="flex items-start gap-1.5">
                  <Store className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-800">
                      {product.comercio?.nombre || 'Proveedor asociado'}:{' '}
                    </span>
                    <span>{product.comercio?.direccion || 'Dirección de retiro'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 pl-5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Horario límite: <strong>{product.hora_limite_retiro || 'Hoy'}</strong></span>
                </div>
              </div>

              {/* CTA button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/20 transition-all hover:scale-101 active:scale-99 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{isSubmitting ? 'Procesando reserva...' : 'Confirmar Reserva'}</span>
                </button>
                <p className="text-center text-[11px] text-gray-400 mt-2">
                  No requiere tarjeta. Pagás directamente en el local al retirar.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
