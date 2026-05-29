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
exports.issueCertificate = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const crypto_1 = require("crypto");
/**
 * Issue a course completion certificate. Server-side authority: completion is
 * re-derived from the formation's actual lesson set (every lesson id must be in
 * the enrollment's completedLessons), NOT the client-writable scalar `progress`.
 * Idempotent: returns the existing certificate if already issued.
 */
exports.issueCertificate = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    var _a, _b, _c, _d, _e;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const uid = request.auth.uid;
    const { formationId } = request.data;
    if (!formationId) {
        throw new https_1.HttpsError('invalid-argument', 'formationId est obligatoire.');
    }
    const db = admin.firestore();
    const certId = `${uid}_${formationId}`;
    const certRef = db.doc(`certificates/${certId}`);
    // Idempotent: return the existing certificate if already issued.
    const certSnap = await certRef.get();
    if (certSnap.exists) {
        return { certificateId: certId, certificateCode: (_a = certSnap.data()) === null || _a === void 0 ? void 0 : _a.certificateCode };
    }
    // The caller must be enrolled.
    const enrollmentRef = db.doc(`enrollments/${certId}`);
    const enrollmentSnap = await enrollmentRef.get();
    if (!enrollmentSnap.exists) {
        throw new https_1.HttpsError('permission-denied', "Tu n'es pas inscrit à cette formation.");
    }
    const formationSnap = await db.doc(`formations/${formationId}`).get();
    if (!formationSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Formation introuvable.');
    }
    const formation = formationSnap.data();
    if (formation.certificateEnabled === false) {
        throw new https_1.HttpsError('failed-precondition', 'Cette formation ne délivre pas de certificat.');
    }
    // Re-derive completion: every lesson id of the formation must appear in the
    // enrollment's completedLessons. This is stricter than progress == 100.
    const allLessonIds = ((_b = formation.modules) !== null && _b !== void 0 ? _b : []).flatMap((m) => { var _a; return ((_a = m.lessons) !== null && _a !== void 0 ? _a : []).map((l) => l.id); });
    if (allLessonIds.length === 0) {
        throw new https_1.HttpsError('failed-precondition', "Cette formation n'a pas de leçons.");
    }
    const completed = (_d = (_c = enrollmentSnap.data()) === null || _c === void 0 ? void 0 : _c.completedLessons) !== null && _d !== void 0 ? _d : [];
    const completedSet = new Set(completed);
    const allDone = allLessonIds.every((id) => completedSet.has(id));
    if (!allDone) {
        throw new https_1.HttpsError('failed-precondition', 'Tu dois terminer toutes les leçons pour obtenir le certificat.');
    }
    const certificateCode = `MM-${(0, crypto_1.randomUUID)().replace(/-/g, '').substring(0, 10).toUpperCase()}`;
    await certRef.set({
        userId: uid,
        formationId,
        formationTitle: (_e = formation.title) !== null && _e !== void 0 ? _e : '',
        issuedAt: new Date().toISOString(),
        certificateCode,
    });
    await enrollmentRef.update({ certificateIssued: true });
    return { certificateId: certId, certificateCode };
});
//# sourceMappingURL=certificates.js.map