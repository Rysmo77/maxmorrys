/**
 * LES TERRITOIRES DE MARQUE, projetés en classes utilitaires.
 *
 * Chaque surface publique appartient à un territoire, et le territoire porte un VERBE — c'est
 * la navigation elle-même : *Je suis Max-Morrys · Je te forme · Je t'informe · Je te transforme ·
 * Je te digitalise · Contacte-moi*. La couleur n'est pas une décoration posée sur la page :
 * elle EST le fond, sous forme d'un maillage de dégradés, sur lequel l'interface flotte.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A CHANGÉ PAR RAPPORT À LA VERSION PRÉCÉDENTE, ET POURQUOI
 *
 * 1. AUCUN VARIANT `dark:`. C'était la moitié de chaque ligne. Les jetons basculent seuls
 *    sous la portée `.dk` : `text-forme` vaut #0057BC en clair et #6FB1FF en nuit, sans que
 *    personne ait à l'écrire. Une classe `dark:` de couleur oubliée était un défaut invisible
 *    pour qui ne teste pas le mode sombre — donc pour à peu près tout le monde.
 *
 * 2. `videos` ÉTAIT EN ROUGE. Le rouge n'existe pas dans le système : les seules couleurs
 *    rouges sont `--stop`, qui veut dire « ça a échoué ». Podcast et vidéos donnent une VOIX
 *    — quelqu'un qui raconte ce qu'il a fait — et vivent sous « Je te transforme », au même
 *    étage que le Club : *tu écoutes gratuitement ceux qui l'ont fait, puis tu rejoins ceux
 *    qui le font.*
 *
 * 3. `blog` ÉTAIT EN CORAIL. Le blog et la FAQ donnent une MÉTHODE : c'est « Je t'informe »,
 *    orange.
 *
 * 4. `/agence` ET `/presence-digitale` ÉTAIENT LE MÊME UNIVERS. Le système les sépare
 *    formellement, et ce n'est pas une nuance graphique : Présence Digitale EST le territoire
 *    teal, « Je te digitalise », avec une grille de prix publique. L'agence vit HORS DES
 *    QUATRE VERBES — séparateur dans la barre haute, entrée en corail, aucune grille
 *    publique : « c'est une autre promesse et un autre client ».
 *
 * 5. LES FONDS DE SECTION TEINTÉS ONT DISPARU. « Maximum deux fonds par écran : le maillage,
 *    et le verre. Pas de troisième couleur de surface. » Un aplat violet pâle en fond de section
 *    était cette troisième
 *    couleur. Le champ `mesh` remplace `sectionBg` : il nomme le maillage à poser derrière,
 *    par <Mesh territory={…} />, pour zéro octet.
 *
 * 6. DEUX TEINTES NE S'ÉCRIVENT PAS. L'orange plafonne à 2,47:1 sur blanc et le teal à
 *    2,84:1 : ils sont INTERDITS en texte, et leurs univers portent la variante `-txt`. Le
 *    corail, à 2,70:1, était dans le même cas sans avoir de variante — voir AD-20.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * IMPORTANT, inchangé : les classes sont des chaînes statiques complètes. Tailwind ne détecte
 * pas un nom de classe construit dynamiquement, et le purgerait du build.
 */

import { toCanonicalPath } from '../i18n/routing';
import type { Territory } from '../design-system';

export type Universe =
  | 'formations'
  | 'blog'
  | 'podcasts'
  | 'videos'
  | 'about'
  | 'club'
  | 'presence'
  | 'agency';

