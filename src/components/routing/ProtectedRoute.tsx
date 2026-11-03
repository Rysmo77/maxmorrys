import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@ds';
import { getLangFromPath, localizedPath } from '../../i18n/routing';
import { isSupportAllowedPath } from '../../lib/adminAccess';
import { tenterRelais } from '../../lib/sessionHandoff';
import LogoLoader from '../states/LogoLoader';

interface RouteGuardProps {
  children: ReactElement;
}

/** Au-delà, l'attente n'est plus « normale » : on le dit et on offre de recharger. */
const SESSION_SLOW_MS = 8000;

/*
  L'ÉCRAN D'ATTENTE DE SESSION (audit UI/UX du 03/11/2026, X13).

  Il restait blanc 3 à 15 s avec une seule ligne de texte : ni indicateur, ni délai maximal.
  Il porte maintenant le logo qui attend (le même que les navigations), et passe au bout de
  `SESSION_SLOW_MS` — ou tout de suite si le profil n'a pas pu être lu (`failed`) — à un état
  qui le dit et propose de recharger, au lieu d'attendre indéfiniment ou de refuser l'accès.
*/
function SessionLoader({ failed = false }: { failed?: boolean }) {
  const { t } = useTranslation('common');
  const [late, setLate] = useState(false);
  const slow = late || failed;
  useEffect(() => {
    if (failed) return undefined;
    const id = window.setTimeout(() => setLate(true), SESSION_SLOW_MS);
    return () => window.clearTimeout(id);
  }, [failed]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center bg-[color:var(--fill-1)] dark:bg-[color:var(--night-2)]">
      {!failed && <LogoLoader size="md" label={t('loadingSession')} />}
      <p className="text-sm text-ink-2" aria-live="polite">
        {slow ? t(failed ? 'sessionUnavailable' : 'loadingSessionSlow') : t('loadingSession')}
      </p>
      {slow && (
        <button
          type="button"
          className="text-sm font-semibold underline underline-offset-4"
          onClick={() => window.location.reload()}
        >
          {t('loadingSessionRetry')}
        </button>
      )}
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

  /* Personne ici, mais une session ouverte sur un autre espace : on va la chercher avant de
     demander une connexion (`lib/sessionRelais.ts`, audit E1 du 03/11/2026). */
  if (!user) {
    if (tenterRelais()) return <SessionLoader />;
    return <Navigate to={localizedPath('/connexion', lang)} replace state={{ from: location }} />;
  }

  return children;
}

/*
  LE PROFIL MANQUE-T-IL, OU N'EST-IL PAS ENCORE LÀ ? (X13)

  Juste après une connexion, `user` est posé avant `userData` : c'est une ATTENTE, pas un
  échec. On ne le distingue qu'en lisant le document soi-même : présent → on attend (et on
  relance la lecture du contexte) ; absent ou lecture refusée → `missing` (page 403) ; autre
  erreur → `error` (écran « profil non chargé », rechargeable). Firestore est importé à la
  demande, comme dans `AuthContext`, pour rester hors de la première vue.
*/
function useProfileProbe(active: boolean, uid: string | undefined, refresh: () => Promise<void>) {
  const [probe, setProbe] = useState<'pending' | 'missing' | 'error'>('pending');
  useEffect(() => {
    if (!active || !uid) { setProbe('pending'); return undefined; }
    let alive = true;
    (async () => {
      try {
        const [{ db }, { doc, getDoc }] = await Promise.all([import('../../config/db'), import('firebase/firestore')]);
        const snap = await getDoc(doc(db, 'users', uid));
        if (!alive) return;
        if (snap.exists()) await refresh();
        else setProbe('missing');
      } catch (error: unknown) {
        if (alive) setProbe((error as { code?: string })?.code === 'permission-denied' ? 'missing' : 'error');
      }
    })();
    return () => { alive = false; };
  }, [active, uid, refresh]);
  return probe;
}

export function AdminRoute({ children }: RouteGuardProps) {
  const { user, userData, loading, refreshUserData } = useAuth();
  const location = useLocation();
  const lang = getLangFromPath(location.pathname);
  const { addToast } = useToast();
  const { t } = useTranslation('common');
  const allowedRoles = ['admin', 'support'];
  /* Le refus n'est prononcé qu'une fois le rôle CONNU (X13) : pendant le chargement, ou si
     le profil n'a pas pu être lu, `userData` est nul — ce n'est pas un rôle insuffisant, et le
     toast « Tu n'as pas les droits » s'affichait par-dessus l'écran d'attente. */
  const roleKnown = !loading && !!user && !!userData;
  const isUnauthorized = roleKnown && !allowedRoles.includes(userData?.role ?? '');
  const probe = useProfileProbe(!loading && !!user && !userData, user?.uid, refreshUserData);

  useEffect(() => {
    if (isUnauthorized) {
      addToast('error', t('noAccess'));
    }
  }, [isUnauthorized, addToast, t]);

  if (loading) {
    return <SessionLoader />;
  }

  /* Personne ici, mais une session ouverte sur un autre espace : on va la chercher avant de
     demander une connexion (`lib/sessionRelais.ts`, audit E1 du 03/11/2026). */
  if (!user) {
    if (tenterRelais()) return <SessionLoader />;
    return <Navigate to={localizedPath('/connexion', lang)} replace state={{ from: location }} />;
  }

  if (!userData) {
    if (probe === 'missing') return <Navigate to={localizedPath('/403', lang)} replace state={{ from: location }} />;
    return <SessionLoader failed={probe === 'error'} />;
  }

  if (!allowedRoles.includes(userData.role ?? '')) {
    return <Navigate to={localizedPath('/403', lang)} replace state={{ from: location }} />;
  }

  // Le rôle `support` n'a accès qu'à une partie de l'espace d'administration. Le drapeau
  // existait dans la table de navigation, mais il n'y masquait qu'un menu : taper l'URL
  // suffisait à atteindre les transactions, les utilisateurs et les paramètres.
  // La table vit désormais dans `lib/adminAccess`, lue ici ET par le menu.
  if (userData?.role === 'support' && !isSupportAllowedPath(location.pathname)) {
    return <Navigate to={localizedPath('/403', lang)} replace state={{ from: location }} />;
  }

  return children;
}

