import type { TokenProvider } from '@mm/gcp-auth';

import { buildStructuredQuery, type Cursor, type Query } from './query';
import {
  decodeFields,
  DocumentRef,
  docIdFromPath,
  encodeWrite,
  refPathFromName,
  splitCollectionPath,
  type FieldTransform,
  type FsDocument,
  type FsValue,
} from './value';

export interface FirestoreOptions {
  projectId: string;
  token: TokenProvider;
  /** `(default)` sauf base nommée. */
  databaseId?: string;
  /** Surchargeable pour pointer l'émulateur (`http://127.0.0.1:8080`). */
  host?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface DocSnapshot {
  id: string;
  /** Chemin relatif, p. ex. `blog/mon-article`. */
  path: string;
  data: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
}

/** Erreur d'API Firestore, avec le statut canonique Google quand il est disponible. */
export class FirestoreError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
    readonly status: string,
  ) {
    super(message);
    this.name = 'FirestoreError';
  }
}

/** Une écriture d'un `:commit`. */
export interface Write {
  update?: FsDocument;
  delete?: string;
  updateMask?: { fieldPaths: string[] };
  updateTransforms?: FieldTransform[];
  currentDocument?: { exists?: boolean; updateTime?: string };
}

const DEFAULT_HOST = 'https://firestore.googleapis.com';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 3;
/** Statuts transitoires : on retente. Tout le reste remonte immédiatement. */
const RETRYABLE_HTTP = new Set([408, 429, 500, 502, 503, 504]);

