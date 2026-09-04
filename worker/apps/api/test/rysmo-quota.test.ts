import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import { QUOTAS_HERITES, SUBSCRIPTION_QUOTAS, resolveQuotaLimits } from '../src/lib/rysmo-quota';

/**
 * Le quota d'un abonné est un CONTRAT. Ce fichier tient la seule chose qui compte à son
 * sujet : ce qu'on lui a vendu ne bouge pas quand le tarif du jour bouge.
 */

/** Une échéance à N jours d'aujourd'hui. */
function dans(jours: number): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString();
}

/** Faux Firestore : `query` pour les abonnements Rysmo, `get` pour le Club. */
function fauxDb(abonnements: Array<Record<string, unknown>>, club: Record<string, unknown> | null = null) {
  return {
    query: vi.fn(async () =>
      abonnements.map((data, i) => ({ path: `rysmoSubscriptions/s${i}`, id: `s${i}`, data })),
    ),
    get: vi.fn(async () => (club ? { path: 'club_subscriptions/u', id: 'u', data: club } : null)),
  } as unknown as Firestore;
}

const ACTIF = { status: 'active', plan: 'pro', expiresAt: dans(20) };

describe('resolveQuotaLimits — le quota vendu, pas le quota du jour', () => {
  it('lit l’estampille du document quand elle est là', async () => {
    const limits = await resolveQuotaLimits(fauxDb([{ ...ACTIF, dailyQuota: 100 }]), 'u');
    expect(limits.dailyLimit).toBe(100);
    expect(limits.hasActiveSubscription).toBe(true);
  });

  /*
   * ⚠️ LE CAS QUI JUSTIFIE TOUT LE DISPOSITIF. Le jour où le plafond de Pro sera abaissé,
   * `SUBSCRIPTION_QUOTAS` changera. Un abonné dont le document porte 100 doit garder 100
   * jusqu'à son terme — sinon on réécrit un contrat déjà conclu, et la seule personne à
   * s'en apercevoir est celle qui vient de payer.
   */
  it('l’estampille l’emporte sur le tarif du jour', async () => {
    const limits = await resolveQuotaLimits(fauxDb([{ ...ACTIF, dailyQuota: 77 }]), 'u');
    expect(limits.dailyLimit).toBe(77);
    expect(limits.dailyLimit).not.toBe(SUBSCRIPTION_QUOTAS.pro);
  });

  /* L'absence du champ EST la preuve d'antériorité : pas de script de reprise à écrire. */
  it('retombe sur la table gelée pour un document antérieur au champ', async () => {
    const limits = await resolveQuotaLimits(fauxDb([ACTIF]), 'u');
    expect(limits.dailyLimit).toBe(QUOTAS_HERITES.pro);
  });

  it('ignore une estampille absurde et retombe sur la table gelée', async () => {
    for (const absurde of [0, -5, 'beaucoup']) {
      const limits = await resolveQuotaLimits(fauxDb([{ ...ACTIF, dailyQuota: absurde }]), 'u');
      expect(limits.dailyLimit).toBe(QUOTAS_HERITES.pro);
    }
  });

  it('un plan inconnu n’ouvre aucun quota d’abonnement', async () => {
    const limits = await resolveQuotaLimits(fauxDb([{ ...ACTIF, plan: 'platine' }]), 'u');
    expect(limits.hasActiveSubscription).toBe(false);
    expect(limits.dailyLimit).toBe(2);
  });

  it('sans abonnement, le quota de base, et pas de reprise à proposer', async () => {
    const limits = await resolveQuotaLimits(fauxDb([]), 'u');
    expect(limits.dailyLimit).toBe(2);
    expect(limits.hasActiveSubscription).toBe(false);
    expect(limits.expiresAt).toBeNull();
    // Rien à renouveler, donc rien ne bloque : la première souscription est ouverte.
    expect(limits.canRenew).toBe(true);
  });

  it('un abonnement expiré ne porte plus son quota', async () => {
    const limits = await resolveQuotaLimits(fauxDb([{ ...ACTIF, dailyQuota: 100, expiresAt: dans(-1) }]), 'u');
    expect(limits.hasActiveSubscription).toBe(false);
    expect(limits.dailyLimit).toBe(2);
  });

  it('expose l’échéance et l’état de reprise', async () => {
    const terme = dans(3);
    const limits = await resolveQuotaLimits(fauxDb([{ ...ACTIF, dailyQuota: 100, expiresAt: terme }]), 'u');
    expect(limits.expiresAt).toBe(terme);
    expect(limits.canRenew).toBe(true);
  });

  it('la reprise reste fermée hors fenêtre', async () => {
    const limits = await resolveQuotaLimits(fauxDb([{ ...ACTIF, dailyQuota: 100, expiresAt: dans(20) }]), 'u');
    expect(limits.canRenew).toBe(false);
  });

  it('le bonus du Club s’applique à qui n’a pas d’abonnement Rysmo+', async () => {
    const limits = await resolveQuotaLimits(fauxDb([], { status: 'active', expiresAt: dans(200) }), 'u');
    expect(limits.hasClubBonus).toBe(true);
    expect(limits.dailyLimit).toBe(5);
  });
});

describe('la table gelée', () => {
  /*
   * Elle DÉCRIT un état passé ; elle ne se dérive pas de l'état courant. Si quelqu'un
   * remplaçait un jour son contenu par `SUBSCRIPTION_QUOTAS`, le grand-père disparaîtrait
   * sans qu'aucun test ne tombe — sauf celui-ci.
   */
  it('porte les valeurs vendues jusqu’ici, et rien d’autre', () => {
    expect(QUOTAS_HERITES).toEqual({ lite: 20, pro: 100 });
  });

  it('n’est pas le même objet que le tarif du jour', () => {
    expect(QUOTAS_HERITES).not.toBe(SUBSCRIPTION_QUOTAS);
  });
});
