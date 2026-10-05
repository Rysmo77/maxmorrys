import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import type { CallContext } from '../src/context';
import { appTransaction } from '../src/handlers/app/transaction';

/**
 * Le retour de paiement dans l'application. Elle CONSTATE : « C'est à toi » ne s'écrit que si
 * l'accès est réellement ouvert, et une transaction d'autrui ne se lit pas.
 */
function contexte(docs: Record<string, Record<string, unknown>>, uid = 'u1'): CallContext {
  const db = {
    get: vi.fn(async (chemin: string) => (docs[chemin] ? { id: chemin.split('/').pop(), path: chemin, data: docs[chemin] } : null)),
  } as unknown as Firestore;
  return { db, auth: { uid } } as unknown as CallContext;
}

const tx = (extra: Record<string, unknown>) => ({
  userId: 'u1', status: 'completed', ligne: 'formation', formationId: 'f1',
  formationTitle: 'SEO local', formationSlug: 'seo-local', amount: 25_000, currency: 'XOF',
  createdAt: '2026-10-05T10:00:00Z', ...extra,
});

describe('appTransaction', () => {
  it('ne lit pas la transaction de quelqu’un d’autre', async () => {
    const r = await appTransaction({ transactionId: 'abc123' }, contexte({ 'transactions/abc123': tx({ userId: 'autre' }) }));
    expect(r.vue).toBeNull();
  });

  it('payée mais accès pas encore ouvert : acces = false', async () => {
    const r = await appTransaction({ transactionId: 'abc123' }, contexte({ 'transactions/abc123': tx({}) }));
    expect(r.vue?.statut).toBe('completed');
    expect(r.vue?.acces).toBe(false);
  });

  it('payée et inscription présente : acces = true', async () => {
    const r = await appTransaction({ transactionId: 'abc123' }, contexte({
      'transactions/abc123': tx({}), 'enrollments/u1_f1': { userId: 'u1' },
    }));
    expect(r.vue).toMatchObject({ acces: true, titre: 'SEO local', montant: 25_000, ligne: 'formation' });
  });

  it('le Club : l’accès est l’abonnement ACTIF', async () => {
    const club = tx({ ligne: 'club', formationId: 'club_digitos' });
    const sans = await appTransaction({ transactionId: 'abc123' }, contexte({ 'transactions/abc123': club, 'club_subscriptions/u1': { status: 'pending' } }));
    expect(sans.vue?.acces).toBe(false);
    const avec = await appTransaction({ transactionId: 'abc123' }, contexte({ 'transactions/abc123': club, 'club_subscriptions/u1': { status: 'active' } }));
    expect(avec.vue?.acces).toBe(true);
  });

  it('en attente : jamais d’accès annoncé', async () => {
    const r = await appTransaction({ transactionId: 'abc123' }, contexte({ 'transactions/abc123': tx({ status: 'pending' }), 'enrollments/u1_f1': {} }));
    expect(r.vue).toMatchObject({ statut: 'pending', acces: false });
  });

  it('refuse un identifiant qui pourrait sortir de la collection', async () => {
    await expect(appTransaction({ transactionId: '../users/u2' }, contexte({}))).rejects.toThrow();
  });
});
