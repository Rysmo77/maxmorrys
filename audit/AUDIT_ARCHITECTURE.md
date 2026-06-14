# AUDIT ARCHITECTURE — maxmorrys.me

## 1. Stack technique (confirmée)

| Couche | Technologie | Version |
|---|---|---|
| Framework front | React | 18.3.1 |
| Langage | TypeScript (strict) | 5.5.3 |
| Build | Vite | 5.4.2 |
| Routing | React Router DOM | 7.13.1 |
| Styling | TailwindCSS (+ typography) | 3.4.1 |
| Animations | Framer Motion | 12.38 |
| Éditeur riche | TipTap | 3.22 |
| Sanitisation | DOMPurify | 3.3 |
| Monitoring | Sentry | 10.47 |
| Backend | Firebase Functions v2 (Node 22) | firebase-functions 6 |
| Auth / DB / Storage | Firebase Auth, Firestore, Storage | firebase 12.9 (admin 12) |
| IA | @google/genai (Gemini) | 2.7 |
| Paiement | Bictorys (REST + webhook HMAC) | — |
| Gestionnaire de paquets | npm (`package-lock.json` v3) | — |
| CI/CD | GitHub Actions → Firebase Hosting + Functions | — |

## 2. Cartographie textuelle des modules

```
maxmorrys.me-main/
├── src/                            # FRONTEND (React SPA, ~31 000 lignes)
│   ├── App.tsx                     # Routeur central (public / auth / LMS / admin)
│   ├── config/firebase.ts          # Init Firebase + validation des env vars au boot
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Auth + userData Firestore (rôle)
│   │   └── ThemeContext.tsx         # Dark mode
│   ├── components/
│   │   ├── routing/ProtectedRoute   # Guards : ProtectedRoute (user) + AdminRoute (admin|support)
│   │   ├── layout/                  # Header, Footer, AdminLayout, LmsLayout, PublicLayout
│   │   ├── ui/                       # 18 primitives (Button, Input, Modal, Sheet, Toast, …)
│   │   ├── shared/                  # ErrorBoundary, SEOHead, CookieBanner, SearchOverlay, Newsletter
│   │   ├── ai/RysmoWidget.tsx        # Tuteur IA (callable rysmo)
│   │   └── lms/                      # XPBar, BadgeCard, StreakWidget, Onboarding, ClubSubscriptionGate
│   ├── pages/
│   │   ├── (public)                 # Home, About, Blog(+Post), Formations(+Detail), Podcasts, Videos, FAQ, Contact
│   │   ├── legal/                   # MentionsLegales, Confidentialite, CGV, CGU, Cookies
│   │   ├── auth/                     # Login, Register, ResetPassword
│   │   ├── lms/                      # CoursePlayer, Checkout, PaymentReturn, Certificate, routes/*, tabs/*
│   │   └── admin/                    # 16 pages CRUD + components/ + hooks/
│   ├── lib/
│   │   ├── firestore/               # 15 modules d'accès données (helpers, blog, formations, club, dm, …)
│   │   ├── gamification.ts          # XP/level/badge/streak (⚠ écritures CLIENT)
│   │   ├── utils.ts                 # cn, markdownToHtml (DOMPurify), formatPrice, …
│   │   └── sentry.ts                # captureError
│   ├── hooks/                       # useConfirmDialog, useContentEngagement, usePagination
│   └── types/index.ts               # Modèle de données partagé (~570 lignes)
│
├── functions/src/                  # BACKEND (Cloud Functions, ~4 100 lignes, 42 fonctions)
│   ├── index.ts                     # Barrel d'export
│   ├── payment.ts                   # Bictorys : createXCharge + bictorysWebhook (HMAC)
│   ├── rysmo.ts                     # Chatbot IA + quotas transactionnels
│   ├── admin.ts                     # adminCreateUser / ManageRysmoQuota / ManageEnrollment
│   ├── gdpr.ts                      # exportUserData / deleteUserAccount
│   ├── certificates.ts             # issueCertificate (re-dérive la complétion serveur)
│   ├── proxy.ts                     # spotifyProxy / youtubeProxy (admin)
│   ├── notifications.ts            # triggers + scheduled (streak/course reminders)
│   ├── maintenance.ts              # cleanupTempStorage / backupFirestore
│   ├── storage-cleanup.ts          # triggers de suppression de fichiers
│   ├── import-episodes.ts          # import podcasts Spotify
│   ├── media-stats.ts              # sync vues YouTube / Spotify
│   ├── prerender.ts                # SSR/SEO (sitemap, rss, catalog, prerender)
│   ├── leaderboard / referrals / club / cv  # gamification serveur, parrainage, digest, parseCv
│
├── firestore.rules                 # RBAC + validation de champs (586 lignes)
├── storage.rules                   # Accès fichiers (enrollment-gated, 279 lignes)
├── firestore.indexes.json          # 23 index composites
├── firebase.json                   # Hosting + en-têtes sécurité + rewrites SSR
└── .github/workflows/ci.yml        # lint → typecheck(non bloquant) → build → deploy
```

