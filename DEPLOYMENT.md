# Guide de déploiement - Max-Morrys Platform

## Prérequis

- Node.js 18+ installé
- Un compte Firebase (gratuit pour commencer)
- Git installé

---

## 1. Créer un projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquer sur "Ajouter un projet"
3. Nommer le projet : `maxmorrys-platform` (ou autre nom)
4. Activer/désactiver Google Analytics (facultatif)
5. Créer le projet

---

## 2. Activer les services Firebase

### Authentication
1. Dans le menu Firebase, aller dans **Authentication**
2. Cliquer sur "Commencer"
3. Activer le fournisseur **Email/Password**
4. Enregistrer

### Firestore Database
1. Aller dans **Firestore Database**
2. Cliquer sur "Créer une base de données"
3. Choisir le mode : **Production** (les règles sont déjà configurées)
4. Choisir l'emplacement : `europe-west` (ou proche de votre audience)
5. Créer

### Storage
1. Aller dans **Storage**
2. Cliquer sur "Commencer"
3. Mode : **Production**
4. Même emplacement que Firestore
5. Terminer

---

## 3. Obtenir les credentials Firebase

1. Dans Firebase Console, aller dans **Paramètres du projet** (icône engrenage)
2. Descendre jusqu'à "Vos applications"
3. Cliquer sur l'icône **Web** `</>`
4. Nommer l'application : `Max-Morrys Web`
5. Cocher "Configurer également Firebase Hosting" (facultatif)
6. Enregistrer l'application

Vous obtiendrez un objet de configuration comme celui-ci :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "maxmorrys-platform.firebaseapp.com",
  projectId: "maxmorrys-platform",
  storageBucket: "maxmorrys-platform.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012"
};
```

---

## 4. Configuration locale

### Copier les credentials

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos vraies valeurs
nano .env
```

Remplir le fichier `.env` avec vos credentials Firebase obtenus à l'étape précédente.

### Installer les dépendances

```bash
npm install
```

---

## 5. Déployer les règles Firebase

### Installation Firebase CLI

```bash
npm install -g firebase-tools
```

### Script automatique (recommandé)

```bash
chmod +x scripts/init-firebase.sh
./scripts/init-firebase.sh
```

### Ou manuellement

```bash
# Se connecter
firebase login

# Sélectionner le projet
firebase use maxmorrys-platform

# Déployer les règles
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

---

## 6. Initialiser les données

### Créer le premier admin

1. **Créer l'utilisateur dans Authentication :**
   - Firebase Console > Authentication > Users
   - Cliquer "Add user"
   - Email : `admin@maxmorrys.com` (ou votre email)
   - Password : choisir un mot de passe fort
   - Enregistrer et copier l'**UID** de l'utilisateur

2. **Créer le document utilisateur dans Firestore :**
   - Firebase Console > Firestore Database
   - Cliquer "Start collection"
   - Collection ID : `users`
   - Document ID : coller l'**UID** copié précédemment
   - Ajouter les champs :

```json
{
  "uid": "UID_que_vous_avez_copie",
  "email": "admin@maxmorrys.com",
  "displayName": "Max-Morrys",
  "role": "admin",
  "createdAt": "2026-02-26T10:00:00.000Z",
  "preferences": {
    "theme": "system",
    "language": "fr",
    "newsletter": true
  }
}
```

### Créer le document settings

1. Dans Firestore Database
2. Créer une collection `settings`
3. Document ID : `site`
4. Champs :

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

## 7. Tester localement

```bash
# Lancer le serveur de développement
npm run dev

# Ouvrir http://localhost:5173
```

Tester la connexion avec votre compte admin créé précédemment.

---

## 8. Build de production

```bash
npm run build
```

Le build sera créé dans le dossier `dist/`.

---

## 9. Déploiement sur Firebase Hosting

### Première fois

```bash
firebase init hosting

# Choisir :
# - Public directory: dist
# - Configure as SPA: Yes
# - Set up automatic builds: No (ou Yes pour CI/CD)
```

### Déployer

```bash
# Build
npm run build

# Déployer
firebase deploy --only hosting
```

Votre site sera accessible sur : `https://maxmorrys-platform.web.app`

---

## 10. Configuration d'un domaine personnalisé

1. Firebase Console > Hosting
2. Cliquer "Ajouter un domaine personnalisé"
3. Entrer votre domaine : `maxmorrys.com`
4. Suivre les instructions pour configurer les DNS

