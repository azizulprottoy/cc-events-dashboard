import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role }) {
  const { auth } = useAuth();

  if (!auth || auth.role !== role) {
    return <Navigate to={role === 'superadmin' ? '/admin/login' : '/login'} replace />;
  }

  return <Outlet />;
}
