---
title: "Revue éditoriale de structure — addendum.md"
cible: "_bmad-output/planning-artifacts/prds/prd-maxmorrys.me-main-2026-08-29/addendum.md"
date: 2026-08-29
type: recommandations — aucun fichier modifié
---

# Revue de structure — `addendum.md`

## Résumé du document

- **Raison d'être :** porter tout ce qui relève du *comment* et n'a pas sa place dans le PRD.
- **Lecteur type :** un développeur qui rejoint le projet et doit éviter les pièges avant son
  premier déploiement.
- **Type de lecteur :** humain.
- **Modèle structurel applicable :** *Tutorial/Guide (linéaire)* — pas *Reference*. Un nouveau venu
  lit ce document une fois, dans l'ordre, avant de toucher au dépôt. Les prérequis doivent précéder
  l'action, et la séquence doit suivre l'ordre dans lequel il rencontre les pièges. C'est le critère
  d'évaluation retenu partout ci-dessous.
- **Longueur actuelle :** 2 873 mots, 325 lignes, 11 sections.

**Répartition réelle du volume :**

| § | Section | Lignes | Mots | % du doc |
|---|---|---|---|---|
| 10 | Les quatre correctifs du 29 août 2026 | 75 | 651 | **23 %** |
| 1 | Pile technique et frontières de version | 43 | 398 | 14 % |
| 8 | Pièges d'exploitation | 25 | 275 | 10 % |
| 4 | État de la migration | 25 | 226 | 8 % |
| 7 | Chaîne d'intégration continue | 25 | 218 | 8 % |
| 6 | Système de design | 26 | 216 | 8 % |
| 9 | Contraintes d'implémentation | 19 | 184 | 6 % |
| 2 | Miroirs de prix | 22 | 158 | 5 % |
| 3 | Double montage de routes | 18 | 153 | 5 % |
| 5 | Conception de Rysmo | 18 | 150 | 5 % |
| 11 | Contexte non retenu au PRD | 11 | 123 | 4 % |

---

## Réponse directe aux cinq questions posées

### 1. L'ordre sert-il le lecteur ? Non — le défaut principal est un enterrement.

La section qui porte littéralement dans son titre la promesse du document — **« Pièges
d'exploitation — à connaître avant le premier déploiement »** — est la **huitième sur onze**, et
commence à la **ligne 192 sur 325**. Le lecteur doit traverser 59 % du document pour atteindre ce
qui lui est explicitement adressé.

Deuxième défaut d'ordre : **le sujet « déployer » est éclaté en trois sections non contiguës**
(§4 migration, §7 intégration continue, §8 pièges), séparées par §5 Rysmo et §6 système de design
qui n'ont aucun rapport. Les trois avertissements à conséquence destructrice du document se
trouvent un dans chacune :

- §4, ligne 110 — « **Deux branches déclarent le même nom de Worker et les mêmes routes de
  production** […] Déployer l'une écrase l'autre »
- §7, ligne 180 — « **Les tests de règles exigent un JDK 21.** […] **sans que rien n'indique que
  les règles n'ont pas été testées** »
- §8, ligne 202 — « **Il n'existe aucun environnement de préproduction, et les prévisualisations
  de propositions de modification se déploient sur le projet de PRODUCTION.** »

Un développeur qui lit §4 et s'arrête là — ce que l'ordre actuel autorise — déploie sans savoir
les deux autres. Ces trois faits forment une seule séquence : *ce que la CI fait, ce qu'elle ne
fait pas, et où atterrit ce que tu déploies à la main*.

### 2. Les coupes : oui, et elles sont concentrées.

Trois familles de doublon, détaillées en recommandations 1 à 4 :
- **§10 en entier** duplique le *constat* déjà porté par FR-025, FR-026, FR-010 et FR-063 du PRD,
  et par deux entrées du glossaire (« Miroir de vérification », « Repère de progression »).
- **§5 Rysmo** : 5 de ses 7 affirmations sont des reprises littérales de FR-037, FR-038, FR-040,
  du garde-fou de PRD §5.7 et de NFR-10.
- **Quatre passages de commentaire éditorial** corrigent d'autres documents du dépôt — genre
  adressé à l'auteur, pas au nouveau venu.

### 3. Manques de structure : deux listes doivent devenir des tableaux, une section doit être scindée.

