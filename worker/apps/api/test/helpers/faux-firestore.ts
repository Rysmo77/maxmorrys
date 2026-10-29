import { FirestoreError, type Firestore } from '@mm/firestore-rest';

/**
 * UN FIRESTORE EN MÉMOIRE — juste ce que la campagne et le désabonnement utilisent.
 *
 * `query` (égalités, chemins pointés), `get`, `set` (avec fusion), `update`, `delete`, `commit` avec la
 * précondition `exists: false` (c'est elle qui porte l'idempotence des envois), et
 * `runTransaction`. Les écritures de `buildWrite` gardent le CHEMIN au lieu du nom complet :
 * le faux n'a pas de projet.
 */
type Doc = Record<string, unknown>;

function lire(data: Doc, chemin: string): unknown {
  return chemin.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Doc)[k] : undefined), data);
}

export function fauxFirestore(initial: Record<string, Doc> = {}) {
  const docs = new Map<string, Doc>(Object.entries(initial).map(([k, v]) => [k, structuredClone(v)]));

  const get = async (path: string): Promise<{ path: string; data: Doc } | null> => {
    const d = docs.get(path);
    return d ? { path, data: structuredClone(d) } : null;
  };
  const set = async (path: string, data: Doc, options: { merge?: boolean } = {}): Promise<void> => {
    docs.set(path, options.merge ? { ...(docs.get(path) ?? {}), ...data } : { ...data });
  };

  const api = {
    docs,
    get,
    set,
    async query(q: { collection: string; where?: Array<{ field: string; op: string; value: unknown }>; limit?: number }) {
      const res: Array<{ path: string; data: Doc }> = [];
      for (const [path, data] of docs) {
        const parts = path.split('/');
        if (parts.length !== 2 || parts[0] !== q.collection) continue;
        if ((q.where ?? []).every((w) => w.op === '==' && lire(data, w.field) === w.value)) res.push({ path, data: structuredClone(data) });
      }
      return q.limit ? res.slice(0, q.limit) : res;
    },
    async update(path: string, data: Doc) {
      const d = docs.get(path);
      if (!d) throw new FirestoreError('absent', 404, 'NOT_FOUND');
      docs.set(path, { ...d, ...data });
    },
    async delete(path: string) {
      docs.delete(path);
    },
    buildWrite(path: string, data: Doc) {
      return { update: { name: path, fields: data } };
    },
    async commit(writes: Array<{ update: { name: string; fields: Doc }; currentDocument?: { exists?: boolean } }>) {
      for (const w of writes) {
        if (w.currentDocument?.exists === false && docs.has(w.update.name)) {
          throw new FirestoreError('Document already exists', 409, 'ALREADY_EXISTS');
        }
      }
      for (const w of writes) docs.set(w.update.name, { ...w.update.fields });
    },
    async runTransaction<T>(fn: (tx: { get: typeof get; set: typeof set }) => Promise<T>): Promise<T> {
      return fn({ get, set });
    },
  };
  return { db: api as unknown as Firestore, docs };
}
