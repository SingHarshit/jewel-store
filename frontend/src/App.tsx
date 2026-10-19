import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import RootLayout from './components/layout/RootLayout';
import HomePage from './pages/HomePage';
import CollectionPage from './pages/CollectionPage';
import ConfiguratorPage from './pages/ConfiguratorPage';
import AccountPage from './pages/AccountPage';
import SizingKitPage from './pages/SizingKitPage';
import BespokePage from './pages/BespokePage';
import StandardsPage from './pages/StandardsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'collections/:category', element: <CollectionPage /> },
      { path: 'configure/:slug', element: <ConfiguratorPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'sizing-kit', element: <SizingKitPage /> },
      { path: 'bespoke', element: <BespokePage /> },
      { path: 'our-standards', element: <StandardsPage /> },
      // Convenience redirects
      { path: 'rings', element: <Navigate to="/collections/rings" replace /> },
      { path: 'pendants', element: <Navigate to="/collections/pendants" replace /> },
      { path: 'earrings', element: <Navigate to="/collections/earrings" replace /> },
      { path: 'bracelets', element: <Navigate to="/collections/bracelets" replace /> },
      { path: 'necklaces', element: <Navigate to="/collections/all" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
