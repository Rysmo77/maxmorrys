# Lot 0 — Audit technique préalable de la refonte

**Objet** — répondre par le code aux cinq questions du CDC §6.1, trancher le §6.2, statuer sur
les exigences du §6.3, et dresser la recette du §9.2.
**Date** — 17 septembre 2026.
**Dépôt** — `/Users/macbookair/maxmorrys.me-main`, `origin https://github.com/Rysmo77/maxmorrys.git`.
**Référence de lecture** — `HEAD = 33c3e4e` (07/09/2026), **avec un arbre de travail en mouvement** :
le Lot 1 tourne en parallèle et a touché une soixantaine de fichiers pendant la rédaction —
`src/App.tsx`, `src/i18n/segments.ts`, `worker/apps/site/src/routes.ts`, `seo/sitemap.ts`,
`prerender/static-pages.ts`, `firebase.json`, plus `worker/apps/site/src/static-redirects.ts` et
six catalogues i18n neufs. Trois écarts relevés en cours de lecture ont été refermés avant la
publication de ce document ; ils sont conservés, datés et signalés comme tels, parce qu'ils
décrivent des pièges qui se rouvriront (§5).

**Règle de preuve** — chaque constat cite le fichier et la ligne qui l'établissent. Ce qui n'est
pas prouvé par le code est étiqueté **« à vérifier »** avec la commande ou la source qui
permettrait de le savoir. Les rapports de `audit/` datent du 14/06/2026 pour douze d'entre eux :
ils ont servi de piste, jamais de preuve.

---

## 1 · Les cinq questions du §6.1

### Q1 — Quelle plateforme porte les formations, les paiements et l'accès à vie ? Quelle intégration Wave et Orange Money, sous quel contrat ?

**La plateforme est détenue. Il n'y a aucun tiers de LMS ni de e-commerce.** Le catalogue, le
tunnel, l'espace apprenant et les certificats sont du code de ce dépôt : une application React
18 / Vite servie par Firebase Hosting, devancée par trois Workers Cloudflare
(`worker/apps/{site,api,media}`), avec Firestore pour base et Firebase Auth pour l'identité.

**Le prestataire de paiement réel est Bictorys**, un agrégateur qui porte lui-même Wave, Orange
Money, Free Money et la carte bancaire. Ce n'est pas une intégration Wave *et* une intégration
Orange Money : c'est **une seule intégration**, une page de paiement hébergée.

- Endpoint : `worker/apps/api/wrangler.jsonc:59` → `BICTORYS_API_URL = https://api.bictorys.com/pay/v1/charges`.
- Création de charge : `worker/apps/api/src/lib/bictorys.ts:29-71`. Devise `XOF` en dur
  (`:50`), pays `SN` (`:57`), timeout 20 s (`:61`), authentification par en-tête `X-API-Key` (`:45`).
- **Le moyen de paiement n'est pas choisi par le site** : `payment_type` est volontairement
  omis pour que la page hébergée laisse l'utilisateur choisir (`worker/apps/api/src/lib/bictorys.ts:21-28`).
  C'est pourquoi l'écran de commande annonce les trois moyens sans les offrir comme un contrôle
  (`src/pages/lms/Checkout.tsx:26-44`).
- Les quatre moyens sont nommés au contrat client : `src/i18n/locales/fr/legal.json:154`
  (« le règlement s'effectue via Bictorys, agrégateur … Wave, Orange Money, Free Money et carte »)
  et `:100` (sous-traitant RGPD).

**Le flux exact, de bout en bout :**

| Étape | Qui | Preuve |
|---|---|---|
| 1. Devis affiché | `quoteCheckout` (Worker), appelé par le navigateur | `src/pages/lms/Checkout.tsx:71-82`, `:178`, `:288` |
| 2. Clic « payer » | `createBictorysCharge` (Worker, callable authentifiée) | `src/pages/lms/Checkout.tsx:84-87`, `:375` |
| 3. Prix relu **en base**, jamais reçu du client | `resolveCheckoutTotal` | `worker/apps/api/src/handlers/payments.ts:137-143` → `worker/apps/api/src/lib/checkout.ts:60-173` |
| 4. Charge créée chez Bictorys, `paymentReference` = id de transiction pré-alloué | `createHostedCharge` | `worker/apps/api/src/handlers/payments.ts:153-154`, `:97-100` |
| 5. Document `transactions/{id}` écrit en `status: 'pending'` | le Worker | `worker/apps/api/src/handlers/payments.ts:158-167`, base commune `:65-91` |
| 6. Redirection navigateur vers la page hébergée | le navigateur | `src/pages/lms/Checkout.tsx:383` (`window.location.href = result.data.checkoutUrl`) |
| 7. Retour utilisateur sur `/paiement/retour?transactionId=…` | URL construite côté serveur | `worker/apps/api/src/lib/bictorys.ts:38` |
| 8. L'écran de retour **écoute** la transaction, il ne décide de rien | `onSnapshot` Firestore | `src/pages/lms/PaymentReturn.tsx:98-132`, garde de propriété `:108` |
| 9. **Le webhook valide** — `POST /bictorysWebhook` sur `api.maxmorrys.me` | `handleBictorysWebhook` | `worker/apps/api/src/index.ts:82-85`, `worker/apps/api/src/webhook/bictorys.ts:36` |

Le webhook est **le seul point où l'argent devient un droit**. Il est routé avant la validation
`onCall` parce que Bictorys poste du JSON brut (`worker/apps/api/src/index.ts:66-71`). Sa
mécanique :

- signature **HMAC-SHA256** sur les octets bruts, lus avant tout parse, fail-closed
  (`worker/apps/api/src/webhook/bictorys.ts:18-22`, `:47-53`) ;
- idempotence par `webhook_events/{chargeId}`, enregistré **après** traitement (`:72-79`) ;
- contrôle de montant en défense en profondeur (`:98-112`) ;
- effets de bord **avant** le passage en `completed`, pour qu'une panne laisse `pending` donc
  rattrapable (`:137-138`, `:221-223`) ;
- quatre lignes de produit aiguillées par `ligneDeBusiness(txn)` (`:127`) : Club (`:139`), pack
  Rysmo (`:161`), abonnement Rysmo+ (`:194`), **formation** (`:197-212`) ;
- facture et courrier de confirmation, dont l'échec ne fait jamais échouer le webhook (`:236-266`).

**Ce qui donne l'accès à vie à un cours : l'existence du document `enrollments/{uid}_{formationId}`.**
Il est créé par le webhook au succès (`worker/apps/api/src/webhook/bictorys.ts:200-210`) et
**ne porte aucune date d'expiration** — `src/types/index.ts:545-563` : `enrolledAt`, `progress`,
`completedLessons`, `certificateIssued`, `maxProgress`, et rien d'autre. L'accès à vie n'est donc
pas une donnée : c'est **l'absence d'échéance**, et c'est ce que promet la copie
(`src/i18n/locales/fr/formations.json:223` « Une fois payée, l'accès est à vie »,
`src/i18n/locales/fr/legal.json:137` au contrat).

Ce document est ensuite la clé de toutes les portes :

- lecture du contenu, règles Firestore : `firestore.rules:195-253`, création cliente réservée
  aux formations réellement gratuites (`:219-222`, prédicat `isFreeFormation` `firestore.rules:26`) ;
- accès aux médias : `worker/apps/api/src/handlers/mediaToken.ts:49-52` refuse un jeton signé
  sans inscription ;
- émission du certificat : `worker/apps/api/src/handlers/issueCertificate.ts:40-43`.

**⚠️ Ce que le dépôt ne sait pas — le contrat.** Le dépôt prouve l'intégration technique, pas les
conditions commerciales. Il n'existe **aucun document contractuel Bictorys** ici : ni convention,
ni grille tarifaire, ni identifiant marchand (les secrets `BICTORYS_API_KEY` et
`BICTORYS_WEBHOOK_SECRET` sont posés par `wrangler secret`, hors dépôt). Le seul chiffre
approchant est une **hypothèse de modèle financier** — `finance/hypotheses.csv:22`
« Commission Bictorys, 3,0 % » — qui est une saisie de projection, **pas une clause**. Pour le
savoir : le contrat signé Bictorys / MY ONOMA SARL, et le tableau de bord marchand Bictorys.

**⚠️ Risque hérité, à connaître avant toute bascule.** `worker/apps/api/wrangler.jsonc:15-35`
documente un incident mesuré le 02/09/2026 : les quatre callables de paiement et le webhook
étaient absents de la liste `MIGRATED`, et depuis le passage au plan Spark il n'existe **plus
aucune Cloud Function** vers laquelle relayer. *Tout le chemin de l'argent répondait 404*, sans
erreur visible. La liste est corrigée aujourd'hui (`:38` et `:103`, les deux environnements), et
la parité est gardée par `npm run vues:check` (`.github/workflows/ci.yml:59-60`). **Toute
modification du routage des callables doit repasser cette porte.**

---

### Q2 — Où vivent les comptes membres du Club des Digitos, et comment sont-ils authentifiés ?

**Les comptes ne sont pas propres au Club : c'est le compte du site.** Il n'existe qu'une
identité, Firebase Auth, et le Club est un **droit posé dessus**.

- Identité : `src/contexts/AuthContext.tsx:58` (`onAuthStateChanged`), deux fournisseurs —
  e-mail/mot de passe (`:93`, `:113`) et Google OAuth (`:142-145`). Pas de SSO tiers, pas de
  magic link.
- Profil applicatif : document `users/{uid}` lu au montage (`src/contexts/AuthContext.tsx:63-72`),
  avec garde explicite contre la course d'identité (`:67`, `:78`). Rôle par défaut `'student'`
  (`:119`, `:154`).
- Rôles : `'student' | 'admin' | 'support'`, appliqués côté écran par
  `src/components/routing/ProtectedRoute.tsx:38-73` — `AdminRoute` refuse hors `['admin','support']`
  (`:61`) et borne le rôle `support` par une table partagée (`:69`, `src/lib/adminAccess.ts`).
  Côté serveur, `firestore.rules:44-48` (`isAdminOrSupport`) relit le rôle **dans la base**, pas
  dans les claims du jeton.

**L'appartenance au Club est un document, `club_subscriptions/{uid}`**, avec `status` et
`expiresAt` :

- écrit en `'pending'` par `createClubCharge` (`worker/apps/api/src/handlers/payments.ts:217-228`),
  échéance à un an (`:213-215`) ;
- passé à `'active'` **uniquement par le webhook** (`worker/apps/api/src/webhook/bictorys.ts:140`) ;
- prix `CLUB_PRICE = 19900` (`worker/apps/api/src/lib/bictorys.ts:123`), miroir manuel de
  `src/lib/club/pricing.ts:31`, gardé par `tests/unit/club-pricing.test.ts` qui lit les deux
  fichiers **en texte** — la porte que le prix n'avait pas quand les CGV annonçaient 10 000
  pendant que le code débitait 19 900 (`worker/apps/api/src/lib/bictorys.ts:127-138`).

**Le cloisonnement réel est dans les règles, pas dans le navigateur.** `firestore.rules:872-892`
pour l'abonnement (l'utilisateur ne peut créer qu'un `'pending'` `:881`, et ne peut **pas** changer
son propre `status` `:885`), et le prédicat `hasActiveClubSub()` (`firestore.rules:82-86`) garde
les onze collections du Club : `club_challenges` (`:893`), `club_profiles` (`:899`),
`club_opportunities` (`:907`), `conversations` (`:915`), `club_posts` (`:946`), `club_events`
(`:1007`), `club_sessions` (`:1019`), `club_blocks` (`:1041`), `club_infos` (`:1046`).

