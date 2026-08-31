---
title: "Réconciliation — PRD contre BUSINESS_MODEL, BUSINESS_PLAN et finance/"
date: 2026-08-29
cible: prd.md (révision 2) + addendum.md
statut: rapport de réconciliation — aucune modification apportée aux documents cibles
---

# Réconciliation — ce que les sources contenaient, et ce que le PRD en a fait

## 0. Périmètre et méthode

**Documents cibles**
- `_bmad-output/planning-artifacts/prds/prd-maxmorrys.me-main-2026-08-29/prd.md` (révision 2, 100 FR, 13 NFR, 11 métriques, 13 risques)
- `.../addendum.md` (9 sections techniques)

**Documents sources**
- `BUSINESS_MODEL.md` — 13 avril 2026, 11 lignes de service, synergies, flywheel, parcours de monétisation, KPI de pilotage
- `BUSINESS_PLAN.md` — v2.0, juin 2026, 4 flux, personas, unit economics, P&L 5 ans, roadmap
- `finance/` — `model.py`, `hypotheses.csv`, `scenarios_comparatif.csv`, `revenus_par_flux_5ans.csv`, `compte_resultat_5ans.csv`, `cashflow_tresorerie_5ans.csv`, `tresorerie_mensuelle_an1.csv`

**Méthode.** Chaque écart relevé est classé en trois catégories, et la troisième est la plus importante :

| Classe | Sens |
|---|---|
| **Écarté à raison** | L'omission est délibérée et bonne. Ne pas rouvrir. §8 en dresse la liste pour éviter qu'un relecteur ultérieur la rouvre |
| **Perdu par accident** | Le contenu aurait survécu à la structure en exigences numérotées s'il avait été vu. C'est le cœur de ce rapport |
| **Contradiction** | Les sources et le PRD, ou les sources entre elles, disent deux choses incompatibles |

**Ce que ce rapport ne fait pas.** Il ne demande pas la réintégration des chiffres de marché ni des projections financières : le PRD s'en est privé volontairement et il a raison (§8.1). Il vérifie en revanche que le PRD est **cohérent avec sa propre règle**, et il montre que cette règle a emporté au passage plusieurs **faits contractuels et réglementaires** qui ne sont ni des projections ni des données de marché — c'est le défaut de filtre le plus systématique du document (§5.4).

**Vérifications de code menées pour ce rapport.** Cinq affirmations des sources ont été testées directement contre le dépôt, parce que le PRD les traite comme non implémentées ou ne les traite pas :
`functions/src/referrals.ts`, `functions/src/notifications.ts`, `functions/src/digest.ts`, `src/pages/lms/CoursePlayer.tsx`, `src/types/index.ts:206`, `src/i18n/locales/fr/formations.json`, `src/pages/admin/`. Les résultats sont donnés à leur emplacement.

---

## 1. Verdict en une page

**Le PRD est meilleur que ses sources sur la rigueur, et moins bon sur une chose : il a perdu le modèle.**

Les sources décrivent un **système** — cinq lignes qui s'alimentent selon un ordre précis, une capacité de production qui les plafonne, un escalier de prix qui fait monter le client d'un palier à l'autre. Le PRD décrit un **inventaire** — cinq lignes rangées dans un tableau de poids, cent exigences numérotées, onze métriques appariées. La structure en exigences numérotées a fait exactement ce qu'elle fait toujours : elle a conservé tout ce qui est vérifiable une fois, et laissé tomber tout ce qui n'existe que comme relation entre deux choses.

Concrètement, le PRD répond à « que fait le produit ? » et ne répond plus à « comment l'argent circule-t-il d'une ligne à l'autre ? ». C'est visible à trois endroits du document lui-même :

- **M-04** traite la concentration du revenu sur une ligne comme un risque de portefeuille, alors que dans les sources la ligne 1 est *censée* porter l'essentiel et les autres sont ses dérivées (`BUSINESS_MODEL.md §4.2`, `BUSINESS_PLAN.md §4.5`) ;
- **Q-08** demande « sur cinq lignes, lesquelles tourner à fond et lesquelles suspendre », question qui n'a pas de réponse tant que le document ne dit pas laquelle alimente laquelle ;
- **§10 Hors périmètre** exclut « le gel ou l'arrêt d'une ligne de revenu » en le qualifiant de « décision par défaut, pas un arbitrage » — ce qui est exact, et le resterait moins si le flywheel était au document.

Les huit écarts qui méritent une correction sont listés en §10, par ordre d'importance. Trois d'entre eux ne sont pas des omissions de rédaction mais des **capacités absentes du produit** que les sources signalaient comme critiques et que le PRD ne demande nulle part.

---

## 2. Les pertes qualitatives — le type le plus coûteux

### 2.1 Le flywheel et l'escalier de monétisation — **perdu par accident, gravité haute**

`BUSINESS_MODEL.md §4.1` (matrice de synergies), `§4.2` (flywheel de croissance), `§4.3` (parcours de monétisation en six étapes) et `BUSINESS_PLAN.md §4.5` (logique de packaging) décrivent la même chose sous quatre formes : **contenu gratuit → capture e-mail → première formation → Club → Rysmo+ → parrainage → retour au contenu par le certificat partagé et le témoignage.**

Le PRD n'en garde **rien**. Il possède les briques — FR-001 à FR-008 (contenu), FR-006 (newsletter), FR-014 (catalogue), FR-030 (Club), FR-041 (Rysmo), FR-020 (parrainage), FR-025 (certificat), FR-029 (témoignage) — mais aucune phrase ne dit que ce sont les maillons d'une seule chaîne, ni dans quel ordre.

**Pourquoi c'est coûteux, et pas seulement dommage.** Trois décisions du PRD changent de nature une fois le flywheel restitué :

1. **Le certificat cesse d'être une fonctionnalité de fin de parcours** pour devenir le premier maillon du tour suivant (`§4.2` : « TÉMOIGNAGES + CERTIFICATS sur LinkedIn → nouveau trafic organique »). Le PRD a investi le plus gros de ses quatre correctifs du 29 août sur la vérification publique du certificat (`addendum.md §9`) sans jamais dire à quoi elle sert commercialement. UJ-1 s'achève sur le partage LinkedIn et le parcours s'arrête là ; dans les sources, c'est là qu'il boucle.
2. **La gratuité du contenu cesse d'être un coût et devient l'entrée du tunnel.** `BUSINESS_MODEL.md` LIGNE 3 lui donne un titre explicite : « **Rôle stratégique : moteur d'acquisition** ». Le moat n°2 de `prd.md §1` repose entièrement sur cette ligne, et le PRD ne lui accorde jamais le statut de ligne (voir §4.1 ci-dessous).
3. **Q-08 devient répondable.** On ne suspend pas symétriquement une ligne qui produit de la demande et une ligne qui la consomme.

**Correction recommandée.** Un encadré de dix à quinze lignes en `§3` ou en tête de `§5`, sans un seul chiffre : l'ordre des maillons, ce que chaque ligne prend à la précédente et donne à la suivante, et la phrase qui manque le plus — *la ligne Formations n'est pas 85 % du CA par accident de traction, elle est conçue comme le palier payant d'un escalier dont le contenu gratuit est la marche zéro.* Puis reformuler M-04 et Q-08 en conséquence.

### 2.2 Le plafond de livraison et la règle de recrutement — **perdu par accident, gravité haute**

C'est la perte la plus surprenante, parce que le PRD la réclame lui-même.

`prd.md` établit en UJ-4 que l'opérateur unique est « le paramètre de conception le plus déterminant du produit », en tire NFR-11 (« toute fonctionnalité nouvelle arrive avec son coût en minutes par semaine »), puis reconnaît que **aucune des exigences de la Partie B ne porte ce chiffrage** et que la NFR est « violée par le document lui-même ».

Or les sources contiennent exactement les chiffres manquants, pour la ligne la plus consommatrice de temps humain :

