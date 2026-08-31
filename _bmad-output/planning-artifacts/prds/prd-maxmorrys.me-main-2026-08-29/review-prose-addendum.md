# Revue de prose — `addendum.md`

Copy-editing clinique. Cible : `_bmad-output/planning-artifacts/prds/prd-maxmorrys.me-main-2026-08-29/addendum.md`
(315 lignes). Lecteur type retenu pour tous les arbitrages : **un développeur qui rejoint le projet
et doit éviter un dégât avant son premier déploiement.** Diagonale d'abord, puis relecture clavier
en main sur deux ou trois passages.

Aucune coupe ni réorganisation proposée : la structure vient d'être traitée. Aucun fichier modifié.

---

## 0. Verdict tranché — la périphrase contre le nom de fichier

**C'est une coquetterie, et elle coûte. Il faut inverser la règle — mais pas partout.**

Quatre constats, dans l'ordre où ils m'ont convaincu.

**1. Le document ne tient déjà pas sa propre règle.** Il cite en clair, entre accents graves,
`createBrowserRouter`, `darkMode: 'class'`, `package.json`, `npm ci`, `npm install`, `Buffer`,
`wrangler deploy`, `/via/<slug>`, `firebase-tools`, `export JAVA_HOME=/opt/homebrew/opt/openjdk@21`,
`clsx`, `react-router`, `robots.txt`, `{uid}_{formationId}`, `support`, `src/`, `functions/src/`,
`worker/`, et quatre chemins de documents (`docs/MAXMORRYS-CURRENT-STATE.md`,
`_bmad-output/project-context.md`, `BUSINESS_MODEL.md`, `BUSINESS_PLAN.md`). L'interdit ne pèse
donc que sur **les fichiers source de l'application** — exactement la catégorie que le lecteur doit
ouvrir. C'est le pire découpage possible : le lecteur apprend en trois pages que les accents graves
sont fiables, puis il tombe sur les six phrases qui lui demandent d'aller éditer quelque chose, et
elles seules sont muettes.

**2. La périphrase supprime précisément la chaîne qui permettrait de trouver.** Cas d'école, ligne 217 :

> L'utilitaire de composition de classes **n'est pas** l'association habituelle de `clsx` et d'un
> résolveur de conflits Tailwind

La phrase nomme la bibliothèque que la chose **n'est pas** (`clsx`, greppable, et qui ne rend rien
d'utile ici) et tait la fonction qu'elle **est**. Le lecteur ne peut pas chercher « utilitaire de
composition de classes ». Il peut chercher `cn`.

**3. Le coût est mesurable : six périphrases, six réponses d'une ligne retenues.** J'ai vérifié
chacune dans le dépôt — toutes ont une cible unique et greppable :

| Périphrase du document | Ligne | Ce qu'elle cache |
|---|---|---|
| « l'utilitaire de composition de classes » | 217 | `cn()` — `src/lib/utils.ts:2` |
| « le point de passage unique » (erreurs) | 163 | `src/lib/sentry.ts` (seul fichier appelant `captureException`) |
| « la liste blanche des champs de profil » | 176 | `ALLOWED_PROFILE_FIELDS` — `src/lib/firestore/users.ts:17` |
| « déclaré à un seul endroit » (rôle support) | 196 | `SUPPORT_ALLOWED_PATHS` — `src/lib/adminAccess.ts` |
| « la table de segments » | 136 | `src/i18n/segments.ts` (et `src/i18n/routing.ts`) |
| « Module de paiement des Cloud Functions » / « Portage du même module côté Worker » | 117-118 | `functions/src/payment.ts:249` et `worker/apps/api/src/lib/bictorys.ts:123` |

Chacune de ces lignes est une session de recherche imposée au lecteur, dans un document dont
l'argument de vente est justement de lui épargner les pièges.

**4. Le code du dépôt ne fait pas cette économie.** L'en-tête de `src/lib/adminAccess.ts` est
rédigé en français, en prose, et nomme `AdminLayout`, `AdminRoute`, `firestore.rules`, `adminOnly`,
`isAdmin()`, `isAdminOrSupport()`. Le style maison est donc déjà « français + identifiants bruts ».
L'addendum invente une règle que le code qu'il décrit n'applique pas.

### La règle inverse que je propose

> **La périphrase pour l'idée, l'identifiant pour l'action.**
> Toute phrase qui demande au lecteur d'ouvrir, d'éditer ou de vérifier quelque chose se termine par
> le chemin ou le symbole exact, entre accents graves. La périphrase reste bienvenue **en tête** de
> phrase, pour dire ce que la chose *fait* ; elle ne peut pas être **le dernier mot d'une consigne**.

Ce n'est pas « nommer les fichiers partout ». La périphrase gagne quand l'énoncé est un principe qui
doit survivre au fournisseur : « Ne jamais appeler directement le rapporteur d'erreurs tiers » vaut
mieux que « ne jamais importer `@sentry/react` », parce que la règle tiendra après un changement
d'outil. Il suffit de raccrocher :