Le prédicat d'affichage vit ailleurs et le dit : `src/lib/club/membership.ts:41-50`,
avec l'avertissement `:16-18` « ce n'est pas la garde ». **⚠️ Écart assumé à connaître :** la
règle serveur `hasActiveClubSub()` ne lit que `status == 'active'` et **ignore `expiresAt`**
(`firestore.rules:84-85`), là où le client exige une échéance future
(`src/lib/club/membership.ts:45-49`). Un abonnement expiré mais resté `active` en base garderait
donc l'accès aux données tout en perdant l'onglet. *À vérifier en production* : lire les
`club_subscriptions` dont `expiresAt < now` et `status == 'active'` (console Firestore ou
`/admin/club-digitos`).

---

### Q3 — Comment fonctionne la vérification de certificats, et où sont stockées les données ?

**Deux collections, et c'est tout le mécanisme.**

| Collection | Contenu | Lecture | Écriture |
|---|---|---|---|
| `certificates/{uid}_{formationId}` | le certificat nominatif : `userId`, `formationId`, `formationTitle`, `issuedAt`, `certificateCode`, `userName`, `lessonsCompleted` | propriétaire ou admin — `firestore.rules:763` | **`allow create: if false`** (`:768`), **`allow update: if false`** (`:771`) |
| `certificate_lookups/{certificateCode}` | le miroir public : `certificateCode`, `formationTitle`, `issuedAt`, `holderName` — **aucun UID** | **`allow read: if true`** (`firestore.rules:793`) | **`allow write: if false`** (`:794`) |

**L'émission est exclusivement serveur.** `worker/apps/api/src/handlers/issueCertificate.ts` :

- authentification obligatoire (`:25`), idempotence (`:34-38`) ;
- **la complétion est re-dérivée** de l'ensemble réel des leçons de la formation, pas lue dans le
  scalaire `progress` que le client peut écrire (`:55-71`, motif `:10-13`) ;
- code `MM-` + 10 hexadécimaux issus de `crypto.randomUUID()` (`:74`) ;
- **écriture des deux documents** : le certificat (`:80-92`) et le miroir public (`:111-116`) ;
- courrier au titulaire, dont l'échec n'empêche jamais l'émission (`:131-153`).

**La vérification publique lit le miroir, jamais le certificat.** `src/lib/firestore/certificates.ts:37-40`
fait un `getDoc` direct sur `certificate_lookups/{code}` — un `get`, jamais une liste, parce que
`certificates` est identifié par `{uid}_{formationId}` et qu'ouvrir sa lecture permettrait
d'énumérer tous les certificats émis, donc de compter les clients (`firestore.rules:779-790`).

Deux surfaces la consomment :
- `/verifier` — saisie d'un code par un tiers (`src/pages/VerifyCertificate.tsx:9`), avec trois
  réponses distinctes dont « la vérification n'a pas abouti », séparée de « aucun certificat »
  (`:31-37`, `:54-59`) ;
- `/certificat/:code` — affichage d'un certificat dont on a le lien (`src/App.tsx:518`,
  `src/pages/lms/Certificate.tsx:43-62`), pré-rendu au bord avec son propre `og:` et un
  `noIndex` conservé (`worker/apps/site/src/prerender/certificat.ts`).

**⚠️ Cicatrice récente, à ne pas rouvrir.** Le miroir public avait été **perdu** au retrait des
Cloud Functions (commit `e3a2775`) : la fonction supprimée écrivait deux documents, le port n'en
a gardé qu'un, et rien n'échouait — tout certificat émis à partir du 03/09/2026 était
invérifiable, en silence. Rétabli le 05/09/2026
(`worker/apps/api/src/handlers/issueCertificate.ts:94-110`). **⚠️ Le stock antérieur** : le dépôt
ne dit pas si les certificats émis entre le 03/09 et le 05/09 ont été rattrapés. Un backfill
réservé aux admins est mentionné (`firestore.rules:789`) mais aucun script du dépôt ne le porte.
*Pour le savoir* : comparer le nombre de documents `certificates` et `certificate_lookups`
(console Firestore), ou passer chaque `certificateCode` de `certificates` sur `/verifier`.

La suite de règles couvre les deux collections : `tests/firestore-rules/rules.test.ts:238-270`
(lecture anonyme par code, écriture refusée même à l'admin, immutabilité, certificat privé fermé
aux tiers).

---

### Q4 — Quelles URL sont indexées et reçoivent des liens entrants ? Quel volume de trafic par section ?

**Ce que le dépôt sait : ce qu'il PROPOSE à l'indexation.**

Le sitemap est **calculé à la volée par le Worker**, il n'existe aucun fichier statique —
`worker/apps/site/src/seo/sitemap.ts`, servi sur `/sitemap.xml`
(`worker/apps/site/src/routes.ts:134`). Chaque page produit **deux** entrées, FR et EN, partageant
trois alternates `hreflang` (`sitemap.ts:59-88`).

- **16 chemins statiques** en dur (`sitemap.ts:90-120`) : `/`, `/a-propos`, `/blog`,
  `/formations`, `/podcast-et-videos`, `/club-des-digitos`, `/faq`, **`/agence`** (`:107`),
  **`/presence-digitale`** (`:108`), `/contact`, `/verifier`, et les cinq pages `/legal/*`.
