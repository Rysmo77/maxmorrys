import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, writeBatch,
  type DocumentData, type Timestamp, type WriteBatch,
} from 'firebase/firestore';
import { db } from '../../config/db';
import { auth } from '../../config/firebase';
import { captureError } from '../sentry';
import type { AdminSpace } from './consoleNav';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE JOURNAL D'AUDIT DE LA CONSOLE — audit UI/UX du 03/11/2026, constat A1 (P1).
 *
 * La console (badge PRODUCTION) annonçait « Pas encore de journal ». Aucune trace de qui
 * a supprimé, publié ou changé un rôle. Il n'y a PAS de serveur pour l'écrire (Cloud
 * Functions supprimées) : le journal est donc écrit par le client, et c'est
 * `firestore.rules` qui le rend non falsifiable :
 *
 *   · `audit_log` est en AJOUT SEUL — `update` et `delete` sont refusés à tout le monde ;
 *   · `actorUid == request.auth.uid`, `actorRole` = le rôle lu en base, `at == request.time`
 *     (d'où `serverTimestamp()`, jamais une date du navigateur) ; champs bornés par `hasOnly` ;
 *   · les SUPPRESSIONS des collections sensibles (users, blog, formations, podcasts, videos,
 *     redirects) et les CHANGEMENTS DE RÔLE exigent l'entrée écrite DANS LA MÊME REQUÊTE
 *     (`existsAfter`/`getAfter`) : sans journal, l'écriture est refusée.
 *
 * ⛔ UN SEUL CHEMIN D'ÉCRITURE : l'action et son entrée partent dans le MÊME batch. Écrire
 * l'action puis le journal en deux appels laisserait, à la première coupure réseau, une
 * suppression sans trace — exactement ce que le journal existe pour empêcher.
 *
 * Identifiant d'une suppression GARDÉE (les six collections de `GATED_DELETES`) :
 * `delete__<collection>__<id>` — DÉTERMINISTE, parce que la règle d'un `delete` n'a pas de
 * `request.resource` où lire une référence : elle ne retrouve l'entrée que par un chemin
 * qu'elle sait calculer.
 * ⚠️ LIMITE ASSUMÉE : le journal étant en ajout seul, un MÊME identifiant ne peut être
 * supprimé qu'une fois. Ces six collections ont des identifiants aléatoires (jamais réutilisés)
 * — sauf `users`, dont l'uid pourrait revenir si un profil supprimé était recréé : sa seconde
 * suppression serait refusée. Toute autre entrée (suppressions non gardées comprises) a un
 * identifiant ALÉATOIRE, que l'écriture porte dans `auditRef` quand la règle l'exige.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export const AUDIT_COLLECTION = 'audit_log';

export interface AuditMeta {
  /** `<collection>.<verbe>` — ex. `blog.delete`, `users.role`. Borné par la règle. */
  action: string;
  /** Collection (ou nom logique d'une sous-collection) visée. */
  targetCollection: string;
  targetId: string;
  space?: AdminSpace;
  /** Une ligne lisible : « Rôle : student → support ». ≤ 300 caractères. */
  summary?: string;
  /** Le motif saisi par l'opérateur, s'il y en a un. ≤ 500 caractères. */
  reason?: string;
}

export interface AuditEntry extends Omit<AuditMeta, 'space'> {
  id: string;
  actorUid: string;
  actorRole: string;
  space?: AdminSpace;
  at: Date | null;
}

const clip = (s: string | undefined, n: number) => (s ? s.slice(0, n) : undefined);

/** Les collections dont `firestore.rules` EXIGE l'entrée déterministe pour une suppression. */
export const GATED_DELETES: ReadonlySet<string> = new Set(['users', 'blog', 'formations', 'podcasts', 'videos', 'redirects']);

/** Le rôle de l'acteur, lu une fois par compte : la règle le compare au document `users`. */
let roleCache: { uid: string; role: string } | null = null;
async function actorRole(uid: string, fresh = false): Promise<string> {
  if (!fresh && roleCache?.uid === uid) return roleCache.role;
  const snap = await getDoc(doc(db, 'users', uid));
  const role = String(snap.data()?.role ?? '');
  roleCache = { uid, role };
  return role;
}

/** L'identifiant déterministe de l'entrée qui accompagne une suppression. */
export function deletionEntryId(col: string, id: string): string {
  return `delete__${col.replace(/\//g, '~')}__${id.replace(/\//g, '~')}`;
}

/**
 * LE helper unique. `apply` pose l'écriture métier dans le batch ; l'entrée du journal
 * y est ajoutée, puis tout part en un seul `commit()` — tout passe, ou rien.
 */
export async function consoleWrite(
  meta: AuditMeta,
  apply: (batch: WriteBatch, entryId: string) => void,
  entryId: string = doc(collection(db, AUDIT_COLLECTION)).id,
): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('consoleWrite: aucune session');
  try {
    return await commitEntry(uid, await actorRole(uid), meta, apply, entryId);
  } catch (error: unknown) {
    /* Le rôle en cache a pu changer (le sien, modifié depuis) : la règle compare `actorRole`
       au document `users` et refuse. On relit le rôle UNE fois et on retente UNE fois. */
    if ((error as { code?: string })?.code !== 'permission-denied') throw error;
    roleCache = null;
    return commitEntry(uid, await actorRole(uid, true), meta, apply, entryId);
  }
}

