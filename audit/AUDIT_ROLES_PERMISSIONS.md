# AUDIT RÔLES & PERMISSIONS — maxmorrys.me

> Rôles : `student` (défaut), `support`, `admin`. Guards : `src/components/routing/ProtectedRoute.tsx`.

## 1. Constat central : modèle de permissions à deux vitesses

`AdminRoute` autorise **`admin` ET `support`** à entrer dans tout `/admin/*` :
```
const allowedRoles = ['admin', 'support'];   // ProtectedRoute.tsx
```
Mais la **majorité des opérations d'écriture** sont réservées à `admin` :
- **Cloud Functions** : `adminCreateUser`, `adminManageRysmoQuota`, `adminManageEnrollment`, `spotifyProxy`, `youtubeProxy` vérifient toutes `role !== 'admin'` → **rejettent `support`** (`functions/src/admin.ts:13,67,125`, `proxy.ts:19,75+`).
- **Règles Firestore** : `blog`, `formations`, `videos`, `podcasts`, `coupons`, `announcements`, `users`(role), `analytics`… = `if isAdmin()` → **écritures `support` refusées**.
- **Lecture** : `transactions`/`analytics` = `isAdmin()` → un `support` qui ouvre `/admin/transactions` via URL obtient un **refus de lecture** (page vide/erreur).

La barre latérale (`AdminLayout.tsx`) masque la plupart des entrées aux `support` (`adminOnly: true`), n'exposant que **Messages**, **Témoignages**, **Rendez-vous** (`adminOnly: false`). **Mais** `support` peut atteindre n'importe quelle page admin **par URL directe** (AdminRoute le laisse entrer), y voir l'UI, puis **échouer** à la lecture/écriture côté serveur.

> **Important (calibrage)** : ce n'est **pas une escalade de privilèges** — le serveur (Functions + rules) bloque correctement `support`. C'est un problème de **cohérence/UX** : fausses affordances, erreurs confuses, et pages admin-only atteignables (mais inopérantes) par URL.

## 2. Matrice rôles × routes

| Route | visiteur | student | support | admin |
|---|---|---|---|---|
| `/`, `/blog`, `/formations`, `/podcasts`, `/videos`, `/faq`, `/contact`, `/legal/*` | ✅ | ✅ | ✅ | ✅ |
| `/connexion`, `/inscription`, `/mot-de-passe-oublie` | ✅ | ✅(redir) | ✅(redir) | ✅(redir) |
| `/certificat/:code` | ✅ | ✅ | ✅ | ✅ |
| `/mon-espace/*` | ➡ login | ✅ | ✅ | ✅ |
| `/cours/:slug`, `/checkout/:slug`, `/paiement/retour` | ➡ login | ✅ | ✅ | ✅ |
| `/admin` (dashboard) | ➡ login | ➡ /403 | ⚠ entre, lecture refusée | ✅ |
| `/admin/articles\|formations\|podcasts\|videos\|utilisateurs\|transactions\|coupons\|annonces\|faq\|club-digitos\|analytics\|parametres` | ➡ login | ➡ /403 | ⚠ **entre via URL, écritures/lectures refusées** | ✅ |
| `/admin/messages`, `/admin/temoignages`, `/admin/rendez-vous` | ➡ login | ➡ /403 | ✅ (prévu pour support) | ✅ |
| `/403`, `*` | ✅ | ✅ | ✅ | ✅ |

Légende : ✅ accès complet · ⚠ accès UI mais opérations serveur refusées · ➡ redirection.

## 3. Matrice rôles × fonctionnalités