| Fait | Source |
|---|---|
| 8 à 14 heures par mise en place TPE | `BUSINESS_MODEL.md` LIGNE 11 › Unit Economics |
| Capacité solo **3 à 4 mises en place / mois** — « LE facteur limitant du modèle » | idem |
| `AGENCY_SETUPS_PER_OPERATOR_MONTH = 4` avec commentaire « CONTRAINTE STRUCTURELLE DU MODÈLE SETUP-FIRST : chaque franc de revenu exige une nouvelle livraison. La capacité se compte en MISES EN PLACE, pas en abonnés » | `finance/model.py` §1 |
| Déclencheur de recrutement : **carnet > 4 mises en place/mois deux mois d'affilée → assistant delivery à 300–400 k FCFA/mois** | `BUSINESS_MODEL.md` LIGNE 11 › Décision de capacité |
| Plafond de la ligne à ~20 M XOF/an en solo | idem › Risque principal |
| Plafond comparable de la ligne Consulting : 8 sessions/mois, 7,2 M XOF/an | `BUSINESS_MODEL.md` LIGNE 5 › Unit Economics |

Rien de tout cela n'est une projection de marché : ce sont des **bornes de capacité**, du même ordre que « 19 écrans d'administration » ou « 23 espaces de noms ». Elles relèvent du PRD au même titre.

**Pourquoi c'est coûteux.** La ligne 11 est la seule dont le revenu est proportionnel à des heures humaines. Le PRD la décrit par FR-046 à FR-052 comme si elle était logicielle. Un lecteur externe en déduira qu'elle scale ; elle ne scale pas, et la source dit précisément à quel palier elle casse. Par ailleurs D-01 et D-02 discutent longuement de la solvabilité et du recouvrement de cette ligne **sans jamais poser sa contrainte de production**, qui est pourtant celle qui décide combien de clients il est possible d'avoir.

**Correction recommandée.** Une NFR-14 « Capacité de livraison », ou un durcissement de NFR-11 portant la borne 3–4 mises en place/mois et son déclencheur de recrutement. C'est aussi le moyen le plus économique de rendre NFR-11 non décorative : au moins une exigence porterait enfin son coût.

### 2.3 Le plafond de catalogue de la ligne principale — **perdu par accident, gravité haute**

`BUSINESS_MODEL.md` LIGNE 1 › Modèle de revenus, écrit noir sur blanc :

> *Risque principal :* Plafond de revenus si le catalogue ne s'élargit pas (**5 cours = marché fini**)
> *Fallback :* Passer à un modèle All-Access Pass si le catalogue atteint 10+ cours

Le registre des risques du PRD (R-01 à R-13) ne contient pas ce risque. R-01 porte sur le **prix** de la formation, pas sur la **profondeur du catalogue**. Or :

- la ligne concernée porte `[À SOURCER]` ~85 % du chiffre d'affaires ;
- le catalogue compte cinq formations (`BUSINESS_MODEL.md` LIGNE 1 › Catalogue actuel, `BUSINESS_PLAN.md §4.1`) — un fait vérifiable, pas une projection ;
- le modèle financier suppose **1,10 à 1,40 cours par acheteur et par an** (`finance/hypotheses.csv`, driver « Cours / acheteur / an ») — c'est-à-dire du réachat, qui exige un catalogue plus profond que ce que l'acheteur a déjà épuisé ;
- le PRD ne dit nulle part combien de formations existent.

Un lecteur externe à qui l'on présente une ligne à 85 % du CA posera cette question en troisième, après le chiffre d'affaires et la traction. Le document n'a pas de réponse.

**Correction recommandée.** Un risque R-14 « Profondeur de catalogue », adossé au fait vérifiable (n formations publiées), et une mention du seuil de bascule vers un accès global que la source fixe à 10+ cours. Ne pas importer le prix de 399 000 FCFA de l'All-Access Pass : c'est une recommandation tarifaire non validée, et elle tombe sous la règle du §2.2 du PRD.

### 2.4 Les principes de packaging de la ligne TPE — **perdu par accident, gravité moyenne à haute**

`BUSINESS_MODEL.md` LIGNE 11 › « Principes appliqués » et « Red lines » contient huit règles. Le PRD n'en reprend qu'une (l'existence d'un prix plancher, FR-047) et laisse tomber les sept autres. Trois d'entre elles sont du matériau de PRD, pas de contrat commercial :

**a) « Commerce 360 : annoncer le total ET la décomposition — cacher les 2,1 M détruit la confiance »** (principe n°4).
C'est la réponse que le PRD cherche en FR-079. FR-079 pose l'écart d'ancrage comme un problème ouvert (« la réponse appartient à la page, pas au closing ») et le tag `[HYPOTHÈSE]`, alors que la source **a déjà tranché**, dans le même sens, et pour une raison énoncée. Le PRD rouvre une question résolue sans citer la résolution.

**b) « Toute option achetée est déduite du prix d'un pack souscrit sous 60 jours »** (principe n°3).
C'est une mécanique tarifaire à effet produit direct : elle porte sur le devis (FR-049), sur la grille en source unique (FR-047) et sur la fenêtre d'expiration des devis (FR-052, qui purge sans qu'on sache selon quel délai ni s'il coïncide avec ces 60 jours). Absente du PRD.

**c) « Validation humaine obligatoire avant publication »** et **« Domaine et comptes créés au nom du client — aucune rétention d'actif »** (red lines).
La première est une invariante de conception pour une ligne dont la production de contenu est automatisée (n8n + Paperclip), et elle est de la même famille que NFR-11. La seconde est un principe de confiance qui a des conséquences techniques (propriété des accès Google, du domaine, des comptes Meta). Aucune des deux n'est au document.

**Écarté à raison, en revanche :** « ne jamais facturer à l'heure », « ne jamais vendre SEO ou Analytics en ligne isolée », « aucune remise sur la mise en place », « 60 % à la commande, 40 % avant mise en ligne ». Ce sont des règles commerciales, et l'addendum §10 a raison de renvoyer aux documents contractuels — **sauf** que le 60/40 conditionne l'existence même d'un paiement en deux temps, que ni FR-016 ni FR-049 ne prévoient. À vérifier séparément.

### 2.5 Le problème client — **perdu par accident, gravité moyenne**