Firebase fournira automatiquement un certificat SSL.

---

## Architecture déployée

```
┌─────────────────────────────────────┐
│   Firebase Hosting (SPA)            │
│   https://maxmorrys.com              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Firebase Authentication           │
│   (Email/Password)                   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Firestore Database                │
│   - users                            │
│   - blog, formations, enrollments    │
│   - messages, transactions, etc.     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Firebase Storage                   │
│   - avatars, blog images             │
│   - formation videos & resources     │
│   - certificates                     │
└─────────────────────────────────────┘
```

---

## Sécurité

### Règles de sécurité déployées

✅ **Firestore Rules** : `firestore.rules`
- Seuls les utilisateurs authentifiés peuvent accéder aux contenus premium
- Les admins ont accès complet
- Les étudiants ne peuvent pas s'auto-inscrire sans payer
- Les données sensibles sont protégées

✅ **Storage Rules** : `storage.rules`
- Les vidéos de cours sont accessibles uniquement aux étudiants inscrits
- Les utilisateurs peuvent uploader leur avatar uniquement
- Les admins contrôlent tous les uploads de contenu

### Vérifier la sécurité

```bash
# Tester les règles en local
firebase emulators:start

# Accéder au UI des émulateurs
http://localhost:4000
```

---

## Monitoring et maintenance

### Dashboard à surveiller

1. **Authentication** : Nombre d'utilisateurs, activité
2. **Firestore** : Lectures/écritures, coûts
3. **Storage** : Espace utilisé, bande passante
4. **Hosting** : Trafic, erreurs 404

### Sauvegardes

Configurer des exports automatiques Firestore :

```bash
gcloud firestore export gs://maxmorrys-platform-backups
```

### Limites du plan gratuit Firebase (Spark)

- **Firestore** : 50k lectures, 20k écritures par jour
- **Storage** : 5 GB stockage, 1 GB download par jour
- **Authentication** : Illimité
- **Hosting** : 10 GB stockage, 360 MB/jour bandwidth

Pour production → passer au **plan Blaze** (pay-as-you-go)

---

## Prochaines étapes recommandées

### 1. Implémenter le système de paiement

Intégrer Wave, Orange Money ou Stripe pour accepter les paiements. Créer une Cloud Function pour :
- Valider les paiements via webhook
- Créer automatiquement les enrollments
- Envoyer des emails de confirmation

### 2. Génération automatique des certificats

Cloud Function déclenchée quand un étudiant atteint 100% de progression :
- Générer un PDF personnalisé
- Uploader dans Storage
- Envoyer par email

### 3. Analytics avancés

Implémenter :
- Google Analytics 4
- Suivi des conversions
- Heatmaps (Hotjar/Clarity)
- A/B testing

### 4. Emails automatiques

Configurer SendGrid ou Firebase Email Extension pour :
- Welcome emails
- Confirmations d'achat
- Certificats
- Newsletter

### 5. Progressive Web App (PWA)

Ajouter un Service Worker pour :
- Fonctionnement offline
- Push notifications
- Installation sur mobile/desktop

---

## Troubleshooting

### Erreur : "Permission denied" dans Firestore

1. Vérifier que les règles sont déployées : `firebase deploy --only firestore:rules`
2. Vérifier que l'utilisateur est bien authentifié
3. Vérifier le rôle dans le document users/{uid}

### Erreur : "Index not found"

Déployer les indexes : `firebase deploy --only firestore:indexes`

### Erreur : Les vidéos ne se chargent pas

1. Vérifier les règles Storage : `firebase deploy --only storage`
2. Vérifier que l'utilisateur est bien enrolled dans la formation
3. Vérifier les CORS si les vidéos sont hébergées ailleurs

### L'application ne se charge pas

1. Vérifier que le build est à jour : `npm run build`
2. Vérifier les credentials dans `.env`
3. Vérifier la console navigateur pour les erreurs

---

## Support

Pour toute question :
- Documentation Firebase : https://firebase.google.com/docs
- Documentation technique : `FIREBASE_SETUP.md`
- Structure des règles : `firestore.rules` et `storage.rules`

---

**Important** : Ce guide suppose que vous utilisez Firebase uniquement. Si vous préférez utiliser Supabase (comme mentionné dans le projet), référez-vous au README principal pour les instructions Supabase.
