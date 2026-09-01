import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import i18n, { preloadRequestedNamespaces } from '../i18n';
import { getLangFromPath, localizedPath, type Lang } from '../i18n/routing';
import { useAuth } from './AuthContext';
// Imports directs plutôt que via le barrel `lib/firestore` : celui-ci fait
// `export *` sur 17 modules, ce qui en tirait plusieurs dans le chunk d'entrée.

interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'mm-lang';
// Choix EXPLICITE de langue (toggle, settings, bannière) — distinct de `mm-lang`
// qui est réécrit à chaque page. Pilote la bannière de suggestion + la redirection de retour.
const EXPLICIT_KEY = 'mm-lang-explicit';

/** Mémorise un choix de langue explicite (lecture via `getExplicitLanguage`). */
export function rememberLanguageChoice(lang: Lang): void {
  try {
    localStorage.setItem(EXPLICIT_KEY, lang);
  } catch { /* stockage indisponible */ }
}

/** Renvoie la langue explicitement choisie par l'utilisateur, ou null. */
export function getExplicitLanguage(): Lang | null {
  try {
    const v = localStorage.getItem(EXPLICIT_KEY);
    return v === 'fr' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Fournisseur de langue. La source de vérité est le préfixe d'URL (/en).
 * Synchronise i18next, localStorage et la préférence utilisateur Firestore.
 * DOIT être rendu à l'intérieur du Router (utilise useLocation/useNavigate).
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData, refreshUserData } = useAuth();
  const language = getLangFromPath(location.pathname);
  const syncedPrefRef = useRef<Lang | null>(null);
  const redirectedRef = useRef(false);

  // Au tout premier rendu : honorer un CHOIX EXPLICITE de langue précédent.
  // Si l'utilisateur a déjà choisi une langue et arrive sur une URL d'une autre
  // langue, le rediriger vers sa version. Une seule fois par session.
  useEffect(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    const explicit = getExplicitLanguage();
    if (explicit && explicit !== language) {
      const target = localizedPath(location.pathname, explicit) + location.search + location.hash;
      navigate(target, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronise i18next + localStorage + <html lang> quand la langue d'URL change.
  useEffect(() => {
    let cancelled = false;
    if (i18n.language !== language) {
      // Les namespaces chargés à la demande n'existent que dans la langue où ils
      // ont été demandés : il faut les avoir dans la nouvelle AVANT de basculer,
      // sinon les pages montées affichent des clés brutes (`useSuspense: false`).
      // `preloadRequestedNamespaces` ne rejette jamais.
      void preloadRequestedNamespaces(language).then(() => {
        if (!cancelled) void i18n.changeLanguage(language);
      });
    }
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch { /* stockage indisponible (mode privé) */ }
    document.documentElement.lang = language;
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Persiste la préférence sur le profil utilisateur connecté (une fois par changement réel).
  useEffect(() => {
    if (!user || !userData) return;
    if (userData.preferences?.language === language) {
      syncedPrefRef.current = language;
      return;
    }
    if (syncedPrefRef.current === language) return;
    syncedPrefRef.current = language;
    (async () => {
      try {
        /* Chargé à la demande : ce contexte est monté au démarrage, et un import
           statique d'ici faisait entrer tout le SDK Firestore dans la première vue —
           pour une écriture qui n'arrive QUE si quelqu'un de connecté change de langue. */
        const { updateUserProfile } = await import('../lib/firestore/users');
        await updateUserProfile(user.uid, {
          preferences: { ...userData.preferences, language },
        });
        await refreshUserData();
      } catch { /* échec silencieux — non bloquant */ }
    })();
  }, [language, user, userData, refreshUserData]);

  const setLanguage = useCallback((lang: Lang) => {
    rememberLanguageChoice(lang); // tout choix via toggle/settings/bannière est explicite
    if (lang === language) return;
    const target = localizedPath(location.pathname, lang) + location.search + location.hash;
    navigate(target);
  }, [language, location.pathname, location.search, location.hash, navigate]);

  const toggleLanguage = useCallback(
    () => setLanguage(language === 'fr' ? 'en' : 'fr'),
    [language, setLanguage],
  );

  /*
    Ce provider appelle `useLocation` : il re-rend donc à CHAQUE navigation.
    Sans ce memo, tous les consommateurs de `useLanguage()` — dont l'en-tête et
    le pied de page — re-rendaient à chaque changement de page alors que la
    langue, elle, ne change presque jamais.
  */
  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage }),
    [language, setLanguage, toggleLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

/** Renvoie une fonction qui préfixe un chemin absolu selon la langue active (/en…). */
export function useLocalizedPath() {
  const { language } = useLanguage();
  return useCallback((path: string) => localizedPath(path, language), [language]);
}