§2 (liste des miroirs sans colonne « couvert par un test ») et §3 (les six emplacements enfouis
dans une phrase à virgules) sont des **checklists déguisées en prose**. §1 est la plus dense du
document et porte deux sujets distincts sous un seul titre. Détail en recommandations 5, 6 et 7.

### 4. §10 est du journal de bord — à 85 %, et les 15 % restants sont load-bearing.

C'est un **registre de décisions daté** (défaut / alternatives écartées / retenu), pas de
l'addendum durable. Mais quatre invariants qu'il établit doivent survivre à sa sortie, parce qu'un
développeur peut les casser sans s'en apercevoir. Voir recommandation 1.

### 5. Le ton des avertissements : le ⚠️ n'est pas surdosé en nombre — il l'est en amplitude.

**6 occurrences sur 325 lignes** (une pour 54 lignes), contre 13 sur 952 dans le PRD (une pour 73).
La densité est saine. Le problème est ailleurs : **le même symbole couvre une plage de gravité
allant de « tu peux détruire la production » à « un autre document est périmé »** — voir
recommandation 8. Et le vrai dilueur d'emphase du document n'est pas le ⚠️, c'est le **gras :
83 occurrences pour 2 873 mots, soit une tous les 35 mots**, uniformément réparti (recommandation 11).

---

## Ordre de sections recommandé

De 11 sections à **7 + 2 annexes**, réordonnées selon la séquence réelle du nouveau venu :

| Nouveau | Titre proposé | Source |
|---|---|---|
| **1** | **Avant d'écrire une ligne** — versions installées ≠ déclarées ; les trois projets TypeScript | §1, scindée en 1.1 / 1.2 |
| **2** | **Avant de déployer** — ce que la CI vérifie, ce qu'elle ne déploie pas, l'absence de préproduction, les deux branches concurrentes, le JDK 21 | §7 + §4 + le volet « environnement » de §8 |
| **3** | **Les modifications qui se propagent** — miroirs de prix, double montage de routes, régions de fonctions câblées dans les réécritures | §2 + §3 + 1 puce de §8 |
| **4** | **Conventions de code** — contraintes d'implémentation + corps brut du webhook + liste blanche des champs de profil | §9 + 2 puces de §8 |
| **5** | **Invariants à ne pas casser** *(nouvelle)* | 4 règles extraites de §10 |
| **6** | **Système de design** | §6, allégée |
| **7** | **Conception de Rysmo** | §5, condensée |
| **A** | *Annexe — Journal des décisions du 29 août 2026* | narratif de §10, ou fichier séparé |
| **B** | *Annexe — Ce que les documents du dépôt décrivent et que le code ne fait pas* | §11 recadrée |

**Pourquoi cet ordre tient :** la dernière phrase de §1 — « **La duplication serveur est
structurelle, pas négligente** : les trois projets ne pouvant s'importer entre eux, toute constante
partagée est nécessairement recopiée » — est *déjà* la thèse dont §2 (prix) et §3 (routes) sont les
deux illustrations. L'enchaînement 1 → 3 est écrit dans le texte actuel mais brisé par
l'intercalation de §4 à §9. Le nouvel ordre le rétablit, avec « Avant de déployer » en position 2
parce que c'est la seule chose qui peut causer un dégât irréversible.

---

## Recommandations, par gain décroissant

### 1. SCINDER — §10 « Les quatre correctifs du 29 août 2026 » : 4 invariants restent, le récit sort

**Ancrage :** ligne 238, `## 10. Les quatre correctifs du 29 août 2026` — et sa phrase d'ouverture
ligne 240 : « **Quatre exigences de la Partie A décrivaient un comportement qui n'existait pas.
Elles ont été corrigées dans le produit avant que le PRD ne les affirme.** »

**Rationale :** cette phrase désigne elle-même le genre du texte — elle raconte l'histoire de la
rédaction du PRD, pas le fonctionnement du produit ; un développeur qui arrive en octobre n'a
aucun usage du fait que quatre exigences aient un jour été fausses.

Le *constat* est déjà intégralement dans le PRD :

