import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/** Redirects authenticated users to the correct home page for their role. */
export function RoleRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'COMPANY_ADMIN' || user.role === 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/my-tasks" replace />;
}
