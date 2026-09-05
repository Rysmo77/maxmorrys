---
title: 'La couche de données native — le contrat HTTP+JSON commun à Compose et SwiftUI'
type: 'spec'
created: '2026-09-05'
status: 'draft'
review_loop_iteration: 0
context:
  - 'worker/apps/api/src — le serveur, qui fait autorité'
  - 'git 9c22076:mobile/donnees — le port React Native retiré, lu pour ce qui était déjà résolu'
  - 'tests/unit/worker-{routage-callables,vues-natives,certificats}.test.ts'
---

# La couche de données native

Le backend NE BOUGE PAS. Il est déjà écrit, déjà déployé, déjà gardé par trois suites de
tests, et c'est lui qui arbitre : partout où le port React Native et le Worker se
contredisent, **c'est le Worker qui a raison**, et cette spécification le note.

Trois sources, dans cet ordre de préséance :

1. `worker/apps/api/src/` — le code servi.
2. `tests/unit/worker-*.test.ts` — des invariants déjà payés, dont deux ont été écrits
   *après* une panne de production.
3. `git show 9c22076:mobile/donnees/*` — 1 195 lignes de client supprimé. Elles ne font pas
   autorité, mais elles portent des décisions qui ont coûté du temps à prendre.

⚠️ **Trois affirmations du mandat ont été rejouées contre le code et se sont révélées
inexactes.** Elles sont corrigées ici, à leur place : la lecture `data ?? result` (§A.4), le
tri des paramètres du cache (§D.2), et « trois causes de panne de transport » (§C.3). Aucun
document d'audit du dépôt n'a été cru sur parole.

---

## A · Le protocole

Une seule porte : `https://api.maxmorrys.me`. C'est le protocole `onCall` de Firebase
Functions, réimplémenté à la main dans `worker/packages/shared/src/oncall.ts`, dont l'en-tête
dit avoir été relevé directement dans `@firebase/functions` (`oncall.ts:1-17`).

### A.1 · La requête

```
POST https://api.maxmorrys.me/<nom>
Content-Type: application/json
Authorization: Bearer <ID token Firebase>      ← facultatif au transport, voir A.3

{"data": <charge>}
```

Vérifié :

- **`POST /<nom>`, et rien d'autre.** `index.ts:63-64` prend le chemin et retire les `/` de
  tête ; `index.ts:87` refuse toute méthode ≠ POST, un nom vide, **et tout nom contenant un
  `/`**. Il n'existe donc pas de chemin imbriqué : `/app/moi` est un 404, seul `/appMoi` est
  une callable.
- **L'enveloppe est plus stricte que « `{"data":…}` ».** `readCallableBody`
  (`oncall.ts:93-119`) exige quatre choses, et le manquement à n'importe laquelle donne le
  même `400 INVALID_ARGUMENT` avec le message littéral `Bad Request` :
  1. le type MIME doit être **exactement** `application/json` (le `charset` est toléré :
     `oncall.ts:96-97` coupe sur `;`) ;
  2. le corps doit être du JSON analysable ;
  3. la racine doit être un objet non nul ;
  4. la clé `data` doit être **définie**.

  Conséquences pour un client natif : `{}` est REFUSÉ (`data` absente), `{"data":null}` est
  accepté, et un `Content-Type` posé par défaut par la bibliothèque HTTP (`text/plain`,
  `application/x-www-form-urlencoded`) fait échouer **toutes** les callables d'un coup, avec
  un message qui ne dit pas pourquoi.

  → **Règle native :** le corps est toujours `{"data": …}`, avec un objet — vide si l'appel
  n'a pas de paramètre, jamais absent. Le port RN l'imposait par défaut de paramètre
  (`appel.ts:159` : `data: unknown = {}`).

- **Le corps est lu une seule fois, en texte** (`oncall.ts:94`), parce que le même flux sert
  aux vérifications de signature des webhooks. Sans effet côté client, mais c'est ce qui
  explique la forme de `CallContext.raw` (`context.ts:63`).

### A.2 · La réponse

**Succès — toujours HTTP 200 :**

```json
{"result": <charge>}
```

`callableResult` (`oncall.ts:122-127`) écrit `{"result": result ?? null}`. Un handler qui ne
renvoie rien produit donc `{"result": null}`, pas un corps vide.

**Erreur — statut HTTP dérivé du code :**

```json
{"error": {"status": "RESOURCE_EXHAUSTED", "message": "…", "details": {…}}}
```

- `status` est le nom canonique en **MAJUSCULES_SOULIGNÉES** (`oncall.ts:60-62`), jamais la
  forme à tirets. Un client qui comparerait à `resource-exhausted` ne reconnaîtrait rien.
- `details` n'est présent que si le handler en a fourni (`oncall.ts:149`).
- La table code → statut HTTP est à `oncall.ts:39-57`. Les seuls statuts qu'un client mobile
  rencontrera : 400 (`invalid-argument`, `failed-precondition`), 401 (`unauthenticated`),
  403 (`permission-denied`), 404 (`not-found`), 409 (`already-exists`), 429
  (`resource-exhausted`), 500 (`internal`), 503 (`unavailable`).
- **Une exception non typée ne fuite jamais.** `callableError` (`oncall.ts:135-143`) la
  remplace par `internal` / « Une erreur interne est survenue. » et journalise le vrai
  message côté serveur. Le client ne peut donc pas afficher de trace, et ne doit pas essayer
  d'en extraire une.

### A.3 · Ce qui authentifie — et ce qui n'authentifie pas

Le routeur **n'exige jamais de jeton**. `index.ts:114` appelle le vérificateur avec
`bearerFrom(request)`, et `createIdTokenVerifier` (`packages/firebase-auth-rest/src/verify.ts:40-61`)
**renvoie `null` — sans jamais lever** — pour un jeton absent, malformé, expiré, ou émis pour
un autre projet. `context.auth` vaut alors `null`, et c'est **chaque handler** qui décide, via
`requireAuth` (`context.ts:78-81`) ou `requireAdmin` (`context.ts:90-99`).

Quatre conséquences qui décident du code natif :

1. **Un jeton expiré et un jeton absent sont indiscernables** : les deux donnent
   `401 UNAUTHENTICATED` avec le message du handler. Le client ne peut pas distinguer « ta
   session a expiré » de « tu n'es pas connectée » sur la seule réponse.
   → **Règle native :** sur un `401`, tenter **une** fois un rafraîchissement forcé du jeton
   (`getIdToken(forceRefresh = true)` / `getIDTokenForcingRefresh(true)`) et rejouer l'appel.
   Un second `401` seulement fait basculer la session en `Anonyme`. Le port RN n'avait pas ce
   rejeu : il s'appuyait sur `getIdToken()` du SDK JS, qui rafraîchit tout seul à l'approche
   de l'expiration (`firebase.ts:65-69`).
2. **La révocation de session n'est pas vérifiée** (`verify.ts:36-38`, aligné sur le défaut de
   `firebase-admin`). Un jeton volé reste valide jusqu'à son expiration naturelle.
3. **Le compte de service contourne `firestore.rules`** (`context.ts:74-77`). Chaque handler
   refait ses contrôles ; `tests/unit/worker-vues-natives.test.ts:49-90` interdit d'en oublier
   un. Le client n'a rien à refaire — mais il ne doit rien supposer non plus : une vue
   « vide » peut être un refus déguisé (§F.4).
4. **Les en-têtes CORS sont posés même sans `Origin`** (`cors.ts:15-17`, repli sur la première
   origine autorisée). Sans effet sur un client natif — aucun navigateur ne les applique — et
   sans risque : la liste n'est jamais `*`.

### A.4 · ⚠️ Correction : `data ?? result`

**L'ordre de lecture est juste, mais la branche `data` n'est jamais empruntée sur ce serveur.**

Le port RN lisait `corps.data ?? corps.result` (`appel.ts:220-221`) en invoquant « l'ordre que
le client Firebase applique lui-même ». C'est exact pour le SDK. Mais `callableResult`
(`oncall.ts:122-127`) n'écrit **que** `result` — il n'existe aucun chemin dans
`worker/apps/api/src/` qui produise une enveloppe `{"data": …}`. La compatibilité conservée
est celle du SDK, pas celle du Worker.

→ **Règle native :** décoder `result`. Garder `data` en repli ne coûte rien et protège d'un
retour au SDK Firebase Functions ; **construire quoi que ce soit qui suppose `data` serait
faux**. Et attention au piège de nommage : l'enveloppe de réponse porte `result`, la charge
d'une vue porte `vue` — `{"result":{"vue":…,"releveA":…}}`. Il y a donc deux niveaux de
déballage, pas un.

### A.5 · ⛔ Le relais mort — le cas qui a déjà coûté une panne de paiement

`index.ts:100-111` : un nom absent de la variable d'environnement `MIGRATED` n'est pas servi
localement, il est **relayé** vers `FUNCTIONS_ORIGIN`. Or plus aucune Cloud Function n'est
déployée (`worker-routage-callables.test.ts:16-20`). Google répond alors sa page HTML
« 404 Page not found », avec un statut qui peut être 404 — mais un corps qui n'est pas du JSON.

