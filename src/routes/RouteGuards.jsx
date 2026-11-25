import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { canAccessRoute, DEFAULT_AUTHENTICATED_PATH } from './registry';

export function ProtectedRoute() {
  const { session } = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const { session } = useSession();
  return session ? <Navigate to={DEFAULT_AUTHENTICATED_PATH} replace /> : children;
}

export function RouteGuard({ route, children }) {
  const { session } = useSession();
  const location = useLocation();

  if (!canAccessRoute(session, route)) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  }
  return children;
}
