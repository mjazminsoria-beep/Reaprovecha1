import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatKg } from '../utils/date';
import {
  Leaf,
  DollarSign,
  PackageCheck,
  Store,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TreePine,
  CloudSun,
  ShoppingBag,
} from 'lucide-react';

export const ImpactView: React.FC = () => {
  const { globalImpact, userImpact, setCurrentView } = useApp();
  const { currentUser } = useAuth();

  const kgTotal = globalImpact?.kilos_recuperados || 145.5;
  const itemsTotal = globalImpact?.productos_recuperados || 164;
  const moneyTotal = globalImpact?.dinero_ahorrado || 195400;
  const merchantsTotal = globalImpact?.comercios_participantes || 18;
  const co2AvoidedKg = Math.round(kgTotal * 2.5); // Approx 2.5kg CO2 per kg food waste avoided
  const treesEquivalent = Math.round(co2AvoidedKg / 20); // 1 tree absorbs ~20kg CO2/year

  return (
    <div className="space-y-12 py-8 max-w-6xl mx-auto">
      {/* Hero Impact Header */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden text-center">
        <div className="max-w-3xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
            <Leaf className="w-4 h-4 text-emerald-300" />
            <span>Sostenibilidad y Economía Circular</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Impacto Ambiental y Social
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Un tercio de todos los alimentos producidos a nivel mundial terminan en la basura.
            En Reaprovecha transformamos pérdidas en valor compartido, impulsando el comercio de cercanía
            y protegiendo el bolsillo de los hogares.
          </p>
        </div>

        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Global Impact Dashboard Grid */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xs space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            Métricas Globales de la Comunidad
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Resultados consolidados de rescates y ventas en proveedores adheridos
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-3xl p-6 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-600/20">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-950">
                {formatKg(kgTotal)}
              </div>
              <div className="text-sm font-bold text-emerald-800 mt-1">Alimentos salvados</div>
              <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
                Comida fresca recuperada que llegó a mesas en lugar de rellenos sanitarios.
              </p>
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-100 rounded-3xl p-6 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-4 shadow-md shadow-amber-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-amber-950">
                {formatCurrency(moneyTotal)}
              </div>
              <div className="text-sm font-bold text-amber-800 mt-1">Dinero ahorrado</div>
              <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                Ahorro económico directo para familias en productos de la canasta básica.
              </p>
            </div>
          </div>

          <div className="bg-teal-50/80 border border-teal-100 rounded-3xl p-6 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-4 shadow-md shadow-teal-600/20">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-teal-950">
                {co2AvoidedKg} kg
              </div>
              <div className="text-sm font-bold text-teal-800 mt-1">CO₂e evitado</div>
              <p className="text-xs text-teal-700/80 mt-1 leading-relaxed">
                Huella de carbono reducida equivalente a plantar aprox. {treesEquivalent} árboles adultos.
              </p>
            </div>
          </div>

          <div className="bg-blue-50/80 border border-blue-100 rounded-3xl p-6 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md shadow-blue-600/20">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-950">
                {merchantsTotal}
              </div>
              <div className="text-sm font-bold text-blue-800 mt-1">Proveedores activos</div>
              <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                Panaderías, rotiserías y queserías de barrio que reducen su merma a cero.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Impact (if logged in) */}
      {currentUser && (
        <section className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-8 sm:p-10 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tu huella individual</span>
            </div>
            <h3 className="text-2xl font-black">
              {currentUser.nombre}, ya salvaste {formatKg(userImpact?.kilos_recuperados || 0)} de comida
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100">
              Ahorraste un total de {formatCurrency(userImpact?.dinero_ahorrado || 0)} en tus reservas.
            </p>
          </div>

          <button
            onClick={() => setCurrentView('mi-impacto')}
            className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-sm shadow-md transition-all hover:scale-105 shrink-0 cursor-pointer"
          >
            Ver mis estadísticas detalladas
          </button>
        </section>
      )}

      {/* Call to action */}
      <div className="text-center pt-4">
        <button
          onClick={() => setCurrentView('catalogo')}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg transition-transform hover:scale-105 cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Explorar productos para salvar hoy</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
