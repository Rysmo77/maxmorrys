import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANG, LANGS, getLangFromPath, type Lang } from './routing';

/**
 * Configuration i18n — squelette statique + namespaces à la demande.
 *
 * Les 23 namespaces étaient auparavant importés en statique dans les deux
 * langues : 382 Ko de JSON brut (~108 Ko gzip) dans le chunk d'entrée, soit plus
 * de la moitié de son poids, `admin` et `adminClub` compris. Un visiteur anonyme
 * de la page d'accueil téléchargeait les traductions de l'admin, en français
 * *et* en anglais.
 *
 * Restent statiques les seuls namespaces atteignables depuis le graphe
 * synchrone de `App.tsx` (~47 Ko brut). Ils le sont **dans les deux langues** :
 * les rendre asynchrones ferait clignoter des clés brutes au premier rendu, pour
 * ~6 Ko gzip de gain. Les 15 autres sont chargés par route, dans la langue
 * active uniquement — voir `loadNamespaces`.
 */

// --- Squelette public : statique, deux langues. ---
import commonFr from './locales/fr/common.json';
import commonEn from './locales/en/common.json';
import navFr from './locales/fr/nav.json';
import navEn from './locales/en/nav.json';
import footerFr from './locales/fr/footer.json';
import footerEn from './locales/en/footer.json';
import sharedFr from './locales/fr/shared.json';
import sharedEn from './locales/en/shared.json';
import homeFr from './locales/fr/home.json';
import homeEn from './locales/en/home.json';
import uiFr from './locales/fr/ui.json';
import uiEn from './locales/en/ui.json';
import errorsFr from './locales/fr/errors.json';
import errorsEn from './locales/en/errors.json';
// `formations` est requis par le graphe synchrone (Home, PopupManager,
// SearchOverlay, FormationCTA) — pas seulement par la page /formations.
import formationsFr from './locales/fr/formations.json';
import formationsEn from './locales/en/formations.json';

/** Namespaces présents dès le premier rendu, sans chargement. */
export const CORE_NAMESPACES = [
  'common',
  'nav',
  'footer',
  'shared',
  'home',
  'ui',
  'errors',
  'formations',
] as const;

/** Namespaces chargés à la demande, par route, dans la langue active. */
export const LAZY_NAMESPACES = [
  'about',
  'admin',
  'adminClub',
  'agency',
  'auth',
  'blog',
  'club',
  'contact',
  'faq',
  'legal',
  'lms',
  'lmsTabs',
  'media',
  'presence',
  'rysmo',
] as const;

export const NAMESPACES = [...CORE_NAMESPACES, ...LAZY_NAMESPACES] as const;

const resources = {
  fr: {
    common: commonFr,
    nav: navFr,
    footer: footerFr,
    shared: sharedFr,
    home: homeFr,
    ui: uiFr,
    errors: errorsFr,
    formations: formationsFr,
  },
  en: {
    common: commonEn,
    nav: navEn,
    footer: footerEn,
    shared: sharedEn,
    home: homeEn,
    ui: uiEn,
    errors: errorsEn,
    formations: formationsEn,
  },
};

/**
 * Chargeurs des namespaces à la demande, un chunk par fichier.
 *
 * Les motifs négatifs excluent les namespaces déjà statiques : sans eux, Vite
 * émettrait leur JSON une seconde fois dans un chunk qui ne serait jamais
 * demandé.
 */
const loaders = import.meta.glob<{ default: Record<string, unknown> }>([
  './locales/*/*.json',
  '!./locales/*/common.json',
  '!./locales/*/nav.json',
  '!./locales/*/footer.json',
  '!./locales/*/shared.json',
  '!./locales/*/home.json',
  '!./locales/*/ui.json',
  '!./locales/*/errors.json',
  '!./locales/*/formations.json',
]);

/** Clés `lang:ns` déjà enregistrées auprès d'i18next. */
const loaded = new Set<string>();
/** Chargements en cours, pour ne pas dédoubler une même paire. */
const inflight = new Map<string, Promise<void>>();
/**
 * Namespaces dynamiques déjà demandés, toutes langues confondues.
 *
 * Sert à la bascule de langue : il faut les recharger dans la nouvelle langue
 * *avant* `changeLanguage`, sinon les pages déjà montées affichent des clés
 * brutes (`useSuspense` est à false).
 */
const requested = new Set<string>();

/**
 * Langue à charger par défaut : celle du préfixe d'URL, pas `i18n.language`.
 *
 * À la bascule de langue, la navigation précède `changeLanguage` : se fier à
 * `i18n.language` chargerait les namespaces de la page cible dans la langue
 * qu'on est en train de quitter. Le préfixe d'URL est de toute façon la source
 * de vérité déclarée du routing multilingue.
 */
function currentLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  return getLangFromPath(window.location.pathname);
}

function loadOne(lang: Lang, ns: string): Promise<void> {
  const key = `${lang}:${ns}`;
  if (loaded.has(key)) return Promise.resolve();

  const running = inflight.get(key);
  if (running) return running;

  const loader = loaders[`./locales/${lang}/${ns}.json`];
  if (!loader) {
    // Namespace statique ou inconnu : rien à charger.
    loaded.add(key);
    return Promise.resolve();
  }

  const promise = loader()
    .then((mod) => {
      i18n.addResourceBundle(lang, ns, mod.default, true, true);
      loaded.add(key);
    })
    .catch(() => {
      // Chunk injoignable (déploiement en cours, réseau) : i18next retombe sur
      // la clé. Ne pas mémoriser l'échec — la prochaine navigation retentera.
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

/**
 * Charge des namespaces dans une langue donnée (par défaut la langue active).
 *
 * Appelé par les routes via `lazyWithReload`, en parallèle de l'import du
 * composant : le namespace est donc prêt avant le montage, sans clignotement.
 */
export function loadNamespaces(
  namespaces: readonly string[],
  lang: Lang = currentLang(),
): Promise<void> {
  for (const ns of namespaces) requested.add(ns);
  return Promise.all(namespaces.map((ns) => loadOne(lang, ns))).then(() => undefined);
}

/** Recharge dans `lang` tous les namespaces dynamiques déjà demandés. */
export function preloadRequestedNamespaces(lang: Lang): Promise<void> {
  return Promise.all([...requested].map((ns) => loadOne(lang, ns))).then(() => undefined);
}

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANG,
  fallbackLng: DEFAULT_LANG,
  supportedLngs: LANGS,
  ns: CORE_NAMESPACES,
  defaultNS: 'common',
  // Sans ceci, i18next considère qu'un namespace absent au boot ne viendra
  // jamais et met le composant en défaut avant que `addResourceBundle` n'arrive.
  partialBundledLanguages: true,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
