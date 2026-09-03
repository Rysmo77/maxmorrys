/**
 * LA RÉPONSE À UN MESSAGE DE CONTACT — le message, sa notification, son e-mail.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE FERME, ET POURQUOI IL FALLAIT LE FERMER
 *
 * La boucle de contact était ouverte aux deux bouts. `/contact` promet « Réponse ≤ 48 h » et
 * « Qui lit : Moi », l'écran « Mes messages » annonçait une réponse « dans tes notifications,
 * dans l'application » — et il n'existait AUCUN champ de réponse sur `ContactMessage`. La
 * seule action de la console était un `mailto:` vers le client de messagerie de
 * l'administrateur, plus un drapeau manuel « marquer répondu ».
 *
 * Résultat, du point de vue de la personne : une étiquette verte « Répondu » sans rien à
 * lire. C'est le pire état possible — le système affirme avoir fait ce qu'il n'a pas fait.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * POURQUOI CE N'EST PAS UN DÉCLENCHEUR FIRESTORE
 *
 * Le dessin naturel serait `onDocumentUpdated('messages/{id}')`. Il est impossible ici, et
 * ce n'est pas un choix : **Cloudflare Workers ne sait pas s'abonner aux événements
 * Firestore.** Il n'existe aucun équivalent d'Eventarc au bord, et il ne reste par ailleurs
 * plus une seule Cloud Function depuis le passage au plan Spark — les v2 exigent Blaze.
 *
 * La forme retenue est donc celle que le webhook de paiement tient déjà : **l'action qui
 * écrit appelle aussi l'endpoint.** Un seul appelant, un seul chemin, rien à réconcilier. Et
 * c'est plus robuste qu'un déclencheur : la réponse, la notification et l'e-mail partent du
 * même geste, au lieu de dépendre d'un événement qui peut se perdre.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEUX CANAUX, ET C'EST DÉLIBÉRÉ
 *
 * La notification est le canal SÛR : elle vit dans le produit, elle ne se perd pas, et elle
 * s'affiche même si l'adresse est morte. L'e-mail est le canal ATTEIGNABLE : personne ne
 * rouvre `/mon-espace/messages` en espérant une réponse.
 *
 * L'e-mail peut échouer sans que la réponse soit perdue — `sendEmail` ne lève jamais, et son
 * échec est journalisé puis rendu à l'appelant. La console peut alors le dire. L'inverse
 * serait faux : une réponse écrite et non enregistrée parce qu'un serveur de messagerie a
 * hoqueté.
 */
import type { Env } from '../env';
import * as DS from './email-design';
import { sendEmail } from './email';

export type Langue = 'fr' | 'en';

/* L'échappement est unique dans `email-design.ts`, appliqué par les primitives elles-mêmes.
   Il en vivait trois copies — trois occasions d'en corriger une seule. Voir `DS.echapper`. */

const T = {
  fr: {
    subject: (sujet: string) => `Re : ${sujet}`,
    bonjour: (nom?: string) => (nom ? `Bonjour ${nom},` : 'Bonjour,'),
    intro: 'Tu m’as écrit, voici ma réponse.',
    rappelTitre: 'Ton message',
    lien: 'Voir dans mon espace',
    apres: 'Tu peux répondre directement à cet e-mail, ou depuis ton espace.',
    signature: 'Max-Morrys',
    notifTitre: 'Réponse à ton message',
  },
  en: {
    subject: (sujet: string) => `Re: ${sujet}`,
    bonjour: (nom?: string) => (nom ? `Hi ${nom},` : 'Hi,'),
    intro: 'You wrote to me — here’s my reply.',
    rappelTitre: 'Your message',
    lien: 'See it in my space',
    apres: 'You can reply straight to this email, or from your space.',
    signature: 'Max-Morrys',
    notifTitre: 'Reply to your message',
  },
} as const;

export interface ReplyMessage {
  destinataireNom?: string;
  sujet: string;
  /** Le message d'origine, cité pour que la réponse se lise seule. */
  question: string;
  reponse: string;
  langue: Langue;
}

/**
 * Le corps de l'e-mail. Pur — comme le rappel d'échéance et le rendu de facture — donc
 * testable sans réseau et sans binding.
 *
 * Le message d'origine est CITÉ. Une réponse reçue des semaines après la question, sur une
 * adresse où l'on n'a pas gardé de trace de ce qu'on a demandé, ne se comprend pas seule.
 */
export function buildReplyNotice(
  message: ReplyMessage,
  urlEspace: string,
): { subject: string; html: string; text: string } {
  const t = T[message.langue];

  /*
   * LA RÉPONSE D'ABORD, LA QUESTION ENSUITE.
   *
   * L'ordre était déjà le bon et il est conservé : le destinataire sait ce qu'il a demandé, il
   * ouvre pour lire la réponse. Le rappel de sa question vient après, en citation, pour qu'il
   * puisse se resituer sans avoir à retrouver son propre envoi.
   *
   * Le filet de la citation était `#D3D9DF` — une teinte qui n'est dans aucune palette. Il est
   * encre, et le fond passe au jeton `paper3`. Le bouton était `#0A5FA6`, un bleu qui n'existe
   * pas non plus dans le système ; il devient encre comme partout ailleurs.
   */
  const html = DS.page({
    langue: message.langue,
    apercu: t.intro,
    contenu: [
      DS.paragraphe(t.bonjour(message.destinataireNom)),
      DS.paragraphe(t.intro, true),
      DS.prose(message.reponse),
      DS.citation(t.rappelTitre, message.question),
      DS.bouton(t.lien, urlEspace),
      DS.mention(t.apres),
      DS.paragraphe(t.signature),
    ].join('\n'),
  });

  const text = [
    t.bonjour(message.destinataireNom),
    '',
    t.intro,
    '',
    message.reponse,
    '',
    `— ${t.rappelTitre} —`,
    message.question,
    '',
    urlEspace,
    '',
    t.apres,
    '',
    t.signature,
  ].join('\n');

  return { subject: t.subject(message.sujet), html, text };
}

/** Le titre porté par la notification, dans la langue du destinataire. */
export function replyNotificationTitle(langue: Langue): string {
  return T[langue].notifTitre;
}

/** Envoi de l'e-mail de réponse. Ne lève jamais : voir l'en-tête de `email.ts`. */
export function sendReplyEmail(
  env: Env,
  destinataire: string,
  message: ReplyMessage,
): Promise<{ sent: boolean; error?: string }> {
  /*
   * ⚠️ `my-learning`, PAS `my-space`.
   *
   * Le segment anglais de `mon-espace` a changé avec la refonte (`src/i18n/segments.ts`, qui
   * cite la table du design system). Le bord redirige `/en/my-space` vers `/en/my-learning`,
   * mais PAS les chemins profonds : `/en/my-space/messages` traverse donc jusqu'au routeur,
   * qui ne connaît plus ce segment et rend son écran d'absence.
   *
   * Un lien d'e-mail est le pire endroit où découvrir ça : il est cliqué des jours plus tard,
   * par quelqu'un qui vient lire une réponse qu'on lui a promise.
   */
  const url = `${env.APP_BASE_URL}${message.langue === 'fr' ? '/mon-espace/messages' : '/en/my-learning/messages'}`;
  return sendEmail(env, { to: destinataire, ...buildReplyNotice(message, url) });
}
