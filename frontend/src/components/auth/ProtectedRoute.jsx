import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectUser } from '../../store/slices/authSlice.js';

export function ProtectedRoute({ children, role }) {
  const isAuth = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const user = useSelector(selectUser);
  const isAuth = useSelector(selectIsAuthenticated);

  if (!isAuth || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
