# Migration des médias Firebase Storage → Cloudflare R2

Runbook de bout en bout. Le code de l'app est **déjà** branché sur R2 (uploads via le
Worker `media-api`, lectures via `media.maxmorrys.me`). Il reste les étapes **infra**
(Cloudflare) et la **migration des données** (fichiers + URLs Firestore).

## Vue d'ensemble

```
Navigateur ──POST + Firebase ID token──► Worker media-api.maxmorrys.me ──► R2 (maxmorrys-lms)
                                                                              │
Lecture publique ◄──────────────── media.maxmorrys.me (domaine R2) ◄─────────┘
```

---

## 1. Créer le bucket R2 + domaine public

1. Cloudflare Dashboard → **R2** → *Create bucket* → nom **`maxmorrys-lms`**.
2. Bucket → **Settings** → **Public access** → **Custom Domain** → ajouter
   **`media.maxmorrys.me`** (Cloudflare crée le CNAME automatiquement dans la zone).
3. Vérifier que `https://media.maxmorrys.me/` répond (404 sur la racine = normal).

## 2. Déployer le Worker d'upload

```bash
cd worker
npm install
# Confirmer FIREBASE_PROJECT_ID dans wrangler.toml (= project_id Firebase, ex. "max-morrys")
# Renseigner ADMIN_UIDS = "<ton uid admin>" (UIDs autorisés à écrire dans uploads/, club_events/, club_sessions/)
npx wrangler deploy
```

Le binding R2 (`BUCKET` → `maxmorrys-lms`) et la route `media-api.maxmorrys.me`
sont définis dans `worker/wrangler.toml`.

> Trouver ton UID admin : Firebase Console → Authentication → ta ligne → *User UID*.

## 3. Copier les fichiers existants Firebase Storage → R2

> ⚠️ Le Storage est bloqué. Réactiver **temporairement Blaze** sur le projet Firebase
> (Console → ⚙️ → Usage and billing → Modify plan) pour débloquer l'export, puis
> repasser en Spark une fois la copie finie.

Recommandé : **rclone** (gère nativement Google Cloud Storage et R2/S3).

```bash
brew install rclone   # macOS

# Remote source GCS — auth via un compte de service ayant accès au bucket
rclone config create gcs google cloud storage \
  service_account_file=/chemin/serviceAccount.json \
  project_number=<num_projet>

# Remote destination R2 (S3-compatible) — créer un token API R2 (Access Key/Secret)
# dans Cloudflare → R2 → Manage R2 API Tokens
rclone config create r2 s3 provider=Cloudflare \
  access_key_id=<R2_ACCESS_KEY> secret_access_key=<R2_SECRET> \
  endpoint=https://0594b430c16dc38eabe07ff8c512f632.r2.cloudflarestorage.com

# Copie (préserve les chemins/clés à l'identique)
rclone copy gcs:max-morrys.firebasestorage.app r2:maxmorrys-lms --progress
# (le nom de bucket "maxmorrys-lms" correspond au chemin de ton endpoint S3 R2)
```

Vérifier ensuite qu'un objet connu est lisible publiquement, p. ex. :
`https://media.maxmorrys.me/Je-te-forme/2252.jpg`

## 4. Réécrire les URLs dans Firestore

Les documents Firestore référencent encore des URLs `firebasestorage.googleapis.com`.
Le script `scripts/rewrite-firestore-urls.mjs` les convertit vers `media.maxmorrys.me`.

```bash
# Auth Firestore Admin (Firestore reste accessible en Spark)
export GOOGLE_APPLICATION_CREDENTIALS=/chemin/serviceAccount.json

# Aperçu (n'écrit rien)
node scripts/rewrite-firestore-urls.mjs

# Appliquer
node scripts/rewrite-firestore-urls.mjs --apply
```

Collections/champs traités : `users.photoURL`, `blog.{coverImage,ogImage,twitterImage}`,
`formations.{coverImage,ogImage}`, `podcasts.{coverImage,ogImage}`,
`videos.{thumbnailUrl,ogImage}`, `testimonials.{avatar,mediaUrl}`,
`club_posts.{mediaUrl,userPhoto}`, `club_events.imageUrl`, `club_sessions.imageUrl`,
`club_subscriptions.userPhoto`, `club_comments.userPhoto`.

## 5. Déployer l'app + vérifier

```bash
npm run build
firebase deploy --only hosting   # CSP mise à jour (media-src + connect-src R2)
```

- Recharger Blog / Formations / Podcasts / Videos et un profil → les médias historiques
  s'affichent (plus aucune URL `firebasestorage.googleapis.com` dans le DOM).
- Tester un upload (admin : image d'article ; user : avatar) → l'URL renvoyée commence
  par `https://media.maxmorrys.me/`.
- Console navigateur : aucune erreur CSP.

## 6. Repasser en Spark

Une fois tout vérifié, le Storage Firebase n'est plus utilisé → repasser le projet en
**Spark** (annuler Blaze) pour stopper toute facturation.

---

## Phase 2 (à planifier) — contenu protégé

Non couvert ici (sert encore via Storage / accès restreint) :
- vidéos de cours (`formations/.../videos/...`), ressources PDF, certificats,
  lecture privée de `club_media`.
- À traiter via un Worker délivrant des **URLs signées** après vérification du rôle /
  de l'inscription (remplace `storage.rules`).
- Cloud Functions touchant Storage à re-router vers R2 si réactivées :
  `functions/src/socialCard.ts`, `storage-cleanup.ts`, `maintenance.ts`, `gdpr.ts`.