`BUSINESS_PLAN.md §2.2` énonce quatre problèmes : offre de formation fragmentée et **souvent en anglais**, déconnectée des réalités locales (paiement, budgets, cas d'usage) ; déficit de compétences ; **contenus théoriques sans mise en pratique ni accompagnement** ; peu d'acteurs combinant formation + communauté + outil.

Le PRD n'a pas de section « problème ». Son §2 est un état de la donnée de marché, ce qui est autre chose : il établit des faits de contexte (mobile money, coût de la donnée, appareils) sans jamais dire ce qui ne va pas pour le client aujourd'hui. Pour un document destiné à un investisseur, c'est un manque structurel : on lit ce que le produit fait, jamais contre quoi il se bat.

Deux conséquences concrètes :

- **Le bilinguisme perd sa raison d'être.** Le PRD consacre FR-064 à FR-067, NFR-06, FR-090, FR-091, FR-096 et FR-100 au FR/EN — c'est le sujet le plus lourd du document en nombre d'exigences — sans jamais dire pourquoi. La source le dit : l'offre concurrente est « souvent en anglais » et la diaspora est une cible. Le lecteur externe voit un coût d'ingénierie sans justification.
- **Le format pédagogique disparaît** (voir §2.6).

**Correction recommandée.** Quatre à six lignes en tête du §2, reprenant les quatre problèmes sans les chiffrer. Aucun n'est un chiffre de marché ; ce sont des observations qualitatives, et elles sont exactement le genre de matériau que le §2.2 du PRD n'interdit pas.

### 2.6 Le format « actionnable » — quiz et missions, **vérifié dans le code, absent du PRD**

`BUSINESS_PLAN.md §2.3` : « modules → leçons **vidéo/texte/quiz/missions** ». `BUSINESS_MODEL.md §7.1` marque « Quiz interactif — **Fait** » et « Missions dans CoursePlayer — **Fait** ».

Vérifié dans le dépôt :
- `src/types/index.ts:206` — `type: 'video' | 'text' | 'quiz' | 'resource' | 'mission'`
- `src/pages/lms/CoursePlayer.tsx:171` — `QuizRenderer`, `:275` — `MissionRenderer`, câblés aux lignes 548 et 554
- `src/pages/admin/AdminMissions.tsx` — un écran d'administration dédié, l'un des **19** que FR-057 dénombre

Le PRD FR-014 décrit le catalogue comme « des formations en modules et leçons, avec prix, prix promotionnel optionnel et ressources attachées ». FR-022 parle de progression leçon par leçon. **Les cinq types de leçon n'apparaissent nulle part**, et l'un des 19 écrans d'administration comptés en FR-057 n'est expliqué par aucune exigence.

C'est doublement une perte : c'est un manque factuel en Partie A (une capacité livrée non décrite, dans un document qui se veut la description du produit livré), et c'est la disparition du seul élément qui répond au problème « contenus théoriques sans mise en pratique » du `§2.2` de `BUSINESS_PLAN.md`. La promesse « actionnable, sans blabla » (`BUSINESS_PLAN.md §3` › Proposition de valeur) n'a plus de support matériel dans le PRD.

### 2.7 L'intuition « achat unique parce que l'abonnement intimide » — **contradiction avec la Partie B**

`BUSINESS_MODEL.md` LIGNE 1 › Modèle de revenus recommandé justifie l'achat unique ainsi :

> La cible a un pouvoir d'achat limité — **un achat unique est moins intimidant qu'un abonnement**

Le PRD propose en Partie B deux exigences qui poussent dans l'autre sens : FR-073 (paiement fractionné) et surtout FR-074 (cadrer le tarif du Club « au mois autant qu'à l'année », avec l'hypothèse que « mensualisé, le montant relève de l'achat impulsif »). Ces deux propositions sont défendables, mais elles **contredisent frontalement une intuition client explicite de la source**, et le PRD ne le sait pas. Deux hypothèses opposées sur le même client cohabitent dans le corpus sans être confrontées.

**Correction recommandée.** Une phrase dans l'index des hypothèses (§13) : *l'hypothèse de FR-074 (le cadrage mensuel améliore la conversion) contredit l'hypothèse de packaging de `BUSINESS_MODEL.md` LIGNE 1 (l'abonnement intimide plus que l'achat unique). Les deux sont non validées ; FR-072 doit trancher.* C'est un ajout de trois lignes qui rend le document honnête sur un désaccord interne au corpus.

---

## 3. Personas — cinq dans la source, quatre parcours au PRD

### 3.1 La correspondance

`BUSINESS_PLAN.md §5.2` décrit cinq personas ; `prd.md §4` décrit quatre parcours. Les deux ensembles ne se recouvrent que partiellement, et surtout **ils ne mesurent pas la même chose** : les personas de la source sont cinq segments de *demande d'apprentissage* ; les parcours du PRD sont quatre *rôles fonctionnels* (acheteur, membre, prospect TPE, opérateur).

| Persona `BUSINESS_PLAN.md §5.2` | Sort dans le PRD |
|---|---|
| **L'entrepreneur pressé** — dirige une TPE, veut des clients en ligne | Partiellement absorbé par UJ-3 (Fatou), mais Fatou **achète une prestation, pas une formation**. Le dirigeant de TPE qui vient *se former* a disparu |
| **Le créateur / personal brander** | **Absent.** Or « Personal Branding » est une formation du catalogue à 95 000 FCFA — c'est-à-dire **le plancher de la fourchette que le PRD cite en FR-014 et en R-01** |
| **Le marketer en poste** | Couvert par UJ-1 (Aïssatou, chargée de communication en PME) — le plus proche des cinq |
| **La PME en transformation** | **Absent** — écarté à raison, c'est la graine du B2B que le PRD exclut en §10 et renvoie à R-10 |
| **L'étudiant pro** — cherche l'employabilité, veut certification + réseau | **Absent, et c'est la perte** — voir 3.2 |

### 3.2 L'étudiant pro : la fonctionnalité la plus travaillée n'a plus d'utilisateur

Le persona « étudiant pro » est celui dont le besoin est *certification + réseau*. Il est le seul à justifier :

- **FR-024 / FR-025** — l'émission et la vérification publique du certificat, qui est le plus lourd des quatre correctifs produit du 29 août (`addendum.md §9` : miroir `certificate_lookups`, backfill idempotent, quatre tests de règles) ;
- **FR-031** — l'onglet « opportunités » du Club, qui `BUSINESS_PLAN.md §4.2` décrit comme « missions/emplois/partenariats postés par les membres » ;
- **M-03** — la contre-métrique « certificats émis sans progression substantielle », dont le PRD dit qu'elle protège la valeur du certificat « sur le marché du travail ».

Le PRD dépense donc un effort d'ingénierie considérable, et une contre-métrique de premier rang, au bénéfice d'un utilisateur qui n'existe dans aucun de ses quatre parcours. Symétriquement, l'onglet « opportunités » n'a aucun demandeur dans le document.

**Correction recommandée.** Ne pas ajouter un cinquième parcours narratif — le PRD a raison de limiter la narration à quatre, et Q-01 dit déjà que les quatre existants ne sont pas validés. Ajouter deux lignes à UJ-1 ou à FR-025 nommant l'usage attendu du certificat (employabilité, preuve auprès d'un employeur ou d'un client), et faire de même pour l'onglet opportunités en FR-031. Le PRD gagne un « pour qui » sans gagner une section.

### 3.3 La diaspora — une affirmation du PRD à corriger

FR-075 demande d'« ouvrir l'évaluation du segment diaspora, **absent du produit comme de la stratégie** ».

La seconde moitié est fausse. La diaspora est un segment stratégique déclaré dans les sources, à trois endroits :
- `BUSINESS_PLAN.md` en-tête : « Marché : Afrique francophone (SN, CI, CM) **+ diaspora & France** » ;
- `§3` Business Model Canvas › Segments clients : « Géo : Sénégal (cœur), Côte d'Ivoire, Cameroun, **diaspora & France** » ;
- `§5.1` : le TAM et le SAM sont tous deux définis « + diaspora ».

Le segment est absent **du produit**, ce qui est le constat utile, et présent dans la stratégie écrite. La formulation actuelle donne à croire que personne n'y a jamais pensé, alors que le corpus le désigne comme cible depuis juin. À corriger en une phrase — c'est de surcroît le segment que le PRD lui-même qualifie de « probablement le plus solvable », donc la nuance compte pour un lecteur externe.

### 3.4 Le Cameroun a disparu sans décision

| Document | Géographie |
|---|---|
| `BUSINESS_PLAN.md` en-tête et `§3` | Sénégal, Côte d'Ivoire, **Cameroun**, diaspora & France |
| `BUSINESS_PLAN.md §7.2` | « An 4–5 — Échelle : expansion **CI/Cameroun** » |
| `BUSINESS_MODEL.md §6.2` M9 | « Expansion **Côte d'Ivoire + Cameroun** » |
| `BUSINESS_MODEL.md` LIGNE 11 › Audience cible | Dakar, Abidjan, **Cotonou** |
| `prd.md §2.1` et `§10` | « les trois capitales visées » = Sénégal, Côte d'Ivoire, **Bénin** |

Le PRD hérite du triptyque de la ligne 11 (Bénin) et l'applique à tout le produit, puis interdit en `§10` « l'ouverture de nouveaux pays au-delà des trois capitales déjà visées » — ce qui **interdit rétroactivement l'expansion vers le Cameroun** que les deux sources planifient. Ce n'est peut-être pas une erreur : le Bénin est le marché de l'offre TPE, le Cameroun celui du LMS, et les deux lignes peuvent légitimement viser des pays différents. Mais le document tranche par omission une question qu'il n'a pas posée. Une phrase suffit : dire que la géographie est propre à chaque ligne, ou que le Cameroun est écarté et pourquoi.

### 3.5 Le salaire de référence — une incohérence interne au PRD

R-01 et FR-072 comparent le prix des formations « au salaire moyen sénégalais », en soulignant que les deux estimations publiques divergent de 63 %.

`BUSINESS_MODEL.md` LIGNE 1 › Stratégie de pricing, principe n°3, compare autre chose : « salaire moyen **cible** = 150 K–500 K XOF/mois. Un cours à 99 K = 20–66 % du salaire ».

Le PRD compare le prix au salaire médian **national** ; la source le compare au salaire du **segment visé**. Or les personas du PRD lui-même — une chargée de communication en PME dakaroise, un freelance growth abidjanais — ne sont pas des salariés médians. Le cadrage du PRD rend le prix plus choquant qu'il ne l'est peut-être, en contradiction avec ses propres UJ-1 et UJ-2. Les deux référentiels sont non sourcés ; le PRD devrait au minimum dire lequel il emploie et pourquoi, sans quoi R-01 mesure une chose et le produit en vise une autre.

---

## 4. Onze lignes contre cinq — le découpage est-il le bon ?

`addendum.md §10` énonce le découpage :

> **Onze lignes de service** sont décrites dans `BUSINESS_MODEL.md`. Cinq seulement sont implémentées et monétisées ; le PRD ne traite que celles-là. Les six autres (consulting, certifications premium, B2B, produits digitaux, affiliation, contenu sponsorisé) relèvent de la stratégie, pas de la spécification.

**Le principe est bon. L'arithmétique est fausse, et deux des « six autres » sont en réalité dans le code.**

### 4.1 L'arithmétique

Les onze lignes de `BUSINESS_MODEL.md` sont : 1 E-Learning · 2 Club · **3 Média / contenu gratuit** · 4 Rysmo · 5 Consulting · 6 Certifications · 7 B2B · 8 Produits digitaux · 9 Parrainage · 10 Contenu sponsorisé · 11 Agence « Digital Commerce Local ».

Les cinq du PRD sont : Formations (=1) · Club (=2) · Rysmo (=4) · Présence Digitale (=11) · **Max-Morrys Agency**.

Deux décalages :

- **Max-Morrys Agency n'est pas une des onze.** La landing `/agence` high-ticket date du 13 août 2026, quatre mois après `BUSINESS_MODEL.md`. C'est une douzième ligne, née après le document source. L'addendum la compte pourtant implicitement comme un sous-ensemble des onze.
- **La ligne 3 n'est ni dans les cinq, ni dans les six.** Elle s'évapore. Or elle est intégralement implémentée (FR-001 à FR-008 : quatre familles de contenu, RSS, plan de site, données structurées, six pop-ups à groupe témoin, newsletter à consentement) et c'est **le socle du moat n°2 de `prd.md §1`**.

Le PRD a raison de ne pas la compter parmi les lignes **monétisées** — `BUSINESS_MODEL.md` LIGNE 3 la définit elle-même comme « Gratuit — lead generation engine ». Mais l'exclure du modèle économique du document est précisément ce qui a fait disparaître le flywheel (§2.1) : si la seule ligne qui produit de la demande n'est pas une ligne, il n'y a plus de circulation à décrire.

**Correction recommandée.** Reformuler `addendum.md §10` et l'entrée « Ligne » du glossaire (`prd.md §12`) : cinq lignes **monétisées**, plus une ligne **d'acquisition non monétisée** dont dépendent les cinq autres. Le glossaire dit aujourd'hui « Il y en a cinq » ; le corriger en « cinq monétisées, une d'acquisition » coûte six mots et rend M-07 (trafic organique / concentration du canal) lisible.

### 4.2 Deux des « six autres » sont dans le code — **vérifié**

**a) « Affiliation » (LIGNE 9) est implémentée, des deux côtés.**

