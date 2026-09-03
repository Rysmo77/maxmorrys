# Audit des règles Firebase — 03/09/2026

Projet `max-morrys` (unique, pas de séparation dev/staging/prod).
Portée : `firestore.rules` (852 lignes), `storage.rules` (278 lignes), Firebase Auth, et les
écritures serveur qui contournent ces règles (`functions/`, Worker Cloudflare).

**Pas de Realtime Database** dans ce projet : ni `database.rules.json`, ni entrée `database`
dans `firebase.json`. Rien à auditer de ce côté.

---

## 1. Point de départ

Les règles n'étaient pas un chantier vierge, et c'est ce qui rend l'exercice utile : le
catch-all `if false` est en place aux deux endroits, aucune règle `if true` en écriture ne
traîne, les formulaires publics récents (`engagement_leads`, `agency_leads`, `newsletter`)
sont validés champ par champ, et un socle de 61 tests tournait déjà contre l'émulateur.

Les failles trouvées ne sont donc pas des oublis de débutant. Ce sont, presque toutes, la
**même erreur répétée** : une règle dit *quels champs* peuvent bouger, jamais *comment*.
`hasOnly(['likes'])` autorise à remplacer le tableau entier. `role` verrouillé laisse les
trente autres champs libres. Trois affirmations vérifiées (`completed`, `free`, `amount: 0`)
sont trois affirmations que l'écrivain fournit lui-même.

---

## 2. Ce qui a été corrigé

### 🔴 C-1 — Tous les codes promo actifs étaient servis au public

**`firestore.rules`, collection `coupons`** — `allow read: if resource.data.active == true`

