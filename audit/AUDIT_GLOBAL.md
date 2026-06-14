# AUDIT GLOBAL — maxmorrys.me

> Audit technique, fonctionnel, UI/UX, sécurité, performance, accessibilité et architecture.
> Date : 2026-06-14 · Méthode : analyse statique exhaustive du code + build/lint/typecheck/audit locaux.
> Périmètre : `/Users/macbookair/maxmorrys.me-main` (frontend `src/`, backend `functions/src/`, règles, config).

---

## 1. Résumé exécutif

**maxmorrys.me** est une plateforme EdTech / LMS francophone mature et soignée : formations payantes, blog, podcasts, vidéos, espace étudiant gamifié, communauté « Club des Digitos », tuteur IA « Rysmo » (Gemini), paiements (Bictorys), conformité RGPD. La base de code est **de bonne qualité globale** : TypeScript strict, architecture modulaire, règles Firestore et Storage robustes (RBAC, validation de champs, anti-IDOR), en-têtes HTTP de sécurité forts, et une couche Cloud Functions bien pensée (vérification HMAC des webhooks, idempotence, autorité serveur sur les certificats et les prix).

L'audit ne révèle **aucune faille critique exploitable à distance** sur la logique métier serveur. Les principaux axes d'amélioration sont : (1) la **sécurité de la couche dépendances** (vulnérabilités `react-router` HIGH, `protobufjs` critique), (2) quelques **incohérences de logique applicative** (écritures de gamification côté client non validées, montants webhook non rejetés, *optimistic updates* sans rollback), (3) l'**absence totale de tests automatisés**, (4) des **lacunes d'accessibilité** et (5) des **bundles JavaScript volumineux** (Firebase 538 kB, ClubPage 272 kB).

La plateforme est **utilisable en production** mais mérite une campagne de durcissement ciblée avant de monter en charge. La majorité des correctifs sont des *quick wins* à faible effort.

### Verdict
- **État** : Bon — prêt production avec corrections recommandées.
- **Risque global** : 🟡 Moyen-faible (aucun risque critique métier ; risques deps + intégrité gamification + dette QA).

---

## 2. Scores par domaine

| Domaine | Score /100 | Niveau |
|---|---|---|
| **Architecture** | 80 | Bon |
| **Front-end** | 74 | Moyen-bon |
| **Back-end** | 80 | Bon |
| **UI/UX** | 78 | Bon |
| **Responsive** | 77 | Bon |
| **Accessibilité** | 62 | Moyen |
| **Sécurité** | 76 | Bon |
| **Performance** | 70 | Moyen |
| **QA / Tests** | 25 | Critique |
| **Maintenabilité** | 73 | Moyen-bon |
| **Cohérence produit** | 76 | Bon |
| **SCORE GLOBAL (pondéré)** | **73** | **Moyen-bon** |

### Justification des notes

**Architecture — 80.** Séparation claire public/auth/LMS/admin ; couche d'accès données centralisée (`src/lib/firestore/*`, 15 modules) ; 42 Cloud Functions organisées par domaine ; lazy-loading systématique avec auto-reload sur chunk obsolète ; code-splitting Vite. Faiblesses : pas de couche de cache/synchronisation (Firestore SDK brut, ni React Query ni store global → re-fetch impératifs, pas d'invalidation), quelques fichiers très longs, logique de gamification dupliquée client/serveur. Architecture saine et évolutive mais qui montrera ses limites en data-flow à l'échelle.

**Front-end — 74.** TypeScript strict (1 seul `any` dans tout `src/`), états loading/empty/error présents sur la plupart des pages data, sanitisation XSS correcte (DOMPurify). Faiblesses : *optimistic updates* sans rollback (Club), incohérences de design-system (boutons natifs vs `<Button>`, couleurs en dur), validation front parfois absente (Contact/Newsletter), texte *placeholder* en production, risques de double-submit.

**Back-end — 80.** Excellent : webhook Bictorys vérifié par HMAC *timing-safe* + journal d'idempotence (`webhook_events`), prix et certificats re-dérivés côté serveur, quotas Rysmo transactionnels, secrets via params Firebase. Faiblesses : montant webhook non rejeté en cas de divergence (warning seulement), incrément coupon non atomique avec la finalisation, requêtes planifiées non bornées (`streakReminder`, `media-stats` scannent des collections entières), pas de rate-limiting sur les fonctions admin.

**UI/UX — 78.** Design tokens cohérents (11 palettes, typographie *clamp* fluide), bibliothèque de composants complète (18 primitives), micro-interactions (Framer Motion), feedback toast généralisé. Faiblesses : friction sur certains parcours, *placeholder* « programme détaillé bientôt disponible » en prod, feedback de copie discret, CTA hiérarchisés inégalement.

**Responsive — 77.** Typographie fluide, *bottom sheets* mobiles, sidebars sticky desktop, grilles adaptatives. Non vérifié en runtime (audit statique) ; quelques largeurs/tableaux admin à surveiller. Note prudente faute de tests sur appareils réels.