Un décodeur naïf lève une erreur de syntaxe, qui **se présente comme une panne de réseau**.
C'est exactement ce qui est arrivé à `createClubCharge` : implémenté, enregistré, absent de la
liste — et personne ne pouvait s'abonner au Club (`worker-routage-callables.test.ts:26-30`).

→ **Règle native, obligatoire :** avant de décoder, examiner le corps. S'il ne commence pas par
`{` ou `[` (le port RN testait `texte.trimStart().startsWith('<')`, `appel.ts:198`), lever une
erreur `internal` dont le message **nomme la cause** : « *`<nom>` a répondu du HTML, pas du
JSON — le nom est probablement absent de MIGRATED* ». Ne jamais la maquiller en panne réseau :
c'est un défaut de configuration serveur, qui se corrige en une ligne quand on sait le lire.

### A.6 · Les trois routes qui ne sont pas des callables

Sur le même hôte, avant le contrôle POST :

| Chemin | Méthode | Traitement |
|---|---|---|
| `/exportDownload` | GET signé | `index.ts:73` → `exportDownload.ts`. C'est l'URL que `exportUserData` renvoie ; elle vaut 24 h. |
| `/desabonnement` | GET public | `index.ts:80`. Lien de courriel, sans compte et sans JavaScript. |
| `/bictorysWebhook` | POST brut | `index.ts:82-85`. **Court-circuite l'enveloppe `{data}`** — c'est un webhook de banque. Aucun client n'y touche. |

---

## B · L'inventaire des callables

**58 handlers** sont implémentés (`registry.ts:73-144`, compté avec l'expression du test
lui-même). **59 noms** figurent dans chacune des deux listes `MIGRATED` de
`worker/apps/api/wrangler.jsonc` (production ligne 38, environnement nommé ligne 103) : les 58
handlers **plus** `bictorysWebhook`, qui est servi avant le registre et dont la présence dans
la liste est ce qui l'active (`worker-routage-callables.test.ts:122-127`). Les deux listes sont
identiques — c'est une porte de CI (`…:151-157`).

Le port RN appelait **28** de ces noms (recompté sur l'arbre `9c22076:mobile/`, en multi-ligne :
un `grep` ligne à ligne en rate deux, `ecrireUneNote` et `posterAuClub`, dont les appels sont
coupés). ⚠️ Ne pas confondre ce 28-là avec les 28 **types de vue** du §F : les deux comptes
sont égaux par coïncidence et ne se recouvrent pas.

### B.1 · Les 28 appelées par le natif

`⬤` = jeton obligatoire · `◐` = jeton + condition (abonnement, rôle) · `○` = anonyme accepté

| Callable | Auth | Entrée | Sortie | Erreurs propres |
|---|:--:|---|---|---|
| `appMoi` | ⬤ | — | `{vue: VueMoi \| null, releveA}` | — |
| `appEspace` | ⬤ | — | `{vue: VueEspace \| null, releveA}` | — |
| `appCours` | ⬤ | — | `{vue: VueCours[], releveA}` | — |
| `appFormation` | ⬤ | `{slug: string}` **obligatoire** | `{vue: VueFormation \| null, releveA}` | `invalid-argument` si `slug` absent (`formation.ts:71`) |
| `appLecon` | ⬤ | `{formationId?: string}` | `{vue: VueLecon \| null, releveA}` | — |
| `appNotes` | ⬤ | — | `{vue: VueNotes, releveA}` | — |
| `appCertificats` | ⬤ | — | `{vue: VueCertificats, releveA}` | — |
| `appClub` | ◐ Club | — | `{vue: VueClub \| null, releveA}` | — |
| `appClubAgenda` | ◐ Club | — | `{vue: VueSeance[] \| null, releveA}` | — |
| `appClubFil` | ◐ Club | — | `{vue: VueClubFil \| null, releveA}` | — |
| `appClubClassement` | ◐ Club | — | `{vue: VueClassement \| null, releveA}` | — |
| `appClubParrainage` | ◐ Club | — | `{vue: VueParrainage \| null, releveA}` | — |
| `appClubBlocages` | ◐ Club | — | `{vue: VueBlocages \| null, releveA}` | — |
| `appClubListe` | ◐ Club | `{onglet: 'discussions'\|'opportunites'\|'membre', id?, message?}` | 3 formes distinctes, voir §F.1 | `invalid-argument` sur onglet inconnu (`clubListe.ts:57`) ou membre non désigné (`:138`) |
| `appMedia` | ⬤ | — | `{vue: VueMedia, releveA}` | — |
| `appRepetiteur` | ⬤ | — | `{vue: VueRepetiteur, releveA}` | — |
| `appConsole` | ◐ rôle | — | `{vue: VueConsole, releveA}` | `permission-denied` hors `admin`/`support` (`console.ts:34-36`) |
| `rysmo` | ⬤ | `{message, conversationHistory[], userContext?, language?}` | `{reply, quota{dailyLimit,dayCount,packBalance,source,hasActiveSubscription,hasClubBonus}}` | `invalid-argument` message vide ; **`resource-exhausted` avec `details` structurés** (`lib/rysmo-quota.ts:231-244`) |
| `getRysmoQuota` | ⬤ | — | `{dailyLimit,dayCount,dayRemaining,packBalance,plan,hasActiveSubscription,hasClubBonus,expiresAt,canRenew}` | — |
| `clearRysmoMemory` | ⬤ | — | `{success: true}` | — |
| `creerMonProfil` | ⬤ | `{displayName: string}` | `{cree: boolean, uid}` — **idempotent** | `invalid-argument` nom absent / trop long |
| `marquerLecon` | ⬤ | `{formationId, leconId, faite: boolean}` | `{progression, leconsFaites, lecons, complete, titre}` | `invalid-argument` ×3, `not-found` ×2 |
| `ecrireUneNote` | ⬤ | `{texte, lessonId?, lessonLabel?}` | `{note:{id, texte, date, createdAt}}` | `invalid-argument` note vide / champ illisible |
| `posterAuClub` | ◐ Club | `{texte, categorie?}` | `{message: VueClubMessage}` | `permission-denied`, `invalid-argument`, `failed-precondition` si le profil n'a pas de nom |
| `reserverSession` | ◐ Club | `{collection, seanceId, inscrite: boolean}` | `{inscrite}` | `invalid-argument` ×3, `permission-denied`, `not-found` |
| `signalerMembre` | ⬤ | `{membreId, motif?}` | `{recu: true}` | `invalid-argument`, `failed-precondition` (soi-même), `not-found` |
| `bloquerMembre` | ◐ Club | `{cible:{type:'membre'\|'message'\|'discussion'\|'opportunite', id}, bloquer}` | `{bloque, combien}` | `permission-denied`, `invalid-argument` ×3, `not-found` ×2, `failed-precondition`, **`resource-exhausted`** (plafond de blocages) |
| `exportUserData` | ⬤ | — | `{downloadUrl, expiresInHours}` | `internal` si le service n'est pas configuré |
| `deleteUserAccount` | ⬤ | `{confirmation: string}` | `{success: true}` | `failed-precondition` si la confirmation ne correspond pas |

**Remarques mesurées :**

- ⚠️ `appFormation` **exige** son `slug` et lève `invalid-argument` sans lui (`formation.ts:70-71`),
  alors que le hook RN passait `{}` quand le paramètre manquait (`index.ts:163`). C'est le même
  défaut que celui qui rendait la fiche de membre inatteignable et le bouton « Signaler »
  jamais rendu (`clubListe.ts:120-130`). → Dans le contrat, un paramètre obligatoire doit se
  générer **non-optionnel** des deux côtés.
- `appRepetiteur` et `rysmo` parlent **deux vocabulaires pour le même axe** : la vue lit
  `de: 'me' | 'ai'` (`repetiteur.ts:81`), la requête écrit `role: 'user' | 'assistant'`
  (le port traduisait en `index.ts:31`). Le contrat doit nommer les deux, sinon la traduction
  se réinvente dans chaque plateforme.
- `ecrireUneNote` et `posterAuClub` **renvoient l'objet écrit**, pas un accusé. C'est
  délibéré (`ecrireUneNote.ts:60-62`) : l'écran l'insère sans relire la liste. C'est aussi le
  contournement d'un défaut du cache, voir §D.3.c.
- ⛔ `ecrireUneNote` renvoie `note.date = asText(lessonLabel) ?? null` (`ecrireUneNote.ts:66`) —
  **le libellé de la leçon, pas une date**, alors que `appNotes` compose ce même champ comme
  `« 12/08 · 14:35 · <leçon> »` (`notes.ts:31-32, 58-60`). Le champ `date` porte donc deux
  formes selon la callable qui le produit. À trancher dans le contrat, pas dans les écrans.

### B.2 · Les 30 autres

Aucune n'était appelée par le port RN. Elles restent servies et sont classées ici parce qu'un
client mobile en appellera certaines au lot suivant.