## 3. Flux de contrôle (haut niveau)

```
Visiteur ─▶ PublicLayout ─▶ pages publiques (SSR via prerender() pour SEO)
   │
   └─ /connexion ─▶ AuthContext.signIn ─▶ Firebase Auth ─▶ onAuthStateChanged
                                                              │
                          ┌───────────────────────────────────┘
                          ▼
            userData (Firestore users/{uid}.role)
                          │
      ┌───────────────────┼────────────────────────┐
      ▼                   ▼                         ▼
 ProtectedRoute      AdminRoute               (role gate)
 (/mon-espace/*)     (/admin/* : admin|support)
      │                   │
      ▼                   ▼
 LMS (Firestore SDK   Admin CRUD (Firestore SDK + callables admin-only)
  + callables :          │
  rysmo, checkout,       ▼
  certificate, gdpr)  Cloud Functions ─▶ Firestore (Admin SDK, bypass rules)
                          │
                          └─ Webhook Bictorys (HMAC) ─▶ effets de bord idempotents
```

## 4. Forces

1. **Séparation des responsabilités nette** : routing/guards, contextes, couche données (`lib/firestore`), composants UI, pages par domaine. Le code métier sensible (paiement, certificat, quotas) est côté serveur.
2. **Couche d'accès données centralisée** : `src/lib/firestore/*` factorise `getCollection/createDoc/updateDocById/...` — pas d'appels Firestore dispersés en dur dans les composants.
3. **Autorité serveur sur le critique** : `issueCertificate` re-dérive la complétion ; les prix sont calculés serveur ; le webhook est l'unique source de vérité de paiement (HMAC + idempotence `webhook_events`).
4. **Performance build native** : lazy-loading (`lazyWithReload` avec auto-reload sur chunk obsolète post-déploiement), `manualChunks` Vite, optimisation d'images au build.
5. **Sécurité déclarative robuste** : `firestore.rules`/`storage.rules` portent l'autorisation (RBAC, validation de champs, anti-mass-assignment, contenu *enrollment-gated*).
6. **Typage strict et partagé** : `src/types/index.ts` sert de contrat ; `noUnusedLocals/Parameters` activés ; typecheck **passe** (0 erreur).
7. **Documentation interne** : README de 480 lignes + FIREBASE_SETUP / DEPLOYMENT / DESIGN_BRIEF / BUSINESS_*.

## 5. Faiblesses

