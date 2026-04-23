import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { defineSecret, defineString } from 'firebase-functions/params';
import { createHmac, timingSafeEqual } from 'crypto';
import { sendConversionEvent, metaAccessToken } from './meta-capi';

const bictorysApiKey = defineSecret('BICTORYS_API_KEY');
const bictorysWebhookSecret = defineSecret('BICTORYS_WEBHOOK_SECRET');
const bictorysApiUrl = defineString('BICTORYS_API_URL', {
  default: 'https://api.bictorys.com/pay/v1/charges',
  description: 'Bictorys API URL (use https://api.test.bictorys.com/pay/v1/charges for testing)',
});

/**
 * Validate a coupon code against the coupons collection.
 * Returns the validated coupon data and discount amount, or null if invalid.
 */
async function validateCoupon(
  couponCode: string,
  originalPrice: number,
): Promise<{ couponId: string; discount: number } | null> {
  const couponsQuery = await admin.firestore()
    .collection('coupons')
    .where('code', '==', couponCode.trim().toUpperCase())
    .where('active', '==', true)
    .limit(1)
    .get();

  if (couponsQuery.empty) return null;

  const couponDoc = couponsQuery.docs[0];
  const coupon = couponDoc.data();

  // Check expiration
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return null;

  // Check usage limit
  if (coupon.maxUses && (coupon.usedCount ?? 0) >= coupon.maxUses) return null;

  // Calculate discount
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = Math.round(originalPrice * (coupon.value / 100));
  } else {
    discount = Math.min(coupon.value, originalPrice);
  }

  return { couponId: couponDoc.id, discount };
}

export const createBictorysCharge = onCall(
  { region: 'us-central1', secrets: [bictorysApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const { formationId, formationSlug, metaEventId, couponCode } = request.data as {
      formationId: string;
      formationSlug: string;
      metaEventId?: string;
      couponCode?: string;
    };

    if (!formationId || !formationSlug) {
      throw new HttpsError('invalid-argument', 'formationId et formationSlug sont obligatoires.');
    }

    // Read formation from Firestore for canonical price
    const formationDoc = await admin.firestore().doc(`formations/${formationId}`).get();
    if (!formationDoc.exists) {
      throw new HttpsError('not-found', 'Formation introuvable.');
    }

    const formation = formationDoc.data()!;
    let finalPrice = formation.promoPrice ?? formation.price;

    if (finalPrice <= 0) {
      throw new HttpsError('invalid-argument', 'Cette formation est gratuite, pas besoin de paiement.');
    }

    // Validate and apply coupon if provided
    let couponId: string | undefined;
    let couponDiscount = 0;
    if (couponCode?.trim()) {
      const couponResult = await validateCoupon(couponCode, finalPrice);
      if (!couponResult) {
        throw new HttpsError('invalid-argument', 'Code promo invalide, expiré ou déjà utilisé.');
      }
      couponId = couponResult.couponId;
      couponDiscount = couponResult.discount;
      finalPrice = finalPrice - couponDiscount;

      if (finalPrice <= 0) {
        throw new HttpsError('invalid-argument', 'Ce coupon rend la formation gratuite. Utilise l\'inscription gratuite.');
      }
    }

    // Get user info
    const uid = request.auth.uid;
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userDoc.data();

    // Check if already enrolled
    const enrollmentId = `${uid}_${formationId}`;
    const existingEnrollment = await admin.firestore().doc(`enrollments/${enrollmentId}`).get();
    if (existingEnrollment.exists) {
      throw new HttpsError('already-exists', 'Tu es déjà inscrit à cette formation.');
    }

    // Call Bictorys API
    const apiKey = bictorysApiKey.value();
    if (!apiKey) {
      throw new HttpsError('internal', 'Service de paiement non configuré.');
    }

    let bictorysResponse: { link: string; chargeId: string; opToken: string };
    try {
      const res = await fetch(bictorysApiUrl.value(), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ amount: finalPrice, currency: 'XOF' }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error('Bictorys API error:', res.status, errBody);
        throw new Error(`Bictorys returned ${res.status}`);
      }

      bictorysResponse = await res.json();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Bictorys charge creation failed:', errMsg);
      throw new HttpsError('internal', 'Erreur lors de la création du paiement. Réessaie.');
    }

    // Increment coupon usage count atomically
    if (couponId) {
      await admin.firestore().doc(`coupons/${couponId}`).update({
        usedCount: admin.firestore.FieldValue.increment(1),
      });
    }

    // Create transaction record server-side
    const txnRef = admin.firestore().collection('transactions').doc();
    await txnRef.set({
      id: txnRef.id,
      userId: uid,
      userEmail: request.auth.token.email ?? userData?.email ?? '',
      userName: userData?.displayName ?? request.auth.token.name ?? '',
      formationId,
      formationSlug,
      formationTitle: formation.title ?? '',
      amount: finalPrice,
      currency: 'XOF',
      status: 'pending',
      paymentMethod: 'bictorys',
      chargeId: bictorysResponse.chargeId,
      opToken: bictorysResponse.opToken,
      ...(couponId && { couponId, couponCode: couponCode!.trim().toUpperCase(), couponDiscount }),
      ...(metaEventId && { metaEventId }),
      createdAt: new Date().toISOString(),
    });

    return {
      checkoutUrl: bictorysResponse.link,
      transactionId: txnRef.id,
    };
  }
);

