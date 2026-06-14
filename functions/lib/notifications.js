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
exports.courseReminder = exports.streakReminder = exports.rysmoCoachNudge = exports.onCertificateCreated = exports.onEnrollmentCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// ── Auto-create notification on enrollment ──────────────────────────────────
exports.onEnrollmentCreated = (0, firestore_1.onDocumentCreated)('enrollments/{enrollmentId}', async (event) => {
    var _a, _b, _c;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const userId = data.userId;
    const formationId = data.formationId;
    // Get formation title
    const formationSnap = await db.collection('formations').doc(formationId).get();
    const formationTitle = ((_b = formationSnap.data()) === null || _b === void 0 ? void 0 : _b.title) || 'Formation';
    await db.collection(`notifications/${userId}/items`).add({
        userId,
        type: 'enrollment',
        title: 'Inscription confirmée',
        message: `Tu es inscrit à "${formationTitle}". Commence dès maintenant !`,
        read: false,
        createdAt: new Date().toISOString(),
        link: `/cours/${((_c = formationSnap.data()) === null || _c === void 0 ? void 0 : _c.slug) || ''}`,
    });
});
// ── Auto-create notification on certificate ──────────────────────────────────
exports.onCertificateCreated = (0, firestore_1.onDocumentCreated)('certificates/{certId}', async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    await db.collection(`notifications/${data.userId}/items`).add({
        userId: data.userId,
        type: 'certificate',
        title: 'Certificat disponible !',
        message: `Ton certificat pour "${data.formationTitle}" est prêt. Partage-le sur LinkedIn !`,
        read: false,
        createdAt: new Date().toISOString(),
        link: `/certificat/${data.certificateCode}`,
    });
});
// ── Coach proactif Rysmo : félicitations à la complétion + cours suivant ─────
exports.rysmoCoachNudge = (0, firestore_1.onDocumentUpdated)('enrollments/{enrollmentId}', async (event) => {
    var _a, _b, _c, _d;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    // Ne se déclenche qu'au franchissement de 100% (transition unique → pas de doublon)
    if (before.progress >= 100 || after.progress < 100)
        return;
    const userId = after.userId;
    const formationSnap = await db.collection('formations').doc(after.formationId).get();
    const justFinished = ((_c = formationSnap.data()) === null || _c === void 0 ? void 0 : _c.title) || 'ta formation';
    // Suggérer un cours suivant : une formation publiée pas encore suivie (même catégorie en priorité)
    let suggestion = null;
    try {
        const category = (_d = formationSnap.data()) === null || _d === void 0 ? void 0 : _d.category;
        const enrolledSnap = await db.collection('enrollments').where('userId', '==', userId).get();
        const enrolledIds = new Set(enrolledSnap.docs.map((d) => d.data().formationId));
        const publishedSnap = await db.collection('formations').where('status', '==', 'published').limit(50).get();
        const candidates = publishedSnap.docs.filter((d) => !enrolledIds.has(d.id));
        const sameCat = candidates.find((d) => d.data().category === category);
        const pick = sameCat || candidates[0];
        if (pick)
            suggestion = { title: pick.data().title, slug: pick.data().slug };
    }
    catch (_e) {
        // suggestion optionnelle
    }
    const message = suggestion
        ? `Bravo, tu as terminé "${justFinished}" ! Prêt pour la suite ? "${suggestion.title}" est un bon prochain pas. Demande à Rysmo un plan pour t'y mettre.`
        : `Bravo, tu as terminé "${justFinished}" ! Demande à Rysmo comment mettre en pratique ce que tu viens d'apprendre.`;
    await db.collection(`notifications/${userId}/items`).add({
        userId,
        type: 'system',
        title: 'Félicitations !',
        message,
        read: false,
        createdAt: new Date().toISOString(),
        link: suggestion ? `/formations/${suggestion.slug}` : '/mon-espace/tableau-de-bord',
    });
});
// ── Streak reminder — runs daily at 8pm UTC ──────────────────────────────────
exports.streakReminder = (0, scheduler_1.onSchedule)('0 20 * * *', async () => {
    const today = new Date().toISOString().slice(0, 10);
    // Only scan users who actually have an active streak (server-side filter)
    // and page through results to avoid loading the whole collection at scale.
    const PAGE = 500;
    let last = null;
    while (true) {
        let q = db
            .collection('gamification')
            .where('currentStreak', '>', 0)
            .orderBy('currentStreak')
            .limit(PAGE);
        if (last)
            q = q.startAfter(last);
        const snap = await q.get();
        if (snap.empty)
            break;
        for (const doc of snap.docs) {
            const data = doc.data();
            if (data.lastActiveDate !== today) {
                // User has a streak but hasn't been active today
                await db.collection(`notifications/${doc.id}/items`).add({
                    userId: doc.id,
                    type: 'system',
                    title: `Ta série de ${data.currentStreak} jours est en danger !`,
                    message: 'Complète une leçon avant minuit pour maintenir ta série.',
                    read: false,
                    createdAt: new Date().toISOString(),
                });
            }
        }
        if (snap.size < PAGE)
            break;
        last = snap.docs[snap.docs.length - 1];
    }
});
// ── Course inactivity reminder — runs daily at 10am UTC ──────────────────────
exports.courseReminder = (0, scheduler_1.onSchedule)('0 10 * * *', async () => {
    var _a, _b;
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const cutoff = threeDaysAgo.toISOString();
    // Find users with enrollments that haven't been updated in 3+ days
    // Bound reads with limit(500) and orderBy lastActivityAt asc to process most inactive first
    const enrollmentsSnap = await db.collection('enrollments')
        .where('progress', '<', 100)
        .orderBy('lastActivityAt', 'asc')
        .limit(500)
        .get();
    for (const enrollDoc of enrollmentsSnap.docs) {
        const data = enrollDoc.data();
        // Only notify if last activity was 3+ days ago
        const lastActivity = data.lastActivityAt || data.enrolledAt;
        if (lastActivity > cutoff)
            continue;
        // Check if we already sent a reminder recently
        const recentNotif = await db.collection(`notifications/${data.userId}/items`)
            .where('type', '==', 'system')
            .where('createdAt', '>', cutoff)
            .limit(1)
            .get();
        if (!recentNotif.empty)
            continue;
        const formationSnap = await db.collection('formations').doc(data.formationId).get();
        const title = ((_a = formationSnap.data()) === null || _a === void 0 ? void 0 : _a.title) || 'ta formation';
        await db.collection(`notifications/${data.userId}/items`).add({
            userId: data.userId,
            type: 'system',
            title: `Continue ${title}`,
            message: `Tu n'as pas ouvert "${title}" depuis 3 jours. Reprends là où tu t'es arrêté !`,
            read: false,
            createdAt: new Date().toISOString(),
            link: `/cours/${((_b = formationSnap.data()) === null || _b === void 0 ? void 0 : _b.slug) || ''}`,
        });
    }
});
//# sourceMappingURL=notifications.js.map