| Groupe | Callables | Auth |
|---|---|:--:|
| **Paiement** (chemin de l'argent) | `quoteCheckout`, `createBictorysCharge`, `createClubCharge`, `createRysmoPackCharge`, `createRysmoSubscriptionCharge` | ⬤ |
| **Certificat** | `issueCertificate` | ⬤ |
| **Médias protégés** | `mediaToken` | ◐ (Club ou inscription) |
| **CV** | `parseCv` | ⬤ |
| **Listes d'attente** | `joinWaitlist` | ⬤ |
| **Anonymes** | `acknowledgeAppointment`, `popupEvent`, `accuserDevis`, `accuserDemandeAgence`, `translateContent` | ○ |
| **Administration** (17) | `adminCreateUser`, `adminManageEnrollment`, `adminManageRysmoQuota`, `reindexSearch`, `replyToMessage`, `notifyOnPublish`, `notifyWaitlist`, `resendTransactionMail`, `spotifyProxy`, `youtubeProxy`, `importSpotifyEpisodesManual`, `syncMediaStatsManual`, `weeklyClubDigestManual`, `backfillLigne`, `backfillSlugEn` | requireAdmin |

⚠️ **Les cinq callables anonymes ne sont pas sans garde.** `acknowledgeAppointment` se plafonne
sur l'empreinte de l'appelant (`CF-Connecting-IP`, `acknowledgeAppointment.ts:104-112`), et
`popupEvent` **ne lève jamais** : une entrée invalide donne `{ok:true, ignored:'…'}`
(`popupEvent.ts:52-57`) — une mesure ne doit pas faire échouer une interaction.

### B.3 · ⛔ L'angle mort à refermer

`worker-routage-callables.test.ts:88-97` déclare son propre trou : la porte
« *toute callable appelée par l'application native est servie par le Worker* » parcourt
`android/app/src` et `ios/Rysmo`, **qui sont vides de source aujourd'hui**. Elle passe donc au
vert sans rien vérifier. C'est cette porte-là — pas une autre — qui empêchait une callable
mobile de partir dans le relais mort. **Elle se rebranche seule dès que le premier fichier
Kotlin nomme une callable**, à condition que les appels soient reconnaissables. Voir §F.7.

---

## C · Les erreurs

### C.1 · Ce que le serveur produit vraiment

`HttpsErrorCode` déclare 17 codes (`oncall.ts:19-36`). **Neuf seulement sont levés** dans
`worker/apps/api/src` (comptage exhaustif sur `new HttpsError('…')`) :

| Code | Sites | HTTP | D'où |
|---|--:|--:|---|
| `invalid-argument` | 57 | 400 | validation d'entrée, partout |
| `not-found` | 17 | 404 | document absent |
| `internal` | 16 | 500 | service non configuré ; **et le repli de toute exception non typée** |
| `failed-precondition` | 14 | 400 | état incompatible (se signaler soi-même, confirmation fausse) |
| `permission-denied` | 9 | 403 | Club, rôle support, propriété d'un certificat |
| `resource-exhausted` | 3 | 429 | quota Rysmo, plafond de blocages |
| `already-exists` | 3 | 409 | **paiements** (`payments.ts:149,182,185,325`) + `admin.ts:141` |
| `unavailable` | 1 | 503 | `index.ts:107` — le relais lui-même a échoué |
| `unauthenticated` | 1 | 401 | `context.ts:80`, le seul site : `requireAuth` |

Jamais levés : `ok`, `cancelled`, `unknown`, `deadline-exceeded`, `aborted`, `out-of-range`,
`unimplemented`, `data-loss`.

### C.2 · Les dix codes du port RN, rejoués

`appel.ts:33-36` portait dix valeurs : neuf canoniques plus le fourre-tout `inconnu`. La
correspondance se fait par minuscules + `_`→`-` (`appel.ts:52-61`).

| Code client | Le serveur le lève ? | Verdict |
|---|---|---|
| `unauthenticated` | oui (1 site) | ✔ |
| `permission-denied` | oui (9) | ✔ |
| `not-found` | oui (17) | ✔ |
| `invalid-argument` | oui (57) | ✔ |
| `resource-exhausted` | oui (3) | ✔ |
| `failed-precondition` | oui (14) | ✔ |
| `unavailable` | oui (1) + fabriqué localement | ✔ |
| `internal` | oui (16) + fabriqué localement | ✔ |
| `deadline-exceeded` | **non** | fabriqué **uniquement** par le client, pour son propre délai |
| `inconnu` | — | sentinelle |

⛔ **Le trou : `already-exists`.** Le serveur le lève sur trois des cinq callables de paiement.
Il n'est pas dans la liste des dix, donc `versCode` le ramène à `inconnu`, et `motifLisible`
retombe sur le message du serveur. Rien ne casse — mais **le client ne peut pas brancher
dessus**, alors que c'est précisément le cas « tu es déjà membre actif du Club » qui doit
mener ailleurs qu'un écran d'erreur. → **Le client natif porte dix codes canoniques +
`inconnu` : les neuf du port, plus `already-exists`.**

### C.3 · ⚠️ Correction : « trois causes de panne de transport »

L'en-tête du port annonce « TROIS CAUSES, TROIS GESTES » (`appel.ts:88-112`). **Le code en
distingue quatre**, et la quatrième est la plus honnête des quatre : elle dit qu'on ne sait
pas (`appel.ts:144-149`, `MOTIF_INDETERMINE`). Compter trois, c'est perdre celle-là — et
c'est elle qui empêche d'accuser le forfait de quelqu'un sur une mesure qu'on n'a pas pu
faire.

À quoi s'ajoutent trois échecs qui ne sont pas du transport (`appel.ts:160-162`, `191-206`,
`216-218`). Le total est de **sept** situations, et le mapping complet est le suivant.

### C.4 · Le mapping — serveur → état client → message

`ErreurAppel(code, message, motif, details)` (`appel.ts:38-49`) sépare deux choses qui ne
doivent jamais se confondre : `message` part dans la trace, `motif` s'affiche. Le port ne
montrait **jamais un code brut** — « un code ne dit à personne quoi faire » (`appel.ts:63`).

| Déclencheur | Détection | Code client | Motif affiché | Geste offert |
|---|---|---|---|---|
| Configuration de build incomplète | avant tout réseau | `failed-precondition` | *nomme les variables manquantes* | aucun |
| Délai dépassé | **le signal**, `limite?.aborted === true` | `deadline-exceeded` | « Le serveur met trop de temps. » | Réessayer |
| Pas de réseau | diagnostic système = `absent` | `unavailable` | « Ton téléphone n'a pas de réseau. » | Réessayer |
| Réseau OK, appel non parti | diagnostic = `present` | `unavailable` | « Le serveur ne répond pas. » | Réessayer |
| Diagnostic impossible | `indetermine` | `unavailable` | « Pas de connexion. » | Réessayer |
| Corps non-JSON (§A.5) | ne commence pas par `{`/`[` | `internal` | « Le serveur a répondu quelque chose d'inattendu. » | Réessayer |
| HTTP ≠ 2xx sans corps `error` | `!response.ok` | `inconnu` | « Le serveur a refusé la demande. » | Réessayer |
| `{"error":{"status":"UNAUTHENTICATED"}}` | corps | `unauthenticated` | « Ta session a expiré. » | **rafraîchir + rejouer une fois** (§A.3), puis reconnexion |
| `PERMISSION_DENIED` | corps | `permission-denied` | « Ton compte n'a pas accès à ça. » | aucun |
| `NOT_FOUND` | corps | `not-found` | « Ça n'existe pas, ou plus. » | aucun |
| `RESOURCE_EXHAUSTED` | corps | `resource-exhausted` | « Tu as atteint la limite pour aujourd'hui. » | lire `details` (§C.6) |
| `ALREADY_EXISTS` | corps | `already-exists` | *message du serveur* | dépend de l'appel |
| `UNAVAILABLE` / `DEADLINE_EXCEEDED` | corps | idem | « Le serveur ne répond pas. » | Réessayer |
| tout autre statut | corps | `inconnu` | *message du serveur*, à défaut « Quelque chose a échoué côté serveur. » | Réessayer |

**Le message du serveur est préféré quand il existe** (`appel.ts:72-74`) : les handlers
écrivent en français, pour être lus (« Tu n'es pas inscrite à cette formation. »,
`marquerLecon.ts:62`). Les cinq motifs codés en dur ne remplacent que les codes dont le
message serveur est technique.

### C.5 · ⚠️ Le délai se reconnaît au signal, jamais au nom de l'erreur

Le port a payé cette leçon en trois exemplaires : sous React Native, un même dépassement de
délai se présentait comme `TimeoutError`, `DOMException('AbortError')` ou `FetchError` nommé
`Error`, selon le drapeau `EXPO_PUBLIC_USE_RN_FETCH` et la version du SDK
(`appel.ts:96-106`). La solution était de retenir le signal et de l'interroger après coup.

**La leçon ne se transpose pas littéralement** — OkHttp lève un `SocketTimeoutException`
stable, URLSession un `URLError.timedOut` stable. **Le principe, si :** décider à partir de la
limite qu'on a posée soi-même, pas du type que la bibliothèque a choisi. Sur les deux
plateformes, cela veut dire mesurer soi-même l'écoulement, ou porter un drapeau posé par le
minuteur — pas filtrer sur un nom de classe.

