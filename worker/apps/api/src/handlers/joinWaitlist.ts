import { FieldValue } from '@mm/firestore-rest';
import { HttpsError, sha256Hex } from '@mm/shared';

import type { CallContext } from '../context';
import { sendEmail } from '../lib/email';
import {
  UN_JOUR,
  empreinteAppelant,
  fenetreJournaliere,
  incrementerBorne,
} from '../lib/rate-limit';
import { buildWaitlistConfirmation, type FormationCourrier, type Langue } from '../lib/waitlist-mail';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * `joinWaitlist` — rejoindre la liste d'attente d'une formation à venir.
 *
 * ─── POURQUOI CE N'EST PAS UNE ÉCRITURE CLIENT ─────────────────────────────────────────
 *
 * S'inscrire écrit DEUX documents : l'entrée dans `waitlist`, et l'incrément de
 * `formations/{id}.waitlistCount`. Le second est le seul nombre qu'une page publique puisse
 * afficher — la collection `waitlist` n'est pas listable publiquement, et elle ne doit pas
 * l'être, elle contient des adresses. Or `formations` est en écriture ADMIN.
 *
 * Faire tenir l'inscription côté navigateur aurait donc exigé d'ouvrir `formations` en
 * écriture à tout le monde pour un compteur. Le Worker, qui écrit par compte de service, est
 * le seul chemin — le même raisonnement que `popupEvent` pour `analytics`.
 *
 * ─── AVEC OU SANS COMPTE (révisé le 29/10/2026) ─────────────────────────────────────────
 *
 * Le compte a d'abord été exigé. L'audit UI/UX du 29/10/2026 a montré le prix de ce choix :
 * le parcours apprenant finissait sur « crée ton compte pour être prévenu·e » — une impasse
 * pour qui veut seulement une date. Une adresse suffit désormais, avec les trois garde-fous
 * que le compte apportait :
 *   • déduplication par adresse — l'identifiant d'entrée est l'empreinte de l'adresse
 *     normalisée, rejouer ne gonfle pas le compteur ;
 *   • plafond par IP (empreinte, jamais en clair) et plafond global journalier — un champ
 *     anonyme qui déclenche un courrier ne doit pas devenir un canon à e-mails ;
 *   • aucun courrier commercial : un accusé, puis un seul message à l'ouverture.
 * L'entrée anonyme n'a pas d'`userId` : `notifyWaitlist` ne lui écrit pas de notification
 * in-app, seulement l'e-mail.
 *
 * ⚠️ L'accès REST par compte de service contourne `firestore.rules` : les contrôles ci-dessous
 * sont les seuls, il n'y a pas de filet derrière.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Inscriptions autorisées par personne et par jour, toutes formations confondues. */
const LIMITE_JOURNALIERE = 20;
/** Inscriptions anonymes par IP et par jour. */
const LIMITE_IP_JOUR = 10;
/** Inscriptions anonymes par jour, toutes IP confondues — l'alarme d'une campagne. */
const LIMITE_ANONYME_JOUR = 500;

/** Forme d'adresse acceptée : volontairement simple, le serveur de messagerie tranche le reste. */
const ADRESSE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Requete {
  formationId?: unknown;
  language?: unknown;
  /** Seulement pour un appel anonyme ; ignoré quand un compte est connecté. */
  email?: unknown;
}