- **4 collections Firestore** filtrées `status == 'published'` (`sitemap.ts:20-46`, `:123-128`,
  `:200-203`) : `blog` → `/blog/<slug>`, `formations` → `/formations/<slug>`, `podcasts`,
  `videos`. L'URL anglaise utilise `slug_en` s'il existe, sinon le slug FR (`:190`).
- **les questions de la FAQ**, une URL par question (`sitemap.ts:219-230`).
- **Dédoublonnage par paire** (`sitemap.ts:132-168`) : trois articles étaient déclarés deux fois
  avec des `hreflang="en"` contradictoires, ce qui fait ignorer le cluster entier par Google. Le
  code les neutralise ; **le commentaire dit explicitement que le doublon vit toujours en base**
  (`:152-154`).

**Ce qui est exclu de l'indexation** : `public/robots.txt` interdit `/admin`, `/mon-espace`,
`/checkout`, `/paiement`, `/403` et leurs cinq jumelles anglaises (`:3-7`, `:18-22`). Au bord,
`shouldNoIndex()` pose `X-Robots-Tag: noindex, nofollow` sur les trois pages d'authentification
et sur `/presence-digitale/devis/` (`worker/apps/site/src/routes.ts:105-115`).

**Les redirections existantes** — et c'est un point du §3.4 :
- **`firebase.json:131-157` ne porte que cinq 301, toutes anglaises** (`/en/digital-presence` →
  `/en/local-presence`, `/en/my-space` → `/en/my-learning`, `/en/login` → `/en/sign-in`). **Aucune
  redirection FR au niveau de l'hébergement.**
- Une table dynamique existe en base — collection Firestore `redirects`, `kind: 'via' | 'path'`
  (`worker/apps/site/src/redirects.ts:39`, `:152-183`), administrée depuis `/admin/redirections`
  (`src/App.tsx:551`). **⚠️ Son contenu est invisible depuis le dépôt** : on ne peut pas savoir
  d'ici si le 301 `/podcasts → /podcast-et-videos`, annoncé en commentaire dans `src/App.tsx`,
  existe réellement en production. *Pour le savoir* : `/admin/redirections`, ou lire la collection.
- `VIA_FALLBACK = '/agence'` (`worker/apps/site/src/redirects.ts:22`) : **tout lien d'attribution
  `/via/<slug>` inconnu retombe sur `/agence`**. Cette adresse n'est donc pas seulement liée de
  l'extérieur, elle est une **cible de repli du système**. La supprimer sans la rediriger casserait
  ce filet ; le remplacement de `VIA_FALLBACK` doit accompagner la 301.

> **État au 17/09, arbre de travail** — le Lot 1 a traité ce point pendant l'écriture de ce
> document, et bien : `/agence` et `/presence-digitale` ont quitté `PRERENDER_EXACT`
> (`worker/apps/site/src/routes.ts:28-37`, motif : une page pré-rendue n'atteint jamais la règle de
> redirection), `worker/apps/site/src/static-redirects.ts` porte les 301 au bord,
> `firebase.json:141-181` porte les mêmes règles comme filet de repli, et
> `worker/apps/site/test/redirects.test.ts:340` **compare les deux tables** — 26 tests au vert.
> Le sitemap a suivi : `worker/apps/site/src/seo/sitemap.ts:119-123` déclare les cinq nouvelles
> adresses et plus les deux anciennes. Le piège était réel — une URL du sitemap qui répond 3xx est
> une **erreur** pour `npm run seo:check` (`scripts/seo-check.mjs:201-206`) — et il est fermé.

**Ce que le dépôt NE SAIT PAS : le trafic. Aucun chiffre, nulle part.**

C'est une réponse, pas une lacune de l'audit. Il n'existe dans le dépôt **aucun export Search
Console, aucun export GA4, aucune mesure de clics, d'impressions, de position ou de sessions**.
Le seul artefact d'exécution est `.recrawl-failed.txt` (4 URL en échec de re-scrape Facebook), qui
n'est pas du trafic.

Ce qui existe est le **tuyau**, pas la donnée : `scripts/gsc-pull.py` interroge l'API Search
Console sur 28 jours glissants (`:47-53`) — top 12 par requête (`:67`), top 12 par page (`:71`),
total (`:75`) — et **écrit le résultat dans Airtable** (`:12-13`, `:55-60`). Il n'écrit aucun
fichier local (`:84`). Il exige deux identifiants hors dépôt : une clé de compte de service
(`:10`, fichier gitignoré par `.gitignore:32`) et `AIRTABLE_PAT` lu depuis `.env.local` (`:15-25`).
Propriété ciblée : `sc-domain:maxmorrys.me` (`:11`).

| Ce qu'il faut savoir | Où le chercher |
|---|---|
| Clics / impressions / CTR / position, par requête et par page | Search Console `sc-domain:maxmorrys.me`, ou la base Airtable alimentée par `python3 scripts/gsc-pull.py` |
| État d'indexation (pages exclues, « page avec redirection ») | rapport « Indexation des pages » de GSC — `gsc-pull.py` ne pompe **pas** cette API |
| Sessions, sources, pages vues | GA4 `G-5EFPZ71YX0` via GTM `GTM-PJ3R433M` (`index.html:120-123`) |
| Nombre réel d'URL indexées au sitemap | `curl -s https://maxmorrys.me/sitemap.xml \| grep -c '<loc>'`, ou `npm run seo:check` qui l'affiche (`scripts/seo-check.mjs:134`) |
| Conformité réelle de toutes les URL servies | `npm run seo:check -- --all` |
| Clics sur les liens d'attribution `/via/<slug>` | champs `hits`, `lastHitAt`, `lastReferrerHost` de la collection `redirects` (`worker/apps/site/src/redirects.ts:246-263`) |

**Conséquence pour le Lot 0 : la condition de sortie « relevé des URL indexées et du trafic » du
CDC §9.1 ne peut PAS être remplie depuis le dépôt.** Elle exige un accès Search Console. C'est le
seul point du Lot 0 qui reste ouvert après cet audit, et il est bloquant pour la priorisation
éditoriale — pas pour le choix de scénario, qui est tranché au §2 ci-dessous.

---

### Q5 — Quels contenus sont en base de données, et lesquels sont en dur ?

C'est la question qui chiffre le Lot 1, et la réponse est nette : **presque toute la copie
commerciale est en dur, dans les catalogues i18n.** Le contenu éditorial récurrent, lui, est en
base.

**En base (Firestore) — 4 collections publiques indexées + les surfaces internes :**

| Contenu | Collection | Preuve |
|---|---|---|
| Articles de blog | `blog` | `src/lib/firestore/blog.ts:6-11`, `:24`, `:58` |
| Formations / cours | `formations` | `src/lib/firestore/formations.ts:33-37`, `:51`, `:62` |
| Podcasts | `podcasts` | `src/lib/firestore/content.ts:12-16`, `:39` |
| Vidéos | `videos` | `src/lib/firestore/content.ts:62-70`, `:93` |
| FAQ **de `/faq`** | `faq` | `src/lib/firestore/content.ts:116-125` |
| Annonces | `announcements` | `src/lib/firestore/admin.ts:250`, `:256` |
| Témoignages | `testimonials` | `src/lib/firestore/content.ts:153-178` |
| Club (posts, agenda, sessions, infos, défis, profils, opportunités) | `club_*` | `src/lib/firestore/club.ts:89-291` |
| Chiffres publics du Club | `public_stats/club` | `src/lib/firestore/club.ts:46` |
| Prospects et devis | `agency_leads`, `agency_quotes`, `engagement_leads` | `src/lib/firestore/agency.ts:46-111`, `missions.ts:56-102` |
| Redirections | `redirects` | `src/lib/firestore/redirects.ts:22` |

**⚠️ Deux collections alimentées mais non rendues en public :**
- **`testimonials`** — `getFeaturedTestimonials` (`content.ts:157`) et `getApprovedTestimonials`
  (`content.ts:161`) n'ont **aucun appelant** dans `src/pages` ni `src/components` ; seuls
  l'espace apprenant (`src/components/layout/StudentLayout.tsx:104`) et la console admin les
  lisent. Retrait volontaire, documenté `src/pages/Formations.tsx:28-41`.