- Délai d'appel : **20 000 ms** (`appel.ts:77`).
- Délai du diagnostic réseau : **2 000 ms** (`reseau.ts:51`). Un diagnostic qui ne revient
  jamais est pire qu'un diagnostic qui échoue : l'état ne passerait jamais en `panne` et
  l'écran resterait sur son squelette indéfiniment.

### C.6 · Les `details` de `resource-exhausted`

`lib/rysmo-quota.ts:231-244` est le seul endroit qui remplit `details`, et il le remplit pour
que le client puisse **proposer l'achat** plutôt que d'afficher un mur :

```json
{"reason":"daily_limit","dailyLimit":10,"hasActiveSubscription":false,
 "hasClubBonus":false,"upgradeUrl":"/mon-espace/rysmo-store"}
```

⚠️ `upgradeUrl` est un chemin **du site web**, pas une route de l'application. Le client natif
doit le traduire en destination locale, jamais l'ouvrir tel quel — la suite de tests disparue
`mobile-routes.test.ts` avait justement attrapé trois cartes qui pointaient vers des routes du
site inexistantes dans l'application (`garanties-a-reconstruire.md`, §2).

### C.7 · L'état du réseau — ce qu'il ne fait pas

`reseau.ts` répond `absent | present | indetermine`, **ne jette jamais, ne bloque jamais, ne
garde rien** (`reseau.ts:56`). Trois règles à reporter telles quelles :

1. **Aucun cache.** Un état réseau mémorisé est faux dès qu'on passe une porte
   (`reseau.ts:12-17`).
2. **Il ne refuse jamais un appel.** L'état système se trompe — portail captif, VPN, opérateur
   qui valide avec deux minutes de retard. On tente toujours, on explique après
   (`reseau.ts:19-23`).
3. **Les champs facultatifs ne valent pas « non ».** `isInternetReachable` reste indéfini tant
   qu'Android n'a pas tranché sur `NET_CAPABILITY_VALIDATED` ; tester la véracité dirait
   « pas de réseau » sur un téléphone parfaitement connecté. On compare à `false`, jamais à la
   véracité (`reseau.ts:70-79`). En Kotlin, l'équivalent est
   `NetworkCapabilities.NET_CAPABILITY_VALIDATED` lu explicitement, pas `activeNetwork != null`.

---

## D · Le cache

`mobile/donnees/vue.ts:33-41` et `:45-117`.

### D.1 · Ce qu'il était

- Fenêtre **30 000 ms** (`FENETRE_MS`, `vue.ts:33`). « Assez pour absorber une navigation,
  trop peu pour montrer du périmé » (`vue.ts:19`).
- **En mémoire seulement, délibérément.** Un cache persistant survivrait à la déconnexion et
  la vue de la personne précédente s'afficherait une fraction de seconde à la connexion
  suivante — « un défaut qui ne se voit qu'en production, sur le téléphone de quelqu'un qui
  prête son appareil » (`vue.ts:21-24`).
- Clé : `` `${uid ou '-'}:${nom}:${JSON.stringify(params)}` `` (`vue.ts:47`).
- Purgé à la déconnexion — **après** `signOut`, jamais avant (`identite.ts:129-144`).

### D.2 · ⚠️ Correction : les paramètres n'étaient PAS triés

Le mandat décrit « une clé `uid:nom:params` avec paramètres triés ». **Il n'y a aucun tri.**
`vue.ts:47` fait un `JSON.stringify` direct, qui préserve l'ordre d'insertion. Vérifié aussi
contre l'historique complet du fichier : `vue.ts` n'a que deux commits (`4b9a273`, `922b4d8`)
et aucun n'a jamais contenu `sort()` ni `Object.keys(params)`.

Conséquence réelle, mesurée : `{onglet:'membre', id:'x'}` et `{id:'x', onglet:'membre'}`
produisent **deux clés**, donc deux entrées, donc un appel de plus. Ce n'est pas une réponse
fausse — c'est un doublon silencieux sur un forfait compté. Les hooks construisaient leurs
littéraux dans un ordre stable (`index.ts:110-112`), ce qui masquait le défaut.

→ **Règle native : la clé est canonique.** Paramètres triés par nom, valeurs sérialisées de
façon déterministe. En Kotlin, `JsonObject(params.toSortedMap())` ; en Swift,
`JSONEncoder().outputFormatting = .sortedKeys`. Ce n'est pas une optimisation : c'est ce qui
rend la clé *vraie*.

### D.3 · Ce qu'il garantissait, et ce qu'il ratait

**Garanti :**

- une entrée appartient à un `uid` — un second compte ne peut pas lire les vues du premier ;
- une panne n'est **jamais** mise en cache (`vue.ts:94-102` sort par le `catch`) ;
- une réponse tardive n'écrase pas une plus récente, dans une même instance de hook
  (compteur `tour`, `vue.ts:52, 81, 85`) ;
- `params` **n'est pas** une dépendance de l'effet, et c'est délibéré : un objet littéral
  reconstruit à chaque rendu déclencherait une boucle infinie d'appels que le compilateur ne
  voit pas (`vue.ts:54-63`). C'est `cle` qui décide de relire.

**Raté — et le premier est le plus grave :**

- **a · L'estampille du serveur est jetée au bout de 30 secondes.** Sur le chemin frais,
  `asOf` vient de `reponse.releveA`, la date **du serveur** (`vue.ts:87`). Mais l'entrée de
  cache stocke `releveA: Date.now()` — **l'horloge du téléphone** (`vue.ts:89`) — et
  `depuisCache` reconstruit la provenance depuis cette valeur-là (`vue.ts:111`). Le même hook
  produit donc deux provenances de nature différente selon qu'il a touché le réseau ou non.
  ⛔ C'est exactement la règle que tout ce dispositif existe pour tenir : « un nombre n'existe
  pas sans sa date » (`worker-vues-natives.test.ts:82-89`). Sur un téléphone à l'horloge
  fausse — courant — un `<Num asOf>` servi du cache **ment sur sa date**.
  → **Le contrat natif stocke `releveA` (la chaîne ISO du serveur) dans l'entrée de cache, et
  la date d'insertion séparément pour la péremption.** Deux champs, deux rôles.
- **b · Aucune invalidation par l'écriture.** `marquerLecon` renvoie une progression
  recalculée, mais rien n'évince `appEspace`, `appLecon` ni `appCours`. Idem `posterAuClub` →
  `appClubFil`, `ecrireUneNote` → `appNotes`, `bloquerMembre` → `appClubBlocages`/`appClubFil`/
  `appClubListe`, `reserverSession` → `appClubAgenda`. Pendant 30 s, revenir sur l'onglet
  montre l'état d'avant.
  → C'est **pour cela** que `ecrireUneNote` et `posterAuClub` renvoient l'objet écrit : les
  écrans l'inséraient à la main. Le contournement fonctionne pour l'écran actif, pas pour
  l'onglet d'à côté.
  → **Règle native : chaque écriture déclare les vues qu'elle périme**, dans le contrat
  (§F.6, champ `perime`). C'est du code généré, pas une discipline.
- **c · Aucune déduplication des requêtes en vol.** Deux composants montés dans la même image
  et lisant `appMoi` ratent tous deux le cache et partent tous deux. Le compteur `tour` ne
  garde que l'ordre à l'intérieur d'**une** instance.
- **d · Aucune revalidation.** Un succès de cache pose l'état et s'arrête ; rien ne rafraîchit
  en fond.
- **e · Aucune borne de taille.** `Map` sans plafond. Sans conséquence pratique (≈ 20 clés),
  mais rien ne l'empêche de croître si une vue se paramètre finement.
- **f · Le repli `reessayer: () => {}` est un bouton mort.** Sur `session.nonConfigure`, l'état
  `panne` porte une fonction vide (`vue.ts:71`). L'écran affiche « Réessayer », et le geste ne
  fait rien. C'est précisément la faute que `mobile-controles-morts.test.ts` avait été écrit
  pour attraper (`garanties-a-reconstruire.md`, §1).
  → **Règle native : un état `Panne` sans reprise possible ne propose pas de reprise.** Le
  drapeau est dans l'état, pas dans l'écran.

---

## E · Les machines à états

### E.1 · La session — 4 phases

`mobile/donnees/session.tsx:30-34`. Une seule souscription pour toute l'application
(`session.tsx:9-13`) : deux abonnements donneraient deux vérités selon l'ordre de montage.

Transitions légales :

```
                 config incomplète
   (départ) ─────────────────────────► NonConfiguree ──╳  (terminale)
      │
      │ config complète
      ▼
  Restauration ──── 1er rappel, utilisateur ≠ null ──► Connectee
      │                                                  │  ▲
      └──── 1er rappel, utilisateur = null ──► Anonyme ◄──┘  │
                                                 └───────────┘
```

- `NonConfiguree` est **terminale** : l'écouteur n'est jamais monté (`session.tsx:47`,
  `if (auth === null) return`). Aucune transition n'en sort.
- `Restauration` **n'est jamais réatteinte**. C'est l'état d'avant le premier rappel.
- ⚠️ `Restauration` **avant** `Anonyme`, toujours : les confondre renvoie vers la connexion
  quelqu'un de déjà connecté, le temps d'un battement. « Le défaut le plus courant des
  applications qui branchent Firebase, et il vient toujours d'ici » (`session.tsx:15-21`).

