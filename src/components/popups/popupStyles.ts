/**
 * Classes partagées par les contenus de pop-up.
 *
 * ⚠️ Écrites en littéral et exportées comme constantes : `cn()` de ce dépôt n'est PAS
 * `tailwind-merge` (`src/lib/utils.ts`), il ne résout aucun conflit. Deux `bg-*` concurrents
 * seraient départagés par l'ordre du CSS, pas par l'ordre d'appel — mieux vaut une chaîne complète
 * par variante qu'une composition qui semble marcher.
 */

/** CTA principal, teinte lagoon — agence et commerce de proximité. */
export const CTA_LAGOON = 'group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-lagoon-500 hover:bg-lagoon-400 text-neutral-950 font-black text-sm uppercase tracking-wide transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] shadow-lg shadow-lagoon-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-lagoon-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950';

/** CTA principal, teinte brand — territoire de l'apprentissage. */
export const CTA_BRAND = 'group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-400 text-neutral-950 font-black text-sm uppercase tracking-wide transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] shadow-lg shadow-brand-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950';

/** Action secondaire, discrète mais atteignable au clavier. */
export const DISMISS = 'text-xs font-semibold text-white/40 hover:text-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded';

/** Paragraphe de corps. */
export const BODY = 'mt-2 lg:mt-4 text-sm text-white/60 leading-relaxed max-w-md';

/** Rangée d'actions : le CTA et la sortie, jamais empilés sur mobile. */
export const ACTIONS = 'mt-4 lg:mt-7 flex flex-wrap items-center gap-x-5 gap-y-2';
