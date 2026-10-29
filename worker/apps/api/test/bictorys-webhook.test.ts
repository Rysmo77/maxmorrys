import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Env } from '../src/env';

/**
 * LE WEBHOOK BICTORYS TEL QUE BICTORYS L'ENVOIE — et le renouvellement du Club.
 *
 * Ce fichier n'existait pas, et c'est pour ça que le webhook a pu refuser 100 % des
 * notifications réelles sans que rien ne casse : il attendait une signature HMAC dans
 * `x-bictorys-signature`, un statut en minuscules et un champ `chargeId`. La doc dit
 * `X-Secret-Key` en clair, « SUCCEEDED », et `id`. Les corps ci-dessous suivent la doc.
 */

/* ── Faux Firestore : égalités seulement, ce que le webhook demande. ── */
type Doc = Record<string, unknown>;
let store: Map<string, Doc>;

function snap(path: string) {
  const data = store.get(path);
  return data ? { path, id: path.split('/').pop()!, data: { ...data } } : null;
}

const db = {
  get: vi.fn(async (path: string) => snap(path)),
  set: vi.fn(async (path: string, data: Doc, opts?: { merge?: boolean }) => {
    store.set(path, opts?.merge ? { ...(store.get(path) ?? {}), ...data } : { ...data });
  }),
  update: vi.fn(async (path: string, data: Doc) => {
    store.set(path, { ...(store.get(path) ?? {}), ...data });
  }),
  delete: vi.fn(async (path: string) => { store.delete(path); }),
  query: vi.fn(async (q: { collection: string; where?: Array<{ field: string; value: unknown }>; limit?: number }) => {
    const out = [...store.keys()]
      .filter((p) => p.startsWith(`${q.collection}/`) && p.split('/').length === 2)
      .map((p) => snap(p)!)
      .filter((s) => (q.where ?? []).every((w) => s.data[w.field] === w.value));
    return q.limit ? out.slice(0, q.limit) : out;
  }),
};

vi.mock('../src/context', () => ({ getFirestore: () => db }));
vi.mock('../src/lib/transaction-mail', () => ({
  envoyerCourriersTransaction: vi.fn(async () => ({ confirmation: 'envoyee', facture: 'envoyee' })),
}));
vi.mock('../src/lib/meta-capi', () => ({ sendConversionEvent: vi.fn(async () => undefined) }));
vi.mock('../src/lib/referral', () => ({ recompenserParrain: vi.fn(async () => ({ recompense: false })) }));

const { handleBictorysWebhook } = await import('../src/webhook/bictorys');
const { dateDuLien, LIEN_JOURS_AVANT } = await import('../src/lib/bictorys-billing');
const { prolonger, programmerRenouvellementsClub } = await import('../src/lib/club-autorenew');

const SECRET = 'secret-de-test';
const env = { BICTORYS_WEBHOOK_SECRET: SECRET } as unknown as Env;

