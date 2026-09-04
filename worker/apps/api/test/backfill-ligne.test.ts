import { describe, expect, it, vi } from 'vitest';

import type { CallContext } from '../src/context';
import { backfillLigne } from '../src/handlers/backfillLigne';

/**
 * Une reprise écrit dans la collection comptable. Ce qui doit tenir : elle ne touche que ce
 * qui manque, elle n'écrase jamais ce qu'un paiement a inscrit, et relancer une fois de trop
 * ne fait rien.
 */

/** Faux Firestore : `queryPaged`, `buildWrite`, `commit`. */
function fauxDb(transactions: Array<Record<string, unknown>>, pageSize = 400) {
  const store = transactions.map((data, i) => ({
    path: `transactions/t${i}`,
    id: `t${i}`,
    data: { ...data },
  }));
  const ecrites: Array<{ path: string; data: Record<string, unknown> }> = [];

  return {
    store,
    ecrites,
    db: {
      queryPaged: vi.fn(async function* () {
        for (let i = 0; i < store.length; i += pageSize) yield store.slice(i, i + pageSize);
      }),
      buildWrite: vi.fn((path: string, data: Record<string, unknown>) => ({ path, data })),
      commit: vi.fn(async (writes: Array<{ path: string; data: Record<string, unknown> }>) => {
        for (const w of writes) {
          ecrites.push(w);
          const cible = store.find((s) => s.path === w.path);
          if (cible) Object.assign(cible.data, w.data);
        }
      }),
    },
  };
}

function contexte(db: unknown): CallContext {
  return {
    db,
    // `requireAdmin` accepte le claim avant toute lecture Firestore.
    auth: { uid: 'admin1', admin: true },
  } as unknown as CallContext;
}

const FORMATION = { formationId: 'kR3xY', amount: 95000 };
const CLUB = { formationId: 'club_digitos', amount: 19900 };
const PACK = { formationId: 'rysmo_pack_regular', rysmoKind: 'pack', amount: 1500 };

describe('backfillLigne', () => {
  it('pose la ligne déduite sur les transactions qui n’en ont pas', async () => {
    const { db, store } = fauxDb([FORMATION, CLUB, PACK]);
    const bilan = (await backfillLigne(null, contexte(db))) as {
      updated: number;
      parLigne: Record<string, number>;
      hasMore: boolean;
    };

    expect(bilan.updated).toBe(3);
    expect(bilan.parLigne).toEqual({ formation: 1, club: 1, rysmoPack: 1 });
    expect(store.map((s) => s.data.ligne)).toEqual(['formation', 'club', 'rysmoPack']);
  });

  /*
   * ⚠️ Un champ écrit par le Worker fait foi. Une reprise qui le « corrigerait » d'après la
   * déduction réécrirait l'histoire — et se tromperait le jour où un produit nouveau n'a plus
   * de forme historique reconnaissable.
   */
  it('ne réécrit jamais une ligne déjà posée, même divergente', async () => {
    const { db, ecrites, store } = fauxDb([{ ...CLUB, ligne: 'formation' }]);
    const bilan = (await backfillLigne(null, contexte(db))) as { updated: number };

    expect(bilan.updated).toBe(0);
    expect(ecrites).toEqual([]);
    expect(store[0].data.ligne).toBe('formation');
  });

  it('relancer après une reprise finie ne fait rien', async () => {
    const { db, ecrites } = fauxDb([FORMATION, CLUB]);
    await backfillLigne(null, contexte(db));
    const nb = ecrites.length;

    const second = (await backfillLigne(null, contexte(db))) as { updated: number; hasMore: boolean };
    expect(second.updated).toBe(0);
    expect(second.hasMore).toBe(false);
    expect(ecrites).toHaveLength(nb);
  });

  it('ne commet rien quand la page n’a rien à écrire', async () => {
    const { db } = fauxDb([{ ...FORMATION, ligne: 'formation' }]);
    await backfillLigne(null, contexte(db));
    expect((db.commit as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('rend un bilan vide sur une collection vide', async () => {
    const { db } = fauxDb([]);
    expect(await backfillLigne(null, contexte(db))).toEqual({
      updated: 0, parLigne: {}, lus: 0, hasMore: false,
    });
  });

  it('refuse un appelant qui n’est pas administrateur', async () => {
    const { db } = fauxDb([FORMATION]);
    const context = {
      db,
      auth: { uid: 'bob' },
      // `requireAdmin` retombe sur le document `users/` quand le claim est absent.
      // Ici il n'existe pas : l'accès doit être refusé.
    } as unknown as CallContext;
    (context.db as unknown as { get: unknown }).get = vi.fn(async () => null);

    await expect(backfillLigne(null, context)).rejects.toThrow();
  });
});