| Fonctionnalité | student | support | admin | Contrôle front | Contrôle back |
|---|---|---|---|---|---|
| Consulter contenu publié | ✅ | ✅ | ✅ | route | rules (published) |
| Acheter formation / Club / Rysmo | ✅ | ✅ | ✅ | route | callable (auth) |
| Progression / certificat | ✅ | ✅ | ✅ | route | rules + `issueCertificate` |
| Club (poster/like/DM) | ✅* | ✅* | ✅* | gate sub | rules `hasActiveClubSub` |
| Répondre messages support | ❌ | ✅ | ✅ | sidebar | rules `messages` (admin/support) |
| Modérer témoignages | ❌ | ✅ | ✅ | sidebar | rules `testimonials` (admin) ⚠ |
| Gérer RDV | ❌ | ✅ | ✅ | sidebar | rules `appointments` (admin/support) |
| CRUD blog/formations/podcasts/videos | ❌ | ⚠ UI / ❌ exec | ✅ | sidebar masqué | rules `isAdmin` |
| Gérer utilisateurs / rôles | ❌ | ⚠ UI / ❌ exec | ✅ | — | callable+rules `isAdmin` |
| Coupons / annonces / settings | ❌ | ⚠ UI / ❌ exec | ✅ | sidebar masqué | rules `isAdmin` |
| Import Spotify/YouTube | ❌ | ⚠ UI / ❌ exec | ✅ | — | callable `isAdmin` |
| Transactions / analytics (lecture) | ❌ | ⚠ UI / ❌ lecture | ✅ | sidebar masqué | rules `isAdmin` |

`*` sous réserve d'abonnement Club actif. ⚠ = incohérence (UI visible, serveur refuse).

## 4. Incohérences identifiées

### [P1] Témoignages : sidebar support mais règle admin-only
- `AdminLayout.tsx:26` : `temoignages` `adminOnly: false` (visible support) — mais les écritures `testimonials` sont `if isAdmin()` dans les règles. → un `support` voit l'onglet **Témoignages** et peut tenter d'approuver/supprimer, mais **l'écriture est refusée**. Gravité : Moyenne.

### [P2] Pages admin-only atteignables par URL pour support
- Description : §1. → erreurs « permission refusée » confuses, pages vides. Gravité : Moyenne.

### [P3] Boutons admin-only visibles aux support (UserEditModal)
- `UserEditModal` expose onglets/boutons Club, Rysmo tokens, Enrollment, **création d'utilisateur** — tous adossés à des callables `admin`-only → échec serveur pour `support`. Gravité : Moyenne.

### [P4] Option « Admin » du select de rôle non gatée
- `UserEditModal` permet de **choisir** `admin` dans le `<select>` de rôle quel que soit le rôle courant. Les règles bloquent l'écriture (`users` update role = `isAdmin`), donc **pas d'escalade**, mais un `support` (ou un `admin` par erreur) peut tenter une promotion → erreur ambiguë. Gravité : Faible (UX).

## 5. Risques d'escalade — évaluation

| Vecteur | Exploitable ? | Pourquoi |
|---|---|---|
| `support` → `admin` via UI | ❌ Non | `users.role` update = `isAdmin()` (rules) |
| Auto-promotion via SDK client | ❌ Non | même règle ; `users` create force `role: 'student'` |
| `support` exécute fonctions admin | ❌ Non | callables vérifient `role === 'admin'` |
| Manipulation **gamification** (XP/badges) | ⚠️ **Oui** | `gamification` write = `isOwner` **sans validation de valeur** → cf. SECURITY §S2 (intégrité, pas escalade de rôle) |
| Accès contenu payant sans enrôlement | ❌ Non | Storage `enrollment-gated` + rules |

## 6. Corrections recommandées

| Priorité | Correction | Fichiers |
|---|---|---|
| P1 | Définir un référentiel de capacités partagé (`can(role, action)`) et l'appliquer **à la fois** au front (masquage/disable) et en miroir des Functions (`isAdminOrSupport` là où `support` doit agir) | `ProtectedRoute.tsx`, `AdminLayout.tsx`, `functions/src/admin.ts`, `proxy.ts` |
| P1 | Soit autoriser `support` côté serveur pour les actions où l'UI le laisse agir (témoignages, messages, RDV, import média), soit **masquer/désactiver** ces actions pour `support` | rules + Functions + composants admin |
| P2 | Gater la route admin par capacité, pas seulement par `['admin','support']` : rediriger `support` vers `/403` sur les pages purement admin | `ProtectedRoute.tsx` (AdminRoute paramétrable) |
| P2 | N'afficher l'option « Admin » du select qu'aux `admin` ; désactiver les boutons admin-only pour `support` | `UserEditModal` |
| P3 | Messages d'erreur explicites (« réservé aux administrateurs ») plutôt que toasts génériques | composants admin |

> Voir `AUDIT_SECURITY.md` pour la manipulation de gamification (intégrité) et `AUDIT_BACKEND.md` pour les checks de rôle des Functions.
