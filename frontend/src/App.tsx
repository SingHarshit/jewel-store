import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import RootLayout from './components/layout/RootLayout';
import HomePage from './pages/HomePage';
import CollectionPage from './pages/CollectionPage';
import ConfiguratorPage from './pages/ConfiguratorPage';
import AccountPage from './pages/AccountPage';
import SizingKitPage from './pages/SizingKitPage';
import BespokePage from './pages/BespokePage';
import StandardsPage from './pages/StandardsPage';
import AuthPage from './pages/AuthPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import { RequireAuth, RequireAdmin } from './components/auth/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'collections/:category', element: <CollectionPage /> },
      { path: 'configure/:slug', element: <ConfiguratorPage /> },

      // ── Protected: customer account ──
      {
        path: 'account',
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },

      { path: 'sizing-kit', element: <SizingKitPage /> },
      { path: 'bespoke', element: <BespokePage /> },
      { path: 'our-standards', element: <StandardsPage /> },

      // ── Auth routes (full-screen, nested in RootLayout for Navbar context) ──
      { path: 'login', element: <AuthPage /> },
      { path: 'register', element: <AuthPage /> },
      { path: 'forgot-password', element: <AuthPage /> },

      // ── Protected: Admin Dashboard ──
      {
        path: 'admin',
        element: (
          <RequireAdmin>
            <AdminDashboardPage />
          </RequireAdmin>
        ),
      },

      // ── Convenience redirects ──
      { path: 'rings',     element: <Navigate to="/collections/rings"    replace /> },
      { path: 'pendants',  element: <Navigate to="/collections/pendants" replace /> },
      { path: 'earrings',  element: <Navigate to="/collections/earrings" replace /> },
      { path: 'bracelets', element: <Navigate to="/collections/bracelets" replace /> },
      { path: 'necklaces', element: <Navigate to="/collections/all"      replace /> },
      { path: 'sign-in',   element: <Navigate to="/login"               replace /> },
      { path: 'sign-up',   element: <Navigate to="/register"            replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
