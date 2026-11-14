import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { AppLayout } from '../layout/AppLayout';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  // Render high-tech branded loading screen while checking credentials
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If arriving at a protected route with OAuth callback parameters, delegate to /auth/callback
  if (
    location.search.includes('code=') ||
    location.search.includes('error=') ||
    location.hash.includes('access_token=') ||
    location.hash.includes('error=')
  ) {
    return <Navigate to={`/auth/callback${location.search}${location.hash}`} replace />;
  }

  // Strictly require authentication for all protected routes
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific staff roles are required (e.g. admin or volunteer), verify role
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