La règle portait le commentaire « everyone can read active coupons to validate them ».
Personne ne les validait ici : la seule validation qui compte est `validateCoupon()`
([payment.ts:75](functions/src/payment.ts#L75)), exécutée par le SDK Admin, qui relit la
collection **en contournant ces règles**. Le client n'envoie qu'un `couponCode` au callable.

**Scénario d'attaque** — une requête, sans compte :

```js
getDocs(query(collection(db, 'coupons'), where('active', '==', true)))
// → tous les codes en cours, leur type, leur valeur, leur plafond d'utilisations
```

La condition `resource.data.active == true` ne protège rien : elle est *satisfaite* par le
filtre de l'attaquant. C'est le piège classique de la lecture par liste — la règle s'évalue
document par document, donc une requête qui demande exactement ce que la règle autorise
passe en entier.

**Correction** : `allow read: if isAdmin();` — vérifié au préalable que `getAllCoupons()`
n'est appelé que par `AdminCoupons.tsx`. Aucun parcours public ne lit la collection.

---

### 🔴 C-2 — `referralRewarded` : la garde anti-double-récompense était écrivable par sa cible

**`firestore.rules`, collection `users`** — `allow update` ne verrouillait que `role` et `uid`

`onReferralConversion` ([referrals.ts:28](functions/src/referrals.ts#L28)) s'arrête sur :

```ts
if (!u?.referredByCode || u.referralRewarded) return;
```

C'est la **seule** protection contre une double récompense de parrainage (+100 XP et le badge
Ambassadeur au parrain). Le champ vit sur `users/{uid}`, c'est-à-dire dans le document que
son propre bénéficiaire pouvait réécrire. Le client ne l'écrit jamais — mais une requête
forgée n'a pas à passer par le client.

Deux autres abus tenaient dans la même ouverture, et ceux-là sont directement exploitables
depuis l'interface :

- **usurpation de code** — `referralCode` est écrivable (il figure dans
  `ALLOWED_PROFILE_FIELDS`). La récompense part à
  `where('referralCode','==',code).limit(1)` : deux porteurs du même code, et c'est le
  premier document rendu qui encaisse, pas le légitime ;
- **changement de parrain après coup**, pour rejouer une conversion.

**Correction** : `hasOnly()` sur le miroir exact de `ALLOWED_PROFILE_FIELDS`. Les deux champs
de parrainage se **posent une fois** et ne se rejouent pas — ce qui reflète exactement le
code client (`getOrCreateReferralCode()` n'écrit que si le champ est absent, `Register.tsx`
sort si `referredByCode` existe déjà). Restent hors d'atteinte : `role`, `uid`, `email`,
`createdAt`, `referralRewarded`.

> ⚠️ **Cette liste et `ALLOWED_PROFILE_FIELDS` doivent bouger ensemble.** Un champ ajouté
> côté client sans être ajouté ici échouera *silencieusement* — c'est le mode de panne déjà
> rencontré avec `tutorName`.

---

### 🟡 M-1 — Une vente à zéro pouvait se poser sur la formation la plus chère

**`firestore.rules`, collection `transactions`**

L'ancienne règle vérifiait `status == 'completed'`, `paymentMethod == 'free'` et
`amount == 0`. Ces trois affirmations sont fournies par l'écrivain. Le prix réel du produit
n'était lu nulle part.

L'accès au contenu n'en était pas ouvert — `enrollments` vérifie le prix depuis un commit
antérieur. Mais la **comptabilité** prend tout : le tableau de bord admin, le chiffre
d'affaires et les relances par courriel lisent cette collection, et une transaction inventée
y est indiscernable d'une vraie.

**Correction** : `isFreeFormation(formationId)` — le prédicat que `enrollments` applique
déjà. Les deux écritures d'un parcours gratuit racontent maintenant la même histoire. Une
porte `allow create: if isAdmin()` a été ajoutée pour la saisie manuelle, qui n'existait pas.

---

### 🟡 M-2 — Les likes du Club sont des tableaux d'UID, réécrivables en entier

**`firestore.rules`, `club_posts` et `club_infos`**

`likes` et `reposts` ne sont pas des compteurs mais des **tableaux d'identifiants**
(`arrayUnion(userId)` / `arrayRemove(userId)` côté client). La règle disait
`hasOnly(['likes', 'reposts', 'commentsCount'])` : quels champs bougent, jamais comment.
`commentsCount` était borné à ±1 ; les deux tableaux passaient en entier.

Un membre actif pouvait donc vider les likes d'un post qui le dérange, ou s'en attribuer
mille en y listant des UID. Et l'auteur d'un post, lui, avait le document entier ouvert par
la première branche — `userId` compris, alors que le commentaire au-dessus affirmait
« userId immuable ». Or `userId` porte le droit de suppression : le post changeait de main.

**Correction** : un helper `togglesOwnMark(field)` n'autorise qu'une bascule d'un seul
identifiant, celui de l'appelant — le traitement que `pollVotes` recevait déjà. L'auteur
édite son texte et ne touche plus ni à la propriété ni aux compteurs sociaux.

---

### 🟡 M-3 — `temp/` acceptait n'importe quel binaire de 50 Mo

**`storage.rules`, `match /temp/{userId}/{fileName}`**

Le seul chemin en écriture ouvert à tout compte connecté **sans contrôle de
`contentType`** — exécutables et pages HTML comprises, sur un domaine Google au nom du
projet. Le dossier ne se lit que par son propriétaire, mais un fichier déposé s'atteint
aussi par une URL signée, qui se partage.

**Correction** : les mêmes familles de types que partout ailleurs dans le fichier.

---

### 🟢 Corrections mineures

| # | Règle | Ce qui était ouvert |
|---|-------|---------------------|
| m-1 | `notifications/{uid}/items` | « Mark as read » ouvrait le document entier : titre, lien et date de ce que le serveur avait envoyé. Réduit à `['read', 'readAt']`. |
| m-2 | `videos` | Le compteur de vues montait sur un **brouillon**, ce qui revient à confirmer son existence. `blog` posait déjà la condition. |
| m-3 | `appointments` | Formulaire public sans plafond de champs, contrairement à `engagement_leads` et `agency_leads`. Plafond à 12 clés + `status` forcé à `pending`. |
| m-4 | `messages` | Idem : plafond à 12 clés, `status` forcé à `new`. |
| m-5 | `gamification` | Les bornes ne portaient que sur cinq champs ; un sixième pouvait se glisser dans un document que le serveur relit pour le classement. `hasOnly` sur `GamificationProfile`. |

---

## 3. Ce qui reste ouvert — décisions à prendre

Ces points sont réels mais leur correction demande un arbitrage ou du code serveur. Ils ne
sont **pas** corrigés dans cette passe.

### 🟡 R-1 — L'XP reste cultivable en boucle

`gamification` autorise `+500 XP par écriture`, sans limite **de fréquence**. Rien
n'empêche vingt écritures d'affilée. Les bornes ralentissent, elles n'arrêtent pas. Cet XP
alimente le classement public et les badges de parrainage.

Les règles Firestore ne savent pas compter les écritures dans le temps sans un document
compteur, et ce document serait lui-même écrit par le client. **Le seul vrai correctif est
de déplacer les écritures de gamification côté serveur** (callable + Admin SDK), ce que le
commentaire dans les règles reconnaît déjà comme la dette « audit S2 ».

### 🟡 R-2 — Les rôles vivent dans Firestore, pas dans les custom claims

`isAdmin()` fait un `get()` sur `users/{uid}` à **chaque évaluation de règle**. Ce n'est pas
exploitable aujourd'hui — `role` est immuable côté propriétaire, et je l'ai revérifié — mais
deux conséquences tiennent :

1. **coût** — une lecture facturée par vérification, sur des pages qui en enchaînent ;
2. **fragilité** — la sécurité du rôle repose entièrement sur l'exactitude d'une règle
   d'écriture. Un custom claim, lui, n'est pas dans la base.

Migration : `setCustomUserClaims()` dans `adminUpdateUserRole`, puis `request.auth.token.role`
dans les règles. À faire en double lecture (`claim || firestore`) le temps que les jetons
existants se renouvellent, sinon tous les admins perdent leurs droits jusqu'à reconnexion.

### 🟡 R-3 — `testimonial_media` est en lecture publique, y compris non modéré

`allow read: if true` sert les témoignages **approuvés** sur le site — mais sert aussi ceux
en attente et ceux refusés. Un enregistrement vidéo envoyé puis retiré reste servi à qui
connaît son URL. Le chemin (UID + nom horodaté) n'est pas devinable, mais ce n'est pas une
autorisation.

Atténuation existante : l'application n'écrit **plus** dans ce bucket — les médias passent
par le Worker Cloudflare et R2 ([src/lib/storage.ts](src/lib/storage.ts)). Le correctif
appartient donc au Worker. À vérifier : ce que le Worker sert sous `media.maxmorrys.me` pour
un témoignage non approuvé.

### 🟢 R-4 — `agency_quotes` : création publique sans authentification

La validation est stricte (11 clés max, aucune donnée personnelle admise, prix bornés), mais
un robot peut créer des devis en masse. Coût et pollution, pas fuite. Un plafond côté Worker
ou un jeton de formulaire serait la réponse proportionnée.

### 🟢 R-5 — Compteurs de vues incrémentables par des anonymes

`blog` et `videos` acceptent un `+1` sans authentification — c'est le prix d'un compteur qui
fonctionne pour les visiteurs déconnectés. Un script peut donc gonfler les vues et générer
des écritures facturées. Le durcissement (exiger un compte) casserait la fonctionnalité ;
la vraie réponse est un compteur agrégé côté Worker, comme celui des pop-ups.

### 🟢 R-6 — `club_profiles` et `enrollments/{id}/progress/{lessonId}` sans allowlist

Deux écritures propriétaire sans `hasOnly`. Pas de champ sensible relu par le serveur à ce
jour — donc pas de faille exploitable, mais les deux portes restent ouvertes à un futur
champ qui, lui, comptera.

### 🟢 R-7 — Aucune borne `request.query.limit` sur les `list`

Aucun `allow list` ne contraint la taille de la requête. Un admin ou un membre peut demander
la collection entière. Question de coût, pas d'accès.

---

## 4. Deux observations hors règles

**`max-morrys-28f5d199939f.json`** — une clé de compte de service
(`firebase-adminsdk-fbsvc@max-morrys.iam.gserviceaccount.com`, privilèges Admin complets,
donc *contournement total* de tout ce fichier de règles) est présente en clair à la racine du
dépôt. **Elle n'est pas suivie par git** — `.gitignore:32` la couvre par `max-morrys-*.json`,
et `git ls-files` le confirme. Le risque résiduel est local (sauvegarde, partage d'écran,
outil tiers qui lit le répertoire). À déplacer hors du dépôt si elle sert encore ; à révoquer
dans la console GCP si elle ne sert plus.

**`getLeaderboard()`** ([src/lib/gamification.ts:169](src/lib/gamification.ts#L169)) fait un
`list` non filtré sur `gamification`, que les règles refusent à tout non-admin. La fonction
n'est appelée nulle part — le vrai classement lit l'agrégat `leaderboard/global`. C'est du
code mort qui échouerait s'il était rebranché.

---

## 5. Scorecard

| Domaine | Avant | Après | 🔴 | 🟡 | 🟢 |
|---|---|---|---|---|---|
| Firestore — contrôle d'accès | 6/10 | **9/10** | 2 corrigées | 3 corrigées | — |
| Firestore — validation des données | 6/10 | **8,5/10** | — | 1 corrigée | 5 corrigées |
| Storage | 7/10 | **8,5/10** | — | 1 corrigée | 1 reste (R-3) |
| Authentication | 6/10 | 6/10 | — | 1 reste (R-2) | — |
| Realtime Database | — | — | *non utilisé* | | |
| Tests | 7/10 | **9/10** | 61 → **99 tests** | | |

Restant ouvert après cette passe : **0 critique**, **3 majeurs** (R-1, R-2, R-3), **4 mineurs**.

---

## 6. Vérification

```
npm run test:rules   → 99 tests passés (61 existants + 38 ajoutés)
npm test             → 700 tests passés (44 fichiers)
storage.rules        → chargées sans erreur par l'émulateur Storage
```

Les 38 nouveaux tests couvrent chaque règle modifiée **dans les deux sens** : le scénario
d'attaque est refusé, et le parcours légitime passe toujours. Les cas de non-régression sont
préfixés `NON-REGRESSION` — ce sont eux qui diront si un durcissement casse le produit, et ils
le diront ici plutôt qu'en production.

> ⚠️ `npm run test:rules` exige un JDK 21 : `export JAVA_HOME=/opt/homebrew/opt/openjdk@21`
> avant la commande, sinon l'émulateur démarre sur le Java 8 du PATH et échoue.

---

## 7. Déploiement

Les règles Firestore et Storage **ne sont pas déployées par la CI** — c'est manuel.
Sauvegarde des versions précédentes dans `.rules-backup/` (ignoré par git).

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

À vérifier juste après, dans cet ordre — ce sont les parcours que cette passe a touchés :

1. **Console admin → Coupons** : la liste s'affiche (règle réécrite en `isAdmin()`)
2. **Profil utilisateur** : modifier nom, bio, ville, nom du répétiteur → enregistré
3. **Parrainage** : générer son code depuis un compte qui n'en a pas → posé
4. **Club** : aimer un post, le dé-aimer, commenter, voter à un sondage
5. **Inscription à une formation gratuite** : parcours complet jusqu'au lecteur
6. **Formulaire de rendez-vous** et **formulaire de contact** depuis une fenêtre privée
7. **Notifications** : marquer comme lue
8. Console Firebase → **Firestore → Règles** : vérifier l'horodatage de publication

Surveiller ensuite les `permission-denied` dans les logs : un durcissement mal calibré se
voit là, et le retour arrière est un `cp` depuis `.rules-backup/` suivi du même `deploy`.
