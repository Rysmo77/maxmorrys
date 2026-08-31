---
title: "Revue éditoriale de structure — PRD Plateforme Max-Morrys"
cible: prd.md (949 lignes, révision 3)
date: 2026-08-29
type: recommandations — aucun fichier modifié
---

# Revue éditoriale de structure — `prd.md`

## Fiche de lecture

| | |
|---|---|
| **Objet du document** | Permettre à un lecteur externe (investisseur, associé, développeur à recruter) de comprendre un produit en production et de savoir ce qui est prouvé, supposé, ou faux |
| **Modèle structurel applicable** | **Pyramide (stratégique / décisionnel)** — conclusion d'abord, preuve ensuite, groupes MECE |
| **Longueur actuelle** | 949 lignes · **11 123 mots** · 34 sections et sous-sections · 12 tableaux |
| **Contraintes respectées** | Identifiants FR/NFR/M/R/Q/D jamais renumérotés · FR-083 et FR-091 barrés conservés · système de marqueurs intact · redites protectrices conservées |
| **Gain de coupe estimé** | **~59 lignes (6 %)**, dont **21 dans le seul §0** |

### Le verdict en trois phrases

**Ce document n'est pas gras.** À 11 123 mots pour cinq lignes de service, 67 exigences livrées,
43 exigences à venir, 18 risques et 13 questions, la densité est bonne et la longueur est
défendable devant un lecteur externe. Les coupes possibles représentent 6 % du texte, et elles
sont **concentrées en deux endroits seulement** : le §0, et l'appareil de recherche inséré dans
les narrations du §4.

**Le vrai problème n'est pas la longueur, c'est la priorité.** Le document affirme la primauté en
prose au lieu de l'inscrire dans l'ordre : le §6.2 revendique **trois fois** que tel groupe est le
plus urgent, dans trois groupes différents, et le groupe qu'il désigne comme « le plus urgent »
est le **septième sur huit**. Le §9 porte cinq revendications de primauté dans un tableau que le
lecteur ne peut pas trier. C'est là que se joue le rendement d'une réorganisation, pas dans les
coupes.

**Trois désynchronisations de références ont survécu à la révision 3** et sont détaillées en
partie F. L'une d'elles (R-03) contredit la correction dont le document se fait explicitement
gloire quatre cents lignes plus haut. Pour un document dont l'enjeu déclaré est la crédibilité,
ce sont les corrections à faire en premier — elles coûtent trois minutes.

---

## A. Les coupes, par gain décroissant

### A-1. `CONDENSE` — §0 : cinq blocs sur huit sont dits ailleurs, mieux · **~21 lignes**

Le §0 fait **53 lignes et 541 mots** — plus que le résumé exécutif (44 lignes, 468 mots) qu'il
précède. Cinq de ses huit blocs disent quelque chose qu'une autre section dit déjà, et souvent
mieux parce qu'elle le dit au point d'usage.

**A-1a — Ancrage : `**Âge du produit, et il compte.** Premier commit le **7 mars 2026**`** · gain **5 lignes**

Ce bloc de 5 lignes explique que deux des cinq lignes ont trois semaines. Le tableau du §1 le dit
déjà dans sa colonne *Ancienneté* (`| **Présence Digitale** (TPE) | … | **6 août 2026** | 3 semaines
d'existence |`), et la phrase qui suit immédiatement le tableau le dit une troisième fois :
`**Une ligne porte l'essentiel du chiffre d'affaires, et deux ont trois semaines.**`

Seuls deux faits sont propres au §0 : le premier commit du 7 mars et l'ouverture de la caisse le
13 avril. Ce sont des **faits sur l'entreprise, pas sur le document** — ils appartiennent au §1.

> **Reco.** Supprimer le bloc du §0. Ajouter une phrase sous le tableau du §1 : « Premier commit
> le 7 mars 2026, première transaction possible le 13 avril : la plateforme a six mois, et deux de
> ses cinq lignes en ont moins d'un. »

**A-1b — Ancrage : `**Aucun chiffre de taille de marché n'est avancé.** Les projections disponibles`** · gain **5 lignes**

La première ligne du tableau du §2.2 porte déjà l'information :
`| Taille du marché B2C edtech en AO francophone | **Inconnue.** Projections incohérentes, aucune
méthodologie publiée |`. Le seul apport propre au §0 est le rejet nommé du SAM « 300 000–500 000
personnes » de `BUSINESS_PLAN.md §5.1` — qui est précisément un contenu de §2.2, pas de préambule.

