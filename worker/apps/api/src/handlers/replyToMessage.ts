import { HttpsError } from '@mm/shared';

import { type CallContext, requireAdmin } from '../context';
import { replyNotificationTitle, sendReplyEmail, type Langue } from '../lib/reply';

/**
 * `replyToMessage` — répondre à un message de contact, depuis la console.
 *
 * Un seul geste écrit les trois choses : la réponse sur le message, la notification dans
 * l'espace de son auteur, et l'e-mail. Voir `lib/reply.ts` pour la raison de cette forme —
 * Workers ne sait pas s'abonner aux événements Firestore, et il n'y a plus de Cloud
 * Function pour le faire.
 *
 * ⚠️ L'ACCÈS REST PAR COMPTE DE SERVICE CONTOURNE `firestore.rules`. Le contrôle
 * d'administrateur est donc fait ici, explicitement, et il n'y a pas de filet derrière.
 */

/** Bornes de saisie. Un texte vide n'est pas une réponse ; 5 000 est la borne du message. */
const REPONSE_MIN = 2;
const REPONSE_MAX = 5000;

interface Requete {
  messageId?: unknown;
  reply?: unknown;
}

export async function replyToMessage(data: unknown, context: CallContext): Promise<unknown> {
  const admin = await requireAdmin(context);

  const { messageId, reply } = (data ?? {}) as Requete;
  if (typeof messageId !== 'string' || !messageId.trim()) {
    throw new HttpsError('invalid-argument', 'messageId est obligatoire.');
  }
  const texte = typeof reply === 'string' ? reply.trim() : '';
  if (texte.length < REPONSE_MIN) {
    throw new HttpsError('invalid-argument', 'La réponse est vide.');
  }
  if (texte.length > REPONSE_MAX) {
    throw new HttpsError('invalid-argument', `La réponse dépasse ${REPONSE_MAX} caractères.`);
  }

  const chemin = `messages/${messageId}`;
  const snapshot = await context.db.get(chemin);
  if (!snapshot) {
    throw new HttpsError('not-found', 'Message introuvable.');
  }
  const message = snapshot.data;

  const destinataire = typeof message.email === 'string' ? message.email : '';
  const userId = typeof message.userId === 'string' ? message.userId : '';
  const sujet = typeof message.subject === 'string' ? message.subject : '';
  const question = typeof message.message === 'string' ? message.message : '';
  const nom = typeof message.name === 'string' ? message.name : undefined;

  /*
   * La langue vient du PROFIL quand il existe, jamais du message. Un message écrit en
   * français par quelqu'un dont l'interface est en anglais doit recevoir la réponse dans
   * la langue de son interface : c'est là qu'il ira la relire.
   *
   * Sans compte — le formulaire public accepte les visiteurs déconnectés — on retombe sur
   * le français, langue par défaut du produit.
   */
  let langue: Langue = 'fr';
  if (userId) {
    const profil = await context.db.get(`users/${userId}`);
    const prefs = profil?.data.preferences as { language?: unknown } | undefined;
    if (prefs?.language === 'en') langue = 'en';
  }

  const maintenant = new Date().toISOString();

  /*
   * ── L'ORDRE DES TROIS ÉCRITURES EST UN ARBITRAGE, PAS UNE HABITUDE ──────────────────
   *
   * 1. LA RÉPONSE D'ABORD. C'est la seule des trois qui ne se rejoue pas : si elle échoue,
   *    rien ne doit être parti. Une notification annonçant une réponse qui n'existe pas
   *    enverrait la personne devant un écran vide.
   * 2. LA NOTIFICATION ENSUITE — canal sûr, dans le produit.
   * 3. L'E-MAIL EN DERNIER, et son échec ne défait rien : `sendEmail` ne lève pas. La
   *    réponse reste lisible dans l'espace, et l'appelant reçoit `emailSent: false` pour
   *    que la console puisse le dire au lieu de le taire.
   */
  await context.db.update(chemin, {
    reply: texte,
    repliedAt: maintenant,
    repliedBy: admin.uid,
    status: 'replied',
  });

  /*
   * Pas de notification sans compte. Un visiteur déconnecté n'a pas d'espace où la lire, et
   * `notifications/{userId}/items` avec un identifiant vide écrirait dans une collection
   * fantôme que personne ne relèvera jamais. L'e-mail reste, lui, son seul canal — et c'est
   * exactement pourquoi il fallait les deux.
   */
  if (userId) {
    await context.db.add(`notifications/${userId}/items`, {
      userId,
      type: 'message',
      title: replyNotificationTitle(langue),
      message: sujet,
      read: false,
      createdAt: maintenant,
      link: '/mon-espace/messages',
    });
  }

  const envoi = destinataire
    ? await sendReplyEmail(context.env, destinataire, {
        destinataireNom: nom,
        sujet,
        question,
        reponse: texte,
        langue,
      })
    : { sent: false, error: 'destinataire absent' };

  if (!envoi.sent) {
    console.error('Réponse enregistrée mais e-mail non envoyé pour', chemin, '—', envoi.error);
  }

  return {
    ok: true,
    notified: Boolean(userId),
    emailSent: envoi.sent,
    emailError: envoi.sent ? undefined : envoi.error,
  };
}
