# ROADMAP DE CORRECTION — maxmorrys.me

> Plan d'action priorisé sur 30 / 60 / 90 jours. Effort : Faible (≤ ½ j) · Moyen (½–2 j) · Élevé (> 2 j). Impact : ⭐ à ⭐⭐⭐.

## Légende des références
Les IDs renvoient aux rapports : `S*` (Security), `B*` (Backend), `F*` (Frontend), `D*` (Data-flow), `P*` (Roles), `PE*` (Performance), `A*` (Accessibility).

---

## Sprint 0 — Quick wins (Semaine 1) — « stop the bleeding »

| # | Action | Réf | Effort | Impact |
|---|---|---|---|---|
| 1 | `npm audit fix` (root + functions) + bump `react-router-dom` → version patchée ; **retester build + routing** | S1 | Faible | ⭐⭐⭐ |
| 2 | Corriger l'erreur ESLint `certificates.ts:22` ; rendre `typecheck` **bloquant** en CI (retirer `continue-on-error`) | QA | Faible | ⭐⭐ |
| 3 | Webhook : **rejeter** (400) sur mismatch de montant | B1/S5 | Faible | ⭐⭐ |
| 4 | Durcir la règle Firestore `gamification` (interdire écriture client de `xp/level/badges`) | S2 | Faible | ⭐⭐⭐ |
| 5 | Borner `streakReminder` et `media-stats` (`where` + `limit`/pagination) | B2/PE4 | Faible | ⭐⭐ |
| 6 | Retirer le placeholder « programme détaillé bientôt disponible » | F2 | Faible | ⭐⭐ |
| 7 | Désactiver les boutons en cours d'envoi (Contact, Checkout) | F3 | Faible | ⭐⭐ |
| 8 | Gating client : option « Admin » réservée aux admin ; masquer/désactiver actions admin-only pour support | P3/P4 | Faible | ⭐⭐ |

## 30 jours — Corrections critiques & cohérence

| # | Action | Réf | Effort | Impact |
|---|---|---|---|---|
| 9 | Rollback + toast sur les actions Club optimistes (likes/votes/reposts/suppression) | F1/D1 | Moyen | ⭐⭐ |
| 10 | Dédupliquer le tracking d'achat (`PaymentReturn`) | D2 | Faible | ⭐⭐ |
| 11 | Harmoniser permissions support : décider, **par action**, autoriser serveur (`isAdminOrSupport`) **ou** masquer côté UI ; gater les routes admin par capacité | P1/P2 | Moyen | ⭐⭐ |
| 12 | **Tests de règles Firestore** (gamification, enrollments, transactions, users, club) via `@firebase/rules-unit-testing` | QA | Moyen | ⭐⭐⭐ |
| 13 | Coupon : incrément + finalisation dans une même transaction | B3 | Faible | ⭐ |
| 14 | Compléter la cascade de suppression RGPD (`rysmoConversations`/`rysmoProfiles`) ; rate-limit + audit export | B6/S6/S7 | Moyen | ⭐⭐ |
| 15 | A11y bloquants : `aria-label` boutons icône + focus trap modales + `scope` tables | A5/A6/A14 | Moyen | ⭐⭐ |
| 16 | Splitter `ClubPage` par onglet (lazy) | PE1 | Moyen | ⭐⭐ |

## 60 jours — Robustesse & qualité

| # | Action | Réf | Effort | Impact |
|---|---|---|---|---|
| 17 | **Migrer la gamification côté serveur** (XP/badges/streak en Cloud Functions) ; verrouiller la règle en écriture | S2/A2(arch) | Élevé | ⭐⭐⭐ |
| 18 | Introduire **React Query** (cache + invalidation post-mutation) ; généraliser les listeners temps réel (Club feed, progression) | D3/D5/PE3 | Élevé | ⭐⭐⭐ |
| 19 | **Tests unitaires Cloud Functions** paiement + certificat + gdpr | QA | Moyen | ⭐⭐⭐ |
| 20 | **E2E Playwright** parcours student (achat→cours→certificat) + a11y axe | QA | Moyen | ⭐⭐ |
| 21 | Consentement IA explicite (opt-in / écran dédié) | S4 | Moyen | ⭐⭐ |
| 22 | Durcir la CSP (nonces/hash, retrait `unsafe-inline`) | S3 | Moyen | ⭐⭐ |
| 23 | Vérifier/forcer les imports Firebase modulaires ; différer functions/storage | PE2 | Moyen | ⭐⭐ |
| 24 | A11y majeurs : labels liés, erreurs `aria-describedby`, accordéons, étoiles clavier | A8/A11/A12/A7 | Moyen | ⭐⭐ |

## 90 jours — Dette technique & maintenabilité

| # | Action | Réf | Effort | Impact |
|---|---|---|---|---|
| 25 | Découper les fichiers > 600 lignes (`About`, `Home`, `payment.ts`, `rysmo.ts`, `AdminFormations`, `RysmoWidget`) | Arch A3 | Élevé | ⭐⭐ |
| 26 | Composants standard : `IconButton`, `DataTable` accessible/responsive, `ErrorState`/`EmptyState`, `Form`/`Field` | UI/UX | Moyen | ⭐⭐ |
| 27 | Validation runtime (Zod) aux frontières de données critiques (user, transaction, enrollment) | Arch A5 | Moyen | ⭐⭐ |
| 28 | E2E par rôle (support/admin) ; cible couverture 60 %+ sur `lib/` et Functions ; budgets bundle en CI | QA/PE | Moyen | ⭐⭐ |
| 29 | Logging structuré côté Functions (remplacer `console.*`, masquer PII) | B10 | Faible-Moy. | ⭐ |
| 30 | Mesurer les Core Web Vitals en prod (`web-vitals`/Lighthouse) et fixer des budgets ; virtualiser les longues listes | PE | Moyen | ⭐⭐ |
| 31 | Quota Rysmo : rollback en cas d'échec de l'appel Gemini | B7 | Faible | ⭐ |
| 32 | Uniformiser tous les boutons sur `<Button>` ; supprimer les couleurs en dur | F6 | Moyen | ⭐ |

---

## Vue d'ensemble effort / impact

```
Impact ⭐⭐⭐ │  #1 #4 #12 #17 #18 #19
Impact ⭐⭐  │  #2 #3 #5 #6 #7 #8 #9 #10 #11 #14 #15 #16 #20 #21 #22 #23 #24 #25 #26 #27 #28 #30
Impact ⭐   │  #13 #29 #31 #32
            └────────────────────────────────────────────────
              Faible          Moyen              Élevé
```

## Ordre d'exécution recommandé

1. **Sprint 0** (sécurité deps + intégrité gamification + webhook + CI bloquant) — risque maximal réduit en 1 semaine.
2. **30 j** : cohérence des rôles + tests de règles + a11y bloquants + persistance Club.
3. **60 j** : gamification serveur + React Query + tests Functions/E2E + CSP/consentement.
4. **90 j** : dette technique, standardisation UI, validation runtime, perfs mesurées.

## Indicateurs de réussite (DoD)
- `npm audit` root & functions : 0 vuln **haute/critique**.
- `typecheck` + `lint` **verts et bloquants** en CI.
- Tests de règles Firestore couvrant gamification/enrollments/transactions/users **au vert**.
- Aucun chunk de page > 150 kB gzip.
- Score axe sans violation **bloquante** sur les 6 écrans clés.
- Parcours d'achat couvert par un E2E vert.
