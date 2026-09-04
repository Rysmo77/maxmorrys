import type { CallContext } from '../context';
import { buildAppointmentNotice, type Langue } from '../lib/appointment';
import { sendEmail } from '../lib/email';
import {
  empreinteAppelant,
  fenetreHoraire,
  fenetreJournaliere,
  incrementerBorne,
  UNE_HEURE,
  UN_JOUR,
} from '../lib/rate-limit';
import { asText } from '../lib/values';

/**
 * Un visiteur prend un rendez-vous, il n'en prend pas six par heure depuis la même
 * connexion. Cinq laisse la place à un formulaire renvoyé plusieurs fois.
 */
const PLAFOND_PAR_APPELANT = 5;

/**
 * Le plafond global est une ALARME, pas une régulation : au rythme réel de ce
 * formulaire, l'atteindre signifie qu'on est en train d'être utilisé comme relais.
 * Il est posé haut exprès — le franchir dégrade (l'accusé ne part pas) alors que le
 * rendez-vous, lui, reste enregistré et reste visible dans la console.
 */
const PLAFOND_GLOBAL_JOUR = 200;

/**
 * Au-delà, l'appel ne vient plus du formulaire : il vient de quelqu'un qui rejoue un
 * identifiant. Dix minutes couvrent très largement l'aller-retour réseau qui sépare
 * `saveAppointment()` de l'appel à cet endpoint.
 */
const FRAICHEUR_MS = 10 * 60 * 1000;

/**
 * Accuse réception d'une demande de rendez-vous.
 *
 * ⚠️ VOLONTAIREMENT NON AUTHENTIFIÉ. Le formulaire de `/contact` est ouvert aux visiteurs
 * déconnectés — c'est même son cas principal. Exiger une session ici reviendrait à ne
 * répondre qu'à ceux qui ont déjà un compte, c'est-à-dire à personne parmi les prospects.
 *
 * ⚠️ LE DESTINATAIRE N'EST JAMAIS FOURNI PAR L'APPELANT. Il est relu depuis le document
 * `appointments/{id}` côté serveur.
 *
 * ─────────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUE LA PHRASE PRÉCÉDENTE NE SUFFIT PAS À GARANTIR (audit du 03/09/2026).
 *
 * Ce commentaire affirmait auparavant : « L'identifiant seul ne donne aucun pouvoir de ce
 * genre. » La prémisse était juste — l'appelant ne fournit pas le destinataire — et la
 * conclusion fausse, parce qu'un attaquant n'a jamais eu besoin de DEVINER un identifiant :
 * `firestore.rules` autorise la création anonyme dans `appointments`, donc **il crée le
 * document lui-même**, avec l'adresse et les textes de son choix, puis appelle cet endpoint.
 * Le courrier partait de `mail.maxmorrys.me`, signé SPF/DKIM, vers une victime désignée.
 *
 * Trois gardes ferment cela, et aucune ne suffit seule :
 *
 *   1. LE CONTENU — `assainirChampLibre` (lib/appointment.ts) retire les URL et les
 *      caractères de contrôle des quatre champs recopiés. Le HTML était déjà échappé ; le
 *      repli texte, lui, ne l'est pas, et les clients de messagerie rendent une URL
 *      cliquable d'eux-mêmes. C'est la garde qui ôte à l'abus son intérêt.
 *   2. LE VOLUME — deux plafonds ci-dessous, un par appelant et un global. C'est la garde
 *      qui empêche la campagne.
 *   3. LA FRAÎCHEUR — dix minutes après la création. `createdAt` est posé par le client,
 *      donc cette garde n'arrête PAS l'attaque décrite plus haut (l'attaquant crée puis
 *      appelle aussitôt) : elle ferme l'autre porte, celle du rejeu d'identifiants
 *      existants pour re-solliciter d'anciens prospects.
 *
 * Ce qui RESTE, et qu'aucune ligne de code ne fermera : un formulaire de contact public
 * envoie, par construction, un courrier à une adresse que personne n'a vérifiée. Ce qui a
 * changé, c'est que ce courrier ne peut plus porter la charge utile d'un tiers, ni partir
 * en nombre. Le durcissement suivant serait une confirmation d'adresse (double opt-in),
 * qui est une décision produit, pas une correction de sécurité.
 * ─────────────────────────────────────────────────────────────────────────────────
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

  /*
    GARDE 2a — le plafond par appelant, AVANT toute lecture.
    Posé en premier parce que c'est le contrôle le moins cher : il refuse sans avoir lu
    Firestore, donc une boucle ne coûte qu'une écriture de compteur au lieu d'une lecture
    de document, d'un envoi et de vingt notifications.
  */
  const empreinte = await empreinteAppelant(context.request);
  const parAppelant = await incrementerBorne(
    context.db,
    `_ratelimits/rdv_ip_${empreinte}_${fenetreHoraire()}`,
    PLAFOND_PAR_APPELANT,
    2 * UNE_HEURE,
  );
  if (!parAppelant.autorise) {
    console.warn(`Accusé de rendez-vous refusé : ${parAppelant.compte} appels sur l'heure.`);
    return { ok: true, sent: false, reason: 'plafondAppelant' };
  }

  const doc = await context.db.get(`appointments/${appointmentId}`);
  if (!doc) return { ok: true, sent: false, reason: 'introuvable' };
  if (typeof doc.data.acknowledgedAt === 'string') {
    return { ok: true, sent: false, reason: 'dejaAccuse' };
  }

  /*
    GARDE 3 — la fraîcheur. Un accusé de réception accuse une réception RÉCENTE : passé
    ce délai, l'appel ne peut plus venir du formulaire qui vient d'écrire le document.
  */
  const cree = Date.parse(asText(doc.data.createdAt) ?? '');
  if (!Number.isFinite(cree) || Date.now() - cree > FRAICHEUR_MS) {
    return { ok: true, sent: false, reason: 'horsDelai' };
  }

  const email = asText(doc.data.email);
  if (!email) return { ok: true, sent: false, reason: 'sansAdresse' };

  /*
    GARDE 2b — le plafond global, juste avant l'envoi.
    Placé ici et non en tête pour qu'un appel qui ne débouche sur AUCUN courrier (document
    introuvable, déjà accusé, hors délai, sans adresse) ne consomme pas le quota du jour :
    sinon un attaquant épuiserait l'alarme sans jamais faire partir un seul message, et la
    priverait de son sens.
  */
  const parJour = await incrementerBorne(
    context.db,
    `_ratelimits/rdv_jour_${fenetreJournaliere()}`,
    PLAFOND_GLOBAL_JOUR,
    2 * UN_JOUR,
  );
  if (!parJour.autorise) {
    console.error(
      `PLAFOND GLOBAL D'ACCUSÉS DE RENDEZ-VOUS FRANCHI : ${parJour.compte} envois aujourd'hui ` +
        `(plafond ${PLAFOND_GLOBAL_JOUR}). Les demandes restent enregistrées et visibles dans ` +
        `la console ; seuls les accusés cessent de partir. À examiner : abus probable.`,
    );
    return { ok: true, sent: false, reason: 'plafondJournalier' };
  }

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