**Kotlin**

```kotlin
sealed interface Session {
    /** Avant le premier rappel du SDK. On ne SAIT pas s'il y a quelqu'un. */
    data object Restauration : Session
    /** Personne. Réponse définitive, pas un trou. */
    data object Anonyme : Session
    /** La construction n'a pas reçu sa configuration. Terminale. */
    data class NonConfiguree(val motif: String) : Session
    data class Connectee(
        val uid: String,
        val email: String?,
        val nom: String?,
    ) : Session
}
```

**Swift**

```swift
enum Session: Equatable {
    case restauration
    case anonyme
    case nonConfiguree(motif: String)
    case connectee(uid: String, email: String?, nom: String?)
}
```

### E.2 · `Etat<T>` — 8 phases

`mobile/ds/Etat.ts:42-68`. Six d'entre elles ne portent aucune valeur
(`PHASES_SANS_VALEUR`, `:71-73`) ; trois portent une provenance (`source`, `asOf`).

⚠️ **Les huit ne sont pas toutes atteignables depuis la lecture d'une vue.** Mesuré :

| Phase | Produite par |
|---|---|
| `restauration`, `charge`, `anonyme`, `panne`, `vide`, `servie` | `useVue` (`vue.ts:49, 68-93, 96-101`) |
| `replique` | **uniquement** `composer*` (`etat.ts:65`), en enveloppant l'état brut |
| `nonBranche` | **rien dans `donnees/`**. Fabrique `nonBranche()` (`Etat.ts:76`), pour un écran sans source serveur |

Transitions légales (une instance de lecture) :

```
      Restauration ──session anonyme──► Anonyme          (terminal pour ce montage)
           │
           │ session connectée
           ├── succès de cache ─────────► Servie | Vide  (jamais de Charge : pas de clignotement)
           │
           └── échec de cache ──► Charge ──┬──► Servie   (vue non nulle et non vide)
                                            ├──► Vide    (vue nulle, ou tableau vide)
                                            └──► Panne ──reprise──► Charge …
      (session nonConfigurée) ────────────────► Panne (sans reprise, cf. D.3.f)
```

Interdits, et ce ne sont pas des détails :

- `Servie → Charge` **sans passer par une demande explicite** : c'est le clignotement.
- `Vide → Panne` sur une réponse tardive : le compteur de tour l'empêche (`vue.ts:85, 95`).
- `Panne → Servie` **sans `Charge`** : l'écran doit voir que quelque chose repart.
- `Servie ← replique` : la réplique ne remplace **jamais** une réponse arrivée, même vide, ni
  une panne (`etat.ts:53-62`). « Masquer un échec par du contenu de démonstration ferait croire
  l'application en bon état alors qu'elle ne lit rien. »
- `Anonyme ← replique` sur une **identité** : `composerIdentite` refuse
  (`etat.ts:49-51, 62`). Combler un catalogue vide avec un exemple est utile ; combler une
  identité vide avec un nom fait croire à une session ouverte.

**Kotlin**

```kotlin
/** D'où vient la valeur, et quand elle a été relevée. Exigé par `Num`. */
data class Provenance(val source: Source, val asOf: Instant)

sealed interface Etat<out T> {
    data object Restauration : Etat<Nothing>
    data object Charge : Etat<Nothing>
    data object Anonyme : Etat<Nothing>
    /** L'écran n'a pas encore de source serveur. Honnête, et voué à disparaître. */
    data object NonBranche : Etat<Nothing>
    /**
     * ⚠️ `motif` se LIT ; il ne se diagnostique pas.
     * `reprenable` remplace la lambda `reessayer` du port : une fonction dans l'état
     * casse l'égalité structurelle, donc `distinctUntilChanged` d'un StateFlow, donc
     * toute recomposition Compose devient inconditionnelle. La reprise est une méthode
     * du ViewModel ; l'état dit seulement si elle a un sens.
     */
    data class Panne(val motif: String, val code: CodeErreur, val reprenable: Boolean) : Etat<Nothing>
    data class Vide(val provenance: Provenance) : Etat<Nothing>
    data class Servie<T>(val valeur: T, val provenance: Provenance) : Etat<T>
    data class Replique<T>(val valeur: T, val provenance: Provenance) : Etat<T>
}
```

⚠️ **`Instant` demande une décision de build.** `android/app/build.gradle.kts:34` fixe
`minSdk = 24` ; `java.time` n'existe qu'à partir de l'API 26 **sans** désucrage, et
`isCoreLibraryDesugaringEnabled` n'est pas activé dans ce fichier. Deux issues : activer le
désucrage, ou prendre `kotlinx-datetime` — cohérent avec `kotlinx-serialization` déjà au
catalogue (`android/gradle/libs.versions.toml`). **Non tranché ici.**

**Swift**

```swift
struct Provenance: Equatable { let source: Source; let asOf: Date }

enum Etat<T: Equatable>: Equatable {
    case restauration
    case charge
    case anonyme
    case nonBranche
    case panne(motif: String, code: CodeErreur, reprenable: Bool)
    case vide(Provenance)
    case servie(T, Provenance)
    case replique(T, Provenance)
}
```

---

## F · ⭐ Les 28 types de vue — le point dur

### F.1 · Le serveur : 17 callables, 19 formes de réponse

`worker/apps/api/src/handlers/app/` contient 17 fichiers, un par callable `app*`. Mais
`appClubListe` **s'ouvre en trois** selon son paramètre `onglet` (`clubListe.ts:33, 67, 94, 119`).
Le serveur sert donc **19 formes de réponse**.

Toutes portent la même enveloppe — c'est la 20ᵉ forme, celle que le client modélisait en
`Reponse<T>` (`vue.ts:43`) :

```json
{"vue": <charge | null>, "releveA": "<ISO 8601 UTC>"}
```

`releveA` est **obligatoire** sur les 17 : c'est une porte de CI
(`worker-vues-natives.test.ts:82-90`), et c'est lui qui alimente `<Num asOf>`.

| # | Callable (+ discriminant) | Charge | `return` |
|--:|---|---|---|
| 1 | `appMoi` | objet | `moi.ts:46` |
| 2 | `appEspace` | objet | `espace.ts:68` |
| 3 | `appCours` | **tableau** | `cours.ts:43` |
| 4 | `appFormation` | objet (+ modules) | `formation.ts:115` |
| 5 | `appLecon` | objet (+ programme) | `lecon.ts:62` |
| 6 | `appNotes` | objet (+ total, notes) | `notes.ts:49` |
| 7 | `appCertificats` | objet (+ certificats) | `certificats.ts:62` |
| 8 | `appClub` | objet (+ bilan) | `club.ts:84` |
| 9 | `appClubAgenda` | **tableau** | `clubAgenda.ts:79` |
| 10 | `appClubBlocages` | objet (+ comptes) | `clubBlocages.ts:36` |
| 11 | `appClubClassement` | objet (+ lignes) | `clubClassement.ts:80` |
| 12 | `appClubFil` | objet (+ mission, fil) | `clubFil.ts:78` |
| 13 | `appClubListe` · `discussions` | **tableau** | `clubListe.ts:73` |
| 14 | `appClubListe` · `opportunites` | **tableau** | `clubListe.ts:100` |
| 15 | `appClubListe` · `membre` | objet | `clubListe.ts:144` |
| 16 | `appClubParrainage` | objet | `clubParrainage.ts:51` |
| 17 | `appConsole` | objet (+ comptes, prospect) | `console.ts:67` |
| 18 | `appMedia` | objet (+ episode, video) | `media.ts:59` |
| 19 | `appRepetiteur` | objet (+ quota, memoire, echange) | `repetiteur.ts:59` |

**Aucune de ces formes n'a de nom côté serveur.** Les 17 handlers sont typés
`Promise<unknown>` — vérifié sur les 17 — et construisent leur littéral en ligne. Il n'y a
donc rien à lire par un générateur : ce point commande tout le §F.6.

### F.2 · Le client : 28 types nommés

`9c22076:mobile/donnees/types.ts` déclare 28 `interface Vue*`. Elles se répartissent
exactement :

**19 racines** — une par forme de réponse, dans le même ordre que le tableau ci-dessus :
`VueMoi`, `VueEspace`, `VueCours[]`, `VueFormation`, `VueLecon`, `VueNotes`,
`VueCertificats`, `VueClub`, `VueSeance[]`, `VueBlocages`, `VueClassement`, `VueClubFil`,
`VueDiscussion[]`, `VueOpportunite[]`, `VueMembre`, `VueParrainage`, `VueConsole`, `VueMedia`,
`VueRepetiteur`.

**9 imbriquées nommées :** `VueModuleFiche` (dans `VueFormation`), `VueLeconLigne` (`VueLecon`),
`VueNote` (`VueNotes`), `VueCertificat` (`VueCertificats`), `VueCompteBloque` (`VueBlocages`),
`VueClubMission` + `VueClubMessage` (`VueClubFil`), `VueEpisode` + `VueVideo` (`VueMedia`).

19 + 9 = **28**.

### F.3 · Où les deux divergent — exactement