export interface UniverseTheme {
  /**
   * Le territoire du système, ou `null` pour ce qui vit hors des quatre verbes.
   * `about` est la PERSONNE et `agency` une autre promesse : ni l'un ni l'autre n'est un
   * territoire, et leur en attribuer un serait mentir sur la structure de l'offre.
   */
  territory: Territory | null;
  /** Le maillage à poser derrière, via <Mesh territory={…} />. Zéro octet. */
  mesh: Territory | 'nuit' | null;
  /** Sourcil monospace en capitales. */
  eyebrow: string;
  /** Texte d'accent : liens, icônes, chiffres mis en avant. */
  accentText: string;
  /** Fond de chip, tag ou badge doux. */
  softBadge: string;
  /** Bouton plein — un dégradé de territoire, avec son ombre colorée. */
  buttonSolid: string;
  /** Survol de titre de carte, à utiliser avec un parent `group`. Desktop seulement. */
  titleHover: string;
  /**
   * @deprecated Le système n'a qu'UN anneau de focus, bleu, câblé globalement sur
   * `:focus-visible` dans `overrides/ad-06-etats.css`. Un anneau par territoire donnerait
   * huit apparences à la même affordance. Ce champ ne fait plus que satisfaire les appelants
   * qui ne sont pas encore migrés ; il rend la chaîne vide.
   */
  focusRing: string;
  /**
   * @deprecated « Jamais de rond qui tourne à la place d'une explication. » Un chargement se
   * rend par un SQUELETTE À LA FORME EXACTE du contenu attendu, pour que rien ne saute quand
   * il arrive — voir <Skeleton>. Ce champ rend la chaîne vide.
   */
  spinner: string;
  /**
   * Aplat de la couleur de marque pleine, AVEC encre foncée dessus — jamais du blanc.
   * Réservé aux teintes trop claires pour porter du texte clair : c'est la signature visuelle
   * de la section, et le seul endroit où le teal et le corail s'affichent en pleine intensité.
   */
  signatureFill?: string;
}

