/**
 * L'ENVOI D'E-MAIL — le premier canal sortant du produit.
 *
 * Jusqu'ici il n'y en avait aucun : ni nodemailer, ni SendGrid, ni Resend, nulle part dans
 * `functions/` ni dans `src/`. C'est pour ça que la voix du produit inscrit « ne jamais
 * promettre un e-mail » dans ses règles — trois écrans le promettaient quand même, et deux
 * clauses de CGV aussi.
 *
 * Le binding `send_email` de Cloudflare Email Service est préféré à l'API REST : il n'y a
 * aucune clé à stocker, donc aucune clé à faire fuir. Le domaine d'envoi est
 * `mail.maxmorrys.me`, un SOUS-DOMAINE et non la racine : un incident de réputation
 * (rebonds, plaintes) sur les envois transactionnels n'entame alors pas la délivrabilité de
 * `maxmorrys.me`, d'où partent les échanges personnels.
 */
import type { Env } from '../env';

export interface Message {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * UN ÉCHEC D'ENVOI NE FAIT JAMAIS ÉCHOUER SON APPELANT.
 *
 * C'est le même arbitrage que `sendConversionEvent` dans le webhook, et pour la même raison,
 * en plus grave ici : le webhook de paiement répond à Bictorys. Une réponse non-200 déclenche
 * une RELIVRAISON, sur un paiement déjà encaissé et déjà crédité. Faire échouer un webhook
 * parce qu'un serveur de messagerie a hoqueté transformerait un incident sans conséquence en
 * rejeu du chemin de l'argent.
 *
 * Le retour dit ce qui s'est passé pour que l'appelant le journalise, mais il ne lève pas.
 */
export async function sendEmail(env: Env, msg: Message): Promise<{ sent: boolean; error?: string }> {
  if (!env.EMAIL) {
    // Le binding est absent en développement local et dans les tests unitaires. Ce n'est pas
    // une panne : c'est l'absence de canal, et elle se journalise comme telle.
    return { sent: false, error: 'binding EMAIL absent' };
  }
  if (!msg.to || !msg.to.includes('@')) {
    return { sent: false, error: 'destinataire absent ou invalide' };
  }

  try {
    await env.EMAIL.send({
      to: msg.to,
      from: { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
      subject: msg.subject,
      html: msg.html,
      // `text` n'est pas une politesse : des clients de messagerie n'affichent que lui, et
      // son absence pèse sur le score anti-spam — donc sur la probabilité qu'une facture
      // arrive à destination.
      text: msg.text,
    });
    return { sent: true };
  } catch (error: unknown) {
    return { sent: false, error: error instanceof Error ? error.message : String(error) };
  }
}
