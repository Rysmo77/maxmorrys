# AUDIT QA & TESTS — maxmorrys.me

## 1. État actuel — critique

**Aucun test automatisé dans le dépôt.** Recherche `*.test.*` / `*.spec.* `/ `__tests__` : **0 résultat**.

| Type de test | Présent ? |
|---|---|
| Unitaire (front) | ❌ |
| Unitaire (Cloud Functions) | ❌ |
| Intégration | ❌ |
| E2E (Playwright/Cypress) | ❌ |
| Composant | ❌ |
| Règles Firestore | ❌ (mais `@firebase/rules-unit-testing` **installé**, inutilisé) |
| Permissions / rôles | ❌ |
| Accessibilité | ❌ |
| Non-régression | ❌ |

**Vérifications statiques disponibles** (à défaut de tests) :
- `npm run typecheck` → **passe** (0 erreur) — bon signal de cohérence de types.
- `npm run lint` → **1 erreur** (`certificates.ts:22` var inutilisée) + 16 warnings.
- CI : `typecheck` en `continue-on-error: true` → **non bloquant** (laisse passer de futures régressions).

**Score QA : 25/100.** Une plateforme manipulant paiements, rôles et données personnelles sans aucun filet de régression automatisé présente un risque élevé à chaque évolution.

## 2. Matrice de couverture fonctionnelle (cible)

| Domaine | Criticité | Couverture actuelle | Cible |
|---|---|---|---|
| Authentification (login/register/reset/Google) | Haute | 0 % | E2E + unit |
| Autorisation / rôles (student/support/admin) | Haute | 0 % | Rules tests + E2E |
| Paiement (charge, webhook, idempotence, coupon) | **Critique** | 0 % | Unit Functions + intégration |
| Certificat (re-dérivation serveur) | Haute | 0 % | Unit Functions |
| Enrôlement / progression | Haute | 0 % | Unit + E2E |
| Gamification (XP/badges) | Moyenne | 0 % | Rules tests (intégrité) |
| Club (sub gate, feed, DM) | Moyenne | 0 % | Rules + E2E |
| RGPD (export/suppression) | Haute | 0 % | Unit Functions |
| Règles Firestore/Storage | **Critique** | 0 % | Rules unit tests |
| Formulaires (validation) | Moyenne | 0 % | Component tests |

## 3. Plan de tests recommandé

### 3.1 Tests de règles Firestore (priorité absolue — outil déjà installé)
Avec `@firebase/rules-unit-testing` + émulateur :
- `users` : un user ne peut pas changer son `role` ; ne peut pas écrire le doc d'un autre.
- **`gamification`** : un user ne peut **pas** écrire des `xp`/`badges` arbitraires (test qui **échouera aujourd'hui** → guide le correctif S2).
- `enrollments` : `affectedKeys` limité ; `progress ∈ [0,100]` ; pas d'écriture croisée.
- `transactions` : création client seulement gratuite (`amount=0`) ; paid via serveur.
- `club_*` : accès conditionné à l'abonnement actif.
- `certificates` : non créables côté client.
- Storage : contenu de leçon *enrollment-gated*.

### 3.2 Tests unitaires Cloud Functions (paiement en priorité)
- `bictorysWebhook` : signature invalide → rejet ; idempotence (`webhook_events`) ; **mismatch de montant → comportement attendu** (après correctif B1/S5) ; effets de bord avant finalisation.
- `createBictorysCharge` : prix calculé serveur ; coupon expiré/épuisé refusé ; double-enrôlement.
- `issueCertificate` : refus si leçons incomplètes (re-dérivation) ; idempotence.
- `adminCreateUser` : rejette non-admin ; ne crée jamais d'`admin` ; whitelist de rôle (après B4).
- `gdpr` : export complet ; suppression en cascade (vérifier inclusion `rysmoConversations` après B6).

### 3.3 Tests E2E (Playwright recommandé)
Parcours par rôle :
- **Visiteur** : navigation, blog, formation, contact (persistance message).
- **Student** : register → achat (gratuit) → cours → progression → certificat ; Club (si sub) ; RGPD export.
- **Support** : voit Messages/Témoignages/RDV ; **n'a pas** d'actions admin trompeuses (après correctif ROLES).
- **Admin** : CRUD article/formation/coupon ; création utilisateur ; import média.

### 3.4 Tests composant / unitaires front
- `markdownToHtml` : neutralise `<script>`, `onerror`, `javascript:` (non-régression XSS).
- `Button`/`Modal`/`Sheet` : états + focus trap.
- Validation de formulaires (Contact/Newsletter/UserEdit).
- Hooks : `usePagination`, `useConfirmDialog`, `useClubData` (rollback après correctif F1).

### 3.5 Tests d'accessibilité
- Intégrer `axe-core`/`@axe-core/playwright` dans les E2E sur écrans clés.

## 4. Scénarios critiques sans test (à couvrir en premier)

1. Webhook paiement rejoué (idempotence) — **critique**.
2. Un étudiant ne peut pas obtenir un certificat sans avoir tout complété.
3. Un `support` ne peut pas exécuter d'action `admin`.
4. Un utilisateur ne peut pas gonfler son XP / s'auto-attribuer un badge.
5. Suppression de compte = effacement complet (RGPD).
6. Contenu payant inaccessible sans enrôlement (Storage).

## 5. Priorités QA

| Priorité | Action | Effort |
|---|---|---|
| P0 | Rendre `typecheck` **bloquant** en CI + corriger l'erreur ESLint | Faible |
| P0 | Tests de règles Firestore (gamification, enrollments, transactions, users) | Moyen |
| P1 | Tests unitaires Functions paiement + certificat + gdpr | Moyen |
| P1 | E2E parcours student (achat→cours→certificat) | Moyen |
| P2 | E2E par rôle (support/admin) + a11y axe | Moyen |
| P2 | Tests composant (markdownToHtml, formulaires, hooks) | Faible-Moyen |
| P3 | Couverture cible 60 %+ sur `lib/` et Functions ; budget bundle en CI | Continu |

## 6. Outillage suggéré
- **Vitest** (unit/front, cohérent avec Vite) + **@testing-library/react**.
- **@firebase/rules-unit-testing** (déjà présent) + émulateurs (déjà configurés dans `firebase.json`).
- **Playwright** (E2E + a11y) contre l'émulateur.
- Brancher ces suites dans `.github/workflows/ci.yml` **en bloquant**.
