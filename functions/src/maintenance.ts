import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

/**
 * Clean up temp files older than 24 hours from Firebase Storage.
 * Runs daily at 3am UTC.
 */
export const cleanupTempStorage = onSchedule('0 3 * * *', async () => {
  const bucket = admin.storage().bucket();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  const [files] = await bucket.getFiles({ prefix: 'temp/' });

  let deleted = 0;
  for (const file of files) {
    const [metadata] = await file.getMetadata();
    const created = new Date(metadata.timeCreated as string).getTime();
    if (created < cutoff) {
      await file.delete();
      deleted++;
    }
  }

  console.log(`cleanupTempStorage: deleted ${deleted}/${files.length} temp files`);
});

/**
 * Export Firestore data to Cloud Storage for backup.
 * Runs daily at 2am UTC.
 * Requires: Cloud Firestore Admin API enabled + Storage bucket.
 */
export const backupFirestore = onSchedule('0 2 * * *', async () => {
  const projectId = admin.instanceId().app.options.projectId ?? process.env.GCLOUD_PROJECT;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const bucket = `gs://${admin.storage().bucket().name}/backups/firestore/${timestamp}`;

  const client = new admin.firestore.v1.FirestoreAdminClient();
  const databaseName = client.databasePath(projectId!, '(default)');

  try {
    const [response] = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix: bucket,
      collectionIds: [], // all collections
    });
    console.log(`backupFirestore: export started — ${response.name}`);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('backupFirestore: export failed —', msg);
  }
});
