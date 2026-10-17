import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Merchant, UserRole } from '../types';
import { apiClient } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  currentMerchant: Merchant | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setActiveRole: (role: UserRole) => void;
  quickSwitchUser: (user: User, merchant?: Merchant) => void;
  refreshMerchantProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'reaprovecha_auth_user';
const AUTH_MERCHANT_KEY = 'reaprovecha_auth_merchant';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentMerchant, setCurrentMerchant] = useState<Merchant | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_MERCHANT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return currentUser?.tipo_usuario || 'consumidor';
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
      setActiveRole(currentUser.tipo_usuario);
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentMerchant) {
      localStorage.setItem(AUTH_MERCHANT_KEY, JSON.stringify(currentMerchant));
    } else {
      localStorage.removeItem(AUTH_MERCHANT_KEY);
    }
  }, [currentMerchant]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(email, password);
      setCurrentUser(response.user);
      setCurrentMerchant(response.merchant || null);
      setActiveRole(response.user.tipo_usuario);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await apiClient.register(data);
      setCurrentUser(response.user);
      setCurrentMerchant(response.merchant || null);
      setActiveRole(response.user.tipo_usuario);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentMerchant(null);
    setActiveRole('consumidor');
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_MERCHANT_KEY);
  };

  const quickSwitchUser = (user: User, merchant?: Merchant) => {
    setCurrentUser(user);
    setCurrentMerchant(merchant || null);
    setActiveRole(user.tipo_usuario);
  };

  const refreshMerchantProfile = async () => {
    if (!currentUser || currentUser.tipo_usuario !== 'comercio') return;
    try {
      const m = await apiClient.getMerchantByUserId(currentUser.id);
      setCurrentMerchant(m);
    } catch (e) {
      console.warn('Could not refresh merchant:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentMerchant,
        activeRole,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        register,
        logout,
        setActiveRole,
        quickSwitchUser,
        refreshMerchantProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