**Ce n'est pas un écart de couverture.** Les 19 racines correspondent une pour une aux 19
formes du serveur ; aucun type client n'est orphelin, aucune forme serveur n'est sans type.
La divergence est ailleurs, et elle est de quatre natures.

**① Divergence de granularité : 8 formes que le serveur émet et que personne ne nomme.**

| # | Forme | Serveur | Client |
|--:|---|---|---|
| 1 | `appNotes.vue.total` `{notes, lecons}` | `notes.ts:51` | inline dans `VueNotes` |
| 2 | `appClub.vue.bilan[]` `{n, l}` | `club.ts:90-94` | inline |
| 3 | `appClubClassement.vue.lignes[]` `{rang, nom, initiales, points, moi}` | `clubClassement.ts:87-93` | inline |
| 4 | `appConsole.vue.comptes` (5 clés fixes) | `console.ts:69-75` | `Record<string, number>` |
| 5 | `appConsole.vue.prospect` `{titre, meta, statut}` | `console.ts:78-83` | inline |
| 6 | `appRepetiteur.vue.quota` `{utilise, total}` | `repetiteur.ts:64` | inline |
| 7 | `appRepetiteur.vue.memoire[]` `{id, fait, depuis}` | `repetiteur.ts:66-73` | inline |
| 8 | `appRepetiteur.vue.echange[]` `{id, de, texte}` | `repetiteur.ts:76-84` | inline |

TypeScript s'accommode d'un type anonyme. **Kotlin et Swift, non.** Chacune de ces huit formes
devra recevoir un nom, et si les deux plateformes le choisissent séparément, elles auront deux
vocabulaires pour la même donnée dès le premier jour.

**② Divergences de type déclaré — le client dit autre chose que ce que le serveur émet.**

| Champ | Client déclare | Serveur émet | Coût |
|---|---|---|---|
| `VueClub.bilan[].n` | `number \| null` | **jamais null** : `count(…).catch(() => 0)` (`club.ts:63, 68`) et `toNumber(…, 0)` (`:93`) | ⛔ Le commentaire juste au-dessus (`club.ts:88-89`) affirme « Un `null` y reste `null` : trois tuiles qui affichent “non relevé” valent mieux qu'un zéro qu'on n'a pas mesuré. » **Le code ne peut pas le tenir** : une requête d'agrégation refusée est servie comme un zéro mesuré. Même motif dans `console.ts:47` (`compter(…).catch(() => 0)`). |
| `VueConsole.comptes` | `Record<string, number>` | 5 clés fixes, en français, avec accent et trait d'union : `Messages`, `Témoignages`, `Rendez-vous`, `Prospects`, `Projets` | Un `Map<String, Int>` en Kotlin perd l'ordre d'affichage et rend les clés invérifiables. |
| `VueRepetiteur.echange[].de` | `string` | `'me' \| 'ai'` (`repetiteur.ts:81`) | Ensemble fermé élargi ; et l'écriture `rysmo` parle `'user' \| 'assistant'` — deux vocabulaires, une traduction non contractuelle. |
| `VueMoi.role` | `string` | défaut `'student'` (`moi.ts:57`) ; le produit en a trois | Ensemble fermé élargi. |
| `VueSeance.collection` | `string` | jeton d'un ensemble fermé, **renvoyé au serveur** par `reserverSession`, qui le revalide (`reserverSession.ts:43`) | Un aller-retour de jeton typé `String` des deux côtés. |
| `VueLeconLigne.etat` | `'done' \| 'current' \| 'todo'` | idem (`lecon.ts:70`) | ✔ le seul ensemble fermé que le client avait conservé. |

**③ Divergence d'exposition : 5 des 28 ne franchissent pas la porte.**

`index.ts:34-39` ré-exporte **23** types. Manquent : `VueModuleFiche`, `VueFormation`,
`VueBlocages`, `VueCompteBloque`, `VueParrainage`. Rien ne casse — l'inférence les fournit aux
écrans — mais « la porte des données » (`index.ts:1-14`) n'est pas complète, et personne ne
pouvait le voir.

**④ Divergence sémantique : `vue: null` porte trois sens incompatibles.**

| Sens | Callables | Ce que l'écran doit dire |
|---|---|---|
| **Absence d'accès** | `appClub`, `appClubAgenda`, `appClubFil`, `appClubClassement`, `appClubParrainage`, `appClubBlocages`, `appClubListe` (×3) | « Le Club est réservé aux membres » |
| **Absence de donnée** | `appMoi` (`:41`), `appEspace` (`:41,56`), `appLecon` (`:41,45`), `appFormation` (`:82,85`), `appClubListe`·membre (`:142`) | « Tu n'as encore rien ici » |
| **Jamais nul** | `appCours`, `appNotes`, `appCertificats`, `appConsole`, `appMedia`, `appRepetiteur` | — |

Le client aplatissait les trois en `phase: 'vide'` (`vue.ts:91-93`). Le commentaire de
`useClub` (`index.ts:116-121`) énonce pourtant la nuance — « la différence décide de ce qu'on
lit après avoir laissé expirer son accès » — mais **rien dans le protocole ne la porte**.
Le serveur choisit délibérément `vue: null` plutôt que `permission-denied` pour le Club
(`club.ts:52-56`), et `permission-denied` pour la console (`console.ts:34-36`). Cette
asymétrie est un choix produit ; elle doit devenir **une donnée du contrat**, pas une
connaissance orale.

### F.4 · Récapitulatif chiffré