| §10 | Déjà porté par le PRD |
|---|---|
| miroir public indexé par le code, non énumérable, nom du titulaire affiché | FR-025 + glossaire « Miroir de vérification » |
| repère de progression que la règle empêche de décroître, décocher reste permis | FR-026 + glossaire « Repère de progression » |
| périmètre `support` déclaré une seule fois, lu par le menu et le garde | FR-010 + NFR-07 |
| journal d'audit fermé en écriture au client, y compris aux admins | FR-063 + FR-092 |

Ce que §10 apporte en propre et qui doit **rester** dans l'addendum, sous la nouvelle section
« Invariants à ne pas casser » (≈ 8 lignes, une par invariant) :

1. `certificate_lookups/{code}` — **l'identifiant est le code**, la lecture est un `get`, jamais
   une liste. Ancrage ligne 257 : « **Son identifiant est le code** : la vérification est un `get`
   direct, jamais une liste, donc l'énumération est structurellement impossible. »
2. `maxProgress` est monotone par règle Firestore et figure dans la liste des champs modifiables ;
   l'XP n'est accordée qu'au-dessus du plus haut historique ; **décocher reste permis**.
3. `lib/adminAccess` est la **table unique** ; le drapeau `adminOnly` de la navigation a été
   supprimé et ne doit pas revenir ; la comparaison porte sur le chemin dé-localisé.
4. Le helper d'audit **n'échoue jamais bruyamment** ; la collection reste fermée en écriture au
   client, admins compris.

Ce qui **sort** vers un journal daté (`decisions-2026-08-29.md`, ou `.memlog.md` qui existe déjà
dans le dossier et que le PRD décrit comme « journal des décisions de rédaction ») : les quatre
blocs « **Le défaut.** », les deux blocs « **Alternatives écartées.** » (lignes 250-253 :
« *Ouvrir `certificates` en lecture* aurait suffi en une ligne, mais aurait permis d'énumérer… » ;
ligne 280 : « *Alternative écartée : déplacer l'attribution côté serveur…* »), le callable de
backfill borné à 200 documents, et les effets de bord (« *le nom du titulaire n'était jamais
affiché — le libellé existait, la valeur manquait.* »).

**Impact :** ~50 lignes, ~430 mots (15 % du document).
**Effet de bord à traiter :** l'annexe du PRD annonce « `addendum.md` — **décisions techniques**,
état de la migration… ». Si le récit sort, cette ligne d'annexe doit citer le nouveau fichier.

---

### 2. FUSIONNER + DÉPLACER — §4 + §7 + le volet environnement de §8 → une section « Avant de déployer », en position 2

**Ancrage :** trois titres pour un seul sujet — ligne 94 `## 4. État de la migration
d'infrastructure`, ligne 166 `## 7. Chaîne d'intégration continue`, ligne 192 `## 8. Pièges
d'exploitation — à connaître avant le premier déploiement`.

**Rationale :** §4 répond « ce que la CI déploie et ne déploie pas », §7 répond « ce que la CI
vérifie », §8 répond « où ça atterrit » — trois moitiés de la même réponse, séparées par §5 et §6
qui traitent d'autre chose.

La preuve du chevauchement est textuelle. §4 ligne 106 : « ⚠️ **Ce qu'elle ne déploie pas** :
règles Firestore, index, Cloud Functions et Workers sont construits et vérifiés, **jamais
déployés** (R-11). » §7 ligne 177 : « **Reste ouvert :** le job de tests des règles Firestore
n'est **pas** dans les prérequis du déploiement. » Les deux décrivent le même trou de chaîne, à
80 lignes d'écart, et renvoient l'un à R-11, l'autre à FR-088.

Même constat pour la reproductibilité : §1 ligne 25 dit déjà « l'installation se fait depuis lui
exclusivement (`npm ci`) — un `npm install` le déplace », et §7 ligne 186 répète « **Reproductibilité :**
installation depuis le fichier de verrouillage exclusivement ». **Garder l'occurrence de §1** (c'est
là qu'elle éclaire le tableau des versions) et couper celle de §7, en n'y laissant que ce qu'elle
ajoute : les deux binaires natifs d'optimisation d'images.

Découpage de §8 par destination :
- **vers « Avant de déployer » :** pas de préproduction / prévisualisations en PRODUCTION ; cartes
  de source en mode masqué ; secrets déclarés fonction par fonction.
- **vers « Les modifications qui se propagent » :** « **Les régions des fonctions sont câblées dans
  les réécritures d'hébergement.** » — c'est exactement le même mécanisme que les six emplacements
  de §3.
- **vers « Conventions de code » :** « **La signature du webhook de paiement se calcule sur le corps
  brut.** » et « **La liste blanche des champs de profil rejette silencieusement.** » Ce ne sont pas
  des pièges d'exploitation : ils se déclenchent à l'écriture du code.

**Impact :** ~8 lignes de doublon supprimées ; gain principal en navigation, pas en volume.

---

### 3. CONDENSER — §5 « Conception de Rysmo » : 5 des 7 affirmations sont dans le PRD

**Ancrage et correspondances :**

| Addendum §5 | PRD |
|---|---|
| l. 121 « Le contexte est assemblé serveur […] **plafonné par collection** pour borner le coût par requête » | FR-038 : « Le contexte transmis au modèle est **borné par collection**. *Conséquence : le coût par requête est plafonné…* » |
| l. 123 « La progression réelle de l'apprenant est injectée dans l'invite » | FR-037 |
| l. 128 « **L'invite système interdit explicitement d'inventer un fait au-delà de ce qui est fourni.** » | PRD §5.7, blockquote : « l'invite système interdit à Rysmo d'inventer tout fait au-delà des informations fournies » — quasi mot pour mot |
| l. 132-135 « **Alternative écartée :** l'IA illimitée […] Aucun acteur mondial comparable ne le fait » | FR-040 (« aucun acteur mondial comparable ne vend l'IA en illimité inclus ») **+** NFR-10 **+** R-09 — trois fois dans le PRD |

