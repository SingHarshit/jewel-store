import { Outlet } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';
import CartDrawer from './CartDrawer';
import SearchDrawer from './SearchDrawer';
import Footer from './Footer';

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-alabaster)' }}>
      <AnnouncementBar />
      <Navbar />
      <SearchDrawer />
      <CartDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
