import type { Firestore } from '@mm/firestore-rest';
import { HttpsError } from '@mm/shared';

import type { Env } from '../env';
import { toDate, toNumber } from './values';

/** Création de charges Bictorys — port de `functions/src/payment.ts`. */

export interface BictorysChargeResult {
  link: string;
  chargeId: string;
  opToken: string;
}

export interface ChargeCustomer {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * Crée une charge hébergée Bictorys.
 *
 * `payment_type` est volontairement omis : la page hébergée laisse alors
 * l'utilisateur choisir Wave, Orange Money ou carte. Les URL de retour pointent
 * vers `/paiement/retour` avec la référence, pour ramener l'utilisateur dans
 * l'app après paiement.
 */
export async function createHostedCharge(
  env: Env,
  options: {
    amount: number;
    paymentReference: string;
    customer: ChargeCustomer;
    logLabel: string;
  },
): Promise<BictorysChargeResult> {
  const returnUrl = `${env.APP_BASE_URL}/paiement/retour?transactionId=${options.paymentReference}`;

  const response = await fetch(env.BICTORYS_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-API-Key': env.BICTORYS_API_KEY as string,
    },
    body: JSON.stringify({
      amount: options.amount,
      currency: 'XOF',
      paymentReference: options.paymentReference,
      successRedirectUrl: returnUrl,
      errorRedirectUrl: returnUrl,
      customer: {
        ...(options.customer.name ? { name: options.customer.name } : {}),
        ...(options.customer.email ? { email: options.customer.email } : {}),
        ...(options.customer.phone ? { phone: options.customer.phone } : {}),
        country: 'SN',
        locale: 'fr',
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error(`Bictorys (${options.logLabel}) :`, response.status, detail.slice(0, 300));
    throw new Error(`Bictorys a répondu ${response.status}`);
  }

  return (await response.json()) as BictorysChargeResult;
}

/** Valide un code promo et calcule la remise. `null` si invalide. */
export async function validateCoupon(
  db: Firestore,
  couponCode: string,
  originalPrice: number,
): Promise<{ couponId: string; discount: number } | null> {
  const found = await db.query({
    collection: 'coupons',
    where: [
      { field: 'code', op: '==', value: couponCode.trim().toUpperCase() },
      { field: 'active', op: '==', value: true },
    ],
    limit: 1,
  });
  if (found.length === 0) return null;

  const coupon = found[0].data;

  const expiresAt = toDate(coupon.expiresAt);
  if (expiresAt && expiresAt < new Date()) return null;

  const maxUses = toNumber(coupon.maxUses);
  if (maxUses && toNumber(coupon.usedCount) >= maxUses) return null;

  const value = toNumber(coupon.value);
  const discount =
    coupon.type === 'percentage'
      ? Math.round(originalPrice * (value / 100))
      : Math.min(value, originalPrice);

  return { couponId: found[0].id, discount };
}

export function requireApiKey(env: Env): void {
  if (!env.BICTORYS_API_KEY) {
    throw new HttpsError('internal', 'Service de paiement non configuré.');
  }
}

export const RYSMO_PACKS: Record<string, { requests: number; price: number; label: string }> = {
  discovery: { requests: 30, price: 500, label: 'Pack Découverte Rysmo — 30 requêtes' },
  regular: { requests: 100, price: 1500, label: 'Pack Régulier Rysmo — 100 requêtes' },
  intensive: { requests: 300, price: 3500, label: 'Pack Intensif Rysmo — 300 requêtes' },
};

export const RYSMO_SUBSCRIPTIONS: Record<string, { price: number; label: string }> = {
  lite: { price: 3000, label: 'Rysmo+ Lite — 20 requêtes/jour' },
  pro: { price: 7500, label: 'Rysmo+ Pro — 100 requêtes/jour' },
};

export const CLUB_PRICE = 19900;
/** Remise de parrainage accordée au filleul. */
export const REFERRAL_DISCOUNT = 0.15;
