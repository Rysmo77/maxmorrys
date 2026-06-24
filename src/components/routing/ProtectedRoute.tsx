import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { getLangFromPath, localizedPath } from '../../i18n/routing';

interface RouteGuardProps {
  children: ReactElement;
}

function SessionLoader() {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('loadingSession')}</p>
    </div>
  );
}

export function ProtectedRoute({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const lang = getLangFromPath(location.pathname);

  if (loading) {
    return <SessionLoader />;
  }

  if (!user) {
    return <Navigate to={localizedPath('/connexion', lang)} replace state={{ from: location }} />;
  }

  return children;
}

export function AdminRoute({ children }: RouteGuardProps) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();
  const lang = getLangFromPath(location.pathname);
  const { addToast } = useToast();
  const { t } = useTranslation('common');
  const allowedRoles = ['admin', 'support'];
  const isUnauthorized = !!user && !allowedRoles.includes(userData?.role ?? '');

  useEffect(() => {
    if (isUnauthorized) {
      addToast('error', t('noAccess'));
    }
  }, [isUnauthorized, addToast, t]);

  if (loading) {
    return <SessionLoader />;
  }

  if (!user) {
    return <Navigate to={localizedPath('/connexion', lang)} replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(userData?.role ?? '')) {
    return <Navigate to={localizedPath('/403', lang)} replace state={{ from: location }} />;
  }

  return children;
}