`functions/src/referrals.ts` contient un déclencheur `onReferralConversion` sur `club_subscriptions/{uid}` qui, à l'activation de l'abonnement d'un filleul :
- crédite le parrain de `REFERRER_XP = 100` points d'expérience,
- lui attribue le badge `ambassadeur`,
- écrit un document dans la collection `referrals` (`referrerId`, `refereeId`, `status: 'converted'`),
- marque `referralRewarded` sur le filleul pour garantir l'idempotence.

Côté client, `src/lib/firestore/users.ts` expose `getOrCreateReferralCode()` et `getMyReferrals()`, et `src/lib/club/pricing.ts` porte `CLUB_REFERRAL_DISCOUNT = 0.15`. Le Club a un onglet « parrainage » (FR-031).

Le PRD n'en décrit que la moitié : **FR-020 ne mentionne que la remise au filleul.** La contrepartie du parrain — une Cloud Function, une collection, un badge, un déclencheur — n'existe dans aucune exigence, et l'addendum classe la ligne parmi celles qui « relèvent de la stratégie, pas de la spécification ».

Deux observations qui valent d'être écrites, au-delà de la correction factuelle :
- **La récompense du parrain est non monétaire** (XP + badge), là où `BUSINESS_MODEL.md` LIGNE 9 prescrit « 10 % de crédit pour le parrain ». Le produit a choisi la gamification contre la commission — un arbitrage réel, jamais consigné.
- **La boucle ne se déclenche que sur une souscription au Club**, pas sur un achat de formation. Le levier viral est donc branché sur la plus petite des lignes, pas sur celle qui porte 85 % du CA. C'est une observation de conception de premier ordre, et elle n'est nulle part.

**b) « Consulting » (LIGNE 5) a sa surface d'administration.**

`src/pages/admin/AdminAppointments.tsx` existe et compte parmi les **19** écrans de FR-057 ; `src/types/index.ts:271` définit `Appointment`. FR-010 cite d'ailleurs « rendez-vous » comme l'un des cinq écrans ouverts au rôle `support`. Mais **aucune exigence ne dit ce qu'est un rendez-vous ni à quoi il sert**. Le PRD compte un écran qu'il n'explique pas, pour une ligne de service qu'il déclare hors de son périmètre.

`BUSINESS_MODEL.md` LIGNE 5 est explicite : « Statut : partiellement construit — pas de paiement, pas de calendrier, pas de visioconférence. **Gap : pas de monétisation implémentée.** »

**Correction recommandée.** Une phrase en FR-057 ou une FR dédiée décrivant la prise de rendez-vous comme une capacité livrée non monétisée. C'est deux lignes, et cela ferme un trou que tout relecteur factuel rouvrira.

### 4.3 Une ligne non implémentée mérite-t-elle d'y figurer ?

**Non — sauf une, et pas comme ligne.** Consulting, certifications premium, B2B, produits digitaux, contenu sponsorisé sont correctement écartés : ce sont des offres à concevoir, sans code, et le PRD a raison de refuser de spécifier ce qui n'est pas décidé. R-10 mentionne d'ailleurs déjà le B2B comme piste à évaluer, ce qui est le bon niveau de traitement.

L'exception est **le mini-cours gratuit / le palier d'entrée bas**, et elle n'est pas une ligne mais un palier de la ligne 1 :

`BUSINESS_MODEL.md` LIGNE 1 › Stratégie de pricing prescrit une grille à six paliers dont les deux premiers n'existent pas au catalogue :

| Palier prescrit | Prix | Existe ? |
|---|---|---|
| **Mini-cours (lead magnet)** | **Gratuit** | Non — FR-017 prévoit la mécanique d'inscription gratuite, aucun contenu ne l'utilise |
| **Cours Essentiel** | **49 000 – 79 000 FCFA** | Non — le plancher réel du catalogue est 95 000 |
| Cours Complet | 99 000 – 149 000 | Oui |
| Cours Premium | 149 000 – 249 000 | Oui (200 000 max) |
| Bundle 3 cours | 249 000 | Non |
| All-Access Pass | 399 000 ou 29 900/mois | Non, conditionné à 10+ cours |

`BUSINESS_MODEL.md §4.3` étape 3 fait du palier bas le mécanisme central : « Premier achat : cours d'entrée à 49 000 – 79 000 XOF, ou mini-cours gratuit — **objectif : briser la barrière du premier paiement** ». `BUSINESS_PLAN.md §7.2` inscrit « 2 mini-cours gratuits (lead magnets) » dans les leviers de l'An 1.

**C'est la réponse des sources au problème que le PRD nomme R-01.** Le PRD y répond par FR-072 (tester le prix) et FR-073 (fractionner le paiement) — deux réponses qui portent sur le **paiement** d'un prix inchangé. La source répond par la **structure de gamme** : créer une marche que l'acheteur peut monter. Les deux approches sont compatibles ; l'absence complète de la seconde est une perte, d'autant qu'elle est la moins coûteuse à produire et la seule qui alimente le flywheel (le mini-cours gratuit est le point de bascule contenu → compte).

**Correction recommandée.** Une exigence de Partie B, à côté de FR-072/FR-073 : évaluer un palier d'entrée (gratuit ou sous 80 000 FCFA) comme réponse structurelle au seuil d'investissement. Sans prix retenu — le PRD ne doit pas importer la fourchette 49–79 K, qui est une recommandation non validée. Mais le **principe** de gamme, lui, doit survivre.

---

## 5. Unit economics — l'omission est bonne, l'absence de mesure ne l'est pas

### 5.1 Les sources se contredisent entre elles, d'un facteur 5

| Indicateur | `BUSINESS_MODEL.md` LIGNE 1 | `BUSINESS_PLAN.md §8` | Écart |
|---|--:|--:|--:|
| ASP / ARPU formation | 110 000 | 125 000 | 1,14× |
| CAC | **8 000** (pondéré 70/30) | **40 000** (An 2) | **5×** |
| LTV | 150 000 (1 an) | 142 000 (brut) | ≈ |
| Marge brute | 87 % | 91,5 % | 4,5 pts |
| **LTV / CAC** | **18,7×** | **3,5×** | **5,3×** |

