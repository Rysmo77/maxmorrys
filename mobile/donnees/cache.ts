import AsyncStorage from '@react-native-async-storage/async-storage';
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
 * ── ET TROIS CHOSES DE PLUS, POUR QUE L'APPLICATION NE CLIGNOTE PLUS ──────────────────
 * 4 · UNE VUE PÉRIMÉE RESTE MONTRABLE. Passé trente secondes, revenir sur un écran rendait
 *     un squelette au lieu de ce qu'on venait de lire. L'entrée périmée est maintenant
 *     MONTRÉE pendant la relecture — sa date de relevé, celle du serveur, dit son âge.
 * 5 · UNE ÉCRITURE RELIT L'ÉCRAN OUVERT. `perimer` évinçait le cache, mais l'écran déjà
 *     monté gardait sa valeur jusqu'au démontage : bloquer quelqu'un le laissait dans le fil.
 *     Les vues montées sont maintenant PRÉVENUES, et se relisent.
 * 6 · LE CACHE SURVIT AU DÉMARRAGE À FROID — sur le disque, par compte (la clé porte l'uid),
 *     et vidé à la déconnexion. L'Espace s'affiche avant que le réseau ait répondu.
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

/** L'entrée, fraîche ou non — ce qu'on montre PENDANT qu'on relit. */
export function lireCachePerime(cle: string): Entree | null {
  return cache.get(cle) ?? null;
}

export function ecrireCache(cle: string, entree: Entree): void {
  cache.set(cle, entree);
  sauverPlusTard();
}

/** Vider à la déconnexion : une vue appartient à un compte, jamais à un appareil. */
export function viderLesVues(): void {
  cache.clear();
  if (minuterie) clearTimeout(minuterie);
  minuterie = null;
  AsyncStorage.removeItem(DISQUE).catch(() => undefined);
}

/* ── Le disque ───────────────────────────────────────────────────────────────────────── */

const DISQUE = 'rysmo:vues:v1';
/** Au-delà, les plus anciennes partent : le disque garde l'essentiel, pas tout l'historique. */
const MAX_SUR_DISQUE = 60;
let minuterie: ReturnType<typeof setTimeout> | null = null;

function sauverPlusTard() {
  if (minuterie) return;
  minuterie = setTimeout(() => {
    minuterie = null;
    const entrees = [...cache.entries()]
      .sort((a, b) => b[1].luA - a[1].luA)
      .slice(0, MAX_SUR_DISQUE)
      .map(([cle, e]) => [cle, { valeur: e.valeur, releveA: e.releveA.toISOString() }]);
    AsyncStorage.setItem(DISQUE, JSON.stringify(entrees)).catch(() => undefined);
  }, 1500);
}

/**
 * Le cache du disque, rechargé UNE fois au démarrage. Les entrées reviennent PÉRIMÉES
 * (`luA: 0`) : elles se montrent, et elles se relisent aussitôt.
 */
export const hydratation: Promise<void> = AsyncStorage.getItem(DISQUE)
  .then((brut) => {
    if (!brut) return;
    const entrees = JSON.parse(brut) as Array<[string, { valeur: unknown; releveA: string }]>;
    for (const [cle, e] of entrees) {
      if (!cache.has(cle)) cache.set(cle, { valeur: e.valeur, releveA: new Date(e.releveA), luA: 0 });
    }
  })
  .catch(() => undefined);

/* ── Prévenir les vues montées ───────────────────────────────────────────────────────── */

type Abonne = (callables: ReadonlySet<string> | 'toutes') => Promise<void> | void;
const abonnes = new Set<Abonne>();

/** Une vue montée s'abonne : elle sera relue quand une écriture la rend fausse. */
export function abonnerPeremption(f: Abonne): () => void {
  abonnes.add(f);
  return () => { abonnes.delete(f); };
}

function prevenir(callables: ReadonlySet<string> | 'toutes'): Promise<void> {
  return Promise.all([...abonnes].map((f) => f(callables))).then(() => undefined);
}

/** Tirer pour rafraîchir : TOUTES les vues montées se relisent ; la promesse tient jusqu'à la dernière. */
export function relireLesVues(): Promise<void> {
  return prevenir('toutes');
}

/**
 * Évince les vues qu'une écriture rend fausses. Un nom de vue porte son discriminant
 * (`appClubListe.membre`) ; la clé du cache, elle, porte la CALLABLE — on évince donc toutes
 * les lectures de cette callable, quels que soient leurs paramètres.
 */
export function perimer(ecriture: NomDEcriture): void {
  perimerCallables(new Set(VUES_PERIMEES[ecriture].map((v) => v.split('.')[0])));
}

/* L'entrée n'est plus effacée : elle passe PÉRIMÉE (`luA: 0`), reste montrable pendant la
   relecture, et les vues montées concernées sont prévenues. */
function perimerCallables(callables: ReadonlySet<string>): void {
  for (const [cle, e] of cache) {
    if (callables.has(cle.split(':')[1])) cache.set(cle, { ...e, luA: 0 });
  }
  void prevenir(callables);
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
  perimerCallables(new Set(noms.map((v) => v.split('.')[0])));
}
