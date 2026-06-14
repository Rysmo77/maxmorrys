# AUDIT BACK-END — Cloud Functions

> Périmètre : `functions/src/*` (42 fonctions). Constats vérifiés par lecture du code.

## 1. Synthèse

Le backend est **bien conçu** : authentification systématique des callables, autorité serveur sur les opérations sensibles (prix, certificats, quotas), webhook de paiement vérifié par **HMAC-SHA256 *timing-safe*** avec **journal d'idempotence** (`webhook_events/{chargeId}`), effets de bord appliqués **avant** la finalisation de transaction pour permettre une reprise sur crash, et secrets gérés via params Firebase (non hardcodés). Les axes d'amélioration concernent surtout la **robustesse à l'échelle** (requêtes planifiées non bornées), la **defense-in-depth paiement** (montant non rejeté) et quelques **détails d'autorisation/validation**.

## 2. Matrice des endpoints (synthèse)

| Fonction | Type | Auth | Rôle | Validation | Rate-limit | Idempotence | Problème |
|---|---|---|---|---|---|---|---|
| `rysmo` | callable | ✅ | — | ✅ (≤2000c) | ✅ quota tx | n/a | mémoire opt-out par défaut |
| `getRysmoQuota` | callable | ✅ | — | ✅ | ✅ | n/a | RAS |
| `clearRysmoMemory` | callable | ✅ | — | ✅ | n/a | n/a | RAS |
| `createBictorysCharge` | callable | ✅ | — | ✅ (prix serveur) | ❌ | check enrôlement | check enrôlement non atomique |
| `createClubCharge` | callable | ✅ | — | ✅ | ❌ | check sub | RAS |
| `createRysmoPackCharge` | callable | ✅ | — | ✅ | ❌ | — | RAS |
| `createRysmoSubscriptionCharge` | callable | ✅ | — | ✅ | ❌ | check sub | RAS |
| `bictorysWebhook` | HTTP | HMAC | — | signature+chargeId | — | ✅ `webhook_events` | **montant non rejeté** (B1) |
| `adminCreateUser` | callable | ✅ | admin | ✅ email/pwd≥8 | ❌ | — | rôle libre non whitelisté (B4) |
| `adminManageRysmoQuota` | callable | ✅ | admin | ✅ [1,10000] | ❌ | — | RAS |
| `adminManageEnrollment` | callable | ✅ | admin | ✅ | ❌ | — | RAS |
| `spotifyProxy` | callable | ✅ | admin | ✅ | ❌ | — | inaccessible aux support (UX) |
| `youtubeProxy` | callable | ✅ | admin | ✅ | ❌ | — | inaccessible aux support (UX) |
| `exportUserData` | callable | ✅ | — | — | ❌ | — | export PII complet, pas de rate-limit (B5) |
| `deleteUserAccount` | callable | ✅ | — | ✅ « SUPPRIMER » | — | idempotent | n'efface pas rysmoConversations/profiles (B6) |
| `issueCertificate` | callable | ✅ | propriétaire | ✅ re-dérive complétion | — | ✅ | **exemplaire** |
| `onEnrollmentCreated` | trigger | — | — | minimale | — | — | RAS |
| `onCertificateCreated` | trigger | — | — | minimale | — | — | RAS |
| `rysmoCoachNudge` | trigger | — | — | try/catch | — | — | RAS |
| `streakReminder` | scheduled | — | — | — | — | — | **scan collection non borné** (B2) |
| `courseReminder` | scheduled | — | — | limit(500) | — | — | borné mais perfectible |
| `cleanupTempStorage` | scheduled | — | — | — | — | — | RAS |
| `backupFirestore` | scheduled | — | — | — | — | — | RAS |
| `onBlog/Formation/Video/PodcastDeleted` | trigger | — | — | — | — | gère 404 | RAS |
| `importSpotifyEpisodes(+Manual)` | sched/callable | ✅ (callable) | admin | ✅ | ❌ | slug | RAS |
| `syncMediaStats` / `media-stats` | sched/callable | ✅ (callable) | admin | — | — | — | **scan collections non borné** (B2) |
| `prerender`/`sitemap`/`rss`/`catalog` | HTTP | — (public, voulu) | — | path normalisé | — | — | OK (SEO) |
| `rebuildLeaderboard(Scheduled/Manual)` | sched/callable | ✅ (callable) | admin | — | — | — | lit top-20 (OK) |
| `onReferralConversion` | trigger | — | — | flag `referralRewarded` | — | ✅ | RAS |
| `parseCv` | callable | ✅ | membre Club | ✅ PDF≤8Mo | ✅ 5/j | — | RAS |
| `weeklyClubDigest(+Manual)` | sched/callable | ✅ (callable) | admin | — | — | — | erreurs JSON silencieuses |

## 3. Problèmes détaillés

### [B1] Webhook : divergence de montant loggée, jamais rejetée
- **Gravité** : Moyenne · **Priorité** : P1 · **Fichier** : `functions/src/payment.ts:625-628`
- **Description** : `webhookAmount !== txnData.amount` ne produit qu'un `console.warn`, puis le traitement continue (activation sub / crédit / enrôlement).
- **Nuance importante** : le montant de la charge est **fixé côté serveur** au checkout (`createBictorysCharge`) et la **signature HMAC** authentifie le payload. Le risque de « payer moins » est donc **faible** (le client ne contrôle pas le montant). Il s'agit d'un **manque de defense-in-depth**, pas d'une faille exploitable directe.
- **Reco** : en cas de mismatch sur un champ montant *connu*, répondre `400` et ne pas appliquer l'effet de bord (laisser le txn `pending` pour investigation). Quick win.

