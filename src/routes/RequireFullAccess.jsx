import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Keeps view-only dashboard-link sessions out of settings pages.
export default function RequireFullAccess() {
  const { auth } = useAuth();
  if (auth?.readOnly) return <Navigate to="/events" replace />;
  return <Outlet />;
}