**Rationale :** une section de 150 mots dont 5 items sur 7 sont ailleurs n'est plus une section,
c'est un rappel — et le rappel se paie en position dans un document que le lecteur parcourt une
fois.

**Ce qui est du vrai *comment* et doit rester** (≈ 4 lignes) : le profil de mémoire **régénéré tous
les *N* échanges plutôt qu'à chaque requête**, et la **cumulativité des quotas** (socle gratuit,
bonus Club, puis remplacement par le quota d'abonnement) — le PRD donne les quatre valeurs en
FR-040 mais **jamais la règle d'empilement**.

**Impact :** ~12 lignes, ~95 mots.
**Note de compréhension :** couper « l'invite système interdit d'inventer » retire un garde-fou
rassurant ; il est intégralement conservé dans le PRD, à un endroit qu'un développeur consulte
aussi. Risque nul.

---

### 4. REGROUPER — les quatre passages qui corrigent d'autres documents ne s'adressent pas au lecteur

**Ancrages, les quatre :**

1. §4 l. 103-105 : « ✅ **La chaîne d'intégration continue déploie bien le frontend.** […] *Une note
   antérieure de ce dépôt affirmait l'inverse ; elle était fausse.* »
2. §7 l. 172-175 : « > Correction par rapport à `docs/MAXMORRYS-CURRENT-STATE.md` (13 août 2026),
   qui indique que les tests unitaires ne sont jamais exécutés : **ils le sont désormais** »
3. §9 l. 232-234 : « ⚠️ *`_bmad-output/project-context.md` affirme encore que le groupe Firebase ne
   couvre que quatre modules […] — **c'est périmé** *»
4. §8 l. 194-195 : « Six règles que `_bmad-output/project-context.md` porte et que **la première
   version de cet addendum avait laissées de côté**. »

**Rationale :** un développeur qui arrive ne connaît ni `MAXMORRYS-CURRENT-STATE.md`, ni la
première version de cet addendum, ni la note antérieure du dépôt — on lui demande de mémoriser
l'erratum d'un texte qu'il n'a jamais lu, à l'endroit exact où il cherche une instruction.