> **Reco.** Supprimer le bloc du §0 et enrichir la cellule du §2.2 : « **Inconnue.** Projections
> incohérentes (facteur 2,5 à l'arrivée sur la même base 2024), aucune méthodologie publiée. Le SAM
> de 300 000–500 000 personnes de `BUSINESS_PLAN.md §5.1` n'est adossé à aucune source et n'est pas
> repris. »

**A-1c — Ancrage : `**Réserve sur les parcours.** Les quatre parcours de §4 ont été **inférés du code`** · gain **5 lignes**

Doublon quasi mot pour mot de l'encadré d'ouverture du §4
(`> ⚠️ **Les quatre parcours sont `[HYPOTHÈSE]` dans leur intégralité**`), qui dit la même chose en
plus complet — il ajoute que tous les nombres sont `[FICTIF]` et que les exigences dérivées sont
signalées. Le §4 doit garder la sienne : c'est le point d'usage, et la section doit rester
extractible seule.

> **Reco.** Supprimer du §0. Si un rappel est jugé nécessaire en préambule, il tient dans la
> ligne « Comment le lire » : « …le §4 est intégralement hypothétique (Q-01). »

**A-1d — Ancrage : `La distinction entre `[HYPOTHÈSE]` et `[FICTIF]` existe parce qu'un relecteur l'a exigée`** · gain **4 lignes**

⚠️ *Recommandation à la frontière du système de marqueurs, qui est protégé. Le tableau des quatre
marqueurs n'est pas touché — il reste tel quel.*

Ces 5 lignes ne définissent pas les marqueurs : le tableau qui les précède le fait déjà, sans
ambiguïté. Elles racontent **l'historique de fabrication du document** — qu'un relecteur a exigé la
distinction, que la version précédente confondait les deux. C'est du `.memlog.md`, qui existe et
qui est annexé.

Le fait à garder tient en une phrase, et c'est une phrase utile : *pourquoi* la distinction
importe, pas *qui* l'a demandée.

> **Reco.** Remplacer les 5 lignes par une phrase collée au tableau : « `[HYPOTHÈSE]` et
> `[FICTIF]` ne sont pas synonymes : un pourcentage calculé sur la grille tarifaire réelle reste
> une hypothèse ; un pourcentage calculé sur une cliente inventée est fictif et ne doit jamais
> être cité comme une mesure. » Historique de la décision : `.memlog.md`.

**A-1e — Ancrage : `**Statut des affirmations.** Trois recherches documentaires ont été menées le 29 août 2026`** · gain **2 lignes**

Le décompte des recherches et des relectures est déjà porté par les **Annexes**, qui les nomment
une à une. Le §0 doit garder le *résultat* (« la donnée fiable existe sur la connectivité et le
paiement, pas sur la demande et les prix » ; « la première version affirmait quatre choses
fausses ») et non l'inventaire.

> **Reco.** Fusionner en deux lignes qui vont droit aux deux constats, sans compter les livrables.

**Bilan §0 : 53 → ~32 lignes**, sans qu'aucun fait disparaisse du document — chaque fait coupé est
déjà, ou sera, dans la section qui en a la charge.

---

### A-2. `MOVE` — §4 : l'appareil de recherche interrompt trois fois les narrations · **~8 lignes**

Les quatre parcours sont la partie la plus lisible du document pour un lecteur externe : ils
sont concrets, ils portent des prénoms, et ils finissent tous par un « Ce que ce parcours exige »
qui raccroche à des identifiants. C'est du bon travail.

Ils sont abîmés par **trois insertions de recherche méthodologique en plein récit**. Une narration
qui s'arrête pour arbitrer une source perd sa fonction : le lecteur ne suit plus Fatou, il lit un
appareil critique.

**A-2a — Ancrage : `*Au Sénégal, Facebook touche 3,60 millions de personnes pour 11,5 millions d'internautes`** (UJ-3) · gain **4 lignes**

Cinq lignes de méthode, dont l'avertissement « appliquer le chiffre ivoirien à une commerçante
dakaroise doublerait la portée du substitut ». C'est un **piège de chiffre** — exactement le genre
que le §2.1 traite déjà dans son encadré (`> ⚠️ **Piège de chiffre à ne jamais reprendre.**
L'ARTP annonce 125,78 %…`).

> **Reco.** Garder dans UJ-3 la seule phrase dont le récit a besoin : « Elle vend déjà par WhatsApp
> et par sa page Facebook — un substitut gratuit qui touche environ 31 % des internautes sénégalais
> (§2.1), et qui reste son vrai point de comparaison. » Déplacer l'avertissement Sénégal/Côte
> d'Ivoire dans l'encadré « Piège de chiffre » du §2.1, où il aura plus de force à côté du piège
> ARTP.

**A-2b — Ancrage : `` `[HYPOTHÈSE]` *Le churn médian des communautés payantes est donné à 5,8 % par mois `` `` (UJ-2) · gain **4 lignes**

Cinq lignes qui arbitrent entre deux bandes de churn d'un agrégateur non audité, à l'intérieur du
parcours de Moussa. Or le §13 porte déjà exactement cette hypothèse
(`| §4, UJ-2 | Le churn de référence des communautés payantes (5,8 %/mois selon un agrégateur non
audité ; 3–5 % pour les formats communautaires) | M-01 |`) et `research-comparables.md` la
documente.

La phrase qui suit est en revanche **la meilleure du parcours** et ne dépend d'aucune source :
`Ce qui ne dépend d'aucune de ces sources, en revanche : un abonnement annuel ne supprime pas le
churn, **il le concentre sur un instant.**` Elle doit rester, et elle gagne à ne plus être précédée
de cinq lignes de qualification de sources.

> **Reco.** Réduire à : « `[HYPOTHÈSE]` *Les bandes de churn disponibles sont non régionales et non
> auditées (§13, `research-comparables.md`).* Ce qui n'en dépend pas : un abonnement annuel ne
> supprime pas le churn, il le concentre sur un instant. »

**Note de genre — `QUESTION`, sans gain de ligne.** UJ-4 (`### UJ-4 — Rysmo opère la plateforme,
seul`) n'est pas un parcours utilisateur : c'est une contrainte d'exploitation, et le document le
dit lui-même (`**Cette contrainte n'est pas une faiblesse à masquer : c'est le paramètre de
conception le plus déterminant du produit.**`). Placée quatrième derrière trois personas clients,
elle se lit comme une quatrième cliente pendant deux paragraphes. Une ligne de cadrage suffirait à
la distinguer — par exemple un intertitre « Le quatrième parcours n'est pas celui d'un client ».
L'identifiant UJ-4 est référencé depuis §13, NFR-05 et le glossaire : **ne pas le changer.**

---

### A-3. `CONDENSE` — préambule Partie A : l'histoire des corrections est déjà écrite ailleurs, en mieux · **~4 lignes**

**Ancrage : `> **Ce que « constaté » veut dire, et ne veut pas dire.** La version 1 de ce document affirmait`**

Encadré de 7 lignes. Il fait deux choses de valeur très inégale :

1. **Il définit le statut épistémique de 67 exigences** — indispensable, à garder mot pour mot.
2. **Il raconte la genèse des corrections** (« quatre fausses et dix partielles », « les fausses
   venaient toutes d'une même faute : avoir fait confiance à un document d'audit daté plutôt qu'au
   code », « les quatre défauts ont été corrigés dans le produit »). Or `addendum.md §10 — Les
   quatre correctifs du 29 août 2026` raconte cette histoire **en 75 lignes, défaut par défaut,
   avec les alternatives écartées**. Le PRD en donne une version appauvrie de la même histoire.

> **Reco.** Garder les phrases 1 et 2 de l'encadré (le chiffre « quatre fausses et dix partielles »
> est la preuve que la vérification a eu lieu : il reste). Remplacer les trois dernières lignes par
> un renvoi : « Le détail des quatre correctifs, avec les alternatives écartées, est en
> `addendum.md §10`. » La cause racine (« avoir fait confiance à un document d'audit daté ») est
> une leçon de méthode : sa place est dans `.memlog.md`.

---

### A-4. `CONDENSE` — D-01 : l'encadré des corrections protège un lecteur qui n'existe pas · **~4 lignes**

**Ancrage : `> ⚠️ **Deux corrections par rapport aux versions précédentes de ce document.** La v1 annonçait`**

C'est le cas où il faut trancher entre **la redite qui protège et la redite qui alourdit**, et je
tranche : celle-ci alourdit, mais son *contenu* protège et doit survivre.

Le raisonnement : ce PRD est destiné à un lecteur externe qui **n'a jamais lu la v1 ni la v2**.
Pour lui, six lignes de journal de versions au milieu d'une décision bloquante sont du bruit. Le
seul élément qui le concerne est la **direction de l'erreur** — « l'erreur allait toujours dans le
même sens : sous-estimer » — parce qu'elle lui dit quelque chose sur la fiabilité de tout le
document, pas sur son historique.

> **Reco.** Réduire à deux lignes : « **Au plancher de l'ICP, la facture de première année
> représente 26 à 31 % du chiffre d'affaires selon le pack.** Les versions 1 et 2 annonçaient 21,9 %
> puis 25,8 % ; l'erreur allait deux fois dans le même sens — sous-estimer. Détail des calculs :
> `.memlog.md`. »

⚠️ **Cette coupe est conditionnée à la correction F-1 ci-dessous** : tant que R-03 affiche encore
25,8 %, l'encadré est la seule chose qui empêche le lecteur de croire le chiffre périmé.

---

### A-5. `CONDENSE` — FR-078 : sept lignes de débat académique pour une exigence de trois mots · **~4 lignes**

**Ancrage : `` `[HYPOTHÈSE]` *Une étude de 2023 conclut qu'une position basse dégrade le sentiment ``**

C'est la plus longue justification de toute la Partie B. Elle expose une étude de 2023, la
contredit par un travail de 2014, constate l'absence de consensus, puis conclut par un argument
d'asymétrie du risque. Le raisonnement est bon — mais il appartient à
`research-comparables.md`, et sa **conclusion** est déjà portée deux fois ailleurs : par M-09
(`| M-09 | Engagement du Club | **Activité du quartile inférieur du classement** | La littérature
établit qu'un classement peut faire décrocher les derniers tout en flattant les premiers |`) et par
R-05.

> **Reco.** Réduire à : « `[HYPOTHÈSE]` *La littérature est contradictoire et sans consensus
> (`research-comparables.md`). Le motif d'agir n'est pas la certitude, c'est l'asymétrie du risque :
> mesurer M-09 coûte peu, un classement qui fait décrocher les derniers coûte cher.* Piste :
> classement par cohorte ou par progression relative. »

*Note : le §13 porte deux lignes distinctes sur FR-078 (« Qu'un classement absolu nuise réellement »
et « Un classement par cohorte nuirait moins »). C'est correct — ce sont deux hypothèses
différentes. Ne pas les fusionner.*

---

### A-6. `CONDENSE` — §2.2 et FR-072 énoncent les mêmes deux bornes de prix, en entier, deux fois · **~3 lignes**

**Ancrage §2.2 : `| Élasticité au prix des formations | **Inconnue.** Deux bornes primaires existent pourtant`**
**Ancrage FR-072 : `Deux bornes de marché encadrent par ailleurs cette fourchette : un ancrage`**

Les deux passages citent intégralement « ~25 000 FCFA d'ancrage créateur » et « 150 000–500 000
FCFA en école ». Le §2.2 renvoie explicitement à FR-072 (« *et sont utilisées en FR-072* ») tout en
recopiant les chiffres qu'il annonce comme utilisés là-bas.

FR-072 est le passage actionnable : c'est lui qui garde les chiffres.

> **Reco.** Cellule §2.2 : « **Inconnue.** Deux bornes primaires existent et encadrent la fourchette
> pratiquée — voir FR-072. Ce qui manque, c'est la réponse de la demande. »

---

### A-7. `CONDENSE` — R-01 refait pour la troisième fois la démonstration de l'écart salarial · **~2 lignes**

**Ancrage : `| **R-01** | **Le prix de la formation n'est pas validé par le marché.** 95 000–200 000 FCFA vaut de **1,8`**

Les chiffres « 114 152 vs 186 710 » et « 63 % d'écart » figurent au §2.2
(`| Salaire moyen sénégalais | **114 152 vs 186 710 FCFA** selon la source. 63 % d'écart…`), puis
dans FR-072, puis dans R-01. Le ratio « 1,8 à 3,8 mois de SMIG » figure lui aussi trois fois
(UJ-1, FR-072, R-01).

Une cellule de tableau de risques doit tenir sur deux lignes. R-01 en fait quatre parce qu'elle
refait la démonstration.

> **Reco.** « **Le prix de la formation n'est pas validé par le marché.** 95 000–200 000 FCFA vaut
> 1,8 à 3,8 mois de SMIG — seul repère de revenu solide, les estimations de salaire moyen divergeant
> de 63 % (§2.2). » Le triplement du ratio SMIG, lui, **se garde** : UJ-1 en a besoin pour le récit,
> FR-072 pour l'action, R-01 pour le risque, et chaque section doit rester extractible seule.

---

### A-8. `MOVE` vers l'addendum — trois passages de *comment* dans un document de *quoi* · **~6 lignes**

Détaillés en **partie D**. Gain cumulé : NFR-03 (2 lignes), NFR-06 (2 lignes), FR-089 (2 lignes).

---

### A-9. `CONDENSE` — doublons §5.1 ↔ exigences · **~3 lignes**

Le tableau « Périmètre livré » du §5.1 est **à garder absolument** (voir partie G) : c'est la
meilleure page du document pour un développeur qu'on recrute. Mais deux de ses cellules recopient
le détail d'une exigence au lieu de le résumer, et deux exigences recopient la cellule.

| Doublon | Ancrage | Traitement |
|---|---|---|
| `agenda` regroupe événements et sessions | §5.1 : `| Club des Digitos | **8 onglets** de navigation (11 fichiers ; `agenda` regroupe` | FR-031 énumère déjà les huit onglets *dont* « agenda (événements et sessions) ». Réduire la cellule §5.1 à « **8 onglets** (11 fichiers) » |
| Dix-neuf écrans | FR-057 : `- **FR-057** — **Dix-neuf écrans** couvrent le pilotage, le contenu` | FR-057 est la seule exigence de la Partie A qui ne porte **aucune conséquence vérifiable** alors qu'elle recopie une cellule du §5.1. Lui donner sa conséquence (par ex. le nom de la table unique qui déclare les écrans) ou l'adosser à FR-010 |

---

## B. Les réorganisations

### B-1. `MOVE` — §6.2 : le groupe le plus urgent est le septième sur huit · **gain de compréhension majeur, 0 ligne**

C'est **la recommandation la plus forte de cette revue.**

Le §6.2 est la section la plus longue du document (151 lignes, 1 640 mots, 43 exigences) et la plus
consommée en aval — c'est elle qui alimentera le découpage en récits. Elle est organisée en huit
groupes non numérotés, et elle revendique la primauté **trois fois, dans trois groupes différents** :

| Ancrage | Position dans §6.2 | Revendication |
|---|---|---|
| `#### Mesure et vérité — préalable à tout le reste` | groupe **1/8** | « préalable à tout le reste » |
| `Ces exigences ne comblent pas un manque : elles ferment un **écart entre ce qui est affiché` | groupe **7/8** | « Ce sont les plus urgentes de la Partie B » |
| `**C'est le déblocage à plus fort effet de levier de toute la Partie B.**` (FR-101) | groupe **7/8** | « le plus fort effet de levier de toute la Partie B » |

Un lecteur qui arrive au groupe 7 découvre que ce qu'il vient de lire n'était pas le plus urgent.
Un agent de découpage en récits qui lit la section dans l'ordre produira un backlog dans le mauvais
ordre. Et FR-101 — dont dépendent explicitement FR-076, FR-077, FR-102 et la moitié de UJ-1 — est à
68 % de la section.

> **Reco.** Deux gestes, aucun renommage d'identifiant :
>
> 1. **Remonter le groupe « Ce que le produit promet sans le tenir » en position 2**, juste après
>    « Mesure et vérité ». Les identifiants FR-101…FR-107 ne bougent pas, seul l'ordre des blocs
>    change — c'est exactement ce que la contrainte de stabilité des identifiants autorise.
> 2. **Ouvrir §6.2 par un tableau d'ordonnancement de huit lignes** (voir E-3), qui dit une fois
>    pour toutes dans quel ordre les groupes se traitent et pourquoi. Les trois revendications de
>    primauté en prose deviennent alors une seule affirmation, arbitrée.
>
> Ordre défendable, tiré du texte lui-même : (1) Mesure et vérité — sans elle, aucune cible n'est
> posable ; (2) Promesses non tenues — écart contractuel, risque juridique et FR-101 débloque
> quatre autres exigences ; (3) Ligne TPE après D-01/D-02 ; (4) Prix et accessibilité ; (5) Club ;
> (6) Combler les écarts de Partie A ; (7) Conformité ; (8) Dette structurelle.

---

### B-2. `QUESTION` — §0 avant §1 : défendable, mais pas dans sa forme actuelle

**La question posée était : faut-il inverser §0 et §1 ? Réponse : non — mais il faut amputer §0 de
ce qui n'est pas de la méthode.**

**Pourquoi ne pas inverser.** Le §1 contient lui-même des marqueurs :
`| **Formations** (LMS) | … | **~85 % du CA** selon `BUSINESS_PLAN.md` `[À SOURCER]` |` et
`` `[HYPOTHÈSE]` *Cet avantage est plausible mais **non mesuré**…* ``. Un lecteur qui rencontre
`[À SOURCER]` dans la toute première ligne de son premier tableau, sans légende, comprend soit
qu'on lui cache quelque chose, soit rien du tout. **Le tableau des marqueurs doit précéder le §1**,
et il n'y a pas d'autre endroit où le mettre. Le modèle Pyramide veut la conclusion en tête, pas
l'illisibilité en tête.

**Pourquoi §0 est quand même mal calibré.** Sur ses 53 lignes, seules ~20 relèvent du protocole de
lecture. Les autres portent :
- des **faits sur l'entreprise** (l'âge, la caisse ouverte le 13 avril) → appartiennent au §1 ;
- des **constats de marché** (le SAM non sourcé) → appartiennent au §2.2 ;
- de **l'historique de fabrication** (le relecteur qui a exigé la distinction) → appartient au
  `.memlog.md` ;
