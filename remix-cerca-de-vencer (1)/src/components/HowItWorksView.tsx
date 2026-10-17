import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  ShoppingBag,
  PackageCheck,
  MapPin,
  Store,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Leaf,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export const HowItWorksView: React.FC = () => {
  const { setCurrentView, openAuthModal } = useApp();
  const { currentUser } = useAuth();

  return (
    <div className="space-y-16 py-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-8 sm:p-14 text-white shadow-xl relative overflow-hidden text-center">
        <div className="max-w-3xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
            <HelpCircle className="w-4 h-4 text-emerald-300" />
            <span>Guía Completa de Reaprovecha</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            ¿Cómo funciona Reaprovecha?
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Una plataforma colaborativa diseñada para eliminar el desperdicio de comida conectando
            en tiempo real a proveedores de alimentos con excedentes y a consumidores que buscan ahorrar en Tandil.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setCurrentView('catalogo')}
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-sm shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ver alimentos disponibles hoy</span>
            </button>
            <button
              onClick={() => {
                if (currentUser?.tipo_usuario === 'comercio') {
                  setCurrentView('panel-comercio');
                } else {
                  openAuthModal('register-merchant');
                }
              }}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition-colors cursor-pointer flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-emerald-300" />
              <span>Soy proveedor (Registrarme)</span>
            </button>
          </div>
        </div>
      </div>

      {/* For Consumers Section */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xs space-y-8">
        <div className="border-b border-gray-100 pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Ruta del Consumidor
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            Paso a paso: Cómo comprar y retirar tus alimentos
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Sin suscripciones mensuales ni tarjetas de crédito requeridas para reservar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-600/20">
                <Search className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Paso 1</div>
              <h3 className="font-black text-lg text-gray-900 mb-2">1. Buscar</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ingresá a la sección "Encontrá productos". Podés filtrar por tu barrio o distancia en km, tipo de alimento, proveedor o productos listos para retirar hoy.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-100 text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Geolocalización en vivo
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-4 shadow-md shadow-amber-500/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Paso 2</div>
              <h3 className="font-black text-lg text-gray-900 mb-2">2. Elegir</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cada producto tiene su foto real, fecha exacta de vencimiento, descuento aplicado (30% al 60%), cantidad de unidades y el horario tope para pasar a buscarlo.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-amber-100 text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Transparencia total
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-teal-50/60 border border-teal-100 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-4 shadow-md shadow-teal-600/20">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">Paso 3</div>
              <h3 className="font-black text-lg text-gray-900 mb-2">3. Reservar</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Hacé clic en "Quiero comprar" o "Reservar". Completás tu nombre y WhatsApp para generar tu reserva con código alfanumérico instantáneo.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-teal-100 text-[11px] font-semibold text-teal-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Stock reservado al instante
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md shadow-blue-600/20">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Paso 4</div>
              <h3 className="font-black text-lg text-gray-900 mb-2">4. Retirar</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Vas al local dentro del horario límite de retiro, mostrás tu código o nombre, abonás en caja con el descuento pactado y te llevás comida deliciosa.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-100 text-[11px] font-semibold text-blue-800 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Pago directo en el negocio
            </div>
          </div>
        </div>
      </section>

      {/* For Merchants Section */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-8">
        <div className="border-b border-white/10 pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-800/80 px-3 py-1 rounded-full border border-emerald-700">
            Ruta del Proveedor
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">
            Cómo vender tus excedentes y recuperar dinero en Tandil
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            Fácil de usar desde el celular o mostrador. Convertí mermas en clientes nuevos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/15 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-gray-950 font-black flex items-center justify-center text-base">
              1
            </div>
            <h3 className="font-black text-lg text-white">Publicá tus productos</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Cargá en segundos el lote próximo a vencer: nombre, foto, cantidad y vencimiento. Nuestra IA analiza la urgencia y te recomienda un descuento óptimo para vender todo rápido sin malvender.
            </p>
            <div className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 pt-2">
              <Sparkles className="w-3.5 h-3.5" /> Vos siempre tenés la decisión final del precio
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/15 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400 text-gray-950 font-black flex items-center justify-center text-base">
              2
            </div>
            <h3 className="font-black text-lg text-white">Gestioná las reservas</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Recibís las reservas en tu panel con los datos de contacto y el stock se descuenta automáticamente. Podés cambiar el estado a "Lista para retirar" o "Retirada" con un solo clic.
            </p>
            <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1 pt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Control de inventario en tiempo real
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/15 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-300 text-gray-950 font-black flex items-center justify-center text-base">
              3
            </div>
            <h3 className="font-black text-lg text-white">Monitoreá tus métricas</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Consultá cuánto dinero recuperaste en lugar de tirarlo como merma, cuántos kilos de comida salvaste y las emisiones de CO₂ evitadas.
            </p>
            <div className="text-[11px] text-teal-200 font-semibold flex items-center gap-1 pt-2">
              <Leaf className="w-3.5 h-3.5" /> Reportes de impacto ambiental y financiero
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xs space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center">
          Preguntas Frecuentes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <h4 className="font-bold text-sm text-gray-900 mb-1.5">
              ¿Los alimentos próximos a vencer son seguros para el consumo?
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Sí. Todos los productos comercializados en Reaprovecha se encuentran dentro de su período de aptitud bromatológica garantizada y provienen de proveedores habilitados de Tandil. Se trata de productos frescos que simplemente deben consumirse en los próximos 1 a 4 días.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <h4 className="font-bold text-sm text-gray-900 mb-1.5">
              ¿Qué pasa si no puedo ir a retirar mi reserva?
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              El proveedor mantiene tu reserva hasta la hora límite de retiro pactada. Si no te presentás antes de ese horario, el proveedor puede volver a poner el producto a la venta para evitar que se pierda.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <h4 className="font-bold text-sm text-gray-900 mb-1.5">
              ¿El precio sugerido por la IA se aplica de forma automática?
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              No. La IA proporciona una recomendación basada en los días que restan, el stock y la rotación esperada, pero el proveedor siempre tiene la decisión final de aceptar la sugerencia, modificar el precio o fijar su propio descuento.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <h4 className="font-bold text-sm text-gray-900 mb-1.5">
              ¿Tiene algún costo para los usuarios consumidores?
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Reaprovecha es 100% gratuita para los consumidores. No hay costos de intermediación ni comisiones agregadas sobre el precio publicado.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
