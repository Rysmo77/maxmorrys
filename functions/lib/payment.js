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
exports.bictorysWebhook = exports.createRysmoSubscriptionCharge = exports.createRysmoPackCharge = exports.createClubCharge = exports.createBictorysCharge = void 0;
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
const appBaseUrl = (0, params_1.defineString)('APP_BASE_URL', {
    default: 'https://maxmorrys.me',
    description: 'Public base URL used to build Bictorys success/error redirect URLs',
});
/**
 * Create a Bictorys hosted-checkout charge. Includes a paymentReference (our
 * transaction id) and success/error redirect URLs pointing to the in-app
 * /paiement/retour page so the user is returned to the app after paying, plus
 * customer info for the receipt. payment_type is intentionally omitted so the
 * hosted page lets the user pick Wave / Orange Money / card.
 */
async function createBictorysHostedCharge(opts) {
    const returnUrl = `${appBaseUrl.value()}/paiement/retour?transactionId=${opts.paymentReference}`;
    const res = await fetch(bictorysApiUrl.value(), {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'X-API-Key': opts.apiKey,
        },
        body: JSON.stringify({
            amount: opts.amount,
            currency: 'XOF',
            paymentReference: opts.paymentReference,
            successRedirectUrl: returnUrl,
            errorRedirectUrl: returnUrl,
            customer: Object.assign(Object.assign(Object.assign(Object.assign({}, (opts.customer.name && { name: opts.customer.name })), (opts.customer.email && { email: opts.customer.email })), (opts.customer.phone && { phone: opts.customer.phone })), { country: 'SN', locale: 'fr' }),
        }),
    });
    if (!res.ok) {
        const errBody = await res.text();
        console.error(`Bictorys API error (${opts.logLabel}):`, res.status, errBody);
        throw new Error(`Bictorys returned ${res.status}`);
    }
    return res.json();
}
/**
 * Validate a coupon code against the coupons collection.
 * Returns the validated coupon data and discount amount, or null if invalid.
 */
