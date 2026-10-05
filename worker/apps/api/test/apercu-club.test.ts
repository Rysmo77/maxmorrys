import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import type { CallContext } from '../src/context';
import { appApercuClub } from '../src/handlers/app/apercuClub';

/**
 * Les compteurs derrière les cadenas du Club. Deux choses doivent tenir : ce sont de VRAIS
 * comptes (pas des constantes), et un compte qui échoue rend `null` — « non relevé » à
 * l'écran — jamais un zéro qu'on n'a pas mesuré.
 */

type Doc = Record<string, unknown>;

function contexte(collections: Record<string, Doc[]>, enPanne: string[] = [], auth = true): CallContext {
  const lire = (collection: string) => {
    if (enPanne.includes(collection)) throw new Error('agrégation refusée');
    return (collections[collection] ?? []).map((data, i) => ({ id: String(i), path: `${collection}/${i}`, data }));
  };
  const db = {
    query: vi.fn(async (q: { collection: string; orderBy?: Array<{ field: string; direction?: string }>; limit?: number; where?: Array<{ field: string; op: string; value: unknown }> }) => {
      let docs = lire(q.collection);
      for (const w of q.where ?? []) {
        docs = docs.filter((d) => {
          const v = d.data[w.field] as string | number;
          return w.op === '>=' ? v >= (w.value as string) : w.op === '<' ? v < (w.value as string) : w.op === '==' ? v === w.value : true;
        });
      }
      const o = q.orderBy?.[0];
      if (o) {
        docs = docs.filter((d) => typeof d.data[o.field] === 'number')
          .sort((a, b) => ((a.data[o.field] as number) - (b.data[o.field] as number)) * (o.direction === 'desc' ? -1 : 1));
      }
      return docs.slice(0, q.limit ?? docs.length);
    }),
    count: vi.fn(async (q: { collection: string; where?: Array<{ field: string; op: string; value: unknown }> }) => {
      let docs = lire(q.collection);
      for (const w of q.where ?? []) {
        docs = docs.filter((d) => {
          const v = d.data[w.field] as string;
          return w.op === '>=' ? v >= (w.value as string) : w.op === '<' ? v < (w.value as string) : w.op === '==' ? v === w.value : true;
        });
      }
      return docs.length;
    }),
  } as unknown as Firestore;
  return { db, auth: auth ? { uid: 'u1' } : null } as unknown as CallContext;
}

const maintenant = new Date();
const il = (jours: number) => new Date(maintenant.getTime() - jours * 86_400_000).toISOString();
const dans = (jours: number) => new Date(maintenant.getTime() + jours * 86_400_000).toISOString();

describe('appApercuClub', () => {
  it('compte ce qu’il y a réellement derrière chaque cadenas', async () => {
    const r = await appApercuClub({}, contexte({
      club_posts: [
        { createdAt: il(1), category: 'general', commentsCount: 2 },
        { createdAt: il(2), category: 'question', comments: 1 }, // ancien format de l'app
        { createdAt: il(20), category: 'general', commentsCount: 9 }, // hors semaine
      ],
      club_opportunities: [{ budget: 50_000 }, { budget: 300_000 }, { title: 'sans budget' }],
      club_sessions: [{ startsAt: dans(1), capacity: 20, registeredCount: 5 }, { startsAt: dans(2) }],
      club_subscriptions: [{ status: 'active', startedAt: il(1) }, { status: 'expired', startedAt: il(400) }],
      referrals: [{}, {}],
    }));
    const par = Object.fromEntries(r.vue.onglets.map((o) => [o.onglet, o.compteurs]));
    expect(r.vue.onglets.map((o) => o.onglet)).toEqual(
      ['Fil', 'Discussions', 'Membres', 'Agenda', 'Classement', 'Opportunités', 'Informations', 'Parrainage']);
    expect(par.Fil.map((c) => c.n)).toEqual([2, 3, 2]);
    expect(par.Opportunités.map((c) => c.n)).toEqual([3, 50_000, 300_000]);
    /* Seule la session qui DÉCLARE une capacité compte des places. */
    expect(par.Agenda[1].n).toBe(15);
    expect(par.Membres[1].n).toBe(1);
    expect(par.Parrainage[0].n).toBe(2);
    expect(r.releveA).toBeTruthy();
  });

  it('un compte qui échoue vaut null, jamais zéro', async () => {
    const r = await appApercuClub({}, contexte({}, ['club_opportunities']));
    const opp = r.vue.onglets.find((o) => o.onglet === 'Opportunités')!.compteurs;
    expect(opp.map((c) => c.n)).toEqual([null, null, null]);
    /* Une collection vide, elle, est un zéro MESURÉ. */
    expect(r.vue.onglets.find((o) => o.onglet === 'Parrainage')!.compteurs[0].n).toBe(0);
  });

  it('refuse un appel anonyme', async () => {
    await expect(appApercuClub({}, contexte({}, [], false))).rejects.toThrow();
  });
});