- une **redite du §4**.

Après les coupes A-1a à A-1e, §0 tombe à ~32 lignes et devient ce qu'il doit être : **une carte de
lecture qu'on absorbe en trente secondes**, contenant (a) ce qu'est le document, (b) les deux
parties + les renvois §12/§13, (c) le tableau des quatre marqueurs, (d) l'avertissement « vous lisez
un PRD sans chiffre d'affaires ». Le lecteur atteint le §1 en une demi-page au lieu de deux.

> **Reco complémentaire.** Renommer le §0 pour ce qu'il devient : « **§0. Comment lire ce document —
> et ce qu'il ne dit pas** ». Le titre actuel, « À propos de ce document », annonce du remplissage
> et fait sauter la section — or elle contient le seul avertissement qui empêche un investisseur de
> mal lire les quatre-vingt-dix lignes suivantes.

---

### B-3. `MOVE` — §9 : dix-huit risques, cinq revendications de primauté, aucun tri

**Ancrage : `## 9. Risques`**

Même pathologie que B-1. Cinq lignes du tableau se déclarent prioritaires, à des rangs qui ne
correspondent pas :

| Risque | Rang | Revendication portée dans la cellule |
|---|---|---|
| R-04 | 4 | « **Crédibilité externe — risque le plus immédiat** » |
| R-13 | 13 | « **Recevabilité du document** » |
| R-15 | 15 | « **Bloquant en cas de levée ou de cession : c'est la première diligence** » |
| R-17 | 17 | « **c'est son risque n°1** » (ligne TPE) |
| R-07 | 7 | « **Aucun traitement à ce stade — à assumer explicitement devant un investisseur** » |

