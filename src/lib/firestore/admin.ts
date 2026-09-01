import {
  collection, doc, getDoc, setDoc, query, where, orderBy,
  getCountFromServer,
} from 'firebase/firestore';
import { getCollection, createDoc, setDocById, deleteDocById, updateDocById, db } from './helpers';
import type { Transaction, Coupon, Announcement } from '../../types';

// ── Site Settings ─────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<Record<string, unknown>> {
  const snap = await getDoc(doc(db, 'settings', 'site'));
  return snap.exists() ? snap.data() : {};
}

export async function saveSiteSettings(data: Record<string, unknown>): Promise<void> {
  await setDoc(doc(db, 'settings', 'site'), data, { merge: true });
}

// ── Mesure des pop-ups ────────────────────────────────────────────────────────

/** Compteurs d'une pop-up pour une variante. */
export interface PopupCounters {
  impressions: number;
  clicks: number;
  dismissals: number;
  withheld: number;
}

/** Agrégat par pop-up, exposé et témoin séparés. */
export interface PopupStatRow {
  popupId: string;
  treatment: PopupCounters;
  control: PopupCounters;
}

const EMPTY_COUNTERS = (): PopupCounters => ({ impressions: 0, clicks: 0, dismissals: 0, withheld: 0 });

/** Nom de champ du Worker → nom de champ affiché. Le Worker écrit au singulier. */
const EVENT_FIELDS: Record<string, keyof PopupCounters> = {
  impression: 'impressions',
  click: 'clicks',
  dismiss: 'dismissals',
  withheld: 'withheld',
};

/**
 * Compteurs de pop-ups des `months` derniers mois, agrégés par pop-up et par variante.
 *
 * ⚠️ Les documents sont écrits par le WORKER (`popupEvent`), jamais par le client :
 * `firestore.rules` interdit l'écriture sur `analytics`. Tant que le Worker n'a pas été déployé,
 * ces documents n'existent pas et la fonction renvoie un tableau vide — ce n'est pas une erreur,
 * et l'écran doit le présenter comme une absence de données, pas comme une panne.
 *
 * Structure lue : `analytics/popups-YYYY-MM` → `{ [jour]: { [popupId]: { [variante]: { [evt]: n } } } }`.
 */
