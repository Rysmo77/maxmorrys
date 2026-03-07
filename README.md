# Max-Morrys Platform v2

Plateforme web complète de formation en ligne avec système LMS, gestion de contenu, et dashboard administrateur.

## Vue d'ensemble

Cette application est une **Single Page Application (SPA)** construite avec **React + TypeScript + Firebase**, offrant :

- 📚 **LMS complet** : Cours, modules, leçons, progression, certificats
- ✍️ **Blog & Contenus** : Articles, podcasts, vidéos
- 👤 **Authentification Firebase** : Email/password sécurisé
- 🎨 **Dark mode** : Thème clair/sombre avec préférence système
- 📱 **Responsive** : Mobile, tablette, desktop
- 🔒 **Sécurisé** : Règles Firestore et Storage strictes
- 📊 **Dashboard admin** : Gestion complète du contenu et analytics
- 🍪 **RGPD/CDP compliant** : Cookie banner, pages légales
- 🌍 **SEO-ready** : Meta tags, sitemap, structure sémantique

---

## Stack technique

### Frontend
- **React 18** avec TypeScript
- **Vite** (build rapide)
- **React Router** v7 (navigation SPA)
- **Tailwind CSS** (design system)
- **Lucide React** (icônes)

### Backend & Services
- **Firebase Authentication** (gestion utilisateurs)
- **Firestore Database** (base de données NoSQL)
- **Firebase Storage** (fichiers, images, vidéos)
- **Firebase Hosting** (déploiement)

### Architecture
- **Component-based** : Composants réutilisables
- **Context API** : Gestion d'état (Auth, Theme)
- **Custom hooks** : Logique métier partagée
- **Design tokens** : Système de couleurs cohérent

---

## Structure du projet

```
maxmorrys-platform/
├── src/
│   ├── components/
│   │   ├── ui/               # Composants UI de base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── layout/           # Layout (Header, Footer)
│   │   └── shared/           # Composants partagés
│   │       ├── CookieBanner.tsx
│   │       ├── ScrollProgress.tsx
│   │       ├── SearchOverlay.tsx
│   │       └── NewsletterForm.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── Blog.tsx
│   │   ├── Formations.tsx
│   │   ├── Podcasts.tsx
│   │   ├── Videos.tsx
│   │   ├── FAQ.tsx
│   │   ├── Contact.tsx
│   │   ├── auth/             # Pages d'authentification
│   │   ├── legal/            # Pages légales (RGPD, CGV, etc.)
│   │   ├── lms/              # LMS (Dashboard étudiant, lecteur)
│   │   └── admin/            # Dashboard administrateur
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── config/
│   │   └── firebase.ts       # Configuration Firebase
│   ├── lib/
│   │   ├── mockData.ts       # Données de démonstration
│   │   └── utils.ts          # Fonctions utilitaires
│   ├── types/
│   │   └── index.ts          # Définitions TypeScript
│   ├── App.tsx               # Composant racine avec Router
│   ├── main.tsx              # Point d'entrée
│   └── index.css             # Styles globaux
├── public/
├── firestore.rules           # Règles de sécurité Firestore
├── storage.rules             # Règles de sécurité Storage
├── firestore.indexes.json    # Configuration des indexes
├── firebase.json             # Configuration Firebase
├── .env.example              # Template variables d'environnement
├── FIREBASE_SETUP.md         # Documentation Firebase détaillée
├── DEPLOYMENT.md             # Guide de déploiement complet
└── package.json
```

---

## Installation & Développement

### 1. Cloner et installer

```bash
git clone [URL_DU_REPO]
cd maxmorrys-platform
npm install
```

### 2. Configurer Firebase

Copier et remplir les variables d'environnement :

```bash
cp .env.example .env
nano .env
```

Voir **DEPLOYMENT.md** pour obtenir vos credentials Firebase.

### 3. Lancer en développement

```bash
npm run dev
```

Ouvrir http://localhost:5173

### 4. Build de production

```bash
npm run build
npm run preview  # Prévisualiser le build
```

---

## Fonctionnalités principales

### 🏠 Site public

**Pages principales**
- Accueil : Hero, stats, formations vedettes, témoignages, CTA
- À propos : Bio, valeurs, timeline, achievements
- Formations : Catalogue avec filtres (niveau, catégorie), détails de chaque formation
- Blog : Articles avec catégories, tags, recherche
- Podcasts & Vidéos : Contenus multimédia
- FAQ : Questions/réponses avec catégories
- Contact : Formulaire + coordonnées

