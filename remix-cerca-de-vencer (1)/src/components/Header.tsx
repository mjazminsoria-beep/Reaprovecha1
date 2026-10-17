import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import {
  ShoppingBag,
  Store,
  Sparkles,
  User,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  HeartHandshake,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { currentView, setCurrentView, userReservations, openAuthModal, openPublishModal } =
    useApp();
  const { currentUser, currentMerchant, activeRole, setActiveRole, logout, quickSwitchUser } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const pendingReservationsCount = userReservations.filter((r) => r.estado === 'pendiente' || r.estado === 'confirmada').length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => setCurrentView('home')}
          >
            <Logo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-gray-900">
                  re<span className="text-emerald-600">aprovecha</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wider">
                  Tandil
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
                Alimentos que vuelven a la mesa
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                currentView === 'home'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'hover:text-emerald-700 hover:bg-gray-100/80'
              }`}
            >
              Inicio
            </button>

            {/* ONLY visible to consumers / visitors, NOT to providers */}
            {currentUser?.tipo_usuario !== 'comercio' && (
              <button
                onClick={() => setCurrentView('catalogo')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  currentView === 'catalogo'
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'hover:text-emerald-700 hover:bg-gray-100/80'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                Encontrá productos
              </button>
            )}

            <button
              onClick={() => setCurrentView('como-funciona')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                currentView === 'como-funciona'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'hover:text-emerald-700 hover:bg-gray-100/80'
              }`}
            >
              ¿Cómo funciona?
            </button>

            <button
              onClick={() => setCurrentView('impacto')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                currentView === 'impacto'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'hover:text-emerald-700 hover:bg-gray-100/80'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              Impacto
            </button>

            {/* Provider-specific buttons */}
            {currentUser?.tipo_usuario === 'comercio' && (
              <>
                <button
                  onClick={() => setCurrentView('panel-comercio')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'panel-comercio'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Panel Proveedor
                </button>

                <button
                  onClick={() => openPublishModal()}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Publicar producto
                </button>
              </>
            )}

            {/* Consumer / Guest Reservations buttons */}
            {(currentUser?.tipo_usuario === 'consumidor' || (!currentUser && userReservations.length > 0)) && (
              <>
                <button
                  onClick={() => setCurrentView('mis-reservas')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    currentView === 'mis-reservas'
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'hover:text-emerald-700 hover:bg-gray-100/80'
                  }`}
                >
                  Mis Reservas
                  {pendingReservationsCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {pendingReservationsCount}
                    </span>
                  )}
                </button>
                {currentUser && (
                  <button
                    onClick={() => setCurrentView('mi-impacto')}
                    className={`px-3.5 py-2 rounded-xl transition-all ${
                      currentView === 'mi-impacto'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'hover:text-emerald-700 hover:bg-gray-100/80'
                    }`}
                  >
                    Mi Impacto
                  </button>
                )}
              </>
            )}
          </nav>

          {/* User actions / Auth Buttons / Demo Switcher */}
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200/80 transition-colors text-xs font-semibold text-gray-800 border border-gray-200 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
                    {currentUser.nombre.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block max-w-[130px] truncate">
                    <div className="font-bold text-gray-900 truncate">{currentUser.nombre}</div>
                    <div className="text-[10px] text-emerald-700 capitalize font-medium">
                      {currentUser.tipo_usuario === 'comercio' ? currentMerchant?.nombre || 'Proveedor' : 'Consumidor'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {/* Dropdown menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 text-xs text-gray-700 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="font-bold text-gray-900">{currentUser.nombre}</div>
                      <div className="text-gray-500 truncate">{currentUser.email}</div>
                      <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase">
                        {currentUser.tipo_usuario === 'comercio' ? 'Proveedor' : 'Consumidor'}
                      </div>
                    </div>

                    {currentUser.tipo_usuario === 'comercio' ? (
                      <button
                        onClick={() => {
                          setCurrentView('panel-comercio');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                        Panel del Proveedor
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setCurrentView('mis-reservas');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <ShoppingBag className="w-4 h-4 text-emerald-600" />
                          Mis Reservas
                        </button>
                        <button
                          onClick={() => {
                            setCurrentView('mi-impacto');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <HeartHandshake className="w-4 h-4 text-emerald-600" />
                          Mi Impacto Personal
                        </button>
                      </>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => openAuthModal('register-consumer')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 px-2 space-y-2 bg-white rounded-b-2xl shadow-lg animate-fadeIn text-sm">
            <button
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-gray-50"
            >
              Inicio
            </button>

            {/* ONLY visible to consumers / visitors, NOT to providers */}
            {currentUser?.tipo_usuario !== 'comercio' && (
              <button
                onClick={() => {
                  setCurrentView('catalogo');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-gray-50 flex items-center gap-2 text-emerald-700"
              >
                <ShoppingBag className="w-4 h-4" />
                Encontrá productos
              </button>
            )}

            <button
              onClick={() => {
                setCurrentView('como-funciona');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-gray-50"
            >
              ¿Cómo funciona?
            </button>
            <button
              onClick={() => {
                setCurrentView('impacto');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-gray-50"
            >
              Impacto ambiental y económico
            </button>

            {currentUser?.tipo_usuario === 'comercio' && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('panel-comercio');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl font-bold bg-emerald-50 text-emerald-800"
                >
                  Panel de Proveedor
                </button>
                <button
                  onClick={() => {
                    openPublishModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl font-bold bg-amber-400 text-gray-900"
                >
                  + Publicar producto
                </button>
              </>
            )}

            {(currentUser?.tipo_usuario === 'consumidor' || (!currentUser && userReservations.length > 0)) && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('mis-reservas');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-gray-50 flex items-center justify-between"
                >
                  <span>Mis Reservas</span>
                  {pendingReservationsCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {pendingReservationsCount}
                    </span>
                  )}
                </button>
                {currentUser && (
                  <button
                    onClick={() => {
                      setCurrentView('mi-impacto');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold hover:bg-gray-50"
                  >
                    Mi Impacto Personal
                  </button>
                )}
              </>
            )}

            {!currentUser && (
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-xs"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => {
                    openAuthModal('register-consumer');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
