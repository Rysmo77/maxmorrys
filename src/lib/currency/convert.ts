import type { Lang } from '../../i18n/routing';

/**
 * LE PRIX D'À CÔTÉ — la contrevaleur affichée en euro (FR) ou en dollar US (EN).
 *
 * ⚠️ CE MODULE NE DÉCIDE JAMAIS D'UN MONTANT DÉBITÉ. Le franc CFA reste la seule devise de
 * transaction : Bictorys encaisse en XOF, le serveur recalcule en XOF, les CGV engagent en
 * XOF. Ce qui sort d'ici est une AIDE À LA LECTURE pour quelqu'un qui ne compte pas en
 * francs — la diaspora en Europe pour le français, le reste du monde pour l'anglais.
 *
 * D'où trois règles qui tiennent tout le dessin :
 *
 *   1. La contrevaleur ne remplace jamais le prix en FCFA — elle se pose SOUS lui, plus
 *      petite, en encre secondaire. Un visiteur doit toujours pouvoir lire le montant qui
 *      sera prélevé sur son compte.
 *   2. Elle n'est jamais cliquable, jamais dans un bouton, jamais dans un champ de
 *      formulaire. Un montant sur lequel on agit doit être celui qu'on paie.
 *   3. Elle porte toujours son « ≈ » et sa provenance. Ce sont deux natures différentes,
 *      et la deuxième règle du design system s'applique aux deux : un nombre affiché dit
 *      d'où il vient.
 *
 * ── LES DEUX DEVISES NE SONT PAS DE MÊME NATURE ──────────────────────────────────────────
 *
 * L'EURO EST UNE PARITÉ FIXE, garantie par le Trésor français depuis 1999 :
 * 1 € = 655,957 FCFA, à la virgule près, sans date de péremption. La contrevaleur en euro
 * ne vieillira pas. Elle n'est approximative que par l'arrondi de lisibilité appliqué plus
 * bas — pas par le change.
 *
 * LE DOLLAR FLOTTE. Il n'existe aucune parité XOF/USD : on passe donc par l'euro, seul
 * ancrage réel, et le taux EUR/USD est un relevé DATÉ qui dérivera. C'est la seule valeur
 * de ce fichier qu'un humain doit rafraîchir.
 *
 * ⚠️ POUR RAFRAÎCHIR LE DOLLAR : mettre à jour `EUR_USD` **et** `FX_AS_OF` ensemble, jamais
 * l'un sans l'autre — un taux neuf sous une vieille date ment plus qu'un taux vieux sous sa
 * vraie date. `tests/unit/currency-convert.test.ts` vérifie leur cohérence.
 */

export type SecondaryCurrency = 'EUR' | 'USD';

/**
 * Ce qu'on montre à côté du franc, selon la langue de la page.
 *
 * La langue vient du préfixe d'URL (`/en`), pas du pays du visiteur : c'est une aide à la
 * lecture, pas une localisation commerciale. Un Sénégalais qui lit le site en anglais verra
 * des dollars et paiera en francs — la ligne FCFA est juste au-dessus, elle ne bouge pas.
 */
export const SECONDARY_CURRENCY: Record<Lang, SecondaryCurrency> = { fr: 'EUR', en: 'USD' };

/** Parité fixe franc CFA / euro. Exacte, garantie par le Trésor, sans date de péremption. */
export const XOF_PER_EUR = 655.957;

/** Relevé EUR/USD. LA SEULE VALEUR PÉRISSABLE DU FICHIER — voir l'avertissement en tête. */
export const EUR_USD = 1.161;

/** Date du relevé `EUR_USD`. Se met à jour avec lui, jamais séparément. */
export const FX_AS_OF = new Date('2026-09-03T00:00:00Z');

/**
 * Au-delà, le taux dollar est réputé vieux et mérite un coup d'œil humain.
 * Ce n'est PAS une barrière qui casse la CI un matin au hasard : la contrevaleur continue
 * de s'afficher, datée, parce qu'un chiffre daté vaut mieux qu'un trou. Le test se contente
 * de le signaler.
 */
export const FX_STALE_AFTER_DAYS = 180;

/** Combien de francs pour une unité de la devise secondaire. */
export function xofPerUnit(currency: SecondaryCurrency): number {
  return currency === 'EUR' ? XOF_PER_EUR : XOF_PER_EUR / EUR_USD;
}

