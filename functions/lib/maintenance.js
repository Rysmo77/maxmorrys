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
exports.backupFirestore = exports.cleanupAgencyQuotes = exports.cleanupTempStorage = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
/**
 * Clean up temp files older than 24 hours from Firebase Storage.
 * Runs daily at 3am UTC.
 */
exports.cleanupTempStorage = (0, scheduler_1.onSchedule)('0 3 * * *', async () => {
    const bucket = admin.storage().bucket();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const [files] = await bucket.getFiles({ prefix: 'temp/' });
    let deleted = 0;
    for (const file of files) {
        const [metadata] = await file.getMetadata();
        const created = new Date(metadata.timeCreated).getTime();
        if (created < cutoff) {
            await file.delete();
            deleted++;
        }
    }
    console.log(`cleanupTempStorage: deleted ${deleted}/${files.length} temp files`);
});
/**
 * Purge les récapitulatifs de devis agence de plus de 90 jours.
 * Tourne chaque jour à 4h UTC.
 *
 * Ces documents sont lisibles publiquement par leur référence (cf. `agency_quotes` dans
 * firestore.rules) : les laisser s'accumuler indéfiniment agrandit inutilement la surface
 * atteignable. Leur validité commerciale est de 30 jours ; 90 laisse une marge confortable
 * pour un client qui rouvre son lien tardivement. Le lead correspondant, lui, est conservé.
 */
exports.cleanupAgencyQuotes = (0, scheduler_1.onSchedule)('0 4 * * *', async () => {
    const db = admin.firestore();
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const snap = await db
        .collection('agency_quotes')
        .where('createdAt', '<', cutoff)
        .limit(500)
        .get();
    if (snap.empty) {
        console.log('cleanupAgencyQuotes: nothing to purge');
        return;
    }
    // Lot unique borné à 500 : c'est la limite d'un WriteBatch Firestore, et le volume
    // quotidien attendu est très inférieur. Le reliquat éventuel part le lendemain.
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`cleanupAgencyQuotes: purged ${snap.size} quote(s) older than 90 days`);
});
/**
 * Export Firestore data to Cloud Storage for backup.
 * Runs daily at 2am UTC.
 * Requires: Cloud Firestore Admin API enabled + Storage bucket.
 */
exports.backupFirestore = (0, scheduler_1.onSchedule)('0 2 * * *', async () => {
    var _a;
    const projectId = (_a = admin.instanceId().app.options.projectId) !== null && _a !== void 0 ? _a : process.env.GCLOUD_PROJECT;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const bucket = `gs://${admin.storage().bucket().name}/backups/firestore/${timestamp}`;
    const client = new admin.firestore.v1.FirestoreAdminClient();
    const databaseName = client.databasePath(projectId, '(default)');
    try {
        const [response] = await client.exportDocuments({
            name: databaseName,
            outputUriPrefix: bucket,
            collectionIds: [], // all collections
        });
        console.log(`backupFirestore: export started — ${response.name}`);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('backupFirestore: export failed —', msg);
    }
});
//# sourceMappingURL=maintenance.js.map