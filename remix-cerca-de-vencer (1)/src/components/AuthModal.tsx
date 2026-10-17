import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { MerchantCategory } from '../types';
import {
  X,
  User,
  Store,
  Lock,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const MERCHANT_CATEGORIES: MerchantCategory[] = [
  'Supermercado y Almacén',
  'Panadería y Pastelería',
  'Lácteos y Quesería',
  'Verdulería y Frutería',
  'Carnicería y Granja',
  'Restaurante y Café',
  'Fábrica de Pastas',
  'Otro',
];

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, setCurrentView } = useApp();
  const { login, register, quickSwitchUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'register-consumer' | 'register-merchant'>(authModalTab);

  // Common inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('Tandil, Buenos Aires');

  // Merchant inputs
  const [nombreComercio, setNombreComercio] = useState('');
  const [direccion, setDireccion] = useState('Av. España 750, Tandil, Buenos Aires');
  const [categoria, setCategoria] = useState<MerchantCategory>('Panadería y Pastelería');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode with props
  React.useEffect(() => {
    setMode(authModalTab);
    setErrorMessage('');
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        closeAuthModal();
      } else if (mode === 'register-consumer') {
        await register({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          tipo_usuario: 'consumidor',
          telefono: telefono.trim(),
          ciudad: ciudad.trim() || 'Tandil, Buenos Aires',
        });
        closeAuthModal();
      } else if (mode === 'register-merchant') {
        await register({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          tipo_usuario: 'comercio',
          telefono: telefono.trim(),
          ciudad: ciudad.trim() || 'Tandil, Buenos Aires',
          nombre_comercio: nombreComercio.trim(),
          direccion: direccion.trim() || 'Av. España 750, Tandil, Buenos Aires',
          categoria,
        });
        closeAuthModal();
        setCurrentView('panel-comercio');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (type: 'consumidor' | 'comercio') => {
    if (type === 'consumidor') {
      login('lucia@example.com', 'consumidor123').then(() => {
        closeAuthModal();
      });
    } else {
      login('centinela@panaderia.com', 'comercio123').then(() => {
        closeAuthModal();
        setCurrentView('panel-comercio');
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 relative animate-fadeIn max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="p-6 pb-2 border-b border-gray-100">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-gray-900">
              {mode === 'login'
                ? 'Iniciar sesión'
                : mode === 'register-consumer'
                ? 'Registro de Consumidor'
                : 'Registro de Proveedor'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Plataforma sustentable Reaprovecha Tandil
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-2xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register-consumer');
                setErrorMessage('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'register-consumer' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600'
              }`}
            >
              Consumidor
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register-merchant');
                setErrorMessage('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'register-merchant' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600'
              }`}
            >
              Proveedor
            </button>
          </div>
        </div>

        {/* Demo Fast Login Bar */}
        <div className="bg-emerald-50 px-6 py-2.5 border-b border-emerald-100 text-[11px] flex items-center justify-between text-emerald-900">
          <span className="font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Acceso rápido de prueba:
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('consumidor')}
              className="px-2 py-0.5 rounded bg-white font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
            >
              Consumidor
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('comercio')}
              className="px-2 py-0.5 rounded bg-emerald-600 font-bold text-white hover:bg-emerald-700 cursor-pointer"
            >
              Proveedor (Tandil)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Registration Fields */}
          {mode !== 'login' && (
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                {mode === 'register-merchant' ? 'Nombre del responsable *' : 'Nombre completo *'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Lucía Fernández"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Specific Merchant / Provider Fields */}
          {mode === 'register-merchant' && (
            <>
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nombre del proveedor o local *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Panadería El Centinela"
                    value={nombreComercio}
                    onChange={(e) => setNombreComercio(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Categoría del proveedor *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as MerchantCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {MERCHANT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Dirección física en Tandil, Buenos Aires *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Av. España 750, Tandil, Buenos Aires"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Mínimo 4 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Optional phone & city for register */}
          {mode !== 'login' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Teléfono {mode === 'register-consumer' ? '(opcional)' : '*'}
                </label>
                <input
                  type="tel"
                  required={mode === 'register-merchant'}
                  placeholder="+54 9 11..."
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  placeholder="Ej. Tandil, Buenos Aires"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? 'Procesando...'
                : mode === 'login'
                ? 'Ingresar a Reaprovecha'
                : mode === 'register-consumer'
                ? 'Crear cuenta de Consumidor'
                : 'Registrarme como Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
