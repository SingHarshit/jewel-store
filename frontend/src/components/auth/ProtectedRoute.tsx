import { Navigate, useLocation } from 'react-router-dom';
import { useJewelryStore } from '../../store/useJewelryStore';

// ──────────────────────────────────────────────────────────────
// <RequireAuth>
// Guards any route that requires a logged-in user (e.g. /account)
// Redirects to /login if not authenticated, preserving the
// original destination for post-login redirect.
// ──────────────────────────────────────────────────────────────
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useJewelryStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}

// ──────────────────────────────────────────────────────────────
// <RequireAdmin>
// Guards any route under /admin — requires role === 'admin'.
// Non-admin authenticated users are redirected to / with a
// toast-style notification injected via URL param.
// Unauthenticated visitors are redirected to /login.
// ──────────────────────────────────────────────────────────────
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authUser } = useJewelryStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (authUser?.role !== 'admin') {
    // Redirect to home with an unauthorized flag that the layout can pick up
    return <Navigate to="/?unauthorized=1" replace />;
  }

  return <>{children}</>;
}