Les deux risques que le document désigne comme bloquants pour un investisseur (R-13, R-15) sont
**treizième et quinzième sur dix-huit**. Un lecteur pressé lit les cinq premières lignes d'un
tableau de dix-huit.

> **Reco.** Ne pas renuméroter — les identifiants R-xx sont stables et référencés depuis §6.2, §8
> et §11. **Ajouter une colonne `Gravité`** (bloquant / élevé / à surveiller) et **trier les lignes
> par cette colonne**, l'identifiant restant attaché à sa ligne. Ordre de tête défendable :
> R-04, R-15, R-13, R-14, R-17, R-02, R-03, R-08, R-16, puis le reste. C'est le seul changement qui
> rend le §9 utilisable en lecture rapide, et il ne touche à aucun identifiant.

---

### B-4. `MOVE` — regrouper les deux registres d'inconnues · priorité basse

**Ancrages : `## 11. Questions ouvertes` · `## 12. Glossaire` · `## 13. Index des hypothèses`**

§11 et §13 sont deux registres de la même matière — ce que le document ne sait pas — séparés par le
glossaire, qui est un **outil de consultation** et non une section de lecture. L'ordre naturel est
§11 → §13 → glossaire → annexes : les deux registres se lisent ensemble, l'outil se consulte à part,
en fin de volume comme un index.

> **Reco.** Permuter §12 et §13. **Coût** : quatre renvois à mettre à jour (`Le **glossaire** (§12)`
> et `l'**index des hypothèses** (§13)` en §0, `Récapitulée en §13` en §0, `(§13)` en §2.2).
> **Priorité basse** — à faire seulement si une autre passe touche déjà à ces renvois. Le gain est
> réel mais mineur, et la contrainte d'extractibilité des sections est déjà satisfaite en l'état.

