import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import { CLUB_MEMBER_FORMATION_DISCOUNT } from '../src/lib/bictorys';
import { resolveCheckoutTotal } from '../src/lib/checkout';

/**
 * Ce calcul sert le devis affiché ET le débit. Une erreur ici n'apparaît qu'au relevé
 * bancaire de quelqu'un — c'est la définition du défaut que ce module a été écrit pour
 * fermer, et la remise membre est la première occasion de le rouvrir.
 */

const PRIX = 100_000;

function dans(jours: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString();
}

/** Faux Firestore : la formation, l'abonnement Club, et les coupons. */
function fauxDb(opts: {
  club?: Record<string, unknown> | null;
  coupon?: Record<string, unknown> | null;
} = {}) {
  return {
    get: vi.fn(async (chemin: string) => {
      if (chemin.startsWith('formations/')) {
        return { path: chemin, id: 'f1', data: { status: 'published', price: PRIX, title: 'SEO local' } };
      }
      if (chemin.startsWith('club_subscriptions/')) {
        return opts.club ? { path: chemin, id: 'u1', data: opts.club } : null;
      }
      return null;
    }),
    query: vi.fn(async () =>
      opts.coupon ? [{ path: 'coupons/c1', id: 'c1', data: opts.coupon }] : [],
    ),
  } as unknown as Firestore;
}

const MEMBRE = { status: 'active', expiresAt: dans(90) };
const COUPON = (value: number) => ({ code: 'PROMO', active: true, type: 'percentage', value });

describe('la remise membre passe par le calcul unique', () => {
  it('un non-membre paie le prix catalogue', async () => {
    const total = await resolveCheckoutTotal(fauxDb(), 'f1', { uid: 'u1' });
    expect(total.clubMember).toBe(false);
    expect(total.clubDiscount).toBe(0);
    expect(total.finalPrice).toBe(PRIX);
  });

  it('un membre actif obtient la remise, sans rien demander', async () => {
    const total = await resolveCheckoutTotal(fauxDb({ club: MEMBRE }), 'f1', { uid: 'u1' });
    expect(total.clubMember).toBe(true);
    expect(total.clubDiscount).toBe(PRIX * CLUB_MEMBER_FORMATION_DISCOUNT);
    expect(total.finalPrice).toBe(PRIX - total.clubDiscount);
  });

  it('un abonnement expiré ne donne aucune remise', async () => {
    const total = await resolveCheckoutTotal(
      fauxDb({ club: { status: 'active', expiresAt: dans(-1) } }), 'f1', { uid: 'u1' },
    );
    expect(total.clubMember).toBe(false);
    expect(total.finalPrice).toBe(PRIX);
  });

  it('un abonnement en attente de paiement non plus', async () => {
    const total = await resolveCheckoutTotal(
      fauxDb({ club: { status: 'pending', expiresAt: dans(90) } }), 'f1', { uid: 'u1' },
    );
    expect(total.clubMember).toBe(false);
  });

  /*
   * ⚠️ Sans `uid`, on ne devine pas une appartenance. Le devis d'un appelant anonyme — s'il
   * en existait un jour — ne doit pas annoncer une remise que le débit ne fera pas.
   */
  it('sans uid, aucune remise et aucune lecture d’abonnement', async () => {
    const db = fauxDb({ club: MEMBRE });
    const total = await resolveCheckoutTotal(db, 'f1', {});
    expect(total.clubDiscount).toBe(0);
    const lectures = (db.get as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(lectures.some((p: string) => p.startsWith('club_subscriptions/'))).toBe(false);
  });
});

describe('la remise membre et le coupon ne se cumulent jamais', () => {
  /*
   * Empiler produirait un prix que personne n'a chiffré : `validateCoupon` calcule ses
   * pourcentages contre `basePrice`, pas contre le prix déjà remisé.
   */
  it('retient le coupon quand il est plus généreux', async () => {
    const total = await resolveCheckoutTotal(
      fauxDb({ club: MEMBRE, coupon: COUPON(30) }), 'f1', { uid: 'u1', couponCode: 'PROMO' },
    );
    expect(total.couponDiscount).toBe(30_000);
    expect(total.clubDiscount).toBe(20_000);
    expect(total.finalPrice).toBe(PRIX - 30_000);
    // Le coupon a servi : il est retenu, donc consommé au webhook.
    expect(total.couponId).toBe('c1');
  });

  it('retient la remise membre quand elle est plus généreuse', async () => {
    const total = await resolveCheckoutTotal(
      fauxDb({ club: MEMBRE, coupon: COUPON(10) }), 'f1', { uid: 'u1', couponCode: 'PROMO' },
    );
    expect(total.couponDiscount).toBe(10_000);
    expect(total.clubDiscount).toBe(20_000);
    expect(total.finalPrice).toBe(PRIX - 20_000);
  });

  /*
   * ⚠️ UN COUPON QUI N'A PAS SERVI NE SE CONSOMME PAS. Le webhook incrémente `usedCount` sur
   * `couponId` : le retenir alors que la remise membre l'a emporté viderait un code pour rien,
   * au détriment de la personne suivante.
   */
  it('ne retient pas un coupon que la remise membre a battu', async () => {
    const total = await resolveCheckoutTotal(
      fauxDb({ club: MEMBRE, coupon: COUPON(10) }), 'f1', { uid: 'u1', couponCode: 'PROMO' },
    );
    expect(total.couponId).toBeUndefined();
    expect(total.couponCode).toBeUndefined();
  });

  it('à égalité, le coupon est retenu et donc consommé', async () => {
    const total = await resolveCheckoutTotal(
      fauxDb({ club: MEMBRE, coupon: COUPON(20) }), 'f1', { uid: 'u1', couponCode: 'PROMO' },
    );
    expect(total.finalPrice).toBe(PRIX - 20_000);
    expect(total.couponId).toBe('c1');
  });

  it('un code invalide reste refusé, membre ou non', async () => {
    await expect(
      resolveCheckoutTotal(fauxDb({ club: MEMBRE }), 'f1', { uid: 'u1', couponCode: 'FAUX' }),
    ).rejects.toThrow();
  });
});