> Ne jamais appeler directement le rapporteur d'erreurs tiers : passer par le point de passage
> unique (`captureError`, `src/lib/sentry.ts`), qui retombe sur la console en l'absence de
> configuration et reste désactivé en développement.

Coût total de l'inversion sur les six cas : une soixantaine de mots. Le document a déjà écrit
« `wrangler deploy` reste nécessaire » (ligne 63) — la ligne que le nouvel arrivant citera le plus.
Personne n'a écrit « l'outil de déploiement du fournisseur de bord ». C'est la preuve que la règle
inverse était l'instinct correct, et qu'elle s'est arrêtée à mi-chemin.

---

## 1. Le gras — réponse chiffrée

**Décompte réel : 31 passages en gras** (`grep -o '\*\*[^*]*\*\*'`), pas 33. Sur 315 lignes, c'est
un gras toutes les dix lignes.

**Le chiffre n'est pas le problème. Le problème est que 18 des 31 ne sélectionnent rien**, parce
qu'ils sont posés sur des listes où **tous les frères** portent le gras. Un gras unanime n'est plus
de l'emphase, c'est un changement de graisse par défaut :

| Passage | Éléments | En gras | Effet |
|---|---|---|---|
| §2.2 Trois pièges (l. 72-82) | 3 | 3 | annule |
| §4 Trois silences (l. 171-178) | 3 | 3 | annule |
| §5 Invariants (l. 190-201) | 4 | 4 | annule |
| §7 Rysmo (l. 237-240) | 2 | 2 | annule |
| Annexe C (l. 305-315) | 4 | 4 | annule |

**Deuxième défaut, plus discret : deux grammaires de gras cohabitent sans être distinguées.** Le
gras d'*emphase* (« **pas** le stockage Firebase », l. 23) et le gras de *balisage* — les quatre
amorces de l'annexe A (`**Vérification publique des certificats.**`, l. 250, 262, 270, 275) et
`**Règle de méthode.**` (l. 298), qui tiennent lieu de sous-titres dans une annexe en prose. Le
lecteur en diagonale ne peut pas savoir si un gras l'avertit d'un danger ou lui indique un
paragraphe. Il finit par ne plus s'arrêter sur aucun.

### Ce qui mérite de rester : 12 emphases + 5 balises = 17

**Emphase — garder (12) :** le gras y porte le verdict qui empêche un dégât.

- l. 23 `**pas**` — R2 et non le stockage Firebase : c'est tout le contenu de la ligne
- l. 34 `**Le fichier de verrouillage fait foi**`
- l. 49 `**La duplication serveur est structurelle, pas négligente**` — thèse isolée, aucun frère
- l. 62 `**ni les règles Firestore, ni les index, ni les Cloud Functions, ni les Workers**`
- l. 72 / 79 / 144 — les trois pièges destructeurs et le segment de retour de paiement, **à condition
  de les raccourcir** (voir ci-dessous)
- l. 162 `**Ne jamais appeler directement le rapporteur d'erreurs tiers**`
- l. 176 le gras des champs de profil, réduit à `**ignore silencieusement**` (voir §4)
- l. 213 `**2,6:1 sur blanc — interdite pour du texte**`
- l. 217 `**n'est pas**` — la croyance fausse que le lecteur apporte avec lui
- l. 272 `**suppression**` — le mot surprenant du paragraphe

**Balisage — garder (5), mais les marquer autrement :** l. 250, 262, 270, 275, 298. Ce sont des
sous-titres, pas des alertes. Une graisse plus faible, une italique ou un `###` les distinguerait
du gras d'avertissement sans rien coûter.

### Ce qui doit tomber (14)

- **Les trois gras de tableau** (l. 117 `**reconstruire après**`, l. 119 `**et**` et
  `**Texte contractuel**`). `**et**` est le plus faible du document : du gras sur une conjonction.
  Une cellule de tableau est déjà un objet visuel isolé ; la graisse y entre en concurrence avec la
  grille. La contrainte « reconstruire après » n'est pas une emphase, c'est une consigne : elle
  appartient à une colonne « Après édition » (voir §2).
- **Les quatre gras de §5** (l. 190, 193, 196, 199) : la liste numérotée fait déjà le repérage.
- **Les quatre gras de l'annexe C** (l. 305, 308, 312, 314) : le tiret de puce fait déjà le repérage.
- **Les deux gras de §7** (l. 237, 239) : deux items sur deux.
- **Un des trois gras de §4** (garder celui qui nomme le mode de défaillance, laisser les deux
  autres en romain).

### Règle à retenir

> Le gras ne s'emploie que **là où il sélectionne**. Jamais quand tous les frères de la liste le
> portent. Jamais dans une cellule de tableau. **Jamais au-delà de huit mots** — au-delà, ce n'est
> plus une emphase, c'est un surligneur.

Trois passages violent la limite des huit mots : l. 62 (12 mots), l. 72 (13 mots), l. 144 (16 mots).
Exemple de correction, l. 144 :

