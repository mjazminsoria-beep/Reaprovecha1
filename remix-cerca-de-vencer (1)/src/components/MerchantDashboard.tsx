import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Product, Reservation, ReservationStatus, MerchantCategory, normalizeProductStatus } from '../types';
import { formatCurrency, formatExpirationDate, formatKg } from '../utils/date';
import { apiClient } from '../services/api';
import {
  Package,
  Clock,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  Phone,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  Store,
  DollarSign,
  Leaf,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  Check,
  XCircle,
  Sliders,
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

export const MerchantDashboard: React.FC = () => {
  const {
    products,
    merchantReservations,
    openPublishModal,
    deleteProduct,
    toggleProductStatus,
    setProductStatus,
    updateProductStock,
    updateReservationStatus,
  } = useApp();
  const { currentMerchant, refreshMerchantProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'publicaciones' | 'reservas' | 'perfil' | 'estadisticas'>('publicaciones');
  const [productStatusFilter, setProductStatusFilter] = useState<'todos' | 'disponible' | 'reservado' | 'vendido' | 'retirado'>('todos');
  const [stats, setStats] = useState<any>(null);

  // Edit merchant form state
  const [merchantName, setMerchantName] = useState(currentMerchant?.nombre || '');
  const [merchantCategory, setMerchantCategory] = useState<MerchantCategory>(
    currentMerchant?.categoria || 'Panadería y Pastelería'
  );
  const [merchantAddress, setMerchantAddress] = useState(currentMerchant?.direccion || '');
  const [merchantPhone, setMerchantPhone] = useState(currentMerchant?.telefono || '');
  const [merchantOpen, setMerchantOpen] = useState(currentMerchant?.horario_apertura || '08:30');
  const [merchantClose, setMerchantClose] = useState(currentMerchant?.horario_cierre || '20:30');
  const [merchantDesc, setMerchantDesc] = useState(currentMerchant?.descripcion || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  useEffect(() => {
    if (currentMerchant) {
      setMerchantName(currentMerchant.nombre);
      setMerchantCategory(currentMerchant.categoria);
      setMerchantAddress(currentMerchant.direccion);
      setMerchantPhone(currentMerchant.telefono);
      setMerchantOpen(currentMerchant.horario_apertura);
      setMerchantClose(currentMerchant.horario_cierre);
      setMerchantDesc(currentMerchant.descripcion);

      apiClient.getMerchantStats(currentMerchant.id).then(setStats).catch(console.error);
    }
  }, [currentMerchant, products, merchantReservations]);

  // Filter products for this merchant
  const myProducts = products.filter((p) => !currentMerchant || p.comercio_id === currentMerchant.id);
  const myReservations = merchantReservations;

  // Map of reserved units per product across active reservations
  const reservedUnitsMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const res of myReservations) {
      if (res.estado !== 'cancelada' && res.estado !== 'retirada') {
        for (const item of res.items) {
          map.set(item.producto_id, (map.get(item.producto_id) || 0) + item.cantidad);
        }
      }
    }
    return map;
  }, [myReservations]);

  const countDisponibles = myProducts.filter(
    (p) => normalizeProductStatus(p.estado) === 'disponible' && p.cantidad_disponible > 0
  ).length;
  const countReservados = myProducts.filter(
    (p) =>
      normalizeProductStatus(p.estado) === 'reservado' ||
      (reservedUnitsMap.get(p.id) || 0) > 0 ||
      p.cantidad_disponible <= 0
  ).length;
  const countVendidos = myProducts.filter(
    (p) => normalizeProductStatus(p.estado) === 'vendido'
  ).length;
  const countRetirados = myProducts.filter(
    (p) => normalizeProductStatus(p.estado) === 'retirado'
  ).length;

  const filteredProducts = myProducts.filter((p) => {
    const norm = normalizeProductStatus(p.estado);
    const hasReservations = (reservedUnitsMap.get(p.id) || 0) > 0;
    if (productStatusFilter === 'todos') return true;
    if (productStatusFilter === 'disponible') return norm === 'disponible' && p.cantidad_disponible > 0;
    if (productStatusFilter === 'reservado') return norm === 'reservado' || hasReservations || p.cantidad_disponible <= 0;
    if (productStatusFilter === 'vendido') return norm === 'vendido';
    if (productStatusFilter === 'retirado') return norm === 'retirado';
    return true;
  });

  const totalStock = myProducts.reduce((acc, p) => acc + p.cantidad_disponible, 0);
  const pendingReservationsCount = myReservations.filter(
    (r) => r.estado === 'pendiente' || r.estado === 'confirmada' || r.estado === 'lista_para_retirar'
  ).length;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMerchant) return;

    await apiClient.updateMerchant(currentMerchant.id, {
      nombre: merchantName,
      categoria: merchantCategory,
      direccion: merchantAddress,
      telefono: merchantPhone,
      horario_apertura: merchantOpen,
      horario_cierre: merchantClose,
      descripcion: merchantDesc,
    });

    await refreshMerchantProfile();
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Panel del Proveedor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {currentMerchant?.nombre || 'Mi Perfil de Proveedor'}
          </h1>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <span>{currentMerchant?.direccion || 'Av. España 750, Tandil, Buenos Aires'}</span>
            <span>•</span>
            <span>{currentMerchant?.horario_apertura || '08:30'} a {currentMerchant?.horario_cierre || '20:30'} hs</span>
          </p>
        </div>

        <button
          onClick={() => openPublishModal()}
          className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:scale-102"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Publicar nuevo producto</span>
        </button>
      </div>

      {/* Primary KPI Cards (Sales, Money Recovered, Food & Kg Rescued) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Dinero Recuperado */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Dinero recuperado
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black">
              {formatCurrency(stats?.moneyRecovered || 34500)}
            </div>
            <p className="text-xs text-emerald-100 mt-1">Por venta de excedentes</p>
          </div>
        </div>

        {/* KPI 2: Kilos y Alimentos Rescatados */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Alimentos rescatados
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {formatKg(stats?.kgRescued || 28.5)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.productsRescued || 35} unidades salvadas
            </p>
          </div>
        </div>

        {/* KPI 3: Stock Activo */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Stock publicado
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-gray-900">{totalStock} u.</div>
            <p className="text-xs text-gray-500 mt-1">
              En {myProducts.length} productos publicados
            </p>
          </div>
        </div>

        {/* KPI 4: Reservas Pendientes */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Reservas pendientes
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              {pendingReservationsCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Por coordinar o entregar</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('publicaciones')}
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'publicaciones'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          Productos Publicados ({myProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('reservas')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reservas'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          <span>Reservas de Clientes ({myReservations.length})</span>
          {pendingReservationsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {pendingReservationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'perfil'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 bg-gray-100'
          }`}
        >
          Datos del Proveedor
        </button>
      </div>

      {/* TAB 1: PRODUCTOS PUBLICADOS */}
      {activeTab === 'publicaciones' && (
        <div className="space-y-4">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100 rounded-2xl text-xs font-bold w-fit">
            <button
              onClick={() => setProductStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                productStatusFilter === 'todos' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({myProducts.length})
            </button>
            <button
              onClick={() => setProductStatusFilter('disponible')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                productStatusFilter === 'disponible' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Disponibles ({countDisponibles})</span>
            </button>
            <button
              onClick={() => setProductStatusFilter('reservado')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                productStatusFilter === 'reservado' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300" />
              <span>Reservados ({countReservados})</span>
            </button>
            <button
              onClick={() => setProductStatusFilter('vendido')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                productStatusFilter === 'vendido' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-300" />
              <span>Vendidos ({countVendidos})</span>
            </button>
            <button
              onClick={() => setProductStatusFilter('retirado')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                productStatusFilter === 'retirado' ? 'bg-gray-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Retirados ({countRetirados})</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-4 px-6">Producto</th>
                    <th className="py-4 px-4">Vencimiento</th>
                    <th className="py-4 px-4">Stock</th>
                    <th className="py-4 px-4">Precios</th>
                    <th className="py-4 px-4">Estado</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const normStatus = normalizeProductStatus(p.estado);
                      const resUnits = reservedUnitsMap.get(p.id) || 0;

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Product Name & Img */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.imagen}
                                alt={p.nombre}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                              />
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{p.nombre}</div>
                                <div className="text-[11px] text-gray-400">{p.categoria}</div>
                              </div>
                            </div>
                          </td>

                          {/* Expiration */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900">
                              {formatExpirationDate(p.fecha_vencimiento)}
                            </div>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.dias_restantes <= 1
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {p.dias_restantes <= 0 ? 'Vence hoy' : `Quedan ${p.dias_restantes} días`}
                            </span>
                          </td>

                          {/* Stock Quick Editor */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  value={p.cantidad_disponible}
                                  onChange={(e) =>
                                    updateProductStock(p.id, Math.max(0, parseInt(e.target.value) || 0))
                                  }
                                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center font-bold text-gray-900"
                                />
                                <span className="text-[11px] text-gray-400">disp.</span>
                              </div>
                              {resUnits > 0 && (
                                <span className="text-[10px] text-amber-700 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 w-fit">
                                  {resUnits} reservada{resUnits > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Prices */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="font-black text-emerald-700 text-sm">
                              {formatCurrency(p.precio_reaprovecha)}
                            </div>
                            <div className="text-[11px] text-gray-400 line-through">
                              {formatCurrency(p.precio_original)}
                            </div>
                            <span className="text-[10px] font-bold text-rose-600">
                              {p.porcentaje_descuento}% OFF
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                normStatus === 'disponible'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : normStatus === 'reservado'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : normStatus === 'vendido'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              {normStatus === 'disponible'
                                ? 'Disponible'
                                : normStatus === 'reservado'
                                ? 'Reservado'
                                : normStatus === 'vendido'
                                ? 'Vendido'
                                : 'Retirado'}
                            </span>
                          </td>

                          {/* Action buttons (Status Selector, Retire, Edit, Delete) */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {/* Quick status selector */}
                              <select
                                value={normStatus}
                                onChange={(e) => setProductStatus(p.id, e.target.value as any)}
                                className="text-[11px] font-bold px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 cursor-pointer focus:outline-none"
                              >
                                <option value="disponible">🟢 Disponible</option>
                                <option value="reservado">🟡 Reservado</option>
                                <option value="vendido">🔵 Vendido</option>
                                <option value="retirado">⚪ Retirado</option>
                              </select>

                              {/* Quick toggle retire / activate */}
                              {normStatus !== 'retirado' ? (
                                <button
                                  title="Retirar producto de la venta"
                                  onClick={() => setProductStatus(p.id, 'retirado')}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                                >
                                  Retirar
                                </button>
                              ) : (
                                <button
                                  title="Poner producto disponible en catálogo"
                                  onClick={() => setProductStatus(p.id, 'disponible')}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                >
                                  Activar
                                </button>
                              )}

                              <button
                                title="Editar publicación"
                                onClick={() => openPublishModal(p)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                title="Eliminar producto"
                                onClick={() => {
                                  if (window.confirm(`¿Seguro que deseas eliminar "${p.nombre}"?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        {myProducts.length === 0
                          ? 'Aún no publicaste productos. Hacé click en "+ Publicar nuevo producto" para empezar.'
                          : 'No hay productos en esta categoría de estado.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESERVAS DE CLIENTES CON CAMBIO DE ESTADOS */}
      {activeTab === 'reservas' && (
        <div className="space-y-4">
          {myReservations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header with Code & Status */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-gray-100 px-2.5 py-0.5 rounded text-gray-800">
                          {res.id}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(res.fecha_creacion).toLocaleDateString('es-AR')}
                        </span>
                      </div>

                      {/* Status Selector */}
                      <select
                        value={res.estado}
                        onChange={(e) =>
                          updateReservationStatus(res.id, e.target.value as ReservationStatus)
                        }
                        className={`text-xs font-bold py-1 px-2.5 rounded-xl border cursor-pointer focus:outline-none ${
                          res.estado === 'retirada'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : res.estado === 'lista_para_retirar'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : res.estado === 'confirmada'
                            ? 'bg-teal-50 text-teal-800 border-teal-300'
                            : res.estado === 'cancelada'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="pendiente">🟡 Pendiente</option>
                        <option value="confirmada">🔵 Confirmada</option>
                        <option value="lista_para_retirar">🟢 Lista para retirar</option>
                        <option value="retirada">✅ Retirada</option>
                        <option value="cancelada">❌ Cancelada</option>
                      </select>
                    </div>

                    {/* Customer contact info */}
                    <div className="mt-3 text-xs space-y-1.5 text-gray-700">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{res.cliente_nombre || 'Consumidor'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <Phone className="w-3.5 h-3.5" />
                        <a href={`tel:${res.cliente_telefono}`} className="hover:underline">
                          {res.cliente_telefono || 'Sin teléfono'}
                        </a>
                      </div>
                    </div>

                    {/* Items in reservation */}
                    <div className="mt-3 space-y-1.5 bg-gray-50 p-3 rounded-2xl text-xs">
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

                  {/* Total & Quick action */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400">Total a cobrar: </span>
                      <strong className="text-emerald-700 font-black text-sm">
                        {formatCurrency(res.total)}
                      </strong>
                    </div>

                    {res.estado !== 'retirada' && res.estado !== 'cancelada' && (
                      <button
                        onClick={() => updateReservationStatus(res.id, 'retirada')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Concretar entrega: el producto asociado pasará automáticamente a estado Vendido"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Concretar Entrega (Vendido)</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs">
              <p className="text-gray-500 text-sm">Aún no recibiste reservas de clientes.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PERFIL Y DATOS DEL COMERCIO */}
      {activeTab === 'perfil' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs max-w-2xl">
          <h3 className="text-lg font-black text-gray-900 mb-1">Configuración del Proveedor</h3>
          <p className="text-xs text-gray-500 mb-6">
            Completá la información de tu establecimiento en Tandil para que los consumidores conozcan tu dirección y horarios de retiro.
          </p>

          {profileSavedMsg && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Datos del proveedor actualizados correctamente!</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nombre del proveedor o local *
              </label>
              <input
                type="text"
                required
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Categoría del proveedor
                </label>
                <select
                  value={merchantCategory}
                  onChange={(e) => setMerchantCategory(e.target.value as MerchantCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {MERCHANT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp de contacto
                </label>
                <input
                  type="text"
                  value={merchantPhone}
                  onChange={(e) => setMerchantPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Dirección física en Tandil, Buenos Aires *
              </label>
              <input
                type="text"
                required
                value={merchantAddress}
                onChange={(e) => setMerchantAddress(e.target.value)}
                placeholder="Ej. Av. España 750, Tandil, Buenos Aires"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Horario de apertura
                </label>
                <input
                  type="text"
                  value={merchantOpen}
                  onChange={(e) => setMerchantOpen(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Horario de cierre
                </label>
                <input
                  type="text"
                  value={merchantClose}
                  onChange={(e) => setMerchantClose(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Descripción o especialidad del proveedor
              </label>
              <textarea
                rows={3}
                value={merchantDesc}
                onChange={(e) => setMerchantDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Guardar datos del proveedor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