- **`src/lib/mockData.ts`** — 439 lignes de contenu éditorial complet (6 articles, 4 formations
  avec prix, podcasts, vidéos, témoignages, FAQ, annonces), **sans aucun import** dans `src/` ni
  `tests/`. Code mort, candidat à suppression au Lot 1 : il fait croire à un contenu qui n'existe
  nulle part.

**En dur — c'est là que vit le coût de la refonte de présentation.**

23 catalogues par langue, `src/i18n/locales/{fr,en}/` (6 838 lignes FR, 6 836 EN). Ce qui porte du
**contenu** et non du libellé :

| Fichier | Ce qu'il porte | Preuve |
|---|---|---|
| `fr/presence.json` (451 l.) | **toute l'offre commerçants** : `packs` (`:109`), `plans` (`:165`), `options` (`:202`), `terms` (`:260`) et **6 Q/R de FAQ figées** (`:274`) | — |
| `fr/agency.json` (453 l.) | **toute la page agence** : `capabilities` (`:41`), **10 descriptions de projets clients** (`work.projects.*`, `:118`), `band.types` (`:383`), `process.steps` (`:411`), **6 Q/R de FAQ** (`:214`) | — |
| `fr/about.json` (428 l.) | parcours, 8 blocs d'expériences, **11 jalons datés** (`:204`), `stack.items` (`:292`) | — |
| `fr/legal.json` (298 l.) | **le texte contractuel intégral** : mentions (`:9`), confidentialité (`:46`), CGV articles 1 à 10 (`:117`), CGU (`:195`), cookies (`:248`) | — |
| `fr/home.json` (129 l.) | **toute la page d'accueil** : `hero.titleLines`, `territories` (`:17`), `me` (`:38`), `why` (`:77`), `presence` (`:88`), `free` (`:110`) | — |
| `fr/club.json` (473 l.) | argumentaire d'abonnement (`:352`) et **4 Q/R de FAQ** (`:431`) | — |

Et les données structurées hors i18n, en TypeScript :
- grille tarifaire réelle de l'offre TPE — `src/lib/presence/offer.ts:96-139` (`PACKS`, `PLANS`,
  `OPTIONS`, `TERMS`, `QUOTE_VALIDITY_DAYS`, `DEPOSIT_RATE`) ;
- **le portfolio : 11 projets clients et 3 ventures, entièrement en TS**, aucun Firestore —
  `src/lib/brand/clients.ts:63`, `src/lib/brand/ventures.ts:46`, rendus par
  `src/components/agency/ClientWorkIndex.tsx` ;
- identité légale — `src/lib/brand/company.ts:50-63` (RCCM, NINEA, capital, adresse), **dupliquée**
  dans `fr/legal.json:9` ;
- prix du Club — `src/lib/club/pricing.ts:31`, miroir manuel de cinq autres fichiers (`:14-26`) ;
- taxonomie éditoriale du blog — `src/lib/blogCategories.ts:11-18` ;
- jalons « À propos » — structure et empreinte en TS (`src/lib/about/milestones.ts:22`, `:40`,
  `:85`), textes en i18n : couplage fragile par construction, gardé par `npm run proof:check`.

**Les cinq cas mixtes qui coûtent le plus cher au Lot 1 :**

1. **La FAQ a trois sources parallèles** — la base (`/faq`), et trois blocs figés dans
   `presence.json:274`, `agency.json:214`, `club.json:431`. Une même question peut diverger.
   `fr/faq.json` (55 l.) ne contient **aucune question** : c'est du chrome pur autour d'un contenu
   Firestore.
2. **Toutes les pages de détail Firestore ont leur SEO en i18n** — `BlogPost`, `FormationDetail`,
   `PodcastDetail`, `VideoDetail`, `FAQQuestion`, avec des gabarits partagés dans `fr/shared.json`.
3. **Deux chaînes de traduction coexistent** : le contenu Firestore est traduit à la volée par
   callable (`src/lib/contentTranslation.ts`, `src/hooks/useTranslatedContent.ts:9`) avec repli sur
   `slug_en` en base ; l'i18n est traduit à la main.
4. **Le portfolio est scindé TS / i18n** : métadonnées en TS, descriptions en i18n via
   `descriptionKey` (`src/lib/brand/clients.ts:55`). Ajouter une réalisation — ce que le CDC §8
   demande, 4 à 6 fois — exige **deux fichiers × deux langues**, et un `descriptionKey` orphelin
   fait simplement disparaître le bloc, sans erreur.
5. **Libellés légaux hors i18n** : `src/components/site/LegalPage.tsx:38-44` code cinq libellés
   français en dur, dans une zone par ailleurs entièrement traduite.

**Conséquence de chiffrage.** Refaire la présentation ne touche presque pas à la base : les quatre
collections indexées ne bougent pas, et leurs URL non plus. Le travail réel du Lot 1 est
**d'écrire et de traduire des catalogues i18n**, plus un modèle de données à créer pour les
réalisations (§8 du CDC) — que rien n'oblige à mettre en base, puisque le portfolio existant est
déjà en TypeScript.

---

## 2 · Le §6.2 — choix de scénario

### Recommandation : **scénario A — refonte de la présentation sur le socle existant. Sans réserve.**

Le CDC pose la règle par défaut et demande de ne s'en écarter que si l'audit démontre un blocage
réel. **L'audit n'en démontre aucun.** Il démontre l'inverse : le socle est sain, modifiable, et
le Lot 1 le modifie déjà pendant que ce document s'écrit.

**1. Le scénario B repose sur une prémisse fausse.** Le §6.2 décrit « un socle existant rigide
mais fonctionnel », formulation qui vise un CMS tiers dont on ne détiendrait pas le rendu. Ici, le
« socle » **est** l'application : React 18.3.1 / Vite 5.4.2, dépôt détenu
(`origin https://github.com/Rysmo77/maxmorrys.git`), design system dans le dépôt
(`src/design-system/`, alias `@ds` en `vite.config.ts:76` et `tsconfig.app.json:23`). Il n'y a rien
dont se découpler.

**2. Il n'y a pas de couture où couper.** Le site vitrine et le transactionnel partagent, au même
niveau : le routeur (`src/App.tsx:583-592`, monté deux fois pour FR/EN), la table de segments
i18n (`src/i18n/segments.ts:188-196`), le contexte d'authentification, le design system, et le
**pipeline SEO**. Découper « les pages de contenu » en Astro signifierait dupliquer les cinq.

**3. Le SEO est produit par le Worker, pas par React — et ce Worker n'a pas de doublure.**
`worker/apps/site/src/index.ts:8-28` l'écrit sans ambiguïté : « ce Worker est le producteur
UNIQUE du SEO, il n'a pas de doublure », et le repli sur l'origine sert un shell nu. Le
pré-rendu injecte les métadonnées et le JSON-LD dans le shell SPA récupéré à l'origine
(`worker/apps/site/src/prerender/index.ts`, `prerender/shell.ts`). Un site Astro remplacerait ce
pipeline entier — sitemap (`seo/sitemap.ts`), RSS, RSS podcast, catalogue produits
(`seo/catalog.ts`), cartes de partage, table de redirections au bord — c'est-à-dire **l'actif SEO
que le CDC §3.4 interdit explicitement de mettre en risque.**

**4. La cohérence avec My Onoma est déjà traitée par miroir, et c'est le bon mécanisme.**
`src/lib/brand/practices.ts:15` et `src/lib/brand/clients.ts`, `ventures.ts`, `company.ts` sont
des miroirs déclarés du dépôt My Onoma, gardés par des tests
(`tests/unit/pages-commerciales-miroir.test.ts`). Partager des **jetons** ne demande pas de
partager un **runtime** : `scripts/ds-sync.mjs:32-66` copie déjà littéralement un kit externe dans
`src/design-system/css/`, et `npm run ds:check` prouve la copie octet pour octet en CI
(`.github/workflows/ci.yml:40-41`). Le même mécanisme accueillera les jetons My Onoma.

**5. Le coût de A est connu et il est faible.** D'après le §Q5 : quatre pages à écrire, des
catalogues i18n à produire et traduire, un modèle de réalisations, des 301. Aucune migration de
données. Aucune reprise du chemin de l'argent — lequel vient précisément d'être remis en état
après un incident de routage (§Q1), ce qui est le pire moment pour y toucher.

### Ce qui me ferait changer d'avis

Trois choses, et aucune n'est constatée aujourd'hui :

