import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Merchant,
  Reservation,
  GlobalImpactStats,
  UserPersonalImpact,
  ProductFilters,
  ReservationStatus,
  ProductStatus,
} from '../types';
import { apiClient } from '../services/api';
import { useAuth } from './AuthContext';

export type AppView =
  | 'home'
  | 'catalogo'
  | 'como-funciona'
  | 'impacto'
  | 'panel-comercio'
  | 'mis-reservas'
  | 'mi-impacto';

interface AppContextType {
  products: Product[];
  merchants: Merchant[];
  globalImpact: GlobalImpactStats | null;
  userImpact: UserPersonalImpact | null;
  userReservations: Reservation[];
  merchantReservations: Reservation[];
  isLoadingProducts: boolean;
  filters: ProductFilters;
  currentView: AppView;
  activeReservationProduct: Product | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register-consumer' | 'register-merchant';
  isPublishModalOpen: boolean;
  productToEdit: Product | null;
  setFilters: React.Dispatch<React.SetStateAction<ProductFilters>>;
  updateFilter: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
  resetFilters: () => void;
  setCurrentView: (view: AppView) => void;
  openReservationModal: (product: Product) => void;
  closeReservationModal: () => void;
  openAuthModal: (tab?: 'login' | 'register-consumer' | 'register-merchant') => void;
  closeAuthModal: () => void;
  openPublishModal: (product?: Product) => void;
  closePublishModal: () => void;
  refreshProducts: () => Promise<void>;
  refreshMerchants: () => Promise<void>;
  refreshReservations: () => Promise<void>;
  refreshImpact: () => Promise<void>;
  createReservation: (data: {
    productId: string;
    quantity: number;
    cliente_nombre?: string;
    cliente_telefono?: string;
    cliente_email?: string;
  }) => Promise<{ success: boolean; reservation?: Reservation; message: string }>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
  saveProduct: (productData: any) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleProductStatus: (productId: string, currentStatus: Product['estado']) => Promise<void>;
  setProductStatus: (productId: string, status: ProductStatus) => Promise<void>;
  updateProductStock: (productId: string, newStock: number) => Promise<void>;
  resetDatabaseDemo: () => Promise<void>;
}

