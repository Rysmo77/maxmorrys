import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import type { PopupId } from './rules';
import type { PopupVariant } from './variant';

/**
 * Envoi des événements de pop-up vers le compteur serveur.
 *
 * GA4 reçoit déjà les mêmes événements par `dataLayer`. Ce second canal existe pour que le
 * tableau de bord d'administration puisse les lire sans dépendre de l'API GA4 : les deux mesures
 * se contrôlent mutuellement, et un écart durable entre elles signale un problème de collecte.
 *
 * ⚠️ **Aucune donnée personnelle n'est transmise** : identifiant de pop-up, type d'événement,
 * variante. Rien qui identifie un visiteur. Ne pas y ajouter d'identifiant — la mesure n'en a pas
 * besoin, et cela changerait la nature du traitement.
 *
 * ⚠️ Envoi « tire et oublie ». Une mesure ne doit JAMAIS retarder ni faire échouer une interaction
 * visiteur : toute erreur réseau est avalée en silence, sans remontée Sentry — un compteur perdu
 * ne vaut pas une alerte.
 */

type PopupEventType = 'impression' | 'click' | 'dismiss' | 'withheld';

interface PopupEventRequest {
  popupId: PopupId;
  event: PopupEventType;
  variant: PopupVariant;
}

// Déclarée au niveau module, jamais dans le corps d'un composant (convention du dépôt).
const popupEventCallable = httpsCallable<PopupEventRequest, { ok: boolean }>(functions, 'popupEvent');

export function sendPopupEvent(popupId: PopupId, event: PopupEventType, variant: PopupVariant): void {
  popupEventCallable({ popupId, event, variant }).catch(() => {
    // Compteur perdu. Sans conséquence pour le visiteur, et GA4 garde la trace.
  });
}