async function validateCoupon(couponCode, originalPrice) {
    var _a;
    const couponsQuery = await admin.firestore()
        .collection('coupons')
        .where('code', '==', couponCode.trim().toUpperCase())
        .where('active', '==', true)
        .limit(1)
        .get();
    if (couponsQuery.empty)
        return null;
    const couponDoc = couponsQuery.docs[0];
    const coupon = couponDoc.data();
    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
        return null;
    // Check usage limit
    if (coupon.maxUses && ((_a = coupon.usedCount) !== null && _a !== void 0 ? _a : 0) >= coupon.maxUses)
        return null;
    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
        discount = Math.round(originalPrice * (coupon.value / 100));
    }
    else {
        discount = Math.min(coupon.value, originalPrice);
    }
    return { couponId: couponDoc.id, discount };
}
exports.createBictorysCharge = (0, https_1.onCall)({ region: 'us-central1', secrets: [bictorysApiKey] }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const { formationId, formationSlug, metaEventId, couponCode } = request.data;
    if (!formationId || !formationSlug) {
        throw new https_1.HttpsError('invalid-argument', 'formationId et formationSlug sont obligatoires.');
    }
    // Read formation from Firestore for canonical price
    const formationDoc = await admin.firestore().doc(`formations/${formationId}`).get();
    if (!formationDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Formation introuvable.');
    }
    const formation = formationDoc.data();
    let finalPrice = (_a = formation.promoPrice) !== null && _a !== void 0 ? _a : formation.price;
    if (finalPrice <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'Cette formation est gratuite, pas besoin de paiement.');
    }
    // Validate and apply coupon if provided
    let couponId;
    let couponDiscount = 0;
    if (couponCode === null || couponCode === void 0 ? void 0 : couponCode.trim()) {
        const couponResult = await validateCoupon(couponCode, finalPrice);
        if (!couponResult) {
            throw new https_1.HttpsError('invalid-argument', 'Code promo invalide, expiré ou déjà utilisé.');
        }
        couponId = couponResult.couponId;
        couponDiscount = couponResult.discount;
        finalPrice = finalPrice - couponDiscount;
        if (finalPrice <= 0) {
            throw new https_1.HttpsError('invalid-argument', 'Ce coupon rend la formation gratuite. Utilise l\'inscription gratuite.');
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
        throw new https_1.HttpsError('already-exists', 'Tu es déjà inscrit à cette formation.');
    }
    // Call Bictorys API
    const apiKey = bictorysApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'Service de paiement non configuré.');
    }
    // Pre-allocate the transaction id so it can serve as the Bictorys
    // paymentReference and be embedded in the return URL.
    const txnRef = admin.firestore().collection('transactions').doc();
    let bictorysResponse;
    try {
        bictorysResponse = await createBictorysHostedCharge({
            apiKey,
            amount: finalPrice,
            paymentReference: txnRef.id,
            customer: {
                name: (_b = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _b !== void 0 ? _b : request.auth.token.name,
                email: (_c = request.auth.token.email) !== null && _c !== void 0 ? _c : userData === null || userData === void 0 ? void 0 : userData.email,
                phone: userData === null || userData === void 0 ? void 0 : userData.phone,
            },
            logLabel: 'course',
        });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Bictorys charge creation failed:', errMsg);
        throw new https_1.HttpsError('internal', 'Erreur lors de la création du paiement. Réessaie.');
    }
    // Create transaction record server-side. Coupon usedCount is incremented in
    // the webhook on payment success (not here) so abandoned checkouts don't
    // consume a coupon use.
    await txnRef.set(Object.assign(Object.assign(Object.assign({ id: txnRef.id, userId: uid, userEmail: (_e = (_d = request.auth.token.email) !== null && _d !== void 0 ? _d : userData === null || userData === void 0 ? void 0 : userData.email) !== null && _e !== void 0 ? _e : '', userName: (_g = (_f = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _f !== void 0 ? _f : request.auth.token.name) !== null && _g !== void 0 ? _g : '', formationId,
        formationSlug, formationTitle: (_h = formation.title) !== null && _h !== void 0 ? _h : '', amount: finalPrice, currency: 'XOF', status: 'pending', paymentMethod: 'bictorys', chargeId: bictorysResponse.chargeId, opToken: bictorysResponse.opToken }, (couponId && { couponId, couponCode: couponCode.trim().toUpperCase(), couponDiscount })), (metaEventId && { metaEventId })), { createdAt: new Date().toISOString() }));
    return {
        checkoutUrl: bictorysResponse.link,
        transactionId: txnRef.id,
    };
});
exports.createClubCharge = (0, https_1.onCall)({ region: 'us-central1', secrets: [bictorysApiKey] }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const { autoRenew } = request.data;
    const uid = request.auth.uid;
    // Check if already has active or pending subscription
    const existingSub = await admin.firestore().doc(`club_subscriptions/${uid}`).get();
    if (existingSub.exists) {
        const subData = existingSub.data();
        if (subData.status === 'active' && new Date(subData.expiresAt) > new Date()) {
            throw new https_1.HttpsError('already-exists', 'Tu es déjà membre actif du Club des Digitos.');
        }
        if (subData.status === 'pending') {
            throw new https_1.HttpsError('already-exists', 'Un paiement est déjà en cours pour le Club.');
        }
    }
    const CLUB_PRICE = 19900;
    // Get user info
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userDoc.data();
    // Referral discount for referee (15% off) — only if a valid referrer code and not yet rewarded
    const REFERRAL_DISCOUNT = 0.15;
    let amount = CLUB_PRICE;
    let referredByCode;
    if ((userData === null || userData === void 0 ? void 0 : userData.referredByCode) && !(userData === null || userData === void 0 ? void 0 : userData.referralRewarded)) {
        const refSnap = await admin.firestore().collection('users')
            .where('referralCode', '==', userData.referredByCode).limit(1).get();
        if (!refSnap.empty && refSnap.docs[0].id !== uid) {
            amount = Math.round(CLUB_PRICE * (1 - REFERRAL_DISCOUNT));
            referredByCode = userData.referredByCode;
        }
    }
    // Call Bictorys API
    const apiKey = bictorysApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'Service de paiement non configuré.');
    }
    const txnRef = admin.firestore().collection('transactions').doc();
    let bictorysResponse;
    try {
        bictorysResponse = await createBictorysHostedCharge({
            apiKey,
            amount,
            paymentReference: txnRef.id,
            customer: {
                name: (_a = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _a !== void 0 ? _a : request.auth.token.name,
                email: (_b = request.auth.token.email) !== null && _b !== void 0 ? _b : userData === null || userData === void 0 ? void 0 : userData.email,
                phone: userData === null || userData === void 0 ? void 0 : userData.phone,
            },
            logLabel: 'club',
        });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Bictorys club charge creation failed:', errMsg);
        throw new https_1.HttpsError('internal', 'Erreur lors de la création du paiement. Réessaie.');
    }
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    // Create club subscription with pending status
    await admin.firestore().doc(`club_subscriptions/${uid}`).set(Object.assign({ userId: uid, userEmail: (_d = (_c = request.auth.token.email) !== null && _c !== void 0 ? _c : userData === null || userData === void 0 ? void 0 : userData.email) !== null && _d !== void 0 ? _d : '', userName: (_f = (_e = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _e !== void 0 ? _e : request.auth.token.name) !== null && _f !== void 0 ? _f : '', startedAt: now.toISOString(), expiresAt: expiresAt.toISOString(), autoRenew: autoRenew !== null && autoRenew !== void 0 ? autoRenew : true, status: 'pending', amount, chargeId: bictorysResponse.chargeId }, (referredByCode ? { referredByCode } : {})));
    // Create transaction record
    await txnRef.set({
        id: txnRef.id,
        userId: uid,
        userEmail: (_h = (_g = request.auth.token.email) !== null && _g !== void 0 ? _g : userData === null || userData === void 0 ? void 0 : userData.email) !== null && _h !== void 0 ? _h : '',
        userName: (_k = (_j = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _j !== void 0 ? _j : request.auth.token.name) !== null && _k !== void 0 ? _k : '',
        formationId: 'club_digitos',
        formationSlug: 'club-des-digitos',
        formationTitle: 'Club des Digitos — Abonnement annuel',
        amount,
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
});
// ── Rysmo monetization (packs + subscriptions) ────────────────────────────
const RYSMO_PACKS = {
    discovery: { requests: 30, price: 500, label: 'Pack Découverte Rysmo — 30 requêtes' },
    regular: { requests: 100, price: 1500, label: 'Pack Régulier Rysmo — 100 requêtes' },
    intensive: { requests: 300, price: 3500, label: 'Pack Intensif Rysmo — 300 requêtes' },
};
const RYSMO_SUBSCRIPTIONS = {
    lite: { price: 3000, label: 'Rysmo+ Lite — 20 requêtes/jour' },
    pro: { price: 7500, label: 'Rysmo+ Pro — 100 requêtes/jour' },
};
exports.createRysmoPackCharge = (0, https_1.onCall)({ region: 'us-central1', secrets: [bictorysApiKey] }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const { pack } = request.data;
    const packDef = RYSMO_PACKS[pack];
    if (!packDef) {
        throw new https_1.HttpsError('invalid-argument', 'Pack Rysmo inconnu.');
    }
    const uid = request.auth.uid;
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userDoc.data();
    const apiKey = bictorysApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'Service de paiement non configuré.');
    }
    const txnRef = admin.firestore().collection('transactions').doc();
    let bictorysResponse;
    try {
        bictorysResponse = await createBictorysHostedCharge({
            apiKey,
            amount: packDef.price,
            paymentReference: txnRef.id,
            customer: {
                name: (_a = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _a !== void 0 ? _a : request.auth.token.name,
                email: (_b = request.auth.token.email) !== null && _b !== void 0 ? _b : userData === null || userData === void 0 ? void 0 : userData.email,
                phone: userData === null || userData === void 0 ? void 0 : userData.phone,
            },
            logLabel: 'rysmo pack',
        });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Rysmo pack charge creation failed:', errMsg);
        throw new https_1.HttpsError('internal', 'Erreur lors de la création du paiement. Réessaie.');
    }
    const now = new Date().toISOString();
    const purchaseRef = admin.firestore().collection('rysmoPackPurchases').doc();
    await purchaseRef.set({
        id: purchaseRef.id,
        userId: uid,
        userEmail: (_d = (_c = request.auth.token.email) !== null && _c !== void 0 ? _c : userData === null || userData === void 0 ? void 0 : userData.email) !== null && _d !== void 0 ? _d : '',
        userName: (_f = (_e = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _e !== void 0 ? _e : request.auth.token.name) !== null && _f !== void 0 ? _f : '',
        pack,
        requestsTotal: packDef.requests,
        purchasedAt: now,
        status: 'pending',
        amount: packDef.price,
        chargeId: bictorysResponse.chargeId,
    });
    await txnRef.set({
        id: txnRef.id,
        userId: uid,
        userEmail: (_h = (_g = request.auth.token.email) !== null && _g !== void 0 ? _g : userData === null || userData === void 0 ? void 0 : userData.email) !== null && _h !== void 0 ? _h : '',
        userName: (_k = (_j = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _j !== void 0 ? _j : request.auth.token.name) !== null && _k !== void 0 ? _k : '',
        formationId: `rysmo_pack_${pack}`,
        formationSlug: `rysmo-pack-${pack}`,
        formationTitle: packDef.label,
        amount: packDef.price,
        currency: 'XOF',
        status: 'pending',
        paymentMethod: 'bictorys',
        chargeId: bictorysResponse.chargeId,
        opToken: bictorysResponse.opToken,
        createdAt: now,
        rysmoPurchaseId: purchaseRef.id,
        rysmoKind: 'pack',
    });
    return {
        checkoutUrl: bictorysResponse.link,
        transactionId: txnRef.id,
    };
});
exports.createRysmoSubscriptionCharge = (0, https_1.onCall)({ region: 'us-central1', secrets: [bictorysApiKey] }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const { plan } = request.data;
    const subDef = RYSMO_SUBSCRIPTIONS[plan];
    if (!subDef) {
        throw new https_1.HttpsError('invalid-argument', 'Plan Rysmo+ inconnu.');
    }
    const uid = request.auth.uid;
    // Block if there's already an active subscription
    const activeQuery = await admin.firestore()
        .collection('rysmoSubscriptions')
        .where('userId', '==', uid)
        .where('status', '==', 'active')
        .limit(1)
        .get();
    if (!activeQuery.empty) {
        const data = activeQuery.docs[0].data();
        if (!data.expiresAt || new Date(data.expiresAt) > new Date()) {
            throw new https_1.HttpsError('already-exists', 'Tu as déjà un abonnement Rysmo+ actif.');
        }
    }
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userDoc.data();
    const apiKey = bictorysApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'Service de paiement non configuré.');
    }
    const txnRef = admin.firestore().collection('transactions').doc();
    let bictorysResponse;
    try {
        bictorysResponse = await createBictorysHostedCharge({
            apiKey,
            amount: subDef.price,
            paymentReference: txnRef.id,
            customer: {
                name: (_a = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _a !== void 0 ? _a : request.auth.token.name,
                email: (_b = request.auth.token.email) !== null && _b !== void 0 ? _b : userData === null || userData === void 0 ? void 0 : userData.email,
                phone: userData === null || userData === void 0 ? void 0 : userData.phone,
            },
            logLabel: 'rysmo sub',
        });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Rysmo subscription charge creation failed:', errMsg);
        throw new https_1.HttpsError('internal', 'Erreur lors de la création du paiement. Réessaie.');
    }
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    const subRef = admin.firestore().collection('rysmoSubscriptions').doc();
    await subRef.set({
        id: subRef.id,
        userId: uid,
        userEmail: (_d = (_c = request.auth.token.email) !== null && _c !== void 0 ? _c : userData === null || userData === void 0 ? void 0 : userData.email) !== null && _d !== void 0 ? _d : '',
        userName: (_f = (_e = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _e !== void 0 ? _e : request.auth.token.name) !== null && _f !== void 0 ? _f : '',
        plan,
        status: 'pending',
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        amount: subDef.price,
        chargeId: bictorysResponse.chargeId,
    });
    await txnRef.set({
        id: txnRef.id,
        userId: uid,
        userEmail: (_h = (_g = request.auth.token.email) !== null && _g !== void 0 ? _g : userData === null || userData === void 0 ? void 0 : userData.email) !== null && _h !== void 0 ? _h : '',
        userName: (_k = (_j = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _j !== void 0 ? _j : request.auth.token.name) !== null && _k !== void 0 ? _k : '',
        formationId: `rysmo_sub_${plan}`,
        formationSlug: `rysmo-sub-${plan}`,
        formationTitle: subDef.label,
        amount: subDef.price,
        currency: 'XOF',
        status: 'pending',
        paymentMethod: 'bictorys',
        chargeId: bictorysResponse.chargeId,
        opToken: bictorysResponse.opToken,
        createdAt: now.toISOString(),
        rysmoSubscriptionId: subRef.id,
        rysmoKind: 'subscription',
    });
    return {
        checkoutUrl: bictorysResponse.link,
        transactionId: txnRef.id,
    };
});
/**
 * Verify Bictorys webhook signature (HMAC-SHA256).
 * Bictorys sends the signature in the `X-Bictorys-Signature` header.
 * Fail-closed: returns false if the signature or secret is missing.
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
    var _a, _b, _c, _d, _e;
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
    const signature = req.headers['x-bictorys-signature'];
    // HMAC must be computed over the exact bytes Bictorys signed. firebase-functions
    // onRequest exposes the unparsed payload as req.rawBody; re-serializing req.body
    // would not reproduce those bytes (key order, spacing, escaping).
    const rawBody = req.rawBody
        ? req.rawBody.toString('utf8')
        : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.warn('Bictorys webhook: invalid or missing signature');
        res.status(403).send('Forbidden');
        return;
    }
    const body = req.body;
    const chargeId = (_a = body === null || body === void 0 ? void 0 : body.chargeId) !== null && _a !== void 0 ? _a : body === null || body === void 0 ? void 0 : body.charge_id;
    const status = body === null || body === void 0 ? void 0 : body.status;
    if (!chargeId) {
        console.warn('Bictorys webhook: missing chargeId', body);
        res.status(200).send('OK');
        return;
    }
    // ── Idempotency: track processed chargeIds ──────────────────────────
    // The event record is written AFTER processing (see end of handler) so a
    // crash mid-processing leaves the txn 'pending' and a retry can recover.
    const eventRef = admin.firestore().doc(`webhook_events/${chargeId}`);
    const eventSnap = await eventRef.get();
    if (eventSnap.exists && ((_b = eventSnap.data()) === null || _b === void 0 ? void 0 : _b.status) === status) {
        console.log('Bictorys webhook: duplicate event ignored', chargeId, status);
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
    // Defense-in-depth: the HMAC signature is the authoritative integrity check,
    // but if the webhook carries a numeric amount we also verify it matches the
    // server-computed transaction amount. The `typeof === 'number'` guard means a
    // renamed/absent amount field is simply skipped (no false rejection), so we
    // can safely reject a genuine mismatch and keep the txn 'pending' for review.
    const webhookAmount = (_c = body === null || body === void 0 ? void 0 : body.amount) !== null && _c !== void 0 ? _c : body === null || body === void 0 ? void 0 : body.value;
    if (typeof webhookAmount === 'number' && webhookAmount !== txnData.amount) {
        console.error('Bictorys webhook: amount mismatch — rejecting', { chargeId, webhookAmount, expected: txnData.amount });
        res.status(400).send('Amount verification failed');
        return;
    }
    if (isSuccess) {
        const isClubPayment = txnData.formationId === 'club_digitos';
        const isRysmoPack = txnData.rysmoKind === 'pack' && txnData.rysmoPurchaseId;
        const isRysmoSub = txnData.rysmoKind === 'subscription' && txnData.rysmoSubscriptionId;
        // Apply the side effect BEFORE marking the transaction completed, so a
        // crash mid-processing leaves the txn 'pending' and a retry can recover.
        // Each side effect below is idempotent.
        if (isClubPayment) {
            // Activate club subscription
            const subRef = admin.firestore().doc(`club_subscriptions/${txnData.userId}`);
            await subRef.update({ status: 'active' });
            console.log('Bictorys webhook: club subscription activated for user', txnData.userId);
        }
        else if (isRysmoPack) {
            // Mark pack as completed AND credit packBalance on rate-limit doc atomically
            const purchaseRef = admin.firestore().doc(`rysmoPackPurchases/${txnData.rysmoPurchaseId}`);
            const rateLimitRef = admin.firestore().doc(`_ratelimits/rysmo_${txnData.userId}`);
            await admin.firestore().runTransaction(async (t) => {
                var _a, _b, _c;
                const pSnap = await t.get(purchaseRef);
                if (!pSnap.exists)
                    return;
                const p = pSnap.data();
                if (p.status === 'completed')
                    return; // idempotent
                const rlSnap = await t.get(rateLimitRef);
                const rl = (_a = rlSnap.data()) !== null && _a !== void 0 ? _a : {};
                const newBalance = ((_b = rl.packBalance) !== null && _b !== void 0 ? _b : 0) + ((_c = p.requestsTotal) !== null && _c !== void 0 ? _c : 0);
                t.update(purchaseRef, { status: 'completed', completedAt: new Date().toISOString() });
                t.set(rateLimitRef, { packBalance: newBalance, lastReset: Date.now() }, { merge: true });
            });
            console.log('Bictorys webhook: Rysmo pack credited for user', txnData.userId);
        }
        else if (isRysmoSub) {
            const subRef = admin.firestore().doc(`rysmoSubscriptions/${txnData.rysmoSubscriptionId}`);
            await subRef.update({ status: 'active' });
            console.log('Bictorys webhook: Rysmo subscription activated for user', txnData.userId);
        }
        else {
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
        // Increment coupon usage now that the payment succeeded (not at checkout
        // creation) so abandoned/failed checkouts don't consume a coupon use.
        if (txnData.couponId) {
            await admin.firestore().doc(`coupons/${txnData.couponId}`).update({
                usedCount: admin.firestore.FieldValue.increment(1),
            });
        }
        // Mark the transaction completed LAST (after the side effect succeeded).
        await txnDoc.ref.update({
            status: 'completed',
            completedAt: new Date().toISOString(),
        });
        // Meta CAPI is non-critical: never let it fail the webhook (which would
        // trigger Bictorys retries after the payment is already processed).
        try {
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
        catch (err) {
            console.error('Bictorys webhook: Meta CAPI Purchase event failed', err);
        }
    }
    else if (isFailed) {
        await txnDoc.ref.update({
            status: 'failed',
        });
        if (txnData.formationId === 'club_digitos') {
            // Clear the pending club subscription so the user isn't locked out of
            // retrying (createClubCharge blocks while status === 'pending').
            const subRef = admin.firestore().doc(`club_subscriptions/${txnData.userId}`);
            const subSnap = await subRef.get();
            if (subSnap.exists && ((_d = subSnap.data()) === null || _d === void 0 ? void 0 : _d.status) === 'pending' && ((_e = subSnap.data()) === null || _e === void 0 ? void 0 : _e.chargeId) === chargeId) {
                await subRef.delete();
            }
        }
        else if (txnData.rysmoKind === 'pack' && txnData.rysmoPurchaseId) {
            await admin.firestore().doc(`rysmoPackPurchases/${txnData.rysmoPurchaseId}`).update({ status: 'failed' });
        }
        else if (txnData.rysmoKind === 'subscription' && txnData.rysmoSubscriptionId) {
            await admin.firestore().doc(`rysmoSubscriptions/${txnData.rysmoSubscriptionId}`).update({ status: 'cancelled' });
        }
        console.log('Bictorys webhook: payment failed for chargeId', chargeId);
    }
    else {
        console.log('Bictorys webhook: unhandled status', status, 'for chargeId', chargeId);
    }
    // Record the processed event (idempotency guard for duplicate deliveries).
    await eventRef.set({ chargeId, status, receivedAt: new Date().toISOString() }, { merge: true });
    res.status(200).send('OK');
});
//# sourceMappingURL=payment.js.map