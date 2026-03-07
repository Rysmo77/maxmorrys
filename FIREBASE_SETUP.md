# Configuration Firebase - Max-Morrys Platform

## Structure de la base de données Firestore

### Collections principales

#### `users`
Profils utilisateurs avec rôles et préférences.
```
{
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string,
  role: 'student' | 'admin' | 'support',
  createdAt: timestamp,
  preferences: {
    theme: 'light' | 'dark' | 'system',
    language: 'fr' | 'en',
    newsletter: boolean
  }
}
```

#### `blog`
Articles de blog avec statut de publication.
```
{
  id: string,
  title: string,
  slug: string,
  excerpt: string,
  content: string,
  coverImage: string,
  category: string,
  tags: string[],
  author: string,
  publishedAt: timestamp,
  readTime: number,
  featured: boolean,
  status: 'draft' | 'published' | 'scheduled'
}
```

#### `formations`
Catalogue des formations avec modules et leçons.
```
{
  id: string,
  title: string,
  slug: string,
  description: string,
  longDescription: string,
  coverImage: string,
  level: 'debutant' | 'intermediaire' | 'avance',
  price: number,
  promoPrice?: number,
  duration: string,
  modules: Module[],
  category: string,
  tags: string[],
  students: number,
  rating: number,
  status: 'draft' | 'published',
  featured: boolean,
  certificateEnabled: boolean
}
```

#### `enrollments`
Inscriptions des étudiants aux formations.
```
{
  id: string (userId_formationId),
  userId: string,
  formationId: string,
  enrolledAt: timestamp,
  progress: number (0-100),
  completedLessons: string[],
  certificateIssued: boolean,
  certificateUrl?: string
}
```

Sous-collection `progress` :
```
enrollments/{enrollmentId}/progress/{lessonId}
{
  lessonId: string,
  completed: boolean,
  completedAt?: timestamp,
  timeSpent: number,
  quiz_score?: number
}
```

#### `messages`
Messages de contact.
```
{
  id: string,
  name: string,
  email: string,
  subject: string,
  message: string,
  sentAt: timestamp,
  status: 'new' | 'read' | 'replied',
  userId?: string
}
```

#### `newsletter`
Abonnés à la newsletter.
```
{
  id: string,
  email: string,
  subscribedAt: timestamp,
  source: string
}
```

#### `transactions`
Historique des paiements.
```
{
  id: string,
  userId: string,
  formationId: string,
  amount: number,
  currency: string,
  status: 'pending' | 'completed' | 'refunded',
  paymentMethod: string,
  createdAt: timestamp,
  couponId?: string
}
```

#### `coupons`
Codes promotionnels.
```
{
  id: string,
  code: string,
  type: 'percentage' | 'fixed',
  value: number,
  maxUses: number,
  usedCount: number,
  expiresAt: timestamp,
  active: boolean
}
```

#### `podcasts`
Episodes de podcast.
```
{
  id: string,
  title: string,
  slug: string,
  description: string,
  audioUrl: string,
  coverImage: string,
  duration: string,
  publishedAt: timestamp,
  category: string,
  transcript?: string
}
```

#### `videos`
Vidéos publiques.
```
{
  id: string,
  title: string,
  slug: string,
  description: string,
  videoUrl: string,
  thumbnailUrl: string,
  duration: string,
  publishedAt: timestamp,
  category: string,
  views: number
}
```

#### `testimonials`
Témoignages clients.
```
{
  id: string,
  name: string,
  role: string,
  company?: string,
  content: string,
  avatar: string,
  rating: number (1-5),
  videoUrl?: string,
  featured: boolean
}
```

#### `faq`
Questions fréquentes.
```
{
  id: string,
  question: string,
  answer: string,
  category: string,
  order: number
}
```

#### `announcements`
Bannières d'annonces.
```
{
  id: string,
  title: string,
  content: string,
  type: 'info' | 'promo' | 'update',
  active: boolean,
  startDate: timestamp,
  endDate: timestamp,
  link?: string
}
```

#### `certificates`
Certificats générés.
```
{
  id: string,
  userId: string,
  formationId: string,
  issuedAt: timestamp,
  certificateUrl: string
}
```