**Traitement :** énoncer le fait au présent dans le corps (« La CI publie le build du frontend sur
l'hébergement Firebase » ; « Les tests unitaires sont bloquants » ; « Le groupe Firebase couvre
l'intégralité des modules »), et regrouper les quatre errata en un bloc de 4 lignes en fin de
document — ou les verser à `.memlog.md`. **Cas n° 3 mérite d'y rester même après regroupement** :
`project-context.md` est présenté par la mémoire projet comme la source de vérité pour les agents,
et un lecteur peut légitimement le lire *après* l'addendum ; mais l'avertissement doit alors dire
« ce document prime sur `project-context.md` sur ces points », une fois, en tête — pas en note de
bas de puce.

**Impact :** ~10 lignes, ~90 mots — et **2 ⚠️ / 1 ✅ retirés du corps**, ce qui rend la
recommandation 8 possible.

---

### 5. LISTE → TABLEAU — §2, les miroirs de prix : la colonne manquante est celle qui compte

**Ancrage :** l. 59-65, « **Tout changement de montant doit être répercuté dans :** » suivi de six
puces nues (« la source de vérité côté client », « le module de paiement des Cloud Functions,
**puis reconstruction** », « le portage du même module côté Worker », …), puis l. 67-68 :
« Les tests unitaires vérifient la cohérence entre les conditions générales et l'interface.
**Ils ne peuvent pas atteindre les miroirs serveur.** »

**Rationale :** l'information décisive — *quels miroirs sont couverts par un test et lesquels ne le
sont pas* — est aujourd'hui dans une phrase après la liste, alors que c'est précisément la colonne
que le lecteur veut lire en regard de chaque ligne. En tableau `Emplacement | Projet | Couvert par
un test ?`, les trois « non » sautent aux yeux et **FR-089 devient visible sans être expliqué**.

**Impact :** neutre en volume (~0 ligne), fort en utilisabilité. La section est par ailleurs bonne
et n'a pas d'autre défaut.

---

### 6. PHRASE → CHECKLIST — §3, les six emplacements d'un renommage de segment

**Ancrage :** l. 84-87 — « **Renommer un segment public impose une mise à jour coordonnée de six
emplacements :** la table de segments, les réécritures d'hébergement (**34 au total, dont 15 sous
`/en`**), la table de routes du Worker, le pré-rendu des fonctions, le plan de site des fonctions,
le plan de site du Worker. »

**Rationale :** six éléments dans une phrase à virgules, dont l'un porte une parenthèse chiffrée,
ne se cochent pas. C'est le seul passage du document qu'un développeur va relire **pendant** qu'il
travaille, une main sur le clavier : il lui faut une liste numérotée, pas une énumération.

**Corollaire de coupe dans la même section :** la phrase « Ajouter une route = **deux éditions**.
[…] Chaque valeur anglaise doit par ailleurs être unique sur toute la table » (l. 80-82) est
reprise textuellement par **NFR-06** du PRD (« Ajouter une route impose **deux éditions**, et
chaque valeur anglaise doit être unique sur toute la table ») et par **FR-064**. De même, l. 89-90
(« **Le segment de retour de paiement est codé en dur dans deux fichiers serveur.** Le renommer
ferait atterrir tout paiement en cours sur une page introuvable ») est **NFR-03 mot pour mot**.
Garder les faits que le PRD ne peut pas porter (les six emplacements nommés, les 34 réécritures,
les deux fichiers) et couper les phrases de règle que le PRD énonce déjà.

**Impact :** ~5 lignes, ~45 mots, et la section gagne en densité utile.

---

### 7. SCINDER — §1 porte deux sujets sous un titre, et c'est la section la plus dense du document

**Ancrage :** ligne 8, `## 1. Pile technique et frontières de version` — 398 mots, 3 tableaux et
4 blocs de prose, dont la charnière ligne 32 : « **Trois projets TypeScript indépendants, aucun
fichier partageable entre eux :** »

**Rationale :** le lecteur consulte le premier volet en référence (quelle version de Tailwind ?
quelle version de React Router ?) et lit le second une fois, comme une règle d'architecture. Deux
usages, deux fréquences, deux sous-titres :

- **1.1 Versions installées et déclarées** — tableau de la pile + l'encadré « **Déclaré n'est pas
  installé.** » + le paragraphe « **Ces majeures sont plus anciennes que ce qu'un modèle de langage
  suppose par défaut.** »
- **1.2 Trois projets, aucun fichier partagé** — tableau des projets + « Le Worker n'a **ni DOM ni
  Node** » + « **La duplication serveur est structurelle, pas négligente** ».

Cette dernière phrase doit **rester en clôture de §1** : elle est la charnière qui annonce les deux
sections suivantes du nouvel ordre (miroirs de prix, routes).

**Impact :** +2 lignes de titres, 0 mot coupé. Gain de balayage sur la section la plus lue.

---

### 8. QUESTION — le ⚠️ n'est pas surdosé en nombre, il l'est en amplitude de gravité

