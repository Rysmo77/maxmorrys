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

export const createBictorysCharge = onCall(
  { region: 'us-central1', secrets: [bictorysApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const { formationId, formationSlug, metaEventId } = request.data as {
      formationId: string;
      formationSlug: string;
      metaEventId?: string;
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
    const finalPrice = formation.promoPrice ?? formation.price;

    if (finalPrice <= 0) {
      throw new HttpsError('invalid-argument', 'Cette formation est gratuite, pas besoin de paiement.');
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
      ...(metaEventId && { metaEventId }),
      createdAt: new Date().toISOString(),
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

    // ── Signature verification ───────────────────────────────────────────
    const webhookSecret = bictorysWebhookSecret.value();
    if (webhookSecret) {
      const signature = req.headers['x-bictorys-signature'] as string | undefined;
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.warn('Bictorys webhook: invalid or missing signature');
        res.status(403).send('Forbidden');
        return;
      }
    } else {
      console.warn('Bictorys webhook: BICTORYS_WEBHOOK_SECRET not configured — signature verification skipped');
    }

    const body = req.body;
    const chargeId: string | undefined = body?.chargeId ?? body?.charge_id;
    const status: string | undefined = body?.status;

    if (!chargeId) {
      console.warn('Bictorys webhook: missing chargeId', body);
      res.status(200).send('OK');
      return;
    }

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

      // Auto-create enrollment
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
