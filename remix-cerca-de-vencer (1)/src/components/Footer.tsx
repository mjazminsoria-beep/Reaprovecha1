import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { Heart, ShoppingBag, Store, Leaf, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView, openPublishModal, openAuthModal } = useApp();
  const { currentUser, setActiveRole } = useAuth();

  return (
    <footer className="bg-gray-900 text-gray-400 text-xs border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="text-white text-lg font-black tracking-tight">
                re<span className="text-emerald-400">aprovecha</span>
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Tandil
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed max-w-md">
              Plataforma para conectar proveedores y elaboradores de alimentos de Tandil con consumidores para liquidar productos
              con fallas o antes de su fecha de vencimiento, combatiendo el desperdicio y las pérdidas comerciales.
            </p>
            <div className="text-[11px] text-emerald-400/90 font-medium">
              🌱 Cada alimento rescatado en Tandil evita emisiones de CO₂ y ahorra dinero.
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <div className="text-white font-bold text-sm">Navegación</div>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => setCurrentView('home')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Página de Inicio
                </button>
              </li>
              {currentUser?.tipo_usuario !== 'comercio' ? (
                <li>
                  <button
                    onClick={() => {
                      setActiveRole('consumidor');
                      setCurrentView('catalogo');
                    }}
                    className="hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Encontrá Productos
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    onClick={() => openPublishModal()}
                    className="hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Publicar producto
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => setCurrentView('como-funciona')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  ¿Cómo funciona?
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('impacto')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Impacto Ambiental y Social
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (currentUser?.tipo_usuario === 'comercio') {
                      setCurrentView('panel-comercio');
                    } else {
                      openAuthModal('register-merchant');
                    }
                  }}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Panel del Proveedor
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Context */}
          <div className="space-y-2">
            <div className="text-white font-bold text-sm">Información de la plataforma</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Conectamos proveedores y elaboradores de alimentos de Tandil con consumidores. El retiro se realiza
              de forma presencial directamente en los locales adheridos.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} reaprovecha Tandil. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-1">
            <span>Hecho para promover el consumo responsable y el ahorro</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