**Pages légales** (conformes RGPD + CDP Sénégal)
- Mentions légales
- Politique de confidentialité
- Conditions Générales de Vente (CGV)
- Politique de cookies

### 🔐 Authentification

- **Inscription** : Email + mot de passe + nom
- **Connexion** : Email + mot de passe
- **Mot de passe oublié** : Réinitialisation par email
- **Gestion de session** : Auto-login, déconnexion

Tous les messages d'erreur Firebase sont traduits en français.

### 🎓 LMS (Espace étudiant)

**Dashboard étudiant**
- Vue d'ensemble : Formations en cours, progression, stats
- Liste des formations inscrites
- Accès rapide aux leçons

**Lecteur de cours**
- Navigation modules/leçons
- Vidéos, textes, quiz, ressources téléchargeables
- Marquage leçons comme terminées
- Barre de progression globale
- Génération automatique de certificat à 100%

**Certificats**
- Générés automatiquement à la fin d'une formation
- Téléchargeables en PDF
- Partageables sur LinkedIn

### 👨‍💼 Dashboard Administrateur

Accessible uniquement aux utilisateurs avec `role: 'admin'`.

**7 modules de gestion :**

1. **Vue d'ensemble** : Métriques clés, graphiques, activité récente
2. **Articles** : CRUD blog posts, statuts (brouillon/publié), featured
3. **Formations** : CRUD formations, modules, leçons, prix, promotions
4. **Utilisateurs** : Voir tous les users, rôles, statistiques
5. **Messages** : Inbox des messages de contact, statuts
6. **Analytics** : Trafic, sources, conversions, top pages
7. **Paramètres** : Config site, apparence, notifications

### 🎨 Design & UX

**Design system**
- 6 palettes de couleurs (brand, neutral, success, warning, error, accent)
- Dark mode complet avec préférence système (`prefers-color-scheme`)
- Composants réutilisables avec variantes
- Animations et transitions subtiles
- Responsive breakpoints (mobile, tablet, desktop)

**Fonctionnalités UX**
- Cookie banner conforme RGPD (granularité des choix)
- Barre de progression de scroll sur articles longs
- Recherche globale (blog, formations, FAQ)
- Toasts de notification (succès, erreur, info)
- Skeletons de chargement
- Lazy loading des images

---

## Sécurité et règles Firebase

### Firestore Rules

Les règles (`firestore.rules`) implémentent :

✅ **Contrôle d'accès basé sur les rôles (RBAC)**
- `student` : Accès à ses propres données et contenus publics
- `admin` : Accès complet à toutes les collections
- `support` : Accès aux messages et utilisateurs

✅ **Protection des contenus premium**
- Les vidéos et ressources de cours ne sont accessibles qu'aux étudiants inscrits
- Vérification via la collection `enrollments`

✅ **Prévention de fraude**
- Impossible de créer un enrollment sans passer par le backend (paiement)
- Les utilisateurs ne peuvent pas s'auto-promouvoir admin
- Les transactions sont créées uniquement par des webhooks de paiement

✅ **Audit trail**
- Les logs d'activité sont immuables (personne ne peut les modifier/supprimer)
- Traçabilité complète des actions admin

### Storage Rules

Les règles (`storage.rules`) implémentent :

✅ **Accès public/privé**
- Images publiques (blog, avatars, formations) : lecture ouverte
- Vidéos de cours : accessibles uniquement si inscrit
- Ressources téléchargeables : idem

✅ **Validation des uploads**
- Types MIME autorisés (images, vidéos, PDF, documents)
- Limites de taille (10 MB images, 50 MB docs, 100 MB vidéos)
- Contrôle de qui peut uploader (admins pour le contenu, users pour avatar)

✅ **Quotas et performance**
- Fichiers temporaires nettoyés après 24h
- Compression et optimisation recommandées

---

## Structure de données Firestore

### Collections principales

