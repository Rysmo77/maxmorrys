import { HttpsError } from '@mm/shared';

import { type CallContext, requireAdmin } from '../context';
import { sendEmail } from '../lib/email';
import { buildWaitlistOpening, type FormationCourrier, type Langue } from '../lib/waitlist-mail';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * `notifyWaitlist` — l'unique alerte promise, le jour de l'ouverture.
 *
 * ─── POURQUOI CE N'EST PAS `notifyOnPublish` ───────────────────────────────────────────
 *
 * `notifyOnPublish` prévient les comptes qui ont coché « me prévenir à la publication » dans
 * leurs réglages : une audience GLOBALE, pour « une nouvelle formation est en ligne ». Ici
 * l'audience est celle d'UNE formation, et les gens ne se sont pas abonnés au catalogue, ils
 * ont demandé celle-là.
 *
 * ⚠️ Surtout, les deux marqueurs d'idempotence doivent rester SÉPARÉS. `notifyOnPublish` pose
 * `publishNotifiedAt` dès la première mise en ligne — or une formation en Coming Soon est
 * publiée. Les confondre aurait fait que la publication en « à venir » consommait le jeton, et
 * que l'alerte du jour de la vraie ouverture ne partait jamais. D'où `waitlistNotifiedAt`.
 *
 * ─── ET POURQUOI PAS UN DÉCLENCHEUR ────────────────────────────────────────────────────
 *
 * Workers ne sait pas s'abonner aux événements Firestore, et il ne reste aucune Cloud Function
 * depuis le passage au plan Spark. C'est donc l'administration qui déclenche, explicitement.
 * Ce n'est pas qu'un pis-aller : envoyer l'alerte est une décision, pas un effet de bord d'un
 * enregistrement — on ouvre parfois une formation à 23 h en corrigeant une coquille.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/*
 * PLAFOND DE DESTINATAIRES — CALÉ SUR LE BUDGET DE SOUS-REQUÊTES, PAS SUR UN CHIFFRE ROND.
 *
 * Chaque envoi et chaque lot d'écritures est une sous-requête, et un Worker en a un nombre
 * borné par requête. `notifyOnPublish` boucle en `Promise.all` sur 2000 écritures unitaires :
 * c'est déjà optimiste, et ce n'est pas une raison de le recopier. Ici les écritures sont
 * groupées en lots, et seuls les e-mails consomment le budget un par un.
 *
 * Au-delà, on REFUSE plutôt que d'envoyer à moitié : une erreur se voit et se rejoue, un envoi
 * partiel laisse une moitié des gens prévenus et l'autre pas, sans que rien ne le dise.
 */
const MAX_DESTINATAIRES = 300;

/** Firestore plafonne un commit à 500 écritures. Deux par personne : entrée + notification. */
const PAR_LOT = 200;

const TITRE: Record<Langue, string> = {
  fr: 'La formation que tu attendais est en ligne',
  en: 'The course you were waiting for is live',
};

interface Requete {
  formationId?: unknown;
}

function texte(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export async function notifyWaitlist(data: unknown, context: CallContext): Promise<unknown> {
  await requireAdmin(context);

  const { formationId } = (data ?? {}) as Requete;
  if (typeof formationId !== 'string' || !formationId.trim()) {
    throw new HttpsError('invalid-argument', 'formationId est obligatoire.');
  }

  const doc = await context.db.get(`formations/${formationId}`);
  if (!doc) throw new HttpsError('not-found', 'Formation introuvable.');

  /*
   * ON N'ANNONCE QUE CE QUI EST RÉELLEMENT OUVERT.
   *
   * `status == 'published'` ne suffit plus à le dire depuis que « Coming Soon » est un drapeau
   * posé sur une formation publiée : il faut vérifier que le drapeau est RETOMBÉ. Sans cette
   * ligne, un clic sur le bouton avant la bascule enverrait toute la liste sur une fiche qui
   * dit encore « bientôt » — et brûlerait le seul e-mail qu'on s'est autorisé.
   */
  if (doc.data.status !== 'published') {
    throw new HttpsError('failed-precondition', "Cette formation n'est pas publiée.");
  }
  if (doc.data.comingSoon === true) {
    throw new HttpsError(
      'failed-precondition',
      "Cette formation est encore en « bientôt ». Ouvre-la d'abord, puis préviens la liste.",
    );
  }

  const slug = texte(doc.data.slug);
  if (!slug) throw new HttpsError('failed-precondition', "Cette formation n'a pas de slug.");

  /*
   * IDEMPOTENCE. Le marqueur porte la DATE, pas un booléen : il dit quand, et il empêche le
   * second envoi. Il est posé AVANT les écritures — on préfère une alerte manquante à une
   * alerte en double, qui est la seule des deux que le destinataire remarque.
   */
  if (typeof doc.data.waitlistNotifiedAt === 'string') {
    return { ok: true, notified: 0, alreadyNotified: true };
  }

  const inscrits = await context.db.query({
    collection: 'waitlist',
    where: [{ field: 'formationId', op: '==', value: formationId }],
    limit: MAX_DESTINATAIRES + 1,
  });

  if (inscrits.length > MAX_DESTINATAIRES) {
    throw new HttpsError(
      'resource-exhausted',
      `${inscrits.length} inscrits : au-delà de ${MAX_DESTINATAIRES}, l'envoi doit être découpé.`,
    );
  }

  const maintenant = new Date().toISOString();
  await context.db.update(`formations/${formationId}`, { waitlistNotifiedAt: maintenant });

  if (inscrits.length === 0) return { ok: true, notified: 0, alreadyNotified: false };

  const courrier = (langue: Langue): FormationCourrier => ({
    titre: texte(doc.data.title),
    slug: texte(langue === 'en' ? doc.data.slug_en || slug : slug),
  });

  // ── Notifications in-app + marqueurs, en lots ────────────────────────────────────────
  const ecritures = inscrits.flatMap((entree) => {
    const langue: Langue = entree.data.language === 'en' ? 'en' : 'fr';
    const uid = texte(entree.data.userId);
    if (!uid) return [];
    return [
      context.db.buildWrite(`notifications/${uid}/items/${crypto.randomUUID()}`, {
        userId: uid,
        type: 'formation',
        title: TITRE[langue],
        message: texte(doc.data.title),
        read: false,
        createdAt: maintenant,
        link: `/formations/${slug}`,
      }, { mask: false }),
      context.db.buildWrite(`waitlist/${entree.id}`, { notifiedAt: maintenant }, { mask: true }),
    ];
  });

  for (let i = 0; i < ecritures.length; i += PAR_LOT) {
    await context.db.commit(ecritures.slice(i, i + PAR_LOT));
  }

  // ── E-mails ──────────────────────────────────────────────────────────────────────────
  /*
   * `sendEmail` ne lève jamais : on compte les échecs au lieu de les subir. L'alerte in-app
   * est déjà écrite à ce stade — personne n'est laissé sans rien parce qu'un serveur de
   * messagerie a hoqueté.
   */
  let envoyes = 0;
  let echecs = 0;
  for (const entree of inscrits) {
    const adresse = texte(entree.data.email);
    if (!adresse) { echecs += 1; continue; }
    const langue: Langue = entree.data.language === 'en' ? 'en' : 'fr';
    const r = await sendEmail(context.env, {
      to: adresse,
      ...buildWaitlistOpening(courrier(langue), langue, context.env.APP_BASE_URL),
    });
    if (r.sent) envoyes += 1;
    else echecs += 1;
  }

  return { ok: true, notified: inscrits.length, mailsEnvoyes: envoyes, mailsEchoues: echecs, alreadyNotified: false };
}
