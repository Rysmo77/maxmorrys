/**
 * Classes partagées par les contenus de pop-up.
 *
 * ⚠️ Écrites en littéral et exportées comme constantes : `cn()` de ce dépôt n'est PAS
 * `tailwind-merge` (`src/lib/utils.ts`), il ne résout aucun conflit. Deux `bg-*` concurrents
 * seraient départagés par l'ordre du CSS, pas par l'ordre d'appel — mieux vaut une chaîne complète
 * par variante qu'une composition qui semble marcher.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ POURQUOI L'APLAT DE MARQUE A DISPARU DES CTA (corrigé le 2026-09-02)
 *
 * Les trois CTA s'écrivaient `bg-[color:var(--mm-bleu)] … text-ink`. Les deux jetons
 * BASCULENT sous `.dk`, que `ThemeContext` pose sur `<html>` — mais `PopupSurface` est en
 * `--night-2` dans LES DEUX thèmes. Le fond de la fenêtre ne suivait donc pas le thème,
 * tandis que l'encre et l'aplat du bouton, si. Résultat mesuré sur le bouton principal,
 * c'est-à-dire sur la seule chose qu'on vient y cliquer :
 *
 *     thème clair   encre #0E1116 sur #0057BC  →  2,78:1   ✗
 *     thème sombre  encre #ECF0F5 sur #6FB1FF  →  1,91:1   ✗
 *
 * Sous le seuil dans les deux sens, et invisible en revue : chacun ne voit que son thème,
 * et le défaut ne se voit pas sur une capture — il se calcule.
 *
 * Le système avait déjà écrit la réponse, elle n'était simplement pas employée ici :
 * `--action-*` sont des dégradés en hexadécimal FIXE (`tokens/semantic.css`) et `--paper-fixed`
 * est déclaré sur `:root,.dk` (`overrides/ad-06`), donc aucun des deux ne bascule. C'est
 * exactement le couple que `Button` du kit applique à ses tons de territoire — voir sa table
 * `TONE`, qui porte l'avertissement en toutes lettres : « `--ink` deviendrait blanc sous
 * `.dk` ». Blanc sur dégradé de marque : 7,19:1 en violet, 6,80:1 en bleu, dans les deux thèmes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/*
  ⚠️ CHAÎNES LITTÉRALES, ET SURTOUT PAS UNE FABRIQUE. Une première version composait ces trois
  valeurs par une fonction `cta(action, shadow)` — c'était plus court, et Tailwind n'aurait
  produit AUCUNE des trois : son analyseur lit le texte source et ne voit jamais un nom de
  classe formé par interpolation. Le bouton serait resté sans aplat, en silence, au build
  seulement. Même piège que la table `TONES` de `PopupHeading`, qui porte déjà l'avertissement.
*/

/** CTA principal, teinte lagoon — agence et commerce de proximité. */
export const CTA_LAGOON = 'group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[image:var(--action-digitalise)] text-[color:var(--paper-fixed)] font-black text-sm uppercase tracking-wide transition duration-300 hover:-translate-y-0.5 active:scale-[0.97] shadow-digitalise focus:outline-none';

/** CTA principal, teinte brand — territoire de l'apprentissage. */
export const CTA_BRAND = 'group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[image:var(--action-forme)] text-[color:var(--paper-fixed)] font-black text-sm uppercase tracking-wide transition duration-300 hover:-translate-y-0.5 active:scale-[0.97] shadow-forme focus:outline-none';

/** CTA principal, teinte transforme — le Club, seul territoire à abonnement. */
export const CTA_TRANSFORME = 'group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[image:var(--action-transforme)] text-[color:var(--paper-fixed)] font-black text-sm uppercase tracking-wide transition duration-300 hover:-translate-y-0.5 active:scale-[0.97] shadow-transforme focus:outline-none';

/**
 * Bouton discret sur la surface nuit — remplace `Button tone="quiet"` du kit, inutilisable ici.
 *
 * ⚠️ TROUVÉ PAR UNE CAPTURE, PAS PAR UNE RELECTURE (2026-09-03). Le ton `quiet` compose
 * `background: var(--surface-quiet)` et `color: var(--ink)`, et les DEUX basculent sous `.dk`
 * alors que cette surface est nuit dans les deux thèmes. Valeurs effectives en thème clair :
 * fond `rgba(14,17,22,.065)` sur `--night-2`, encre `#0E1116`. Soit du noir sur du noir — les
 * deux seules actions de la fin d'article (« Ouvrir » le flux, « Créer un compte ») étaient
 * illisibles sur la surface au trafic organique le plus fort du site. Le ton `ghost` porte le
 * même défaut : n'employer dans une pop-up que les tons dont l'encre est `--paper-fixed`.
 *
 * Pourquoi ce n'est pas corrigé dans le kit : `Button` pose ses tons en style EN LIGNE, qu'aucune
 * feuille d'override ne peut battre sans `!important`. Les valeurs ci-dessous sont en blanc
 * translucide — donc identiques dans les deux thèmes, ce qui est la propriété qui manquait.
 */
export const BTN_NIGHT = 'inline-flex shrink-0 items-center gap-1.5 mm-press-sm rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20 focus:outline-none';

/** Action secondaire, discrète mais atteignable au clavier. */
export const DISMISS = 'text-xs font-semibold text-white/40 hover:text-white/80 transition-colors focus:outline-none rounded';

/**
 * Lien secondaire de territoire, sur la surface nuit.
 *
 * ⚠️ Les variantes `--mm-*-n` et NON `--mm-*-t`. Le kit les a écrites pour ce cas exact, et
 * son commentaire le dit : « Versions nuit des teintes illisibles sur fond noir (#0057BC tombe
 * à 2,84:1) ». Elles vivent au `:root` et ne basculent pas — ce qui est la propriété qu'il
 * faut ici, puisque la surface est nuit quel que soit le thème.
 */
export const LINK_LAGOON = 'text-xs font-semibold text-[color:var(--mm-teal-n)] hover:text-white transition-colors focus:outline-none rounded';
export const LINK_TRANSFORME = 'text-xs font-semibold text-[color:var(--mm-violet-n)] hover:text-white transition-colors focus:outline-none rounded';

/** Paragraphe de corps. */
export const BODY = 'mt-2 wide:mt-4 text-sm text-white/60 leading-relaxed max-w-md';

/** Rangée d'actions : le CTA et la sortie, jamais empilés sur mobile. */
export const ACTIONS = 'mt-4 wide:mt-7 flex flex-wrap items-center gap-x-5 gap-y-2';