#### `activity_logs`
Logs d'activité (audit trail).
```
{
  id: string,
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  timestamp: timestamp,
  metadata: object
}
```

#### `analytics`
Données analytiques agrégées.
```
{
  id: string (date format YYYY-MM-DD),
  date: timestamp,
  pageViews: number,
  uniqueVisitors: number,
  topPages: object[],
  sources: object[],
  devices: object[]
}
```

#### `settings/site`
Paramètres globaux du site (document unique).
```
{
  siteName: string,
  siteDescription: string,
  contactEmail: string,
  contactPhone: string,
  primaryColor: string,
  defaultTheme: 'light' | 'dark' | 'system'
}
```

---

## Structure Firebase Storage

```
/avatars/{userId}/{fileName}           - Photos de profil
/blog/{postId}/{fileName}              - Images d'articles
/formations/{formationId}/
  ├── cover/{fileName}                 - Image de couverture
  ├── videos/{lessonId}/{fileName}     - Vidéos de leçons (privées)
  └── resources/{lessonId}/{fileName}  - Ressources téléchargeables (privées)
/podcasts/{podcastId}/
  ├── {fileName}                       - Fichier audio
  └── cover/{fileName}                 - Image de couverture
/videos/{videoId}/
  └── thumbnail/{fileName}             - Miniature
/testimonials/{testimonialId}/{fileName} - Avatars
/certificates/{userId}/{certificateId}.pdf - Certificats générés
/temp/{userId}/{fileName}              - Uploads temporaires
/backups/{fileName}                    - Sauvegardes (admin uniquement)
```

---

## Déploiement des règles de sécurité

### 1. Installation de Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialisation du projet

```bash
firebase init

# Sélectionner :
# - Firestore (règles et indexes)
# - Storage (règles)
# - Hosting (optionnel)

# Utiliser les fichiers existants :
# - firestore.rules
# - firestore.indexes.json
# - storage.rules
```

### 3. Déploiement des règles

```bash
# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer les indexes Firestore
firebase deploy --only firestore:indexes

# Déployer les règles Storage
firebase deploy --only storage

# Tout déployer en une fois
firebase deploy
```

### 4. Vérification

```bash
# Tester les règles en local
firebase emulators:start

# Vérifier les règles dans la console Firebase
# https://console.firebase.google.com/
```

---

## Configuration des variables d'environnement

Créer un fichier `.env` à la racine avec vos credentials Firebase :

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Initialisation des données

### Créer le premier admin

Après le premier déploiement, créer manuellement le premier utilisateur admin dans la console Firebase :

1. Aller dans **Authentication** > Créer un utilisateur
2. Aller dans **Firestore** > Collection `users`
3. Créer un document avec l'UID de l'utilisateur :

```json
{
  "uid": "uid_de_l_utilisateur",
  "email": "admin@maxmorrys.com",
  "displayName": "Max-Morrys",
  "role": "admin",
  "createdAt": "2026-02-26T00:00:00Z",
  "preferences": {
    "theme": "system",
    "language": "fr",
    "newsletter": true
  }
}
```

### Créer le document settings

Dans Firestore, créer la collection `settings` avec un document `site` :

```json
{
  "siteName": "Max-Morrys",
  "siteDescription": "Formateur, consultant et créateur de contenu digital",
  "contactEmail": "contact@maxmorrys.com",
  "contactPhone": "+221 77 000 00 00",
  "primaryColor": "#0c93e7",
  "defaultTheme": "system"
}
```

---

## Sécurité - Points critiques

### ✅ Ce qui est sécurisé

1. **Enrollments** : Impossible de s'inscrire sans payer (création bloquée côté client)
2. **Contenus premium** : Vidéos et ressources accessibles uniquement aux étudiants inscrits
3. **Rôles** : Les utilisateurs ne peuvent pas s'auto-promouvoir admin
4. **Transactions** : Création réservée au backend (webhooks de paiement)
5. **Certificats** : Immutables, création backend uniquement
6. **Logs d'audit** : Immutables, personne ne peut les modifier/supprimer

### ⚠️ À implémenter côté backend

