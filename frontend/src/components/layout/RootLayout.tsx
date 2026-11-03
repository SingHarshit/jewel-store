import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import CartDrawer from './CartDrawer';
import SearchDrawer from './SearchDrawer';
import AuthDrawer from '../auth/AuthDrawer';
import CheckoutModal from '../checkout/CheckoutModal';
import Footer from './Footer';
import { useJewelryStore } from '../../store/useJewelryStore';

export default function RootLayout() {
  const { hydrateAuth } = useJewelryStore();

  // Re-hydrate auth state from localStorage on every app load
  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-alabaster)' }}>
      <AnnouncementBar />
      <Navbar />
      <SearchDrawer />
      <CartDrawer />
      <CheckoutModal />
      <AuthDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
