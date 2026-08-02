/**
 * Réécrit les URLs de médias Firebase Storage → Cloudflare R2 (media.maxmorrys.me)
 * dans les documents Firestore, APRÈS avoir copié les fichiers vers R2.
 *
 * Sécurité : DRY-RUN par défaut (n'écrit rien). Ajouter `--apply` pour écrire.
 *
 * Prérequis :
 *   - firebase-admin disponible (lancer depuis le dossier `functions/` qui l'a déjà,
 *     ou `npm i firebase-admin` à la racine).
 *   - Credentials : variable GOOGLE_APPLICATION_CREDENTIALS pointant vers une clé de
 *     compte de service, OU `gcloud auth application-default login`.
 *
 * Exemples :
 *   node scripts/rewrite-firestore-urls.mjs            # aperçu (dry-run)
 *   node scripts/rewrite-firestore-urls.mjs --apply    # applique les changements
 *
 * Variables d'env optionnelles :
 *   FIREBASE_PROJECT_ID  (défaut: max-morrys)
 *   MEDIA_BASE           (défaut: https://media.maxmorrys.me)
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'max-morrys';
const MEDIA_BASE = (process.env.MEDIA_BASE || 'https://media.maxmorrys.me').replace(/\/$/, '');

// Champs (de premier niveau) contenant des URLs de médias, par collection.
// NB : les vidéos de cours (formations.modules[].lessons[].videoUrl) et les
// ressources sont du contenu PROTÉGÉ → traités en phase 2, pas ici.
const COLLECTIONS = {
  users: ['photoURL'],
  blog: ['coverImage', 'ogImage', 'twitterImage'],
  formations: ['coverImage', 'ogImage'],
  podcasts: ['coverImage', 'ogImage'],
  videos: ['thumbnailUrl', 'ogImage'],
  testimonials: ['avatar', 'mediaUrl'],
  club_posts: ['mediaUrl', 'userPhoto'],
  club_events: ['imageUrl'],
  club_sessions: ['imageUrl'],
  club_subscriptions: ['userPhoto'],
  club_comments: ['userPhoto'],
};

/** Convertit une URL Firebase Storage de notre bucket en URL R2, sinon renvoie null. */
function toR2Url(url) {
  if (typeof url !== 'string' || !url) return null;

  // Forme « download URL » : https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encoded>?...
  let m = url.match(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^?]+)/);
  if (m) {
    const [, bucket, encoded] = m;
    if (!bucket.includes('max-morrys')) return null; // ne touche pas aux URLs externes
    const key = encoded.replace(/%2F/gi, '/'); // décode uniquement les séparateurs
    return `${MEDIA_BASE}/${key}`;
  }

  // Forme « GCS publique » : https://storage.googleapis.com/<bucket>/<path>
  m = url.match(/^https:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/);
  if (m) {
    const [, bucket, rest] = m;
    if (!bucket.includes('max-morrys')) return null;
    return `${MEDIA_BASE}/${rest.split('?')[0]}`;
  }

  return null;
}

async function run() {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  let totalDocs = 0;
  let changedDocs = 0;
  let changedFields = 0;

  for (const [collection, fields] of Object.entries(COLLECTIONS)) {
    const snap = await db.collection(collection).get();
    let colChanged = 0;
    let batch = db.batch();
    let pending = 0;

    for (const doc of snap.docs) {
      totalDocs++;
      const data = doc.data();
      const update = {};
      for (const field of fields) {
        const next = toR2Url(data[field]);
        if (next && next !== data[field]) {
          update[field] = next;
          changedFields++;
          console.log(`  ${collection}/${doc.id}.${field}`);
          console.log(`    - ${data[field]}`);
          console.log(`    + ${next}`);
        }
      }
      if (Object.keys(update).length) {
        changedDocs++;
        colChanged++;
        if (APPLY) {
          batch.update(doc.ref, update);
          if (++pending >= 400) { await batch.commit(); batch = db.batch(); pending = 0; }
        }
      }
    }
    if (APPLY && pending) await batch.commit();
    console.log(`[${collection}] ${snap.size} docs, ${colChanged} à mettre à jour`);
  }

  console.log('\n──────────────────────────────────────────');
  console.log(`Total : ${totalDocs} docs parcourus, ${changedDocs} docs / ${changedFields} champs à réécrire`);
  console.log(APPLY ? '✅ Changements APPLIQUÉS.' : '🔎 DRY-RUN — relancer avec --apply pour écrire.');
}

run().catch((e) => { console.error(e); process.exit(1); });