interface GoogleErrorBody {
  error?: { code?: number; message?: string; status?: string };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Firestore {
  private readonly projectId: string;
  private readonly databaseId: string;
  private readonly token: TokenProvider;
  private readonly host: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(options: FirestoreOptions) {
    this.projectId = options.projectId;
    this.databaseId = options.databaseId ?? '(default)';
    this.token = options.token;
    this.host = (options.host ?? DEFAULT_HOST).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  /* ─────────────────────────────── URLs ─────────────────────────────── */

  private get databaseRoot(): string {
    return `${this.host}/v1/projects/${this.projectId}/databases/${this.databaseId}`;
  }

  private get documentsRoot(): string {
    return `${this.databaseRoot}/documents`;
  }

  /** Nom complet d'un document à partir de son chemin relatif. */
  fullName(path: string): string {
    return `projects/${this.projectId}/databases/${this.databaseId}/documents/${path.replace(/^\/+/, '')}`;
  }

  /** Construit une référence encodable vers un document. */
  ref(path: string): DocumentRef {
    return new DocumentRef(this.fullName(path));
  }

  /* ───────────────────────────── Transport ──────────────────────────── */

  private async request<T>(
    url: string,
    init: { method: string; body?: unknown },
    options: { allow404?: boolean } = {},
  ): Promise<T | null> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      if (attempt > 0) {
        // Backoff exponentiel avec gigue, pour ne pas resynchroniser les clients.
        await sleep(2 ** (attempt - 1) * 100 + Math.random() * 100);
      }

      let response: Response;
      try {
        const bearer = await this.token();
        response = await fetch(url, {
          method: init.method,
          headers: {
            Authorization: `Bearer ${bearer}`,
            ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          },
          body: init.body === undefined ? undefined : JSON.stringify(init.body),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (error: unknown) {
        // Panne réseau ou dépassement de délai : retentable.
        lastError = error;
        continue;
      }

      if (response.ok) {
        if (response.status === 204) return null;
        return (await response.json()) as T;
      }

      if (response.status === 404 && options.allow404) return null;

      const raw = await response.text().catch(() => '');
      let parsed: GoogleErrorBody = {};
      try {
        parsed = JSON.parse(raw) as GoogleErrorBody;
      } catch {
        // Corps non JSON : on garde le texte brut dans le message.
      }
      const error = new FirestoreError(
        parsed.error?.message ?? raw.slice(0, 300) ?? response.statusText,
        response.status,
        parsed.error?.status ?? 'UNKNOWN',
      );

      if (!RETRYABLE_HTTP.has(response.status)) throw error;
      lastError = error;
    }

    throw lastError instanceof Error
      ? lastError
      : new FirestoreError('Firestore injoignable', 503, 'UNAVAILABLE');
  }

  private toSnapshot(document: FsDocument): DocSnapshot {
    const path = refPathFromName(document.name);
    return {
      id: docIdFromPath(path),
      path,
      data: decodeFields(document.fields ?? {}),
      createTime: document.createTime,
      updateTime: document.updateTime,
    };
  }

  /* ─────────────────────────────── Lectures ─────────────────────────── */

  /** Lit un document. Renvoie `null` s'il n'existe pas. */
  async get(path: string, transaction?: string): Promise<DocSnapshot | null> {
    const url = new URL(`${this.documentsRoot}/${path.replace(/^\/+/, '')}`);
    if (transaction) url.searchParams.set('transaction', transaction);

    const document = await this.request<FsDocument>(url.toString(), { method: 'GET' }, { allow404: true });
    return document ? this.toSnapshot(document) : null;
  }

  /**
   * Lit N documents en un aller-retour (`:batchGet`).
   *
   * Le résultat est réordonné pour suivre l'ordre des chemins demandés — l'API ne
   * garantit pas l'ordre de la réponse. Les documents absents valent `null`.
   */
  async getAll(paths: string[], transaction?: string): Promise<Array<DocSnapshot | null>> {
    if (paths.length === 0) return [];

    const response = await this.request<Array<{ found?: FsDocument; missing?: string }>>(
      `${this.documentsRoot}:batchGet`,
      {
        method: 'POST',
        body: {
          documents: paths.map((path) => this.fullName(path)),
          ...(transaction ? { transaction } : {}),
        },
      },
    );

    const byPath = new Map<string, DocSnapshot>();
    for (const entry of response ?? []) {
      if (entry.found) {
        const snapshot = this.toSnapshot(entry.found);
        byPath.set(snapshot.path, snapshot);
      }
    }
    return paths.map((path) => byPath.get(path.replace(/^\/+/, '')) ?? null);
  }

  /** Exécute une requête structurée. */
  async query(query: Query, transaction?: string): Promise<DocSnapshot[]> {
    const { parent, collectionId } = splitCollectionPath(query.collection);
    const url = parent
      ? `${this.documentsRoot}/${parent}:runQuery`
      : `${this.documentsRoot}:runQuery`;

    const response = await this.request<Array<{ document?: FsDocument }>>(url, {
      method: 'POST',
      body: {
        structuredQuery: buildStructuredQuery(query, collectionId),
        ...(transaction ? { transaction } : {}),
      },
    });

    // La première entrée ne porte parfois qu'un `readTime`, sans document.
    return (response ?? []).filter((entry) => entry.document).map((entry) => this.toSnapshot(entry.document as FsDocument));
  }

  /**
   * Parcourt une requête page par page.
   *
   * `__name__` est ajouté en dernière clé de tri pour rendre le curseur total :
   * l'API REST n'a pas d'équivalent de `startAfter(snapshot)`.
   *
   * ⚠️ Ne pas combiner avec `select` si les champs triés n'y figurent pas — le
   * curseur ne pourrait plus être construit.
   */
  async *queryPaged(query: Query, pageSize: number): AsyncGenerator<DocSnapshot[]> {
    const orderBy = [...(query.orderBy ?? [])];
    if (!orderBy.some((order) => order.field === '__name__')) {
      orderBy.push({ field: '__name__', direction: orderBy[0]?.direction ?? 'asc' });
    }

    let cursor: Cursor | undefined = query.startAt;
    for (;;) {
      const page: DocSnapshot[] = await this.query({
        ...query,
        orderBy,
        limit: pageSize,
        startAt: cursor,
      });
      if (page.length === 0) return;

      yield page;
      if (page.length < pageSize) return;

      const last = page[page.length - 1];
      cursor = {
        values: orderBy.map((order) =>
          order.field === '__name__' ? this.ref(last.path) : last.data[order.field],
        ),
        before: false,
      };
    }
  }

  /** Compte les documents correspondant à une requête, sans les rapatrier. */
  async count(query: Query): Promise<number> {
    const { parent, collectionId } = splitCollectionPath(query.collection);
    const url = parent
      ? `${this.documentsRoot}/${parent}:runAggregationQuery`
      : `${this.documentsRoot}:runAggregationQuery`;

    const response = await this.request<
      Array<{ result?: { aggregateFields?: Record<string, FsValue> } }>
    >(url, {
      method: 'POST',
      body: {
        structuredAggregationQuery: {
          structuredQuery: buildStructuredQuery(query, collectionId),
          aggregations: [{ alias: 'count', count: {} }],
        },
      },
    });

    const field = response?.[0]?.result?.aggregateFields?.count;
    return field && 'integerValue' in field ? Number(field.integerValue) : 0;
  }

  /* ─────────────────────────────── Écritures ────────────────────────── */

  /**
   * Écrit un document.
   *
   * `merge: false` (défaut) remplace le document entier ; `merge: true` ne touche
   * que les champs fournis.
   */
  async set(
    path: string,
    data: Record<string, unknown>,
    options: { merge?: boolean } = {},
  ): Promise<void> {
    await this.commit([this.buildWrite(path, data, { mask: options.merge === true })]);
  }

  /**
   * Met à jour les champs fournis, en échouant si le document n'existe pas.
   *
   * ⚠️ Un PATCH sans `updateMask` remplacerait tout le document : le masque est
   * donc toujours construit.
   */
  async update(path: string, data: Record<string, unknown>): Promise<void> {
    await this.commit([
      { ...this.buildWrite(path, data, { mask: true }), currentDocument: { exists: true } },
    ]);
  }

  /** Supprime un document. Idempotent. */
  async delete(path: string): Promise<void> {
    await this.commit([{ delete: this.fullName(path) }]);
  }

  /** Crée un document avec un identifiant généré côté serveur. Renvoie son chemin. */
  async add(collectionPath: string, data: Record<string, unknown>): Promise<string> {
    const { fields, transforms } = encodeWrite(data);

    const created = await this.request<FsDocument>(
      `${this.documentsRoot}/${collectionPath.replace(/^\/+/, '')}`,
      { method: 'POST', body: { fields } },
    );
    if (!created) throw new FirestoreError('Création sans réponse', 500, 'INTERNAL');

    const path = refPathFromName(created.name);
    // Les transforms ne peuvent pas accompagner un createDocument : second appel.
    if (transforms.length > 0) {
      await this.commit([{ update: { name: created.name }, updateMask: { fieldPaths: [] }, updateTransforms: transforms }]);
    }
    return path;
  }

  /** Construit une écriture unitaire, exploitable dans `commit()` ou une transaction. */
  buildWrite(
    path: string,
    data: Record<string, unknown>,
    options: { mask: boolean },
  ): Write {
    const { fields, transforms, maskPaths } = encodeWrite(data);
    const write: Write = { update: { name: this.fullName(path), fields } };
    if (options.mask) write.updateMask = { fieldPaths: maskPaths };
    if (transforms.length > 0) write.updateTransforms = transforms;
    return write;
  }

  /** Applique un lot d'écritures de façon atomique. */
  async commit(writes: Write[], transaction?: string): Promise<void> {
    if (writes.length === 0) return;
    await this.request(`${this.documentsRoot}:commit`, {
      method: 'POST',
      body: { writes, ...(transaction ? { transaction } : {}) },
    });
  }

  /* ────────────────────────────── Transactions ──────────────────────── */

  /**
   * Exécute une transaction lecture-écriture, avec retentative sur `ABORTED`.
   *
   * Le callback peut être rejoué : il ne doit produire aucun effet de bord hors
   * des écritures qu'il déclare.
   */
  async runTransaction<T>(
    fn: (tx: Transaction) => Promise<T>,
    options: { maxAttempts?: number } = {},
  ): Promise<T> {
    const maxAttempts = options.maxAttempts ?? 5;
    let previous: string | undefined;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const begun = await this.request<{ transaction: string }>(
        `${this.databaseRoot}/documents:beginTransaction`,
        {
          method: 'POST',
          body: { options: { readWrite: previous ? { retryTransaction: previous } : {} } },
        },
      );
      const transactionId = begun?.transaction;
      if (!transactionId) throw new FirestoreError('Transaction non ouverte', 500, 'INTERNAL');

      const tx = new Transaction(this, transactionId);
      try {
        const result = await fn(tx);
        await this.commit(tx.writes, transactionId);
        return result;
      } catch (error: unknown) {
        const aborted = error instanceof FirestoreError && error.status === 'ABORTED';
        if (!aborted) {
          // Libérer les verrous sans masquer l'erreur d'origine.
          await this.rollback(transactionId).catch(() => undefined);
          throw error;
        }
        lastError = error;
        previous = transactionId;
        await sleep(2 ** attempt * 50 + Math.random() * 50);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new FirestoreError('Transaction abandonnée après retentatives', 409, 'ABORTED');
  }

  private async rollback(transaction: string): Promise<void> {
    await this.request(`${this.databaseRoot}/documents:rollback`, {
      method: 'POST',
      body: { transaction },
    });
  }
}

/**
 * Contexte d'une transaction : les lectures sont immédiates et cohérentes, les
 * écritures sont accumulées puis appliquées au `commit`.
 */
export class Transaction {
  readonly writes: Write[] = [];

  constructor(
    private readonly db: Firestore,
    private readonly id: string,
  ) {}

  get(path: string): Promise<DocSnapshot | null> {
    return this.db.get(path, this.id);
  }

  getAll(paths: string[]): Promise<Array<DocSnapshot | null>> {
    return this.db.getAll(paths, this.id);
  }

  query(query: Query): Promise<DocSnapshot[]> {
    return this.db.query(query, this.id);
  }

  set(path: string, data: Record<string, unknown>, options: { merge?: boolean } = {}): void {
    this.writes.push(this.db.buildWrite(path, data, { mask: options.merge === true }));
  }

  update(path: string, data: Record<string, unknown>): void {
    this.writes.push({
      ...this.db.buildWrite(path, data, { mask: true }),
      currentDocument: { exists: true },
    });
  }

  delete(path: string): void {
    this.writes.push({ delete: this.db.fullName(path) });
  }
}
