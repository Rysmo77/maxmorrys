import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import {
  CLUB_PRICE,
  createHostedCharge,
  REFERRAL_DISCOUNT,
  requireApiKey,
  RYSMO_PACKS,
  RYSMO_SUBSCRIPTIONS,
  type BictorysChargeResult,
  type ChargeCustomer,
} from '../lib/bictorys';
import { asText, toDate } from '../lib/values';
import { resolveCheckoutTotal } from '../lib/checkout';

/** Port des quatre callables de paiement de `functions/src/payment.ts`. */

interface Identity {
  uid: string;
  email: string;
  name: string;
  customer: ChargeCustomer;
}

/**
 * Rassemble l'identité de l'appelant.
 *
 * L'ordre de préférence entre le document `users/` et les claims du jeton est
 * repris tel quel : le nom vient du profil en priorité, l'email du jeton.
 */
async function identify(context: CallContext, uid: string): Promise<Identity> {
  const user = await context.db.get(`users/${uid}`);
  const data = user?.data ?? {};
  const tokenName = typeof context.auth?.claims.name === 'string' ? context.auth.claims.name : undefined;

  const name = asText(data.displayName) ?? tokenName ?? '';
  const email = context.auth?.email ?? asText(data.email) ?? '';

  return {
    uid,
    email,
    name,
    customer: {
      name: asText(data.displayName) ?? tokenName,
      email: context.auth?.email ?? asText(data.email),
      phone: asText(data.phone),
    },
  };
}

/** Champs communs à toutes les transactions. */
function transactionBase(identity: Identity, txnId: string, charge: BictorysChargeResult) {
  return {
    id: txnId,
    userId: identity.uid,
    userEmail: identity.email,
    userName: identity.name,
    currency: 'XOF',
    status: 'pending',
    paymentMethod: 'bictorys',
    chargeId: charge.chargeId,
    opToken: charge.opToken,
  };
}

/**
 * Identifiant pré-alloué : il sert de `paymentReference` Bictorys et s'inscrit
 * dans l'URL de retour, donc il doit exister avant l'appel à l'API.
 */
function newTransactionId(): { id: string; path: string } {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  return { id, path: `transactions/${id}` };
}

async function charge(
  context: CallContext,
  identity: Identity,
  amount: number,
  paymentReference: string,
  logLabel: string,
): Promise<BictorysChargeResult> {
  try {
    return await createHostedCharge(context.env, {
      amount,
      paymentReference,
      customer: identity.customer,
      logLabel,
    });
  } catch (error: unknown) {
    console.error(`Création de charge Bictorys (${logLabel}) échouée :`, error);
    throw new HttpsError('internal', 'Erreur lors de la création du paiement. Réessaie.');
  }
}

/* ─────────────────────────── Achat de formation ─────────────────────────── */

export async function createBictorysCharge(data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context);
  const { formationId, formationSlug, metaEventId, couponCode } = (data ?? {}) as {
    formationId?: string;
    formationSlug?: string;
    metaEventId?: string;
    couponCode?: string;
  };

  if (!formationId || !formationSlug) {
    throw new HttpsError('invalid-argument', 'formationId et formationSlug sont obligatoires.');
  }

  /*
   * Le prix fait autorité côté serveur : relu en base, jamais reçu du client. Et il est
   * calculé par la MÊME fonction que le devis affiché à l'écran (`quoteCheckout`) — c'est
   * ce qui empêche le montant lu et le montant débité de diverger, comme ils divergeaient
   * quand le navigateur calculait le sien de son côté.
   */
  const total = await resolveCheckoutTotal(context.db, formationId, couponCode);
  const { finalPrice, couponId, couponDiscount, formationTitle } = total;

  const identity = await identify(context, uid);

  if (await context.db.get(`enrollments/${uid}_${formationId}`)) {
    throw new HttpsError('already-exists', 'Tu es déjà inscrit à cette formation.');
  }

  requireApiKey(context.env);
  const txn = newTransactionId();
  const result = await charge(context, identity, finalPrice, txn.id, 'course');

  // `usedCount` du coupon n'est incrémenté qu'au succès du paiement, dans le
  // webhook : un panier abandonné ne doit pas consommer un usage.
  await context.db.set(txn.path, {
    ...transactionBase(identity, txn.id, result),
    formationId,
    formationSlug,
    formationTitle,
    amount: finalPrice,
    ...(couponId ? { couponId, couponCode: total.couponCode, couponDiscount } : {}),
    ...(metaEventId ? { metaEventId } : {}),
    createdAt: new Date().toISOString(),
  });

  return { checkoutUrl: result.link, transactionId: txn.id };
}

/* ──────────────────────────── Abonnement Club ───────────────────────────── */

