# AUDIT SÉCURITÉ — maxmorrys.me

> Approche inspirée OWASP. **Aucune action offensive** : analyse statique du code, des règles et de la configuration uniquement. Les secrets ne sont **pas** affichés.

## 1. Synthèse

Posture de sécurité **solide** au niveau applicatif/serveur : règles Firestore/Storage robustes (RBAC, validation de champs, anti-mass-assignment, anti-IDOR via IDs déterministes + *enrollment-gating*), webhook de paiement HMAC *timing-safe* + idempotence, autorité serveur sur les prix et certificats, secrets via params Firebase, en-têtes HTTP forts, RGPD implémenté. **Aucune faille critique métier exploitable à distance détectée.**

Les risques se concentrent sur : (1) la **chaîne de dépendances** (vulnérabilités connues), (2) l'**intégrité de la gamification** (écriture client non validée), (3) la **CSP** (`unsafe-inline`), (4) la **confidentialité par défaut** (mémoire IA opt-out).

## 2. Registre des risques

### [S1] Dépendances vulnérables — **HAUTE / P0**
- **Catégorie** : A06 Composants vulnérables
- **Constat** (`npm audit`, 2026-06-14) :
  - **root : 22 vulnérabilités (1 critique, 11 hautes, 9 modérées, 1 faible)**
    - `react-router` 7.0.0–7.14.2 **HIGH** : RCE via turbo-stream, open-redirect (`//`), XSS (RSC redirect, Location header), DoS. Le projet est en `react-router-dom@7.13.1` → **dans la plage vulnérable**.
    - `protobufjs` **critique/haute** (prototype pollution, DoS) — transitif Firebase.
    - `rollup` **HIGH** (path traversal, dev), `yaml` modéré.
  - **functions : 19 vulnérabilités (1 critique, 5 hautes, 12 modérées, 1 faible)** — transitifs `firebase-admin`/`gaxios`/`google-gax`/`uuid`/`retry-request`.
- **Scénario** : exploitation d'une faille `react-router` (open-redirect/XSS) sur l'app exposée ; prototype pollution `protobufjs`.
- **Reco** : `npm audit fix` (root + functions) ; bumper `react-router-dom` à une version corrigée (≥ 7.14.3 / dernière 7.x patchée) puis **retester le build et le routing** ; planifier des bumps réguliers. **Quick win prioritaire.**

### [S2] Gamification écrivable côté client sans validation — **MOYENNE-HAUTE / P1**
- **Catégorie** : A01 Broken Access Control / A04 Insecure Design (intégrité)
- **Fichiers** : `firestore.rules:309-318` (`allow create, update: if isOwner(userId)`), `src/lib/gamification.ts` (écritures `setDoc`/`runTransaction` client), appels `addXP/awardBadge/updateStreak` dans `DashboardTab.tsx`, `useClubData.ts`.
- **Constat** : la règle n'impose **aucune** contrainte sur les valeurs (`xp`, `level`, `badges`, `currentStreak`). Un utilisateur authentifié peut, via le SDK client, écrire `gamification/{sonUid}` avec `xp: 999999`, `level: 99`, ou s'auto-attribuer des badges.
- **Impact** : le `leaderboard/global` est reconstruit serveur à partir du **top-20 par XP** → manipulation du classement public. Les badges (`ambassadeur`, `contributeur`) sont liés à des récompenses de parrainage/engagement → contournement de la logique métier.
- **Scénario** : `setDoc(doc(db,'gamification',myUid),{xp:1e9,badges:['ambassadeur']})` depuis la console → 1ʳᵉ place + badge non mérité.
- **Reco** : verrouiller la règle en écriture (interdire la modification de `xp/level/badges` côté client, ou borner les deltas) **et** déplacer toute l'attribution vers des Cloud Functions (source de vérité unique). Quick win (règle) + chantier (migration serveur).

### [S3] CSP avec `'unsafe-inline'` — **MOYENNE / P2**
- **Catégorie** : A05 Misconfiguration
- **Fichier** : `firebase.json` (CSP `script-src`/`style-src` incluent `'unsafe-inline'`)
- **Constat** : réduit la protection XSS de la CSP. Atténué par DOMPurify (`markdownToHtml` sanitize tout HTML injecté) et l'absence de XSS détecté, mais la défense en profondeur est affaiblie face aux nombreux scripts tiers (GTM, Meta Pixel).
- **Reco** : migrer vers nonces/hash pour les scripts ; externaliser les styles non critiques. Effort moyen.

### [S4] Mémoire conversationnelle Rysmo opt-out par défaut — **MOYENNE / P2**
- **Catégorie** : Confidentialité / RGPD
- **Fichiers** : `functions/src/rysmo.ts:254` (`preferences?.aiMemoryConsent !== false`), `Register.tsx` (`aiMemoryConsent: true` par défaut)
- **Constat** : l'historique de conversation, le profil d'apprentissage et l'engagement sont **persistés par défaut** ; l'utilisateur doit explicitement désactiver. Pour un traitement non strictement nécessaire au service, le RGPD privilégie l'**opt-in** ou une information claire et un consentement explicite.
- **Reco** : passer en opt-in explicite ou afficher un consentement dédié au premier usage ; documenter la finalité et la durée de conservation. (Stockage côté serveur déjà privé : `rysmoConversations` = `allow … if false`.)