1. **Un budget de performance que le SPA ne peut pas tenir sur la piste Conception.** C'est le seul
   argument sérieux pour Astro, et il n'est **pas mesuré** : il n'existe aujourd'hui aucun budget
   chiffré dans le dépôt (§3, exigence 2). Si la mesure montrait que la page mère `/conception`
   ne peut pas descendre sous le budget My Onoma sans sortir du bundle React, un **îlot statique
   pour les seules pages de la piste Conception** serait à rouvrir — pas un découplage général.
   *Pour le savoir* : poser le budget My Onoma, mesurer `/conception` une fois la page écrite.
2. **Une décision de faire de maxmorrys.me un sous-site de My Onoma**, avec un socle Astro
   partagé et une équipe unique. C'est une décision d'organisation, pas un constat technique ; le
   CDC §3.1 dit l'inverse (« un seul site, un seul domaine »).
3. **Une impossibilité de tenir le registre de vouvoiement sur le socle actuel.** Ce n'est pas le
   cas — mais il y a une porte à ouvrir, et elle est bloquante aujourd'hui : voir §5.

---

## 3 · Les exigences du §6.3 contre l'existant

| # | Exigence | Verdict | Preuve principale |
|---|---|---|---|
| 1 | Système de design partagé | **Conforme** (au kit Max-Morrys ; les jetons My Onoma restent à intégrer) | `src/design-system/`, `vite.config.ts:76`, `.github/workflows/ci.yml:40-41` |
| 2 | Budgets de performance | **Non conforme** | aucun budget chiffré dans le dépôt |
| 3 | Accessibilité WCAG 2.2 AA | **Partiellement conforme** | gardes ponctuelles réelles, aucun outillage transverse |
| 4 | Mesure d'audience sans cookie | **Non conforme** | `index.html:120-123`, `:130-151` |
| 5 | Données structurées | **Conforme** — les 7 types demandés existent | `worker/apps/site/src/prerender/` |
| 6 | AVIF + repli WebP + dimensions + différé | **Non conforme** | 0 fichier `.avif` dans le dépôt |
| 7 | Dépôt git détenu | **Conforme**, réserve de gouvernance | `git remote -v` |
| 8 | Documentation d'exploitation | **Non conforme** | `DEPLOYMENT.md` et `README.md` jamais modifiés depuis le commit initial |
| 9 | Réversibilité | **Partiellement conforme** | rollback Worker documenté, rollback frontend nulle part |

### 1 — Système de design partagé · **Conforme**

`src/design-system/` existe avec un barrel unique généré (`src/design-system/index.ts`), l'alias
`@ds` déclaré des deux côtés (`vite.config.ts:76`, `tsconfig.app.json:23`), et des jetons CSS
réels (`src/design-system/css/tokens/`). `scripts/ds-sync.mjs:32-66` copie **littéralement** le kit
source ; `scripts/ds-check.mjs` vérifie cette copie octet pour octet (AD-1, `:103-118`), la
génération des jetons (AD-8, `:121-157`), et sept autres règles dont le plancher de contraste
(AD-25, `:325-382`). La barrière est en CI au même rang que le lint
(`.github/workflows/ci.yml:40-41`).

**Ce qui manque pour satisfaire la lettre du CDC** : le kit partagé est celui de Max-Morrys. Les
jetons My Onoma ne sont pas dans ce dépôt. C'est un **ajout au kit source**, pas une
reconstruction — `ds:sync` fait déjà entrer un kit externe.
**⚠️ Réserve documentée par le code** : `scripts/ds-check.mjs:88-101` — la liste `MOBILE` est vide
depuis le 05/09/2026, donc « un `ds:check` vert ne dit rien de l'application native ».

### 2 — Budgets de performance · **Non conforme**

Aucun budget chiffré et opposable n'existe : pas de configuration Lighthouse, pas de fichier de
budget, aucune étape de poids ou de perf dans `.github/workflows/ci.yml:24-93`. Les seuls chiffres
(`README.md:349-354` : FCP < 1,5 s, LCP < 2,5 s, CLS < 0,1) vivent dans une prose non exécutable,
dans un fichier jamais modifié depuis le commit initial (voir exigence 8).

`src/lib/web-vitals.ts:19-43` mesure bien LCP, INP, CLS, FCP et TTFB — mais les pousse
**uniquement dans `window.dataLayer`**, donc vers GTM puis GA4. Trois conséquences : aucun seuil
n'est appliqué, la mesure de performance transite par le même conteneur que la publicité **donc
est soumise au consentement** (voir exigence 4), et aucune livraison ne peut échouer sur un budget.

`scripts/covers-weight.mjs` n'est pas un budget : c'est un outil de réencodage a posteriori du
stock R2, invoqué à la main. `tests/unit/first-view-graph.test.ts` s'en approche mais vérifie la
**joignabilité du graphe d'imports** (`FORBIDDEN = ['firebase/firestore']`, `:43`), pas des octets.

