---
title: "Revue de véracité factuelle — Partie A du PRD contre le code"
date: 2026-08-29
scope: "prd.md §5.1 à §5.11 (FR-001 → FR-067) + addendum.md"
method: "Lecture directe du dépôt : src/, functions/src/, worker/, firestore.rules, .github/workflows/, package.json, package-lock.json, src/i18n/, tailwind.config.js, firebase.json, tests/"
---

# Revue de véracité factuelle — Partie A

## 0. Verdict d'ensemble

| Classement | Nombre | Exigences |
|---|---|---|
| **VÉRIFIÉE** | **53** | FR-002, 003, 005, 007, 008, 009, 012, 013, 014, 016, 017, 018, 019, 020, 022, 023, 024, 027, 028, 029, 030, 032, 033, 034, 035, 036, 037, 038, 039, 040, 041, 042, 044, 045, 046, 047, 048, 049, 050, 051, 052, 053, 054, 055, 056, 058, 059, 060, 061, 062, 064, 066, 067 |
| **PARTIELLE** | **10** | FR-001, 004, 010, 011, 015, 021, 026, 031, 043, 065 |
| **FAUSSE** | **4** | FR-006 *(sur son avertissement)*, FR-025, FR-057, FR-063 |
| **NON VÉRIFIABLE** | **0** | — |

**Lecture.** Le socle est solide : les points les plus engageants du document — l'intégrité du
prix côté serveur (FR-016), la rigueur du webhook (FR-018), la séparation des données de devis
(FR-050), les grilles tarifaires — sont **exacts au chiffre près**. Les défauts se concentrent
sur quatre points : un avertissement de conformité périmé qui accuse le produit à tort (FR-006 /
R-04), une fonctionnalité annoncée qui ne peut pas fonctionner en l'état (FR-025), et deux
décomptes faux (FR-057, FR-063). Trois erreurs de comptage supplémentaires figurent dans le
tableau §5.1 et cinq dans l'addendum.

---

## 1. Tableau récapitulatif par exigence