1. **Webhook de paiement** : Créer les enrollments et transactions après paiement validé
2. **Génération de certificats** : Cloud Function déclenchée à 100% de progression
3. **Cleanup des fichiers temporaires** : Cloud Function pour supprimer les fichiers > 24h
4. **Analytics** : Cloud Function pour agréger les données quotidiennes
5. **Emails automatiques** : Confirmation d'inscription, certificat obtenu, etc.

---

## Cloud Functions recommandées

```javascript
// functions/index.js

// 1. Créer l'enrollment après paiement réussi
exports.onPaymentSuccess = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data();
    if (transaction.status === 'completed') {
      // Créer l'enrollment
      await admin.firestore().collection('enrollments').doc(`${transaction.userId}_${transaction.formationId}`).set({
        userId: transaction.userId,
        formationId: transaction.formationId,
        enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
        progress: 0,
        completedLessons: [],
        certificateIssued: false
      });

      // Incrémenter le nombre d'étudiants
      await admin.firestore().collection('formations').doc(transaction.formationId).update({
        students: admin.firestore.FieldValue.increment(1)
      });
    }
  });

// 2. Générer le certificat à 100%
exports.generateCertificate = functions.firestore
  .document('enrollments/{enrollmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.progress < 100 && after.progress === 100 && !after.certificateIssued) {
      // Générer le PDF du certificat
      // Uploader vers Storage
      // Mettre à jour le document enrollment
      // Envoyer l'email
    }
  });

// 3. Nettoyer les fichiers temporaires
exports.cleanupTempFiles = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'temp/' });
    const now = Date.now();

    for (const file of files) {
      const [metadata] = await file.getMetadata();
      const created = new Date(metadata.timeCreated).getTime();
      if (now - created > 24 * 60 * 60 * 1000) {
        await file.delete();
      }
    }
  });

// 4. Logger l'activité admin
exports.logAdminActivity = functions.firestore
  .document('{collection}/{docId}')
  .onWrite(async (change, context) => {
    // Logger les actions des admins pour audit
  });
```

---

## Monitoring et maintenance

### Dashboard Firebase à surveiller

1. **Authentication** : Nombre d'utilisateurs, nouvelles inscriptions
2. **Firestore** : Nombre de lectures/écritures, coûts
3. **Storage** : Espace utilisé, bande passante
4. **Functions** : Exécutions, erreurs, latence
5. **Crashlytics** : Erreurs frontend (si configuré)

### Sauvegardes

Configurer des exports automatiques Firestore :
- Quotidien pour les collections critiques (users, enrollments, transactions)
- Hebdomadaire pour le reste

### Limites Firebase (plan gratuit)

- **Firestore** : 50k lectures, 20k écritures, 20k suppressions par jour
- **Storage** : 5 GB stockage, 1 GB téléchargement par jour
- **Authentication** : 10k vérifications par mois

Pour une plateforme en production, passer au **plan Blaze** (pay-as-you-go).

---

## Support et dépannage

### Erreur : "Permission denied"

Vérifier que :
1. L'utilisateur est authentifié
2. Les règles Firestore sont déployées
3. Le rôle de l'utilisateur est correct dans Firestore

### Erreur : "Index not found"

Déployer les indexes :
```bash
firebase deploy --only firestore:indexes
```

### Erreur : "Storage : Upload failed"

Vérifier que :
1. Les règles Storage sont déployées
2. Le fichier respecte les contraintes de taille
3. Le type MIME est autorisé

---

## Conformité RGPD et CDP Sénégal

Les règles implémentées respectent :

✅ **Minimisation des données** : Seules les données nécessaires sont collectées
✅ **Consentement** : Cookie banner pour trackers non-essentiels
✅ **Droit d'accès** : Les utilisateurs peuvent lire leurs propres données
✅ **Droit à l'oubli** : Les admins peuvent supprimer les comptes
✅ **Portabilité** : Export des données utilisateur possible
✅ **Sécurité** : Chiffrement en transit (HTTPS) et au repos (Firebase)
✅ **Audit trail** : Logs immuables des actions sensibles

---

**Note** : Ce document doit être mis à jour à chaque modification de la structure de données ou des règles de sécurité.