**Correction bon marché** : le graphe d'imports est déjà instrumenté ; y ajouter une assertion de
poids et une étape CI est un chantier d'heures, pas de jours. C'est la première chose à faire du
Lot 1, parce que le CDC en fait la condition de la piste Conception (« elle ne peut pas être plus
lente que le site qu'elle est censée démontrer »).

### 3 — Accessibilité WCAG 2.2 AA · **Partiellement conforme**

Ce qui existe est mieux que la moyenne, et **mécaniquement gardé** :
- skip-link réel et traduit — `src/design-system/react/navigation/TopBar.tsx:79`, `:91`, `:98`,
  câblé sur `#main-content` par `src/components/layout/Header.tsx:540` ;
- anneau de focus unifié, gardé par `tests/unit/focus-ring.test.ts` (26 sites en infraction
  relevés au 01/09/2026, dont 16 en `focus:` au lieu de `focus-visible:`) ;
- contraste **calculé, pas déclaré** — `tests/unit/ink-contrast.test.ts` + règle AD-25 de
  `scripts/ds-check.mjs:325-382` ;
- `prefers-reduced-motion` honoré en 15 endroits, dont `src/design-system/css/brand/fallback.css`.

Ce qui manque, et qui empêche d'affirmer AA :
- **aucune dépendance a11y** — ni `axe-core`, ni `jest-axe`, ni Playwright (`package.json:29-82`) ;
- aucun test d'arbre d'accessibilité : rien ne vérifie l'ordre de tabulation, les pièges de focus,
  les libellés de formulaires, `aria-invalid`, ni la **taille de cible 24 × 24 px qui est une
  nouveauté de WCAG 2.2** ;
- aucun audit ni déclaration d'accessibilité au dépôt ; `docs/UX-AUDIT.md:111` ne fait que
  *recommander* le traitement de `Modal` et `Input` ;
- cas explicite : `src/components/site/CoverImage.tsx:66` pose `alt=""` systématiquement et sans
  échappatoire — défendable pour du décoratif, faux dès qu'une image porte de l'information.

Le CDC exige AA **y compris sur le tunnel d'achat et l'espace membre**, qui sont précisément les
zones que les gardes actuelles ne couvrent pas.

### 4 — Mesure d'audience sans cookie · **Non conforme, frontalement**

L'architecture de mesure est l'exact opposé de l'exigence :
- **Google Tag Manager** `GTM-PJ3R433M` → GA4, `index.html:120-123` et `:168` ;
- **Meta Pixel** `925361066071417`, `index.html:130-151`, avec **Advanced Matching** (envoi d'un
  e-mail haché) — `src/lib/meta-pixel.ts:22-78` ;
- identifiants injectés au build avec repli en dur — `.github/workflows/ci.yml:319-320`, `:356-357` ;
- **aucun tracker sans cookie** : pas de Plausible, Matomo, Umami ni Cloudflare Web Analytics.

Le Consent Mode v2 (`index.html:71-99`, `src/lib/tracking.ts:5-12`) **ne supprime pas les
cookies, il retarde leur pose**. Et la bannière est **globale, pas limitée au tunnel d'achat** :
`CookieBanner` est monté dans les trois layouts (`src/App.tsx:248`, `:290`, `:315`).

**⚠️ Défaut de conformité indépendant du CDC, à corriger quoi qu'il arrive** :
`src/components/shared/CookieBanner.tsx:96` → `useState(true)` — la case « mesure d'audience »
est **pré-cochée**. Le commentaire `:146` du même fichier revendique pourtant l'inverse (« jamais
un consentement, qui ne peut être qu'un acte positif »). Un « Enregistrer mes choix » sur une case
pré-cochée n'est pas un consentement valide.

C'est le chantier le plus lourd du §6.3 : remplacer GA4 + Pixel par une mesure sans cookie n'est
pas un réglage. **Décision commerciale à prendre** : le Meta Pixel sert la publicité payante et la
Conversions API côté serveur (`worker/apps/api/src/lib/meta-capi.ts`, appelée depuis le webhook de
paiement `worker/apps/api/src/webhook/bictorys.ts:270-286`). Le retirer coûte de l'attribution
publicitaire.

### 5 — Données structurées · **Conforme**

Les sept types demandés existent tous, **et du bon côté** : dans le pré-rendu du Worker, donc dans
ce que les robots lisent réellement (le balisage posé par React après hydratation n'est vu de
personne — c'est exactement le défaut corrigé, documenté dans
`tests/unit/pages-commerciales-miroir.test.ts:10-18`).

| Type | Preuve |
|---|---|
| Organization | `worker/apps/site/src/prerender/static-pages.ts:35` |
| WebSite (+ `SearchAction`) | `worker/apps/site/src/prerender/static-pages.ts:45` |
| Article | `worker/apps/site/src/prerender/content.ts:136` |
| Course (+ `Offer`) | `worker/apps/site/src/prerender/content.ts:187`, `:190` |
| PodcastEpisode | `worker/apps/site/src/prerender/content.ts:252` |
| FAQPage | `worker/apps/site/src/prerender/faq.ts:116`, `:192` |
| BreadcrumbList *(bonus)* | `worker/apps/site/src/prerender/meta.ts:93` |

Le JSON est échappé contre l'injection (`prerender/meta.ts:84`). Les cinq nouvelles routes ont
reçu leurs entrées pendant l'écriture de ce document —
`worker/apps/site/src/prerender/static-pages.ts:238`, `:311`, `:374`, `:429`, `:458` — ce qui était
le point critique : une route absente de ce fichier n'a **aucune** métadonnée pour les moteurs,
et s'affiche pourtant parfaitement pour un humain.

### 6 — Images AVIF avec repli WebP, dimensions explicites, chargement différé · **Non conforme**

Point par point, sans ambiguïté :

- **AVIF : non produit.** `vite.config.ts:62-69` passe bien `avif: { quality: 65 }` à
  `ViteImageOptimizer`, mais ce sont des **paramètres d'encodage appliqués aux fichiers portant
  déjà l'extension** — le plugin ne convertit pas de format. Preuve matérielle :
  `find public dist -name '*.avif'` → **0 fichier**, contre 14 `.webp` et 96 `.jpg/.png`.
- **Repli WebP : non**, puisqu'il n'y a pas d'AVIF à replier. Le WebP existe comme format
  *principal* sur trois portraits — `src/lib/author.ts:57-63`, qui assume explicitement que « le
  repli des navigateurs sans WebP n'existe pas : la cible est 2026 ».
- **`<picture>` / `<source type>` : absent** de tout le code. `srcSet` n'apparaît que deux fois
  (`src/pages/Home.tsx:503`, `src/pages/About.tsx:263`). **Aucune négociation de format.**
- **Dimensions explicites : non, décision contraire assumée.** `src/components/site/CoverImage.tsx:60-76`
  ne pose ni `width` ni `height` ; l'en-tête `:18-20` le justifie par `aspect-ratio` en CSS. Le
  CLS est bien couvert (`:71`), l'exigence littérale ne l'est pas.
- **Chargement différé : oui.** `src/components/site/CoverImage.tsx:67` (`loading={priority ? 'eager' : 'lazy'}`)
  + `decoding="async"` (`:68`), avec exception LCP justifiée `:15-17`.

**Le code documente lui-même son propre écart** : `CoverImage.tsx:26-32` — les fichiers en base
pèsent ~750 Ko pièce, le redimensionnement d'images Cloudflare n'est pas actif sur la zone
(`/cdn-cgi/image/…` répond 404), et « la correction est en amont — conversion en AVIF/WebP au
téléversement, ou activation du redimensionnement — pas ici ».

**⚠️ Contrainte réelle qui limite la portée de l'exigence** : `scripts/covers-weight.mjs:12-24`
explique que le stock reste en JPEG **délibérément**, parce que le robot Facebook/WhatsApp ne lit
pas le WebP. L'AVIF pour l'affichage et le JPEG pour les `og:image` doivent donc coexister ; une
règle « tout en AVIF » casserait les aperçus de partage, qui viennent d'être refaits.

### 7 — Dépôt git détenu · **Conforme, avec une réserve de gouvernance**

`origin https://github.com/Rysmo77/maxmorrys.git`, trois workflows (`ci.yml`, `proof-links.yml`,
`seo-check.yml`). **Réserve** : le dépôt est hébergé sur un **compte personnel** (`Rysmo77`), pas
sur une organisation. Si l'exigence vise la détention par MY ONOMA SARL, c'est un transfert de
propriété à prévoir — le code ne peut pas en dire plus. *À trancher par l'humain.*

### 8 — Documentation d'exploitation · **Non conforme**

Preuve décisive par l'historique : `git log -1 -- DEPLOYMENT.md` et `git log -1 -- README.md`
renvoient tous deux **`fd5cf14`, 07/03/2026, « Initial commit »**. Ces deux fichiers n'ont jamais
été touchés, alors que la plateforme a entre-temps changé de fournisseur.

- `DEPLOYMENT.md:199-219` décrit un déploiement **exclusivement Firebase**. Zéro mention de
  Cloudflare, de `wrangler`, des trois Workers, de R2, ou de la suppression de `functions/`.
- `README.md` : aucune occurrence de `cloudflare`, `worker`, `wrangler`. Sa liste de scripts
  (`:366-386`) ne mentionne **aucune** des commandes que la CI exécute réellement (`ds:*`,
  `vues:*`, `seo:check`, `proof:check`, `og:cards`).
- Le répertoire `functions/` est absent du disque (supprimé le 03/09/2026 sur décision
  utilisateur), fait documenté uniquement dans des commentaires de code
  (`worker/apps/site/wrangler.jsonc:34-44`).
- La seule documentation d'exploitation **à jour** est `worker/README.md` (25/08/2026) : elle
  couvre les Workers, elle n'est référencée nulle part, et elle ne décrit pas le déploiement du
  frontend.
- `docs/` (20 fichiers) est du contenu stratégique, marketing et juridique. **Aucun runbook.**

C'est un écart bon marché à combler et il est **bloquant pour la réversibilité contractuelle**
(exigence 9), qui suppose un document qu'un tiers puisse suivre.

### 9 — Réversibilité · **Partiellement conforme**

Ce qui existe est de bonne qualité :
- **rollback du Worker `api` à trois crans** — `worker/README.md:31-35` : retirer un nom de
  `MIGRATED` (une callable, ~15 s), vider `VITE_FUNCTIONS_ORIGIN` (toutes, un build), supprimer le
  domaine `api.maxmorrys.me` (tout, immédiat). Doublé d'un harnais de parité pré-bascule
  (`worker/scripts/callable-parity.mjs`) ;
- **rollback du Worker `site`** — `worker/apps/site/wrangler.jsonc:7-13` : « supprimer la route —
  effet immédiat, sans propagation ». L'origine `max-morrys.web.app` est **hors zone Cloudflare**
  (`:28`), donc le repli vers Firebase Hosting est fonctionnel par construction ;
- ⚠️ mais **dégradé, et le code le dit** : `worker/apps/site/src/index.ts:8-28` — le repli sert un
  shell sans métadonnées prérendues, et les flux (`/sitemap.xml`, `/rss.xml`, `/podcast.xml`,
  `/catalog.csv`) **n'ont aucun repli**.

Ce qui manque :
- **aucun chemin de rollback pour le frontend.** `.github/workflows/ci.yml:322-327` déploie sur
  `channelId: live` ; le retour arrière dépend de la console Firebase Hosting, **procédure
  documentée nulle part** (aucune occurrence de « rollback » ou « réversibilité » dans
  `DEPLOYMENT.md`, `README.md`, `docs/*.md` hors sujet) ;
- **les Workers ne sont pas déployés par la CI** — `.github/workflows/seo-check.yml:14` le dit
  (« `wrangler deploy` reste manuel ») ; le rollback est donc manuel et non traçable. Les règles
  Firestore sont dans le même cas ;
- **aucune procédure de restauration des données** (Firestore, R2). `DEPLOYMENT.md:303` ouvre une
  section « Sauvegardes », rien ne décrit une restauration testée.

---

## 4 · La recette du §9.2 — ce qui est automatisable ici, et ce qui ne l'est pas

Le dépôt possède **une CI à six jobs** (`.github/workflows/ci.yml`) et deux rendez-vous
hebdomadaires (`proof-links.yml` lundi 07:00, `seo-check.yml` lundi 07:30). La recette du CDC
tombe largement dedans — mais pas partout, et les trous sont exactement les points qui coûtent de
l'argent.

| # | Point de recette du §9.2 | Automatisable ici | Main humaine |
|---|---|---|---|
| 1 | Aucune URL existante de blog / formation / podcast n'a changé — **vérification exhaustive** | **Oui, à 90 %.** `npm run seo:check -- --all` télécharge **toutes** les URL du sitemap en se faisant passer pour un robot et refuse tout statut ≠ 200 (`scripts/seo-check.mjs:201-210`). Complété par `tests/unit/internal-links.test.ts` (tout lien interne littéral pointe sur une route déclarée) et `tests/unit/segments-sync.test.ts` (les trois copies de la table de segments — front, Worker, `robots.txt` — restent d'accord). | Exiger `--all` et non l'échantillon de 24 : le défaut d'une refonte est justement la page qu'on n'échantillonne pas. **Comparer au sitemap d'AVANT bascule** : `seo:check` vérifie la cohérence du sitemap courant, pas qu'il contient toujours les mêmes URL. Capturer `curl /sitemap.xml` avant, diffé après. |
| 2 | Les 301 de `/presence-digitale` et `/agence` sont en place et **testées** | **Oui.** `worker/apps/site/test/redirects.test.ts` compare la table du bord à celle de `firebase.json` (`worker/apps/site/src/static-redirects.ts:26-30`). `tests/unit/redirect-conflicts.test.ts` attrape boucles et chaînes. Le job `workers` de la CI les exécute (`ci.yml:134-136`). | **Un `curl -I` réel après bascule**, sur les quatre adresses et leurs jumelles EN : la table peut être juste et la route Cloudflare mal déployée — `wrangler deploy` n'est **pas** dans la CI. Vérifier aussi le remplacement de `VIA_FALLBACK = '/agence'` (`worker/apps/site/src/redirects.ts:22`). |
| 3 | **Achat d'une formation de bout en bout, par Wave, par Orange Money et par carte** | **Non, et aucune automatisation ne l'atteindra.** Ce qui est couvert : le calcul du total (`worker/apps/api/test/checkout-remise-club.test.ts`), le classement des lignes (`test/ligne-business.test.ts`), la facture (`test/invoice.test.ts`), le routage des callables (`npm run vues:check`, `ci.yml:59-60`), et les règles d'écriture de `transactions` (`tests/firestore-rules/rules.test.ts:318-395`). | **Trois achats réels, avec de l'argent réel**, sur les trois moyens. Ce sont trois chemins **chez Bictorys**, pas trois branches du code : le site n'envoie même pas `payment_type` (`worker/apps/api/src/lib/bictorys.ts:21-28`). Vérifier à chaque fois : la `transactions/{id}` passe de `pending` à `completed`, l'`enrollments/{uid}_{formationId}` est créé, la facture arrive. **Exiger aussi un échec volontaire** (paiement annulé) : la branche `failed` efface un abonnement Club en attente (`webhook/bictorys.ts:290-300`) et personne ne la joue jamais. |
| 4 | Connexion au Club et vérification d'un certificat testées après bascule | **Partiellement.** Les règles sont couvertes — `tests/firestore-rules/rules.test.ts:238-270` (vérification anonyme par code, immutabilité du miroir) et `:210-237` (l'agenda reste fermé aux non-membres). `npm run test:rules` en CI (`ci.yml:140-158`). **⚠️ Exige un JDK 21** ; en local : `export JAVA_HOME=/opt/homebrew/opt/openjdk@21`. | **Se connecter avec un vrai compte membre** et ouvrir le fil, l'agenda et l'annuaire. **Émettre un vrai certificat** et le vérifier sur `/verifier` **et** sur `/certificat/<code>` : la perte du miroir public de septembre n'a produit **aucune erreur**, elle a seulement rendu les certificats invérifiables. C'est le défaut type que seule une main humaine voit. |
| 5 | Depuis l'accueil, un visiteur atteint sa piste en un clic — vérifié sur les deux pistes | **Partiellement.** `tests/unit/internal-links.test.ts` prouve que les liens **résolvent** ; `tests/unit/route-namespaces.test.ts` prouve que chaque route précharge les namespaces i18n qu'elle lit (sans quoi `t()` rend la clé et la page tombe). | Le « en un clic » est un jugement de mise en page : personne ne l'automatise. À faire à 390 px **et** au clavier seul. |
| 6 | La page commerces et TPE porte son bandeau de segment ; **Projets sur mesure ne contient aucun tutoiement** | **Oui, pour le registre — la porte existe et elle est bidirectionnelle.** `tests/unit/voix-tutoiement.test.ts:109` échoue sur tout tutoiement dans `conception.json` / `realisations.json`, `:100` sur tout vouvoiement ailleurs. ⚠️ Sa table `PISTE_CONCEPTION` (`:81`) est écrite à la main — voir §5, point 1. Le bandeau, lui, se garde par un test de présence de clé, **à écrire**. | Relire les deux pages. Un test de registre attrape le pronom, pas le ton. |
| 7 | Budgets de performance tenus sur la piste Conception et les pages de contenu | **Non — rien n'existe.** Voir §3, exigence 2 : aucun budget chiffré, aucune étape CI, `web-vitals` n'envoie que dans `dataLayer`. | **Poser d'abord le budget My Onoma**, puis mesurer. Sans chiffre opposable, ce point de recette n'a pas de critère de passage — il ne peut ni réussir ni échouer. |
| 8 | Accessibilité AA vérifiée, **y compris sur le tunnel d'achat** | **Partiellement.** `tests/unit/focus-ring.test.ts` (anneau du système), `tests/unit/ink-contrast.test.ts` (ratios calculés), AD-25 dans `ds:check`. | Tout le reste : navigation clavier complète du tunnel `/checkout/:slug` → `/paiement/retour`, lecteur d'écran, cibles 24 × 24 px de WCAG 2.2. **Aucun outil a11y n'est installé** (`package.json`) — en ajouter un est un prérequis de ce point, pas une option. |
| 9 | Les trois liens vers My Onoma sont en place et **pointent vers des pages publiées** | **Oui, et c'est déjà le métier d'un script.** `npm run proof:links` (`node scripts/proof-check.mjs --links`) vérifie que les adresses publiées répondent, chaque lundi (`.github/workflows/proof-links.yml:20`, `:38`). Y ajouter les trois cibles My Onoma. | Vérifier que les pages disent **ce que le CDC §5.1 annonce**. Et tenir le séquencement du §9.1 : ne livrer le Lot 1 qu'**après** la mise en ligne de My Onoma. |
| 10 | Aucune prestation de direction marketing, stratégie de marque ou acquisition n'est proposée à la vente | **Automatisable, à écrire.** Le patron existe : `tests/unit/interdits-preuve-sociale.test.ts` interdit déjà note et nombre d'inscrits sur toute surface visiteur, en lisant les catalogues. Un test jumeau sur un vocabulaire d'interdits (« stratégie de marque », « acquisition », « direction marketing ») appliqué à `conception.json` et `realisations.json` coûte une heure. | Un arbitrage éditorial : la frontière entre « décrire » et « vendre » ne se grepe pas. `src/lib/brand/practices.ts:9-16` donne la règle (Cléa est une practice **sœur**, jamais une sous-traitante). |

