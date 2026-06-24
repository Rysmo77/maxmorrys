import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import i18n from '../i18n';
import { getLangFromPath, localizedPath, type Lang } from '../i18n/routing';
import { useAuth } from './AuthContext';
import { updateUserProfile } from '../lib/firestore';

interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'mm-lang';

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

  // Au tout premier rendu : si l'utilisateur a déjà choisi l'anglais (localStorage)
  // et arrive sur une URL non préfixée, le rediriger vers /en. Une seule fois par session.
  useEffect(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    if (language !== 'fr') return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch { /* ignore */ }
    if (stored === 'en') {
      const target = localizedPath(location.pathname, 'en') + location.search + location.hash;
      navigate(target, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronise i18next + localStorage + <html lang> quand la langue d'URL change.
  useEffect(() => {
    if (i18n.language !== language) i18n.changeLanguage(language);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch { /* stockage indisponible (mode privé) */ }
    document.documentElement.lang = language;
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
        await updateUserProfile(user.uid, {
          preferences: { ...userData.preferences, language },
        });
        await refreshUserData();
      } catch { /* échec silencieux — non bloquant */ }
    })();
  }, [language, user, userData, refreshUserData]);

  const setLanguage = (lang: Lang) => {
    if (lang === language) return;
    const target = localizedPath(location.pathname, lang) + location.search + location.hash;
    navigate(target);
  };

  const toggleLanguage = () => setLanguage(language === 'fr' ? 'en' : 'fr');

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
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