### [S5] Webhook : montant non rejeté en cas de divergence — **MOYENNE / P1**
- **Catégorie** : A04 Insecure Design (defense-in-depth)
- **Fichier** : `functions/src/payment.ts:625-628`
- **Constat** : mismatch de montant seulement loggé. **Atténué** par l'autorité serveur sur le montant (fixé au checkout) + signature HMAC. Risque réel **faible** mais defense-in-depth manquante.
- **Reco** : répondre `400` et ne pas appliquer l'effet de bord en cas de mismatch. Quick win.

### [S6] Export RGPD sans rate-limit ni audit — **FAIBLE-MOYENNE / P2**
- **Fichier** : `functions/src/gdpr.ts` (`exportUserData`)
- **Constat** : dump PII complet (légitime RGPD) mais sans limitation de fréquence ni journal d'accès.
- **Reco** : 1 export / 7 j + entrée `activity_logs`.

### [S7] Suppression de compte : mémoire IA résiduelle — **FAIBLE / P2**
- **Fichier** : `functions/src/gdpr.ts` (cascade) — `rysmoConversations`/`rysmoProfiles` non supprimés.
- **Reco** : compléter la cascade (cf. BACKEND §B6).

### [S8] CORS / fonctions HTTP publiques — **FAIBLE / P3 (par conception)**
- **Fichiers** : `prerender`, `sitemap`, `rss`, `catalog` (HTTP, sans auth)
- **Constat** : intentionnel pour le SEO/marketing ; sorties échappées (HTML/XML/CSV). Pas de donnée sensible. RAS, sous réserve de borner les entrées (déjà : normalisation de chemin).

### [S9] IDOR conversations (probe d'existence) — **FAIBLE / P3**
- **Fichier** : `firestore.rules:431` (`allow read: if isSignedIn() && (resource == null || uid in participants)`)
- **Constat** : le `resource == null` autorise le `get` d'une conversation **inexistante** (étape getOrCreate). Un attaquant ne peut **pas** lire les messages d'autrui (sous-collection gated par participants ; conv existante d'autrui → refus). Risque limité à une non-distinction existence/non-existence. **Surévalué dans la passe initiale — confirmé faible.**
- **Reco** : optionnel — IDs de conversation aléatoires plutôt que `[a,b].sort().join('__')`.

### [S10] Mot de passe : politique faible (admin create) — **FAIBLE / P3**
- **Fichier** : `functions/src/admin.ts` (≥ 8 caractères, sans complexité)
- **Reco** : exiger complexité ; s'appuyer sur les règles Firebase Auth.

### [S11] Robustesse de validation de rôle — **FAIBLE / P2**
- **Fichier** : `functions/src/admin.ts:49` — valeur de rôle arbitraire non whitelistée (cf. BACKEND §B4). Pas une escalade (caller admin).

## 3. Points forts de sécurité (à préserver)

| Domaine | Mesure | Référence |
|---|---|---|
| Authz déclarative | RBAC + validation de champs + default-deny `{document=**}` | `firestore.rules` |
| Anti-mass-assignment | `affectedKeys().hasOnly([...])` sur `enrollments`, `club_posts`, etc. | `firestore.rules:104-108` |
| Anti-IDOR contenu | Storage *enrollment-gated* (`{uid}_{fid}`), vérif Firestore | `storage.rules` |
| Paiement | HMAC-SHA256 `timingSafeEqual` + `webhook_events` idempotence | `payment.ts` |
| Autorité serveur | prix calculés serveur ; certificat re-dérivé | `payment.ts`, `certificates.ts` |
| Secrets | params/secrets Firebase, `.env` ne contient que des URLs | `functions/.env.*` |
| En-têtes HTTP | HSTS preload, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | `firebase.json` |
| XSS | DOMPurify sur tout HTML rendu (`markdownToHtml`) | `utils.ts:155` |
| Liens externes | `rel="noopener noreferrer"` systématique | divers |
| RGPD | export + suppression en cascade, bannière cookies, pages légales | `gdpr.ts`, `CookieBanner` |
| Données IA privées | `rysmoConversations` = `allow … if false` (backend-only) | `firestore.rules` |
| Validation env au boot | `firebase.ts` valide les variables | `src/config/firebase.ts` |

## 4. Secrets exposés

**Aucun secret en clair dans le code source.** `functions/.env.max-morrys` ne contient que des URLs (`BICTORYS_API_URL`, `APP_BASE_URL`). Les clés sensibles (`BICTORYS_API_KEY`, `BICTORYS_WEBHOOK_SECRET`, `SPOTIFY_*`, `YOUTUBE_API_KEY`, `GOOGLE_AI_API_KEY`) sont référencées via params/secrets Firebase. *(Note : le statut Git initial montre `functions/.env.max-morrys` modifié — vérifier qu'aucun secret n'y a été ajouté et qu'il reste hors VCS si nécessaire.)*

## 5. Priorisation sécurité

| Priorité | Risque | Action |
|---|---|---|
| **P0** | S1 | `npm audit fix` + bump `react-router-dom` + retest |
| **P1** | S2 | Verrouiller la gamification (règle + serveur) |
| **P1** | S5 | Rejeter les webhooks à montant divergent |
| **P2** | S3 | Durcir la CSP (nonces/hash) |
| **P2** | S4 | Consentement IA explicite |
| **P2** | S6/S7 | Rate-limit + audit export ; compléter la cascade de suppression |
| **P3** | S8–S11 | Durcissements mineurs |
