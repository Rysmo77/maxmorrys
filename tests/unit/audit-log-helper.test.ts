import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `audited()` — la trace des écritures de console NON gardées par la règle (audit du
 * 03/11/2026, A1 complet). Trois promesses à tenir :
 *   1. une écriture qui ÉCHOUE ne laisse aucune trace (pas de faux « a publié ») ;
 *   2. une trace qui échoue ne fait pas échouer l'écriture déjà réussie ;
 *   3. l'action respecte la forme que `firestore.rules` exige — sinon la règle refuserait
 *      l'entrée, et le journal resterait vide sans que personne ne le voie.
 */

const commits: Array<Record<string, unknown>> = [];
let commitFails = false;

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn((_db: unknown, col?: string, id?: string) => ({ col, id: id ?? 'auto-id' })),
  getDoc: vi.fn(async () => ({ data: () => ({ role: 'admin' }), exists: () => true })),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  writeBatch: vi.fn(() => {
    const ops: Array<Record<string, unknown>> = [];
    return {
      set: (ref: unknown, data: Record<string, unknown>) => ops.push({ ref, data }),
      delete: vi.fn(),
      update: vi.fn(),
      commit: async () => {
        if (commitFails) throw new Error('réseau');
        commits.push(...ops.map((o) => o.data as Record<string, unknown>));
      },
    };
  }),
}));
vi.mock('../../src/config/db', () => ({ db: {} }));
vi.mock('../../src/config/firebase', () => ({ auth: { currentUser: { uid: 'admin-1' } } }));
const captured: unknown[] = [];
vi.mock('../../src/lib/sentry', () => ({ captureError: (e: unknown) => { captured.push(e); } }));

const { audited, saveVerb, AUDIT_ACTION_RE } = await import('../../src/lib/admin/auditLog');

beforeEach(() => { commits.length = 0; captured.length = 0; commitFails = false; });

describe('audited()', () => {
  it('trace après une écriture réussie, avec l’identifiant rendu par l’écriture', async () => {
    const id = await audited(
      (newId: string) => ({ action: 'blog.create', targetCollection: 'blog', targetId: newId, space: 'hub', summary: 'Titre' }),
      async () => 'post-42',
    );
    expect(id).toBe('post-42');
    expect(commits).toHaveLength(1);
    expect(commits[0]).toMatchObject({
      actorUid: 'admin-1', actorRole: 'admin', action: 'blog.create',
      targetCollection: 'blog', targetId: 'post-42', at: 'SERVER_TS', space: 'hub', summary: 'Titre',
    });
  });

  it('une écriture refusée ne laisse AUCUNE trace et l’erreur remonte', async () => {
    await expect(audited({ action: 'coupons.update', targetCollection: 'coupons', targetId: 'c1' }, async () => {
      throw new Error('permission-denied');
    })).rejects.toThrow('permission-denied');
    expect(commits).toHaveLength(0);
  });

  it('un journal en échec ne fait pas échouer l’action déjà faite — il est signalé', async () => {
    commitFails = true;
    await expect(audited({ action: 'faq.update', targetCollection: 'faq', targetId: 'f1' }, async () => 'ok')).resolves.toBe('ok');
    expect(captured).toHaveLength(1);
  });

  it('une action hors de la forme exigée par la règle n’est pas envoyée, et le dit', async () => {
    await audited({ action: 'Blog.Create', targetCollection: 'blog', targetId: 'x' }, async () => null);
    expect(commits).toHaveLength(0);
    expect(captured).toHaveLength(1);
  });

  it('un identifiant vide ne fait pas refuser l’entrée (la règle exige size() > 0)', async () => {
    await audited({ action: 'settings.update', targetCollection: 'settings', targetId: '' }, async () => undefined);
    expect(commits[0]?.targetId).toBe('—');
  });
});

describe('saveVerb()', () => {
  it('distingue création, mise à jour, publication et retrait', () => {
    expect(saveVerb(false, undefined, 'draft')).toBe('create');
    expect(saveVerb(false, undefined, 'published')).toBe('publish');
    expect(saveVerb(true, 'draft', 'draft')).toBe('update');
    expect(saveVerb(true, 'draft', 'published')).toBe('publish');
    expect(saveVerb(true, 'published', 'published')).toBe('update');
    expect(saveVerb(true, 'published', 'draft')).toBe('unpublish');
  });

  it('chaque verbe produit une action acceptée par la règle', () => {
    for (const verb of ['create', 'update', 'publish', 'unpublish']) {
      expect(AUDIT_ACTION_RE.test(`formations.${verb}`)).toBe(true);
    }
  });
});

describe('les actions écrites dans la console', () => {
  it('respectent toutes la forme exigée par `firestore.rules`', async () => {
    const { readFileSync, readdirSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const root = join(__dirname, '..', '..', 'src', 'pages', 'admin');
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => {
      const p = join(d, n);
      return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : [];
    });
    const actions = new Set<string>();
    for (const f of walk(root)) {
      for (const m of readFileSync(f, 'utf8').matchAll(/action:\s*(?:[^'`,]*\?\s*)?'([^']+)'(?:\s*:\s*'([^']+)')?,\s*targetCollection/g)) {
        actions.add(m[1]);
        if (m[2]) actions.add(m[2]);
      }
    }
    expect(actions.size, 'aucune action relevée — le relevé est cassé').toBeGreaterThan(20);
    for (const a of actions) expect(AUDIT_ACTION_RE.test(a), a).toBe(true);
  });
});
