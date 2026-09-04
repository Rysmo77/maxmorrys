import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { abonnementActif } from './app/club';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `reserverSession` — s'inscrire à une session ou à un événement, et s'en désinscrire.
 *
 * ⚠️ TROIS CONTRÔLES, tous refaits ici parce que le compte de service n'en subit aucun :
 *
 *   1 · abonnement actif       `hasActiveClubSub()` garde `club_sessions` et `club_events` ;
 *   2 · c'est SA propre place   la règle `isOwner(userId)` sur la sous-collection —
 *                               l'identifiant du document EST l'uid, pris dans le jeton ;
 *   3 · la séance existe        sinon on écrirait une inscription à un événement fantôme,
 *                               invisible partout sauf dans la base.
 *
 * ── POURQUOI LE DOCUMENT PORTE L'UID COMME IDENTIFIANT ──────────────────────────────
 * `registrations/{uid}` rend l'opération IDEMPOTENTE par construction : réserver deux fois
 * ne crée pas deux places, et la règle Firestore s'appuie sur ce même identifiant pour
 * savoir à qui la ligne appartient. L'écran le dit déjà de son côté — « se réinscrire ne
 * crée pas de doublon » — et c'est vrai parce que le chemin l'impose, pas parce qu'on y
 * fait attention.
 *
 * ── ET LA DÉSINSCRIPTION EST UNE VRAIE SUPPRESSION ──────────────────────────────────
 * Pas un drapeau `annule: true`. Une place libérée doit l'être pour de bon : garder la
 * ligne avec un marqueur, c'est laisser un compte de participants qui inclut ceux qui ne
 * viendront pas — et c'est sur ce compte qu'on décide d'ouvrir des places.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const COLLECTIONS = ['club_sessions', 'club_events'] as const;

export async function reserverSession(data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);

  const { collection, seanceId, inscrite } = (data ?? {}) as {
    collection?: unknown; seanceId?: unknown; inscrite?: unknown;
  };
  /* La collection est comparée à une liste fermée, jamais concaténée telle quelle : un
     chemin construit depuis l'appelant accepterait `../users` et écrirait ailleurs. */
  if (typeof collection !== 'string' || !(COLLECTIONS as readonly string[]).includes(collection)) {
    throw new HttpsError('invalid-argument', 'Collection inconnue.');
  }
  if (typeof seanceId !== 'string' || seanceId.trim() === '') {
    throw new HttpsError('invalid-argument', 'Séance non désignée.');
  }
  if (typeof inscrite !== 'boolean') {
    throw new HttpsError('invalid-argument', 'État d’inscription illisible.');
  }

  const abonnement = await abonnementActif(context, auth.uid);
  if (!abonnement) {
    throw new HttpsError('permission-denied', 'Le Club est réservé aux membres actifs.');
  }

  const seance = await context.db.get(`${collection}/${seanceId}`);
  if (!seance) throw new HttpsError('not-found', 'Cette séance n’existe pas.');

  const chemin = `${collection}/${seanceId}/registrations/${auth.uid}`;

  if (inscrite) {
    await context.db.commit([
      context.db.buildWrite(chemin, {
        userId: auth.uid,
        registeredAt: new Date().toISOString(),
      }, { mask: false }),
    ]);
  } else {
    await context.db.delete(chemin).catch(() => undefined);
  }

  return { inscrite };
}