/** Les quatre verbes, plus ce qui vit hors d'eux. */
export const universeThemes: Record<Universe, UniverseTheme> = {
  /* ── JE TE FORME — bleu #0057BC (6,80:1 sur blanc) ────────────────────────── */
  formations: {
    territory: 'forme',
    mesh: 'forme',
    eyebrow: 'text-forme',
    accentText: 'text-forme',
    softBadge: 'bg-[color:var(--fill-tag)] text-forme',
    buttonSolid: 'bg-[image:var(--action-forme)] text-white shadow-forme',
    titleHover: 'group-hover:text-forme',
    focusRing: '',
    spinner: '',
  },

  /* ── JE T'INFORME — orange #F38B0A, INTERDIT en texte (2,47:1) ────────────── */
  blog: {
    territory: 'informe',
    mesh: 'informe',
    eyebrow: 'text-informe-txt',
    accentText: 'text-informe-txt',
    softBadge: 'bg-[color:var(--fill-tag)] text-informe-txt',
    // L'encre du bouton orange est FIXE : `--ink-fixed`, jamais `--ink`, qui deviendrait
    // blanc sous `.dk` et donnerait du blanc sur un dégradé orange clair.
    buttonSolid: 'bg-[image:var(--action-informe)] text-[color:var(--ink-fixed)]',
    titleHover: 'group-hover:text-informe-txt',
    focusRing: '',
    spinner: '',
    signatureFill: 'bg-informe text-[color:var(--ink-fixed)]',
  },

  /* ── JE TE TRANSFORME — violet #6C23DD (7,19:1 sur blanc) ─────────────────── */
  podcasts: {
    territory: 'transforme',
    mesh: 'transforme',
    eyebrow: 'text-transforme',
    accentText: 'text-transforme',
    softBadge: 'bg-[color:var(--fill-tag)] text-transforme',
    buttonSolid: 'bg-[image:var(--action-transforme)] text-white shadow-transforme',
    titleHover: 'group-hover:text-transforme',
    focusRing: '',
    spinner: '',
  },

  // Même territoire que le podcast, et volontairement le même thème : ce sont deux formats
  // d'une seule promesse. Trois garde-fous lèvent l'ambiguïté entre le gratuit ouvert et le
  // payant fermé — la sous-navigation en tête, le mot « gratuit » dans le premier écran, et
  // le passage vers le Club en bas de page, jamais devant.
  videos: {
    territory: 'transforme',
    mesh: 'transforme',
    eyebrow: 'text-transforme',
    accentText: 'text-transforme',
    softBadge: 'bg-[color:var(--fill-tag)] text-transforme',
    buttonSolid: 'bg-[image:var(--action-transforme)] text-white shadow-transforme',
    titleHover: 'group-hover:text-transforme',
    focusRing: '',
    spinner: '',
  },

  club: {
    territory: 'transforme',
    mesh: 'transforme',
    eyebrow: 'text-transforme',
    accentText: 'text-transforme',
    softBadge: 'bg-[color:var(--fill-tag)] text-transforme',
    buttonSolid: 'bg-[image:var(--action-transforme)] text-white shadow-transforme',
    titleHover: 'group-hover:text-transforme',
    focusRing: '',
    spinner: '',
  },

  /* ── JE TE DIGITALISE — teal #02AC9C, INTERDIT en texte (2,84:1) ──────────── */
  presence: {
    territory: 'digitalise',
    mesh: 'digitalise',
    eyebrow: 'text-digitalise-txt',
    accentText: 'text-digitalise-txt',
    softBadge: 'bg-[color:var(--fill-tag)] text-digitalise-txt',
    buttonSolid: 'bg-[image:var(--action-digitalise)] text-white shadow-digitalise',
    titleHover: 'group-hover:text-digitalise-txt',
    focusRing: '',
    spinner: '',
    // L'aplat teal AVEC encre foncée dessus : 8,1:1. C'est le seul endroit où la teinte
    // s'affiche en pleine intensité, et c'est ce qui la rend reconnaissable malgré
    // l'interdiction de l'écrire.
    signatureFill: 'bg-digitalise text-[color:var(--ink-fixed)]',
  },

  /* ── HORS DES QUATRE VERBES ───────────────────────────────────────────────── */

  // « Je suis Max-Morrys » est un des six libellés de navigation, mais pas un territoire :
  // c'est une PERSONNE, pas une ligne de revenu. Aucune couleur propre — l'encre.
  //
  // ⚠️ LE MAILLAGE, LUI, EST ORANGE, ET CE N'EST PAS UNE CONTRADICTION. `territory: null` dit
  // que la page ne se range sous aucun des quatre verbes ; `mesh` dit seulement quel fond elle
  // porte. Le kit — `PagesCore.js` comme `ScreensApropos.js` — la dessine des deux côtés en
  // `territory="informe"`, et l'orange est aussi la teinte des trois emplacements déclarés de
  // la page. Un fond bleu sous des cartouches orange donnerait deux systèmes de couleur sur un
  // même écran. C'était `'forme'` : personne ne l'avait rapproché du kit.
  about: {
    territory: null,
    mesh: 'informe',
    eyebrow: 'text-ink-2',
    accentText: 'text-ink',
    softBadge: 'bg-[color:var(--fill-tag)] text-ink-2',
    buttonSolid: 'bg-[color:var(--action-primary)] text-[color:var(--text-on-primary)] shadow-ink',
    titleHover: 'group-hover:text-ink',
    focusRing: '',
    spinner: '',
  },

  // L'agence ne se range pas sous « Je te digitalise » : autre promesse, autre client, aucune
  // grille tarifaire publique. Elle porte le corail, dans sa version texte (AD-20).
  agency: {
    territory: null,
    mesh: null,
    eyebrow: 'text-corail-txt',
    accentText: 'text-corail-txt',
    softBadge: 'bg-[color:var(--fill-tag)] text-corail-txt',
    buttonSolid: 'bg-[color:var(--action-primary)] text-[color:var(--text-on-primary)] shadow-ink',
    titleHover: 'group-hover:text-corail-txt',
    focusRing: '',
    spinner: '',
    signatureFill: 'bg-corail text-[color:var(--ink-fixed)]',
  },
};

/** Déduit l'univers d'une route. Défaut : `formations`, le territoire d'entrée. */
export function universeFromPath(rawPath: string): Universe {
  // Canonicalise (retire /en et remappe les segments anglais) pour comparer aux chemins FR.
  const path = toCanonicalPath(rawPath);
  if (path.startsWith('/blog') || path.startsWith('/faq')) return 'blog';
  if (path.startsWith('/podcasts')) return 'podcasts';
  if (path.startsWith('/videos')) return 'videos';
  if (path.startsWith('/club')) return 'club';
  if (path.startsWith('/a-propos')) return 'about';
  // Deux offres, deux univers — voir le point 4 de l'en-tête. Elles partageaient le turquoise
  // parce qu'elles sont « les deux surfaces commerciales du site » ; c'est vrai, et ce n'est
  // pas une raison de leur donner la même promesse à l'écran.
  if (path.startsWith('/presence-digitale')) return 'presence';
  if (path.startsWith('/agence')) return 'agency';
  return 'formations';
}
