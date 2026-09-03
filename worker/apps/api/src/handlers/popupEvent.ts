import { FieldValue } from '@mm/firestore-rest';

import type { CallContext } from '../context';

/**
 * Collecte des événements de pop-up, sous forme de compteurs agrégés.
 *
 * ⚠️ **Pourquoi passer par ici et non écrire depuis le navigateur** : `firestore.rules` interdit
 * toute écriture client sur `analytics` (`allow create, update: if false`), et il ne reste aucune
 * Cloud Function depuis le passage au plan Spark. Le Worker, qui écrit par compte de service, est
 * le seul chemin. Ne pas ouvrir les règles pour contourner : une collection de mesure ouverte en
 * écriture publique se fait remplir de bruit en quelques jours.
 *
 * ⚠️ **Aucune donnée personnelle ne transite.** Ni identifiant visiteur, ni adresse, ni parcours :
 * uniquement « telle pop-up, telle variante, tel jour, +1 ». L'appartenance au groupe A/B est
 * calculée dans le navigateur et n'en sort que sous forme de compteur agrégé. Ne jamais ajouter
 * d'identifiant ici — la mesure n'en a pas besoin et cela changerait la nature du traitement.
 *
 * Un document par mois, un champ par jour : le tableau de bord n'a qu'un ou deux documents à lire
 * pour couvrir trente jours, et l'historique se purge en supprimant les vieux documents.
 *
 * Volontairement NON authentifié : ces événements viennent de visiteurs anonymes, c'est tout
 * l'intérêt. Le pire abus possible est de fausser des compteurs internes — pas d'exfiltration.
 */

/** Types d'événements acceptés. Toute autre valeur est ignorée en silence. */
const EVENTS = ['impression', 'click', 'dismiss', 'withheld'] as const;
type PopupEventType = (typeof EVENTS)[number];

/** Identifiants de pop-up connus — liste fermée, pour que le document ne puisse pas enfler. */
const POPUP_IDS = [
  'agencyExit', 'formationsEntry', 'formationExit', 'presenceExit', 'blogEnd', 'cartRecovery',
  'clubExit', 'mediaEnd', 'quoteAbandon',
] as const;

const VARIANTS = ['treatment', 'control'] as const;

interface PopupEventInput {
  popupId?: unknown;
  event?: unknown;
  variant?: unknown;
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/**
 * Enregistre un événement. Retourne toujours `{ ok: true }` : une mesure ne doit jamais faire
 * échouer une interaction visiteur, et une entrée invalide est ignorée plutôt que remontée.
 */
export async function popupEvent(data: unknown, context: CallContext): Promise<unknown> {
  const input = (data ?? {}) as PopupEventInput;

  if (!isOneOf(input.popupId, POPUP_IDS)) return { ok: true, ignored: 'popupId' };
  if (!isOneOf(input.event, EVENTS)) return { ok: true, ignored: 'event' };
  if (!isOneOf(input.variant, VARIANTS)) return { ok: true, ignored: 'variant' };

  const popupId: string = input.popupId;
  const event: PopupEventType = input.event;
  const variant: string = input.variant;

  // `YYYY-MM` pour le document, `DD` pour le champ. UTC : une seule échelle de temps côté serveur.
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const day = String(now.getUTCDate()).padStart(2, '0');

  /*
    `set` en fusion plutôt que `update` : le document du mois n'existe pas le premier jour, et un
    `update` échouerait sur document absent. L'incrément reste atomique.
  */
  await context.db.set(
    `analytics/popups-${month}`,
    { [`${day}.${popupId}.${variant}.${event}`]: FieldValue.increment(1) },
    { merge: true },
  );

  return { ok: true };
}
