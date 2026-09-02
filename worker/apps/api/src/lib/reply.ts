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
import { sendEmail } from './email';

export type Langue = 'fr' | 'en';

function echapper(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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

  const html = `<!doctype html>
<html lang="${message.langue}">
<body style="margin:0;padding:24px;background:#F4F6F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0E1116;font-size:15px;line-height:1.5">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:18px;padding:28px">
    <p style="margin:0 0 16px">${echapper(t.bonjour(message.destinataireNom))}</p>
    <p style="margin:0 0 18px;color:#5A6472">${echapper(t.intro)}</p>
    <div style="margin:0 0 22px;white-space:pre-wrap">${echapper(message.reponse)}</div>
    <div style="margin:0 0 22px;padding:14px 16px;border-left:3px solid #D3D9DF;background:#F4F6F9;border-radius:0 10px 10px 0">
      <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#5A6472">${echapper(t.rappelTitre)}</p>
      <p style="margin:0;font-size:13px;color:#5A6472;white-space:pre-wrap">${echapper(message.question)}</p>
    </div>
    <p style="margin:0 0 22px">
      <a href="${echapper(urlEspace)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#0A5FA6;color:#FFFFFF;text-decoration:none;font-weight:700">${echapper(t.lien)}</a>
    </p>
    <p style="margin:0 0 20px;font-size:13px;color:#5A6472">${echapper(t.apres)}</p>
    <p style="margin:0;font-size:13px">${echapper(t.signature)}</p>
  </div>
</body>
</html>`;

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
  const url = `${env.APP_BASE_URL}${message.langue === 'fr' ? '/mon-espace/messages' : '/en/my-space/messages'}`;
  return sendEmail(env, { to: destinataire, ...buildReplyNotice(message, url) });
}