**Deux gardes qui ne sont pas dans la liste du CDC et qui doivent y entrer :**

- **`npm run proof:check`** (`.github/workflows/ci.yml:89-90`) — aucune date figée ni chiffre écrit
  dans la prose i18n. Le CDC §4.1 exige que « chaque chiffre porte sa date » sur la preuve
  d'audience de l'accueil : c'est exactement ce que ce script fait respecter, via `<Num source asOf>`.
  La preuve d'audience du nouvel accueil **échouera** si elle est écrite en dur, et c'est voulu.
- **`npm run og:check`** (`ci.yml:76-77`) — aucune page n'annonce une carte de partage dont le
  fichier n'existe pas. Les cinq nouvelles routes en auront besoin.

---

## 5 · Les portes du dépôt face à la refonte — et ce qui reste à trancher

> **Lecture de cette section.** L'arbre de travail a bougé pendant l'audit. Plusieurs des écarts
> relevés en cours de lecture ont été refermés par le Lot 1 avant la publication de ce document :
> ils sont conservés ici parce qu'ils décrivent des **pièges structurels** qui se rouvriront à la
> prochaine route ajoutée, pas seulement des défauts d'un jour.

### 1. ⛔ La règle de registre est une porte de CI — elle vient d'être scindée, et sa table est à tenir