**Chiffres :** 6 occurrences sur 325 lignes (1 pour 54) — contre 13 sur 952 dans le PRD (1 pour 73).
La densité n'est pas le problème.

**Ancrage du problème :** le même symbole porte, à 30 lignes d'écart,

- l. 202 : « **⚠️ Il n'existe aucun environnement de préproduction, et les prévisualisations […] se
  déploient sur le projet de PRODUCTION.** » — *conséquence : destruction de données réelles*
- l. 232 : « ⚠️ *`_bmad-output/project-context.md` affirme encore que le groupe Firebase ne couvre
  que quatre modules […] c'est périmé* » — *conséquence : aucune*

**Rationale :** un lecteur qui rencontre le second en premier recalibre le symbole vers le bas, et
survolera le premier. C'est exactement le mécanisme de dévaluation — il vient de l'amplitude, pas
du compte.

**Traitement proposé :** réserver ⚠️ à un critère écrit et unique — *« ce piège détruit quelque
chose de réel, ou échoue silencieusement »* — ce qui laisse exactement **quatre** occurrences :
prévisualisations en PRODUCTION (l. 202), deux branches qui écrasent le même Worker (l. 110),
JDK 21 et règles non testées sans que rien ne l'indique (l. 180), et « déclaré n'est pas installé »
(l. 23, qui casse en silence sans lever d'erreur de type). Les deux autres deviennent du texte
ordinaire : l. 106 (ce que la CI ne déploie pas — c'est un fait de périmètre, pas un piège) et
l. 232 (traitée en recommandation 4). Le ✅ isolé de la ligne 103 disparaît avec la recommandation 4 :
un seul ✅ dans tout le document ne construit aucun système de signes, il signale juste un
soulagement d'auteur.

**Note :** les trois ⚠️ conservés se retrouvent tous dans la même section après la recommandation 2,
ce qui est le bon résultat — un bloc d'avertissements graves, lus ensemble, avant le premier
déploiement.

**Impact :** 0 mot. Gain de crédibilité du signal.

---

### 9. RECADRER — §11 « Éléments de contexte non retenus au PRD » : deux puces servent le lecteur, deux servent le PRD

**Ancrage :** ligne 314, `## 11. Éléments de contexte non retenus au PRD` — le seul titre du
document qui parle du PRD plutôt que du produit.

**Rationale :** justifier le périmètre d'un PRD est un travail de PRD ; le PRD a déjà une section
« **10. Hors périmètre** » pour ça. Mais deux des quatre puces disent en réalité autre chose
d'utile au développeur : *« des documents de ce dépôt décrivent plus que ce que le code fait »*.

- **Garder, recadré en avertissement** : « **Onze lignes de service** sont décrites dans
  `BUSINESS_MODEL.md`. Cinq seulement sont implémentées et monétisées » — c'est un piège de lecture
  du dépôt, exactement le genre du document.
- **Garder** : « **L'automatisation par workflows externes** […] est un actif d'exploitation réel,
  mais extérieur au produit » — évite qu'un développeur cherche dans `src/` ce qui vit ailleurs.
- **Déplacer vers le PRD §10 ou `.memlog.md`** : « **Le modèle financier à cinq ans** […] Le PRD
  n'en reprend aucun chiffre » et « **Les documents contractuels de l'offre TPE** existent
  séparément ». Ce sont des justifications de périmètre pures, sans conséquence de code.

Titre proposé : *« Ce que les documents du dépôt décrivent et que le code ne fait pas »*.

**Impact :** ~6 lignes, ~55 mots.

---

### 10. CONDENSER — §6, la seule redite du système de design

**Ancrage :** l. 146-147 — « La teinte d'accentuation de l'offre TPE atteint **2,6:1 sur blanc —
interdite pour du texte**. Variantes prescrites selon le fond (NFR-09). » — à comparer à **NFR-09**
du PRD : « la teinte d'accentuation de l'offre TPE atteint 2,6:1 sur blanc et **est interdite pour
du texte** ».

**Rationale :** la seule chose que cette puce ajoute au PRD, ce sont **les variantes prescrites** —
et c'est justement ce qu'elle ne nomme pas. Inverser : nommer les variantes, et renvoyer à NFR-09
pour la règle.

**Le reste de §6 est bon et ne doit pas être touché** — le piège de `cn()` (« c'est une simple
concaténation filtrée, **sans résolution de conflit**. Toujours concaténer la classe entrante en
dernier »), les deux teintes au même hexadécimal, les classes littérales et la contrainte de purge,
les deux bibliothèques d'icônes, l'absence assumée de composants de mise en page : c'est
exactement du *comment*, introuvable ailleurs, et bien calibré.

**Impact :** ~2 lignes, mais surtout un gain de justesse.

---

### 11. QUESTION — le gras, pas le ⚠️, est ce qui dévalue l'emphase

**Chiffres :** **83 passages en gras pour 2 873 mots — un tous les 35 mots**, répartis uniformément
(§1 : 14, §10 : 19, §7 : 8, §4 : 8…). Aucune section n'y échappe.

**Ancrage typique :** l. 168-170, où trois éléments d'une même énumération sont mis en gras dans la
même phrase : « **Bloquant sur proposition de modification :** analyse statique, vérification de
types, **tests unitaires**, construction ». Le gras y désigne à la fois le libellé de la catégorie
et l'un de ses membres — deux rôles opposés dans huit mots.

**Rationale :** quand une phrase sur trois contient du gras, le gras cesse de hiérarchiser et
devient une texture. C'est le même mécanisme que celui décrit en recommandation 8, à une échelle
quatorze fois plus grande.

**Traitement :** un rôle unique par section — le gras marque **la règle**, l'italique marque
**la conséquence ou la nuance** (convention déjà employée par intermittence, notamment l. 40-41 et
l. 261-262). Une passe ciblée devrait ramener le gras autour de 30-35 occurrences.

**Caveat :** c'est une recommandation de **prose**, à traiter après les coupes de structure — la
recommandation 1 en supprime déjà 19 à elle seule.

---

### 12. PRESERVE — quatre éléments à ne surtout pas couper

- **§1, les trois tableaux.** Ce sont les seuls endroits du corpus où « installé ≠ déclaré » est
  lisible d'un coup d'œil. Un développeur y revient ; c'est de la référence, elle doit rester dense.
- **§8, la puce du corps brut du webhook** (« Le condensat est produit à partir de la charge utile
  telle qu'elle est reçue, jamais d'un objet re-sérialisé »). NFR-02 du PRD parle de l'*ordre des
  effets*, jamais de la **source des octets** — l'addendum est le seul endroit où cette règle
  existe, et sa violation est indétectable en revue.
- **§9, la puce du découpage manuel des paquets** (« Le découpage manuel des paquets est une
  **fonction**, pas une liste figée »). Introuvable ailleurs, et directement casseur de build.
- **§6, le piège de `cn()`.** Un développeur venant de n'importe quel autre projet Tailwind
  supposera `tailwind-merge` par défaut. Cette puce évite une classe de bugs invisibles.

---

## Synthèse

- **Total de recommandations :** 12 — dont 1 scission majeure, 1 fusion à trois, 3 condensations,
  2 conversions de format, 1 scission de section, 2 questions de ton, 1 préservation explicite.
- **Réduction estimée :** ~85 lignes et ~730 mots, soit **~26 % du document** (325 → ~240 lignes),
  avant ajouts (nouveaux titres, section « Invariants », colonnes de tableau) : **net ~25 %**.
- **Sections passant de 11 à 7 + 2 annexes.**
- **Concentration du gain :** les recommandations 1 à 4 représentent à elles seules ~80 lignes sur
  les ~85, soit 94 % de la réduction. Si une seule doit être appliquée, c'est la n° 1.
- **Compromis de compréhension :** aucun identifié. Toutes les coupes proposées visent soit du
  contenu dupliqué ailleurs dans le corpus (§5, §3, §6, §10), soit du commentaire éditorial adressé
  à l'auteur (rec. 4), soit de la justification de périmètre appartenant au PRD (rec. 9). Les quatre
  éléments dont la coupe *aurait* dégradé la compréhension sont listés en recommandation 12 et
  explicitement préservés.
- **Dépendance à traiter :** la recommandation 1 rend obsolète la ligne d'annexe du PRD
  (« `addendum.md` — décisions techniques, état de la migration, miroirs de prix, contraintes
  d'implémentation »), qui devra citer le nouveau fichier de journal.
