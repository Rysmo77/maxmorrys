# Réconciliation — PRD contre ses sources

**Date** : 2026-08-29
**Cible** : `prd.md` (rev. 2) et `addendum.md`
**Sources confrontées** : `project-context.md` (2026-07-20, 166 règles) · `research-marche-edtech-ao.md` ·
`research-comparables.md` · `research-agence-tpe.md` (tous du 2026-08-29)
**Méthode** : chaque chiffre du PRD issu d'un digest a été retrouvé dans sa source et comparé
*avec la réserve que la source y attachait*. Les affirmations de `project-context.md` reprises ou
non par l'addendum ont été **vérifiées dans le code du dépôt**, pas seulement lues.

---

## Verdict en une page

**Fidélité des chiffres : 36 vérifiés, 31 fidèles, 5 problématiques.** Le taux est bon, et le
travail de préservation des réserves est, en volume, remarquable : le piège ARTP des cartes SIM,
le refus du SAM de `BUSINESS_PLAN.md`, le refus des projections de marché, l'étiquetage
`[HYPOTHÈSE]` du repère budgétaire français, l'absence de tout chiffre WhatsApp — tout cela est
repris exactement comme la recherche le demandait, parfois avec une réserve *renforcée*.

**Mais trois réserves ont été perdues, et elles portent toutes le même marqueur : `(fait sourcé)`.**
Le §0 du PRD définit l'absence de marqueur comme « vérifié dans le code, **ou sourcé auprès d'une
source primaire citée** ». Trois chiffres portent ce sceau alors que leur source les donnait
explicitement comme secondaires, non audités, ou comme des prix affichés par des vendeurs. C'est la
faute la plus grave relevée ici, précisément parce que le document a construit un appareil de
marquage rigoureux : un lecteur qui fait confiance au marqueur est trompé par les trois cas où il
ment.

**Une erreur arithmétique héritée puis élargie** : la comparaison prix-formation / salaire moyen est
fausse pour le bas de la fourchette, et le PRD l'affirme deux fois.

**Un angle mort de recherche** : `Chariow` — infrastructure créateurs, francophone, **mobile money
natif, 0 € d'abonnement** — est identifié par `research-comparables.md` comme « concurrent
d'infrastructure direct ». Il n'apparaît **nulle part** dans le PRD, dont le premier moat déclaré
est précisément le mobile money natif.

---

## 1. Fidélité chiffre par chiffre

### 1.1 Chiffres fidèles (31)