| # | Faiblesse | Détail | Impact |
|---|---|---|---|
| A1 | **Pas de couche de cache/synchronisation** | Firestore SDK appelé impérativement dans les `useEffect` ; ni React Query ni store global ; pas d'invalidation après mutation (sauf listeners temps réel pour notifications/messages/DM) | Re-fetch, lectures Firestore redondantes, UI parfois non rafraîchie après mutation |
| A2 | **Logique de gamification dupliquée et côté client** | `src/lib/gamification.ts` écrit XP/level/badges via SDK client ; règle `gamification` = `isOwner` sans validation de valeur | Intégrité (cf. SECURITY §S2) + duplication avec la logique serveur (`leaderboard`, `referrals`) |
| A3 | **Fichiers monolithiques** | `About.tsx` 1218, `Home.tsx` 809, `payment.ts` 748, `rysmo.ts` 740, `AdminFormations.tsx` 606, `RysmoWidget.tsx` 587 | Lisibilité, testabilité, risque de régression |
| A4 | **Modèle de permissions à deux vitesses** | `AdminRoute` autorise `admin`+`support` mais beaucoup de Functions/règles n'autorisent que `admin` | Incohérences UX (cf. ROLES) |
| A5 | **Pas de validation runtime des données** | Types TS uniquement à la compilation ; pas de Zod/io-ts aux frontières (données Firestore castées `as T`) | Erreurs runtime si la donnée diverge du type |
| A6 | **CI typecheck non bloquant** | `continue-on-error: true` (alors que typecheck passe aujourd'hui) | Laisse passer de futures régressions de types |
| A7 | **Pas de tests** | Aucune suite ; `@firebase/rules-unit-testing` inutilisé | Pas de filet de régression (cf. QA) |

## 6. Risques architecturaux

- **Couplage fort au SDK Firestore dans l'UI** : changer de stratégie de fetching (cache, offline, pagination uniforme) imposera de toucher beaucoup de composants faute d'abstraction de requête unifiée au-delà des helpers.
- **Gamification client/serveur ambivalente** : deux sources de vérité (écritures client `gamification.ts` + recalcul serveur `leaderboard`/`referrals`) → divergences et surface d'abus.
- **Scalabilité des jobs planifiés** : `streakReminder`/`media-stats` lisent des collections entières (cf. BACKEND §B2) — la conception ne tient pas à 10 000+ documents.
- **Bundles lourds** (Firebase, ClubPage, router) : dette de performance qui s'aggrave avec les fonctionnalités Club.

## 7. Refactorings recommandés (par priorité)

| Priorité | Refactoring | Effort | Bénéfice |
|---|---|---|---|
| P1 | Déplacer toute écriture de gamification vers des Cloud Functions ; verrouiller la règle `gamification` en écriture | Moyen | Sécurité + source de vérité unique |
| P1 | Introduire React Query (ou TanStack Query) avec clés + invalidation post-mutation | Moyen-élevé | Cohérence data, moins de lectures, UX |
| P2 | Découper `ClubPage`/`AdminClubDigitos`/`About`/`Home` en sous-modules lazy | Moyen | Performance + maintenabilité |
| P2 | Unifier le modèle de permissions (helper `canDoX(role)` partagé front + miroir Functions `isAdminOrSupport`) | Moyen | Cohérence rôles |
| P3 | Ajouter une validation runtime (Zod) aux frontières de données critiques (user, transaction, enrollment) | Moyen | Robustesse |
| P3 | Extraire la logique métier des gros composants vers `lib/` testable | Moyen | Testabilité |
| P3 | Logging structuré côté Functions (remplacer `console.*`) | Faible | Observabilité |

## 8. Conventions observées (cohérentes)

- Icônes : `lucide-react` (+ `@phosphor-icons` ponctuel).
- Rôles : `'student' | 'admin' | 'support'`.
- Couleurs : tokens `brand-/accent-/neutral-/error-/plum-/...` (mais quelques couleurs en dur subsistent, cf. FRONTEND).
- Gestion d'erreur : `error: unknown` dans les `catch` (respecté).
- IDs déterministes : `enrollments/{uid}_{formationId}`, `gamification/{uid}` — facilitent l'idempotence et le *gating* Storage.