> `**Le segment de retour de paiement est codé en dur dans deux fichiers serveur.**`
> → `Le segment de retour de paiement est **codé en dur dans deux fichiers serveur**.`

---

## 2. Les passages relus clavier en main : écrits pour être lus, pas exécutés

Verdict global : **un sur trois est exécutable.** La règle qui manque est simple — *un impératif en
tête de chaque élément, et la commande sur sa propre ligne.*

### 2.1 Le tableau des miroirs de prix (§3.1, l. 114-124) — écrit pour être lu

Trois défauts qui l'empêchent d'être utilisé.

**(a) La colonne « Emplacement » ne contient aucun emplacement.** « Source de vérité côté client »,
« Module de paiement des Cloud Functions », « Portage du même module côté Worker » : ce sont des
descriptions de rôle. Un tableau dont la colonne *Emplacement* ne localise rien échoue à sa seule
fonction. Les six cibles existent et tiennent en une ligne chacune (voir le tableau du §0).

**(b) Le compte ne se réconcilie pas.** Ligne 110 : « recopié à **treize** endroits ». Le tableau a
**six** lignes. Le lecteur qui coche ses éditions ne sait pas s'il en a oublié sept, ou si six
lignes couvrent treize occurrences (c'est probablement le cas : « Fichiers de langue des conditions
générales, FR **et** EN » vaut au moins deux). Une colonne « Occurrences » réglerait l'affaire, ou
une phrase : « treize occurrences réparties sur six emplacements ».

**(c) La seule consigne d'action est asymétrique.** `**reconstruire après**` figure sur la ligne des
Cloud Functions et pas sur celle du Worker — alors que le §2.1 vient d'expliquer que le Worker
exige `wrangler deploy`. Le lecteur lira cette asymétrie comme un signal (« donc rien à faire côté
Worker »). Il déploiera un prix incohérent. Une colonne **« Après édition »** portant `npm run build`
+ `firebase deploy --only functions` d'un côté, `wrangler deploy` de l'autre, supprime l'ambiguïté.

**(d) « Couvert par un test ? oui »** ne nomme pas le test. Un « oui » qu'on ne peut pas relancer
n'est pas plus actionnable qu'un « non ».

### 2.2 Les six emplacements de renommage (§3.2, l. 135-145) — la liste la plus proche du but, et elle s'arrête à mi-chemin

C'est la meilleure page du document — et la plus frustrante, parce qu'il ne lui manque qu'un verbe
par ligne.

**(a) Six syntagmes nominaux, zéro verbe.** « la table de segments ; », « le pré-rendu des
fonctions ; », « le plan de site du Worker. » C'est une liste de *choses*, pas de *gestes*. Le
lecteur doit deviner l'action à chaque ligne (éditer ? régénérer ? redéployer ? les trois ?). Forme
attendue : **verbe + objet nommé + comment vérifier**.

**(b) Le seul point vérifiable est le seul qui porte une quantité.** Le point 2 dit « 34 au total,
dont 15 sous `/en` » — et c'est exactement ce qui le rend cochable : le lecteur compte, il sait
quand il a fini. Les cinq autres n'ont ni quantité, ni fichier, ni critère d'arrêt. Le point 2 est
le modèle des cinq autres, pas l'exception.

**(c) Le compte annoncé est faux dans le cas le plus dangereux.** Ligne 135 : « *Renommer* un
segment public en demande **six** ». Puis ligne 144, en gras, un septième emplacement arrive : le
segment de retour de paiement, codé en dur dans deux fichiers serveur. Le lecteur qui a compté
jusqu'à six s'arrête à six. Correction minimale :

> *Renommer* un segment public en demande six — **sept si ce segment est celui du retour de
> paiement.**

### 2.3 Les trois pièges destructeurs (§2.2, l. 70-82) — deux sur trois sont exécutables

**Piège 1 : correct.** Il finit sur un impératif — « Vérifier la branche avant tout
`wrangler deploy` ». C'est le modèle.

**Piège 3 : correct sur le fond, mal placé sur la forme.** La commande qui débloque tout est
enfouie dans une parenthèse en milieu de phrase : `(export JAVA_HOME=/opt/homebrew/opt/openjdk@21)`.
Le lecteur clavier en main doit l'extraire d'une incise. Une commande se pose sur sa propre ligne,
en bloc. Le symptôme, lui, est bien décrit : « rien n'indique que les règles n'ont pas été testées ».

**Piège 2 : aucun impératif, et une chute fataliste.** Il énonce un état (« Il n'existe aucun
environnement de préproduction »), puis une conséquence (« une prévisualisation partage donc la
base, les règles et les fonctions de production »), puis abandonne le lecteur :
« C'est la raison pour laquelle une migration de données ne se teste nulle part. » Le lecteur qui
arrive ici avec le clavier n'a rien à taper et rien à vérifier. Si la réponse honnête est « il n'y a
rien à faire », il faut l'écrire **comme une consigne**, pas comme un constat :

