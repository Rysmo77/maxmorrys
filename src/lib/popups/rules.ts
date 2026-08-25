import { getCookieConsent } from '../../components/shared/CookieBanner';

/**
 * Plafonds d'affichage des pop-ups contextuelles — source unique.
 *
 * Le site public empile déjà quatre couches flottantes (bandeau cookies, suggestion de langue,
 * bannière d'annonce, bouton WhatsApp collant). Sans plafond commun, chaque pop-up ajoutée
 * décide dans son coin et le visiteur en reçoit plusieurs d'affilée. Trois verrous, du plus
 * large au plus étroit :
 *
 *   1. aucune pop-up tant que le bandeau cookies attend une réponse ;
 *   2. UNE seule pop-up par session, toutes causes confondues ;
 *   3. sept jours de délai avant de rejouer la même.
 *
 * ⚠️ Ce module ne décide PAS *quelle* pop-up est pertinente — seulement si une pop-up a le droit
 * de s'afficher. La pertinence vit dans `components/popups/PopupManager.tsx`.
 */

export type PopupId = 'agencyExit' | 'formationsEntry';

/** Délai avant de reproposer la même pop-up au même visiteur, en millisecondes. */
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/** Vrai dès qu'une pop-up s'est affichée durant cette session, quelle qu'elle soit. */
const SESSION_KEY = 'mm-popup-session';

const shownKey = (id: PopupId) => `mm-popup-${id}`;
const suppressedKey = (id: PopupId) => `mm-popup-${id}-off`;

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
    // Écriture impossible — le plafond de session ci-dessous suffit à éviter la répétition.
  }
}

/** Vrai si la pop-up a été définitivement écartée pour ce visiteur. */
function isSuppressed(id: PopupId): boolean {
  return readLocal(suppressedKey(id)) === '1';
}

/** Vrai si une pop-up s'est déjà affichée durant cette session. */
function sessionCapReached(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Vrai si cette pop-up a le droit de s'afficher maintenant.
 *
 * Le consentement cookies est volontairement testé sur `null` — « pas encore répondu » — et non
 * sur `hasMarketingConsent()` : une pop-up éditoriale n'est pas un traceur, elle ne doit
 * simplement pas peindre par-dessus le bandeau.
 */
export function canShow(id: PopupId): boolean {
  if (typeof window === 'undefined') return false;
  if (getCookieConsent() === null) return false;
  if (sessionCapReached()) return false;
  if (isSuppressed(id)) return false;

  const last = Number(readLocal(shownKey(id)));
  if (!Number.isFinite(last) || last <= 0) return true;
  return Date.now() - last > COOLDOWN_MS;
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
 * Écarte définitivement cette pop-up pour ce visiteur.
 *
 * Appelé quand la sollicitation n'a plus de sens : le visiteur est déjà entré dans le tunnel
 * qu'elle visait à lui faire découvrir.
 */
export function markSuppressed(id: PopupId): void {
  writeLocal(suppressedKey(id), '1');
}