---

### B-5. `QUESTION` — D-03 et §2.2 ne se connaissent pas

**Ancrages : `#### D-03 — Plusieurs chiffres publics ne sont adossés à aucune source` · `### 2.2 Non établi — et que ce PRD n'affirmera pas`**

Les deux sections traitent de données manquantes, et elles sont **complémentaires, pas
redondantes** : §2.2 recense ce que **le monde extérieur** ne fournit pas ; D-03 recense ce que **le
site public affirme** sans source. La distinction est bonne et il faut la garder.

Mais aucune des deux ne renvoie à l'autre, alors qu'elles se répondent exactement. Un lecteur qui
tombe sur D-03 en premier peut croire que le problème est de la négligence, alors que le §2.2 a
démontré qu'une partie de la donnée est structurellement introuvable.

> **Reco.** Une phrase en tête de D-03 : « Le §2.2 recense ce qu'aucune source publique ne fournit.
> Ce qui suit est différent : des chiffres que le produit affiche lui-même, sans les avoir. »
> Gain : 1 ligne dépensée, une confusion de nature évitée.

---

## C. Les déséquilibres

### C-1. Trop long pour ce qu'il porte

| Section | Poids | Diagnostic |
|---|---|---|
| **§0** | 53 l. / 541 mots — **plus que le résumé exécutif** | Le préambule d'un document est la section qui doit le plus mériter chaque ligne, parce qu'elle est lue avant que le lecteur ait décidé de lire. Traité en A-1 et B-2. **→ ~32 lignes** |
| **§6.1 D-01** | 43 l. / ~480 mots — **la plus longue unité décisionnelle** | Défendable : c'est un calcul, ses bornes, sa réserve méthodologique et trois issues. Mais 6 de ses 43 lignes sont un journal de versions (A-4) et 2 sont un tableau qui devrait être une liste (E-1). **→ ~35 lignes** |
| **§9** | 25 l. / **747 mots** — la densité de mots par ligne la plus élevée du document | Ce n'est pas une longueur excessive, c'est un **tableau saturé** : 747 mots dans 18 lignes de tableau, soit ~41 mots par cellule-ligne. R-01, R-09, R-14 et R-15 sont des paragraphes déguisés en cellules. A-7 en traite un ; les autres se resserrent en renvoyant à leur traitement (`FR-xxx`) plutôt qu'en le résumant |

### C-2. Trop court pour son importance

| Section | Poids | Diagnostic |
|---|---|---|
| **§1 Résumé exécutif** | 44 l. / 468 mots | ⚠️ **Le déséquilibre le plus coûteux du document.** C'est la seule section que certains lecteurs liront, et elle est plus courte que son propre préambule. Elle annonce `**Trois décisions bloquent la phase suivante**` sans nommer D-01, D-02 et D-03 : un lecteur qui s'arrête là ne repart avec **aucun identifiant** et ne peut rien demander de précis. Deux ajouts à fort rendement : (a) nommer les trois décisions par leur identifiant dans le dernier paragraphe ; (b) y remonter le fait d'âge coupé du §0 (A-1a). **Coût : 3 lignes. C'est le meilleur rapport du document.** |
| **§10 Hors périmètre** | 16 l. / 139 mots | Correctement bref. Mais sa dernière puce (`**Le gel ou l'arrêt d'une ligne de revenu.** ⚠️ *Cette exclusion est une décision par défaut, pas un arbitrage*`) est la plus lourde de conséquence des sept, et elle est en dernier. La remonter en premier : une exclusion qui s'avoue non arbitrée n'est pas de même nature que « pas d'application mobile native ». **0 ligne** |
| **§8 Métriques** | 28 l. / 521 mots | Bon équilibre, rien à faire. La contrainte « une métrique sans sa contre-métrique n'est pas pilotable » est tenue sur les douze lignes |

### C-3. Un déséquilibre interne à la Partie A : une promesse tenue aux deux tiers

**Ancrage : `Chaque exigence de cette partie est **constatée dans le code au 29 août 2026** et porte une **conséquence vérifiable**`**

La Partie A promet que **chaque** exigence porte une conséquence vérifiable. Environ **vingt des
soixante-sept n'en portent aucune** — FR-003, FR-008, FR-009, FR-013, FR-022, FR-023, FR-027,
FR-028, FR-029, FR-032, FR-033, FR-036, FR-045, FR-055, FR-057, FR-061, FR-062 sont des énoncés
d'une ligne sans conséquence ni limite.

Ce n'est pas un défaut de longueur, c'est un **défaut de promesse** — et dans un document dont
l'argument central est « on vous dit exactement ce qui est vérifié », c'est le genre d'écart qu'un
relecteur hostile trouve en deux minutes.

> **Reco — au choix, pas les deux :**
> - **(a)** Ajouter la conséquence manquante aux vingt exigences. Coût : ~20 lignes ajoutées, mais
>   la Partie A devient irréprochable et chaque exigence devient testable en aval.
> - **(b)** Amender le préambule : « Chaque exigence est constatée dans le code au 29 août 2026.
>   **Celles qui portent une conséquence vérifiable ou une limite connue l'énoncent** ; les autres
>   sont des constats simples. » Coût : 1 ligne. Honnête, immédiat.
>
> **(b) maintenant, (a) au moment du découpage en récits** — où la conséquence deviendra de toute
> façon le critère d'acceptation.

---

## D. Ce qui doit migrer vers `addendum.md`

L'addendum est déjà solide (325 lignes, onze sections, une section 10 remarquable). Le partage
*quoi* / *comment* est globalement bien tenu. **Quatre fuites** subsistent, dont trois sont des
duplications littérales de passages déjà présents dans l'addendum.

### D-1. `NFR-03` — les décomptes de fichiers ne sont pas une exigence · **2 lignes**

**Ancrage : `- **NFR-03 — Stabilité des URL de paiement.** Le segment de retour est **codé en dur côté serveur,`**

`addendum.md §3` porte **déjà, mot pour mot** :
> « **Renommer un segment public impose une mise à jour coordonnée de six emplacements** […]
> **Le segment de retour de paiement est codé en dur dans deux fichiers serveur.** Le renommer
> ferait atterrir tout paiement en cours sur une page introuvable — d'où NFR-03. »

L'addendum **renvoie déjà à NFR-03**. NFR-03 devrait donc porter l'exigence, pas la mécanique.

