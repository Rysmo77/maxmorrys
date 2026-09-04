import { describe, expect, it, vi } from 'vitest';

import { envoyerBienvenues, relancerPaniers } from '../src/lib/lifecycle';
import type { Env } from '../src/env';

/**
 * CE QUI EST TESTÉ ICI, C'EST LA BORNE HAUTE.
 *
 * Une passe sans borne écrirait, à sa PREMIÈRE exécution, à tous les comptes et à tous les
 * paniers abandonnés depuis toujours. Des gens inscrits il y a six mois recevraient
 * « bienvenue » ; des paniers oubliés depuis un an recevraient une relance. C'est le meilleur
 * moyen de se faire signaler comme spam dès le premier envoi, sur un domaine neuf.
 *
 * Le défaut ne se voit pas en relecture : le code « marche », il envoie même beaucoup.
 */

const env = {
  BREVO_API_KEY: 'cle',
  APP_BASE_URL: 'https://maxmorrys.me',
  EXPORT_SIGNING_KEY: 'clef',
  API_BASE_URL: 'https://api.maxmorrys.me',
} as Env;

const LE_4 = new Date('2026-09-04T08:00:00Z');

function fauxDb(collections: Record<string, Array<Record<string, unknown>>>) {
  const update = vi.fn().mockResolvedValue(undefined);
  return {
    db: {
      query: vi.fn(async (q: { collection: string }) =>
        (collections[q.collection] ?? []).map((data, i) => ({ path: `${q.collection}/d${i}`, data })),
      ),
      get: vi.fn(async () => null),
      update,
    } as never,
    update,
  };
}

function accepteTout() {
  const envois: Array<Record<string, unknown>> = [];
  vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
    envois.push(JSON.parse(String(init.body)));
    return new Response('{"messageId":"x"}', { status: 201 });
  }));
  return envois;
}

describe('la bienvenue', () => {
  it('écrit à un compte créé aujourd’hui', async () => {
    const envois = accepteTout();
    const { db, update } = fauxDb({
      users: [{ email: 'awa@example.com', role: 'student', firstName: 'Awa', createdAt: '2026-09-04T07:00:00Z' }],
    });
    const b = await envoyerBienvenues(db, env, LE_4);
    expect(b.envoyes).toBe(1);
    expect(envois).toHaveLength(1);
    expect(update.mock.calls[0][1]).toHaveProperty('welcomeSentAt');
    vi.unstubAllGlobals();
  });

  /* LA BORNE HAUTE — voir l'en-tête du fichier. */
  it('n’écrit PAS à un compte de six mois', async () => {
    const envois = accepteTout();
    const { db } = fauxDb({
      users: [{ email: 'vieux@example.com', role: 'student', createdAt: '2026-03-01T00:00:00Z' }],
    });
    const b = await envoyerBienvenues(db, env, LE_4);
    expect(b.envoyes).toBe(0);
    expect(envois).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('n’écrit pas deux fois', async () => {
    const envois = accepteTout();
    const { db } = fauxDb({
      users: [{ email: 'awa@example.com', role: 'student', createdAt: '2026-09-04T07:00:00Z', welcomeSentAt: '2026-09-04T08:00:00Z' }],
    });
    expect((await envoyerBienvenues(db, env, LE_4)).envoyes).toBe(0);
    expect(envois).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('compte à part un compte sans adresse', async () => {
    accepteTout();
    const { db } = fauxDb({ users: [{ role: 'student', createdAt: '2026-09-04T07:00:00Z' }] });
    const b = await envoyerBienvenues(db, env, LE_4);
    expect(b.ignores).toBe(1);
    expect(b.envoyes).toBe(0);
    vi.unstubAllGlobals();
  });
});

describe('la relance de panier', () => {
  it('relance un panier abandonné hier, et une seule fois', async () => {
    const envois = accepteTout();
    const { db, update } = fauxDb({
      transactions: [{
        status: 'pending', userEmail: 'awa@example.com', userName: 'Awa',
        formationTitle: 'Vendre sur WhatsApp', formationSlug: 'vendre-whatsapp',
        amount: 19900, currency: 'XOF', couponCode: 'LANCEMENT',
        createdAt: '2026-09-03T10:00:00Z',
      }],
    });
    const b = await relancerPaniers(db, env, LE_4);
    expect(b.envoyes).toBe(1);
    expect(update.mock.calls[0][1]).toHaveProperty('cartReminderSentAt');
    const params = (envois[0].params ?? {}) as Record<string, string>;
    expect(params.mentionCoupon).toContain('LANCEMENT');
    vi.unstubAllGlobals();
  });

  /*
   * NI AVANT, NI APRÈS. Trop tôt, le paiement est peut-être encore en cours chez
   * l'opérateur — on écrirait à quelqu'un qui vient de payer. Trop tard, la relance n'a
   * plus de sens et ressemble à du démarchage.
   */
  it('ignore un panier du jour même et un panier de la semaine dernière', async () => {
    const envois = accepteTout();
    const { db } = fauxDb({
      transactions: [
        { status: 'pending', userEmail: 'a@b.com', createdAt: '2026-09-04T07:00:00Z' },
        { status: 'pending', userEmail: 'c@d.com', createdAt: '2026-08-28T10:00:00Z' },
      ],
    });
    expect((await relancerPaniers(db, env, LE_4)).envoyes).toBe(0);
    expect(envois).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  /* Sans coupon, on ne parle pas de coupon : inventer « ton coupon » ferait chercher une
     remise qui n'existe pas. */
  it('adapte le texte quand il n’y a pas de coupon', async () => {
    const envois = accepteTout();
    const { db } = fauxDb({
      transactions: [{ status: 'pending', userEmail: 'a@b.com', createdAt: '2026-09-03T10:00:00Z' }],
    });
    await relancerPaniers(db, env, LE_4);
    const params = (envois[0].params ?? {}) as Record<string, string>;
    expect(params.mentionCoupon).not.toContain('coupon');
    expect(params.mentionCoupon).toContain('Rien n’a été débité');
    vi.unstubAllGlobals();
  });

  it('ne marque rien si l’envoi échoue', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));
    const { db, update } = fauxDb({
      transactions: [{ status: 'pending', userEmail: 'a@b.com', createdAt: '2026-09-03T10:00:00Z' }],
    });
    const b = await relancerPaniers(db, env, LE_4);
    expect(b.echecs).toBe(1);
    // Le marqueur n'est PAS posé : la prochaine passe réessaiera tant qu'on est à J+1.
    expect(update).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
