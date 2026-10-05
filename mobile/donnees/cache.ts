import { appeler } from './appel';
import { VUES_PERIMEES, type NomDEcriture } from './contrat.generated';
import { canonique } from './canonique';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE CACHE DES VUES — et les trois défauts du port qu'il corrige.
 *
 * 1 · LA CLÉ NE TRIAIT PAS SES PARAMÈTRES. `{a,b}` et `{b,a}` faisaient deux entrées pour la
 *     même demande. La clé est désormais CANONIQUE : clés triées, à toute profondeur.
 * 2 · LE RELEVÉ ÉTAIT L'HEURE DU TÉLÉPHONE. Une vue relue du cache annonçait `Date.now()` de
 *     l'appareil au lieu du `releveA` du serveur — le dispositif violait la règle qu'il existe
 *     pour tenir (un nombre affiché porte la date de SA source). Les deux heures sont
 *     désormais séparées : `releveA` (serveur) se montre, `luA` (appareil) borne la fenêtre.
 * 3 · AUCUNE ÉCRITURE NE PÉRIMAIT RIEN. `VUES_PERIMEES` est généré depuis le contrat et
 *     n'était lu par personne : après `marquerLecon`, l'onglet voisin montrait l'état d'avant
 *     pendant trente secondes. Toute écriture passe maintenant par `ecrire()`.
 *
 * (Les trois trouvés par la réécriture Kotlin, abandonnée le 04/10/2026, et reportés ici.)
 *
 * Il est EN MÉMOIRE, délibérément : un cache persistant survivrait à la déconnexion.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export const FENETRE_MS = 30_000;

export interface Entree {
  valeur: unknown;
  /** L'estampille du SERVEUR — c'est elle qui s'affiche. */
  releveA: Date;
  /** L'heure de l'APPAREIL à la lecture — elle ne sert qu'à la fenêtre de fraîcheur. */
  luA: number;
}

const cache = new Map<string, Entree>();

export function cleDeVue(uid: string, nom: string, params: Record<string, unknown>): string {
  return `${uid}:${nom}:${canonique(params)}`;
}

export function lireCache(cle: string, maintenant = Date.now()): Entree | null {
  const e = cache.get(cle);
  return e && maintenant - e.luA < FENETRE_MS ? e : null;
}

export function ecrireCache(cle: string, entree: Entree): void {
  cache.set(cle, entree);
}

/** Vider à la déconnexion : une vue appartient à un compte, jamais à un appareil. */
export function viderLesVues(): void {
  cache.clear();
}

/**
 * Évince les vues qu'une écriture rend fausses. Un nom de vue porte son discriminant
 * (`appClubListe.membre`) ; la clé du cache, elle, porte la CALLABLE — on évince donc toutes
 * les lectures de cette callable, quels que soient leurs paramètres.
 */
export function perimer(ecriture: NomDEcriture): void {
  const callables = new Set(VUES_PERIMEES[ecriture].map((v) => v.split('.')[0]));
  for (const cle of [...cache.keys()]) {
    const nom = cle.split(':')[1];
    if (callables.has(nom)) cache.delete(cle);
  }
}

/** La SEULE porte des écritures : elle appelle, puis périme ce que le contrat déclare. */
export async function ecrire<T = unknown>(nom: NomDEcriture, params?: unknown): Promise<T> {
  const sortie = await appeler<T>(nom, params ?? {});
  perimer(nom);
  return sortie;
}

/**
 * Évince des vues NOMMÉES, hors de toute écriture de l'application. Sert quand un fait
 * survenu AILLEURS les rend fausses — un accès ouvert après un règlement fait sur le site.
 */
export function perimerVues(noms: readonly string[]): void {
  const callables = new Set(noms.map((v) => v.split('.')[0]));
  for (const cle of [...cache.keys()]) {
    if (callables.has(cle.split(':')[1])) cache.delete(cle);
  }
}