> **Ne jamais lancer de migration de données depuis une prévisualisation** : elle s'exécute sur la
> base de production. Il n'existe aucun environnement où la répéter d'abord.

Même remarque, plus légère, sur §2.1 l. 67-68 : « comparer l'empreinte du bundle servi par le
domaine à celle du build local » est bien un impératif, mais « l'empreinte » ne dit pas quoi
calculer sur quel fichier. C'est une vérification que le lecteur est censé exécuter ; elle mérite sa
commande.

---

## 3. Tics et redites, avec fréquences

**Motif 1 — l'antithèse « X, pas Y » : 13 occurrences.**
Neuf sur le pivot *pas* (l. 49, 90, 161, 166, 215, 237, 267, 307, et l. 118) ; quatre sur le pivot
*jamais* (l. 160, 171, 191, 298). Le mot **jamais** compte 10 occurrences au total.
La figure est bonne — elle corrige une croyance. Elle s'use quand elle sert de gabarit : les lignes
160 à 166 en alignent **trois en sept lignes** (« en type inconnu, jamais en type quelconque » /
« par transtypage, pas par test d'instance » / « une fonction, pas une liste figée »).
*Règle :* la garder là où le lecteur porte réellement la croyance fausse (l. 49, l. 217). Ailleurs,
n'énoncer que le terme positif.

**Motif 2 — la phrase clivée « C'est… qui / C'est la raison… » : 8 occurrences** (l. 28, 50, 68, 77,
190, 193, 218, 267). Deux d'entre elles sont à neuf lignes d'écart (l. 68 « C'est la seule
vérification qui tranche. » / l. 77 « C'est la raison pour laquelle… »). La clivée est un
intensificateur ; huit fois, elle ne détache plus rien.
*Règle :* une clivée par section au maximum ; ailleurs, la phrase simple.

**Motif 3 — le vocabulaire de la source unique : 6 étiquettes pour un seul concept.**
« sans **point de contact** » (l. 110), « le **point de passage** unique » (l. 163),
« **Emplacement** » (l. 114), « déclaré à un seul **endroit** » (l. 196), « Un second **endroit** »
(l. 198), « un second **endroit** » (l. 273) — plus « **Source de vérité** côté client » (l. 116) et
« une **table unique** » (l. 272). L'idée centrale du document (une valeur, un lieu) porte huit
noms. Le lecteur ne peut pas construire le concept, et il ne peut pas chercher le terme.
*Règle :* un seul terme, partout. **« source unique »** — c'est déjà celui du tableau des prix, et
c'est celui que le code emploie (`src/lib/adminAccess.ts` : « SOURCE UNIQUE DE VÉRITÉ »).

**Motif 4 — le tiret cadratin comme ponctuation par défaut : 27 occurrences en 315 lignes**, dont
**une seule paire fermée** (l. 255). Il fait indifféremment office de deux-points, de parenthèse et
de virgule :
- introduction de liste (rôle du deux-points) — l. 64 : « pour le code du Worker — pré-rendu,
  en-têtes de bord, et la table de redirections » ;
- apposition (rôle du deux-points) — l. 96 : « Une exception connue — la charge d'abonnement au
  Club est implémentée… » ;
- correction (rôle de la virgule) — l. 23 : « via un sous-domaine dédié — **pas** le stockage
  Firebase ».

*Règle :* réserver le tiret à la **rupture** et à la **correction**. Employer le deux-points quand
ce qui suit **développe** ce qui précède. Environ un tiers des 27 relèvent du deux-points.

**Motif 5 — « silencieusement / en silence » : 4 occurrences** (l. 30, 132, 175, 176), plus trois
paraphrases de la même idée : « sans qu'aucun outil ne le signale » (l. 105), « rien n'indique
que » (l. 82), et le titre « Trois silences à connaître » (l. 169). Sept énoncés d'une seule thèse.
Ce n'est pas un défaut en soi — c'est le sujet du document — mais l'adverbe finit par remplacer la
description du symptôme (voir §4). *Règle :* nommer la thèse une fois, puis décrire l'observable à
chaque occurrence.

**Motif 6 — « casse / casser » pour quatre défaillances différentes : 5 occurrences** (l. 30, 90,
150, 157, 185). Traité au §4, c'est d'abord un problème de précision.

**Observation, pas défaut — la chute en fragment-verdict.** Cinq sections sur sept se terminent sur
une phrase courte et sèche : « C'est la seule vérification qui tranche. » (l. 68), « Les
interrupteurs de bascule doivent rester réversibles (NFR-13). » (l. 99), « Le code de production
est lisible. » (l. 181), « Suivre le fichier environnant, ne pas étendre à une zone nouvelle. »
(l. 225), « L'échelle typographique personnalisée existe mais est quasiment inutilisée. » (l. 229).
C'est une voix, et elle est bonne. Mais quand toutes les sections atterrissent de la même façon, la
dernière ligne cesse d'être lue comme un verdict. À surveiller, pas à corriger.

---

## 4. Précision technique

### 4.1 Un verbe pour quatre échecs : « casse »

Cinq emplois, quatre modes de défaillance incompatibles. Le lecteur doit reconnaître la panne ; le
verbe ne le lui permet pas.

| Ligne | Texte | Ce que le lecteur voit réellement |
|---|---|---|
| 30 | « Tailwind 4 **casserait** silencieusement une quarantaine de jetons » | rien ne casse : la classe compile, l'élément s'affiche sans couleur |
| 90 | « Une installation cassée **casse** la construction entière » | la construction s'arrête — mais à quelle étape, avec quel message ? |
| 150 | « **casse** son appel » | l'appel renvoie un code HTTP, à préciser |
| 157 | « un import mort **casse** la chaîne » | l'étape de vérification de types échoue, code TS6133 |
| 185 | titre « Invariants à ne pas **casser** » | usage figuré, celui-là est légitime |

*Règle :* remplacer « casse » par le **symptôme observable**. C'est la seule information qui sert au
lecteur au moment où l'incident se produit.

Même remarque sur « Une **installation cassée** » (l. 90) : quelle installation, celle des paquets
ou celle du binaire natif ? Deux diagnostics opposés.

### 4.2 Les quatre silences : un seul est reconnaissable

Test appliqué à chacun — *à quoi le lecteur reconnaît-il ce silence ?*

**Le meilleur, à prendre pour modèle — la route anglaise (l. 132-133).** « Sans le second, la
version anglaise sert silencieusement l'URL française. » Le lecteur sait où regarder : la barre
d'adresse. Symptôme nommé, observable immédiat. Aucune correction.

**Signature du webhook (l. 171-173) — mécanisme excellent, symptôme absent.** « La vérification
échoue fermé — absence de signature ou de secret vaut rejet. » Le comportement interne est net,
mais « échoue fermé » ne dit pas ce que le lecteur rencontrera. Le symptôme réel, celui qui
l'amènera à cette page, est ailleurs : *le paiement réussit chez le prestataire et n'arrive jamais
en base.* C'est cela qu'il faut écrire.

**Secrets déclarés fonction par fonction (l. 174-175) — à moitié reconnaissable.** « il vaut chaîne
vide, silencieusement » donne la valeur, pas la conséquence. Une clé vide ne se voit qu'au
moment de l'appel tiers, en production seulement, sous la forme d'un 401 du fournisseur — pas d'une
erreur de configuration. Cette chaîne causale doit figurer.

**Liste blanche des champs de profil (l. 176-178) — le verbe est faux, pas seulement vague.**

> « **La liste blanche des champs de profil rejette silencieusement** ce qui n'y figure pas. »

Il n'y a **aucun rejet**. Le code (`updateUserProfile`, `src/lib/firestore/users.ts:24-27`) filtre
l'objet *avant* l'écriture : l'écriture réussit, le champ n'est simplement jamais transmis. La
différence est opérationnelle : « rejette » envoie le lecteur chercher une erreur de permission
dans la console, où il ne trouvera rien. La phrase suivante, elle, décrit juste le phénomène
(« une interface qui semble fonctionner et n'enregistre rien ») — ce qui isole le verbe comme
l'intrus. Correction :

> **La liste blanche des champs de profil ignore silencieusement** ce qui n'y figure pas :
> l'écriture réussit, le champ n'est jamais envoyé. (`ALLOWED_PROFILE_FIELDS`,
> `src/lib/firestore/users.ts`)

### 4.3 Chiffres et termes non ancrés

- **l. 30 « une quarantaine de jetons de couleur ».** Le document donne ailleurs 34, 15, 23, 8, 10,
  13, 3, 6, 9. « Une quarantaine » détonne : soit le compte exact, soit « tous ».
- **l. 33 « Trois mineures ont par ailleurs dérivé au-dessus de leur valeur déclarée ».** La phrase
  qui justifie la règle `npm ci` retient les trois noms. Sans eux, la règle est à croire sur parole
  — dans un document dont l'annexe B interdit précisément cela.
- **l. 20 « TanStack Query dans 10 fichiers ».** Critère de comptage absent (import ? usage ?) :
  invérifiable, donc non réplicable par le lecteur suivant.
- **l. 94-97 « le portage existe, activé en préversion » / « charges et webhook ».** « Préversion »
  arrive sans glose dans un document qui glose tout : drapeau ? clé de configuration ? Le lecteur ne
  peut pas lire l'état courant. Et « charges » est le seul anglicisme métier non traduit du
  document — inattendu de la part d'un texte qui traduit « lockfile » en « fichier de verrouillage ».
- **l. 124 « plus le corps de texte du pré-rendu utilisé pour le référencement ».** « plus » se lit
  d'abord comme un comparatif ; « auxquels s'ajoute » lève l'ambiguïté.
- **Codes du PRD (FR-089, NFR-01, R-11, FR-088, NFR-13, NFR-03, NFR-09, FR-037→045, NFR-10, FR-092,
  D-03) : 11 identifiants, aucun renvoi.** C'est acceptable pour un addendum — mais une ligne
  d'amorce (« les codes FR-/NFR-/R-/D- renvoient au PRD ») coûte une phrase et évite au nouvel
  arrivant de chercher un glossaire qui n'existe pas.

---

## 5. Annexe A — la tenue du temps

**Verdict : la règle est bonne, elle est annoncée, elle tient au niveau du paragraphe — et elle
lâche à l'intérieur des phrases, dans trois paragraphes sur quatre.**

L'ouverture est nette et fait son travail de bascule : « Quatre exigences **décrivaient** un
comportement qui n'**existait** pas. Elles **ont été corrigées**… ce qui suit **est** le
raisonnement. » Le lecteur est prévenu.

La règle réellement suivie — et elle est juste — est à trois temps :
**imparfait pour le défaut · conditionnel passé pour l'écarté · présent pour ce qui tient encore.**
Elle n'est simplement ni énoncée ni appliquée uniformément.

**Deux ruptures franches, à corriger.**

**(a) l. 256 — rupture de parallélisme dans une même énumération.** Les deux alternatives écartées
ne prennent pas le même temps :

> ouvrir la collection en lecture **aurait suffi** en une ligne, mais **aurait permis** […] et
> **aurait exposé** les identifiants ; un point d'accès HTTP sur le Worker **évitait** tout
> changement de règle

Les deux branches sont contrefactuelles ; la seconde doit suivre la première :
**« aurait évité tout changement de règle »**. En l'état, l'imparfait laisse croire que ce point
d'accès a existé.

**(b) l. 263-264 — trois temps dans une seule phrase.**

> Câbler naïvement **ouvrait** une boucle : décocher puis recocher **aurait rapporté** indéfiniment,
> et cette expérience **alimente** le classement et les badges de parrainage.

Imparfait, puis conditionnel passé, puis présent. « Ouvrait » décrit une hypothèse jamais réalisée
— il devrait être **« aurait ouvert »**, en accord avec « aurait rapporté ». Le présent final
(« alimente ») est correct sur le fond — c'est encore vrai — mais il atterrit en fin de phrase
passée, sans marqueur ; le lecteur trébuche.

**Deux retours au présent défendables, dont un mal signalé.**

- **l. 250-251 (bien).** « Le document de certificat **est** identifié par `{uid}_{formationId}`,
  mais la page de vérification n'**en connaît** que le code. » Présent légitime : le schéma
  d'identifiant tient toujours. La bascule vers l'imparfait qui suit (« Elle **faisait** donc… »)
  est bien exécutée.
- **l. 266-268 (moins bien).** « ce que le commentaire de la règle **recommande** […] c'**est** un
  chantier, pas un correctif, et le plafond par écriture **continue** de borner l'exposition. »
  Présent correct, mais c'est le troisième changement de temps du paragraphe et il arrive sans
  préavis.

**Le modèle à imiter est dans le document même — ¶4, l. 277-278 :**

> **Limite assumée et écrite dans l'exigence :** les écrans qui écrivent directement depuis le
> navigateur ne sont pas tracés.

Le retour au présent y est **annoncé par une amorce** (« Limite assumée… »). C'est exactement ce
qui manque aux deux autres. *Règle :* dans l'annexe A, tout retour au présent s'introduit par une
amorce — « Limite assumée : », « Toujours vrai : », « À ce jour : ».

**¶3 (l. 270-273) est le plus propre :** imparfait de bout en bout pour le défaut, imparfait final
pour ce qui a été supprimé (« c'était un second endroit »). Aucune correction.

**Défaut de balayage, mineur mais réel.** Les étiquettes italiques sont dans un ordre variable :
¶1 place *Alternatives écartées* avant *Retenu* ; ¶2 place *Retenu* avant *Alternative écartée* ;
¶3 et ¶4 n'ont que *Retenu*. Dans une annexe explicitement conservée « pour qui voudrait le
rouvrir », le lecteur qui cherche ce qui a été écarté doit lire les quatre paragraphes en entier.
Un ordre fixe — *Retenu*, puis *Écarté* — suffit.

---

## 6. Table des corrections

Regroupées par motif, dédoublonnées. Les numéros de ligne renvoient à `addendum.md` dans son état
actuel.

| Texte original | Texte révisé | Ce qui change et pourquoi |
|---|---|---|
| « L'utilitaire de composition de classes **n'est pas** l'association habituelle de `clsx` et d'un résolveur de conflits Tailwind » (l. 217) | « `cn()` (`src/lib/utils.ts`) **n'est pas** l'association habituelle de `clsx` et d'un résolveur de conflits Tailwind » | Applique la règle « identifiant pour l'action ». La phrase nommait la bibliothèque qu'on n'utilise pas et taisait la fonction qu'on utilise : la seule chaîne cherchable manquait. Idem l. 136, 163, 176, 196 et cellules l. 116-118. |
| « passer par le point de passage unique, qui retombe sur la console » (l. 163) | « passer par le point de passage unique (`captureError`, `src/lib/sentry.ts`), qui retombe sur la console » | La périphrase reste — le principe survit au changement de fournisseur — mais la consigne ne se termine plus sans cible. |
| « **La liste blanche des champs de profil rejette silencieusement** ce qui n'y figure pas. » (l. 176) | « **La liste blanche des champs de profil ignore silencieusement** ce qui n'y figure pas : l'écriture réussit, le champ n'est jamais envoyé. (`ALLOWED_PROFILE_FIELDS`, `src/lib/firestore/users.ts`) » | Correction factuelle : il n'y a pas de rejet mais un filtrage avant écriture. « Rejette » envoie chercher une erreur de permission inexistante. |
| « il vaut chaîne vide, silencieusement. » (l. 175) | « il vaut chaîne vide, silencieusement — l'appel au service tiers échoue alors en 401, à l'exécution et en production seulement. » | Le silence était nommé sans son symptôme. Ajoute l'observable par lequel le lecteur reconnaîtra la panne. |
| « La vérification échoue fermé — absence de signature ou de secret vaut rejet. » (l. 173) | « La vérification échoue fermé — absence de signature ou de secret vaut rejet. Symptôme observé : le paiement aboutit chez le prestataire et n'arrive jamais en base. » | Même motif : décrit ce que le lecteur rencontrera, pas seulement ce que le code décide. |
| « casse son appel » (l. 150) · « casse la chaîne » (l. 157) · « casse la construction entière » (l. 90) · « casserait silencieusement » (l. 30) | Remplacer chaque « casse » par le symptôme : code HTTP renvoyé · « fait échouer l'étape de vérification de types (TS6133) » · nommer l'étape qui s'arrête · « la classe compile et l'élément s'affiche sans couleur » | Un verbe unique recouvre quatre défaillances incompatibles. Le lecteur doit reconnaître la panne ; « casse » ne le lui permet pas. |
| « *Renommer* un segment public en demande six : » (l. 135) | « *Renommer* un segment public en demande six — **sept si ce segment est celui du retour de paiement.** » | Le compte annoncé est faux dans le cas le plus dangereux : un septième emplacement apparaît neuf lignes plus bas. Un lecteur qui compte s'arrête à six. |
| Les six éléments de la liste de renommage (l. 136-142), tous en syntagme nominal | Un verbe en tête de chacun, sur le modèle du point 2 qui est le seul cochable : « Éditer la table de segments (`src/i18n/segments.ts`) », « Régénérer le plan de site du Worker », etc. | Liste de choses convertie en liste de gestes. Le point 2 est le seul à porter une quantité (« 34 au total, dont 15 sous `/en` ») et c'est ce qui le rend vérifiable ; c'est le modèle, pas l'exception. |
| Piège 2, qui finit sur « C'est la raison pour laquelle une migration de données ne se teste nulle part. » (l. 77-78) | Ouvrir sur l'impératif : « **Ne jamais lancer de migration de données depuis une prévisualisation** : elle s'exécute sur la base de production. Il n'existe aucun environnement où la répéter d'abord. » | Seul des trois pièges à ne contenir aucun impératif. Le constat fataliste ne laisse rien à faire au lecteur clavier en main. |
| `(export JAVA_HOME=/opt/homebrew/opt/openjdk@21)` en incise (l. 81) | Sortir la commande en bloc sur sa propre ligne | Une commande enfouie dans une parenthèse en milieu de phrase doit être extraite manuellement au moment où on en a besoin. |
| Colonne « Emplacement » du tableau des prix (l. 114-121) | Y porter les chemins réels : `functions/src/payment.ts`, `worker/apps/api/src/lib/bictorys.ts`, `src/i18n/…`, etc. | Une colonne intitulée « Emplacement » qui ne localise rien échoue à sa seule fonction. |
| « Le tarif du Club a été recopié à treize endroits » + tableau de six lignes (l. 110-121) | « recopié à treize reprises, réparties sur six emplacements » — ou ajouter une colonne « Occurrences » | Le lecteur qui coche ses éditions ne peut pas réconcilier 13 et 6, donc ne sait pas quand il a fini. |
| `**reconstruire après**` sur la seule ligne des Cloud Functions (l. 117) | Colonne « Après édition » remplie pour **toutes** les lignes de code : `firebase deploy --only functions` d'un côté, `wrangler deploy` de l'autre | L'asymétrie se lira comme un signal (« rien à faire côté Worker ») et fera déployer un prix incohérent. Sort aussi le gras d'une cellule de tableau. |
| « Fichiers de langue des conditions générales, FR **et** EN » (l. 119) | « Fichiers de langue des conditions générales, FR et EN » | Du gras sur une conjonction : l'emploi le plus faible du document. |
| Les 4 gras de §5 (l. 190, 193, 196, 199) · les 4 de l'annexe C (l. 305-314) · les 2 de §7 (l. 237, 239) | Retirer le gras ; conserver la liste numérotée ou à puces | Quand tous les frères d'une liste portent le gras, il ne sélectionne plus rien : c'est un changement de graisse par défaut. |
| Amorces de l'annexe A (l. 250, 262, 270, 275) et « **Règle de méthode.** » (l. 298) | Conserver, mais en italique ou en `###` plutôt qu'en gras | Ce sont des sous-titres, pas des avertissements. Deux grammaires de gras cohabitent sans être distinguées ; le lecteur ne sait plus si un gras signale un danger ou un paragraphe. |
| `**Le segment de retour de paiement est en outre codé en dur dans deux fichiers serveur.**` (l. 144, 16 mots) · l. 72 (13 mots) · l. 62 (12 mots) | Réduire le gras au syntagme décisif : « Le segment de retour de paiement est **codé en dur dans deux fichiers serveur**. » | Au-delà de huit mots, le gras n'est plus une emphase : c'est un surligneur. |
| « sans point de contact » (l. 110) · « le point de passage unique » (l. 163) · « à un seul endroit » (l. 196) · « Un second endroit » (l. 198, 273) · « une table unique » (l. 272) | Un terme unique — **« source unique »** — partout | Huit étiquettes pour le concept central du document. Le code lui-même écrit « SOURCE UNIQUE DE VÉRITÉ » (`src/lib/adminAccess.ts`) : le terme existe déjà, la prose ne s'y tient pas. |
| « un point d'accès HTTP sur le Worker **évitait** tout changement de règle » (l. 256) | « **aurait évité** tout changement de règle » | Rupture de parallélisme : les alternatives voisines sont au conditionnel passé (« aurait suffi », « aurait permis », « aurait exposé »). L'imparfait laisse croire que ce point d'accès a existé. |
| « Câbler naïvement **ouvrait** une boucle : décocher puis recocher **aurait rapporté** indéfiniment, et cette expérience **alimente** le classement » (l. 263-264) | « Câbler naïvement **aurait ouvert** une boucle : décocher puis recocher aurait rapporté indéfiniment. **Toujours vrai :** cette expérience alimente le classement et les badges de parrainage. » | Trois temps dans une phrase. Aligne l'hypothèse sur le conditionnel passé et signale le retour au présent, comme le fait déjà « Limite assumée : » au ¶4. |
| « Trois mineures ont par ailleurs dérivé au-dessus de leur valeur déclarée » (l. 33) | Nommer les trois | La phrase qui fonde la règle `npm ci` demande d'être crue sur parole, dans un document dont l'annexe B interdit exactement cela. |
| « une quarantaine de jetons de couleur » (l. 30) | Le compte exact, ou « tous les jetons de couleur » | Seule approximation d'un document qui donne partout ailleurs des chiffres précis (34, 15, 23, 8, 13). |
| « plus le corps de texte du pré-rendu utilisé pour le référencement » (l. 124) | « auxquels s'ajoute le corps de texte du pré-rendu… » | « plus » se lit d'abord comme un comparatif. |
| « le portage existe, activé en préversion » (l. 96) · « charges et webhook tournent encore » (l. 95) | Gloser « préversion » (drapeau ? clé de configuration ? où se lit l'état courant ?) et traduire ou définir « charges » | Le lecteur ne peut pas lire l'état courant de la bascule. « Charges » est le seul anglicisme métier non traduit d'un document qui traduit « lockfile ». |
| ~9 tirets cadratins introduisant un développement (l. 23, 64, 96, entre autres, sur 27 au total) | Deux-points quand ce qui suit développe ce qui précède ; tiret réservé à la rupture et à la correction | Une seule paire fermée sur 27 emplois : le tiret fait indifféremment office de deux-points, de parenthèse et de virgule. |
| Ordre des étiquettes en annexe A : *Alternatives écartées* avant *Retenu* au ¶1, l'inverse au ¶2 | Ordre fixe : *Retenu*, puis *Écarté* | Dans une annexe conservée « pour qui voudrait le rouvrir », chercher ce qui a été écarté oblige à lire les quatre paragraphes. |
| Aucun renvoi pour FR-089, NFR-01, R-11, NFR-13, D-03… (11 identifiants) | Une ligne d'amorce : « Les codes FR-/NFR-/R-/D- renvoient au PRD. » | Coût d'une phrase ; évite au nouvel arrivant de chercher un glossaire inexistant. |

---

## 7. Ce qu'il ne faut pas toucher

- **La voix.** Sèche, assertive, sans hédging. Elle convient au lecteur visé et elle est tenue.
- **L'ouverture (l. 3-7)**, qui annonce l'ordre des sections par le moment d'usage. C'est le meilleur
  paragraphe du document : il apprend au lecteur comment s'en servir.
- **L'annexe B et sa « Règle de méthode » (l. 298-299).** Rare et juste : un document qui déclare
  sa propre autorité limitée.
- **La ligne 132-133** (« la version anglaise sert silencieusement l'URL française ») : modèle de
  silence rendu observable.
- **Le ¶3 de l'annexe A** (rôle `support`) : gestion des temps irréprochable.
- **Les trois pièges de §2.2** dans leur principe — un piège, une conséquence, une vérification.
  Seul le n°2 manque à sa propre forme.
