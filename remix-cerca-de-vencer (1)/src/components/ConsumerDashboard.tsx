import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatExpirationDate, formatKg } from '../utils/date';
import {
  ShoppingBag,
  HeartHandshake,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  DollarSign,
  Leaf,
  Store,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ConsumerDashboardProps {
  initialTab?: 'reservas' | 'impacto';
}

export const ConsumerDashboard: React.FC<ConsumerDashboardProps> = ({ initialTab = 'reservas' }) => {
  const { userReservations, userImpact, setCurrentView, openAuthModal } = useApp();
  const { currentUser } = useAuth();
  const [tab, setTab] = React.useState<'reservas' | 'impacto'>(initialTab);

  if (!currentUser) {
    return (
      <div className="py-16 max-w-lg mx-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-10 h-10 stroke-[2.2]" />
        </div>
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
            Acceso requerido
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            Tenés que ingresar para ver tus reservas
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Iniciá sesión con tu cuenta de consumidor para consultar el historial de tus pedidos, códigos de retiro y tu impacto ambiental en Tandil.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => openAuthModal('login')}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => openAuthModal('register-consumer')}
            className="px-6 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm transition-colors cursor-pointer"
          >
            Crear Cuenta
          </button>
        </div>
      </div>
    );
  }

  const totalSavings = userImpact?.dinero_ahorrado || 0;
  const totalKg = userImpact?.kilos_recuperados || 0;
  const totalItems = userImpact?.productos_recuperados || 0;
  const totalCo2 = userImpact?.co2_evitado_kg || 0;

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Perfil de Consumidor
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            ¡Hola, {currentUser?.nombre || 'Consumidor'}!
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {currentUser
              ? `${currentUser.ciudad || 'Tandil, Buenos Aires'} • ${currentUser.email}`
              : 'Tus pedidos y reservas en comercios de Tandil'}
          </p>
        </div>

        <button
          onClick={() => setCurrentView('catalogo')}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Explorar más alimentos</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setTab('reservas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'reservas'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          Mis Reservas ({userReservations.length})
        </button>

        <button
          onClick={() => setTab('impacto')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            tab === 'impacto'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mi Impacto Personal</span>
        </button>
      </div>

      {/* TAB 1: RESERVAS */}
      {tab === 'reservas' && (
        <div className="space-y-4">
          {userReservations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userReservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div>
                        <span className="font-mono font-black text-sm bg-gray-100 px-2.5 py-0.5 rounded text-gray-900">
                          {res.id}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(res.fecha_creacion).toLocaleDateString('es-AR')}
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          res.estado === 'retirada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.estado === 'lista_para_retirar'
                            ? 'bg-blue-100 text-blue-800'
                            : res.estado === 'confirmada'
                            ? 'bg-teal-100 text-teal-800'
                            : res.estado === 'cancelada'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {res.estado === 'retirada'
                          ? '✅ Retirada'
                          : res.estado === 'lista_para_retirar'
                          ? '🟢 Lista para retirar'
                          : res.estado === 'confirmada'
                          ? '🔵 Confirmada'
                          : res.estado === 'cancelada'
                          ? '❌ Cancelada'
                          : '🟡 Pendiente'}
                      </span>
                    </div>

                    {/* Commerce info */}
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-gray-900 text-sm">{res.comercio_nombre}</div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{res.comercio_direccion}</span>
                      </div>
                      <div className="text-amber-700 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Horario límite: {res.hora_limite_retiro || 'Hoy'}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 p-3 rounded-2xl space-y-1 text-xs">
                      {res.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-gray-800">
                          <span className="font-medium truncate max-w-[200px]">
                            {item.producto_nombre || 'Producto'}
                          </span>
                          <span className="font-bold">x {item.cantidad} u.</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400">Total a pagar: </span>
                      <strong className="text-emerald-700 font-black text-sm">
                        {formatCurrency(res.total)}
                      </strong>
                    </div>

                    <div className="text-amber-700 font-bold text-[11px]">
                      Ahorraste {formatCurrency(res.ahorro_total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs max-w-md mx-auto space-y-3">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="font-bold text-gray-900 text-base">Aún no realizaste reservas</h3>
              <p className="text-xs text-gray-500">
                Mirá los alimentos con descuento de hoy y hacé tu primera compra consciente.
              </p>
              <button
                onClick={() => setCurrentView('catalogo')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Buscar productos
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MI IMPACTO PERSONAL */}
      {tab === 'impacto' && (
        <div className="space-y-6">
          {/* Main Hero Card for Personal Impact */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 text-white flex items-center justify-center mx-auto shadow-inner">
              <Leaf className="w-8 h-8 text-emerald-300" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black">
              Gracias a tus compras ayudaste a recuperar{' '}
              <span className="text-amber-300">{formatKg(totalKg || 3.9)}</span> de alimentos.
            </h2>

            <p className="text-emerald-100/90 text-sm max-w-xl mx-auto leading-relaxed">
              Cada paquete de comida que rescatás reduce la emisión de gases de efecto invernadero del vertedero
              y fomenta la economía barrial sustentable.
            </p>
          </div>

          {/* 4 Personal Metric Boxes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs text-center">
              <div className="text-2xl font-black text-emerald-700">{formatKg(totalKg || 3.9)}</div>
              <div className="text-xs font-bold text-gray-800 mt-1">Kilos recuperados</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Comida rescatada</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs text-center">
              <div className="text-2xl font-black text-amber-600">
                {formatCurrency(totalSavings || 5600)}
              </div>
              <div className="text-xs font-bold text-gray-800 mt-1">Dinero ahorrado</div>
              <div className="text-[10px] text-gray-400 mt-0.5">En tus reservas</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs text-center">
              <div className="text-2xl font-black text-teal-700">{totalItems || 5} u.</div>
              <div className="text-xs font-bold text-gray-800 mt-1">Alimentos salvados</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Lotes individuales</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs text-center">
              <div className="text-2xl font-black text-blue-700">
                {formatKg(totalCo2 || 9.8)}
              </div>
              <div className="text-xs font-bold text-gray-800 mt-1">CO₂ eq evitado</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Huella de carbono</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