export async function getPopupStats(months = 2): Promise<PopupStatRow[]> {
  const now = new Date();
  const ids: string[] = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    ids.push(`popups-${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }

  const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, 'analytics', id))));
  const byPopup = new Map<string, PopupStatRow>();

  snaps.forEach((snap) => {
    if (!snap.exists()) return;
    const days = snap.data() as Record<string, unknown>;
    Object.values(days).forEach((popups) => {
      if (typeof popups !== 'object' || popups === null) return;
      Object.entries(popups as Record<string, unknown>).forEach(([popupId, variants]) => {
        if (typeof variants !== 'object' || variants === null) return;
        const row = byPopup.get(popupId)
          ?? { popupId, treatment: EMPTY_COUNTERS(), control: EMPTY_COUNTERS() };

        Object.entries(variants as Record<string, unknown>).forEach(([variant, events]) => {
          if (variant !== 'treatment' && variant !== 'control') return;
          if (typeof events !== 'object' || events === null) return;
          Object.entries(events as Record<string, unknown>).forEach(([evt, value]) => {
            const field = EVENT_FIELDS[evt];
            if (field && typeof value === 'number') row[variant][field] += value;
          });
        });

        byPopup.set(popupId, row);
      });
    });
  });

  return [...byPopup.values()].sort((a, b) => b.treatment.impressions - a.treatment.impressions);
}

// ── Newsletter ────────────────────────────────────────────────────────────────

export async function getNewsletterCount(): Promise<number> {
  // Agrégation serveur : lire la collection pour en prendre `.size` facturait une
  // lecture par abonné. `getPlatformStats` procède déjà ainsi plus bas.
  const snap = await getCountFromServer(collection(db, 'newsletter'));
  return snap.data().count;
}

// ── Platform stats ────────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const [
    usersSnap, formationsSnap, blogSnap, messagesSnap, enrollmentsSnap, newsletterSnap,
    publishedFormationsSnap, publishedPostsSnap, newMessagesSnap,
    agencyLeadsSnap, newAgencyLeadsSnap,
  ] = await Promise.all([
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(collection(db, 'formations')),
    getCountFromServer(collection(db, 'blog')),
    getCountFromServer(collection(db, 'messages')),
    getCountFromServer(collection(db, 'enrollments')),
    getCountFromServer(collection(db, 'newsletter')),
    getCountFromServer(query(collection(db, 'formations'), where('status', '==', 'published'))),
    getCountFromServer(query(collection(db, 'blog'), where('status', '==', 'published'))),
    getCountFromServer(query(collection(db, 'messages'), where('status', '==', 'new'))),
    getCountFromServer(collection(db, 'agency_leads')),
    getCountFromServer(query(collection(db, 'agency_leads'), where('status', '==', 'new'))),
  ]);
  return {
    users: usersSnap.data().count,
    formations: formationsSnap.data().count,
    publishedFormations: publishedFormationsSnap.data().count,
    articles: blogSnap.data().count,
    publishedPosts: publishedPostsSnap.data().count,
    messages: messagesSnap.data().count,
    newMessages: newMessagesSnap.data().count,
    enrollments: enrollmentsSnap.data().count,
    subscribers: newsletterSnap.data().count,
    agencyLeads: agencyLeadsSnap.data().count,
    newAgencyLeads: newAgencyLeadsSnap.data().count,
  };
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function getAllTransactions(): Promise<Transaction[]> {
  return getCollection<Transaction>('transactions', orderBy('createdAt', 'desc'));
}

export async function updateTransactionStatus(id: string, status: Transaction['status']): Promise<void> {
  return updateDocById('transactions', id, { status });
}

/**
 * Les transactions D'UNE SEULE personne, les siennes, de la plus récente à la plus ancienne.
 *
 * Elle vit à côté de `getAllTransactions` et non dans un module « apprenant » : les deux
 * lectures visent la même collection, et c'est la seule façon de voir d'un coup d'œil que
 * l'une est bornée à `userId` et l'autre pas. Une lecture de transactions écrite ailleurs
 * serait la prochaine à oublier le `where`.
 *
 * `firestore.rules` autorise déjà `isOwner(resource.data.userId)` en lecture sur
 * `transactions` (règle en place, ligne 417) : le `where` n'est donc pas une politesse, il
 * est ce qui rend la requête admissible — une requête non bornée serait refusée en bloc.
 * L'index composite `userId ASC, createdAt DESC` existe dans `firestore.indexes.json`.
 */
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  return getCollection<Transaction>(
    'transactions',
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
}

// ── Coupons ───────────────────────────────────────────────────────────────────

export async function getAllCoupons(): Promise<Coupon[]> {
  return getCollection<Coupon>('coupons', orderBy('createdAt', 'desc'));
}

export async function saveCoupon(data: Omit<Coupon, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('coupons', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('coupons', rest as Parameters<typeof createDoc>[1]);
}

export async function deleteCoupon(id: string): Promise<void> {
  return deleteDocById('coupons', id);
}

// ── Announcements ─────────────────────────────────────────────────────────────

export async function getAllAnnouncements(): Promise<Announcement[]> {
  return getCollection<Announcement>('announcements', orderBy('startDate', 'desc'));
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const today = new Date().toISOString().split('T')[0];
  // No orderBy — avoids composite index on active+startDate
  const all = await getCollection<Announcement>('announcements', where('active', '==', true));
  return all
    .filter((a) => a.startDate <= today && (!a.endDate || a.endDate >= today))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function saveAnnouncement(data: Omit<Announcement, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('announcements', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('announcements', rest as Parameters<typeof createDoc>[1]);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  return deleteDocById('announcements', id);
}