export const createClubCharge = onCall(
  { region: 'us-central1', secrets: [bictorysApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const { autoRenew } = request.data as { autoRenew?: boolean };

    const uid = request.auth.uid;

    // Check if already has active or pending subscription
    const existingSub = await admin.firestore().doc(`club_subscriptions/${uid}`).get();
    if (existingSub.exists) {
      const subData = existingSub.data()!;
      if (subData.status === 'active' && new Date(subData.expiresAt) > new Date()) {
        throw new HttpsError('already-exists', 'Tu es déjà membre actif du Club des Digitos.');
      }
      if (subData.status === 'pending') {
        throw new HttpsError('already-exists', 'Un paiement est déjà en cours pour le Club.');
      }
    }

    const CLUB_PRICE = 19900;

    // Get user info
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userDoc.data();

    // Call Bictorys API
    const apiKey = bictorysApiKey.value();
    if (!apiKey) {
      throw new HttpsError('internal', 'Service de paiement non configuré.');
    }

    let bictorysResponse: { link: string; chargeId: string; opToken: string };
    try {
      const res = await fetch(bictorysApiUrl.value(), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ amount: CLUB_PRICE, currency: 'XOF' }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error('Bictorys API error:', res.status, errBody);
        throw new Error(`Bictorys returned ${res.status}`);
      }

      bictorysResponse = await res.json();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Bictorys club charge creation failed:', errMsg);
      throw new HttpsError('internal', 'Erreur lors de la création du paiement. Réessaie.');
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create club subscription with pending status
    await admin.firestore().doc(`club_subscriptions/${uid}`).set({
      userId: uid,
      userEmail: request.auth.token.email ?? userData?.email ?? '',
      userName: userData?.displayName ?? request.auth.token.name ?? '',
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      autoRenew: autoRenew ?? true,
      status: 'pending',
      amount: CLUB_PRICE,
      chargeId: bictorysResponse.chargeId,
    });

    // Create transaction record
    const txnRef = admin.firestore().collection('transactions').doc();
    await txnRef.set({
      id: txnRef.id,
      userId: uid,
      userEmail: request.auth.token.email ?? userData?.email ?? '',
      userName: userData?.displayName ?? request.auth.token.name ?? '',
      formationId: 'club_digitos',
      formationSlug: 'club-des-digitos',
      formationTitle: 'Club des Digitos — Abonnement annuel',
      amount: CLUB_PRICE,
      currency: 'XOF',
      status: 'pending',
      paymentMethod: 'bictorys',
      chargeId: bictorysResponse.chargeId,
      opToken: bictorysResponse.opToken,
      createdAt: now.toISOString(),
    });

    return {
      checkoutUrl: bictorysResponse.link,
      transactionId: txnRef.id,
    };
  }
);

/**
 * Verify Bictorys webhook signature (HMAC-SHA256).
 * Bictorys sends the signature in the `X-Bictorys-Signature` header.
 * If no webhook secret is configured, fall back to chargeId cross-check
 * against existing pending transactions (defense in depth).
 */
function verifyWebhookSignature(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false; // length mismatch
  }
}