| | Serveur | Client RN | Écart |
|---|--:|--:|---|
| Callables `app*` | 17 | 17 appelées | — |
| Formes de réponse | 19 | 19 racines typées | — |
| Formes imbriquées | 17 | 9 nommées | **8 anonymes** |
| Enveloppe | 1 (`{vue, releveA}`) | 1 (`Reponse<T>`) | — |
| **Total des formes à nommer** | **37** | 28 nommées | **9 à nommer** (8 + l'enveloppe) |
| Types exposés par la porte | — | 23 / 28 | **5 non exposés** |
| Ensembles fermés respectés | 6 | 1 | **5 élargis** |
| Sens de `vue: null` | 3 | 1 | **2 perdus** |

### F.5 · Évaluation de la piste retenue au plan

> *un contrat généré (`vues.contrat.json`) produit depuis le serveur, consommé par un
> générateur de code des deux côtés, avec une porte de CI.*

**La direction est juste.** Une source, deux consommateurs générés, une porte : c'est
exactement la forme des mécanismes qui tiennent déjà dans ce dépôt — `ds:sync` + `ds:check`,
`og:cards --check` (`ci.yml:58`), `proof:check` (`:71`), `seo:check`. Et l'histoire du dépôt
dit laquelle mord : **celle qui compare deux artefacts**, jamais celle qui affirme une
constante.

**Mais « produit depuis le serveur » ne peut pas marcher ici, et il y a deux preuves.**

1. **Il n'y a rien à lire.** Les 17 handlers sont typés `Promise<unknown>` et construisent
   leur littéral en ligne, avec des ternaires, des `filter(Boolean).join(' · ')` et des
   IIFE (`clubListe.ts:150-154`). Aucun type n'existe à extraire. Un générateur devrait
   *interpréter* du code, pas le lire.
2. **Une porte fondée sur un motif textuel a déjà menti dans ce dépôt exact.** La première
   version de `worker-vues-natives.test.ts` cherchait `abonnementActif(` — motif que la
   *déclaration* de la fonction satisfait elle-même. « *Le test passait donc au vert sur un
   fichier dont le contrôle avait été retiré : vérifié en le retirant pour de bon, et il n'a
   rien dit* » (`worker-vues-natives.test.ts:71-77`). Cette porte-là gardait le contenu payant.

Extraire le contrat par expression régulière reproduirait ce mode d'échec sur toute la couche
de données. L'écrire à la main ferait un **quatrième** artefact à tenir synchrone — le mode
d'échec des audits périmés du dépôt.

### F.6 · ⭐ Ce que je recommande à la place : inverser la dépendance

**Le contrat n'est pas produit depuis le serveur. C'est le serveur qui est le premier
consommateur du contrat.**

```
      vues.contrat.json          ← LE SEUL artefact écrit à la main
              │
     ┌────────┼────────────────────┐
     ▼        ▼                    ▼
  contrat.ts  Vues.kt          Vues.swift        ← trois fichiers GÉNÉRÉS, commités
     │        │                    │
     ▼        ▼                    ▼
 17 handlers  Compose           SwiftUI
 `Promise<Reponse<'appMoi'>>`
     │
     ▼
 ⭐ LE COMPILATEUR TypeScript tient le serveur au contrat — dans un job qui existe déjà
```

**Les six pièces :**

1. `worker/apps/api/src/vues/vues.contrat.json` — normatif, versionné, relu comme du code.
2. `npm run vues:gen` produit trois fichiers :
   - `worker/apps/api/src/vues/contrat.ts` : un `type` par vue, plus `type Reponse<N> = {vue: Vue<N> | null, releveA: string}` ;
   - `android/app/src/main/kotlin/me/maxmorrys/rysmo/donnees/Vues.kt` : `@Serializable data class` + `enum class` ;
   - `ios/Rysmo/Donnees/Vues.swift` : `Codable struct` + `enum: String`.
3. **La signature des 17 handlers change de `Promise<unknown>` à `Promise<Reponse<'appMoi'>>`.**
   Une ligne par fichier. Le compilateur TypeScript devient alors le lien le plus solide de la
   chaîne, sans coût d'exécution, dans le job `workers` qui tourne déjà (`ci.yml:112`).
   ⚠️ C'est cette étape qui fait tout le travail. Sans elle, le contrat décrit le serveur ;
   avec elle, il le **contraint**.
4. `npm run vues:check` — la porte. Elle relance les trois générateurs dans un répertoire
   temporaire et compare au commité. Toute retouche à la main, toute génération périmée,
   échoue. C'est le motif exact de `og:cards --check`.
5. `npm run vues:check --routes` — la porte qui attrape le défaut intéressant. Elle assère que
   l'ensemble des noms de vue du contrat **égale** l'ensemble des clés `app*` de `HANDLERS`
   (`registry.ts`), et que chacun figure dans **les deux** listes `MIGRATED`. Elle reprend le
   raisonnement de `worker-routage-callables.test.ts` et referme l'angle mort que ce fichier
   déclare ouvert (`:88-97`).
6. Le contrat porte aussi les **écritures** et ce qu'elles périment (§D.3.b), pour que
   l'invalidation de cache soit générée et non tenue de mémoire.

**Pourquoi c'est meilleur que la piste initiale :**

| | Contrat depuis le serveur | Contrat vers le serveur |
|---|---|---|
| Ce qui tient le serveur | une expression régulière | **le compilateur** |
| Artefacts écrits à la main | 3 (serveur, Kotlin, Swift) + 1 dérivé | **1** |
| Mode d'échec connu du dépôt | oui (`vues-natives`, 1ʳᵉ version) | non |
| Dérive Kotlin ↔ Swift | possible | **impossible** : ni l'un ni l'autre n'est écrit à la main |
| Coût de mise en place | un extracteur AST | un générateur + 17 lignes de signature |

**Le seul vrai risque, nommé :** on peut faire mentir un contrat en changeant à la fois le JSON
et le handler dans un même commit. Aucune porte ne l'empêche — et aucune ne le peut. Ce que la
porte garantit, c'est qu'on ne peut pas le faire **par accident, ni sur une seule des trois
plateformes**, ce qui est le mode de dérive réel.

### F.7 · Rebrancher la porte native

`worker-routage-callables.test.ts:69-99` parcourt déjà `android/app/src` et `ios/Rysmo`, en
profondeur, mais ne connaît que les motifs TypeScript `appeler(` / `useVue(`. Pour qu'elle
morde à nouveau, deux conditions :

1. Le générateur émet, dans `Vues.kt` et `Vues.swift`, une constante par vue :
   `const val NOM = "appMoi"` / `static let nom = "appMoi"`. Les noms de callables sont alors
   des **littéraux repérables**, à un seul endroit par plateforme.
2. Le test ajoute ces deux motifs à son balayage. Il redevient alors une porte qui vérifie
   quelque chose au lieu de passer au vert sur un dossier vide.

⛔ **Le piège à ne pas reproduire :** `mobile-routes.test.ts` cherchait toute chaîne commençant
par `/` dans n'importe quel fichier — et la planche d'atelier citait les 48 adresses en dur.
« *Toute route y était donc “citée”, et le test restait vert alors qu'aucun écran de production
ne menait à onze d'entre elles* » (`garanties-a-reconstruire.md`, §2). Une planche de revue
Compose citerait de la même façon les 19 noms de vue. **Le balayage doit exclure explicitement
tout fichier d'aperçu (`@Preview`, `*Apercu*`, `*Preview*`) avant de compter.**

### F.8 · Le format exact du contrat

**Principes, chacun corrigeant un défaut mesuré ci-dessus :**

- **Un vocabulaire de types fermé**, pour que les trois générateurs soient totaux. Pas de
  chaîne libre à interpréter.
- **`nul` est explicite sur chaque champ**, sans valeur par défaut. C'est la réponse directe à
  `VueClub.bilan[].n` (§F.3②) : une nullabilité affirmée doit être une nullabilité écrite.
- **Toute forme imbriquée est nommée**, y compris les 8 anonymes (§F.3①).
- **Tout ensemble fermé est une `union`**, jamais un `texte` (§F.3②).
- **`vueNulle` dit ce que `null` signifie** (§F.3④).
- **Pas de date dans le fichier.** `proof:check` interdit les dates écrites à la main dans le
  contenu, et un horodatage rendrait chaque régénération diffante. Un entier `version` suffit.
- **`entree` distingue obligatoire et facultatif**, pour que `appFormation(slug)` se génère
  non-optionnel (§B.1).

**Vocabulaire de types :**

| Jeton | JSON | Kotlin | Swift |
|---|---|---|---|
| `texte` | string | `String` | `String` |
| `entier` | number | `Int` | `Int` |
| `decimal` | number | `Double` | `Double` |
| `booleen` | bool | `Boolean` | `Bool` |
| `horodatage` | string ISO 8601 UTC | `Instant` | `Date` |
| `{"liste": <type>}` | array | `List<T>` | `[T]` |
| `{"objet": "<Nom>"}` | object | `data class` | `struct` |
| `{"union": ["a","b"]}` | string fermé | `enum class` | `enum: String` |

**Squelette :**

```json
{
  "version": 1,
  "enveloppe": { "vue": "<forme|null>", "releveA": "horodatage" },

  "formes": {
    "<Nom>": {
      "doc": "…",
      "champs": {
        "<champ>": { "type": <type>, "nul": <bool>, "doc": "…" }
      }
    }
  },

  "vues": {
    "<callable>": {
      "discriminant": { "champ": "onglet", "valeur": "membre" },
      "forme": <type>,
      "vueNulle": "jamais" | "sansAcces" | "sansDonnee",
      "entree": { "<param>": { "type": <type>, "obligatoire": <bool> } },
      "erreurs": ["invalid-argument", "permission-denied"],
      "session": "obligatoire" | "obligatoire+club" | "obligatoire+role" | "anonyme",
      "source": "worker/apps/api/src/handlers/app/<f>.ts:<ligne>"
    }
  },

  "ecritures": {
    "<callable>": {
      "entree": { … },
      "sortie": <type>,
      "erreurs": [ … ],
      "session": "…",
      "perime": ["appNotes"],
      "source": "worker/apps/api/src/handlers/<f>.ts:<ligne>"
    }
  }
}
```

**Extrait travaillé — trois cas qui couvrent tous les pièges :**

```json
{
  "version": 1,
  "enveloppe": { "vue": "<forme|null>", "releveA": "horodatage" },

  "formes": {
    "Moi": {
      "doc": "Qui regarde. L'initiale est CALCULÉE côté serveur, jamais stockée.",
      "champs": {
        "prenom":          { "type": "texte",  "nul": false },
        "nom":             { "type": "texte",  "nul": false },
        "initiale":        { "type": "texte",  "nul": false },
        "email":           { "type": "texte",  "nul": true  },
        "ouvertureCompte": { "type": "texte",  "nul": true,
          "doc": "« 12 août » — déjà mis en forme, PAS une date à reformater." },
        "tuteur":          { "type": "texte",  "nul": true  },
        "role":            { "type": { "union": ["student", "admin", "support"] }, "nul": false,
          "doc": "⚠️ Le serveur défaut à 'student' (moi.ts:57). Ensemble fermé." },
        "xp":              { "type": "entier", "nul": false }
      }
    },

    "ClubBilanTuile": {
      "doc": "⚠️ NOMMÉE ICI parce qu'elle était anonyme des deux côtés. Voir `n`.",
      "champs": {
        "n": { "type": "entier", "nul": false,
          "doc": "⛔ NON NULLABLE, contre le commentaire de club.ts:88-89. Une agrégation refusée est servie comme 0 (`count(...).catch(() => 0)`, club.ts:63). Le distinguer exigerait un changement SERVEUR ; tant qu'il n'a pas lieu, le contrat dit la vérité du code, pas celle du commentaire." },
        "l": { "type": "texte", "nul": false }
      }
    },
    "Club": {
      "champs": {
        "echeance": { "type": "texte", "nul": true, "doc": "JJ/MM/AAAA, déjà mis en forme." },
        "depuis":   { "type": "texte", "nul": true, "doc": "Nom du mois, en français." },
        "bilan":    { "type": { "liste": { "objet": "ClubBilanTuile" } }, "nul": false }
      }
    },

    "Membre": {
      "champs": {
        "nom":           { "type": "texte", "nul": false },
        "initiales":     { "type": "texte", "nul": false },
        "metier":        { "type": "texte", "nul": true },
        "ville":         { "type": "texte", "nul": true },
        "depuis":        { "type": "texte", "nul": true },
        "presentation":  { "type": "texte", "nul": true },
        "formations":    { "type": { "liste": "texte" }, "nul": false },
        "contributions": { "type": "entier", "nul": false },
        "bloque":        { "type": "booleen", "nul": false },
        "id":            { "type": "texte", "nul": false,
          "doc": "⚠️ La SEULE sortie d'uid du produit, assumée : sans elle on ne peut pas débloquer depuis la fiche (clubListe.ts:162-165). Ni téléphone ni adresse ne sortent JAMAIS d'ici (clubListe.ts:26-29)." }
      }
    }
  },

  "vues": {
    "appMoi": {
      "forme": { "objet": "Moi" },
      "vueNulle": "sansDonnee",
      "entree": {},
      "erreurs": [],
      "session": "obligatoire",
      "source": "worker/apps/api/src/handlers/app/moi.ts:46"
    },

    "appClub": {
      "forme": { "objet": "Club" },
      "vueNulle": "sansAcces",
      "entree": {},
      "erreurs": [],
      "session": "obligatoire+club",
      "source": "worker/apps/api/src/handlers/app/club.ts:84"
    },

    "appClubListe.membre": {
      "discriminant": { "champ": "onglet", "valeur": "membre" },
      "forme": { "objet": "Membre" },
      "vueNulle": "sansAcces",
      "entree": {
        "onglet":  { "type": { "union": ["discussions", "opportunites", "membre"] },
                     "obligatoire": true, "constante": "membre" },
        "id":      { "type": "texte", "obligatoire": false },
        "message": { "type": "texte", "obligatoire": false,
          "doc": "Désigne un CONTENU ; le serveur en résout l'auteur. L'uid ne circule pas." }
      },
      "erreurs": ["invalid-argument"],
      "session": "obligatoire+club",
      "source": "worker/apps/api/src/handlers/app/clubListe.ts:144"
    }
  },

  "ecritures": {
    "ecrireUneNote": {
      "entree": {
        "texte":       { "type": "texte", "obligatoire": true },
        "lessonId":    { "type": "texte", "obligatoire": false },
        "lessonLabel": { "type": "texte", "obligatoire": false }
      },
      "sortie": { "objet": "NoteEcrite" },
      "erreurs": ["invalid-argument"],
      "session": "obligatoire",
      "perime": ["appNotes"],
      "source": "worker/apps/api/src/handlers/ecrireUneNote.ts:63"
    },
    "marquerLecon": {
      "entree": {
        "formationId": { "type": "texte", "obligatoire": true },
        "leconId":     { "type": "texte", "obligatoire": true },
        "faite":       { "type": "booleen", "obligatoire": true }
      },
      "sortie": { "objet": "BilanLecon" },
      "erreurs": ["invalid-argument", "not-found"],
      "session": "obligatoire",
      "perime": ["appEspace", "appLecon", "appCours", "appCertificats"],
      "source": "worker/apps/api/src/handlers/marquerLecon.ts:100"
    }
  }
}
```

### F.9 · ⛔ Deux règles de décodage sans lesquelles le contrat tue l'application

Ces deux règles n'existaient pas dans le port RN — les types TypeScript sont effacés à
l'exécution, rien ne pouvait échouer. **Sur Kotlin et Swift, elles décident si une version
installée survit à un déploiement du serveur.**

1. **Les clés inconnues sont ignorées.** `Json { ignoreUnknownKeys = true }` en Kotlin ; le
   `Codable` de Swift le fait déjà. Sans ce réglage, **ajouter un champ côté serveur casse
   toutes les applications installées**, d'un coup, sans déploiement client. Le serveur ajoute
   des champs — `niveau` a été ajouté à `appCours` pour sortir le niveau de `meta`
   (`cours.ts:62-67`).
2. **Une valeur d'union inconnue décode vers un cas nommé `inconnu`**, jamais en levant.
   `kotlinx.serialization` lève par défaut sur une valeur d'`enum` inattendue ; le `Codable`
   de Swift aussi. Un quatrième rôle, une quatrième catégorie de fil, une cinquième collection
   d'agenda — et l'écran tombe au lieu de dégrader. Le générateur émet donc systématiquement
   le cas de repli, et un `@Serializable(with = …)` / `init(from:)` qui y retombe.

---

## G · Ce que je n'ai pas pu déterminer

Nommé plutôt que deviné.

1. **Il n'existe aucune source iOS.** `ios/` n'existe pas dans l'arbre ; `android/` contient
   **12 fichiers** et **aucun `.kt`** — gradle, manifeste, thèmes, chaînes. Tout le Swift de
   ce document est une **proposition**, pas une lecture. Les chemins `ios/Rysmo/Donnees/` sont
   une convention que je pose, pas une convention que j'ai relevée.
2. **Le producteur du jeton d'identité n'existe pas côté Kotlin, et rien ne dit lequel ce
   sera.** `android/gradle/libs.versions.toml` ne déclare **aucune** dépendance Firebase. Deux
   voies ouvertes — le SDK Firebase Android (lourd, mais gère le rafraîchissement et la
   persistance) ou un client REST maison contre Identity Toolkit (ce que fait déjà le Worker
   côté serveur, `@mm/firebase-auth-rest`). Le port RN avait tranché pour le SDK, et pour une
   raison mécanique qui ne se transpose pas : `getAuth()` donne une persistance en mémoire sur
   React Native (`firebase.ts:28-31`). **Je ne tranche pas.** Mais §A.3 impose au vainqueur de
   savoir forcer un rafraîchissement.
3. **`Instant` vs `kotlinx-datetime` n'est pas tranché** (§E.2) : `minSdk = 24` sans désucrage
   activé. À décider avant la première `data class` générée, parce que le générateur émet ce
   type partout.
4. **Les valeurs de `NumSource`.** `Provenance.source` est typée `NumSource`, qui vit dans
   `mobile/ds/Num` — je ne l'ai pas énumérée. Seul `'server'` est produit par la couche de
   données (`vue.ts:88, 111`) ; `etat.ts:65` pose la constante `SOURCE` de `contenu/demo`.
5. **Le sort du mécanisme de réplique.** Les phases `replique` et `nonBranche` existaient pour
   `contenu/demo.ts`, dont les 33 sorties valent `null` en production **par construction**
   (`etat.ts:16-19`). Rien dans le dépôt ne dit si la réécrite garde ce dispositif. Je les ai
   conservées dans les machines à états pour ne pas décider à la place de quelqu'un ; si elles
   tombent, `Etat` passe à 6 phases et `SansDonnees` à 4 branches.
6. **`appConsole` doit-elle survivre ?** Elle sert une console de support à
   `admin`/`support` (`console.ts:27, 34-36`). Le port l'avait ; la garder dans une
   application grand public soumise à l'App Store est une décision produit, pas technique.
7. **Aucune mesure de charge utile ni de latence.** Je n'ai ni exécuté le Worker ni appelé la
   production. Les tailles de réponse (`appClubFil` coupe à 40 messages, `appRepetiteur`
   à 50 + 30 documents) sont lues dans le code, jamais observées. La fenêtre de cache de 30 s
   et le délai de 20 s sont **repris** du port, pas revalidés contre des mesures.
8. **Le champ `date` de `ecrireUneNote` vs `appNotes`** (§B.1) est une contradiction du
   serveur, pas du client. La trancher est une modification du Worker — hors du périmètre de
   cette spécification, qui la nomme et s'arrête là.
9. **Le sens exact de `VueClub.bilan[].n` non nullable** (§F.3②) : je documente ce que le code
   fait. Savoir si `.catch(() => 0)` doit devenir `.catch(() => null)` est une décision
   produit — « trois tuiles qui affichent “non relevé” valent mieux qu'un zéro qu'on n'a pas
   mesuré » est écrit dans le dépôt, mais n'y est pas implémenté.
10. **Le keystore et la continuité d'identité Android** restent non résolus
    (`android/app/build.gradle.kts:14-31`, renvoyant à `deferred-work.md`). Sans lien avec la
    couche de données, mais bloquant pour toute livraison qui la porterait.

---

## Vérification

**Commandes :**

- `cd worker && npm run typecheck` — attendu : aucune sortie. Après §F.6 étape 3, c'est cette
  commande qui tient les 17 handlers au contrat.
- `cd worker && npm test` — attendu : tout au vert.
- `npm test` (racine) — attendu : `worker-routage-callables`, `worker-vues-natives` et
  `worker-certificats` au vert.
- `npm run vues:check` — **à écrire.** Attendu : les trois fichiers générés sont identiques
  aux commités.
- `npm run vues:check --routes` — **à écrire.** Attendu : `contrat.vues` ≡ clés `app*` de
  `HANDLERS` ≡ sous-ensemble des **deux** listes `MIGRATED`.

**Contre-épreuves — une porte qui ne rougit jamais ne prouve rien :**

- retirer une vue du contrat sans toucher au handler → `vues:check --routes` doit rougir ;
- retirer un `requireAuth` d'un handler `app/` → `worker-vues-natives` doit rougir
  (`:49-52`) ;
- retirer un nom de `MIGRATED` sans retirer le handler → `worker-routage-callables` doit
  rougir (`:144-149`) ;
- modifier `Vues.kt` à la main → `vues:check` doit rougir ;
- **rendre un champ nullable dans le contrat sans le rendre nullable dans le handler** →
  `npm run typecheck` du worker doit rougir. **C'est cette contre-épreuve-là qui prouve que le
  mécanisme vaut mieux que l'ancien** : aucune expression régulière ne l'attrape.
