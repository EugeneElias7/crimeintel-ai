import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/user';

interface ProtectedRouteProps {
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user) {
    const roleHierarchy: Record<UserRole, number> = {
      OFFICER: 0,
      INSPECTOR: 1,
      ADMIN: 2,
      SUPER_ADMIN: 3,
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-300">403</h1>
            <p className="mt-4 text-xl font-semibold text-gray-700">Access Denied</p>
            <p className="mt-2 text-gray-500">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
}