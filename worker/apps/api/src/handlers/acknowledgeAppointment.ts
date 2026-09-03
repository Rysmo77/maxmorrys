import type { CallContext } from '../context';
import { buildAppointmentNotice, type Langue } from '../lib/appointment';
import { sendEmail } from '../lib/email';
import { asText } from '../lib/values';

/**
 * Accuse réception d'une demande de rendez-vous.
 *
 * ⚠️ VOLONTAIREMENT NON AUTHENTIFIÉ. Le formulaire de `/contact` est ouvert aux visiteurs
 * déconnectés — c'est même son cas principal. Exiger une session ici reviendrait à ne
 * répondre qu'à ceux qui ont déjà un compte, c'est-à-dire à personne parmi les prospects.
 *
 * ⚠️ LE DESTINATAIRE N'EST JAMAIS FOURNI PAR L'APPELANT. Il est relu depuis le document
 * `appointments/{id}` côté serveur. Sans cette précaution, l'endpoint serait un relais
 * d'envoi anonyme : n'importe qui pourrait faire partir un courrier signé Max-Morrys vers
 * l'adresse de son choix. L'identifiant seul ne donne aucun pouvoir de ce genre.
 *
 * ⚠️ IDEMPOTENT par `acknowledgedAt`, comme `publishNotifiedAt` et `renewalNoticeFor`. Le
 * marqueur porte la DATE : il dit quand, et il empêche le second envoi si l'appel est rejoué.
 *
 * ⚠️ NE FAIT JAMAIS ÉCHOUER LA RÉSERVATION. Le rendez-vous est déjà enregistré quand cet
 * endpoint est appelé : c'est le fait qui compte, et il est acquis. Un échec d'envoi est
 * rendu à l'appelant pour journalisation, jamais levé en erreur — la personne a bien pris
 * rendez-vous, même si l'accusé s'est perdu.
 */

interface Requete {
  appointmentId?: unknown;
  langue?: unknown;
}

export async function acknowledgeAppointment(data: unknown, context: CallContext): Promise<unknown> {
  const { appointmentId, langue } = (data ?? {}) as Requete;
  if (typeof appointmentId !== 'string' || !appointmentId.trim()) {
    return { ok: true, sent: false, reason: 'idManquant' };
  }
  const lang: Langue = langue === 'en' ? 'en' : 'fr';

  const doc = await context.db.get(`appointments/${appointmentId}`);
  if (!doc) return { ok: true, sent: false, reason: 'introuvable' };
  if (typeof doc.data.acknowledgedAt === 'string') {
    return { ok: true, sent: false, reason: 'dejaAccuse' };
  }

  const email = asText(doc.data.email);
  if (!email) return { ok: true, sent: false, reason: 'sansAdresse' };

  const notice = buildAppointmentNotice(
    {
      nom: asText(doc.data.name) ?? '',
      date: asText(doc.data.date) ?? '',
      heure: asText(doc.data.time) ?? '',
      objet: asText(doc.data.subject) ?? '',
    },
    lang,
    context.env.APP_BASE_URL,
  );

  const envoi = await sendEmail(context.env, { to: email, ...notice });
  if (!envoi.sent) {
    /*
      `acknowledgedAt` reste NON posé — un rejeu pourra rattraper l'accusé, et c'est ce
      qu'on veut. Mais l'échec, lui, se persiste : sans lui, une demande dont l'accusé
      n'est jamais parti est indistinguable d'une demande qu'on vient de recevoir. La
      console ne pouvait donc ni la compter, ni la retrouver.
    */
    await context.db.update(`appointments/${appointmentId}`, {
      mailPending: true,
      mailError: envoi.error ?? 'inconnue',
    });
    console.error('Accusé de rendez-vous non envoyé pour', appointmentId, '—', envoi.error);
    return { ok: true, sent: false, reason: 'envoiEchoue' };
  }

  await context.db.update(`appointments/${appointmentId}`, {
    acknowledgedAt: new Date().toISOString(),
    mailPending: false,
    mailError: null,
  });
  await prevenirLaConsole(context, doc.data);
  return { ok: true, sent: true };
}

/**
 * L'ALERTE INTERNE — l'autre moitié du problème.
 *
 * Le visiteur est rassuré, mais côté console personne n'était prévenu : une demande de
 * rendez-vous attendait qu'on pense à ouvrir l'écran. Sur un créneau demandé à trois jours,
 * c'est un rendez-vous manqué faute d'avoir regardé.
 *
 * ⚠️ Volontairement SILENCIEUSE EN CAS D'ÉCHEC, et posée APRÈS l'accusé : prévenir l'équipe
 * est utile, mais moins que répondre au prospect. Si la liste des administrateurs est
 * illisible, la demande reste enregistrée et l'accusé reste parti.
 */
async function prevenirLaConsole(context: CallContext, rdv: Record<string, unknown>): Promise<void> {
  try {
    const equipe = await context.db.query({
      collection: 'users',
      where: [{ field: 'role', op: 'in', value: ['admin', 'support'] }],
      limit: 20,
    });
    const quand = `${asText(rdv.date) ?? ''} ${asText(rdv.time) ?? ''}`.trim();
    const qui = asText(rdv.name) ?? '';
    for (const membre of equipe) {
      await context.db.add(`notifications/${membre.id}/items`, {
        userId: membre.id,
        type: 'system',
        title: 'Nouvelle demande de rendez-vous',
        message: `${qui} demande un créneau le ${quand} — ${asText(rdv.subject) ?? ''}`.trim(),
        read: false,
        createdAt: new Date().toISOString(),
        link: '/admin/rendez-vous',
      });
    }
  } catch (error: unknown) {
    console.error('Alerte interne de rendez-vous non posée —', error);
  }
}
