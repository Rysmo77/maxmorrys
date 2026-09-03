import type { Firestore } from '@mm/firestore-rest';
import { asText, toNumber } from './values';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES RELANCES — portées depuis `functions/src/notifications.ts`.
 *
 * ⚠️ TOUTE LA RELANCE AUTOMATIQUE ÉTAIT MORTE. `streakReminder` et `courseReminder` étaient
 * deux `onSchedule` de Cloud Functions ; depuis le passage au plan Spark le 13/08/2026 il
 * n'en reste aucune de déployée. Personne n'a donc plus jamais été rappelé à un cours
 * commencé ni prévenu qu'une série allait tomber — sans que rien ne le signale, puisque les
 * écrans, eux, sont restés.
 *
 * ⚠️ LE CANAL EST « PULL », ET C'EST SA LIMITE. Ces relances écrivent dans le centre de
 * notifications applicatif, qui ne touche que les gens qui REVIENNENT. Il n'y a ni push web,
 * ni push natif dans le produit. Cela reste très supérieur à rien — quelqu'un qui rouvre
 * l'espace retrouve le fil de ce qu'il avait laissé — mais ce n'est pas un canal de
 * reconquête. Ne pas le présenter comme tel.
 *
 * ⚠️ REQUÊTES BORNÉES. Chaque passe lit au plus `PAGE` documents. Le cron est quotidien : une
 * base qui dépasserait ce plafond verrait ses derniers documents traités le lendemain, ce qui
 * est préférable à une exécution qui dépasse le temps imparti et n'écrit rien du tout.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const PAGE = 500;

/** Inactivité au-delà de laquelle on rappelle un cours commencé. */
const JOURS_INACTIVITE = 3;

type Langue = 'fr' | 'en';

const T = {
  serieTitre: {
    fr: (n: number) => `Ta série de ${n} jours tient encore`,
    en: (n: number) => `Your ${n}-day streak is still alive`,
  },
  /* ⚠️ Le texte d'origine disait « avant minuit » parce que le cron d'origine sonnait à
     20:00 UTC. Celui-ci sonne le MATIN : promettre une échéance de minuit serait exact mais
     absurde à 8 h. On dit ce qui est vrai à l'heure où le message arrive. */
  serieTexte: {
    fr: 'Il te reste la journée pour la garder : une leçon suffit.',
    en: 'You have the whole day to keep it: one lesson is enough.',
  },
  repriseTitre: {
    fr: (t: string) => `Continue ${t}`,
    en: (t: string) => `Keep going with ${t}`,
  },
  repriseTexte: {
    fr: (t: string) => `Tu n'as pas ouvert « ${t} » depuis ${JOURS_INACTIVITE} jours. Reprends là où tu t'es arrêté.`,
    en: (t: string) => `You haven't opened “${t}” in ${JOURS_INACTIVITE} days. Pick up where you left off.`,
  },
  coursParDefaut: { fr: 'ta formation', en: 'your course' },
} as const;

async function langueDe(db: Firestore, uid: string): Promise<Langue> {
  const profil = await db.get(`users/${uid}`);
  const prefs = profil?.data.preferences as { language?: string } | undefined;
  return prefs?.language === 'en' ? 'en' : 'fr';
}

async function notifier(
  db: Firestore,
  uid: string,
  notif: { title: string; message: string; link?: string },
): Promise<void> {
  await db.add(`notifications/${uid}/items`, {
    userId: uid,
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
    ...notif,
  });
}

export interface BilanRelances {
  series: number;
  reprises: number;
  examines: number;
}

/**
 * Prévient qui a une série en cours mais n'a rien fait aujourd'hui.
 *
 * Le filtre `currentStreak > 0` est appliqué CÔTÉ SERVEUR : sans lui, la passe lirait toute
 * la collection pour n'en retenir qu'une poignée, et la facture de lecture suivrait.
 */
async function rappelerSeries(db: Firestore): Promise<number> {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const joueurs = await db.query({
    collection: 'gamification',
    where: [{ field: 'currentStreak', op: '>', value: 0 }],
    orderBy: [{ field: 'currentStreak' }],
    limit: PAGE,
  });

  let envoyes = 0;
  for (const doc of joueurs) {
    if (asText(doc.data.lastActiveDate) === aujourdhui) continue; // déjà actif : rien à sauver
    const serie = toNumber(doc.data.currentStreak);
    if (serie <= 0) continue;
    const langue = await langueDe(db, doc.id);
    await notifier(db, doc.id, {
      title: T.serieTitre[langue](serie),
      message: T.serieTexte[langue],
      link: '/mon-espace/tableau-de-bord',
    });
    envoyes += 1;
  }
  return envoyes;
}

/**
 * Rappelle un cours commencé et laissé de côté depuis trois jours.
 *
 * ⚠️ ANTI-DOUBLON. Une même personne peut avoir plusieurs inscriptions en cours : sans garde,
 * elle recevrait autant de rappels que de formations abandonnées, le même matin. On ne relance
 * qu'une fois par personne et par passe, et jamais si elle a déjà reçu un message système
 * depuis la fenêtre d'inactivité.
 */
async function rappelerCours(db: Firestore): Promise<{ envoyes: number; examines: number }> {
  const seuil = new Date();
  seuil.setDate(seuil.getDate() - JOURS_INACTIVITE);
  const limite = seuil.toISOString();

  const inscriptions = await db.query({
    collection: 'enrollments',
    where: [{ field: 'progress', op: '<', value: 100 }],
    orderBy: [{ field: 'progress' }],
    limit: PAGE,
  });

  const dejaRelances = new Set<string>();
  let envoyes = 0;

  for (const doc of inscriptions) {
    const uid = asText(doc.data.userId);
    if (!uid || dejaRelances.has(uid)) continue;

    const derniere = asText(doc.data.lastActivityAt) ?? asText(doc.data.enrolledAt) ?? '';
    if (!derniere || derniere > limite) continue; // encore actif récemment

    const recentes = await db.query({
      collection: `notifications/${uid}/items`,
      where: [
        { field: 'type', op: '==', value: 'system' },
        { field: 'createdAt', op: '>', value: limite },
      ],
      limit: 1,
    });
    if (recentes.length > 0) { dejaRelances.add(uid); continue; }

    const langue = await langueDe(db, uid);
    const formationId = asText(doc.data.formationId) ?? '';
    const formation = formationId ? await db.get(`formations/${formationId}`) : null;
    const titre = asText(formation?.data.title) ?? T.coursParDefaut[langue];
    const slug = asText(formation?.data.slug) ?? '';

    await notifier(db, uid, {
      title: T.repriseTitre[langue](titre),
      message: T.repriseTexte[langue](titre),
      link: slug ? `/cours/${slug}` : '/mon-espace/cours',
    });
    dejaRelances.add(uid);
    envoyes += 1;
  }

  return { envoyes, examines: inscriptions.length };
}

/**
 * Une passe de relance. Chaque volet est isolé : une requête refusée sur la gamification ne
 * doit pas emporter les rappels de cours, qui n'ont rien à voir avec elle.
 */
export async function sendReengagementNotices(db: Firestore): Promise<BilanRelances> {
  let series = 0;
  try {
    series = await rappelerSeries(db);
  } catch (error: unknown) {
    console.error('Relances : rappels de série interrompus —', error);
  }

  let reprises = 0;
  let examines = 0;
  try {
    const bilan = await rappelerCours(db);
    reprises = bilan.envoyes;
    examines = bilan.examines;
  } catch (error: unknown) {
    console.error('Relances : rappels de cours interrompus —', error);
  }

  return { series, reprises, examines };
}