> **Reco.** « **NFR-03 — Stabilité des URL de paiement.** Les segments d'URL de retour de paiement
> sont stables. Tout renommage d'un segment public impose une mise à jour coordonnée de l'ensemble
> de ses miroirs, faute de quoi les paiements en cours atterrissent sur une page introuvable —
> cartographie complète en `addendum.md §3`. »

### D-2. `FR-089` — la démonstration est déjà faite dans l'addendum · **2 lignes**

**Ancrage : `- **FR-089** — Rendre **détectable la désynchronisation des miroirs de prix serveur**.`**

`addendum.md §2` porte déjà :
> « Les tests unitaires vérifient la cohérence entre les conditions générales et l'interface.
> **Ils ne peuvent pas atteindre les miroirs serveur.** C'est le trou que FR-089 doit fermer. »

Et l'histoire des 10 000 FCFA y est racontée en entier, avec les treize miroirs et les deux commits
— là où le PRD en donne une version résumée **une deuxième fois** (elle figure déjà dans la
conséquence de FR-030, à son point d'usage).

> **Reco.** « **FR-089** — Rendre **détectable la désynchronisation des miroirs de prix serveur**,
> que les tests actuels ne peuvent pas atteindre (FR-030, `addendum.md §2`). »

### D-3. `NFR-06` — recopie la conséquence de FR-064 · **2 lignes**

**Ancrages : `- **NFR-06 — Bilinguisme intégral.** Aucune chaîne visible codée en dur.` · `- **FR-064** — L'arbre de routes est **monté deux fois**`**

« deux éditions » et « chaque valeur anglaise doit être unique sur toute la table » figurent
**quatre fois** au total : cellule du §5.1, conséquence de FR-064, NFR-06, et `addendum.md §3`.

FR-064 est le constat, l'addendum est le mode d'emploi. NFR-06 doit être la contrainte
transverse — c'est-à-dire ce qu'on n'a pas le droit de casser, pas comment on s'y prend.

> **Reco.** « **NFR-06 — Bilinguisme intégral.** Aucune chaîne visible codée en dur, aucune route
> montée dans une seule langue. Toute route nouvelle est bilingue **avant** d'être livrée (FR-064,
> `addendum.md §3`). »

### D-4. `QUESTION` — l'appareil de recherche du §4 et de FR-078

