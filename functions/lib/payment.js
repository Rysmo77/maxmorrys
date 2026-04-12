"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.bictorysWebhook = exports.createBictorysCharge = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const crypto_1 = require("crypto");
const meta_capi_1 = require("./meta-capi");
const bictorysApiKey = (0, params_1.defineSecret)('BICTORYS_API_KEY');
const bictorysWebhookSecret = (0, params_1.defineSecret)('BICTORYS_WEBHOOK_SECRET');
const bictorysApiUrl = (0, params_1.defineString)('BICTORYS_API_URL', {
    default: 'https://api.bictorys.com/pay/v1/charges',
    description: 'Bictorys API URL (use https://api.test.bictorys.com/pay/v1/charges for testing)',
});
exports.createBictorysCharge = (0, https_1.onCall)({ region: 'us-central1', secrets: [bictorysApiKey] }, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const { formationId, formationSlug, metaEventId } = request.data;
    if (!formationId || !formationSlug) {
        throw new https_1.HttpsError('invalid-argument', 'formationId et formationSlug sont obligatoires.');
    }
    // Read formation from Firestore for canonical price
    const formationDoc = await admin.firestore().doc(`formations/${formationId}`).get();
    if (!formationDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Formation introuvable.');
    }
    const formation = formationDoc.data();
    const finalPrice = (_a = formation.promoPrice) !== null && _a !== void 0 ? _a : formation.price;
    if (finalPrice <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'Cette formation est gratuite, pas besoin de paiement.');
    }
    // Get user info
    const uid = request.auth.uid;
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userDoc.data();
    // Check if already enrolled
    const enrollmentId = `${uid}_${formationId}`;
    const existingEnrollment = await admin.firestore().doc(`enrollments/${enrollmentId}`).get();
    if (existingEnrollment.exists) {
        throw new https_1.HttpsError('already-exists', 'Tu es déjà inscrit à cette formation.');
    }
    // Call Bictorys API
    const apiKey = bictorysApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'Service de paiement non configuré.');
    }
    let bictorysResponse;
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
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Bictorys charge creation failed:', errMsg);
        throw new https_1.HttpsError('internal', 'Erreur lors de la création du paiement. Réessaie.');
    }
    // Create transaction record server-side
    const txnRef = admin.firestore().collection('transactions').doc();
    await txnRef.set(Object.assign(Object.assign({ id: txnRef.id, userId: uid, userEmail: (_c = (_b = request.auth.token.email) !== null && _b !== void 0 ? _b : userData === null || userData === void 0 ? void 0 : userData.email) !== null && _c !== void 0 ? _c : '', userName: (_e = (_d = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _d !== void 0 ? _d : request.auth.token.name) !== null && _e !== void 0 ? _e : '', formationId,
        formationSlug, formationTitle: (_f = formation.title) !== null && _f !== void 0 ? _f : '', amount: finalPrice, currency: 'XOF', status: 'pending', paymentMethod: 'bictorys', chargeId: bictorysResponse.chargeId, opToken: bictorysResponse.opToken }, (metaEventId && { metaEventId })), { createdAt: new Date().toISOString() }));
    return {
        checkoutUrl: bictorysResponse.link,
        transactionId: txnRef.id,
    };
});
/**
 * Verify Bictorys webhook signature (HMAC-SHA256).
 * Bictorys sends the signature in the `X-Bictorys-Signature` header.
 * If no webhook secret is configured, fall back to chargeId cross-check
 * against existing pending transactions (defense in depth).
 */
function verifyWebhookSignature(rawBody, signature, secret) {
    if (!signature || !secret)
        return false;
    const expected = (0, crypto_1.createHmac)('sha256', secret).update(rawBody).digest('hex');
    try {
        return (0, crypto_1.timingSafeEqual)(Buffer.from(signature), Buffer.from(expected));
    }
    catch (_a) {
        return false; // length mismatch
    }
}
exports.bictorysWebhook = (0, https_1.onRequest)({ region: 'us-central1', secrets: [bictorysWebhookSecret, meta_capi_1.metaAccessToken] }, async (req, res) => {
    var _a;
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    // ── Signature verification ───────────────────────────────────────────
    const webhookSecret = bictorysWebhookSecret.value();
    if (webhookSecret) {
        const signature = req.headers['x-bictorys-signature'];
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
            console.warn('Bictorys webhook: invalid or missing signature');
            res.status(403).send('Forbidden');
            return;
        }
    }
    else {
        console.warn('Bictorys webhook: BICTORYS_WEBHOOK_SECRET not configured — signature verification skipped');
    }
    const body = req.body;
    const chargeId = (_a = body === null || body === void 0 ? void 0 : body.chargeId) !== null && _a !== void 0 ? _a : body === null || body === void 0 ? void 0 : body.charge_id;
    const status = body === null || body === void 0 ? void 0 : body.status;
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
        await (0, meta_capi_1.sendConversionEvent)('Purchase', {
            content_ids: [txnData.formationId],
            content_name: txnData.formationTitle,
            content_type: 'product',
            value: txnData.amount,
            currency: txnData.currency || 'XOF',
        }, {
            em: txnData.userEmail,
            client_ip_address: req.ip || undefined,
            client_user_agent: req.headers['user-agent'] || undefined,
        }, txnData.metaEventId);
    }
    else if (isFailed) {
        await txnDoc.ref.update({
            status: 'failed',
        });
        console.log('Bictorys webhook: payment failed for chargeId', chargeId);
    }
    else {
        console.log('Bictorys webhook: unhandled status', status, 'for chargeId', chargeId);
    }
    res.status(200).send('OK');
});
//# sourceMappingURL=payment.js.map