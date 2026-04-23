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
exports.deleteUserAccount = exports.exportUserData = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = () => admin.firestore();
const bucket = () => admin.storage().bucket();
async function deleteCollectionByQuery(query, batchSize = 200) {
    let total = 0;
    while (true) {
        const snap = await query.limit(batchSize).get();
        if (snap.empty)
            break;
        const batch = db().batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        total += snap.size;
        if (snap.size < batchSize)
            break;
    }
    return total;
}
async function deleteSubcollection(docPath, subcollection) {
    const ref = db().collection(`${docPath}/${subcollection}`);
    return deleteCollectionByQuery(ref);
}
async function deleteStorageFolder(prefix) {
    try {
        await bucket().deleteFiles({ prefix });
    }
    catch (error) {
        console.warn('deleteStorageFolder failed for', prefix, error);
    }
}
/**
 * Collect all user data into a single JSON object (for GDPR export).
 */
async function collectUserData(uid) {
    const userSnap = await db().doc(`users/${uid}`).get();
    const [enrollments, certificates, transactions, notes, notifications, gamification, clubSub, testimonials, messages,] = await Promise.all([
        db().collection('enrollments').where('userId', '==', uid).get(),
        db().collection('certificates').where('userId', '==', uid).get(),
        db().collection('transactions').where('userId', '==', uid).get(),
        db().collection(`users/${uid}/notes`).get(),
        db().collection(`notifications/${uid}/items`).get(),
        db().doc(`gamification/${uid}`).get(),
        db().doc(`club_subscriptions/${uid}`).get(),
        db().collection('testimonials').where('userId', '==', uid).get(),
        db().collection('messages').where('userId', '==', uid).get(),
    ]);
    return {
        exportedAt: new Date().toISOString(),
        user: userSnap.exists ? userSnap.data() : null,
        enrollments: enrollments.docs.map((d) => (Object.assign({ id: d.id }, d.data()))),
        certificates: certificates.docs.map((d) => (Object.assign({ id: d.id }, d.data()))),
        transactions: transactions.docs.map((d) => (Object.assign({ id: d.id }, d.data()))),
        notes: notes.docs.map((d) => (Object.assign({ id: d.id }, d.data()))),
        notifications: notifications.docs.map((d) => (Object.assign({ id: d.id }, d.data()))),
        gamification: gamification.exists ? gamification.data() : null,
        clubSubscription: clubSub.exists ? clubSub.data() : null,
        testimonials: testimonials.docs.map((d) => (Object.assign({ id: d.id }, d.data()))),
        messages: messages.docs.map((d) => (Object.assign({ id: d.id }, d.data()))),
    };
}
/**
 * GDPR — Export all user data.
 * Called by the authenticated user; returns a signed URL valid 24h.
 */
exports.exportUserData = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Tu dois etre connecte.');
    const data = await collectUserData(uid);
    const json = JSON.stringify(data, null, 2);
    const filename = `exports/${uid}/data-${Date.now()}.json`;
    const file = bucket().file(filename);
    await file.save(json, {
        contentType: 'application/json',
        metadata: { metadata: { userId: uid } },
    });
    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000,
    });
    await db().collection('data_exports').add({
        userId: uid,
        filename,
        createdAt: new Date().toISOString(),
    });
    return { downloadUrl: signedUrl, expiresInHours: 24 };
});
/**
 * GDPR — Delete user account and cascade-delete all associated data.
 * Called by the authenticated user himself.
 */
exports.deleteUserAccount = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    var _a, _b, _c;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Tu dois etre connecte.');
    const confirmation = (_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.confirmation) === null || _c === void 0 ? void 0 : _c.toUpperCase();
    if (confirmation !== 'SUPPRIMER') {
        throw new https_1.HttpsError('failed-precondition', 'Confirmation incorrecte.');
    }
    // Collection-level deletes (filtered by userId)
    await Promise.all([
        deleteCollectionByQuery(db().collection('enrollments').where('userId', '==', uid)),
        deleteCollectionByQuery(db().collection('certificates').where('userId', '==', uid)),
        deleteCollectionByQuery(db().collection('transactions').where('userId', '==', uid)),
        deleteCollectionByQuery(db().collection('testimonials').where('userId', '==', uid)),
        deleteCollectionByQuery(db().collection('messages').where('userId', '==', uid)),
    ]);
    // Subcollections under user doc
    await deleteSubcollection(`users/${uid}`, 'notes');
    await deleteSubcollection(`notifications/${uid}`, 'items');
    // Single-doc deletes
    await Promise.all([
        db().doc(`gamification/${uid}`).delete().catch(() => null),
        db().doc(`club_subscriptions/${uid}`).delete().catch(() => null),
        db().doc(`notifications/${uid}`).delete().catch(() => null),
    ]);
    // Finally delete the user doc
    await db().doc(`users/${uid}`).delete().catch(() => null);
    // Storage cleanup (avatars + exports)
    await Promise.all([
        deleteStorageFolder(`avatars/${uid}/`),
        deleteStorageFolder(`exports/${uid}/`),
        deleteStorageFolder(`club_media/${uid}/`),
    ]);
    // Delete Auth account last
    await admin.auth().deleteUser(uid);
    return { success: true };
});
//# sourceMappingURL=gdpr.js.map