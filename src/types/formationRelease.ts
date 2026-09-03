import type { Formation } from './index';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'ÉTAT DE MISE EN VENTE D'UNE FORMATION — LOGIQUE PURE.
 *
 * Ce fichier n'importe RIEN au-delà d'un type. C'est délibéré, et c'est la leçon du commit
 * `09c2487` : une fonction pure posée dans un module qui importe `config/firebase` fait tomber
 * l'étape « Unit tests » de la CI, qui ne reçoit aucune variable d'environnement. Le voisinage
 * de `types/gamification.ts`, qui exporte lui aussi des valeurs runtime, est l'emplacement
 * assumé pour ça.
 *
 * ─── TROIS ÉTATS, PAS DEUX ─────────────────────────────────────────────────────────────
 *
 *   brouillon    `status: 'draft'`                    invisible
 *   à venir      `status: 'published'` + `comingSoon` VISIBLE, pas achetable, pas lisible
 *   ouverte      `status: 'published'`                visible, achetable, lisible
 *
 * ⚠️ « Publiée » ne veut donc plus dire « ouverte ». Partout où le code demandait « y a-t-il des
 * formations ? » pour décider s'il pouvait promettre quelque chose — la garde `shopClosed` des
 * pop-ups, l'accueil, la passerelle de fin d'article — la question juste est devenue « y a-t-il
 * des formations OUVERTES ? ». Une boutique entièrement en Coming Soon est une boutique fermée.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/*
 * ⚠️ TOUS CES PRÉDICATS ACCEPTENT `null`, ET RÉPONDENT ALORS `false`.
 *
 * `getFormationsByIds` rend MOINS d'éléments qu'on ne lui en demande dès qu'une formation a
 * été dépubliée ou supprimée : côté espace élève, `ef.formation` est donc légitimement nul.
 * Faire porter la garde à chaque appelant aurait multiplié les `?.` et fini par en oublier un
 * — et « je n'ai pas la formation » n'est ni « ouverte », ni « à venir ».
 */
type Peut = Formation | null | undefined;

/** Ouverte : on peut l'acheter et la lire. C'est la question à poser avant toute promesse. */
export function estOuverte(f: Peut): boolean {
  return !!f && f.status === 'published' && f.comingSoon !== true;
}

/** À venir : visible et tarifée, mais ni achetable ni lisible. */
export function estAVenir(f: Peut): boolean {
  return !!f && f.status === 'published' && f.comingSoon === true;
}

/** Précommandable : à venir ET la précommande a été ouverte pour cette formation-là. */
export function estPrecommandable(f: Peut): boolean {
  return estAVenir(f) && f?.preorderEnabled === true;
}

/** Le tunnel `/checkout/:slug` accepte une formation ouverte, ou une précommande ouverte. */
export function accepteAchat(f: Peut): boolean {
  return estOuverte(f) || estPrecommandable(f);
}

export function formationsOuvertes(list: Formation[]): Formation[] {
  return list.filter(estOuverte);
}

/**
 * Choisir la formation à mettre en avant sur une surface qui en montre UNE.
 *
 * ⚠️ Toujours préférer une formation ouverte. Sans cette règle, la passerelle de fin d'article,
 * la carte « commence gratuitement » de l'accueil et le pop-up d'entrée pousseraient tous un
 * produit qu'on ne peut pas acheter — dès la première formation en Coming Soon publiée, parce
 * que le catalogue est trié par date de création décroissante et qu'elle arriverait en tête.
 */
export function formationMiseEnAvant(list: Formation[]): Formation | null {
  const ouvertes = formationsOuvertes(list);
  return ouvertes.find((f) => f.featured) ?? ouvertes[0]
    ?? list.find((f) => f.featured && estAVenir(f)) ?? list.find(estAVenir) ?? null;
}

/** Ce qu'on a le droit de dire de la date d'ouverture. `null` = on ne dit rien. */
export type Ouverture =
  | { kind: 'date'; value: string }
  | { kind: 'label'; value: string };

/**
 * La date est FACULTATIVE, et son absence est un état valide.
 *
 * `launchAt` prime sur `launchLabel` : une date ferme rend la période libre caduque. Quand ni
 * l'un ni l'autre n'est posé, la fiche dit que la date n'est pas fixée — dans cette voix de
 * marque, c'est plus crédible qu'une date inventée, et ça ne coûte pas une promesse qu'on
 * devra tenir.
 */
export function ouverture(f: Peut): Ouverture | null {
  const date = f?.launchAt?.trim();
  if (date) return { kind: 'date', value: date };
  const label = f?.launchLabel?.trim();
  if (label) return { kind: 'label', value: label };
  return null;
}

/**
 * En dessous de ce seuil, le nombre d'inscrits à la liste d'attente ne s'affiche PAS.
 *
 * « 3 personnes attendent » dessert le produit : c'est un chiffre vrai qui travaille contre
 * ce qu'il mesure. On préfère ne rien dire — le même arbitrage que `settings.ts` pour les
 * pop-ups, « on n'affiche rien plutôt qu'à tort ».
 */
export const SEUIL_PREUVE_SOCIALE = 10;

/** Le compteur d'attente s'il mérite d'être montré, sinon `null`. Jamais zéro affiché. */
export function preuveSociale(f: Peut): number | null {
  const n = f?.waitlistCount ?? 0;
  return n >= SEUIL_PREUVE_SOCIALE ? n : null;
}