Deux documents internes, la même société, la même année, un rapport de 1 à 5 sur la métrique que tout investisseur regarde en premier. **Le PRD a entièrement raison de n'en reprendre aucun.** C'est même le meilleur exemple qu'on puisse donner de la règle du §2.2 : ces nombres ne sont pas seulement non sourcés, ils sont mutuellement destructeurs.

### 5.2 Mais le PRD ne mesure pas ce qu'il refuse d'affirmer

Le moat n°2 de `prd.md §1` est : « une distribution propriétaire gratuite qui **supprimerait le coût d'acquisition payé** ». Le PRD le tague `[HYPOTHÈSE]` et renvoie à FR-069 et M-07.

Or **aucune des onze métriques ne mesure un coût d'acquisition ni une valeur vie client.** M-07 mesure le trafic organique et la concentration du canal ; M-02 mesure la conversion. Ni l'un ni l'autre ne dit combien coûte un acheteur ni combien il rapporte. Le document affirme donc que son avantage principal est économique, et n'installe aucun instrument capable de le confirmer ou de l'infirmer.

Deux faits aggravent le point :
- les sources **ne prétendent pas** que le CAC est nul : `BUSINESS_MODEL.md` LIGNE 1 donne un CAC organique de 5 000 FCFA (temps de production de contenu amorti) et §5.1 alloue 20 % de l'effort au payant, avec un budget Meta Ads de 200 à 500 K/mois ;
- `finance/model.py` fixe `mkt_pct = 0.18` avec un plancher, c'est-à-dire **18 % du chiffre d'affaires en marketing** sur les trois scénarios.

Le PRD a donc durci une source qui budgétait un coût d'acquisition, en un moat fondé sur son absence.

**Correction recommandée — et c'est le point le plus important de cette section.** Ne pas importer un seul chiffre. Ajouter **deux métriques appariées** au §8, formulées comme les autres, sans valeur cible :

- *Coût d'acquisition par acheteur, ventilé organique / payé* ⇄ contre-métrique : *part du volume dépendant d'un canal payé*. Justification : c'est la seule mesure capable de valider ou de tuer le moat n°2.
- *Valeur cumulée par acheteur sur douze mois, toutes lignes confondues* ⇄ contre-métrique : *marge brute par ligne, heures humaines incluses*. Justification : M-04 suit « le revenu par ligne » ; sans marge, il compare une ligne à 96 % de marge servie à la main (§2.2) à une ligne logicielle, comme si elles étaient de même nature.

C'est cohérent avec la doctrine du PRD : il s'interdit d'*affirmer*, pas de *mesurer*.

### 5.3 Trois faits chiffrés qui ne sont ni des projections ni des données de marché

Le filtre du PRD (« aucun chiffre de marché ni de projection non sourcé ») a emporté au passage des faits qui n'appartiennent à aucune de ces deux catégories :

| Fait | Source | Nature | Pourquoi il relève du PRD |
|---|---|---|---|
| **Commission Bictorys 3 %** des encaissements | `BUSINESS_PLAN.md §10`, `finance/hypotheses.csv` | Taux contractuel | C'est le seul coût variable connu et certain de tout le produit. M-04 (revenu par ligne) et M-05 (coût IA) tournent autour sans jamais le nommer |
| **Garantie satisfait ou remboursé, 14 jours, sans condition** | `BUSINESS_PLAN.md §2.3` et `§4.1` | Engagement contractuel **affiché en production** | Voir 5.4 — c'est la plus grosse omission de cette catégorie |
| **IS Sénégal 30 %** ; TVA sur services numériques non tranchée | `BUSINESS_PLAN.md §10` ; `BUSINESS_MODEL.md §6.3` | Obligation fiscale | La TVA, si elle s'applique, traverse tous les miroirs de prix (NFR-01, `addendum.md §2`) et toute la grille TPE |

### 5.4 La garantie 14 jours — **perdu par accident, gravité haute, vérifié en production**

`BUSINESS_PLAN.md §4.1` : « Garantie satisfait/remboursé 14 j ». `§2.3` la range parmi les composantes de l'offre « Je te forme ».

Vérifié dans le dépôt — **elle est affichée aux acheteurs** :
- `src/i18n/locales/fr/formations.json:103` — `"guaranteeShort": "Accès à vie · Garantie satisfait 14 jours"`
- `src/i18n/locales/fr/formations.json:123` — `"guaranteeBanner": "Garantie satisfait ou remboursé pendant 14 jours — sans condition."`
- `src/lib/mockData.ts:414` — une entrée de FAQ : « vous disposez de 14 jours après l'achat pour demander un remboursement […] Aucune question posée »
- `src/i18n/locales/fr/admin.json` — l'administration porte `refundAction` (« Rembourser »), `statusRefunded`, `filterRefunded`, `statRefunds`

**Le PRD n'en dit pas un mot.** Ni FR, ni NFR, ni risque, ni entrée au glossaire. Et pourtant :

- **M-02** a pour contre-métrique « **taux de remboursement et de litige** » — une métrique qui présuppose une politique de remboursement que le document ne spécifie jamais ;
- **FR-021** décrit la réconciliation des transactions côté administration sans mentionner le remboursement, alors que l'écran l'implémente ;
- **FR-024** émet le certificat à 100 % de progression. Rien n'articule les deux : un acheteur peut terminer une formation, obtenir un certificat public et vérifiable (FR-025), et demander un remboursement sans condition dans les quatorze jours. Le PRD ne pose pas la question ;
- c'est un **texte contractuel affiché**, donc soumis à la même discipline que les CGV en NFR-01 — la discipline que tout le document construit après l'épisode du tarif du Club à 10 000 contre 19 900 (`addendum.md §2`).

**Correction recommandée.** Une exigence en Partie A décrivant la garantie telle qu'elle est affichée et le geste d'administration qui la sert, et une ligne en NFR-01 rangeant la durée de garantie parmi les valeurs contractuelles à miroir. Puis une question ouverte sur l'articulation certificat / remboursement.

---

## 6. KPI — ce qui a disparu, ce qui a été ajouté

### 6.1 Ce que le PRD a ajouté, et qui vaut mieux que la source

À dire d'emblée, parce que le bilan net est favorable au PRD : **les onze contre-métriques de `§8` n'ont aucun équivalent dans les sources.** Les KPI de `BUSINESS_MODEL.md §5.2` sont un tableau de bord de vanité (MAU, trafic, DAU/MAU, K-factor, NPS, streak moyen) avec des cibles M3/M6/M12 posées sans base. Le passage à des couples métrique / contre-métrique est une amélioration méthodologique franche, et le refus de fixer des cibles tant que FR-068 à FR-071 et FR-093 n'ont pas tourné est la bonne décision.

Deux ajouts sont particulièrement justes et méritent d'être défendus s'ils sont contestés : M-05 (coût IA par membre actif **et sa dispersion**) et M-09 (activité du quartile inférieur du classement).

### 6.2 Ce qui a disparu et devait disparaître

Les cibles de complétion de `BUSINESS_MODEL.md §5.2` › KPIs de rétention — **95 % à M3, 96 % à M6, 97 % à M12** — sont la même invention que le « 98 % » que D-03 met à l'index. C'est un point que D-03 ne dit pas et devrait dire : **le chiffre non sourcé n'est pas seulement affiché en façade, il est porteur dans le tableau de bord de pilotage.** Le retirer du site (FR-069, Q-07) sans retirer les cibles qui en dérivent laisserait l'opérateur piloter sur la même fiction.

Disparaissent également à raison : NPS, DAU/MAU, streak moyen, MAU, « revenu mensuel total » à cibles inventées.

### 6.3 Ce qui a disparu et manque

