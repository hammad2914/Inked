import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAuthStore();
  const location = useLocation();

  // Still checking the refresh token — don't redirect yet
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-base">
        <Loader2 className="h-8 w-8 animate-spin text-indigo" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // Redirect members away from admin-only pages
    return <Navigate to={user.role === 'MEMBER' ? '/my-tasks' : '/projects'} replace />;
  }

  return <>{children}</>;
}