| # | Statut | Preuve / écart |
|---|---|---|
| FR-001 | **PARTIELLE** | Blog, podcasts, vidéos ont index + détail (`src/App.tsx:264-271`). La FAQ n'a **qu'un index** : aucune route `faq/:slug` |
| FR-002 | VÉRIFIÉE | `functions/src/proxy.ts:11` (spotifyProxy), `:72` (youtubeProxy) — `defineSecret`, admin-only, aucune clé côté client |
| FR-003 | VÉRIFIÉE | `functions/src/media-stats.ts:195` (`onSchedule '0 3 * * *'`) ; rendu `src/pages/Videos.tsx:218`, `src/pages/Podcasts.tsx:462` |
| FR-004 | **PARTIELLE** | Plan de site : hreflang fr/en/x-default ✅ (`functions/src/sitemap.ts:60-63`, `worker/apps/site/src/seo/sitemap.ts:78-81`). **Le flux RSS n'a ni paire FR/EN ni hreflang** (`functions/src/rss.ts:84` → `<language>fr</language>`, liens `/blog/<slug>` seuls ; idem worker `seo/rss.ts:77`) |
| FR-005 | VÉRIFIÉE | 29 types JSON-LD distincts, dont les 6 cités ; carte sociale serveur `functions/src/socialCard.ts` (Satori) |
| FR-006 | **FAUSSE (avertissement)** | Le formulaire existe ✅ — mais l'⚠️ est **contredit** : voir §2.1 |
| FR-007 | VÉRIFIÉE | 6 définitions dans `src/lib/popups/registry.ts:77-152` ; 4 déclencheurs distincts ; groupe témoin `PopupManager.tsx:145,237-242` |
| FR-008 | VÉRIFIÉE | `src/lib/firestore/redirects.ts`, `src/pages/admin/AdminRedirects.tsx`, `worker/apps/site/src/redirects.ts` + `tests/unit/redirects.test.ts` |
| FR-009 | VÉRIFIÉE | `src/contexts/AuthContext.tsx:4,9,73,123,167` |
| FR-010 | **PARTIELLE** | 3 rôles ✅ (`src/types/index.ts:6`). Mais la **garde de routage ne distingue pas `support`** : voir §2.4 |
| FR-011 | **PARTIELLE** | Préférences ✅ (`src/types/index.ts:102-107`). **Aucun réglage de notification** : voir §2.5 |
| FR-012 | VÉRIFIÉE | `functions/src/gdpr.ts:84` (`exportUserData`), `:117` (`deleteUserAccount`) |
| FR-013 | VÉRIFIÉE | `src/types/index.ts:678` (5 types exacts) ; UI `src/components/ui/NotificationDropdown.tsx` |
| FR-014 | VÉRIFIÉE | `src/types/index.ts:173-210` (promoPrice, modules, `Resource[]`) |
| FR-015 | **PARTIELLE** | Bictorys ✅, XOF ✅, page hébergée ✅ (`functions/src/payment.ts:38-48`). « Free Money » : voir §2.6 |
| FR-016 | VÉRIFIÉE | `functions/src/payment.ts:127-133` (relecture Firestore), `:249` (`CLUB_PRICE`), `:336-344` (packs/abos). Le client n'envoie jamais de montant |
| FR-017 | VÉRIFIÉE | `src/pages/lms/Checkout.tsx:94` (`writeBatch`) ; règle miroir `firestore.rules:382-387` (`paymentMethod == 'free' && amount == 0`) |
| FR-018 | VÉRIFIÉE | `functions/src/payment.ts:593-596` (dédoublonnage `webhook_events/{chargeId}`), `:627-629` (contrôle du montant), `:695` (statut `completed` **après** les effets de bord) |
| FR-019 | VÉRIFIÉE | `functions/src/payment.ts:72-105` (pourcentage / fixe, `maxUses`, expiration) |
| FR-020 | VÉRIFIÉE | `functions/src/payment.ts:256-263` (`REFERRAL_DISCOUNT = 0.15`), serveur uniquement |
| FR-021 | **PARTIELLE** | Côté admin ✅. **Aucun écran d'historique côté utilisateur** : voir §2.7 |
| FR-022 | VÉRIFIÉE | `enrollments.completedLessons` + sous-collection `enrollments/{id}/progress` (`firestore.rules:499`) |
| FR-023 | VÉRIFIÉE | `src/lib/firestore/notes.ts:20-37` (`users/{uid}/notes`) |
| FR-024 | VÉRIFIÉE | `functions/src/certificates.ts:11` ; code `randomUUID()` `:65`. **Plus strict que le PRD** : la complétion est re-dérivée du jeu de leçons, pas du scalaire `progress` |
| FR-025 | **FAUSSE** | Voir §2.2 — la vérification publique est bloquée par les règles |
| FR-026 | **PARTIELLE** | 10 niveaux ✅, 10 badges ✅, 4 catégories ✅, série + record ✅. **Neuf barèmes XP, pas dix — et trois seulement sont câblés** : voir §2.8 |
| FR-027 | VÉRIFIÉE | `functions/src/leaderboard.ts:62` (`*/30 * * * *`) + `rebuildLeaderboardManual` |
| FR-028 | VÉRIFIÉE | `functions/src/notifications.ts:145` (`streakReminder`), `:184` (`courseReminder`) |
| FR-029 | VÉRIFIÉE | `firestore.rules:148-152` : soumission forcée en `status == 'pending' && featured == false` |
| FR-030 | VÉRIFIÉE | `src/lib/club/pricing.ts:28` (`CLUB_PRICE_XOF = 19_900`), miroirs `functions/src/payment.ts:249`, `worker/apps/api/src/lib/bictorys.ts:123` ; CGV FR **et** EN alignées (`legal.json:127`) ; `tests/unit/club-pricing.test.ts` — 20 tests verts |
| FR-031 | **PARTIELLE** | 8 onglets dans la barre, 10 valeurs de type, 11 seulement en comptant le mur : voir §3 |
| FR-032 | VÉRIFIÉE | `src/pages/lms/tabs/club/ClubFeed.tsx:223-229,313` (likes, reposts, commentaires, catégorie) |
| FR-033 | VÉRIFIÉE | `ClubEvents.tsx:44-52` (`online` / `inPerson` + lieu) ; sous-collections `registrations` (`firestore.rules:667,679`) |
| FR-034 | VÉRIFIÉE | `src/lib/firestore/dm.ts:58-89` + `dm_reports` (`firestore.rules:621`) |
| FR-035 | VÉRIFIÉE | `functions/src/digest.ts:89` (`weeklyClubDigest`) + `weeklyClubDigestManual` |
| FR-036 | VÉRIFIÉE | `src/lib/firestore/club.ts:188-210` ; onglet admin `AdminClubDigitos.tsx:29,148` |
| FR-037 | VÉRIFIÉE | `functions/src/rysmo.ts:223-237` (état par cours, inactivité, consigne d'ancrage) |
| FR-038 | VÉRIFIÉE | `functions/src/rysmo.ts:87` (`CONTENT_LIMIT = 30`), appliqué par collection `:109-113` |
| FR-039 | VÉRIFIÉE | `functions/src/rysmo.ts:248` (`SUMMARY_THRESHOLD = 6`) ; `clearRysmoMemory` ; `RysmoMemoryTab.tsx`. *Nuance non dite : la mémoire est opt-in (`aiMemoryConsent`)* |
| FR-040 | VÉRIFIÉE | `functions/src/rysmo.ts:23-27` : 2 / 2+3 / 20 / 100 — exact |
| FR-041 | VÉRIFIÉE | `functions/src/payment.ts:336-344` : 30/100/300 à 500/1 500/3 500 ; Lite 3 000, Pro 7 500 — exact |
| FR-042 | VÉRIFIÉE | `adminManageRysmoQuota` (`functions/src/index.ts:9`, `worker/apps/api/src/handlers/admin.ts:69`) |
| FR-043 | **PARTIELLE** | Le seul limiteur est le compteur de quota quotidien : voir §2.9 |
| FR-044 | VÉRIFIÉE | `functions/src/cv.ts` (`parseCv`) |
| FR-045 | VÉRIFIÉE | `functions/src/notifications.ts:101` (`rysmoCoachNudge`, `onDocumentUpdated`) |
| FR-046 | VÉRIFIÉE | `src/components/presence/PackSelector.tsx:25` (« Trouve ton pack en 3 questions », radiogroups) |
| FR-047 | VÉRIFIÉE | `src/lib/presence/offer.ts:62-64` (295/495/895 k), `:69-70` (375+175 ; 750+225 avec `commitmentMonths: 6`), `:75-82` (6 options), `:32` (`floorPrice`, jamais affiché). 28 tests verts |
| FR-048 | VÉRIFIÉE | `src/components/presence/MapsProof.tsx` — ouvre une recherche Google Maps réelle ; **aucun jeu de données derrière**, ce qui confirme R-07 |
| FR-049 | VÉRIFIÉE | `src/pages/PresenceDigitale.tsx:129-130` (URL de devis localisée) + `src/lib/presence/whatsapp.ts` |
| FR-050 | VÉRIFIÉE | `firestore.rules:320-327` — interdiction explicite de `phone`, `email`, `contactName`, `message`, `notes`, `referralCode`, plafond de clés à 11, `list` réservé à l'admin. **Le meilleur point du dépôt** |
| FR-051 | VÉRIFIÉE | `src/lib/presence/offer.ts` → `PIPELINE_STAGES = ['new','qualified','quoted','signed','lost']` |
| FR-052 | VÉRIFIÉE | `functions/src/maintenance.ts:36` (`cleanupAgencyQuotes`, `0 4 * * *`) |
| FR-053 | VÉRIFIÉE | `src/i18n/locales/fr/agency.json:277-280` — uniquement des **fourchettes budgétaires**, aucun prix vendeur |
| FR-054 | VÉRIFIÉE | `src/types/index.ts:346-355` (9 types exactement), `:364` (`MY_ONOMA_GROW`), `:376-378` (« jamais rejeté ») ; `src/lib/brand/practices.ts:85` |
| FR-055 | VÉRIFIÉE | `src/types/index.ts:361` — `new/qualified/scoping/proposal/won/lost` |
| FR-056 | VÉRIFIÉE | `src/App.tsx:210-215` (`LegacyQuoteRedirect`), `:277` |
| FR-057 | **FAUSSE** | **19 écrans, pas 20** : voir §2.3 |
| FR-058 | VÉRIFIÉE | `src/components/ui/RichEditor.tsx` ; **tous** les `dangerouslySetInnerHTML` passent par `markdownToHtml` (DOMPurify, `src/lib/markdown.ts:67`) ou `DOMPurify.sanitize` |
| FR-059 | VÉRIFIÉE | `functions/src/admin.ts` → `adminCreateUser`, `adminManageEnrollment` |
| FR-060 | VÉRIFIÉE | `src/lib/firestore/admin.ts:99-121` — `getCountFromServer` partout, aucun décompte client |
| FR-061 | VÉRIFIÉE | `functions/src/maintenance.ts:65` (`backupFirestore`, `0 2 * * *`), `:8` (`cleanupTempStorage`, `0 3 * * *`) |
| FR-062 | VÉRIFIÉE | `functions/src/storage-cleanup.ts` — 4 déclencheurs `onDocumentDeleted` |
| FR-063 | **FAUSSE** | `activity_logs` n'est **jamais écrit** : voir §2.3 |
| FR-064 | VÉRIFIÉE | `src/App.tsx:218-226` (`localizeRouteTree`), `:404-410` (double montage) ; `src/i18n/segments.ts` ; `tests/unit/i18n-routing.test.ts` — 18 tests verts |
| FR-065 | **PARTIELLE** | 23 namespaces ✅. « Discipline totale » : voir §2.10 |
| FR-066 | VÉRIFIÉE | `worker/apps/site/src/prerender/index.ts:80-113` — `translateMetaToEn` **dans** l'enveloppe de cache KV ; `functions/src/translate.ts` |
| FR-067 | VÉRIFIÉE | `functions/src/prerender.ts` + `worker/apps/site/src/prerender/` (meta, JSON-LD, shell) ; 30 réécritures de pré-rendu dans `firebase.json` |

---

## 2. Détail des problèmes

### 2.1 FR-006 / R-04 — **FAUSSE**. Le consentement newsletter existe, et il est imposé par les règles

Le PRD écrit : *« ⚠️ Voir R-04 : il ne recueille aujourd'hui aucun consentement explicite »*, et
R-04 précise *« ni case, ni lien de politique, ni preuve conservée »*. **Les trois affirmations
sont fausses.**

- `src/components/shared/NewsletterForm.tsx:28` — `const [consent, setConsent] = useState(false)`
  → case **jamais pré-cochée**.
- `:37-38` — soumission refusée sans consentement.
- `:47-48` — `consent: true` **et** `consentAt: new Date().toISOString()` → preuve horodatée
  conservée.
- `:61-88` — case à cocher + `LocalizedLink to="/legal/confidentialite"` → lien de politique
  présent.
- `firestore.rules:356-370` — le serveur **refuse** une inscription sans `consent == true` :

```
allow create: if request.resource.data.keys().hasAll(['email', 'consent'])
  && request.resource.data.consent == true
  && (!('consentAt' in request.resource.data) || request.resource.data.consentAt is string)
```

**Impact.** Cet avertissement accuse le produit à tort sur un point de conformité, devant un
lecteur externe. Il fait par ailleurs exister un risque (R-04) et une exigence de Partie B
(FR-083) qui n'ont plus d'objet. **À supprimer des trois endroits.**

### 2.2 FR-025 — **FAUSSE**. Le certificat n'est pas vérifiable publiquement

Le PRD : *« Chaque certificat est vérifiable publiquement à une URL dédiée, sans compte. »*

- `src/pages/lms/Certificate.tsx:26` interroge Firestore côté client :
  `getCollection<CertificateType>('certificates', where('certificateCode', '==', code))`.
- `firestore.rules:484` : `allow read: if isOwner(resource.data.userId) || isAdmin();`

Un visiteur anonyme est refusé. Pire : comme il s'agit d'une **requête de liste** non filtrée sur
`userId`, Firestore ne peut pas prouver la règle et **rejette la requête même pour le
propriétaire** — la seule requête certifiée du dépôt filtre bien sur l'utilisateur
(`src/lib/firestore/certificates.ts:8`). L'écran retombe donc systématiquement sur son état
« certificat introuvable ».

Deux indices corroborants : la page pose `noIndex` (`Certificate.tsx:78`), et `firebase.json` ne
comporte **aucune réécriture** vers `/certificat` — la page n'est ni pré-rendue ni servie par le
Worker.

**Impact.** C'est un argument de valeur mis en avant dans UJ-1 (le partage LinkedIn) et dans
M-03. En l'état, il faut soit reformuler l'exigence, soit ouvrir une lecture publique
restreinte (règle `get` par code, ou une route serveur dédiée comme celle des devis TPE, qui
résout exactement ce problème en `firestore.rules:317-318`).

### 2.3 FR-057 et FR-063 — deux affirmations du chapitre Administration

**FR-057 — « Vingt écrans » : il y en a dix-neuf.** `src/App.tsx:355-383` déclare 19 routes
d'administration (index + 18) et `src/components/layout/AdminLayout.tsx:18-36` exactement 19
entrées de navigation. **L'énumération du PRD lui-même en liste 19** — tableau de bord, articles,
formations, utilisateurs, messages, analytique, paramètres, podcasts, vidéos, transactions,
coupons, annonces, FAQ, témoignages, rendez-vous, Club, prospects TPE, projets, redirections.
Le tableau §5.1 répète la même erreur. *(`src/pages/admin/AdminPlaceholder.tsx` existe mais
n'est importé nulle part : ce n'est pas un vingtième écran.)*

**FR-063 — le journal d'activité n'existe pas.** `activity_logs` n'apparaît qu'à **deux**
endroits dans tout le dépôt : `firestore.rules:426-435` et `firestore.indexes.json:156`. Aucune
écriture nulle part — ni dans `src/`, ni dans `functions/src/`, ni dans `worker/`. La règle
elle-même pose `allow create: if false` sans qu'aucun code Admin SDK ne prenne le relais. La
collection est un emplacement réservé, pas un journal. **Affirmation à retirer ou à déplacer en
Partie B.**

*Note favorable au PRD :* le nommage trompeur des URL est correctement démêlé. `/admin/prospects-agence`
(`AdminAgencyLeads`) pilote bien la collection `agency_leads` = **prospects TPE**, et `/admin/projets`
(`AdminMissions`) la collection `engagement_leads` = **missions Agency**. Le PRD les décrit dans le
bon sens.

### 2.4 FR-010 — la garde de routage ne distingue pas `support`

*« Les gardes de routage […] le rôle `support` accède à un sous-ensemble strict. »*

`src/components/routing/ProtectedRoute.tsx:43,60` : `allowedRoles = ['admin', 'support']` —
`AdminRoute` accorde à `support` l'accès à **toutes** les routes `/admin/*` sans exception. Le
sous-ensemble n'est produit que par le masquage d'entrées de menu côté client
(`AdminLayout.tsx:51`, drapeau `adminOnly`) et par les règles Firestore
(`isAdminOrSupport()` n'est accordé que sur `appointments`, `messages`, `agency_leads`,
`engagement_leads`). Un compte `support` qui saisit `/admin/parametres` **atteint l'écran** ;
seules les lectures Firestore échouent.

Formulation exacte : *« le rôle support voit un sous-ensemble de la navigation, et les règles
Firestore limitent ses lectures ; la garde de routage ne les distingue pas. »*

### 2.5 FR-011 — pas de « réglages de notification »

`src/types/index.ts:102-107` : `UserPreferences` = `theme`, `language`, `newsletter`,
`aiMemoryConsent`. Le champ `newsletter` **n'est lu nulle part** dans le dépôt. L'écran de
réglages (`src/pages/lms/tabs/SettingsTab.tsx`) expose l'apparence, la langue, la mémoire de
Rysmo, l'export et la suppression de compte — **aucun réglage de notification**. La langue est
bien une préférence propre ✅ ; la seconde moitié de l'exigence n'est pas livrée.

### 2.6 FR-015 — « Free Money » n'est adossé qu'au texte des CGV

Le code **n'énumère jamais les moyens de paiement** : `payment_type` est volontairement omis pour
laisser la page hébergée les proposer (`functions/src/payment.ts:26-29`). Le commentaire de ce
même code écrit « Wave / Orange Money / card » — sans Free Money. Free Money n'apparaît que dans
le texte contractuel (`legal.json:94,141`, FR et EN). Et les libellés du tunnel d'achat
(`lms.json:94`, `lmsTabs.json:199`) annoncent « Wave, Orange Money et carte bancaire », **sans
Free Money** — incohérence interne à corriger côté copie.

L'exigence reste vraie sur le fond (Bictorys, XOF, page hébergée, ces rails-là) mais elle est
**constatée dans les CGV, pas dans le code** — ce qui la place hors de la règle annoncée en §0.

### 2.7 FR-021 — l'historique n'est pas consultable par l'utilisateur

Côté administration : ✅ (`src/lib/firestore/admin.ts:141-145`, `AdminTransactions.tsx`).
Côté utilisateur : **aucun écran de liste**. Les seules lectures de `transactions` hors admin
sont `src/pages/lms/Checkout.tsx:98` (création) et `src/pages/lms/PaymentReturn.tsx:33` (un seul
document, par identifiant). Les règles autorisent bien le propriétaire à lire les siennes
(`firestore.rules:378`) et l'export RGPD les inclut (`functions/src/gdpr.ts:57`), mais la
plateforme n'offre pas d'historique d'achat.

### 2.8 FR-026 — neuf barèmes, dont trois câblés

`src/types/gamification.ts:33-43` — `XP_REWARDS` compte **neuf** entrées, pas dix :
`completeLesson`, `completeModule`, `completeFormation`, `createNote`, `dailyStreak`,
`firstClubPost`, `clubPost`, `clubComment`, `submitTestimonial`.

Plus gênant : **trois seulement sont effectivement attribués** — `dailyStreak`
(`DashboardTab.tsx:34`), `clubPost` et `clubComment` (`useClubData.ts:200,258`). Terminer une
leçon, un module ou une formation, créer une note ou soumettre un témoignage **ne rapporte aucun
XP** aujourd'hui. Or `getLevelFromXP` et les badges `learning` reposent sur cet XP : la
progression de niveau d'un apprenant qui ne fréquente pas le Club est structurellement plate.

Le reste de l'exigence est exact : 10 niveaux (`:49-60`), 10 badges (`:20-31`), 4 catégories,
`currentStreak` + `longestStreak` (`:1-8`).

### 2.9 FR-043 — la « limitation de débit » est le quota

Le seul mécanisme est le compteur quotidien de `reserveRequest`
(`functions/src/rysmo.ts:429-500`, document `_ratelimits/rysmo_{uid}`) — c'est-à-dire
**exactement FR-040**. Il n'existe ni fenêtre glissante, ni plafond par minute, ni limite par IP,
ni protection des points d'entrée non authentifiés. FR-043 ne décrit pas une protection
supplémentaire ; il reformule la précédente. À fusionner avec FR-040 ou à requalifier.

### 2.10 FR-065 — la discipline i18n n'est pas « totale »

23 namespaces : ✅ exact (`src/i18n/locales/{fr,en}/` — 23 fichiers de chaque côté).
Un balayage de toutes les chaînes littérales accentuées confirme que **`src/pages/` est propre**
(les seules occurrences sont des commentaires). Mais quatre exceptions réelles subsistent :

1. `src/components/ui/PhoneInput.tsx:14-…` — **la liste complète des pays en français**, codée
   en dur, jamais traduite (« Algérie », « Émirats arabes unis », « États-Unis »…). Un
   utilisateur de l'interface anglaise voit un sélecteur de pays en français. C'est le seul
   écart de fond.
2. `src/pages/admin/AdminSettings.tsx:48-56` — valeurs par défaut françaises
   (« Formateur, consultant et créateur de contenu digital », « Dakar, Sénégal »).
3. `'général'` comme catégorie de repli dans `BlogPost.tsx:75`, `VideoDetail.tsx:69`,
   `PodcastDetail.tsx:73`.
4. `SettingsTab.tsx:127` — `'Français'` / `'English'`, endonymes du sélecteur de langue
   (choix légitime, mais c'est bien une chaîne codée en dur).

L'affirmation « la discipline est totale » est à adoucir en « la discipline tient sur les pages ;
un composant partagé (sélecteur de pays) et quelques valeurs de repli y échappent ».

---

## 3. Vérification des affirmations chiffrées

| Affirmation du PRD | Constat | Verdict |
|---|---|---|
| **46 collections Firestore** | `firestore.rules` déclare **43 collections de premier niveau** et **9 sous-collections**, soit **51 chemins** (52 en comptant `notifications` comme parent). Aucune collection supplémentaire dans `functions/src/` ni `worker/`. **46 ne correspond à aucun décompte** | **FAUX** |
| ~45 fonctions Cloud v2 | **46** symboles exportés par `functions/src/index.ts` ; tous en `firebase-functions/v2` | **EXACT** |
| Trois applications Cloudflare Workers | `worker/apps/` = `api`, `media`, `site` | **EXACT** |
| **20 écrans admin** | **19** (§2.3) | **FAUX** |
| 10 onglets espace apprenant | `src/App.tsx:301-311` — tableau-de-bord, cours, notes, messages, succes, profil, parametres, club, rysmo, temoignages | **EXACT** |
| **11 onglets Club** | `ClubSubTab` (`useClubData.ts:31`) déclare **10** valeurs ; la barre de navigation en expose **8** (`events` et `sessions` fusionnés sous `agenda`). Les « onze surfaces » de FR-031 ne tiennent qu'en ajoutant le **mur d'abonnement**, qui n'est pas un onglet | **INEXACT** (FR-031 défendable, le tableau §5.1 non) |
| 23 espaces de noms i18n | 23 fichiers JSON par langue | **EXACT** |
| 6 pop-ups | `POPUP_REGISTRY` : cartRecovery, formationExit, agencyExit, presenceExit, blogEnd, formationsEntry | **EXACT** |
| 20 routes publiques | Exactement 20 sous `PublicLayout` (+ 1 redirection héritée `agence/devis/:ref`), montées deux fois | **EXACT** |
| Club 19 900 FCFA + remise 15 % | `pricing.ts:28`, `payment.ts:249,256` ; CGV FR et EN alignées | **EXACT** |
| Rysmo packs 500 / 1 500 / 3 500 (30/100/300 req.) | `payment.ts:336-339` | **EXACT** |
| Rysmo abos Lite 3 000 / Pro 7 500 | `payment.ts:341-344` | **EXACT** |
| Quotas 2 / 5 / 20 / 100 | `rysmo.ts:23-27` (`2`, `2+3`, `20`, `100`) | **EXACT** |
| Packs TPE 295 k / 495 k / 895 k | `offer.ts:62-64` | **EXACT** — *à noter : le pack `presence` porte un `promoPrice` de 250 000 non mentionné au PRD* |
| Plans 375 k + 175 k ; 750 k + 225 k sur 6 mois | `offer.ts:69-70` (`commitmentMonths: 6` sur `commerce360` seulement) | **EXACT** |
| Six options à la carte | `offer.ts:75-82` | **EXACT** |

---

## 4. Vérification de l'addendum

### 4.1 Versions

| Affirmation | Déclaré (`package.json`) | Verrouillé (`package-lock.json`) | Verdict |
|---|---|---|---|
| React 18.3.1 | `^18.3.1` | **18.3.1** | EXACT |
| Tailwind **3.4.1** | `^3.4.1` | **3.4.17** | Imprécis |
| React Router **7.13.1** | `^7.13.1` | **7.17.0** | Imprécis |
| Vite **5.4.2** | `^5.4.2` | **5.4.21** | Imprécis |
| i18next 26.3.2 | `^26.3.2` | **26.3.2** | EXACT |

L'addendum cite les **bornes basses déclarées**, pas les versions réellement installées. Sans
conséquence sur son argument (les frontières de **majeure** — React 18, Tailwind 3, RR 7, Vite 5 —
sont toutes exactes, et `darkMode: 'class'` est bien en configuration JavaScript,
`tailwind.config.js:4`), mais un lecteur qui vérifie trouvera trois écarts.

### 4.2 Affirmations fausses de l'addendum

1. **« i18next 26.3.2 · 23 espaces de noms bundlés statiquement »** — **FAUX**.
   `src/i18n/index.ts:41-70` : **8 namespaces seulement** sont statiques et dans les deux langues
   (`common`, `nav`, `footer`, `shared`, `home`, `ui`, `errors`, `formations`) ; **15 sont
   chargés à la demande, par route, dans la langue active** via `import.meta.glob`. Le
   commentaire du fichier explique précisément que le bundling statique des 23 a été démonté
   (382 Ko de JSON dans le chunk d'entrée). L'addendum décrit un état antérieur.

2. **Tableau des trois projets — colonne « Vérification »** — **FAUX sur deux lignes.**
   - `functions/src/` : « manuelle » → `.github/workflows/ci.yml` exécute
     `npx tsc --noEmit` dans `functions/` **et** `npm run build`, dans le job bloquant.
   - `worker/src/` : « jamais en intégration » → un job `workers` dédié exécute
     `npm run typecheck` **et** `npm test` sur le monorepo Worker à chaque proposition de
     modification. **L'addendum se contredit lui-même** : son §7 mentionne « la vérification du
     Worker » comme bloquante.
   - Accessoirement, `worker/src/` **n'existe pas** : le code vit dans `worker/apps/*/src` et
     `worker/packages/*/src` (`worker/tsconfig.json`, champ `include`).

3. **« les réécritures d'hébergement (31 en français, autant en anglais) »** — **FAUX**.
   `firebase.json` compte **34 réécritures** : **15 en français** et **15 en anglais** vers le
   pré-rendu, plus 3 flux (`/sitemap.xml`, `/rss.xml`, `/catalog.csv`) et le repli SPA `**`.

4. **« TanStack Query dans 6 fichiers seulement »** — **FAUX**. **10 fichiers** importent
   `@tanstack/react-query` (`App.tsx`, `lib/queryClient.ts`, `Home`, `Blog`, `Formations`,
   `Podcasts`, `Videos`, `FormationCTA`, `useAdminUsers`, `useStudentData`) — soit 8
   consommateurs hors provider et configuration.

5. **« Découpage manuel des paquets figé — deux modules Firebase en sortent volontairement »** —
   **PÉRIMÉ**. `vite.config.ts:33` route désormais **tout** `firebase`/`@firebase` dans un chunk
   unique ; aucun module n'en est exclu. Le commentaire du fichier documente l'inverse de
   l'affirmation : `firebase/functions` **manquait** et a été intégré.

6. **« Deux binaires natifs sont requis à chaque construction pour l'optimisation d'images »** —
   **IMPRÉCIS**. `vite-plugin-image-optimizer` exige `sharp` (binaire natif) et `svgo` — ce
   dernier est un paquet JavaScript pur, sans binaire.

### 4.3 Affirmations exactes de l'addendum (vérifiées)

- **Trois projets TypeScript indépendants** : `tsconfig.app.json` (ESM/ES2020/DOM),
  `functions/tsconfig.json` (**CommonJS**/ES2017), `worker/tsconfig.json`
  (ESM/ES2022, `"types": ["@cloudflare/workers-types"]` — ni DOM ni Node). Le commentaire du
  tsconfig Worker documente explicitement l'interdiction de `process` et `Buffer`. ✅
  *(Le dépôt compte cependant 5 tsconfig : `tsconfig.node.json` et `worker/tsconfig.test.json`
  s'ajoutent aux trois.)*
- **Chaîne d'intégration bloquante** : lint → typecheck → **tests unitaires** → build, plus
  build des fonctions et job Worker. Le commentaire du fichier CI rappelle bien pourquoi les
  tests ont été ajoutés (l'écart CGV/code sur le prix du Club). ✅ **330 tests passent** (12
  fichiers, exécution vérifiée).
- **Les tests de règles Firestore ne conditionnent pas le déploiement** : le job `rules-tests`
  existe mais `deploy` ne dépend que de `lint-and-build`. ✅
- **La chaîne ne déploie que l'hébergement** : le job `deploy` se termine sur
  `FirebaseExtended/action-hosting-deploy@v0` — règles, index, fonctions et Workers sont
  construits, jamais poussés. ✅ **R-12 est exact.**
- **Installation depuis le fichier de verrouillage** : `npm ci` partout. ✅
- **État de la migration** — vérifié au mot près (`worker/apps/api/wrangler.jsonc`) :
  `MIGRATED` en production **exclut** les quatre charges et le webhook ; l'environnement
  `preview` **inclut** `createBictorysCharge`, `createRysmoPackCharge`,
  `createRysmoSubscriptionCharge` et `bictorysWebhook` — mais **pas `createClubCharge`**, qui est
  bien implémentée dans `registry.ts` et absente de la liste de préversion. L'exception décrite
  est exacte. ✅
- **Segment de retour de paiement codé en dur en deux endroits serveur** :
  `functions/src/payment.ts:38` et `worker/apps/api/src/lib/bictorys.ts:38`. ✅ **NFR-03 exact.**
- **Les six emplacements d'un renommage de segment** existent tous : `src/i18n/segments.ts`,
  `firebase.json`, `worker/apps/site/src/prerender/segments.ts`, `functions/src/segments.ts`,
  `functions/src/sitemap.ts`, `worker/apps/site/src/seo/sitemap.ts`. ✅
- **`cn()` n'est pas `clsx` + `tailwind-merge`** : `src/lib/utils.ts:2-4` — `filter(Boolean).join(' ')`,
  sans résolution de conflit. ✅
- **Système de design** : 11 familles de couleurs (marque, accentuation, succès, avertissement,
  erreur, neutre + coral/plum/teal/lagoon + morrys) ✅ ; `lagoon-500 = 2,6:1 sur blanc, INTERDIT
  pour du texte` documenté à trois endroits (`tailwind.config.js:130`,
  `src/lib/sectionThemes.ts:24,146`) ✅ ; collision hexadécimale **intentionnelle et commentée**
  `morrys-600 == plum-600 == #8a3de8` (`tailwind.config.js:147`) ✅.
- **Deux bibliothèques d'icônes** cohabitent (`lucide-react` public/admin,
  `@phosphor-icons/react` Club/LMS) ✅ ; **aucun formateur** configuré ✅ ; **TypeScript strict
  avec `noUnusedLocals` / `noUnusedParameters`** dans `src/` et `worker/` ✅.

---

## 5. Observations annexes (hors périmètre du PRD, utiles à l'exactitude)

- **`@tiptap` (11 paquets) est déclaré dans `package.json` mais n'est importé nulle part dans
  `src/`.** L'éditeur réellement utilisé est `src/components/ui/RichEditor.tsx`, un éditeur
  markdown maison. Une dépendance morte lourde. *(L'addendum ne mentionne pas TipTap — c'est
  cohérent ; `MEMORY.md` du projet, si.)*
- `src/pages/admin/AdminPlaceholder.tsx` : composant jamais importé.
- La §10 « hors périmètre » est exacte sur la recherche : `functions/src/search.ts` existe et est
  neutralisé par secrets (`reindexSearch`), avec un filtrage client en substitut. ✅
- FR-030 mérite un renfort : la cohérence CGV ↔ interface est **testée** (`club-pricing.test.ts`,
  20 tests), et le test interdit explicitement toute réécriture de « 19 900 » hors de
  `lib/club/pricing`. C'est plus fort que ce que le PRD en dit.

---

## 6. Recommandations de correction, par priorité

1. **Supprimer l'avertissement de FR-006, le risque R-04 et l'exigence FR-083** — le
   consentement est en place et imposé par les règles (§2.1). C'est la correction la plus
   urgente : elle accuse le produit à tort sur un sujet de conformité.
2. **Requalifier FR-025** — soit décrire l'état réel (« vérification réservée au titulaire, non
   fonctionnelle en l'état »), soit basculer l'ouverture publique en Partie B (§2.2).
3. **Corriger « 20 écrans » → 19** (FR-057 et tableau §5.1), et **retirer FR-063** ou le déplacer
   en Partie B (§2.3).
4. **Corriger le décompte des collections** : écrire « 43 collections de premier niveau et 9
   sous-collections » plutôt que « 46 ».
5. **Corriger FR-026** : neuf barèmes d'XP, dont trois câblés — et mentionner que la progression
   d'apprentissage n'attribue actuellement pas d'XP.
6. **Adoucir FR-004** (le RSS n'est ni bilingue ni hreflang), **FR-010** (la garde ne distingue
   pas `support`), **FR-011** (pas de réglages de notification), **FR-021** (pas d'historique
   utilisateur), **FR-043** (c'est le quota), **FR-065** (`PhoneInput` échappe à l'i18n).
7. **Addendum** : corriger les 23 namespaces « bundlés statiquement » (8 le sont), la colonne
   « Vérification » du tableau des trois projets, les « 31 réécritures » (15 + 15), les « 6
   fichiers TanStack » (10) et la note sur le découpage Firebase.