const defaultFilters: ProductFilters = {
  searchQuery: '',
  category: 'Todas',
  merchantId: 'Todos',
  maxDistanceKm: 15,
  maxPrice: 0,
  minDiscountPercent: 0,
  pickupTodayOnly: false,
  sortBy: 'cercanos',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, currentMerchant, activeRole } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [globalImpact, setGlobalImpact] = useState<GlobalImpactStats | null>(null);
  const [userImpact, setUserImpact] = useState<UserPersonalImpact | null>(null);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [merchantReservations, setMerchantReservations] = useState<Reservation[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [currentView, setCurrentView] = useState<AppView>('home');

  const [activeReservationProduct, setActiveReservationProduct] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register-consumer' | 'register-merchant'>('login');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Load products based on filters
  const refreshProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const data = await apiClient.getProducts(filters);
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [filters]);

  const refreshMerchants = useCallback(async () => {
    try {
      const data = await apiClient.getMerchants();
      setMerchants(data);
    } catch (err) {
      console.error('Failed to fetch merchants:', err);
    }
  }, []);

  const refreshImpact = useCallback(async () => {
    try {
      const global = await apiClient.getGlobalImpact();
      setGlobalImpact(global);

      if (currentUser) {
        const personal = await apiClient.getUserImpact(currentUser.id);
        setUserImpact(personal);
      }
    } catch (err) {
      console.error('Failed to fetch impact:', err);
    }
  }, [currentUser]);

  const refreshReservations = useCallback(async () => {
    try {
      if (currentUser?.id) {
        try {
          const userRes = await apiClient.getUserReservations(currentUser.id);
          setUserReservations(userRes);
        } catch (e) {
          console.warn('Error fetching user reservations from Neon:', e);
        }
      } else {
        setUserReservations([]);
      }

      if (currentMerchant) {
        const merchantRes = await apiClient.getMerchantReservations(currentMerchant.id);
        setMerchantReservations(merchantRes);
      }
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    }
  }, [currentUser, currentMerchant]);

  // Initial load
  useEffect(() => {
    refreshProducts();
    refreshMerchants();
    refreshImpact();
  }, [refreshProducts, refreshMerchants, refreshImpact]);

  // Load user/merchant specific data on auth change
  useEffect(() => {
    refreshReservations();
    refreshImpact();
  }, [currentUser, currentMerchant, refreshReservations, refreshImpact]);

  const updateFilter = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const openReservationModal = (product: Product) => {
    setActiveReservationProduct(product);
  };

  const closeReservationModal = () => {
    setActiveReservationProduct(null);
  };

  const openAuthModal = (tab: 'login' | 'register-consumer' | 'register-merchant' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openPublishModal = (product?: Product) => {
    setProductToEdit(product || null);
    setIsPublishModalOpen(true);
  };

  const closePublishModal = () => {
    setProductToEdit(null);
    setIsPublishModalOpen(false);
  };

  const createReservation = async (data: {
    productId: string;
    quantity: number;
    cliente_nombre?: string;
    cliente_telefono?: string;
    cliente_email?: string;
  }) => {
    if (!currentUser) {
      throw new Error('Tenés que iniciar sesión para reservar.');
    }

    const res = await apiClient.createReservation({
      usuario_id: currentUser.id,
      producto_id: data.productId,
      cantidad: data.quantity,
      cliente_nombre: data.cliente_nombre || currentUser.nombre,
      cliente_telefono: data.cliente_telefono || currentUser.telefono,
      cliente_email: data.cliente_email || currentUser.email,
    });

    if (res.success && res.reservation) {
      setUserReservations((prev) => [res.reservation!, ...prev.filter((r) => r.id !== res.reservation!.id)]);

      // Refresh products and impact from Neon
      refreshProducts();
      refreshImpact();
    }
    return res;
  };

  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    await apiClient.updateReservationStatus(id, status);
    await Promise.all([refreshReservations(), refreshProducts(), refreshImpact()]);
  };

  const saveProduct = async (productData: any) => {
    let saved: Product;
    if (productToEdit) {
      saved = await apiClient.updateProduct(productToEdit.id, productData);
    } else {
      saved = await apiClient.createProduct(productData);
    }
    refreshProducts();
    closePublishModal();
    return saved;
  };

  const deleteProduct = async (productId: string) => {
    await apiClient.deleteProduct(productId);
    refreshProducts();
  };

  const toggleProductStatus = async (productId: string, currentStatus: Product['estado']) => {
    const nextStatus = currentStatus === 'retirado' ? 'disponible' : 'retirado';
    await apiClient.setProductStatus(productId, nextStatus);
    refreshProducts();
  };

  const setProductStatus = async (productId: string, status: Product['estado']) => {
    await apiClient.setProductStatus(productId, status);
    refreshProducts();
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    await apiClient.updateProductStock(productId, newStock);
    refreshProducts();
  };

  const resetDatabaseDemo = async () => {
    await apiClient.resetSeedDatabase();
    refreshProducts();
    refreshMerchants();
    refreshReservations();
    refreshImpact();
  };

  return (
    <AppContext.Provider
      value={{
        products,
        merchants,
        globalImpact,
        userImpact,
        userReservations,
        merchantReservations,
        isLoadingProducts,
        filters,
        currentView,
        activeReservationProduct,
        isAuthModalOpen,
        authModalTab,
        isPublishModalOpen,
        productToEdit,
        setFilters,
        updateFilter,
        resetFilters,
        setCurrentView,
        openReservationModal,
        closeReservationModal,
        openAuthModal,
        closeAuthModal,
        openPublishModal,
        closePublishModal,
        refreshProducts,
        refreshMerchants,
        refreshReservations,
        refreshImpact,
        createReservation,
        updateReservationStatus,
        saveProduct,
        deleteProduct,
        toggleProductStatus,
        setProductStatus,
        updateProductStock,
        resetDatabaseDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
