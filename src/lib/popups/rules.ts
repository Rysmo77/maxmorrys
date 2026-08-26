/**
 * Plafonds d'affichage des pop-ups contextuelles — source unique.
 *
 * Le site public empile déjà quatre couches flottantes (bandeau cookies, suggestion de langue,
 * bannière d'annonce, bouton WhatsApp collant). Sans plafond commun, chaque pop-up ajoutée
 * déciderait dans son coin et le visiteur en recevrait plusieurs d'affilée. Trois verrous :
 *
 *   1. UNE seule pop-up par session, toutes causes confondues ;
 *   2. sept jours de délai avant de rejouer la même ;
 *   3. suppression temporaire quand la sollicitation n'a plus de sens.
 *
 * ⚠️ **Un quatrième verrou a été RETIRÉ le 2026-08-26 : le consentement cookies.** Il exigeait une
 * réponse au bandeau avant toute pop-up. Conséquence non anticipée : un visiteur qui ignore le
 * bandeau — c'est-à-dire la majorité — ne voyait JAMAIS aucune pop-up, sans que rien ne le signale.
 * Une pop-up éditoriale n'est pas un traceur : elle n'exige aucun consentement. Ne pas le réintroduire.
 *
 * ⚠️ Chaque verrou est INVISIBLE depuis l'interface. C'est ce qui a rendu la panne de déclenchement
 * indiagnosticable. Tout verrou ajouté ici doit apparaître dans `blockedBy()`, qui alimente le
 * diagnostic `window.__mmPopups.why()`.
 *
 * ⚠️ Ce module ne décide PAS *quelle* pop-up est pertinente — seulement si une pop-up a le droit
 * de s'afficher. La pertinence vit dans `components/popups/PopupManager.tsx`.
 */

export type PopupId =
  | 'agencyExit'
  | 'formationsEntry'
  | 'formationExit'
  | 'presenceExit'
  | 'blogEnd'
  | 'cartRecovery';

/** Motif de blocage, ou `null` si la pop-up peut s'afficher. Consommé par le diagnostic. */
export type PopupBlocker = 'sessionCap' | 'cooldown' | 'suppressed' | 'noStorage';

/** Délai avant de reproposer la même pop-up au même visiteur. */
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Durée d'une suppression.
 *
 * ⚠️ Elle était PERMANENTE et c'était une erreur : une seule interaction — au départ un simple
 * `focus` traversant le formulaire de `/agence` — condamnait la pop-up pour toujours dans ce
 * navigateur, sans recours ni trace. Trente jours suffisent à ne pas harceler quelqu'un déjà entré
 * dans le tunnel, sans le bannir à vie.
 */
const SUPPRESSION_MS = 30 * 24 * 60 * 60 * 1000;

/** Vrai dès qu'une pop-up s'est affichée durant cette session, quelle qu'elle soit. */
const SESSION_KEY = 'mm-popup-session';

/** Préfixe commun — `clearAllPopupState()` s'en sert pour tout effacer d'un coup. */
export const STORAGE_PREFIX = 'mm-popup';

const shownKey = (id: PopupId) => `${STORAGE_PREFIX}-${id}`;
const suppressedKey = (id: PopupId) => `${STORAGE_PREFIX}-${id}-off`;

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Stockage indisponible : on se comporte comme si rien n'avait jamais été affiché.
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Écriture impossible — le plafond de session reste le garde-fou.
  }
}

/** Horodatage stocké, ou `0` si absent ou illisible. */
function readStamp(key: string): number {
  const raw = Number(readLocal(key));
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

function sessionCapReached(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Le verrou qui bloque cette pop-up, ou `null` si elle peut s'afficher.
 *
 * C'est la forme canonique : `canShow()` n'en est que la lecture booléenne. Toujours ajouter un
 * motif ici plutôt qu'un `return false` muet — c'est ce qui rend la panne diagnosticable.
 */
export function blockedBy(id: PopupId): PopupBlocker | null {
  if (typeof window === 'undefined') return 'noStorage';
  if (sessionCapReached()) return 'sessionCap';

  const suppressedAt = readStamp(suppressedKey(id));
  if (suppressedAt > 0 && Date.now() - suppressedAt < SUPPRESSION_MS) return 'suppressed';

  const shownAt = readStamp(shownKey(id));
  if (shownAt > 0 && Date.now() - shownAt < COOLDOWN_MS) return 'cooldown';

  return null;
}

/** Vrai si cette pop-up a le droit de s'afficher maintenant. */
export function canShow(id: PopupId): boolean {
  return blockedBy(id) === null;
}

/** Enregistre un affichage : consomme le plafond de session et démarre le délai de sept jours. */
export function markShown(id: PopupId): void {
  writeLocal(shownKey(id), String(Date.now()));
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Sans plafond de session persistant, le délai de sept jours reste le garde-fou.
  }
}

/**
 * Écarte cette pop-up pour trente jours.
 *
 * Appelé quand la sollicitation n'a plus de sens : le visiteur est déjà entré dans le tunnel
 * qu'elle visait à lui faire découvrir.
 */
export function markSuppressed(id: PopupId): void {
  writeLocal(suppressedKey(id), String(Date.now()));
}

/**
 * Efface tout l'état des pop-ups — plafond de session, délais et suppressions.
 *
 * Sert au mode aperçu (`?popup=reset`). Sans cette porte de sortie, un verrou déclenché par
 * inadvertance ne pouvait se lever qu'en vidant `localStorage` à la main dans les outils du
 * navigateur, en connaissant le nom exact des clés.
 */
export function clearAllPopupState(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Stockage inaccessible : il n'y avait alors aucun verrou à lever.
  }
}
