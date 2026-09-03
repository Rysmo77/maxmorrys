/**
 * Réécrit les URLs de médias Firebase Storage → Cloudflare R2 (media.maxmorrys.me)
 * dans les documents Firestore, APRÈS avoir copié les fichiers vers R2.
 *
 * Sécurité : DRY-RUN par défaut (n'écrit rien). Ajouter `--apply` pour écrire.
 *
 * Prérequis :
 *   - firebase-admin résolvable DEPUIS CE FICHIER.
 *     ⚠️ « Lancer depuis le dossier `functions/` » NE MARCHE PAS : la résolution ESM part
 *     du dossier du MODULE, jamais du répertoire courant. Un script de `scripts/` cherche
 *     dans `scripts/node_modules` puis à la racine, et ne verra jamais
 *     `functions/node_modules`. Faire `npm i --no-save firebase-admin` À LA RACINE, ou
 *     exécuter une copie du script placée dans `functions/`.
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
/**
 * Vérifie que chaque URL cible existe réellement sur R2 avant d'écrire.
 *
 * C'est le garde-fou qui manquait : réécrire une URL vers un objet non copié
 * transforme un média fonctionnel en 404, sans erreur au moment de l'écriture.
 * Implicite avec `--apply`, sauf `--skip-verify`.
 */
const VERIFY = (process.argv.includes('--verify') || APPLY) && !process.argv.includes('--skip-verify');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'max-morrys';
const MEDIA_BASE = (process.env.MEDIA_BASE || 'https://media.maxmorrys.me').replace(/\/$/, '');

/** Cache des vérifications : le même média est souvent référencé par plusieurs documents. */
const reachable = new Map();

async function isReachable(url) {
  if (reachable.has(url)) return reachable.get(url);
  let ok = false;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    ok = response.ok;
  } catch {
    ok = false;
  }
  reachable.set(url, ok);
  return ok;
}

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
  let missing = 0;

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
        if (!next || next === data[field]) continue;

        if (VERIFY && !(await isReachable(next))) {
          missing++;
          console.log(`  ⚠ ${collection}/${doc.id}.${field} — cible absente de R2, non réécrit`);
          console.log(`    ${next}`);
          continue;
        }

        update[field] = next;
        changedFields++;
        console.log(`  ${collection}/${doc.id}.${field}`);
        console.log(`    - ${data[field]}`);
        console.log(`    + ${next}`);
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
  if (missing > 0) {
    console.log(`⚠ ${missing} champ(s) laissés intacts : l'objet correspondant est absent de R2.`);
    console.log('  Relancer scripts/migrate-gcs-to-r2.mjs --apply avant de réessayer.');
  }
  console.log('\nNon traité ici, à dessein : les vidéos de cours et ressources PDF');
  console.log('(formations.modules[].lessons[]). Les réécrire vers media.maxmorrys.me');
  console.log('les rendrait publiques — elles attendent le Worker d\'URLs signées.');
  console.log(APPLY ? '✅ Changements APPLIQUÉS.' : '🔎 DRY-RUN — relancer avec --apply pour écrire.');
}

run().catch((e) => { console.error(e); process.exit(1); });