async function commitEntry(
  uid: string,
  role: string,
  meta: AuditMeta,
  apply: (batch: WriteBatch, entryId: string) => void,
  entryId: string,
): Promise<string> {
  const batch = writeBatch(db);
  apply(batch, entryId);
  const entry: DocumentData = {
    actorUid: uid,
    actorRole: role,
    action: meta.action,
    targetCollection: meta.targetCollection.slice(0, 64),
    targetId: meta.targetId.slice(0, 200),
    at: serverTimestamp(),
  };
  if (meta.space) entry.space = meta.space;
  const summary = clip(meta.summary, 300);
  if (summary) entry.summary = summary;
  const reason = clip(meta.reason, 500);
  if (reason) entry.reason = reason;
  batch.set(doc(db, AUDIT_COLLECTION, entryId), entry);
  await batch.commit();
  return entryId;
}

/**
 * Supprime un document ET journalise la suppression, ensemble.
 *
 * @param path chemin de la collection (`blog`, ou `conversations/<id>/messages`).
 * @param name nom logique pour l'action, quand le chemin a des segments (`dm_messages`).
 */
export async function auditedDelete(
  path: string,
  id: string,
  opts: { name?: string; summary?: string; reason?: string; space?: AdminSpace; skipIfMissing?: boolean } = {},
): Promise<string | null> {
  const name = opts.name ?? path;
  /* Déjà supprimé (message signalé deux fois, retiré entre-temps) : rien à faire, rien à
     journaliser — l'appelant poursuit (ex. résoudre le signalement). */
  if (opts.skipIfMissing && !(await getDoc(doc(db, path, id))).exists()) return null;
  return consoleWrite(
    { action: `${name}.delete`, targetCollection: name, targetId: id, summary: opts.summary, reason: opts.reason, space: opts.space },
    (batch) => batch.delete(doc(db, path, id)),
    // Identifiant déterministe SEULEMENT là où la règle l'exige ; aléatoire ailleurs.
    GATED_DELETES.has(name) ? deletionEntryId(name, id) : undefined,
  );
}

/**
 * Fusionne `data` dans un document ET journalise, ensemble. `auditRef` est posé sur le
 * document : c'est par lui que la règle retrouve l'entrée (changement de rôle).
 */
export function auditedMerge(path: string, id: string, data: DocumentData, meta: AuditMeta): Promise<string> {
  return consoleWrite(meta, (batch, entryId) => {
    batch.set(doc(db, path, id), { ...data, auditRef: entryId }, { merge: true });
  });
}

/** La forme qu'exige la règle pour `action` (`firestore.rules`, `match /audit_log`). */
export const AUDIT_ACTION_RE = /^[a-z][a-z_]{0,40}[.][a-z][a-z_]{0,30}$/;

/**
 * TRACE une écriture de console faite par un helper métier (`savePost`, `saveCoupon`,
 * `updateTransactionStatus`…) — audit du 03/11/2026, A1 complet.
 *
 * Ces helpers posent eux-mêmes leur écriture (slug, horodatage, champs dérivés) : les
 * réécrire en batch dupliquerait leur logique. L'entrée part donc JUSTE APRÈS l'écriture
 * réussie, et seulement si elle a réussi — une écriture refusée ne laisse pas de fausse trace.
 *
 * ⚠️ DIFFÉRENCE ASSUMÉE avec `consoleWrite` : ici l'action et sa trace sont DEUX requêtes.
 * Une coupure entre les deux laisse une écriture sans trace ; c'est pourquoi les écritures
 * qui DOIVENT être tracées (suppressions gardées, rôles) restent sur `consoleWrite`, où la
 * règle refuse l'action sans son entrée. Un échec du journal n'annule pas l'action déjà
 * faite (l'interface dirait « échec » d'une écriture réussie) : il est remonté à Sentry.
 *
 * @param meta l'entrée, ou une fonction du résultat (l'identifiant d'une création).
 */
export async function audited<T>(
  meta: AuditMeta | ((result: T) => AuditMeta),
  run: () => Promise<T>,
): Promise<T> {
  const result = await run();
  const m = typeof meta === 'function' ? meta(result) : meta;
  try {
    if (!AUDIT_ACTION_RE.test(m.action)) throw new Error(`audited: action invalide « ${m.action} »`);
    await consoleWrite({ ...m, targetId: m.targetId || '—' }, () => {});
  } catch (error: unknown) {
    captureError(error, { context: `audited(${m.action})` });
  }
  return result;
}

/**
 * Le verbe d'un enregistrement de contenu : une publication (ou un retrait) se lit comme
 * telle dans le journal, et non comme une « mise à jour » parmi d'autres.
 */
export function saveVerb(isEdit: boolean, before?: string, after?: string): 'create' | 'update' | 'publish' | 'unpublish' {
  if (after === 'published' && before !== 'published') return 'publish';
  if (isEdit && before === 'published' && after !== undefined && after !== 'published') return 'unpublish';
  return isEdit ? 'update' : 'create';
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof (v as Timestamp).toDate === 'function') return (v as Timestamp).toDate();
  const d = new Date(v as string);
  return Number.isFinite(d.getTime()) ? d : null;
}

/** Les dernières entrées, de la plus récente à la plus ancienne (lecture : admin). */
export async function getAuditLog(max = 200): Promise<AuditEntry[]> {
  const snap = await getDocs(query(collection(db, AUDIT_COLLECTION), orderBy('at', 'desc'), limit(max)));
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      actorUid: String(x.actorUid ?? ''),
      actorRole: String(x.actorRole ?? ''),
      action: String(x.action ?? ''),
      targetCollection: String(x.targetCollection ?? ''),
      targetId: String(x.targetId ?? ''),
      space: x.space as AdminSpace | undefined,
      summary: x.summary as string | undefined,
      reason: x.reason as string | undefined,
      at: toDate(x.at),
    };
  });
}
