import { useEffect, useState } from 'react';
import i18n from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import {
  useLanguage,
  getExplicitLanguage,
  rememberLanguageChoice,
} from '../../contexts/LanguageContext';
import { detectPreferredLang } from '../../lib/detectLanguage';
import type { Lang } from '../../i18n/routing';
import { Icon } from '@ds';

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

  /*
   * ── CENTRÉ PAR LES MARGES, PAS PAR UNE TRANSFORMATION ──────────────────────────────
   *
   * Le centrage passait par `left-1/2 -translate-x-1/2`. Or `mm-drop` est une animation
   * d'entrée qui finit sur `transform: none`, en `animation-fill-mode: both` : la valeur
   * finale RESTE appliquée, et elle efface le `-translate-x-1/2`. Le bandeau posait donc son
   * bord gauche au milieu de l'écran — décentré de la moitié de sa largeur, PARTOUT, pas
   * seulement sur mobile. À 375 px il sortait de la fenêtre et faisait défiler la page de
   * côté (document mesuré à 419 px).
   *
   * `left-0 right-0 mx-auto` centre sans toucher à `transform`, donc l'animation reste libre
   * de la sienne. Les deux mécanismes cessent de se disputer la même propriété.
   */
  return (
    <div className="fixed top-[calc(var(--header-h)+0.75rem)] left-0 right-0 mx-auto z-[45] px-4 w-full max-w-md mm-drop">
      <div className="flex items-center gap-3 bg-surface-sheet rounded-2xl shadow-xl border border-[color:var(--line)] px-4 py-3">
        <div className="p-1.5 bg-[color-mix(in_srgb,var(--mm-bleu)_4%,transparent)] rounded-lg flex-shrink-0">
          <Icon name="languages" size={16} className="text-forme" />
        </div>
        <p className="flex-1 text-sm text-ink-2 leading-snug">
          {t('langSuggest.message')}
        </p>
        <button
          onClick={handleSwitch}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-forme hover:bg-forme text-white text-xs font-semibold transition-colors"
        >
          {t('langSuggest.switch')}
        </button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-ink-2 hover:text-ink-2 dark:hover:text-ink-2"
          aria-label={t('langSuggest.dismiss')}
          title={t('langSuggest.dismiss')}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}