function texte(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function nombre(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export async function joinWaitlist(data: unknown, context: CallContext): Promise<unknown> {
  const auth = context.auth;
  const { formationId, language, email: emailSaisi } = (data ?? {}) as Requete;

  if (typeof formationId !== 'string' || !formationId.trim()) {
    throw new HttpsError('invalid-argument', 'formationId est obligatoire.');
  }
  const langue: Langue = language === 'en' ? 'en' : 'fr';

  const doc = await context.db.get(`formations/${formationId}`);
  if (!doc) throw new HttpsError('not-found', 'Formation introuvable.');

  /*
   * ON NE S'INSCRIT QU'À CE QUI EST RÉELLEMENT À VENIR.
   *
   * Un brouillon n'est pas annonçable, et une formation déjà ouverte n'a pas de liste : la
   * personne peut l'acheter tout de suite. Refuser ici plutôt que d'accepter en silence évite
   * une liste qu'on n'enverrait jamais — et un bouton qui, sur une fiche ouverte, capterait
   * des gens au lieu de les faire entrer.
   */
  if (doc.data.status !== 'published') {
    throw new HttpsError('failed-precondition', "Cette formation n'est pas publiée.");
  }
  if (doc.data.comingSoon !== true) {
    throw new HttpsError('failed-precondition', 'Cette formation est déjà ouverte.');
  }

  const email = (auth ? texte(auth.email) : texte(emailSaisi)).trim().toLowerCase();
  if (!email || email.length > 254 || !ADRESSE.test(email)) {
    throw new HttpsError(
      auth ? 'failed-precondition' : 'invalid-argument',
      auth ? 'Ton compte ne porte pas d’adresse e-mail.' : 'Adresse e-mail invalide.',
    );
  }

  const jour = fenetreJournaliere();
  /*
   * L'APPELANT ANONYME EST PLAFONNÉ AVANT TOUTE ÉCRITURE D'ENTRÉE : par IP, puis globalement.
   * L'incrément a lieu même en cas de refus (cf. `incrementerBorne`).
   */
  if (!auth) {
    const empreinte = await empreinteAppelant(context.request);
    const parIp = await incrementerBorne(
      context.db, `_ratelimits/waitlist_ip_${empreinte}_${jour}`, LIMITE_IP_JOUR, 2 * UN_JOUR,
    );
    if (!parIp.autorise) {
      throw new HttpsError('resource-exhausted', 'Trop d’inscriptions aujourd’hui. Réessaie demain.');
    }
    const global = await incrementerBorne(
      context.db, `_ratelimits/waitlist_anon_jour_${jour}`, LIMITE_ANONYME_JOUR, 2 * UN_JOUR,
    );
    if (!global.autorise) {
      console.error(`joinWaitlist anonyme : plafond journalier atteint (${global.compte}).`);
      throw new HttpsError('resource-exhausted', 'Trop d’inscriptions aujourd’hui. Réessaie demain.');
    }
  }

  // Plafond journalier par compte (ou par adresse), réservé en transaction.
  const appelant = auth ? auth.uid : `anon_${(await sha256Hex(email)).slice(0, 32)}`;
  const limite = `_ratelimits/waitlist_${appelant}`;

  /*
   * L'ENTRÉE ET LE COMPTEUR DANS LA MÊME TRANSACTION, ET L'INCRÉMENT SOUS CONDITION.
   *
   * Le bouton doit être rejouable — on reclique, on revient sur la fiche, on ouvre deux
   * onglets. Sans la relecture de l'entrée, chaque geste aurait gonflé `waitlistCount` d'un
   * cran : le compteur affiché publiquement se serait mis à mentir, dans le sens flatteur, ce
   * qui est précisément la façon dont un chiffre perd sa valeur de preuve.
   */
  const entryId = `${appelant}_${formationId}`;
  const maintenant = new Date().toISOString();

  const dejaInscrit = await context.db.runTransaction(async (tx) => {
    const [quota, entree] = await Promise.all([
      tx.get(limite),
      tx.get(`waitlist/${entryId}`),
    ]);

    if (entree) return true;

    const courant = quota?.data ?? {};
    const compte = courant.date === jour ? nombre(courant.count) : 0;
    if (compte >= LIMITE_JOURNALIERE) {
      throw new HttpsError('resource-exhausted', 'Trop d’inscriptions aujourd’hui. Réessaie demain.');
    }
    tx.set(limite, { date: jour, count: compte + 1 }, { merge: true });

    tx.set(`waitlist/${entryId}`, {
      ...(auth ? { userId: auth.uid } : { anonymous: true }),
      formationId,
      email,
      language: langue,
      createdAt: maintenant,
    });
    tx.set(`formations/${formationId}`, { waitlistCount: FieldValue.increment(1) }, { merge: true });

    return false;
  });

  if (dejaInscrit) {
    return { ok: true, deja: true, waitlistCount: nombre(doc.data.waitlistCount) };
  }

  /*
   * L'ACCUSÉ DE RÉCEPTION PART APRÈS, ET SON ÉCHEC NE DÉFAIT PAS L'INSCRIPTION.
   *
   * `sendEmail` ne lève jamais : le binding est absent en local, et un serveur de messagerie
   * peut hoqueter. La personne EST sur la liste — c'est le fait qui compte, et il est acquis.
   * `confirmationSentAt` n'est posé qu'en cas d'envoi réussi, pour qu'un rattrapage sache
   * distinguer « pas encore envoyé » de « envoyé ».
   */
  const courrier: FormationCourrier = {
    titre: texte(doc.data.title),
    slug: texte(langue === 'en' ? doc.data.slug_en || doc.data.slug : doc.data.slug),
  };
  const envoi = await sendEmail(context.env, {
    to: email,
    ...buildWaitlistConfirmation(courrier, langue, context.env.APP_BASE_URL),
  });

  if (envoi.sent) {
    context.ctx.waitUntil(
      context.db.update(`waitlist/${entryId}`, { confirmationSentAt: maintenant }).catch(() => {
        // Le marqueur est un confort de rattrapage, pas une donnée dont dépend l'inscription.
      }),
    );
  }

  return {
    ok: true,
    deja: false,
    waitlistCount: nombre(doc.data.waitlistCount) + 1,
    mailEnvoye: envoi.sent,
  };
}