export async function createClubCharge(data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context);
  const { autoRenew } = (data ?? {}) as { autoRenew?: boolean };

  const existing = await context.db.get(`club_subscriptions/${uid}`);
  if (existing) {
    const expiresAt = toDate(existing.data.expiresAt);
    if (existing.data.status === 'active' && expiresAt && expiresAt > new Date()) {
      throw new HttpsError('already-exists', 'Tu es déjà membre actif du Club des Digitos.');
    }
    if (existing.data.status === 'pending') {
      throw new HttpsError('already-exists', 'Un paiement est déjà en cours pour le Club.');
    }
  }

  const identity = await identify(context, uid);
  const user = await context.db.get(`users/${uid}`);
  const userData = user?.data ?? {};

  // Remise de parrainage pour le filleul, si le code renvoie vers un autre compte.
  let amount = CLUB_PRICE;
  let referredByCode: string | undefined;
  const code = asText(userData.referredByCode);
  if (code && userData.referralRewarded !== true) {
    const referrers = await context.db.query({
      collection: 'users',
      where: [{ field: 'referralCode', op: '==', value: code }],
      limit: 1,
    });
    if (referrers.length > 0 && referrers[0].id !== uid) {
      amount = Math.round(CLUB_PRICE * (1 - REFERRAL_DISCOUNT));
      referredByCode = code;
    }
  }

  requireApiKey(context.env);
  const txn = newTransactionId();
  const result = await charge(context, identity, amount, txn.id, 'club');

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await context.db.set(`club_subscriptions/${uid}`, {
    userId: uid,
    userEmail: identity.email,
    userName: identity.name,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    autoRenew: autoRenew ?? true,
    status: 'pending',
    amount,
    chargeId: result.chargeId,
    ...(referredByCode ? { referredByCode } : {}),
  });

  await context.db.set(txn.path, {
    ...transactionBase(identity, txn.id, result),
    formationId: 'club_digitos',
    formationSlug: 'club-des-digitos',
    formationTitle: 'Club des Digitos — Abonnement annuel',
    amount,
    createdAt: now.toISOString(),
  });

  return { checkoutUrl: result.link, transactionId: txn.id };
}

/* ─────────────────────────── Packs et abos Rysmo ────────────────────────── */

export async function createRysmoPackCharge(data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context);
  const { pack } = (data ?? {}) as { pack?: string };
  const definition = pack ? RYSMO_PACKS[pack] : undefined;
  if (!definition) throw new HttpsError('invalid-argument', 'Pack Rysmo inconnu.');

  const identity = await identify(context, uid);
  requireApiKey(context.env);

  const txn = newTransactionId();
  const result = await charge(context, identity, definition.price, txn.id, 'rysmo pack');

  const now = new Date().toISOString();
  const purchaseId = crypto.randomUUID().replace(/-/g, '').slice(0, 20);

  await context.db.set(`rysmoPackPurchases/${purchaseId}`, {
    id: purchaseId,
    userId: uid,
    userEmail: identity.email,
    userName: identity.name,
    pack,
    requestsTotal: definition.requests,
    purchasedAt: now,
    status: 'pending',
    amount: definition.price,
    chargeId: result.chargeId,
  });

  await context.db.set(txn.path, {
    ...transactionBase(identity, txn.id, result),
    formationId: `rysmo_pack_${pack}`,
    formationSlug: `rysmo-pack-${pack}`,
    formationTitle: definition.label,
    amount: definition.price,
    createdAt: now,
    rysmoPurchaseId: purchaseId,
    rysmoKind: 'pack',
  });

  return { checkoutUrl: result.link, transactionId: txn.id };
}

export async function createRysmoSubscriptionCharge(
  data: unknown,
  context: CallContext,
): Promise<unknown> {
  const { uid } = requireAuth(context);
  const { plan } = (data ?? {}) as { plan?: string };
  const definition = plan ? RYSMO_SUBSCRIPTIONS[plan] : undefined;
  if (!definition) throw new HttpsError('invalid-argument', 'Plan Rysmo+ inconnu.');

  const active = await context.db.query({
    collection: 'rysmoSubscriptions',
    where: [
      { field: 'userId', op: '==', value: uid },
      { field: 'status', op: '==', value: 'active' },
    ],
    limit: 1,
  });
  if (active.length > 0) {
    const expiresAt = toDate(active[0].data.expiresAt);
    // Sans date d'expiration, l'abonnement est considéré comme toujours valide.
    if (!expiresAt || expiresAt > new Date()) {
      throw new HttpsError('already-exists', 'Tu as déjà un abonnement Rysmo+ actif.');
    }
  }

  const identity = await identify(context, uid);
  requireApiKey(context.env);

  const txn = newTransactionId();
  const result = await charge(context, identity, definition.price, txn.id, 'rysmo sub');

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  const subscriptionId = crypto.randomUUID().replace(/-/g, '').slice(0, 20);

  await context.db.set(`rysmoSubscriptions/${subscriptionId}`, {
    id: subscriptionId,
    userId: uid,
    userEmail: identity.email,
    userName: identity.name,
    plan,
    status: 'pending',
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    amount: definition.price,
    chargeId: result.chargeId,
  });

  await context.db.set(txn.path, {
    ...transactionBase(identity, txn.id, result),
    formationId: `rysmo_sub_${plan}`,
    formationSlug: `rysmo-sub-${plan}`,
    formationTitle: definition.label,
    amount: definition.price,
    createdAt: now.toISOString(),
    rysmoSubscriptionId: subscriptionId,
    rysmoKind: 'subscription',
  });

  return { checkoutUrl: result.link, transactionId: txn.id };
}