**users**
```typescript
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

**formations**
```typescript
{
  id: string,
  title: string,
  slug: string,
  description: string,
  coverImage: string,
  level: 'debutant' | 'intermediaire' | 'avance',
  price: number,
  modules: Module[],
  students: number,
  rating: number,
  status: 'draft' | 'published'
}
```

**enrollments**
```typescript
{
  id: string (userId_formationId),
  userId: string,
  formationId: string,
  enrolledAt: timestamp,
  progress: number (0-100),
  completedLessons: string[],
  certificateIssued: boolean
}
```

Voir **FIREBASE_SETUP.md** pour la liste complète des collections et leur structure.

---

## Conformité légale

### RGPD (Union Européenne)

✅ **Consentement** : Cookie banner avec choix granulaires
✅ **Minimisation** : Collecte uniquement des données nécessaires
✅ **Droit d'accès** : Les utilisateurs peuvent voir leurs données
✅ **Droit à l'oubli** : Les admins peuvent supprimer les comptes
✅ **Portabilité** : Export des données possible
✅ **Sécurité** : HTTPS, chiffrement au repos (Firebase)

### CDP Sénégal (Loi 2008-12)

✅ **Conformité à la loi sur la protection des données personnelles**
✅ **Pages légales** : Mentions, confidentialité, CGV présentes et accessibles
✅ **Transparence** : Politique claire sur l'utilisation des données
✅ **Consentement explicite** : Pour newsletter et cookies non-essentiels

---

## Performance et optimisations

### Build optimisé

- **Code splitting** : Firebase, Router séparés du bundle principal
- **Lazy loading** : Images avec `loading="lazy"`
- **Minification** : CSS et JS minifiés en production
- **Tree shaking** : Code inutilisé supprimé automatiquement

### Métriques cibles

- **FCP** : < 1.5s
- **LCP** : < 2.5s
- **TTI** : < 3.5s
- **CLS** : < 0.1

### Cache et CDN

Firebase Hosting fournit automatiquement :
- CDN global avec 100+ edge locations
- Cache des assets statiques (images, JS, CSS)
- Compression gzip/brotli automatique
- Certificat SSL automatique

---

## Scripts disponibles

```bash
# Développement
npm run dev              # Serveur de dev (port 5173)

# Build
npm run build            # Build de production
npm run preview          # Prévisualiser le build

# Qualité
npm run lint             # Linter ESLint
npm run typecheck        # Vérification TypeScript

# Firebase
firebase login           # Se connecter à Firebase
firebase deploy          # Déployer tout
firebase deploy --only hosting  # Déployer seulement le site
firebase emulators:start # Lancer les émulateurs locaux
```

---

## Roadmap et évolutions futures

### Phase 1 : MVP (Actuel) ✅

- [x] Site public complet
- [x] Authentification Firebase
- [x] LMS de base
- [x] Dashboard admin
- [x] Pages légales
- [x] Dark mode
- [x] Responsive design

### Phase 2 : Premium Features

- [ ] Système de paiement (Wave, Orange Money, Stripe)
- [ ] Génération automatique de certificats (Cloud Function)
- [ ] Recherche sémantique avancée (embeddings)
- [ ] PWA complète (offline, push notifications)
- [ ] Chatbot IA connecté à ChatGPT + contenu interne

### Phase 3 : Analytics & Marketing

- [ ] Google Analytics 4 intégré
- [ ] Heatmaps (Hotjar/Clarity)
- [ ] A/B testing natif
- [ ] Email marketing automatisé (SendGrid)
- [ ] Social proof live (compteurs visiteurs, achats récents)

### Phase 4 : Fonctionnalités avancées

- [ ] Cohortes et sessions live
- [ ] Forum/communauté étudiants
- [ ] Live chat support
- [ ] Gamification (badges, classements)
- [ ] Recommandations personnalisées (ML)

---

## Contribution

### Workflow

1. Fork le projet
2. Créer une branche feature : `git checkout -b feature/ma-feature`
3. Commit : `git commit -m 'Add: ma feature'`
4. Push : `git push origin feature/ma-feature`
5. Ouvrir une Pull Request

### Standards de code

- **TypeScript strict** activé
- **ESLint** : Pas de warnings
- **Composants** : Fonctionnels uniquement (hooks)
- **Naming** : camelCase (variables), PascalCase (composants)
- **Commentaires** : Uniquement si logique complexe

---

## Support et documentation

### Documentation détaillée

- **FIREBASE_SETUP.md** : Structure Firestore, règles, indexes
- **DEPLOYMENT.md** : Guide de déploiement complet
- **firestore.rules** : Règles de sécurité Firestore commentées
- **storage.rules** : Règles de sécurité Storage commentées

### Ressources externes

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)

---

## Licence

Propriétaire - Max-Morrys © 2026

---

## Contact

- **Email** : contact@maxmorrys.com
- **Site** : https://maxmorrys.com
- **LinkedIn** : Max-Morrys

---

**Développé avec ❤️ pour les entrepreneurs et créateurs de contenu africains.**