### [B2] Requêtes planifiées non bornées
- **Gravité** : Moyenne · **Priorité** : P1 · **Fichiers** : `notifications.ts` (`streakReminder` — `db.collection('gamification').get()` sans `limit`), `media-stats.ts` (`videos`/`podcasts` `.get()` complets)
- **Description** : ces jobs lisent des collections entières à chaque exécution (quotidienne / 30 min). À 10 000+ documents : coût de lecture, latence, risque de timeout.
- **Reco** : filtrer (`where('currentStreak','>',0)`) + paginer par 100 avec `startAfter` ; pour `media-stats`, paginer et borner.

### [B3] Incrément coupon non atomique avec la finalisation
- **Gravité** : Faible-Moyenne · **Priorité** : P2 · **Fichier** : `functions/src/payment.ts:684-694`
- **Description** : `coupons/{id}.usedCount += 1` (688) est un `update` distinct **avant** le passage du txn à `completed` (691). Un crash entre les deux laisse le txn `pending` → la reprise webhook ré-incrémente le coupon (sur-comptage possible).
- **Nuance** : le ré-traitement global est protégé par la requête `status == 'pending'` (605) ; le sur-comptage n'arrive que sur la fenêtre étroite entre 688 et 694.
- **Reco** : englober incrément coupon + passage `completed` dans une même `runTransaction`.

### [B4] adminCreateUser : rôle non whitelisté
- **Gravité** : Faible · **Priorité** : P2 · **Fichier** : `functions/src/admin.ts:49`
- **Description** : `role: (role === 'admin' ? 'student' : (role as 'student'|'support')) || 'student'`. Empêche bien de créer un `admin`, mais une valeur arbitraire (ex. `'hacker'`) **passe telle quelle** (truthy). Caller déjà `admin`, donc pas une escalade — robustesse seulement.
- **Reco** : `const VALID = ['student','support']; role = VALID.includes(role) ? role : 'student';`

### [B5] exportUserData : PII complet, pas de rate-limit ni d'audit
- **Gravité** : Faible-Moyenne · **Priorité** : P2 · **Fichier** : `functions/src/gdpr.ts:40-78`
- **Description** : export RGPD de **toutes** les données (transactions, messages, etc.) — légitime pour le RGPD — mais sans rate-limiting (abus possible) ni journal d'accès. URL signée 24 h.
- **Reco** : limiter (ex. 1 export / 7 j) + journaliser l'accès dans `activity_logs`.

### [B6] deleteUserAccount n'efface pas toute la mémoire IA
- **Gravité** : Faible · **Priorité** : P2 · **Fichier** : `functions/src/gdpr.ts` (cascade)
- **Description** : la cascade supprime de nombreuses collections mais **pas** `rysmoConversations/{uid}` ni `rysmoProfiles/{uid}` (ni `_ratelimits`) d'après la revue → résidu de données personnelles après « suppression ».
- **Reco** : ajouter ces documents à la cascade (cohérence RGPD).

### [B7] Quota Rysmo réservé avant l'appel Gemini
- **Gravité** : Faible · **Priorité** : P3 · **Fichier** : `functions/src/rysmo.ts` (réservation puis appel API)
- **Description** : si l'appel Gemini échoue après réservation du quota, le créneau est consommé sans réponse → un utilisateur peut « brûler » son quota sur des échecs.
- **Reco** : créditer le quota en cas d'échec de l'appel (rollback), ou réserver après succès.

### [B8] Messages d'erreur potentiellement trop détaillés
- **Gravité** : Faible · **Priorité** : P3 · **Fichiers** : `proxy.ts`, `payment.ts` (remontée d'erreurs d'API externes)
- **Reco** : message générique au client, détail loggé serveur uniquement.

## 4. Modèles de données (collections principales)

`users` (+ sous-coll. `notes`/`engagement`/`notifications`), `formations`, `blog`, `podcasts`, `videos`, `faq`, `enrollments` (`{uid}_{fid}`, + `progress`), `certificates`, `transactions`, `coupons`, `club_subscriptions`, `club_posts`(+`comments`), `club_profiles/events/sessions/infos/challenges/opportunities`, `conversations`(+`messages`), `dm_reports`, `gamification`, `leaderboard/global`, `rysmoProfiles`, `rysmoConversations`, `rysmoSubscriptions`, `rysmoPackPurchases`, `_ratelimits`, `webhook_events`, `activity_logs`, `analytics`, `data_exports`, `referrals`, `newsletter`, `appointments`, `settings/site`.

## 5. Forces backend à préserver
- Webhook HMAC *timing-safe* + idempotence (`payment.ts`, `webhook_events`).
- Effets de bord **avant** finalisation txn → reprise sur crash (commentaires explicites dans le code).
- `issueCertificate` re-dérive la complétion serveur (ne fait pas confiance au `progress` client) — **modèle à généraliser**.
- Quotas Rysmo/CV via `runTransaction` + `_ratelimits`.
- Crédit pack Rysmo atomique (`runTransaction`, idempotent).

## 6. Top 10 issues backend
1. B2 — Jobs planifiés non bornés (scalabilité/coût).
2. B1 — Montant webhook non rejeté (defense-in-depth).
3. B3 — Incrément coupon non atomique.
4. B5 — Export RGPD sans rate-limit ni audit.
5. B6 — Cascade de suppression incomplète (mémoire IA).
6. B4 — Rôle non whitelisté dans adminCreateUser.
7. B7 — Quota Rysmo consommé sur échec.
8. Pas de rate-limit sur fonctions admin (proxy/import) — abus si compte admin compromis.
9. B8 — Fuite de détails d'erreur d'API externes.
10. 44 `console.*` (dont logs de payload potentiellement sensibles) → logging structuré + masquage PII.