**Accessibilité — 62.** 109 usages `aria-*`, 77 `alt=` pour 70 `<img>` (bonne couverture images). Lacunes récurrentes : tables admin sans `scope="col"`/`role`, boutons icône sans `aria-label`, labels non systématiquement liés (`htmlFor`/`id`), états d'accordéon sans `aria-expanded`, *focus trap* des modales non confirmé, états signalés par la couleur seule. Plusieurs blocages WCAG 2.1 AA.

**Sécurité — 76.** Règles Firestore/Storage exemplaires, en-têtes forts (HSTS, X-Frame-Options, CSP), secrets bien gérés, RGPD implémenté (export + suppression en cascade). Pénalités : **22 vulnérabilités npm root (1 critique, 11 hautes) dont `react-router` HIGH (RCE/XSS/open-redirect)** et `protobufjs` critique ; **gamification écrivable côté client sans validation de valeur** ; CSP `'unsafe-inline'` ; mémoire IA opt-out par défaut.

**Performance — 70.** Bon code-splitting + optimisation d'images au build (−40 %). Pénalités : chunk `firebase` 538 kB (126 kB gzip), `ClubPage` 272 kB (65 kB gzip), `router` 234 kB ; pas de cache data → lectures Firestore répétées ; requêtes planifiées non paginées.

**QA / Tests — 25.** **Zéro test** (aucun Vitest/Jest/Playwright/Cypress) ; `@firebase/rules-unit-testing` installé mais inutilisé ; `typecheck` non bloquant en CI. Le score reflète l'absence totale de filet de sécurité automatisé sur une app qui manipule paiements, rôles et données personnelles.

**Maintenabilité — 73.** TS strict, 0 TODO/FIXME dans `src/`, README et docs riches. Pénalités : fichiers > 600 lignes (`About.tsx` 1218, `payment.ts` 748, `rysmo.ts` 740), 44 `console.*` dans les Functions, 16 warnings ESLint + 1 erreur, absence de tests.

**Cohérence produit — 76.** Fonctionnalités majoritairement réelles et persistées (paiement, enrôlement, certificat, DM, témoignages). Pénalités : actions Club qui « semblent réussir » sans persister en cas d'erreur, boutons admin visibles pour `support` mais inopérants, *placeholder* trompeur.

---

## 3. Top 10 risques

| # | Risque | Gravité | Réf. rapport |
|---|---|---|---|
| R1 | Dépendances vulnérables : `react-router` 7.13 (HIGH : RCE/XSS/open-redirect), `protobufjs` (critique), 22 vulns root / 19 functions | Haute | SECURITY §S1 |
| R2 | Gamification (XP/level/badges) écrivable directement côté client sans validation de valeur → manipulation du classement et auto-attribution de badges (qui déclenchent des récompenses de parrainage) | Haute | SECURITY §S2, DATA_FLOW |
| R3 | Aucun test automatisé sur des flux sensibles (paiement, rôles, RGPD) → régressions invisibles | Haute | QA_TESTS |
| R4 | Webhook paiement : divergence de montant seulement *loggée*, jamais rejetée (defense-in-depth manquante) | Moyenne | BACKEND §B1, SECURITY §S5 |
| R5 | *Optimistic updates* sans rollback (likes/reposts/sondages/suppression de commentaires Club) → UI et base divergent silencieusement | Moyenne | FRONTEND, DATA_FLOW |
| R6 | Incohérence rôle `support` : accède aux pages `/admin/*` (AdminRoute) mais nombre de fonctions/écritures réservées à `admin` → fausses affordances + erreurs confuses | Moyenne | ROLES_PERMISSIONS |
| R7 | Requêtes planifiées non bornées (`streakReminder` scanne tout `gamification`, `media-stats` toutes les collections) → coût/temps qui explosent à l'échelle | Moyenne | BACKEND §B2 |
| R8 | Mémoire conversationnelle Rysmo activée par défaut (opt-out) → conformité RGPD discutable pour un traitement non strictement nécessaire | Moyenne | SECURITY §S6 |
| R9 | CSP avec `'unsafe-inline'` (script/style) → surface XSS résiduelle malgré DOMPurify | Moyenne | SECURITY §S4 |
| R10 | Émission de certificat : second `updateDoc` peut échouer silencieusement après succès du callable → incohérence « certificat émis » | Faible-Moy. | DATA_FLOW, FRONTEND |

## 4. Top 10 quick wins (fort impact / faible effort)