function post(body: unknown, headers: Record<string, string> = { 'X-Secret-Key': SECRET }) {
  return handleBictorysWebhook(
    new Request('https://api.maxmorrys.me/bictorysWebhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
    env,
  );
}

beforeEach(() => {
  store = new Map();
  vi.clearAllMocks();
});

describe('authentification — l\'en-tête X-Secret-Key de la doc', () => {
  it('accepte le secret en clair', async () => {
    expect((await post({ id: 'x', status: 'SUCCEEDED' })).status).toBe(200);
  });

  it('refuse un secret faux, et l\'absence d\'en-tête', async () => {
    expect((await post({ id: 'x' }, { 'X-Secret-Key': 'faux' })).status).toBe(403);
    expect((await post({ id: 'x' }, {})).status).toBe(403);
  });
});

describe('un paiement initial — corps au format de la doc', () => {
  beforeEach(() => {
    store.set('transactions/txn1', {
      id: 'txn1', userId: 'u1', userEmail: 'a@b.sn', status: 'pending', chargeId: 'charge-rendue',
      ligne: 'club', formationId: 'club_digitos', amount: 19900, currency: 'XOF',
    });
    store.set('club_subscriptions/u1', { userId: 'u1', status: 'pending', chargeId: 'charge-rendue' });
  });

  it('« SUCCEEDED » en majuscules active le Club, retrouvé par paymentReference', async () => {
    const r = await post({ id: 'autre-id', status: 'SUCCEEDED', paymentReference: 'txn1', amount: 19900, currency: 'XOF' });
    expect(r.status).toBe(200);
    expect(store.get('transactions/txn1')!.status).toBe('completed');
    expect(store.get('club_subscriptions/u1')!.status).toBe('active');
  });

  it('un montant en euros n\'est pas comparé aux francs', async () => {
    await post({ id: 'charge-rendue', status: 'succeeded', amount: 30, currency: 'EUR' });
    expect(store.get('transactions/txn1')!.status).toBe('completed');
  });

  it('un montant en francs divergent est rejeté et la transaction reste en attente', async () => {
    const r = await post({ id: 'charge-rendue', status: 'succeeded', amount: 100, currency: 'XOF' });
    expect(r.status).toBe(400);
    expect(store.get('transactions/txn1')!.status).toBe('pending');
  });

  it('un échec efface l\'abonnement en attente, même si l\'id du webhook diffère', async () => {
    await post({ id: 'autre-id', status: 'FAILED', paymentReference: 'txn1' });
    expect(store.get('transactions/txn1')!.status).toBe('failed');
    expect(store.has('club_subscriptions/u1')).toBe(false);
  });
});

describe('une échéance de renouvellement payée', () => {
  const FIN = '2027-01-10T00:00:00.000Z';
  beforeEach(() => {
    store.set('club_subscriptions/u2', {
      userId: 'u2', userEmail: 'c@d.sn', status: 'active', expiresAt: FIN, autoRenew: true,
      autoRenewMode: 'bictorys', bictorysSubscriptionId: 'sub-1', bictorysCustomerId: 'cus-1',
      bictorysPlanAmount: 19900, renewalLinkDate: '2027-01-03',
    });
  });

  it('prolonge d\'un an depuis la fin actuelle et facture la transaction', async () => {
    await post({ id: 'pay-1', status: 'SUCCEEDED', paymentReference: 'clubrenew_u2', amount: 19900, currency: 'XOF' });
    const sub = store.get('club_subscriptions/u2')!;
    expect(sub.expiresAt).toBe('2028-01-10T00:00:00.000Z');
    expect(sub.renewalLinkDate).toBe('2028-01-03');
    const txns = [...store.entries()].filter(([p]) => p.startsWith('transactions/'));
    expect(txns).toHaveLength(1);
    expect(txns[0][1]).toMatchObject({ status: 'completed', renouvellement: true, chargeId: 'pay-1' });
  });

  it('se retrouve aussi par le client, sans référence', async () => {
    await post({ id: 'pay-2', status: 'succeeded', customerId: 'cus-1', amount: 19900 });
    expect(store.get('club_subscriptions/u2')!.expiresAt).toBe('2028-01-10T00:00:00.000Z');
  });

  it('une relivraison ne prolonge pas deux fois', async () => {
    const corps = { id: 'pay-3', status: 'SUCCEEDED', paymentReference: 'clubrenew_u2', amount: 19900 };
    await post(corps);
    store.delete('webhook_events/pay-3'); // même si le marqueur d'idempotence manquait
    await post(corps);
    expect(store.get('club_subscriptions/u2')!.expiresAt).toBe('2028-01-10T00:00:00.000Z');
  });

  it('un autre paiement du même client, à un autre montant, n\'offre pas un an de Club', async () => {
    await post({ id: 'pay-4', status: 'succeeded', customerId: 'cus-1', amount: 5000, currency: 'XOF' });
    expect(store.get('club_subscriptions/u2')!.expiresAt).toBe(FIN);
  });

  it('rien sans renouvellement programmé', async () => {
    store.set('club_subscriptions/u2', { ...store.get('club_subscriptions/u2')!, bictorysSubscriptionId: null });
    await post({ id: 'pay-5', status: 'succeeded', paymentReference: 'clubrenew_u2', amount: 19900 });
    expect(store.get('club_subscriptions/u2')!.expiresAt).toBe(FIN);
  });
});

describe('dates', () => {
  const AUJ = new Date('2026-10-29T08:00:00.000Z');

  it('le lien part sept jours avant la fin', () => {
    expect(LIEN_JOURS_AVANT).toBe(7);
    expect(dateDuLien('2027-10-29T10:00:00.000Z', AUJ)).toBe('2027-10-22');
  });

  it('jamais avant demain, et rien si l\'accès finit avant', () => {
    expect(dateDuLien('2026-11-02T10:00:00.000Z', AUJ)).toBe('2026-10-30');
    expect(dateDuLien('2026-10-30T00:00:00.000Z', AUJ)).toBeNull();
  });

  it('prolonger part de la fin future, ou de maintenant si elle est passée', () => {
    expect(prolonger('2027-01-10T00:00:00.000Z', AUJ)).toBe('2028-01-10T00:00:00.000Z');
    expect(prolonger('2026-01-10T00:00:00.000Z', AUJ)).toBe('2027-10-29T08:00:00.000Z');
  });
});

describe('programmerRenouvellementsClub', () => {
  const AUJ = new Date('2026-10-29T08:00:00.000Z');
  const envCron = { BICTORYS_SECRET_KEY: 'secret-x', BICTORYS_API_URL: 'https://api.bictorys.com/pay/v1/charges' } as unknown as Env;

  it('crée client, plan et abonnement pour qui a consenti — et seulement pour lui', async () => {
    store.set('club_subscriptions/a', { userId: 'a', userEmail: 'a@x.sn', status: 'active', autoRenew: true, autoRenewMode: 'bictorys', expiresAt: '2027-10-29T00:00:00.000Z' });
    store.set('club_subscriptions/b', { userId: 'b', status: 'active', autoRenew: true, expiresAt: '2027-10-29T00:00:00.000Z' });
    const appels: Array<[string, unknown]> = [];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const chemin = new URL(String(url)).pathname;
      appels.push([chemin, JSON.parse(String((init as RequestInit).body))]);
      const id = chemin.includes('customers') ? 'cus-a' : chemin.includes('plans') ? 'plan-1' : 'sub-a';
      return new Response(JSON.stringify({ id }), { status: 201 });
    });

    const bilan = await programmerRenouvellementsClub(db as never, envCron, AUJ);
    fetchMock.mockRestore();

    expect(bilan).toEqual({ examines: 1, programmes: 1, echecs: 0 });
    expect(appels.map(([c]) => c)).toEqual([
      '/billing/v1/subscription-plans',
      '/customer-management/v1/customers',
      '/billing/v1/subscriptions',
    ]);
    expect(appels[0][1]).toMatchObject({ amount: 19900, currency: 'XOF', installmentIntervalDays: 365 });
    expect(appels[1][1]).toMatchObject({ country: 'SN', email: 'a@x.sn' });
    expect(appels[2][1]).toMatchObject({ subscriptionPlanId: 'plan-1', customerId: 'cus-a', startDate: '2027-10-22', reference: 'clubrenew_a' });
    expect(store.get('club_subscriptions/a')).toMatchObject({ bictorysSubscriptionId: 'sub-a', renewalLinkDate: '2027-10-22' });
    expect(store.get('club_subscriptions/b')!.bictorysSubscriptionId).toBeUndefined();
  });
});
