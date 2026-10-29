/**
 * La grammaire visuelle des pop-ups — kit v3 (29/10/2026).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A CHANGÉ, ET POURQUOI
 *
 * Jusqu'ici, toutes les fenêtres étaient en `--night-2` dans les DEUX thèmes, avec des titres
 * en sans-serif capitales, des boutons en capitales et une pastille inclinée. Cette surface
 * figée obligeait chaque jeton à porter sa variante « nuit » (`--mm-*-n`, `--paper-fixed`), et
 * trois défauts de contraste en sont nés, dont deux encore en ligne le 29/10 (`FormationsEntry`
 * posait de l'encre sur un aplat bleu à 2,78:1 ; l'aiguilleur lisait `text-digitalise-txt` sur
 * nuit à 2,84:1).
 *
 * Le kit v3 tranche autrement : « Menus, tiroirs, palette de commandes : opaques, sur un
 * voile » ; surfaces `bento` ; « Un seul flou par écran : le chrome fixe ». La fenêtre devient
 * donc une tuile `bento` qui SUIT le thème — l'encre, les accents et les boutons basculent seuls,
 * et plus aucune variante nuit n'est nécessaire. Le voile perd son flou.
 *
 *   · Sourcil : `mm-eyebrow` (mono capitales entre crochets), teinté par espace.
 *   · Titre : Fraunces 900, casse de phrase, jamais sous 22 px.
 *   · Boutons : `mm-btn` du kit, casse de phrase, flèche dans sa pastille.
 *   · Mise en avant : UNE pilule `highlight` (orange), à la place de la pastille inclinée.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ CHAÎNES LITTÉRALES, JAMAIS UNE FABRIQUE. Tailwind lit le texte source : une classe formée
 * par interpolation ne serait jamais générée. Et `cn()` n'est pas `tailwind-merge` — deux
 * classes concurrentes se départagent par l'ordre du CSS, pas par l'ordre d'appel.
 */

/**
 * Le ton d'une fenêtre = l'espace dont elle parle (kit v3, « Les trois espaces »).
 *
 *   hub     site personnel — encre, accent violet ; « Réserver un appel » en `is-club`
 *   edu     l'école — bleu
 *   club    le Club des Digitos — violet
 *   studio  la piste Conception, étage commerçants — teal
 */
export type PopupTone = 'hub' | 'edu' | 'club' | 'studio';

interface ToneClasses {
  eyebrow: string;
  /** Action principale. */
  cta: string;
  /** Lien secondaire, souligné, dans l'accent de l'espace. */
  link: string;
  /** Pastille d'icône des tuiles. */
  tint: string;
  /** Maillage du panneau. */
  mesh: string;
  /** Le panneau est-il sombre dans les deux thèmes ? (`m-club` l'est, par le kit.) */
  nightPanel: boolean;
}

export const TONES: Record<PopupTone, ToneClasses> = {
  hub: {
    eyebrow: 'mm-eyebrow',
    cta: 'mm-btn is-club has-arrow',
    link: 'text-ink decoration-[color:var(--mm-violet)]',
    tint: 'bg-[color-mix(in_srgb,var(--ink)_7%,transparent)] text-ink',
    mesh: 'mm-mesh m-hub',
    nightPanel: false,
  },
  edu: {
    eyebrow: 'mm-eyebrow is-edu',
    cta: 'mm-btn is-edu has-arrow',
    link: 'text-[color:var(--mm-bleu)] decoration-[color:var(--mm-bleu)]',
    tint: 'bg-[color-mix(in_srgb,var(--mm-bleu)_12%,transparent)] text-[color:var(--mm-bleu)]',
    mesh: 'mm-mesh m-edu',
    nightPanel: false,
  },
  club: {
    eyebrow: 'mm-eyebrow is-club',
    cta: 'mm-btn is-club has-arrow',
    link: 'text-[color:var(--mm-violet)] decoration-[color:var(--mm-violet)]',
    tint: 'bg-[color-mix(in_srgb,var(--mm-violet)_12%,transparent)] text-[color:var(--mm-violet)]',
    mesh: 'mm-mesh m-club',
    nightPanel: true,
  },
  studio: {
    eyebrow: 'mm-eyebrow is-studio',
    cta: 'mm-btn is-studio has-arrow',
    link: 'text-[color:var(--mm-teal-t)] decoration-[color:var(--mm-teal-t)]',
    tint: 'bg-[color-mix(in_srgb,var(--mm-teal)_14%,transparent)] text-[color:var(--mm-teal-t)]',
    mesh: 'mm-mesh m-digitalise',
    nightPanel: false,
  },
};

/**
 * La pastille de flèche d'un `mm-btn has-arrow`.
 *
 * ⚠️ Le kit la peint `background: var(--paper); color: var(--ink)`. En thème sombre, `--ink`
 * devient clair et la pastille reste claire : flèche blanche sur blanc, invisible (vu au
 * navigateur le 29/10). Sur les trois boutons dégradés employés ici, la pastille est blanche
 * dans les deux thèmes, donc la flèche est fixée en encre. Le défaut reste dans le kit.
 */
export const ARROW = 'mm-btn__arrow !bg-[color:var(--paper-fixed)] !text-[color:var(--night)]';

/** Lien secondaire : gras, souligné, atteignable au clavier. La couleur vient de `TONES[t].link`. */
export const LINK = 'text-[14px] font-bold underline decoration-2 underline-offset-[5px] transition-opacity hover:opacity-75 rounded-sm';

/**
 * Sortie neutre. `ink-2` et non `ink-3` : `--ink-3` vaut #98A1AE en clair, 2,5:1 sur blanc — le
 * kit en fait un plancher décoratif, pas une couleur de texte cliquable.
 */
export const DISMISS = 'text-[13px] font-semibold text-ink-2 hover:text-ink transition-colors rounded-sm';

/** Paragraphe de corps (`body` 15 px, `ink-2`, ≤ 46 caractères comme un chapô). */
export const BODY = 'mt-3 mb-0 max-w-[46ch] text-[15px] leading-[1.55] text-ink-2';

/** Note de contrainte, sous les actions. */
export const NOTE = 'mt-4 mb-0 max-w-[52ch] text-[12.5px] leading-[1.5] text-ink-2';

/** Rangée d'actions : le bouton, le lien, la sortie. */
export const ACTIONS = 'mt-5 wide:mt-7 flex flex-wrap items-center gap-x-5 gap-y-3';

/**
 * Tuile cliquable (portes de l'aiguilleur, fiche de formation, renvoi vers le Club).
 * `bento-2` sur `bento` : la tuile se lit sans bordure colorée — le kit les interdit.
 */
export const TILE = 'group flex w-full items-center gap-4 rounded-[18px] border border-[color:var(--line)] bg-[color:var(--bento-2)] p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--sh-lift)] active:scale-[.985] motion-reduce:transition-none motion-reduce:hover:translate-y-0';

/** Pastille d'icône d'une tuile (44 px : la cible tactile du kit). */
export const TILE_ICON = 'grid h-11 w-11 shrink-0 place-items-center rounded-[13px]';

export const TILE_LABEL = 'block text-[14.5px] font-bold leading-snug text-ink';
export const TILE_DESC = 'mt-0.5 block text-[13px] leading-[1.45] text-ink-2';
export const TILE_ARROW = 'shrink-0 text-ink-2 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none';