| # | Action | Effort | Impact |
|---|---|---|---|
| Q1 | `npm audit fix` (root + functions) + bump `react-router-dom` → version corrigée ; retester build | Faible | Élevé |
| Q2 | Corriger l'erreur ESLint `certificates.ts:22` (var inutilisée) et rendre `typecheck` **bloquant** en CI | Faible | Moyen |
| Q3 | Durcir la règle Firestore `gamification` : interdire l'écriture client de `xp/level/badges` (ou borner les deltas) ; déplacer l'attribution vers une Cloud Function | Faible-Moy. | Élevé |
| Q4 | Webhook : **rejeter** (HTTP 400) en cas de mismatch de montant au lieu de logger | Faible | Moyen |
| Q5 | Ajouter `limit()`/pagination sur `streakReminder` et `media-stats` (filtrer `currentStreak > 0`, paginer par 100) | Faible | Moyen |
| Q6 | Gating client du `<select>` de rôle : n'afficher l'option « Admin » qu'aux `admin` ; masquer les actions admin-only aux `support` | Faible | Moyen |
| Q7 | Rollback des *optimistic updates* Club (restaurer l'état + toast d'erreur sur `.catch`) | Faible-Moy. | Moyen |
| Q8 | Retirer le texte *placeholder* « programme détaillé bientôt disponible » (`FormationDetail.tsx:316`) ou le piloter par la donnée | Faible | Moyen (crédibilité) |
| Q9 | Désactiver les boutons de soumission pendant l'envoi (Contact/booking, Checkout) pour éviter le double-submit | Faible | Moyen |
| Q10 | Accessibilité : ajouter `aria-label` aux boutons icône et `scope="col"` aux tables admin | Faible | Moyen |

## 5. Top 10 chantiers prioritaires (moyen terme)

1. **Mettre en place une suite de tests** : règles Firestore (`@firebase/rules-unit-testing` déjà présent), tests unitaires des Cloud Functions de paiement, e2e des parcours critiques (auth, achat, certificat).
2. **Refondre la sécurité de la gamification** côté serveur (XP/badges/streak en Cloud Functions uniquement).
3. **Introduire une couche de cache/synchronisation data** (React Query ou équivalent) avec invalidation après mutation.
4. **Réduire le poids des bundles** : code-splitter `ClubPage`, charger Firebase par sous-modules, isoler `framer-motion`.
5. **Harmoniser le modèle de permissions** `admin`/`support` (UI + Functions + rules cohérentes).
6. **Programme d'accessibilité WCAG 2.1 AA** (audit lecteur d'écran, focus traps, labels, contrastes).
7. **Durcir la CSP** (suppression de `'unsafe-inline'` via nonces/hash).
8. **Fiabiliser les flux à effet de bord** (certificat, tracking d'achat, suppression de compte) avec gestion d'erreur et idempotence côté client.
9. **Réduire les `console.*`** des Functions et passer à un logging structuré.
10. **Découper les fichiers > 600 lignes** en sous-composants/services testables.

---

## 6. Limites de l'analyse

- Audit **statique** : lecture du code, configuration, et exécution locale de `lint`/`typecheck`/`build`/`npm audit`. **Aucun test runtime navigateur, aucun test sur appareils réels, aucun accès à la production ni aux données réelles.**
- Les notes **Responsive** et **Accessibilité** sont des estimations basées sur le code (classes Tailwind, attributs ARIA) et non sur un passage Lighthouse/axe/lecteur d'écran réel.
- **Aucune action offensive** n'a été menée (pas d'exploitation, pas de test d'intrusion). Les risques sécurité sont déduits du code et des règles.
- Les **Core Web Vitals** sont *estimés* à partir des tailles de bundles et de l'architecture, non mesurés.
- Certaines pages très longues (`About.tsx`, `AdminClubDigitos.tsx`) ont été lues en partie ; les constats associés sont signalés comme tels.
- Le sous-dossier `maxmorrys.me/` (copie ancienne) a été **exclu** du périmètre.

## 7. Index des rapports

| Fichier | Contenu |
|---|---|
| `AUDIT_GLOBAL.md` | Ce document — synthèse, scores, top risques/quick-wins/chantiers |
| `AUDIT_ARCHITECTURE.md` | Cartographie, modules, forces/faiblesses, refactorings |
| `AUDIT_FRONTEND.md` | Pages, composants, boutons/actions, liens, UI/responsive/a11y |
| `AUDIT_BACKEND.md` | Cloud Functions, validation, permissions, perf serveur |
| `AUDIT_ROLES_PERMISSIONS.md` | Matrices rôles×routes/fonctions/permissions, incohérences |
| `AUDIT_DATA_FLOW.md` | Flux front→back→DB, fetching, mutations, persistance |
| `AUDIT_UI_UX.md` | Analyse écran par écran, notes UX/UI, quick wins |
| `AUDIT_SECURITY.md` | Registre des risques sécurité (OWASP-like) |
| `AUDIT_PERFORMANCE.md` | Build, bundles, requêtes, Core Web Vitals estimés |
| `AUDIT_ACCESSIBILITY.md` | Problèmes WCAG, impact, criticité |
| `AUDIT_QA_TESTS.md` | État des tests, couverture, plans de test |
| `ROADMAP_CORRECTION.md` | Plan 30/60/90 jours, priorité/effort/impact |
