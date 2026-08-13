import { useEffect, useState } from 'react';
import { Languages, X } from 'lucide-react';
import i18n from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import {
  useLanguage,
  getExplicitLanguage,
  rememberLanguageChoice,
} from '../../contexts/LanguageContext';
import { detectPreferredLang } from '../../lib/detectLanguage';
import type { Lang } from '../../i18n/routing';

/**
 * Bannière non-intrusive : si la langue détectée (navigateur, repli géo-IP) diffère
 * de la langue de la page, propose de basculer. Ne s'affiche que si aucun choix
 * explicite n'a été fait et que le visiteur n'est pas connecté.
 * Le texte est rendu DANS la langue suggérée (un anglophone lit l'anglais).
 */
export default function LanguageSuggestionBanner() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [suggested, setSuggested] = useState<Lang | null>(null);

  useEffect(() => {
    // Connecté → la préférence de compte fait foi. Choix explicite déjà fait → ne rien proposer.
    if (user || getExplicitLanguage()) {
      setSuggested(null);
      return;
    }
    let active = true;
    detectPreferredLang().then((lang) => {
      if (active) setSuggested(lang !== language ? lang : null);
    });
    return () => {
      active = false;
    };
  }, [user, language]);

  if (!suggested) return null;

  const t = i18n.getFixedT(suggested, 'common');

  const handleSwitch = () => {
    setSuggested(null);
    setLanguage(suggested); // marque le choix explicite + navigue
  };

  const handleDismiss = () => {
    rememberLanguageChoice(language); // « je reste » → ne plus reproposer
    setSuggested(null);
  };

  return (
    <div className="fixed top-[calc(var(--header-h)+0.75rem)] left-1/2 -translate-x-1/2 z-[45] px-4 w-full max-w-md animate-slide-down">
      <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 px-4 py-3">
        <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex-shrink-0">
          <Languages className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        </div>
        <p className="flex-1 text-sm text-neutral-700 dark:text-neutral-200 leading-snug">
          {t('langSuggest.message')}
        </p>
        <button
          onClick={handleSwitch}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
        >
          {t('langSuggest.switch')}
        </button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          aria-label={t('langSuggest.dismiss')}
          title={t('langSuggest.dismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