| # | Chiffre du PRD | Source | Emplacement PRD | Verdict |
|---|---|---|---|---|
| 1 | Bancarisation stricte **25,2 %**, *en baisse* | BCEAO 2024 | §1, §2.1 | ✅ réserve « en baisse » conservée |
| 2 | Inclusion financière UEMOA **73,6 %** | BCEAO 2024 | §1, §2.1 | ✅ |
| 3 | **248,7 M** comptes de monnaie électronique | BCEAO 2024 | §2.1 | ✅ |
| 4 | **76,9 M** comptes actifs | BCEAO 2024 | §2.1 | ✅ |
| 5 | **517 M** comptes mobile money AO | GSMA 2025 | §2.1 | ✅ |
| 6 | **498 Md USD** transigés en 2025 | GSMA 2025 | §2.1 | ✅ |
| 7 | Mobile money **> 5 % du PIB** (BJ, CI, SN) | GSMA 2025 | §2.1 | ✅ |
| 8 | Panier 2 Go = **4,2 % du RNB/hab**, médiane Afrique 2024 | ITU 2025 | §2.1, NFR-04 | ✅ *(voir 2.4 : contre-tendance omise)* |
| 9 | Cible ONU **2 %** | ITU 2025 | §2.1 | ✅ |
| 10 | **960 M** personnes (**64 %**) couvertes mais non utilisatrices | GSMA | §2.1 | ✅ |
| 11 | Possession de smartphone **24 %** de la population | GSMA 2024 | §2.1 | ✅ |
| 12 | Sénégal **60,6 %** de pénétration | DataReportal 2026 | §2.1 | ✅ |
| 13 | Côte d'Ivoire **40,7 %** | DataReportal 2026 | §2.1 | ✅ |
| 14 | Bénin **~32 %** | DataReportal 2026 | §2.1 | ✅ |
| 15 | Piège ARTP **125,78 %** = cartes SIM, démonté par Africa Check | Africa Check / ARTP | §2.1 (encadré) | ✅ **réserve intégralement conservée, et mise en garde ajoutée** |
| 16 | ITU **60,1 %** en 2024 | ITU | §2.1 | ✅ |
| 17 | Âge médian sénégalais **19,6 ans** | DataReportal 2026 | §2.1 | ✅ |
| 18 | LinkedIn **1,50 M = 7,9 %**, *portée publicitaire* | DataReportal 2026 | §4, UJ-1 | ✅ nature de la mesure correctement nommée |
| 19 | **Un tiers** de la cohorte Africa EdTech 50 est B2B/institutionnel | HolonIQ 2025 | §2.1, R-10 | ✅ |
| 20 | Liste dominée à **~73 %** par ZA + Nigeria | HolonIQ 2025 | §2.1 | ✅ |
| 21 | Projections edtech divergentes d'un **facteur 2,5** | IMARC vs Research Nester | §0 | ✅ et **le chiffre de marché est refusé, comme la recherche l'exigeait** |
| 22 | MOOC **5–15 %**, médiane **12,6 %** | openpraxis.org | D-03, R-04 | ✅ |
| 23 | Self-paced **30–50 %** | openpraxis.org | D-03 | ✅ |
| 24 | Cohorte avec live **50–80 %** | openpraxis.org | D-03 | ✅ |
| 25 | Salaire moyen **114 152 vs 186 710 FCFA**, **63 %** d'écart, aucune remontant à l'ANSD | Topnews / EnergieMineAfrique | §2.2 | ✅ *en §2.2* (voir 1.2 #5 pour l'usage dérivé) |
| 26 | Informalité sénégalaise **85 à 97 %** | RGE / ANSD | D-02 | ✅ |
| 27 | Repère budgétaire **7–16 % du CA annuel**, *PME françaises* | recherche TPE | D-01, §13 | ✅ **réserve renforcée** : le PRD signale lui-même la tension avec son §2.2 |
| 28 | **~63 %** des internautes ivoiriens sur Facebook | DataReportal (ratio calculé) | §4, UJ-3 | ✅ |
| 29 | **2 475 000 FCFA** première année, **facteur 6** apparent | recherche TPE | UJ-3, D-01 | ✅ arithmétique revérifiée |
| 30 | Spécialistes à **9–99 USD/mois** | Skool / Circle / Kajabi | §1, R-09 | ✅ |
| 31 | Club **19 900/an ≈ 1 658/mois** | calcul propre | FR-074 | ✅ et correctement `[HYPOTHÈSE]` |

**Calculs dérivés revérifiés** (D-01 et UJ-3) : 25,8 % / 21,9 % / 10,3 % / 8,75 % / 4,1 % / 3,5 %
sur la grille réelle, et 17,2 % / 14,6 % sur le CA `[FICTIF]` de Fatou — **tous exacts**, et la
distinction `[FICTIF]` vs calcul-sur-grille-réelle est tenue jusque dans l'index des hypothèses.

### 1.2 Chiffres problématiques (5)

| # | Chiffre | Ce que disait la source | Ce qu'en fait le PRD | Gravité |
|---|---|---|---|---|
| 1 | **Churn 5,8 %/mois ≈ 51 %/an** | `research-comparables` §2 : *« Rétention publiée **(S — agrégateur, méthodologie non auditée)** »* | UJ-2 : « Le churn médian des communautés payantes est de 5,8 % par mois — environ 51 % par an ***(fait sourcé)*** » | 🔴 **Réserve perdue** |
| 2 | **400 000 FCFA, « prix courant à Dakar »** | `research-agence-tpe`, avertissement liminaire : *« blogs d'agences qui vendent ces mêmes services — sources structurellement biaisées à la hausse… **prix affichés, pas prix transactés** »* | UJ-3 : « un site à 400 000 francs une fois, prix courant à Dakar ***(fait sourcé)*** » | 🔴 **Réserve perdue + contradiction interne** |
| 3 | **« La littérature établit »** (classement / quartile bas) | `research-comparables` §4 : effet leaderboard tiré d'**une** étude (Emerald, *Internet Research* 2023) dans un champ où *« le consensus scientifique est absent et les études longitudinales manquent »* | FR-078 : « **La littérature établit** que… » · M-09 : « **La littérature établit** que… » | 🟠 **Réserve perdue** |
| 4 | **« 95 000–200 000 FCFA dépasse un mois de salaire moyen sous les deux estimations »** | La source formule la même chose sur **125 000 XOF** — et se trompe déjà : 125 000 < 186 710 | R-01 et FR-072 reprennent, **en élargissant à une fourchette dont le plancher (95 000) est sous les deux estimations** | 🟠 **Erreur arithmétique, héritée puis amplifiée** |
| 5 | **Skool « 9 USD/mois »** | `research-comparables` §2 : Hobby 9 USD/mois **avec 10 % de commission** ; Pro 99 USD avec 2,9 % | §1 et R-09 : « 9 USD/mois » sans la commission | 🟡 Précision perdue |

---

## 2. Les réserves perdues — le détail

### 2.1 🔴 Le churn de 5,8 % porte le sceau « fait sourcé » qu'il n'a pas

Le §0 du PRD définit son marquage ainsi :

> *(non marqué)* | **Vérifié** dans le code du dépôt, ou sourcé auprès d'une **source primaire citée**

`research-comparables.md` étiquette explicitement cette donnée `(S)` — secondaire — et ajoute
*« agrégateur, méthodologie non auditée »*. Le PRD la présente en UJ-2 comme un *fait sourcé*.

**Aggravant : la mauvaise bande est citée.** La source décompose :

| Format | Churn mensuel |
|---|---|
| Communautés payantes (médiane toutes formes) | 5,8 % |
| Bibliothèques self-paced | 6–9 % |
| **Formats cohorte / communauté** | **3–5 %** |

Le Club des Digitos est un format communauté animée, pas une bibliothèque. La bande qui le
concerne est **3–5 %**, pas la médiane de 5,8 %. Le PRD retient la valeur la plus large et la
présente comme la référence du Club. Corriger dans les deux sens : retirer le `(fait sourcé)`,
et citer la bande du bon format.

**Correction proposée** — remplacer dans UJ-2 par :
> *Le churn mensuel médian publié pour les communautés payantes est de 5,8 % (≈ 51 %/an) ; la
> bande des formats cohorte/communauté, plus proche du Club, est de 3–5 %/mois.* `[HYPOTHÈSE]`
> *Source secondaire, agrégateur à méthodologie non auditée — aucune donnée équivalente n'existe
> en contexte francophone africain (§2.2).*

### 2.2 🔴 Les 400 000 FCFA de Dakar sont un prix affiché, et le PRD dit lui-même pourquoi

`research-agence-tpe.md` s'ouvre sur un avertissement méthodologique majeur : la grille de prix
provient d'agences qui vendent ces services, elle est structurellement biaisée à la hausse,
souvent générée pour le SEO, et *« ce sont des prix affichés, pas des prix transactés. L'écart
entre les deux, sur un marché où la négociation est la norme, est inconnu. »*

Le PRD reprend cet avertissement **correctement en §2.2** :

> Prix transactés (vs affichés) chez les agences TPE | **Le trou principal.** Toutes les grilles
> disponibles viennent d'agences qui vendent ces services

… puis le **contredit trente lignes plus haut**, en UJ-3, en donnant 400 000 FCFA comme
« prix courant à Dakar *(fait sourcé)* ». Le même document déclare la donnée inexploitable en §2.2
et l'emploie comme fait en §4. Un relecteur externe qui repère cette paire perd confiance dans
l'appareil de marquage entier — c'est exactement le mécanisme que le PRD décrit lui-même pour le
98 % de complétion en D-03.

**Correction proposée** — en UJ-3 : *« un site à 400 000 francs une fois — **prix affiché par les
agences de Dakar, jamais un prix transacté observé (§2.2)** »*, et retirer le `(fait sourcé)`.
Le raisonnement d'ancrage reste entièrement valide : ce qui compte est ce que le prospect **voit**,
et les prix affichés sont précisément cela. Le désamorçage de FR-079 n'est pas affaibli, il est
mieux fondé.

### 2.3 🟠 « La littérature établit » là où la source dit qu'il n'y a pas de consensus

`research-comparables.md` §4 est intitulé « **la littérature est contestée** » et pose trois
réserves que le PRD ne reprend pas :

1. effet global positif **mais non consensuel**, études longitudinales manquantes ;
2. **effet de nouveauté** documenté comme confound systématique — l'engagement mesuré retombe ;
3. Mekler *et al.* (CHI 2014) : points, niveaux et classements **ne créent ni ne détruisent** la
   motivation intrinsèque — ils agissent surtout comme indicateurs de progression.

Le PRD ne conserve que la conclusion qui l'arrange (le classement nuit au quartile bas) et lui
donne le statut le plus fort possible : « la littérature établit ». R-05, lui, est correctement
couvert (« documentées comme *potentiellement* nuisibles ») — la formulation à corriger est celle
de **FR-078 et M-09**.

**L'effet de nouveauté est un manque opérationnel, pas seulement rhétorique** : M-09 et M-10
mesureront un engagement dont la source dit qu'il retombe mécaniquement. Sans fenêtre de mesure
qui l'absorbe, les deux contre-métriques produiront un faux positif au premier trimestre.

### 2.4 🟡 Réserves mineures perdues ou nuances omises

| Élément | Ce qui manque |
|---|---|
| **4,2 % du RNB** (NFR-04) | La source note que l'ARTP relève **quatre trimestres consécutifs de baisse** du coût des services mobiles au Sénégal. Le PRD ne la mentionne pas — la contrainte est réelle, mais la tendance joue en sens inverse |
| **24 % de possession de smartphone** | La source précise que l'**adoption smartphone atteint 63 % des connexions** en 2025. Les deux chiffres ensemble décrivent le marché ; seul le plus sombre est repris |
| **25,2 % de bancarisation** | La bancarisation **élargie de 47,4 %** est omise. La source la donne ; le contraste 25 vs 74 est plus net que le contraste réel |
| **Skool à 9 USD** | La commission de **10 %** sur ce plan est omise — la menace est décrite moins cher qu'elle n'est |
| **Bandes de complétion** | L'attribution (`openpraxis.org`) n'est pas portée au PRD, alors que D-03 en fait le pivot du démontage du 98 % |

---

## 3. Sur-interprétations

### 3.1 Le mobile money comme exigence structurelle — ✅ **conclusion autorisée**, ❌ **moat surévalué**

La conclusion « la carte bancaire ne peut pas être le rail principal ; Wave / OM / Free Money
**sont** le marché » est **mot pour mot celle de la source**, et adossée à BCEAO + GSMA. Rien à
redire sur la *lecture de marché*.

Ce qui dépasse la source, c'est le passage de *fait de marché* à *moat démontré*. Le PRD écrit
en §1 :

> **Deux choses la distinguent, et une seule est démontrée :** 1. Le paiement en monnaie
> électronique locale, nativement. […] Skool, Kajabi et Circle ne les servent pas. *C'est un fait
> de marché, vérifiable.*

`research-comparables.md` §5 est plus prudent, et volontairement : le moat *« tient »* — mais
formulé comme *« barrière réelle **contre Kajabi/Skool** qui ne le font pas »*. La restriction aux
acteurs anglophones est dans la source ; le PRD la reprend, puis **conclut plus large que la
restriction ne le permet**. Or la même recherche identifie, dans la même section, un acteur qui
franchit la barrière :

> **Chariow : 0 € d'abonnement, ~15 % de commission dégressive à 10 %, Mobile Money natif (P/S)
> — concurrent d'infrastructure direct.**

Un créateur francophone ouest-africain qui veut vendre une formation en Wave a donc, aujourd'hui,
une option à **0 € d'abonnement**. Tant que le PRD ne traite pas ce cas, son moat n°1 est énoncé
sans son contre-exemple connu, alors que la recherche le lui a servi.

**Second point, mineur mais gênant** : §1 nomme « Wave, Orange Money et **Free Money** » comme le
rail qui distingue la plateforme, quand FR-015 constate que *« Free Money n'apparaît que dans les
conditions générales et n'est pas offert au paiement »*. Le moat est décrit avec un rail que le
produit n'offre pas.

### 3.2 Le poids en Mo comme contrainte de conception — ✅ **autorisé**

« → Le poids en Mo d'un cours est une contrainte de conception, pas un détail » est **la phrase de
la source**, tirée de données ITU primaires. NFR-04 la reprend et lui ajoute une obligation
opérationnelle (« toute exigence nouvelle porte son budget en poids ») qui est une décision
produit légitime, pas une extrapolation. **Aucune sur-interprétation.** Seule la contre-tendance
ARTP (§2.4) manque.

### 3.3 Skool comme menace n°1 — ✅ **pas de sur-interprétation**, mais un prix sous-estimé

La source écrit « **Skool est le tueur direct** » et « la plateforme doit justifier son existence
contre un produit à 9 USD ». Le PRD est en réalité **plus prudent que sa source** : il ne classe
pas Skool en menace n°1 (ce rang revient à R-04, les chiffres invérifiables) et l'inscrit dans
R-09 « cinq produits, une équipe ». Les deux réponses défendables retenues — mobile money natif et
contenu en contexte ouest-africain — sont exactement celles de la source.

Le seul écart est la commission de 10 % omise (§2.4). Elle joue **en faveur** du produit une fois
rétablie : à 500 000 XOF de ventes mensuelles, un créateur sur le plan Hobby paie ~50 000 XOF de
commission, pas 9 USD. L'omettre exagère la menace — c'est une infidélité qui ne sert pas
l'auteur, mais qui reste une infidélité.

### 3.4 Différencier la grille par ville (FR-080) — 🟡 **léger renversement**

La source conclut : *« Ne pas appliquer une grille unique aux trois capitales **sur cette seule
base** »*, et prévient que l'écart Cotonou > Dakar est *« contre-intuitif et probablement un
artefact de faible échantillon »*. Le PRD en tire une exigence **positive** — « Différencier la
grille par ville » — là où la source dit surtout de **ne rien décider** sur ces données. Le
sous-texte `[HYPOTHÈSE]` du PRD rattrape la formulation (« probablement un artefact d'échantillon
— d'où FR-081 avant toute décision »), mais l'intitulé de l'exigence dit l'inverse de son corps.
Reformuler en : *« Trancher, après FR-081, si la grille doit être différenciée par ville. »*

---

## 4. Constats de recherche non exploités

Classés par coût de l'omission.

### 4.1 🔴 Chariow et les acteurs francophones — la concurrence n'est pas cartographiée

`research-marche-edtech-ao.md`, « ce qui reste inconnu » n°8 :

> **Concurrence directe non cartographiée.** Acteurs francophones repérés au passage, sans données
> de traction : **Chariow, Novakou, Irawo, Cap Learning, Want Skills, Edumiaa.**

Plus `research-comparables.md` : **Waraba Academy** (2 000+ apprenants UEMOA revendiqués),
**Abidjan Digital School**, **GOMYCODE** (campus Dakar et Abidjan, 8 M USD Série A, > 40 000
diplômés revendiqués), **Etudesk** (LMS B2B Abidjan).

**Aucun de ces noms n'apparaît dans le PRD.** Ni dans §2, ni dans les risques, ni dans les
questions ouvertes, ni comme exigence de la Partie B. Pour un document destiné à un investisseur,
l'absence d'une carte de la concurrence — alors que la recherche a livré les noms **et** a
explicitement signalé que la cartographie manquait — est le trou le plus visible après l'absence
de traction (R-13).

**À ajouter** : une exigence « cartographier les six à dix acteurs francophones identifiés, leur
modèle et leur traction » et un risque distinct « un concurrent d'infrastructure francophone à
0 € d'abonnement et mobile money natif existe ».

### 4.2 🔴 Le § 2.2 sur-déclare le vide de données sur les prix

Le PRD écrit :

> Prix réellement pratiqués et élasticité | **Non sourcés.** Le seul repère public est **l'opinion
> non étayée d'un éditeur SaaS**

C'est inexact **contre ses propres digests**. `research-comparables.md` fournit :

| Repère | Statut source |
|---|---|
| **Abidjan Digital School : 150 000–500 000 FCFA par formation** | **(P) — source primaire** |
| Ancrage observé **~25 000 FCFA** pour un cours digital au Sénégal | (S) |
| LiveMentor 1 980–2 500 € · Copy Mastery 2 000–3 500 € | (S) |
| Maven : cours 500–3 000 USD, ~20 000 USD par cohorte | (P) |
| Skool / Circle / Kajabi, grilles complètes | (P) vérifié |

Et `research-agence-tpe.md` fournit une grille régionale entière (biaisée, mais explicitement
qualifiée). Le « seul repère public » n'est donc pas l'éditeur SaaS. La conséquence est concrète :
**la fourchette formation de 95 000–200 000 FCFA est encadrée par un prix primaire local
(150 000–500 000 pour une formation en école à Abidjan) et par un ancrage bas (~25 000 pour un
cours digital)** — deux bornes qui informent directement FR-072, et que le PRD s'est privé
d'utiliser en déclarant le champ vide.

### 4.3 🟠 Coursera Coach — la seule donnée chiffrée sur l'effet d'un tuteur IA intégré

`research-comparables.md` §3 :

> **Seule donnée chiffrée publique sérieuse sur l'effet d'un tuteur IA intégré** : Coursera Coach,
> > 1 M d'apprenants, 94 % déclarant une meilleure expérience, **+9,5 % de réussite au quiz au
> premier essai, +11,6 % de leçons/heure** (P mais **vendor-sourced, non audité** → plafond
> optimiste).

Absente du PRD. C'est le seul plafond d'attente disponible pour Rysmo. §8 ne comporte **aucune
métrique d'efficacité pédagogique de Rysmo** : M-05 mesure les requêtes et le coût, pas l'effet.
Un lecteur externe demandera « à quoi sert Rysmo, mesurablement » et le document n'a ni réponse ni
repère — alors que la recherche en fournissait un, avec sa réserve toute prête (« plafond
optimiste, vendor-sourced »).

### 4.4 🟠 Les trois modèles de facturation de l'IA — Rysmo n'est pas situé

La source identifie trois modèles et **aucun illimité gratuit** :

1. **Crédits / quotas** — Kajabi (crédits mensuels, rachat 15 USD), LearnWorlds (100–2 000
   prompts/mois), Thinkific réservé aux plans Plus ;
2. **Réservé au haut de gamme** — Circle AI Agents en Enterprise seulement ;
3. **SKU séparé** — **Khanmigo 4 USD/mois grand public**, ~15 USD/élève/an en add-on district.

Le PRD (FR-040, NFR-10) et l'addendum (§5) ne retiennent que la conclusion « personne ne vend
l'illimité ». Or Rysmo combine les modèles **1 et 3** (quota quotidien + packs et abonnements
séparés), ce que la recherche permet de dire, et **Khanmigo à 4 USD/mois est le comparable direct
de Rysmo Lite à 3 000 XOF/mois (~5 USD)** — le seul comparable de prix grand public disponible
pour un tuteur IA. Une ligne dans FR-041 suffirait à ancrer le tarif.

### 4.5 🟠 Le financement — la donnée la plus « investisseur » du dossier est absente

`research-marche-edtech-ao.md` §1, seule donnée du digest à méthodologie publique :

> **AO francophone hors top-4 : 252 M USD d'equity contre 99 M pour l'anglophone hors top-4** —
> 68 % du volume hors top-4 (55 % en 2024), **79 deals contre 37** (Partech 2025).
> Tech africaine 2025 : 4,1 Md USD levés (+25 %).

Le §0 du PRD déclare viser « investisseur, associé, développeur à recruter ». Le document ne
comporte **aucun élément de contexte de financement**, alors que la recherche en fournit un,
sourcé, avec méthodologie publiée, et favorable au positionnement géographique. Idem pour le
**Mastercard Foundation EdTech Fellowship 2026 (60 000 USD equity-free, 12 pays)** — un chemin de
financement concret pour une société sans chiffre de traction (R-13).

### 4.6 🟠 Le vent institutionnel et le contrepoint Banque mondiale

La source établit deux choses que le PRD n'utilise pas :

- **Vent institutionnel réel** : la Côte d'Ivoire a une stratégie nationale IA plaçant l'éducation
  en secteur prioritaire ; Sénégal, Burkina et Congo intègrent l'IA-éducation à leur stratégie
  numérique.
- **Contrepoint documenté (Banque mondiale)** : la plupart des produits edtech-IA sont conçus pour
  les pays à haut revenu ; *« à défaut de choix de conception délibérés, l'IA creuse les écarts »*.
  → *« L'argument de localisation FR + contexte ouest-africain est donc défendable sur le fond,
  pas seulement en marketing. »*

Ce contrepoint est **exactement l'étai manquant du moat n°2 du PRD**, que §1 laisse en
`[HYPOTHÈSE]` non mesurée. Il ne prouve pas le moat, mais il le sort du registre marketing —
gratuitement, et depuis une source institutionnelle.

### 4.7 🟡 L'informalité : le TAM apparent est trompeur

Le PRD utilise le 85–97 % **uniquement** en D-02, pour dire qu'un engagement de six mois n'est pas
exécutoire. La source en tire un second constat, distinct, qu'aucun risque du PRD ne porte :

> La cible « 1–15 salariés, formelle, 800 k–5 M/mois, prête à s'engager 6 mois » est une
> **fraction étroite** d'un très grand nombre. **Le TAM apparent est trompeur.**

Il n'y a pas de risque R-xx sur l'étroitesse de la cible TPE. Ce n'est pas un chiffre de taille de
marché (que le PRD s'interdit à juste titre), c'est un risque qualitatif de dimensionnement. D-01
choisit entre trois options dont deux réduisent encore le volume de prospects, sans que le
document ait jamais dit que le vivier était déjà étroit.

### 4.8 🟡 Autres constats non exploités

| Constat de la source | Emplacement PRD qui en aurait profité |
|---|---|
| **Seuils psychologiques FCFA** (5k impulsif · 10k réflexion · 25k · 50k · **100k investissement majeur, exige un paiement échelonné ou une forte réputation**) — folklore de marché assumé | FR-073 (paiement fractionné) est **exactement** la réponse prescrite par ce constat, mais le PRD ne dit jamais d'où vient l'idée ni qu'elle repose sur du folklore |
| **Rysmo 500–3 500 XOF : sous le seuil d'achat impulsif — zone la plus sûre** de toute la grille | §1 et FR-041 : aucun jugement de positionnement tarifaire sur la seule ligne que la recherche valide |
| **SMIG sénégalais 52 500 FCFA/mois** (chiffre officiel, non contesté) | R-01 / FR-072 : ancrage **robuste** disponible (95 000–200 000 = 1,8 à 3,8 mois de SMIG) au lieu du « salaire moyen » à 63 % d'écart qui produit l'erreur de §1.2 #4 |
| **Injini** : smartphone d'entrée 130–160 USD = **2 à 4 mois de revenu** ; la faible adoption carte **contraint structurellement les modèles par abonnement** | NFR-05 est laissée en `[HYPOTHÈSE]` alors que ce constat la sourcerait partiellement |
| **Injini** : CI, SN, CM, RDC (250 M+ hab.) **sous-pénétrés par les plateformes anglophones** → avantage premier entrant | §2.1, où l'espace libre est présenté sans son signal positif |
| **Causes d'annulation** : faible engagement **32 %**, valeur perçue insuffisante **27 %** | FR-076 (« rendre la valeur visible ») est précisément la réponse à la seconde cause — non citée |
| **Ce qui fait monter la complétion** : le paiement, la sélectivité et le suivi humain — **pas les badges** | D-03 / M-03 / R-05, où la gamification est traitée uniquement par ses nuisances |
| **Frais marchands mobile money 2,5–3 %** | D-02 et l'économie unitaire de la ligne TPE |
| **GBP** : inférence « fiches majoritairement absentes ou abandonnées → **barrière concurrentielle basse**. Bon pour la délivrabilité du résultat, **mauvais pour la défendabilité du prix** » | R-06 / FR-082 ne retiennent que le vide de données, pas cette inférence — qui est un arbitrage produit à part entière |
| **Proxies WhatsApp** (Kenya 43 % des entreprises consultent WhatsApp toutes les heures ; ZA 96 %) et *« aucun benchmark de conversion formulaire → WhatsApp »* | §2.2 signale le trou WhatsApp mais **aucune exigence ni aucun risque ne le traite** — or FR-049 et le tunnel TPE en dépendent entièrement |

---

## 5. `project-context.md` — ce qui manque à l'addendum et compte pour un développeur

L'addendum reprend correctement les frontières de version, les trois projets TypeScript, le double
montage de routes, les six emplacements d'un segment public, `cn()` sans résolution de conflit, la
collision de teintes intentionnelle, les deux bibliothèques d'icônes, les paramètres `_` à ne pas
« corriger », `catch (error: unknown)`, le point de passage unique d'erreur, l'absence de
formateur, et `npm ci`.

**Ce qui manque, vérifié dans le code, et qui coûte cher à celui qui l'ignore :**

| # | Règle absente de l'addendum | Vérification effectuée | Pourquoi ça compte |
|---|---|---|---|
| 1 | **Le HMAC du webhook Bictorys se calcule sur les octets bruts** (`req.rawBody`) ; le parsing de corps de `firebase-functions` interfère — ne pas refactoriser | ✅ `functions/src/payment.ts:568-574`, commentaire explicite dans le code | Le PRD dit de FR-018/NFR-02 : *« point le plus rigoureux du système ; aucune évolution ne doit affaiblir cet ordre »* — et **n'écrit nulle part comment on le casse** |
| 2 | **Aucun staging.** `.firebaserc` ne déclare qu'un projet ; **tout `firebase deploy` local vise la production**, et le **canal de preview des PR se déploie sur le projet de production** | ✅ `.firebaserc` = `max-morrys` seul ; `ci.yml` job `preview` → `projectId: max-morrys` | Premier jour d'un nouveau développeur. L'addendum §4 parle de déploiement sans jamais dire qu'il n'existe pas d'environnement de repli |
| 3 | **Les sourcemaps partent en production** et sont publiquement récupérables | ✅ `vite.config.ts` : `sourcemap: 'hidden'` ; `firebase.json` `ignore` = `["firebase.json","**/.*","**/node_modules/**"]` — les `.map` ne sont pas exclus | Contredit l'esprit de NFR-07 (« clés tierces jamais côté client ») sans être mentionné |
| 4 | **Chaque Cloud Function doit lister ses secrets dans ses options runtime**, sinon elle reçoit une valeur vide **sans erreur au déploiement** | project-context §Secrets | Panne silencieuse en production, impossible à diagnostiquer sans la règle |
| 5 | **Régions des fonctions** : `europe-west1` pour `prerender`, `sitemap`, `catalog`, `rss`, `renderSocialCard` — exactement l'ensemble câblé aux rewrites. **Changer la région casse le rewrite** | project-context §Régions | Touche directement FR-004, FR-005, FR-067 |
| 6 | **`functions/.env.max-morrys` est tracké dans git** — ne jamais y écrire un secret. Ne jamais lire ni committer `max-morrys-*.json` ni `.env.local` | project-context §Secrets | Sécurité |
| 7 | **`functions/lib/` est compilé ET committé** (54 fichiers) : éditer `functions/src`, rebuild, committer le `lib` régénéré | ✅ `git ls-files functions/lib` = 54 | Un développeur qui l'ajoute au `.gitignore` casse le déploiement |
| 8 | **Barrel `lib/firestore` en `export *` sur 14 fichiers → unicité globale des noms exportés** | project-context §Accès aux données | Casse le build sans namespace pour protéger |
| 9 | **`updateUserProfile` jette silencieusement tout champ absent de `ALLOWED_PROFILE_FIELDS`** | ✅ `src/lib/firestore/users.ts:17-27` | Ajouter un champ à `User` ne suffit pas à le rendre enregistrable — bug fantôme classique |
| 10 | **Écritures privilégiées = callables, jamais Firestore.** Collections serveur-seul : `certificates`, `referrals`, `leaderboard`, `analytics`, `activity_logs`, `rysmoProfiles`, `rysmoConversations`, `webhook_events`, `_ratelimits` | project-context §Modèle de sécurité | L'addendum §9 en décrit les conséquences sans donner la règle |
| 11 | **Nouvelle route SEO publique → rewrites `prerender` dans `firebase.json`, en FR *et* en `/en`** | ✅ 34 rewrites, dont 15 sous `/en` (chiffre repris par l'addendum §3, mais **sans dire que c'est une édition obligatoire**) | Sinon la route tombe sur le shell SPA, sans HTML serveur |
| 12 | **Aucune CSP en développement** : tout nouveau domaine tiers passe en local et échoue en ligne | project-context §Pièges critiques n°8 | Le mode de panne le plus déroutant du dépôt |
| 13 | **Nouvelle requête multi-champs ordonnée → `firestore.indexes.json`.** L'émulateur ne proteste pas, la production si | project-context | |
| 14 | **Changement d'origine média = 4 endroits** : `wrangler.toml` `ALLOWED_ORIGINS`, CSP `connect-src`, CSP `media-src`, `VITE_MEDIA_API_URL` — aucune source partagée | project-context | Même famille que les miroirs de prix de l'addendum §2 |
| 15 | **`npm test` porte `--passWithNoTests`** : une suite vide ou mal nommée passe en silence ; un fichier hors `tests/unit/*.test.ts` n'est jamais exécuté | project-context §Tests | **Aggravé depuis** : les tests unitaires sont désormais bloquants en CI (§6), donc la fausse assurance a plus de portée qu'en juillet |
| 16 | **Aucun test de composant, `@testing-library/*` non installé** — 147 fichiers `.tsx`, zéro test de rendu | project-context §Tests | Un développeur à qui l'on demande un test d'interface doit savoir que le harnais n'existe pas |
| 17 | **`scripts/rules.test.mjs` est un orphelin legacy pointant sur le vrai `projectId: 'max-morrys'`**, sans préfixe `demo-` | ✅ `scripts/rules.test.mjs:30` | Danger réel : l'exécuter touche le vrai projet |
| 18 | **`src/lib/mockData.ts` n'est importé nulle part** et ressemble à des données de seed | project-context §Code mort | |
| 19 | **`lms/routes/*Page.tsx` ≠ `lms/tabs/*Tab.tsx`** (adaptateurs, pas doublons) ; **`admin/components/Club*` ≠ `lms/tabs/club/Club*`** (deux features sur les mêmes collections) | project-context §Structure | Le PRD parle de « 19 écrans » et « 8 onglets » sans dire que ces paires ne sont pas des doublons à fusionner |
| 20 | **`throw new Error('errors.xxx')` depuis `AuthContext` est une clé de traduction**, résolue contre le namespace **`auth`** — alors qu'un namespace `errors` distinct existe | project-context §i18n | « Piège réel » selon la source |
| 21 | **Ne jamais appeler `useTranslatedText` dans un `.map()`** — utiliser `<TranslatedText />` | project-context §i18n | Touche FR-066, décrit par l'addendum sans sa contrainte d'appel |
| 22 | **Toute nouvelle route lazy doit utiliser `lazyWithReload`**, pas `React.lazy` nu | project-context §Auth/guards | Écran blanc après déploiement sinon |
| 23 | **`LanguageProvider` doit être rendu dans le Router** ; ordre des providers porteur de sens | project-context | |
| 24 | **`httpsCallable` se déclare au niveau module**, avec génériques explicites | project-context | |
| 25 | **Ne pas importer `firebase/storage`** — les médias passent par `uploadMedia()` (R2) | ✅ `vite.config.ts` le confirme : *« `firebase/storage` n'est plus utilisé »* | L'addendum dit « pas le stockage Firebase » en tableau, mais pas la règle d'écriture |
| 26 | **`queryKeys` centralisées**, zéro littéral inline ; **`useMutation` jamais utilisé** (0 occurrence) ; defaults frugaux à ne pas desserrer | ✅ `src/lib/queryClient.ts:23-35` ; `grep useMutation src/` = 0 | |
| 27 | **ESLint linte `functions/`, `worker/` et `scripts/` avec `globals.browser`** — faux positifs normaux ; pas de règles type-aware | project-context §Qualité | |
| 28 | **Node : CI en 20, runtime Functions en 22, aucun `engines`** — ne pas s'appuyer sur des API Node > 20 | ✅ `ci.yml` : `node-version: 20` partout | |
| 29 | **`COOP: same-origin-allow-popups` volontaire** (auth Google en popup) — ne pas durcir | project-context | |
| 30 | **`audit/` : rapports datés, ne pas les « mettre à jour »** pour coller au code | project-context §Dossiers | ⚠️ C'est **exactement la faute que le PRD s'attribue** : *« Les fausses venaient toutes d'une même faute : avoir fait confiance à un document d'audit daté plutôt qu'au code »*. La règle qui l'aurait évitée existait déjà |

**Les six premières (1, 2, 3, 4, 5, 9) devraient entrer à l'addendum sans débat.** Elles sont soit
des pannes silencieuses, soit des risques de sécurité, soit le premier jour d'un développeur.

---

## 6. Contradictions entre `project-context.md` et l'addendum

Toutes tranchées par lecture du code au 2026-08-29.

| # | `project-context.md` (20 juillet) | `addendum.md` (29 août) | Code | Verdict |
|---|---|---|---|---|
| 1 | Chunk `firebase` **ne couvre que app/auth/firestore/storage** ; `firebase/functions` et `firebase/analytics` en sortent (`vite.config.ts:25-30`) | Fonction, pas liste figée ; groupe **l'intégralité des modules Firebase** ; signale project-context comme **périmé** | ✅ `vite.config.ts` : `if (/node_modules\/(@firebase\|firebase)\//.test(id)) return 'firebase'` | **Addendum a raison.** project-context périmé. *À ajouter, absent des deux : `lucide-react` n'a plus de groupe, et `vendor-react` a été séparé de `router`* |
| 2 | TanStack Query dans **6 fichiers** (Blog, Formations, Videos, Podcasts, useStudentData, useAdminUsers) | **10 fichiers** | ✅ 10, dont **`Home.tsx` et `FormationCTA.tsx`**, absents de la liste de project-context | **Addendum a raison.** L'écart compte : project-context dit « ne pas migrer spontanément » en s'appuyant sur une liste fausse |
| 3 | **21 namespaces bundlés statiquement, rien n'est auto-découvert** ; *« ajouter un namespace = 4 éditions dans `src/i18n/index.ts` »* | **23 namespaces, 8 statiques + 15 à la demande** | ✅ 23 fichiers JSON par langue ; `CORE_NAMESPACES` = 8, `LAZY_NAMESPACES` = 15 ; `loadNamespaces()` + `partialBundledLanguages: true` | **Addendum a raison.** ⚠️ **Et la règle des « 4 éditions » est périmée sans que personne ne le dise** : la procédure diffère désormais selon que le namespace est core ou lazy. Ni l'un ni l'autre document ne donne la procédure à jour — **trou net pour un développeur** |
| 4 | `worker/src` : typecheck **« jamais en CI »** (tableau) — puis, 200 lignes plus bas : *« désormais couverts par le job `workers` »* | Worker : *« typecheck et tests — bloquants »* | ✅ `ci.yml` job `workers` : typecheck + test | **Addendum a raison.** project-context est **contradictoire avec lui-même** ; son tableau induit en erreur |
| 5 | **`npm test` n'est jamais exécuté en CI. Aucun job ne l'invoque.** | *« Bloquant sur proposition de modification : … **tests unitaires** … »* + correction explicite du document daté | ✅ `ci.yml`, job `lint-and-build`, étape `Unit tests: npm test`, avec commentaire sur les CGV | **Addendum a raison.** Correction datée et justifiée |
| 6 | `npm run test:rules` exige **« Java »** | Exige **JDK 21** ; la machine de référence a Java 1.8 par défaut ; `export JAVA_HOME=/opt/homebrew/opt/openjdk@21` ; sinon échec **sans que rien n'indique que les règles n'ont pas été testées** | ✅ `ci.yml` : `setup-java` `java-version: '21'` | **Addendum plus précis.** À remonter dans project-context |
| 7 | Versions : Tailwind **3.4.1** · React Router **7.13.1** · Vite **5.4.2** | Déclaré ≠ installé : **3.4.17 / 7.17.0 / 5.4.21** | ✅ confirmé sur `node_modules` | Pas une contradiction : project-context dit lui-même que ses numéros sont des **ancres**. L'addendum est plus utile |
| 8 | Le job de déploiement **ne pousse que le hosting** (règles, index, storage, functions jamais déployés) | *« **Le frontend est mis en ligne par un déploiement Wrangler, pas par la chaîne d'intégration continue.** »* | ✅ `ci.yml` déploie bien le frontend sur Firebase Hosting (`channelId: live`, `projectId: max-morrys`) — **et `worker/apps/site` est un Worker d'edge posé devant, dont `ORIGIN` est `https://max-morrys.web.app`** ; `worker/README.md` : *« Tout le reste est relayé à l'origine »* | 🔴 **L'addendum a tort sur ce point précis.** Le frontend **est** déployé par la CI, vers l'origine Firebase Hosting que le Worker sert. Ce que `wrangler deploy` seul met en ligne, c'est **l'edge** : prerender SEO, `/sitemap.xml`, `/rss.xml`, `/catalog.csv`, et surtout la **table de redirections `/via/<slug>`** — dont le README dit : *« Déployer le frontend ne suffit donc pas ; la table… n'est lue que par `wrangler deploy` de `apps/site` »*. La formulation exacte à retenir |

**Deux autres défauts relevés au passage dans l'addendum :**

- **§4 renvoie à `(R-12)`** pour le risque de déploiement. Le risque correspondant est **R-11**
  (« La chaîne de déploiement ne pousse que l'hébergement ») ; **R-12** est « aucune preuve
  publique qu'une communauté annuelle payante tienne durablement ». Renvoi à corriger.
- **§7 dit que la vérification du Worker est « bloquante »** : elle l'est sur proposition de
  modification, mais le job `deploy` ne dépend que de `lint-and-build` (`needs: lint-and-build`).
  **Ni `workers` ni `rules-tests` ne gardent le déploiement.** À écrire, puisque FR-088 ne
  mentionne que les règles.

---

## 7. Corrections proposées, par ordre de priorité

| # | Correction | Emplacement | Effort |
|---|---|---|---|
| 1 | **Retirer `(fait sourcé)` du churn 5,8 %**, le passer en source secondaire non auditée, et citer la bande du bon format (3–5 %/mois pour cohorte/communauté) | prd.md §4 UJ-2 | 3 lignes |
| 2 | **Retirer `(fait sourcé)` des 400 000 FCFA** et écrire « prix affiché par les agences, jamais transacté (§2.2) » | prd.md §4 UJ-3 | 1 ligne |
| 3 | **Corriger la comparaison prix/salaire** : la fourchette 95 000–200 000 ne dépasse pas un mois de salaire moyen sous les deux estimations. Basculer l'ancrage sur le **SMIG (52 500 FCFA)**, chiffre officiel non contesté : 1,8 à 3,8 mois | prd.md R-01 et FR-072 | 2 lignes |
| 4 | **Remplacer « la littérature établit »** par « une étude publiée (Emerald, 2023) indique », et signaler l'**effet de nouveauté** comme confound de mesure pour M-09/M-10 | prd.md FR-078, M-09 | 3 lignes |
| 5 | **Ajouter Chariow et les acteurs francophones** : un risque distinct (concurrent d'infrastructure francophone, mobile money natif, 0 € d'abonnement) et une exigence de cartographie concurrentielle | prd.md §9 + §6.2 | 1 risque + 1 FR |
| 6 | **Corriger le §2.2 sur les prix** : il existe un repère primaire local (Abidjan Digital School 150 000–500 000 FCFA) et un ancrage bas (~25 000 FCFA/cours). Les porter en entrée de FR-072 | prd.md §2.2, FR-072 | 4 lignes |
| 7 | **Corriger l'addendum §4** : la CI déploie bien le frontend vers l'origine Hosting ; ce que `wrangler deploy` seul met en ligne est l'edge SEO **et la table `/via/<slug>`** | addendum.md §4 | 4 lignes |
| 8 | **Ajouter à l'addendum les six règles critiques manquantes** : HMAC octets bruts · aucun staging + previews sur la prod · sourcemaps publiques · secrets à lister par fonction · régions `europe-west1` câblées aux rewrites · `ALLOWED_PROFILE_FIELDS` | addendum.md §8 | 1 section |
| 9 | **Écrire la procédure à jour d'ajout d'un namespace i18n** (core vs lazy) — périmée dans project-context, absente de l'addendum | addendum.md §3 | 5 lignes |
| 10 | **Ajouter Coursera Coach** comme seul plafond public d'effet d'un tuteur IA (avec sa réserve « vendor-sourced, non audité »), et **Khanmigo à 4 USD/mois** comme comparable de Rysmo Lite | prd.md FR-041, §8 | 3 lignes |
| 11 | **Reformuler FR-080** : « trancher, après FR-081, si la grille doit être différenciée par ville » — l'intitulé actuel dit l'inverse de son corps | prd.md FR-080 | 1 ligne |
| 12 | **Ajouter un risque sur l'étroitesse de la cible TPE** (« le TAM apparent est trompeur ») et une exigence sur le **tunnel WhatsApp non validé**, aujourd'hui signalé en §2.2 mais traité nulle part | prd.md §9, §6.2 | 1 risque + 1 FR |
| 13 | **Corriger le renvoi `(R-12)` → `(R-11)`** et préciser que ni `workers` ni `rules-tests` ne gardent le déploiement | addendum.md §4, §7 | 2 lignes |
| 14 | **Rétablir la commission Skool de 10 %** sur le plan à 9 USD | prd.md §1, R-09 | 1 ligne |
| 15 | **Aligner §1 et FR-015 sur Free Money** : ne pas nommer dans le moat un rail que le tunnel n'offre pas | prd.md §1 | 1 ligne |

---

## Annexe — ce que le PRD a particulièrement bien fait

À signaler, parce que ces choix sont rares et méritent d'être préservés en révision :

- **Le piège ARTP est reproduit intégralement**, avec l'interdiction de l'employer — la recherche
  le demandait, le PRD en a fait un encadré.
- **Le SAM de `BUSINESS_PLAN.md §5.1` est nommé et refusé** au §0, et aucun chiffre de taille de
  marché n'est avancé nulle part.
- **Le repère budgétaire de 7–16 % est marqué `[HYPOTHÈSE]` avec sa propre contradiction écrite** :
  *« le §2.2 de ce document interdit précisément d'emprunter des repères occidentaux »*. Peu de
  documents se relèvent eux-mêmes en flagrant délit.
- **Aucun chiffre WhatsApp n'est cité** — ni les 95 %, ni les taux d'ouverture, ni le ROI de 380 %,
  ni le 98 %. La recherche interdisait les quatre.
- **Le « 46 % des recherches locales » et le A4AI obsolète sont absents**, comme demandé.
- **La distinction `[FICTIF]` / `[HYPOTHÈSE]` et la note finale du §13** (« les pourcentages de
  D-01 ne sont pas fictifs, ils sont calculés sur la grille réelle ») sont exactement le genre de
  précision qui manque partout ailleurs.
- **M-01 reprend la conclusion de la recherche mot pour mot** : le taux de renouvellement à
  12 mois, pas le MAU, est la métrique de survie du Club.
