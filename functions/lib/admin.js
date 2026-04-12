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
exports.adminManageEnrollment = exports.adminCreateUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.adminCreateUser = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    // Verify caller is admin
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    const { email, password, displayName, firstName, lastName, phone, role } = request.data;
    if (!email || !password || !displayName) {
        throw new https_1.HttpsError('invalid-argument', 'Email, mot de passe et nom sont obligatoires.');
    }
    const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_RE.test(email.trim())) {
        throw new https_1.HttpsError('invalid-argument', 'Format d\'email invalide.');
    }
    if (password.length < 8) {
        throw new https_1.HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 8 caractères.');
    }
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({ email, password, displayName });
    // Create Firestore document
    const newUser = {
        uid: userRecord.uid,
        email,
        displayName,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        role: (role === 'admin' ? 'student' : role) || 'student',
        createdAt: new Date().toISOString(),
        preferences: { theme: 'system', language: 'fr', newsletter: false },
    };
    await admin.firestore().doc(`users/${userRecord.uid}`).set(newUser);
    return { uid: userRecord.uid, success: true };
});
exports.adminManageEnrollment = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    const { action, userId, formationId } = request.data;
    if (!userId || !formationId) {
        throw new https_1.HttpsError('invalid-argument', 'userId et formationId sont obligatoires.');
    }
    const enrollmentId = `${userId}_${formationId}`;
    const enrollmentRef = admin.firestore().doc(`enrollments/${enrollmentId}`);
    if (action === 'create') {
        const existing = await enrollmentRef.get();
        if (existing.exists) {
            throw new https_1.HttpsError('already-exists', 'Cet utilisateur est déjà inscrit à cette formation.');
        }
        await enrollmentRef.set({
            id: enrollmentId,
            userId,
            formationId,
            enrolledAt: new Date().toISOString(),
            progress: 0,
            completedLessons: [],
            certificateIssued: false,
        });
        return { success: true, enrollmentId };
    }
    else if (action === 'delete') {
        await enrollmentRef.delete();
        return { success: true };
    }
    else {
        throw new https_1.HttpsError('invalid-argument', 'Action invalide. Utilisez "create" ou "delete".');
    }
});
//# sourceMappingURL=admin.js.map