| KPI source | Où | Pourquoi il manque |
|---|---|---|
| **Taux de conversion pack → accompagnement à J+30, cible ≥ 40 %** | `BUSINESS_MODEL.md` LIGNE 11 : « **LE KPI de la ligne** », « le seul KPI à surveiller chaque mois sur cette ligne » ; `finance/hypotheses.csv` le marque littéralement « (KPI) » | **La plus nette des disparitions.** La source désigne un indicateur unique comme le pouls d'une ligne entière, et le PRD lui substitue M-08 « prospects TPE qualifiés ⇄ taux de recouvrement ». Or la conversion en accompagnement est ce qui décide si la ligne 11 est un métier de prestation plafonné par les heures (§2.2) ou un métier récurrent. C'est aussi la variable qui rend D-01 et D-02 décidables : sans elle, on discute de la solvabilité d'un revenu dont on ne sait pas s'il existe |
| **Part du CA récurrent (> 25 %)** | `BUSINESS_PLAN.md §15` (jalon) et `§17` (recommandation n°2 : « augmenter la part de récurrent au-delà de 25 % pour stabiliser trésorerie et valorisation ») | C'est un **objectif stratégique explicite**, et il est la réponse au risque que M-04 mesure. M-04 constate la concentration ; rien ne suit la sortie de cette concentration. Le seuil de 25 % est une cible, donc à ne pas importer — mais la métrique « part du revenu récurrent » est une mesure, pas une projection |
| **CAC, LTV, ratio LTV/CAC** | `BUSINESS_PLAN.md §8` et `§15` ; `BUSINESS_MODEL.md` LIGNE 1 | Voir §5.2 |
| **Panier moyen et multi-achat (cours par acheteur et par an)** | `BUSINESS_PLAN.md §15` ; driver `finance/hypotheses.csv` | Le multi-achat est la mesure du plafond de catalogue (§2.3). Sans lui, R-14 serait invérifiable |
| **Taux de parrainage et boucle virale** | `BUSINESS_MODEL.md §5.2` › viralité ; LIGNE 9 | La boucle est implémentée (§4.2 a) et rien ne la mesure. Ni M-07 ni aucun autre couple ne voit le canal « un client en amène un » |
| **Churn / rétention 6 et 12 mois** | `BUSINESS_PLAN.md §15` | **Partiellement conservé** : M-01 porte le renouvellement du Club à 12 mois et le PRD a raison d'en faire la métrique de survie. Reste que la rétention à 6 mois de Rysmo+ (durée moyenne d'abonnement, driver du modèle) n'a pas d'équivalent : M-05 mesure l'usage et le coût, pas la durée de vie de l'abonnement |

**Correction recommandée.** Trois ajouts au §8, dans le format existant : la conversion pack → accompagnement à J+30 (en remplacement ou en complément de M-08), la part du revenu récurrent, et le couple CAC/valeur de §5.2. Aucune cible chiffrée. Cinq lignes de tableau.

---

## 7. Contradictions factuelles et chiffrées

### 7.1 `BUSINESS_PLAN.md` est périmé par rapport à sa propre source de vérité — **contradiction majeure**

`BUSINESS_PLAN.md` déclare en en-tête : « Modèle financier reproductible : `finance/model.py`. Tableaux exportés en CSV dans `finance/` ». Les deux ne concordent plus.

| Scénario Base | `BUSINESS_PLAN.md §1`, `§11`, `§12`, `§13` | `finance/scenarios_comparatif.csv` | Rapport |
|---|--:|--:|--:|
| CA An 1 | 18 006 875 | **48 169 875** | 2,67× |
| CA An 5 | 220 567 612 | **352 142 882** | 1,60× |
| Résultat net An 1 | 3 419 609 | **23 618 046** | 6,9× |
| Trésorerie fin An 5 | 172 100 410 | **447 042 580** | 2,60× |

**Cause identifiée.** `finance/model.py` et `finance/hypotheses.csv` intègrent la ligne 11 (Agence) avec dix pilotes dédiés — `ag_setups`, `ag_conv_rate`, `ag_360_share`, `ag_churn`, `ag_options_pct`, capacité, coût d'infra par client accompagné… — et `finance/revenus_par_flux_5ans.csv` porte quatre colonnes Agence. `BUSINESS_PLAN.md` (v2.0, juin 2026) est antérieur : son `§10` liste onze pilotes, **aucun pour l'Agence**, et ses tableaux `§11` à `§13` ne comptent que quatre flux.

**Conséquence pour le PRD.** `addendum.md §10` écrit : « Le modèle financier à cinq ans et les scénarios prudent / base / optimiste vivent dans `BUSINESS_PLAN.md` **et** `finance/model.py` », comme si les deux disaient la même chose. Ils divergent d'un facteur 2,7 sur l'année en cours. Le PRD n'a pas à arbitrer le modèle financier — mais il ne doit pas renvoyer un lecteur externe vers deux documents contradictoires sans le prévenir. **Une phrase : `finance/model.py` fait autorité ; les tableaux de `BUSINESS_PLAN.md §11–§13` sont antérieurs à la ligne 11 et périmés.**

### 7.2 Les sources ne s'accordent pas sur l'existence d'un chiffre d'affaires — **contradiction majeure**

| Affirmation | Source |
|---|---|
| « Point de départ : **pré-lancement (0 client en Année 1)** » | `BUSINESS_PLAN.md`, en-tête |
| « **Revenu cumulé revendiqué : 45 000 000 XOF (~68 700 USD)** » · « Étudiants inscrits : 1 486 » · « Le modèle fonctionne déjà et **génère 45 M XOF** » | `BUSINESS_MODEL.md §1` et LIGNE 1 › Modèle de revenus |

Le PRD attrape une partie du problème : D-03 relève l'écart « 50+ étudiants affichés vs 1 486 revendiqués ». Il ne relève **ni les 45 M XOF de revenu cumulé revendiqué, ni la prémisse pré-lancement**.

Pour un document dont `§0` prévient qu'« un lecteur externe doit savoir qu'il lit un PRD sans chiffre d'affaires », c'est le point le plus sensible du corpus : une source interne revendique 45 M XOF encaissés, une autre pose zéro client, et le PRD ne dit ni l'un ni l'autre. FR-093 demande d'extraire le chiffre réel — c'est la bonne réponse — mais D-03 doit inscrire le 45 M dans son tableau des chiffres à sourcer ou à retirer, au même titre que le 98 % et le +1 790 %. C'est **le seul chiffre du lot qui porte sur l'argent**.

### 7.3 Le Club a un palier mensuel dans la source, que le PRD réinvente en Partie B

`BUSINESS_MODEL.md` LIGNE 2 › Modèle de revenus prescrit **deux** paliers :

| Tier | Prix | Cible |
|---|---|---|
| Mensuel | **2 500 XOF/mois** | Découverte, engagement incertain |
| Annuel | 19 900 XOF/an (économie 33 %) | Membres engagés, rétention |

Le PRD (FR-030) ne connaît que l'annuel, et propose en FR-074 de « cadrer explicitement le tarif du Club au mois autant qu'à l'année (19 900/an ≈ 1 658/mois) ». Il réinvente donc, en Partie B et comme hypothèse à tester, un palier que la source spécifie depuis avril — à un prix différent (2 500 affiché contre 1 658 équivalent, soit 30 000/an contre 19 900, ce qui est précisément l'écart de 33 % que la source revendique).

**Et une synthèse manque, que le PRD est le seul à pouvoir faire.** D-02 établit que Wave ne prend pas en charge le prélèvement récurrent par API au Sénégal. Un **vrai** palier mensuel du Club est donc, aujourd'hui, **inconstruisible sur le rail dominant** — exactement pour la raison qui rend le MRR de la ligne 11 problématique. Le document possède les deux moitiés du raisonnement (FR-074 et D-02) et ne les rapproche jamais.

**Correction recommandée.** FR-074 doit citer le palier mensuel de la source, et distinguer explicitement le *cadrage* mensuel (une affaire de présentation, faisable) de la *facturation* mensuelle (bloquée par D-02).

### 7.4 Les quotas Rysmo ont été divisés par cinq sans que personne ne l'écrive

| | `BUSINESS_MODEL.md` LIGNE 4 (avril) | `prd.md` FR-040 (août) |
|---|---|---|
| Gratuit connecté | **10 / jour** | **2 / jour** |
| Membre du Club | **50 / jour** (« illimité effectivement ») | **5 / jour** |
| Palier autonome | « Illimité, 4 900 XOF/mois » | Lite 20/j à 3 000 · Pro 100/j à 7 500 |
| Limitation de débit | « 50 appels/h/user » (`§2.1`, `§7.1`) | **Aucune** (FR-043, comblée par FR-099) |

Le PRD est à jour et la source est périmée : ce n'est pas une erreur du PRD. Mais deux choses méritent d'être consignées :