/**
 * L'ARRONDI DE LISIBILITÉ, et pourquoi il monte par paliers.
 *
 * 19 900 FCFA valent 30,3373... €. Personne ne lit ça — et surtout, une décimale de trop
 * fait passer une estimation pour un prix ferme. On arrondit donc à un cran proportionnel
 * au montant : un dixième sous 3, un demi sous 10, l'unité sous 100, cinq sous 1 000, dix
 * sous 10 000, cinquante au-delà. Le nombre garde la forme d'un ordre de grandeur au lieu
 * de celle d'un tarif.
 *
 * LES DEUX CRANS DU BAS SONT LES SEULS QUI ONT DEMANDÉ RÉFLEXION, parce que c'est là que
 * l'erreur relative explose — un demi-cran sur 1,77 $, c'est 13 % :
 *
 *   • Sous 10, le demi-cran évite de surestimer l'équivalent MENSUEL du Club : 1 658 FCFA
 *     font 2,53 € et arrondir à 3 € surestime de 19 %, précisément sur le chiffre qui sert
 *     à dédramatiser le prix annuel.
 *   • Sous 3, le dixième existe pour les options à la carte, qui démarrent à 1 000 FCFA —
 *     1,53 € ou 1,77 $. Le demi-cran y ramenait 1,77 $ à 2 $, soit 13 % d'écart sur le seul
 *     montant du catalogue assez petit pour que ça se voie.
 *
 * TOLÉRANCE ASSUMÉE : 5 % au pire, atteint juste au-dessus d'un changement de palier, et
 * sous 0,5 % sur tous les montants à trois chiffres et plus. C'est un arrondi de LISIBILITÉ :
 * « ≈ 2,50 € » se lit, « ≈ 2,55 € » se recompte. Le montant exact, lui, est en francs juste
 * au-dessus. `tests/unit/currency-convert.test.ts` tient cette borne.
 */
function roundForDisplay(value: number): number {
  const step = value < 3 ? 0.1
    : value < 10 ? 0.5
      : value < 100 ? 1
        : value < 1_000 ? 5
          : value < 10_000 ? 10 : 50;
  // Le passage par l'entier évite qu'un pas décimal traîne un artefact binaire (0,1 × 3).
  return Math.round(Math.round(value / step) * step * 100) / 100;
}

/** La contrevaleur, arrondie pour l'affichage. `null` quand il n'y a rien à convertir. */
export function convertFromXof(xof: number, currency: SecondaryCurrency): number | null {
  if (!Number.isFinite(xof) || xof <= 0) return null;
  return roundForDisplay(xof / xofPerUnit(currency));
}

/**
 * La contrevaleur, écrite. « ≈ 30 € » en français, « ≈ $35 » en anglais.
 *
 * Le « ≈ » est porté ici et pas dans la copie i18n : il n'est pas décoratif et ne se traduit
 * pas. L'oublier une seule fois transformerait une estimation en second prix affiché.
 *
 * Deux décimales ou zéro, jamais une : « 2,50 € » est un prix, « 2,5 € » est un calcul.
 */
export function formatSecondary(xof: number, lang: Lang, locale: string): string | null {
  const currency = SECONDARY_CURRENCY[lang];
  const value = convertFromXof(xof, currency);
  if (value === null) return null;

  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  const written = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

  /*
    U+00A0 — espace INSÉCABLE, et écrite en échappement plutôt qu'au clavier. Insécable
    parce qu'un « ≈ » resté seul en fin de ligne ne signale plus rien : il devient une
    puce. En échappement parce qu'elle est indiscernable d'une espace ordinaire dans un
    diff, et que la supprimer par inadvertance ne se verrait qu'au repli d'une carte
    étroite. `no-irregular-whitespace` refuse d'ailleurs la forme littérale, à raison.
  */
  return `\u2248\u00a0${written}`;
}

/** Vrai quand le relevé dollar a dépassé `FX_STALE_AFTER_DAYS`. Sert au test, pas à l'UI. */
export function isFxStale(now: Date = new Date()): boolean {
  const days = (now.getTime() - FX_AS_OF.getTime()) / 86_400_000;
  return days > FX_STALE_AFTER_DAYS;
}