export const bictorysWebhook = onRequest(
  { region: 'us-central1', secrets: [bictorysWebhookSecret, metaAccessToken] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // ── Signature verification (fail-closed) ─────────────────────────────
    const webhookSecret = bictorysWebhookSecret.value();
    if (!webhookSecret) {
      console.error('Bictorys webhook: BICTORYS_WEBHOOK_SECRET not configured — refusing webhook');
      res.status(500).send('Server misconfigured');
      return;
    }
    const signature = req.headers['x-bictorys-signature'] as string | undefined;
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.warn('Bictorys webhook: invalid or missing signature');
      res.status(403).send('Forbidden');
      return;
    }

    const body = req.body;
    const chargeId: string | undefined = body?.chargeId ?? body?.charge_id;
    const status: string | undefined = body?.status;

    if (!chargeId) {
      console.warn('Bictorys webhook: missing chargeId', body);
      res.status(200).send('OK');
      return;
    }

    // ── Idempotency: track processed chargeIds ──────────────────────────
    const eventRef = admin.firestore().doc(`webhook_events/${chargeId}`);
    const eventSnap = await eventRef.get();
    if (eventSnap.exists && eventSnap.data()?.status === status) {
      console.log('Bictorys webhook: duplicate event ignored', chargeId, status);
      res.status(200).send('OK');
      return;
    }
    await eventRef.set(
      { chargeId, status, receivedAt: new Date().toISOString() },
      { merge: true },
    );

    // Find the pending transaction matching this chargeId
    const txnQuery = await admin.firestore()
      .collection('transactions')
      .where('chargeId', '==', chargeId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (txnQuery.empty) {
      // Already processed or unknown — acknowledge to prevent retries
      console.log('Bictorys webhook: no pending transaction for chargeId', chargeId);
      res.status(200).send('OK');
      return;
    }

    const txnDoc = txnQuery.docs[0];
    const txnData = txnDoc.data();

    const isSuccess = status === 'succeeded' || status === 'completed' || status === 'successful';
    const isFailed = status === 'failed' || status === 'expired' || status === 'cancelled';

    if (isSuccess) {
      // Mark transaction as completed
      await txnDoc.ref.update({
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      const isClubPayment = txnData.formationId === 'club_digitos';

      if (isClubPayment) {
        // Activate club subscription
        const subRef = admin.firestore().doc(`club_subscriptions/${txnData.userId}`);
        await subRef.update({ status: 'active' });
        console.log('Bictorys webhook: club subscription activated for user', txnData.userId);
      } else {
        // Auto-create enrollment for course
        const enrollmentId = `${txnData.userId}_${txnData.formationId}`;
        const enrollmentRef = admin.firestore().doc(`enrollments/${enrollmentId}`);
        const existing = await enrollmentRef.get();
        if (!existing.exists) {
          await enrollmentRef.set({
            id: enrollmentId,
            userId: txnData.userId,
            formationId: txnData.formationId,
            enrolledAt: new Date().toISOString(),
            progress: 0,
            completedLessons: [],
            certificateIssued: false,
          });
        }
        console.log('Bictorys webhook: payment succeeded, enrollment created for', enrollmentId);
      }

      // Send server-side Purchase event via Meta Conversions API
      await sendConversionEvent(
        'Purchase',
        {
          content_ids: [txnData.formationId],
          content_name: txnData.formationTitle,
          content_type: 'product',
          value: txnData.amount,
          currency: txnData.currency || 'XOF',
        },
        {
          em: txnData.userEmail,
          client_ip_address: req.ip || undefined,
          client_user_agent: req.headers['user-agent'] || undefined,
        },
        txnData.metaEventId,
      );
    } else if (isFailed) {
      await txnDoc.ref.update({
        status: 'failed',
      });
      console.log('Bictorys webhook: payment failed for chargeId', chargeId);
    } else {
      console.log('Bictorys webhook: unhandled status', status, 'for chargeId', chargeId);
    }

    res.status(200).send('OK');
  }
);