- **le palier gratuit a été divisé par cinq** et le bonus Club par dix. C'est une décision de marge importante, cohérente avec NFR-10, et aucun document ne la porte ;
- le PRD a **raison contre la source** sur l'IA illimitée : `BUSINESS_MODEL.md` LIGNE 4 propose un palier « illimité à 4 900 XOF/mois », que NFR-10 interdit désormais. L'`addendum.md §5` argumente l'écart (« le coût est corrélé aux utilisateurs les plus engagés, c'est-à-dire précisément ceux qui ne partent pas »). **C'est un des meilleurs passages du corpus** et il faudrait qu'il soit visible depuis le PRD, pas seulement depuis l'addendum : il montre un arbitrage assumé contre une recommandation antérieure, ce qui est exactement ce qu'un lecteur externe cherche.

### 7.5 Deux risques des sources absents du registre du PRD

**a) Concentration sur un prestataire de paiement unique.**
`BUSINESS_MODEL.md §6.3` › Risques techniques : « **Bictorys downtime** : les paiements bloquent les inscriptions — Impact **critique** — Mitigation : monitoring des webhooks, **plan B (CinetPay ou Flutterwave)**, inscription manuelle admin en backup ». `BUSINESS_PLAN.md §16` et `§17` reco n°5 : « prévoir un PSP secondaire ».

Le PRD énonce la dépendance comme un fait (FR-015 : « Le paiement passe par Bictorys »), consacre NFR-13 à la portabilité de l'infrastructure entre **Firebase et Cloudflare**, et **ne classe nulle part la mono-dépendance de paiement comme un risque**. Or c'est le seul point du système par lequel passe la totalité du chiffre d'affaires des cinq lignes, sans alternative, sur un marché où D-02 établit déjà que les rails sont contraints. À noter que la mitigation « inscription manuelle admin » de la source **existe** : c'est FR-059 (« l'administration peut créer un compte et gérer une inscription, par traitement serveur authentifié »). Le PRD possède le filet de sécurité et ne dit pas qu'il en est un.

**b) « Certificat Max-Morrys ≠ diplôme d'État — communiquer clairement ».**
`BUSINESS_MODEL.md §6.3` › Risques réglementaires. Le PRD consacre FR-024, FR-025, un miroir public, quatre tests de règles et une contre-métrique (M-03) au certificat, et affirme en M-03 qu'un certificat facile « détruit sa valeur **sur le marché du travail** ». Il ne porte nulle part la mention distinctive. C'est une exigence d'affichage à coût quasi nul, sur une page publique, dans un pays où la certification professionnelle est réglementée — et elle est de la même famille que R-08 (l'objet social), que le PRD prend au sérieux.

**c) TVA sur les services numériques.**
Même section. Si elle s'applique, elle traverse tous les miroirs de prix décrits par `addendum.md §2` et le texte contractuel des CGV visé par NFR-01. À rattacher à R-08 et à FR-086 (« faire trancher par un conseil ») plutôt que d'en faire un risque distinct — une phrase suffit.

### 7.6 La newsletter collecte et n'envoie rien — **vérifié dans le code, gravité haute**

`BUSINESS_MODEL.md §4.2` › Goulots d'étranglement, premier de la liste : « Newsletter collecte mais n'envoie rien → À intégrer (Brevo) ». `§7.2` › Chantiers restants, **chantier n°1, priorité « Critique »** : « Intégration email Brevo — sync newsletter, séquences auto (bienvenue, abandon, hebdo) ». `§2.4` › Intégrations : service e-mail « **À intégrer** ». `BUSINESS_PLAN.md §7.1` place « inscription gratuite + newsletter » puis « Nurturing (**email**, défis, lives gratuits) » aux deux premières marches du tunnel.

Vérifié dans le dépôt, sur `src/`, `functions/src/`, `worker/src/`, `package.json` et `functions/package.json` : **aucune dépendance ni aucun appel d'envoi d'e-mail** (Brevo, SendGrid, Nodemailer, Resend, Mailgun, Postmark, SMTP). Le seul résultat est `src/lib/brand/clients.ts`, sans rapport. Tout ce que le PRD décrit comme « envoyé » écrit en réalité dans Firestore :

- `functions/src/notifications.ts` — les cinq types de notification écrivent dans `notifications/{userId}/items` (lignes 72, 89, 133, 167, 216) ;
- `functions/src/digest.ts` — le digest hebdomadaire du Club construit un titre et **écrit une notification applicative** (ligne 77) ; il n'est pas envoyé par e-mail.

Conséquences pour le PRD :

1. **FR-035 est trompeur.** « Un digest hebdomadaire est **envoyé** automatiquement » : il est *publié* dans le centre de notifications. La différence est celle entre atteindre un membre inactif depuis onze mois et ne pas l'atteindre — c'est-à-dire exactement le problème que le PRD pose en UJ-2 et prétend traiter par FR-076 et FR-077.
2. **UJ-1 repose sur une capacité inexistante.** « Elle revient une semaine après **par une newsletter** ». Le parcours qui porte la ligne à 85 % du CA passe par un canal que le produit ne possède pas.
3. **FR-006 collecte un consentement pour un envoi qui n'existe pas.** Le PRD est méticuleux sur ce genre de chose ailleurs — FR-011 signale que le réglage de notifications « est stocké mais n'est lu nulle part ». Le même défaut, à une échelle bien supérieure, n'est pas signalé.
4. **La Partie B ne demande nulle part cette capacité**, alors que la source la classe critique depuis avril et que trois exigences de Partie B (FR-076, FR-077 et le renouvellement du Club en général) supposent un canal sortant capable de toucher un membre qui n'ouvre plus l'application.

**Correction recommandée.** C'est le seul point de ce rapport qui appelle à la fois une correction de Partie A (FR-035, FR-006, et l'ajout d'une limite au même format que celles de FR-011 et FR-021), une correction de parcours (UJ-1), et une exigence de Partie B. Le PRD écrit en `§0` que son absence de chiffres de traction « n'est pas une position méthodologique : c'est un trou » ; le canal e-mail est le second trou de cette nature, et il est structurel.

---

## 8. Écarté à raison — à ne pas rouvrir

Cette section existe pour qu'un relecteur ultérieur ne réintroduise pas ce qui a été retiré délibérément et correctement.

**8.1 Tous les chiffres de marché et toutes les projections financières.** SAM de 300 000–500 000 personnes (`BUSINESS_PLAN.md §5.1`), TAM « plusieurs millions », SOM 3 000–6 000 clients, les trois scénarios à cinq ans, les P&L, les plans de trésorerie, les jalons de revenu mensuel de `BUSINESS_MODEL.md §6.2`, l'objectif « 65 à 100 M XOF en An 1 », le « run rate 180 M » à M12. Le §5.1 du présent rapport montre que même les unit economics sont mutuellement contradictoires d'un facteur 5 : le refus est justifié au-delà de ce que le PRD lui-même en dit.

**8.2 Les six lignes non implémentées, comme lignes.** Consulting, certifications premium, B2B, produits digitaux, contenu sponsorisé : rien à spécifier tant que rien n'est décidé. Réserves en §4.2 (deux d'entre elles ont une surface de code à mentionner) et §4.3 (le palier d'entrée bas de la ligne 1, qui n'est pas une ligne).

**8.3 Le score de santé écosystème 6,1 → 7,3** (`BUSINESS_MODEL.md` Livrable 3). Auto-évaluation à neuf dimensions sans méthode. N'a aucune place dans un document destiné à une lecture externe.

**8.4 La matrice de priorisation impact/effort et la roadmap mensuelle** (`BUSINESS_MODEL.md §6.1`, `§6.2`, Livrable 4). C'est du pilotage, pas de la spécification, et la roadmap est adossée aux projections de revenu de 8.1.

**8.5 Les cibles de KPI M3/M6/M12** (`BUSINESS_MODEL.md §5.2`). Voir §6.2 : elles portent la même fiction que le 98 %. À retirer aussi du pilotage, pas seulement du PRD.

**8.6 Le détail des collections Firestore à créer** (`BUSINESS_MODEL.md §7.3` : `pricing_plans`, `subscriptions`, `referrals`, `organizations`, `products`). C'est de la conception détaillée, et l'addendum a raison de ne pas la reprendre — d'autant que `referrals` existe déjà avec une autre forme (§4.2 a).

**8.7 Les termes commerciaux de la ligne 11** (planchers jamais franchis, jamais de facturation horaire, jamais de vente de SEO isolé). `addendum.md §10` renvoie correctement aux documents contractuels. Réserve unique en §2.4 sur les 60/40, qui a une conséquence de tunnel de paiement.