`tests/unit/voix-tutoiement.test.ts` interdisait `vous / votre / vos` dans **tous** les catalogues
`src/i18n/locales/fr/*.json`. Ce test tourne dans `npm test`, étape obligatoire de la CI
(`.github/workflows/ci.yml:65-66`). Le CDC §3.1 exige au contraire **le vouvoiement strict** sur la
piste Conception : les deux ne pouvaient pas être vrais ensemble. Mesuré en cours d'audit, avant
correction : **35 chaînes de vouvoiement dans `conception.json`, 4 dans `realisations.json`, test
rouge**.

La règle est désormais **par piste, et bidirectionnelle** — c'est la bonne forme :

- `tests/unit/voix-tutoiement.test.ts:100` — aucun catalogue ne vouvoie, **hors piste Conception** ;
- `:109` — **la piste Conception ne tutoie jamais**, motif `TUTOIEMENT` à `:87`.

Une suppression pure aurait rouvert les 91 chaînes de vouvoiement qui vivaient dans quatorze
catalogues, dont 23 sur la seule page agence, et qu'aucune porte ne voyait (`:10-16`).

**⚠️ Ce qui reste à tenir** : `PISTE_CONCEPTION` (`tests/unit/voix-tutoiement.test.ts:81`) est une
liste écrite à la main, aujourd'hui `{conception.json, realisations.json}`. **Un catalogue de la
piste Conception oublié dans cette liste retombe sous la règle du tutoiement**, et devient rouge
pour une raison qui n'a rien à voir avec ce qu'on vient d'écrire. À noter que `presence.json` reste
volontairement du côté tutoiement : `/conception/commerces-et-tpe` garde son ton direct (CDC §4.2),
et seul son bandeau de segment le situe.

### 2. ⚠️ Cinq miroirs suivent le renommage des routes — et quatre sont rouges à cette heure

`npm test` au moment d'écrire : **10 tests en échec sur 938**, tous imputables au renommage de
`/agence` et `/presence-digitale`, et tous sur des **surfaces greffées à côté des pages**, jamais
sur les pages elles-mêmes.

| Test rouge | Ce qu'il garde |
|---|---|
| `tests/unit/og-cards-coverage.test.ts` (5 échecs) | les cinq nouvelles routes n'ont **pas encore de carte d'aperçu** — `npm run og:cards` reste à passer, et `npm run og:check` est en CI (`ci.yml:76-77`) |
| `tests/unit/popup-registry.test.ts` (4 échecs) | le dispositif de pop-ups est encore **ciblé sur `/agence`** : l'aiguilleur, la retenue de devis et `presenceExit` visent des chemins qui n'existent plus |
| `tests/unit/pages-commerciales-miroir.test.ts` | le miroir des deux pages commerciales entre `src/` et `prerender/static-pages.ts` |
| `tests/unit/og-territory-sync.test.ts` | la correspondance route → territoire de couleur des cartes de partage |
| `tests/unit/kit-coverage.test.ts` | chaque écran du kit a son fichier dans le produit |

C'est la mesure honnête du coût d'un changement d'URL sur ce dépôt : **la page se refait vite, ses
miroirs non.** Aucun de ces défauts ne casse un rendu ; tous ne se voient que d'ici.

### 3. ⚠️ Deux pièges structurels, refermés cette fois, à connaître pour la prochaine route

- **Une page pré-rendue n'atteint jamais une règle de redirection.** Tant qu'une source figure dans
  `PRERENDER_EXACT`, le Worker la sert depuis le bord et la 301 n'existe pour personne — les deux
  fichiers sont justes séparément (`worker/apps/site/src/static-redirects.ts:14-21`). C'est aussi
  pourquoi la `Location` doit être un chemin relatif et non l'absolu que rendrait l'origine
  `max-morrys.web.app` (`:22-27`).
- **Le pré-rendu est le producteur unique du SEO** (`worker/apps/site/src/index.ts:8-28`). Une route
  absente de `prerender/static-pages.ts` est servie en shell nu : `SEOHead` écrit après hydratation,
  dans un DOM qu'aucun robot ne construit. **Rien n'échoue** — la page s'affiche parfaitement pour un
  humain. Le seul endroit d'où ça se voit est `npm run seo:check`, qui tourne le lundi.

### 4. Décisions humaines qui ne sont pas dans le code

- **Le contrat Bictorys** : conditions, commission réelle, entité signataire. Le dépôt ne porte
  qu'une hypothèse de projection (`finance/hypotheses.csv:22`).
- **Le trafic par section** (CDC §9.1, condition de sortie du Lot 0) : exige un accès Search
  Console. **Aucun chiffre ne doit être écrit avant.**
- **Le sort du Meta Pixel** : l'exigence §6.3 de mesure sans cookie le condamne, la Conversions API
  côté serveur en dépend pour l'attribution des achats.
- **La propriété du dépôt** : compte personnel `Rysmo77` plutôt qu'une organisation.
- **Le stock de certificats émis entre le 03/09 et le 05/09** : rattrapés ou non (§Q3).
- **Les abonnements Club `active` mais expirés** : l'écart entre la règle serveur et le prédicat
  client (§Q2).

---

## 6 · Conclusion en une page

Le socle est **sain, détenu, testé et modifiable**. Le chemin de l'argent est un agrégateur unique
(Bictorys) derrière un webhook signé, idempotent, dont les effets précèdent le marquage — c'est du
code qu'on ne refait pas pour une raison d'apparence. L'accès à vie est l'absence d'échéance sur un
document d'inscription ; l'identité est Firebase Auth et le Club un droit posé dessus ; la
vérification de certificats repose sur un miroir public sans UID, écrit par le serveur seul.

**Scénario A, sans réserve.** Il n'y a pas de couture où découpler, parce qu'il n'y a pas de tiers :
le vitrine et le transactionnel partagent le routeur, l'i18n, l'authentification, le design system
et un pipeline SEO qui n'a pas de doublure. La cohérence avec My Onoma passe déjà par des miroirs
gardés en CI, ce qui est le bon mécanisme.

Le coût réel du Lot 1 n'est **pas** technique : c'est de la **copie**. Presque toute la matière
commerciale vit dans les catalogues i18n, en deux langues, et le portfolio est en TypeScript. Les
quatre collections indexées ne bougent pas, et leurs URL non plus.

Trois écarts du §6.3 sont de vrais chantiers et doivent être arbitrés avant de commencer : la
mesure sans cookie (qui coûte de l'attribution publicitaire), l'accessibilité AA du tunnel d'achat
(aucun outil installé), et les images AVIF (aucune n'existe, et la contrainte du robot Facebook
impose une coexistence). Deux écarts sont bon marché et devraient être faits d'abord : le budget de
performance en CI, sans lequel le point 7 de la recette n'a **pas de critère de passage**, et le
runbook d'exploitation, sans lequel la réversibilité n'est pas opposable.

Enfin, la CI est rouge à l'instant où ce document se ferme : **10 tests sur 938**, tous imputables
au renommage de `/agence` et `/presence-digitale` en cours, et tous sur des miroirs greffés à côté
des pages — cartes d'aperçu, registre des pop-ups, miroir des pages commerciales. Aucun ne casse un
rendu ; c'est exactement pour ça qu'ils existent. C'est la mesure la plus utile que ce Lot 0
produise sur le coût réel d'un changement d'URL ici : **la page se refait vite, ses miroirs non.**

*Ce document est daté. Il décrit `HEAD = 33c3e4e` et un arbre de travail en mouvement le
17/09/2026. Chaque constat porte le fichier et la ligne qui l'établissent : les rejouer contre le
code coûte moins cher que de les croire.*
