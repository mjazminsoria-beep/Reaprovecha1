import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HomeHero } from './components/HomeHero';
import { ProductSearchCatalog } from './components/ProductSearchCatalog';
import { MerchantDashboard } from './components/MerchantDashboard';
import { ConsumerDashboard } from './components/ConsumerDashboard';
import { HowItWorksView } from './components/HowItWorksView';
import { ImpactView } from './components/ImpactView';
import { ReservationModal } from './components/ReservationModal';
import { AuthModal } from './components/AuthModal';
import { ProductPublishModal } from './components/ProductPublishModal';
import { Footer } from './components/Footer';

const AppContent: React.FC = () => {
  const { currentView } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Navigation Bar */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {currentView === 'home' && <HomeHero />}
        {currentView === 'catalogo' && <ProductSearchCatalog />}
        {currentView === 'como-funciona' && <HowItWorksView />}
        {currentView === 'impacto' && <ImpactView />}
        {currentView === 'panel-comercio' && <MerchantDashboard />}
        {currentView === 'mis-reservas' && <ConsumerDashboard initialTab="reservas" />}
        {currentView === 'mi-impacto' && <ConsumerDashboard initialTab="impacto" />}
      </main>

      {/* Global Modals & Dialogs */}
      <ReservationModal />
      <AuthModal />
      <ProductPublishModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