---

## 9. Ce qui a survécu, et qui devait survivre

À porter au crédit du PRD, parce qu'un rapport de réconciliation qui ne liste que des pertes donne une fausse image :

- **Le système de voix « Je te… »** (`BUSINESS_PLAN.md §2.3`) est non seulement conservé mais **promu au rang d'actif produit** en `prd.md §3`, avec une clause de conformité pour toute exigence. C'est mieux que la source, qui n'en faisait qu'un intertitre.
- **Le mobile money comme rail structurel** : la source le présentait comme un atout de « localisation native » (`BUSINESS_PLAN.md §1`) ; le PRD l'établit sur données primaires BCEAO et en fait le premier des deux moats, le seul démontré. Nette amélioration.
- **La contrainte de l'opérateur unique** : présente dans les sources comme un risque d'exécution (`BUSINESS_MODEL.md §6.3` : « Entrepreneur solo — bottleneck sur toutes les lignes »), elle devient en UJ-4 « le paramètre de conception le plus déterminant du produit ». C'est un déplacement juste, du registre du risque à celui de la conception. Il ne lui manque que ses bornes chiffrées (§2.2).
- **Le refus de l'IA illimitée** (NFR-10) contre la recommandation de `BUSINESS_MODEL.md` LIGNE 4, argumenté en `addendum.md §5`.
- **La métrique de survie du Club** : le renouvellement à 12 mois plutôt que le MAU, adossé à un churn médian sourcé. Les sources n'avaient rien d'équivalent.
- **La discipline de vocabulaire** : le glossaire `§12` traite explicitement le mot « flux » de `BUSINESS_PLAN.md` comme un faux ami du mot « ligne ». C'est exactement le bon niveau de rigueur pour un corpus à trois documents divergents — et c'est ce qui rend d'autant plus visible que l'entrée « Ligne » compte cinq membres là où il en faudrait « cinq monétisées, plus une d'acquisition » (§4.1).

---

## 10. Correctifs proposés, par ordre d'importance

Aucun de ces correctifs n'exige d'importer un chiffre de marché ou une projection. Les huit tiennent en moins de deux pages ajoutées au PRD.

| # | Correctif | Emplacement | Classe | Source |
|---|---|---|---|---|
| **1** | **Le produit n'a aucun canal e-mail.** Corriger FR-035 (« envoyé » → notification applicative), signaler la limite de FR-006 au format des limites de FR-011/FR-021, corriger UJ-1 qui fait revenir Aïssatou « par une newsletter », et ajouter l'exigence manquante en Partie B | FR-006, FR-035, UJ-1, §6.2 | Perdu par accident + vérifié en code | `BUSINESS_MODEL.md §2.4`, `§4.2`, `§7.2` chantier n°1 « Critique » ; `functions/src/notifications.ts`, `functions/src/digest.ts` |
| **2** | **Restituer le flywheel** — un encadré sans chiffres sur l'ordre des maillons et ce que chaque ligne prend à la précédente ; reformuler M-04 et Q-08 en conséquence ; corriger le glossaire (« cinq monétisées, plus une ligne d'acquisition ») | §3 ou tête de §5, §8, §11, §12 | Perdu par accident, gravité haute | `BUSINESS_MODEL.md §4.1`, `§4.2`, `§4.3`, LIGNE 3 ; `BUSINESS_PLAN.md §4.5` |
| **3** | **Poser le plafond de livraison de la ligne 11** — 8–14 h par mise en place, 3–4 par mois en solo, déclencheur de recrutement à > 4 deux mois d'affilée. Rend NFR-11 non décorative et complète D-01/D-02 | NFR-11 ou NFR-14 nouvelle, §6.1 | Perdu par accident, gravité haute | `BUSINESS_MODEL.md` LIGNE 11 › Unit Economics et Décision de capacité ; `finance/model.py §1` |
| **4** | **Inscrire la garantie 14 jours**, affichée en production et servie par un geste d'administration, en Partie A et parmi les valeurs contractuelles à miroir de NFR-01 ; poser la question de son articulation avec l'émission du certificat | Partie A (§5.4), NFR-01, §11 | Perdu par accident, gravité haute, vérifié en production | `BUSINESS_PLAN.md §2.3`, `§4.1` ; `src/i18n/locales/fr/formations.json:103,123` |
| **5** | **Ajouter le KPI de la ligne 11** (conversion pack → accompagnement à J+30), la part du revenu récurrent, et un couple coût d'acquisition / valeur par acheteur — sans aucune cible chiffrée | §8 | Perdu par accident | `BUSINESS_MODEL.md` LIGNE 11 (« LE KPI de la ligne ») ; `finance/hypotheses.csv` ; `BUSINESS_PLAN.md §8`, `§15`, `§17` |
| **6** | **Avertir sur les sources financières** : `finance/model.py` fait autorité, les tableaux de `BUSINESS_PLAN.md §11–§13` sont antérieurs à la ligne 11 et périmés (facteur 2,7 sur l'An 1). Et ajouter les **45 M XOF de revenu cumulé revendiqué** au tableau D-03 | `addendum.md §10`, D-03 | Contradiction | `BUSINESS_PLAN.md` en-tête + `§1`, `§11–§13` ; `finance/scenarios_comparatif.csv` ; `BUSINESS_MODEL.md §1` |
| **7** | **Ajouter deux risques** : la mono-dépendance au prestataire de paiement (en notant que FR-059 est déjà le filet), et l'absence de mention « certificat ≠ diplôme d'État » ; rattacher la question TVA à R-08 / FR-086 | §9, FR-025 | Perdu par accident | `BUSINESS_MODEL.md §6.3` (risques techniques et réglementaires) ; `BUSINESS_PLAN.md §16`, `§17` reco n°5 |
| **8** | **Corrections d'exactitude, groupées** : le parrainage est implémenté des deux côtés (FR-020 n'en dit que la moitié ; `addendum.md §10` le classe à tort en non implémenté) ; les cinq types de leçon dont quiz et mission (FR-014, écran `AdminMissions` non expliqué) ; la prise de rendez-vous, écran livré non monétisé ; FR-075 (« absent de la stratégie » est faux) ; FR-074 doit citer le palier mensuel à 2 500 de la source et le confronter à D-02 ; le plafond de catalogue de la ligne 1 comme risque ; le palier d'entrée bas comme piste ; le référentiel de salaire de R-01 | FR-014, FR-020, FR-057, FR-074, FR-075, §9, §6.2, §13 | Contradictions + perdus par accident, gravité unitaire moyenne | `functions/src/referrals.ts`, `src/types/index.ts:206`, `src/pages/lms/CoursePlayer.tsx`, `src/pages/admin/` ; `BUSINESS_MODEL.md` LIGNES 1, 2, 5, 9 ; `BUSINESS_PLAN.md §2.3`, `§3`, `§5.1` |

---

## 11. Note finale sur la méthode du PRD

Le PRD s'est donné une règle — *ne rien affirmer qui ne soit constaté dans le code ou sourcé auprès d'une source primaire* — et il l'a tenue avec une constance rare. Ce rapport ne conteste pas la règle. Il montre qu'elle a eu deux effets de bord qu'il faut corriger sans l'affaiblir :

1. **Elle filtre par provenance, pas par nature.** Elle a donc écarté des faits contractuels (garantie 14 jours, commission 3 %), réglementaires (TVA, mention de non-équivalence du certificat) et de capacité (3–4 mises en place par mois) qui ne sont ni des données de marché ni des projections, et qui sont aussi vérifiables que les 19 écrans d'administration.
2. **Elle protège contre l'affirmation fausse, pas contre l'omission structurante.** Le flywheel, l'escalier de gamme et le KPI de la ligne 11 ne sont pas des chiffres : ce sont des relations. Une structure en exigences numérotées les perd toujours, parce qu'aucune exigence ne se formule au singulier. C'est pourquoi le correctif n°2 est un encadré et non une FR : il n'y a pas de bonne façon de numéroter une circulation.

Le PRD dit de lui-même, en `§0`, qu'il lui manque ses chiffres de traction et que ce n'est pas une position méthodologique mais un trou. Il lui manque aussi son modèle — et ce second trou est plus facile à combler, parce que le matériau existe, qu'il est entièrement qualitatif, et qu'il n'exige d'accorder aucune confiance à un nombre que personne ne peut sourcer.