Traité en A-2 et A-5. Destination : `research-comparables.md` pour le churn et la gamification,
`§2.1` pour le piège Facebook Sénégal/Côte d'Ivoire. Ce n'est pas de l'addendum au sens strict
(ce n'est pas du *comment technique*), mais c'est du **matériau de recherche dans un document de
spécification** — même problème de couche.

### D-5. `PRESERVE` — ce qui ressemble à du *comment* et doit rester

- **Le tableau du §5.1** (44 collections, 46 fonctions, 43 tests de règles, 23 espaces de noms) a
  l'air d'être de l'architecture. C'en est. Mais c'est **la seule page qui donne l'échelle du
  système en un coup d'œil**, et le lecteur « développeur à recruter » est explicitement au
  périmètre. Garder.
- **Le schéma ASCII du §3** (`MY ONOMA SARL — société opératrice…`) est un aide visuel qui fait
  en dix lignes ce qu'un paragraphe ferait mal. Garder.
- **Les conséquences de FR-018, FR-024, FR-025, FR-050** décrivent des mécanismes. Elles restent :
  ce sont les quatre points où le document démontre une rigueur de conception, et un investisseur
  technique les lit comme des preuves de compétence, pas comme de la documentation.

---

## E. Navigabilité — titres, tableaux, encadrés

### E-1. Les tableaux : douze, dont dix mérités

**Verdict global : bon.** Le document est très tabulaire et c'est justifié — un tableau est le bon
outil quand toutes les lignes répondent aux mêmes questions, et c'est le cas de dix des douze
(marqueurs, lignes de service, données non établies, périmètre livré, calcul D-01, chiffres D-03,
métriques appariées, risques, questions, glossaire, index des hypothèses). Deux exceptions :

**E-1a — `CUT` le tableau, garder le contenu — les « trois issues » de D-01**

**Ancrage : `**Trois issues, il faut en choisir une :**`**

Trois lignes, deux colonnes, et la seconde colonne n'est pas un attribut parallèle : c'est un
commentaire libre de longueur inégale. Un tableau qui n'a que trois lignes et pas de parallélisme
de colonne est une liste qui s'est déguisée. Et il est suivi immédiatement de
`**Recommandation.** Segmenter.` — le lecteur lit donc un tableau de choix pour apprendre à la
ligne suivante que le choix est fait.

> **Reco.** Trois puces en gras suivies de leur conséquence, et la recommandation en tête et non
> en queue : « **Recommandation : segmenter.** Le pack seul est déjà l'offre naturelle de ce
> palier, et le prix plancher existe déjà dans le code. Les deux autres issues, écartées : … ».
> **Gain : 2 lignes, et le lecteur reçoit la conclusion d'abord — c'est le modèle Pyramide appliqué
> à l'échelle du paragraphe.**

**E-1b — `CUT` une colonne — le tableau D-03**

**Ancrage : `| Chiffre affiché | Problème | Statut |`**

La colonne `Statut` vaut `[À SOURCER]` sur **six lignes sur sept**. Une colonne dont la valeur est
constante n'est pas une colonne : c'est un titre de tableau. Et elle vole de la largeur à la colonne
`Problème`, qui est la seule qui porte l'information et dont les cellules débordent.

> **Reco.** Supprimer la colonne et titrer : « **Sept chiffres affichés publiquement, tous
> `[À SOURCER]` sauf mention contraire.** » La septième ligne (portraits IA, statut `—`) sort du
> tableau et devient une puce sous celui-ci : ce n'est pas un chiffre, elle n'a jamais eu sa place
> dans un tableau de chiffres. **Gain : 2 lignes et un tableau lisible.**

**E-1c — `QUESTION` — le tableau manquant**

Le seul tableau que le document **n'a pas** et devrait avoir est l'**ordonnancement du §6.2** (B-1).
Huit lignes : groupe, ce qu'il débloque, rang, motif. C'est la seule addition de tableau que je
recommande, et c'est aussi la plus rentable.

### E-2. Les titres : un trou de numérotation qui gêne l'extraction

**Ancrages : `## PARTIE A — Le produit tel qu'il est en production` · `## PARTIE B — Exigences de la phase suivante`**

**Il n'existe aucun titre `## 5.` ni `## 6.` dans le document.** On passe de `## 4. Parcours
utilisateur` à `## PARTIE A`, puis directement à `### 5.1 Périmètre livré`. Idem pour la Partie B
et `### 6.1`.

Conséquences concrètes, et elles comptent pour un document déclaré chef de chaîne :
- une table des matières générée automatiquement affiche « PARTIE A » puis « 5.1 » — le §5 n'a pas
  de nom ;
- un outil de fractionnement par titres de niveau 2 produira un fichier « PARTIE A » contenant les
  onze sous-sections, et un fichier « 4. Parcours » séparé — le découpage ne suivra pas la
  numérotation que le corps du texte utilise dans ses renvois ;
- les renvois internes du type « §6.2 » et « §5.1 » pointent vers des titres qui n'existent qu'au
  niveau 3.

> **Reco.** Deux titres à réécrire, rien d'autre :
> `## PARTIE A — 5. Le produit tel qu'il est en production`
> `## PARTIE B — 6. Exigences de la phase suivante`
> Coût : deux lignes modifiées. Bénéfice : la numérotation devient continue de §0 à §13 et les
> renvois internes retombent sur des titres réels.

**Secondaire.** Les huit groupes du §6.2 sont des `####` non numérotés, au même niveau de titre que
D-01, D-02 et D-03 du §6.1. Dans une table des matières, `D-01 — Le bas de la cible TPE…` et
`Dette structurelle` apparaissent au même rang, alors que les premiers sont des décisions bloquantes
et les seconds des regroupements thématiques. Numéroter les groupes `6.2.1` à `6.2.8` résout le
rang et donne un point d'ancrage stable à chaque lot pour le découpage en récits.

### E-3. `ADD` — une table des matières · **~16 lignes ajoutées**

949 lignes, aucun sommaire. Pour un lecteur externe qui ouvre le document sans savoir combien de
temps il va y passer, l'absence de sommaire est le premier signal de découragement — et pour le
lecteur qui cherche une section précise (l'investisseur qui veut les risques, le développeur qui
veut la Partie A), c'est du défilement à l'aveugle.

> **Reco.** Sommaire de 16 lignes, immédiatement **après** le §0 raccourci et **avant** le §1 —
> pas en tête : le §0 est la clé de lecture, il doit rester la première chose lue. Marquer d'un
> signe les quatre sections qu'un lecteur pressé lit en priorité (§1, §6.1, §9, §11).
> C'est le seul endroit où j'ajoute plus de dix lignes, et c'est celui qui les rentabilise le
> mieux.

### E-4. Les encadrés : bon usage, une seule inflation

Les encadrés `> ⚠️` sont bien employés — ils marquent tous une chose que le lecteur risquerait de
mal comprendre, jamais un simple appui rhétorique. Le piège ARTP (§2.1), le rattachement non
tranché de `/presence-digitale` (§3), le point juridique sur l'objet social (§3), l'hypothèse
intégrale des parcours (§4) : quatre encadrés, quatre avertissements réels.

Deux réserves :
- **Densité en §3.** Trois encadrés en quarante lignes (rattachement, frontières de marque, objet
  social). Quand un lecteur voit trois `⚠️` dans une section courte, il cesse de les distinguer.
  Le bloc « Deux frontières de marque à ne pas franchir » n'est pas un avertissement mais une règle
  positive : il fonctionne aussi bien en texte courant, ce qui rend leurs deux voisins plus
  audibles.
- **L'encadré de D-01** (A-4) est le seul dont la fonction n'est pas d'avertir le lecteur mais de
  documenter le document.

---

## F. Trois désynchronisations trouvées en chemin

*Hors du périmètre éditorial strict, mais bloquantes pour l'objectif déclaré du document — et
gratuites à corriger.*

### F-1. `R-03` porte encore le chiffre que `D-01` déclare faux · **critique**

**Ancrage : `| **R-03** | **Le bas de la cible TPE est infinançable** à 25,8 % de son chiffre d'affaires la première année |`**

D-01 corrige explicitement : « La v2 annonçait **25,8 %** — le plan seul, sans le pack, alors que le
devis les additionne. **Au plancher de l'ICP, la facture de première année représente en réalité
26 à 31 % du chiffre d'affaires selon le pack.** »

**R-03 affiche toujours 25,8 %.** Le document contient donc, à quatre cents lignes d'écart, la
correction et l'erreur corrigée — et l'erreur est dans le tableau des risques, celui qu'un
investisseur lit.

> **Correction : `à 26–31 % de son chiffre d'affaires la première année selon le pack retenu`.**

### F-2. `§13` cite deux pourcentages qui n'existent plus nulle part · **élevé**

**Ancrage : `**Chiffres marqués `[FICTIF]`** — calculés sur des scénarios inventés`**

Le paragraphe de clôture du §13 dit : « le chiffre d'affaires de Fatou (1,2 M FCFA/mois) et les
pourcentages qui en dérivent **(17,2 % et 14,6 %)** en §4, UJ-3 ».

Or UJ-3 dit aujourd'hui : « ce poste représenterait `[FICTIF]` **de 20 à 25 % la première année** ».
**« 17,2 » et « 14,6 » n'apparaissent nulle part ailleurs dans le document** (vérifié). L'index des
hypothèses — la section dont toute la fonction est de dire au lecteur exactement ce qui est fictif —
pointe vers deux chiffres fantômes.

> **Correction : `les pourcentages qui en dérivent (20 à 25 %) en §4, UJ-3`.**

### F-3. `[FICTIF]` sur `« 20 à 25 % »` : marqueur discutable · **`QUESTION`, pour l'auteur**

**Ancrage : `Sur son chiffre d'affaires supposé, ce poste représenterait `[FICTIF]` **de 20 à 25 % la première année**`**

Le §13 précise : « *Les pourcentages de §6.1, D-01 ne sont pas fictifs : ils sont calculés sur la
grille tarifaire réelle et sur le plancher d'ICP déclaré.* » Le pourcentage d'UJ-3 est calculé sur
la même grille réelle, mais divisé par un chiffre d'affaires inventé (1,2 M) — donc `[FICTIF]` est
correct au sens du tableau des marqueurs. **Rien à corriger.**

Mais le lecteur qui compare voit « 20 à 25 % `[FICTIF]` » en UJ-3 et « 26 à 31 % » non marqué en
D-01, pour ce qui ressemble au même calcul, et n'a aucun moyen de comprendre que la différence
tient au dénominateur (1,2 M inventé contre 800 k déclaré).

> **Reco.** Une incise de sept mots en UJ-3 : « `[FICTIF]` *parce que son chiffre d'affaires est
> inventé — le calcul de D-01, lui, part du plancher d'ICP déclaré* ». **1 ligne, et le marqueur
> cesse d'être ambigu là où il est le plus visible.**

---

## G. À ne pas toucher

Sections examinées et jugées bonnes en l'état — je les liste pour qu'aucune passe ultérieure ne les
« optimise » par erreur.

| Élément | Pourquoi il reste |
|---|---|
| **Le tableau des quatre marqueurs (§0)** | Système délibéré, protégé. Aucune des recommandations ci-dessus ne le touche |
| **`~~FR-083~~` et `~~FR-091~~`** | Barrés avec la mention « Identifiant conservé vide pour ne jamais être réattribué ». C'est un usage exemplaire de la stabilité des identifiants : les garder tels quels, y compris la mention |
| **La redite « aucun canal d'envoi d'e-mail »** — **cinq occurrences** (UJ-1, FR-006, FR-035, FR-101, R-14) | **L'archétype de la redite qui protège.** C'est le manque le plus lourd du produit, et chacune des cinq mentions est au point d'usage d'une section qui doit rester extractible seule. Un agent d'architecture qui n'extrait que le §7 doit rencontrer R-14 ; un agent de découpage qui n'extrait que §6.2 doit rencontrer FR-101. **Ne pas dédupliquer.** Seul réglage possible, facultatif : FR-035 et R-14 énoncent tous deux « aucune dépendance d'envoi » — 1 ligne à gagner, ce n'est pas rentable au regard du risque |
| **La redite « pas de chiffre de traction »** — §0, R-13, Q-02, FR-093 | Même raisonnement, avec une répartition des rôles nette : §0 avertit, R-13 qualifie le risque, Q-02 pose la question, FR-093 spécifie l'action. Quatre fonctions distinctes, pas quatre copies. **Garder les quatre** |
| **§8 — les douze couples métrique / contre-métrique** | La meilleure section du document. Le principe « une métrique sans sa contre-métrique n'est pas pilotable » est tenu douze fois sur douze, et la colonne « Pourquoi ce couple » justifie chaque appariement. Rien à retrancher |
| **§12 — le glossaire** | Les prescriptions négatives (« **Jamais** "cours" dans un contexte normatif », « **N'est jamais un pack** ») en font un outil opérationnel et non un lexique décoratif. Précieux pour les agents en aval. Intact |
| **§13 — l'index des hypothèses** | Structurellement redondant par construction — c'est sa fonction. C'est le seul endroit où le lecteur peut **compter** les hypothèses, et le fait que D-01 y occupe quatre lignes est en soi une information. Intact, sous réserve de F-2 |
| **§5.1 — le tableau « Périmètre livré »** | Aide à la compréhension : donne l'échelle du système avant le détail. Voir D-5 |
| **Les conséquences de FR-018, FR-024, FR-025, FR-050** | Ce sont les quatre endroits où le document prouve sa rigueur de conception plutôt que de l'affirmer. Ne pas raccourcir |
| **L'ordre §1 → §2 → §3 → §4 → Partie A → Partie B** | Conforme au modèle Pyramide et à la lecture d'un externe : produit, marché, marque, usages, existant, à faire. Ne pas y toucher — seuls le §0 en amont et le §6.2/§9 en interne demandent un travail |

---

## Récapitulatif chiffré

### Coupes

| Reco | Ancrage | Gain |
|---|---|---|
| A-1 | §0 — cinq blocs (`**Âge du produit**`, `**Aucun chiffre de taille de marché**`, `**Réserve sur les parcours**`, `La distinction entre [HYPOTHÈSE]`, `**Statut des affirmations.** Trois recherches`) | **21 l.** |
| A-2 | §4 — `*Au Sénégal, Facebook touche 3,60 millions` (UJ-3) et `*Le churn médian des communautés payantes` (UJ-2) | **8 l.** |
| A-3 | `> **Ce que « constaté » veut dire` → `addendum.md §10` | **4 l.** |
| A-4 | `> ⚠️ **Deux corrections par rapport aux versions précédentes` | **4 l.** |
| A-5 | `*Une étude de 2023 conclut qu'une position basse` (FR-078) | **4 l.** |
| A-6 | `| Élasticité au prix des formations |` (§2.2) ↔ FR-072 | **3 l.** |
| A-9 | `| Club des Digitos | **8 onglets**` + FR-057 | **3 l.** |
| E-1a | `**Trois issues, il faut en choisir une :**` → liste | **2 l.** |
| E-1b | `| Chiffre affiché | Problème | Statut |` → colonne constante | **2 l.** |
| A-7 | `| **R-01** | **Le prix de la formation n'est pas validé` | **2 l.** |
| D-1 | `- **NFR-03 — Stabilité des URL de paiement.**` | **2 l.** |
| D-2 | `- **FR-089** — Rendre **détectable la désynchronisation` | **2 l.** |
| D-3 | `- **NFR-06 — Bilinguisme intégral.**` | **2 l.** |
| | **Total coupes** | **~59 lignes (6 %)** |

### Ajouts recommandés

| Reco | Objet | Coût |
|---|---|---|
| E-3 | Table des matières après le §0 raccourci | +16 l. |
| B-1 | Tableau d'ordonnancement en tête de §6.2 | +8 l. |
| C-2 | Nommer D-01/D-02/D-03 et l'âge du produit dans le §1 | +3 l. |
| B-3 | Colonne `Gravité` au §9 | +0 l. |
| B-5 / F-3 | Deux incises de raccordement (D-03→§2.2, `[FICTIF]` en UJ-3) | +2 l. |
| | **Total ajouts** | **+29 lignes** |

**Solde net : ~−30 lignes (949 → ~919).** La longueur n'est pas le sujet, et je ne recommande pas
de la poursuivre : ce document a la taille que son enjeu justifie. **Le rendement est ailleurs** —
dans B-1 (l'urgence enfin ordonnée), C-2 (un résumé exécutif qui rend des identifiants), E-2 (une
numérotation continue qui rend chaque section extractible) et F-1/F-2 (deux chiffres périmés
retirés d'un document dont l'argument est la fiabilité des chiffres).

### Ordre d'application suggéré

1. **F-1, F-2** — trois minutes, et le document cesse de se contredire. À faire avant toute autre
   chose : A-4 en dépend.
2. **C-2, E-2** — cinq lignes au total, effet immédiat sur la lecture externe et sur l'extraction.
3. **B-1** — la réorganisation du §6.2. C'est le travail principal.
4. **A-1, B-2** — le §0 ramené à sa fonction.
5. **A-2 à A-9, D-1 à D-3, E-1** — passe de resserrement, mécanique.
6. **E-3, B-3, B-4** — confort de navigation, à faire en dernier quand la structure ne bouge plus.
