import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ProductCategory, AIPricingSuggestion } from '../types';
import { getFutureDateString, calculateDaysRemaining, formatCurrency } from '../utils/date';
import { apiClient } from '../services/api';
import {
  X,
  Sparkles,
  CheckCircle2,
  Package,
  Calendar,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Flame,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Loader2,
  Check,
} from 'lucide-react';

const CATEGORIES: ProductCategory[] = [
  'Lácteos',
  'Panadería y Repostería',
  'Carnes y Embutidos',
  'Frutas y Verduras',
  'Almacén y Pastas',
  'Bebidas y Jugos',
  'Comidas Preparadas',
  'Otro',
];

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80';

export const ProductPublishModal: React.FC = () => {
  const { isPublishModalOpen, closePublishModal, productToEdit, saveProduct } = useApp();
  const { currentMerchant } = useAuth();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState<ProductCategory>('Lácteos');
  const [imagen, setImagen] = useState(DEFAULT_PRODUCT_IMAGE);
  const [precioOriginal, setPrecioOriginal] = useState(2500);
  const [precioReaprovecha, setPrecioReaprovecha] = useState(1500);
  const [cantidadDisponible, setCantidadDisponible] = useState(15);
  const [fechaVencimiento, setFechaVencimiento] = useState(getFutureDateString(2));
  const [horaLimiteRetiro, setHoraLimiteRetiro] = useState('Hoy hasta las 20:00 hs');
  const [pesoEstimadoKg, setPesoEstimadoKg] = useState(0.8);

  // AI Pricing Suggestion State
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIPricingSuggestion | null>(null);
  const [aiApplied, setAiApplied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setNombre(productToEdit.nombre);
      setDescripcion(productToEdit.descripcion || '');
      setCategoria(productToEdit.categoria);
      setImagen(productToEdit.imagen);
      setPrecioOriginal(productToEdit.precio_original);
      setPrecioReaprovecha(productToEdit.precio_reaprovecha);
      setCantidadDisponible(productToEdit.cantidad_disponible);
      setFechaVencimiento(productToEdit.fecha_vencimiento);
      setHoraLimiteRetiro(productToEdit.hora_limite_retiro);
      setPesoEstimadoKg(productToEdit.peso_estimado_kg || 0.5);
    } else {
      setNombre('');
      setDescripcion('');
      setCategoria('Lácteos');
      setImagen(DEFAULT_PRODUCT_IMAGE);
      setPrecioOriginal(2500);
      setPrecioReaprovecha(1500);
      setCantidadDisponible(15);
      setFechaVencimiento(getFutureDateString(2));
      setHoraLimiteRetiro('Hoy hasta las 20:00 hs');
      setPesoEstimadoKg(0.8);
      setAiSuggestion(null);
      setAiApplied(false);
    }
  }, [productToEdit, isPublishModalOpen]);

  if (!isPublishModalOpen) return null;

  const daysRemaining = calculateDaysRemaining(fechaVencimiento);
  const discountPercent = Math.max(
    0,
    Math.round(((precioOriginal - precioReaprovecha) / precioOriginal) * 100)
  );

  // Request AI Pricing Suggestion
  const handleRequestAIPricing = async () => {
    if (!nombre.trim() || precioOriginal <= 0) {
      setErrorMessage('Completá al menos el nombre y precio original del producto para que la IA pueda calcular la recomendación.');
      return;
    }
    setErrorMessage('');
    setIsLoadingAI(true);
    setAiApplied(false);

    try {
      const suggestion = await apiClient.suggestPricingWithAI({
        productName: nombre.trim(),
        category: categoria,
        originalPrice: precioOriginal,
        quantity: cantidadDisponible,
        daysRemaining,
        expirationDate: fechaVencimiento,
        pickupDeadline: horaLimiteRetiro,
      });
      setAiSuggestion(suggestion);
    } catch (err: any) {
      console.error('Error in AI Pricing:', err);
      setErrorMessage('No se pudo obtener la sugerencia de IA en este momento.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setPrecioReaprovecha(aiSuggestion.suggestedPrice);
      setAiApplied(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nombre.trim()) {
      setErrorMessage('El nombre del producto es obligatorio.');
      return;
    }

    if (precioOriginal <= 0 || precioReaprovecha <= 0) {
      setErrorMessage('Los precios deben ser mayores a $0.');
      return;
    }

    if (precioReaprovecha >= precioOriginal) {
      setErrorMessage('El precio Reaprovecha debe ser menor al precio original.');
      return;
    }

    if (cantidadDisponible <= 0) {
      setErrorMessage('La cantidad disponible debe ser al menos 1 unidad.');
      return;
    }

    setIsSubmitting(true);
    try {
      const merchantId = currentMerchant?.id || 'com-1';

      await saveProduct({
        comercio_id: merchantId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        categoria,
        imagen: imagen.trim() || DEFAULT_PRODUCT_IMAGE,
        precio_original: Number(precioOriginal),
        precio_reaprovecha: Number(precioReaprovecha),
        cantidad_disponible: Number(cantidadDisponible),
        fecha_vencimiento: fechaVencimiento,
        hora_limite_retiro: horaLimiteRetiro,
        peso_estimado_kg: Number(pesoEstimadoKg),
        aiPriority: aiSuggestion?.priority || (daysRemaining <= 2 ? 'alta' : 'media'),
        aiPriorityLabel:
          aiSuggestion?.priority === 'alta'
            ? 'Prioridad alta'
            : aiSuggestion?.priority === 'media'
            ? 'Prioridad media'
            : 'Prioridad baja',
        aiExplanation:
          aiSuggestion?.explanation ||
          `Vence en ${daysRemaining} días. Descuento del ${discountPercent}% aplicado.`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la publicación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 relative animate-fadeIn max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">
                {productToEdit ? 'Editar Producto / Excedente' : 'Publicar Producto o Excedente'}
              </h2>
              <p className="text-xs text-gray-500">
                {currentMerchant?.nombre || 'Proveedor adherido'}
              </p>
            </div>
          </div>
          <button
            onClick={closePublishModal}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nombre del alimento *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Medialunas de manteca artesanal x6"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as ProductCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Descripción o detalles del lote
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detallá el estado, si es excedente de horneada, lote próximo a vencer, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quantity, Expiration & Pickup Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Cantidad disponible *
              </label>
              <input
                type="number"
                min="1"
                required
                value={cantidadDisponible}
                onChange={(e) => setCantidadDisponible(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Vencimiento *</span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {daysRemaining <= 1 ? 'Vence pronto' : `${daysRemaining} días`}
                </span>
              </label>
              <input
                type="date"
                required
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Horario límite de retiro
              </label>
              <input
                type="text"
                value={horaLimiteRetiro}
                onChange={(e) => setHoraLimiteRetiro(e.target.value)}
                placeholder="Hoy hasta las 20:00 hs"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Pricing & AI Suggestion Module */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="font-extrabold text-sm">
                  Definición de Precios con Inteligencia Artificial
                </span>
              </div>

              <button
                type="button"
                onClick={handleRequestAIPricing}
                disabled={isLoadingAI}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoadingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculando con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sugerir precio óptimo</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Suggestion Box */}
            {aiSuggestion && (
              <div className="p-4 rounded-xl bg-white/10 border border-white/20 space-y-3 animate-fadeIn">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                      Recomendación de la IA:
                    </span>
                    <span className="text-xl font-black text-amber-300">
                      Precio sugerido: {formatCurrency(aiSuggestion.suggestedPrice)}
                    </span>
                    <span className="text-xs text-emerald-200 ml-2">
                      ({aiSuggestion.suggestedDiscountPercent}% OFF)
                    </span>
                  </div>

                  {!aiApplied ? (
                    <button
                      type="button"
                      onClick={applyAISuggestion}
                      className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aceptar sugerencia
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aplicado
                    </span>
                  )}
                </div>

                {/* Factors Explained */}
                <div className="space-y-1 pt-1 border-t border-white/10">
                  <div className="text-[11px] font-bold text-emerald-100">
                    Factores y motivos analizados:
                  </div>
                  <ul className="space-y-1 text-[11px] text-emerald-200/90 pl-3 list-disc">
                    {aiSuggestion.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="text-[10px] text-emerald-300/80 italic">
                  * La sugerencia es una recomendación y podés aceptarla, rechazarla o ajustarla libremente.
                </div>
              </div>
            )}

            {/* Price Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-emerald-100 uppercase tracking-wider mb-1">
                  Precio original en mostrador ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    required
                    value={precioOriginal}
                    onChange={(e) => setPrecioOriginal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white text-gray-900 font-black text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Precio Reaprovecha ($) *</span>
                  <span className="font-extrabold text-amber-300">{discountPercent}% OFF</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    required
                    value={precioReaprovecha}
                    onChange={(e) => setPrecioReaprovecha(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white text-emerald-800 font-black text-sm focus:outline-none ring-2 ring-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image URL & Preset Selection */}
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              URL de imagen del producto
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={imagen}
                onChange={(e) => setImagen(e.target.value)}
                placeholder="https://ejemplo.com/foto.jpg"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={closePublishModal}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Package className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : productToEdit ? 'Guardar Cambios' : 'Publicar Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
