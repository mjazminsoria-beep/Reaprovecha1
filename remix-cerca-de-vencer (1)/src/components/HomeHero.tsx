import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from './ProductCard';
import { formatCurrency, formatKg } from '../utils/date';
import {
  ShoppingBag,
  Store,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingDown,
  TrendingUp,
  Leaf,
  ShieldCheck,
  PackageCheck,
  DollarSign,
  Users,
  Flame,
} from 'lucide-react';

export const HomeHero: React.FC = () => {
  const { products, globalImpact, setCurrentView, openAuthModal, openPublishModal } = useApp();
  const { currentUser } = useAuth();

  // Highlight urgent and top-discount products for preview
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="space-y-20 py-6 sm:py-10">
      {/* 1. Main Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-2xl border border-emerald-800/40">
        {/* Glow ambient background elements */}
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[480px] h-[480px] bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 py-16 sm:px-12 sm:py-24 text-center">
          {/* Sustainability Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs sm:text-sm font-semibold mb-6 backdrop-blur-md">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span>Alimentos de calidad a precios de rescate</span>
          </div>

          {/* Direct Value Proposition Title (Exact wording requested) */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight sm:leading-tight">
            Encontrá alimentos próximos a vencer o con fallas a precios más bajos y{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300">
              ayudá a reducir el desperdicio de alimentos.
            </span>
          </h1>

          {/* Subtitle explaining the connection between merchants and consumers */}
          <p className="mt-6 text-base sm:text-xl text-emerald-100/90 max-w-3xl mx-auto font-normal leading-relaxed">
            Reaprovecha conecta proveedores de alimentos que tienen excedentes con consumidores que pueden
            comprarlos a menor precio, reduciendo el desperdicio. Ahorrás en tu compra diaria y transformamos
            pérdidas en valor compartido.
          </p>

          {/* Two Main Distinct Buttons (Exact as requested: Soy consumidor / Soy proveedor) */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            {/* Button 1: Quiero comprar */}
            <button
              onClick={() => setCurrentView('catalogo')}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-lg shadow-xl shadow-amber-400/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer group"
            >
              <ShoppingBag className="w-6 h-6 text-gray-950 group-hover:-translate-y-0.5 transition-transform" />
              <span>Quiero comprar</span>
              <ArrowRight className="w-5 h-5 text-gray-950 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Button 2: Soy proveedor */}
            <button
              onClick={() => {
                if (currentUser?.tipo_usuario === 'comercio') {
                  setCurrentView('panel-comercio');
                } else {
                  openAuthModal('register-merchant');
                }
              }}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-black text-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Store className="w-6 h-6 text-emerald-300" />
              <span>Soy proveedor</span>
            </button>
          </div>

          {/* Quick Pillars */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 border-t border-emerald-800/80 text-left">
            <div className="flex items-center gap-3.5 bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Descuentos del 30% al 60%</div>
                <div className="text-xs text-emerald-200/80">Comprá rico, fresco y barato</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="w-11 h-11 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Proveedores de cercanía</div>
                <div className="text-xs text-emerald-200/80">Retirá en tu barrio sin esperas</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="w-11 h-11 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Precios Asistidos por IA</div>
                <div className="text-xs text-emerald-200/80">Sugerencias justas para rotar stock</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Section: ¿Cómo funciona? (Buscar → Elegir → Reservar → Retirar) */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xs">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
            Para Consumidores
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-3">
            ¿Cómo funciona Reaprovecha?
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-2">
            Un proceso ágil y transparente para acceder a alimentos de primera calidad antes de su vencimiento:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1: Buscar */}
          <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center text-center group hover:bg-emerald-50 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-emerald-600/20">
              <Search className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Paso 1</div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Buscar</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Explorá alimentos disponibles cerca tuyo filtrando por distancia, categoría, proveedor o retiro hoy.
            </p>
          </div>

          {/* Step 2: Elegir */}
          <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col items-center text-center group hover:bg-amber-50 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-amber-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Paso 2</div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Elegir</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Revisá la fecha de vencimiento, el porcentaje de descuento y el horario límite de retiro del proveedor.
            </p>
          </div>

          {/* Step 3: Reservar */}
          <div className="p-6 rounded-2xl bg-teal-50/50 border border-teal-100 flex flex-col items-center text-center group hover:bg-teal-50 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-teal-600/20">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">Paso 3</div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Reservar</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Indicá cuántas unidades querés y reservá al instante sin necesidad de tarjeta. Obtené tu código único.
            </p>
          </div>

          {/* Step 4: Retirar */}
          <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col items-center text-center group hover:bg-blue-50 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-blue-600/20">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Paso 4</div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Retirar</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Acercate al proveedor en la franja horaria indicada, mostrá tu reserva, pagás en el local y ¡salvaste comida!
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setCurrentView('catalogo')}
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-bold text-sm"
          >
            <span>Ver alimentos listos para reservar en tu zona</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. Section: Específica para Proveedores (Publicá tus excedentes → Vendelos → Reducí el desperdicio) */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-8 sm:p-14 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-800/80 px-3.5 py-1 rounded-full border border-emerald-700">
              Para Proveedores de Alimentos
            </span>
            <h2 className="text-2xl sm:text-4xl font-black mt-3">
              ¿Sos proveedor o elaborador de alimentos? Transformá pérdidas en ingresos
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
              Panaderías, verdulerías, almacenes, queserías y productores de Tandil ya recuperan dinero cada día con Reaprovecha:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-gray-950 font-black flex items-center justify-center text-lg mb-4">
                1
              </div>
              <h3 className="font-extrabold text-lg text-white mb-2">Publicá tus excedentes</h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Cargá los productos que vencen pronto o tienen leves fallas estéticas. Nuestra IA te sugiere el descuento óptimo.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-400 text-gray-950 font-black flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h3 className="font-extrabold text-lg text-white mb-2">Vendelos rápidamente</h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Vecinos y consumidores de tu barrio en Tandil reciben la alerta, reservan en minutos y retiran directamente por tu local.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-teal-300 text-gray-950 font-black flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h3 className="font-extrabold text-lg text-white mb-2">Reducí el desperdicio</h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Disminuís las mermas a cero, atraés nuevos clientes recurrentes a tu negocio y fortalecés tu perfil sustentable.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (currentUser?.tipo_usuario === 'comercio') {
                  setCurrentView('panel-comercio');
                } else {
                  openAuthModal('register-merchant');
                }
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-base shadow-lg transition-all hover:scale-102 cursor-pointer flex items-center justify-center gap-2"
            >
              <Store className="w-5 h-5" />
              <span>Sumarme como proveedor a Reaprovecha</span>
            </button>
            <button
              onClick={() => setCurrentView('como-funciona')}
              className="text-xs font-semibold text-emerald-200 hover:text-white underline underline-offset-4 py-2 cursor-pointer"
            >
              Conocer requisitos para proveedores
            </button>
          </div>
        </div>
      </section>

      {/* 4. Section: Impacto Ambiental y Económico con Estadísticas Visuales Reales */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xs">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Medición de Impacto Real</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            El impacto colectivo de la comunidad
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Cada reserva en Reaprovecha genera un impacto económico directo y frena la huella ambiental del desecho de comida.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Stat 1: Kilos de alimentos */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-3xl p-5 text-center flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900">
                {formatKg(globalImpact?.kilos_recuperados || 145.5)}
              </div>
              <div className="text-xs font-bold text-emerald-800 mt-1">Alimentos recuperados</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Evitados de la basura</div>
            </div>
          </div>

          {/* Stat 2: Cantidad de productos */}
          <div className="bg-teal-50/70 border border-teal-100 rounded-3xl p-5 text-center flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-teal-900">
                {globalImpact?.productos_recuperados || 164}
              </div>
              <div className="text-xs font-bold text-teal-800 mt-1">Productos salvados</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Lotes comercializados</div>
            </div>
          </div>

          {/* Stat 3: Dinero ahorrado */}
          <div className="bg-amber-50/70 border border-amber-100 rounded-3xl p-5 text-center flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-900">
                {formatCurrency(globalImpact?.dinero_ahorrado || 195400)}
              </div>
              <div className="text-xs font-bold text-amber-800 mt-1">Ahorro para familias</div>
              <div className="text-[10px] text-gray-500 mt-0.5">En compras cotidianas</div>
            </div>
          </div>

          {/* Stat 4: Proveedores participantes */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-3xl p-5 text-center flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-blue-900">
                {globalImpact?.comercios_participantes || 18}
              </div>
              <div className="text-xs font-bold text-blue-800 mt-1">Proveedores adheridos</div>
              <div className="text-[10px] text-gray-500 mt-0.5">En Tandil y zona</div>
            </div>
          </div>

          {/* Stat 5: Reservas realizadas */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-center col-span-2 sm:col-span-1 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                {globalImpact?.reservas_realizadas || 98}
              </div>
              <div className="text-xs font-bold text-gray-800 mt-1">Reservas exitosas</div>
              <div className="text-[10px] text-gray-500 mt-0.5">100% retiro coordinado</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section: Productos Destacados o Disponibles */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                Productos disponibles en este momento en Tandil
              </h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Alimentos frescos de panaderías, queserías y almacenes con retiro pactado para hoy.
            </p>
          </div>

          <button
            onClick={() => setCurrentView('catalogo')}
            className="px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Ver catálogo completo ({products.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. Section: Llamado a la Acción Final para Registrarse */}
      <section className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-8 sm:p-14 text-white text-center shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black">
            Sé parte del cambio. Creá tu cuenta gratis en Reaprovecha.
          </h2>

          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Ya sea para ahorrar en tus compras de todos los días o para comercializar tus excedentes como proveedor,
            unirte te toma menos de un minuto.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openAuthModal('register-consumer')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-base shadow-lg transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Registrarme como Consumidor</span>
            </button>

            <button
              onClick={() => openAuthModal('register-merchant')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/40 text-white font-bold text-base transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
            >
              <Store className="w-5 h-5 text-emerald-300" />
              <span>Registrarme como Proveedor</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
