import { Navigate, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

interface RouteGuardProps {
  children: ReactElement;
}

export function ProtectedRoute({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Chargement de ta session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  return children;
}

export function AdminRoute({ children }: RouteGuardProps) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();
  const { addToast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Chargement de ta session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  if (userData?.role !== 'admin') {
    addToast('error', "Tu n'as pas les droits administrateur pour accéder à cette page.");
    return <Navigate to="/403" replace state={{ from: location }} />;
  }

  return children;
}

