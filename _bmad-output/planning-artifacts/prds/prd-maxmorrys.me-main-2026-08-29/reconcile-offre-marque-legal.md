---
title: "Réconciliation — offre TPE, architecture de marque, juridique"
date: 2026-08-29
cible: prd.md (rev. 2) + addendum.md
sources: docs/OFFRE_AGENCE_TPE.md · docs/AGENCY-POSITIONING.md · docs/BRAND-ARCHITECTURE.md · docs/IP-BOUNDARIES.md · docs/LEGAL-TODO.md · docs/AGENCE_DOCUMENTS_CONTRACTUELS.md
vérification: src/lib/presence/offer.ts · src/lib/agency/engagement.ts · src/lib/brand/* · src/i18n/locales/fr/legal.json · functions/src/*
---

# Réconciliation — offre TPE, architecture de marque, juridique

Ce document répond à une question unique : **que disent les six sources que le PRD a perdu,
contredit ou mal restitué ?** Chaque écart est classé, et chaque affirmation de source qui porte
sur le produit a été rouverte dans le code.

Trois marqueurs :

| Marqueur | Sens |
|---|---|
| 🔴 **Bloquant** | Un lecteur externe (investisseur, repreneur, associé) s'arrête là, ou paie le prix plus tard |
| 🟠 **À corriger** | Le PRD dit faux, ou dit vrai sur une base fausse |
| 🟡 **À enrichir** | Le PRD n'est pas faux, il est incomplet sur un point qui compte |

---

## 0. Verdict — les écarts, par ordre d'importance

| # | Écart | Où dans le PRD | Gravité |
|---|---|---|---|
| **E-01** | **Les actifs du produit ne sont pas détenus par l'entité qui l'exploite.** `IP-BOUNDARIES §1` place la marque Max-Morrys, les contenus, le Club et Rysmo chez un **détenteur « distinct de MY ONOMA SARL »**, et subordonne la relation d'exploitation à un **accord écrit qui n'existe pas** (`LEGAL-TODO §4`). Le PRD est signé `entity: MY ONOMA SARL` et n'en dit **pas un mot**. Les CGV publiées hésitent elles-mêmes : « propriété exclusive de MY ONOMA SARL **ou de Max-Morrys** » (`legal.json`, art. 7) | Absent partout. §9 R-07 traite le fondateur comme risque de continuité, jamais comme question de titularité | 🔴 |
| **E-02** | **D-02 attribue à sa source le modèle inverse du sien.** Le PRD écrit « `docs/OFFRE_AGENCE_TPE.md` est bâti sur un modèle *MRR-first* » ; l'en-tête de ce document dit « Modèle : **setup-first** », et `AGENCE_DOCUMENTS_CONTRACTUELS §1` le répète (« Le modèle est setup-first : le prix affiché est le prix »). Le risque n°1 de la source n'est pas le rail de prélèvement, c'est **le plafond de livraison** — 3 à 4 mises en place/mois, ~20 M XOF/an — dont le KPI **≥ 40 % de conversion à J+30** est l'antidote. Ce KPI n'apparaît **nulle part** dans le PRD | §6.1 D-02 (l. 535) ; §8 M-08 ; §9 R-02 | 🔴 |
| **E-03** | **Deux des cinq lignes vendent sans CGV.** `LEGAL-TODO §6` : les CGV couvrent formations, Club, Rysmo, sessions live — **ni `/agence`, ni `/presence-digitale`** ; régime de TVA laissé en suspens. Vérifié : `src/i18n/locales/fr/legal.json` ne contient aucune occurrence d'« agence », « présence », « studio » ou « prestation de conception ». Le PRD ne retient de `LEGAL-TODO` que l'objet social (R-08) | §9 R-08 seul ; §6.2 FR-086 seul | 🔴 |
| **E-04** | **Le chiffre bloquant de D-01 n'est pas calculé sur la grille qu'il invoque.** Il omet le prix du pack — que `computeTotals()` additionne pourtant (`upfront = packPrice + planSetup`) — et annualise 12 mensualités sur une formule qui ne porte **aucun engagement** dans le code (`commitmentMonths` n'existe que sur `commerce360`), alors que la source modélise **4,6 mois** en année 1 | §6.1 D-01 ; §13 (« ces pourcentages ne sont pas fictifs ») | 🟠 |
| **E-05** | **Le PRD invente un pilier et en perd un.** Il écrit « Max-Morrys — la marque, **pilier LEARN** ». Les piliers sont `['BUILD','GROW','OWN']` (`src/lib/brand/practices.ts`) ; LEARN est un *track* (`positioning.tracks = ['LEARN','WORK WITH ME']`). Le pilier **OWN / Product Lab (DOVEN · NAYO · STEPS)** est absent du PRD, alors que `/agence` le rend | §3 (schéma) | 🟠 |
| **E-06** | **Le PRD tranche une décision que sa source déclare ouverte.** `AGENCY-POSITIONING §9` : le rattachement à long terme de la ligne TPE **n'est pas arbitré** — offre productisée Max-Morrys, ou transfert à Cléa Growth Office — et « relève plus de **GROW** que de BUILD ». Le PRD la fixe sous Max-Morrys dans son schéma, et n'ouvre jamais l'option « transférer la ligne » dans D-01/D-02 ni en §11 | §3 ; §6.1 ; §11 | 🟠 |
| **E-07** | **Les CGV promettent un renouvellement automatique du Club qui n'existe pas.** Art. 5.4 : renouvellement automatique au choix, et information par e-mail **15 jours avant l'échéance**. Vérifié : `autoRenew` est un booléen **stocké et affiché**, jamais exécuté — aucune fonction planifiée de renouvellement ni de préavis (`functions/src/*.ts` : digest, import, leaderboard, media-stats, streak, course, maintenance, backup — rien sur `club_subscriptions`). C'est **le même trou que D-02**, sur la ligne la plus ancienne | §5.6 FR-030 ; §6.2 FR-077 ; D-02 | 🔴 |
| **E-08** | **M-01, « métrique de survie », n'a pas de substrat.** `LEGAL-TODO §1` et le code (`useAdminClub.ts` l. 394-403) : le document `club_subscriptions/{uid}` est **écrasé au renouvellement**, ce qui efface l'historique pluriannuel ; seul `transactions` filtré `formationId === 'club_digitos'` + `status === 'completed'` est opposable | §8 M-01 ; §6.2 FR-071, FR-093 | 🟠 |
| **E-09** | **La contradiction interne aux CGV sur le prix du Club est toujours ouverte.** Art. 3.4 fixe 19 900 FCFA, art. 5.1 dispose que « le prix applicable est celui affiché au moment de la commande ». Vérifié ligne à ligne dans `legal.json`. Le PRD présente l'alignement comme clos et couvert par un test unitaire | §5.6 FR-030 ; addendum §2 | 🟠 |
| **E-10** | **Douze clients nommés, avec domaine et capture live, sans accord écrit documenté.** `IP-BOUNDARIES §4` : « la publication de l'étude de cas suppose l'accord écrit du client — **non obtenu à ce jour** » ; `LEGAL-TODO §9` ligne 9. `/agence` publie 12 projets clients avec aperçu réel capturé chez deux tiers (`SitePreview.tsx` : `s.wp.com/mshots`, `api.microlink.io`) | §5.9 (4 FR, aucune sur les réalisations) | 🟠 |
| **E-11** | **`/agence` est une URL sous contrat réciproque.** Le dépôt My-onoma déclare `practices.build.externalUrl = 'https://maxmorrys.me/agence'`. NFR-03 énumère six emplacements à mettre à jour pour renommer un segment public — il en manque un **hors dépôt**, et `/agence` est en pratique non renommable | §7 NFR-03 ; addendum §3 | 🟡 |
| **E-12** | **Deux registres de voix, un seul décrit.** `BRAND-ARCHITECTURE §2` impose **tutoiement sur LEARN, vouvoiement sur `/agence`**. Le PRD décrit le système « Je te… » puis écrit « Toute exigence de ce PRD s'y conforme » | §3 | 🟡 |
| **E-13** | **Le plafond de livraison et la ligne rouge de concentration client sont absents.** Source : 3–4 mises en place/mois, ~20 M XOF/an de plafond structurel, **aucun compte > 25 % du CA de la ligne**. NFR-11 (coût opérateur) et M-04 (concentration du revenu) sont exactement les emplacements prévus | §7 NFR-11 ; §8 M-04 | 🟡 |
| **E-14** | **Les gabarits contractuels contiennent déjà la réponse opérationnelle à D-02.** `AGENCE_DOCUMENTS_CONTRACTUELS §3` avertit que le prélèvement récurrent n'est pas disponible uniformément, ordonne de vérifier auprès de Bictorys/PayDunya, et prescrit une **procédure mensuelle J−3 → J+30** avec relance manuelle et échelle de suspension. Le PRD pose D-02 comme trois options ouvertes sans citer ce qui existe | §6.1 D-02 | 🟡 |
| **E-15** | **L'en-tête de la source commerciale pointe un fichier qui n'existe pas.** `OFFRE_AGENCE_TPE.md` désigne `src/lib/agency/offer.ts` comme source de vérité technique ; ce fichier n'existe pas — c'est `src/lib/presence/offer.ts` (`src/lib/agency/` ne contient que `engagement.ts`). La chaîne de miroirs de prix est **cassée à sa tête** | addendum §2 | 🟠 |

---

## 1. Architecture de marque — ce qui compte et manque

Le PRD résume l'architecture en un schéma de sept lignes et deux règles. Les sources en portent
six de plus, et trois d'entre elles sont des **invariants déjà appliqués dans le code**.

### 1.1 Le schéma du PRD est faux sur un point structurel

```
PRD §3                                    Réalité (src/lib/brand/practices.ts)
├── Max-Morrys — pilier LEARN             pillars = ['BUILD', 'GROW', 'OWN']
├── Max-Morrys Agency — pilier BUILD      positioning.tracks = ['LEARN', 'WORK WITH ME']
└── Cléa Growth Office — pilier GROW      practices = { build, grow }   ← deux, pas trois
                                          OWN → Product Lab (DOVEN · NAYO · STEPS)
```

**LEARN n'est pas un pilier, c'est un parcours.** Le commentaire de `practices.ts` explique
pourquoi la distinction n'est pas cosmétique : « le pilier ne change pas, la marque qui le porte
peut évoluer ». Un PRD qui promeut un parcours au rang de pilier casse précisément l'invariant
que le code protège.

**Le pilier OWN est absent du PRD.** DOVEN, NAYO et STEPS sont rendus sur `/agence`
(`Agence.tsx` l. 430-435, `VentureCard`). Pour un lecteur externe, c'est une partie du périmètre
qu'il découvrira sur le site sans l'avoir lue dans le document.

### 1.2 Cléa : le PRD garde le routage, perd la règle

Le PRD dit : « les demandes `growth` sont tagguées `MY_ONOMA_GROW` et orientées vers Cléa ».
Vrai, et vérifié (`engagement.ts` → `routingTagFor`). Ce qu'il perd :

- **Cléa est une practice sœur, jamais une sous-traitante.** `BRAND-ARCHITECTURE §4` et
  `AGENCY-POSITIONING §5` écrivent la relation interdite en toutes lettres : jamais
  `Max-Morrys └── Cléa`. C'est une règle de rédaction opposable à toute page future.
- **Le routage a un filet lexical.** `engagement.ts` porte `GROWTH_KEYWORDS` (12 termes) qui
  rattrape le prospect ayant coché « Autre » puis écrit « structurer notre acquisition ».
  Le commentaire précise que `CRM` et `pipeline` en sont **volontairement** absents : ce sont
  des missions BUILD légitimes. C'est une décision produit, pas un détail.
- **Aucune automatisation de transfert n'existe** — ni webhook, ni synchronisation CRM
  inter-entités (`AGENCY-POSITIONING §6`, et le commentaire de `routingTagFor`). Le PRD laisse
  croire à un routage opérant ; il s'agit d'un marqueur posé sur un document Firestore.

### 1.3 `/agence` : une URL sous contrat, et un bloc de preuve non spécifié

Le dépôt My-onoma déclare `practices.build.externalUrl = 'https://maxmorrys.me/agence'` :
renommer ce segment casse un lien publié par une autre plateforme du même groupe.
NFR-03 doit porter cette contrainte, et la liste « six emplacements » de l'addendum §3 doit
devenir **six emplacements + un contrat inter-dépôts**.

Par ailleurs, §5.9 décrit `/agence` en quatre exigences (FR-053 à FR-056) qui ne couvrent que le
formulaire. La page rend aussi :

- un **index navigable et filtrable** de 12 projets clients (`ClientWorkIndex.tsx`) ;
- une grille de 3 ventures, **jamais dans la même grille** que les clients — deux composants
  distincts, deux mentions distinctes (« Client product » / « A MY ONOMA Venture ») ;
- des **aperçus réels capturés à la volée** chez deux tiers, sans repli documenté
  (`SitePreview.tsx`).

Les deux premiers points sont des invariants d'IP appliqués dans le code
(`BRAND-ARCHITECTURE §6`, `IP-BOUNDARIES §5`) ; le troisième est une dépendance externe sur la
seule preuve visuelle d'une page commerciale. Aucun des trois n'est dans le PRD.

### 1.4 La règle JSON-LD, absente et pourtant absolue

`BRAND-ARCHITECTURE §8` : **jamais d'`Organization` autonome nommée « Max-Morrys Agency »** —
c'est une marque commerciale, pas une personne morale. C'est une règle de conformité, pas de SEO :
elle empêche le site d'affirmer publiquement l'existence d'une entité qui n'est pas immatriculée.
Elle a sa place en NFR, à côté de NFR-07.

### 1.5 Le système de voix : deux registres, pas un

Le PRD : « L'ensemble de la navigation publique est construit au tutoiement […] Toute exigence de
ce PRD s'y conforme. » `BRAND-ARCHITECTURE §2` : tutoiement sur LEARN, **vouvoiement sobre et
business sur `/agence`** — « les deux territoires partagent la marque et le design system, **pas
le même funnel** ». Formulé comme il l'est, le PRD prescrit à `/agence` un registre que la source
lui interdit.

---

## 2. La ligne TPE

### 2.1 Le PRD attribue à sa source le modèle contraire du sien

| | `docs/OFFRE_AGENCE_TPE.md` | PRD §6.1 D-02 |
|---|---|---|
| Modèle déclaré | « Modèle : **setup-first** — mise en place vendue seule, accompagnement vendu ensuite » | « bâti sur un modèle ***MRR-first*** » |
| Risque n°1 | « **Plafond de livraison** (le risque n°1 du modèle setup-first) » | absence de rail de prélèvement |
| KPI central | « **Taux de conversion ≥ 40 %, mesuré à J+30** […] la seule métrique à surveiller chaque mois » | *absent du document* |
| Plafond chiffré | ~**20 M XOF/an** à 3–4 mises en place/mois | *absent* |

`AGENCE_DOCUMENTS_CONTRACTUELS §1` confirme : « **Aucune remise sur la mise en place. Le modèle
est setup-first : le prix affiché est le prix.** »

**Ce n'est pas une querelle de vocabulaire.** Dans un modèle MRR-first, l'absence de rail de
prélèvement est fatale. Dans un modèle setup-first, elle est coûteuse mais latérale : le revenu
d'amorçage est encaissé en 60/40 à la commande, et le mensuel est un **surcroît** dont la source
modélise déjà la collecte manuelle. D-02 est donc réel — mais il n'a pas la portée que le PRD lui
donne, et **il n'est pas le blocage principal de la ligne**. Le blocage principal est le plafond
de livraison, absent du PRD.

### 2.2 Le KPI ≥ 40 % à J+30 : ni repris, ni contredit — perdu

Le PRD ne le mentionne jamais. Son couple M-08 est :

> M-08 · Prospects TPE qualifiés ↔ **Taux de recouvrement mensuel effectif**

La contre-métrique est juste (elle découle de D-02). La métrique de succès ne l'est pas :
compter des prospects qualifiés mesure le haut d'un tunnel dont la source dit qu'il est **borné
par la capacité de livraison**, pas par le volume d'entrées. Le couple conforme aux sources
serait :

> M-08 · **Taux de conversion en accompagnement à J+30** ↔ **Mises en place livrées par mois, et
> temps de livraison moyen**

avec les seuils que la source fixe déjà : cible ≥ 40 %, **sous 30 % la ligne est rentable mais
bornée**, revue à M6, recrutement déclenché dès 4 mises en place/mois deux mois d'affilée.

### 2.3 Le calcul de D-01, rouvert dans le code

Le PRD présente 25,8 % comme un fait arithmétique (« pas de chiffre fictif ici : ce sont les
tarifs publiés »), et §13 le confirme explicitement. Deux problèmes.

**a) Le pack manque.** `src/lib/presence/offer.ts` :

```ts
const upfront = packPrice + planSetup;   // computeTotals()
```

Le devis additionne le pack **et** les frais de mise en place de l'accompagnement, et les
unit economics de la source le confirment (« Accompagnement — frais de mise en place :
11 conversions × 468 750 », en sus des 28 mises en place). Sur un CA de 800 000 XOF/mois :

| Chemin réel | Année 1 | % du CA annuel (9 600 000) |
|---|---:|---:|
| PRD (accompagnement seul) | 2 475 000 | 25,8 % |
| Présence Locale promo + Croissance | 2 725 000 | **28,4 %** |
| Présence Locale plein tarif + Croissance | 2 770 000 | **28,9 %** |
| Commerce Visible + Croissance | 2 970 000 | **30,9 %** |

Et le devis type exclut encore : budget publicitaire **minimum 100 000 XOF/mois si applicable**
(+1,2 M/an), nom de domaine ~15 000 XOF/an, séance photo produits. **La grille publique n'est pas
le coût total du client.**

**b) Les douze mensualités sont une hypothèse, pas un tarif.** Dans le code, seule
`commerce360` porte `commitmentMonths: 6` ; **Croissance Automatisée n'a aucun engagement**, et
le gabarit de devis prévoit « Durée d'engagement : [aucune / 6 mois] ». La source modélise **4,6
mois en moyenne** la première année. Le même client, sur le scénario de base de la source :
250 000 + 375 000 + 175 000 × 4,6 = **1 430 000, soit 14,9 %**.

**Conclusion.** La conclusion de D-01 (segmenter, servir le palier 800 k–2 M par un pack seul)
reste juste — la recherche `research-agence-tpe.md` y arrive indépendamment. Mais le chiffre qui
la porte doit soit être recalculé pack inclus (28,4–30,9 %), soit être présenté comme une
**annualisation** et non comme un engagement, et l'index des hypothèses de §13 doit cesser
d'affirmer que ces pourcentages ne reposent sur aucune hypothèse.

### 2.4 Ce que devient `OFFRE_AGENCE_TPE.md` si D-01 et D-02 sont tranchés

| Décision | Ce qui reste valable | Ce qui doit être réécrit |
|---|---|---|
| **D-01 = segmenter** (recommandation du PRD) | Toute la §3 (grille, planchers, options), la §4 (argumentaire), la §6 (objections), la §7 (red lines), la §8 (unit economics des packs) | §2 ICP : la borne basse 800 000 XOF cesse d'être une borne d'éligibilité à l'offre et devient une **borne d'éligibilité à l'accompagnement** ; le tableau « Segment → pack naturel » doit porter une colonne « accompagnement : oui / non ». §11-2 (test des paliers) doit tester le refus **par palier de CA**, pas seulement par pack |
| **D-01 = palier bas** | La grille des packs | §3.2 gagne une formule, §8 doit chiffrer sa marge contre le coût opérateur (1h30–2h/mois/client) — la source dit déjà que la marge brute de l'accompagnement est de ~96 %, un palier bas la comprime mécaniquement |
| **D-01 = relever le plancher ICP** | Tout, sauf §2 | §2 et §9 : la « base existante » (les étudiants de la plateforme) cesse d'être un canal d'acquisition naturel, puisque le filtre monte au-dessus de la majorité présumée |
| **D-02 = prépaiement annuel remisé** | §3.2, §7, §10 | §3.4 (conditions), §5 (le moment J+30 devient une vente annuelle, pas une bascule mensuelle), **et l'article 5 du contrat + le mandat §3 en entier**. §8 : l'ARPU mixte et le « 4,6 mois moyens » deviennent caducs |
| **D-02 = recouvrement manuel assumé** | Presque tout | §8 doit intégrer le coût de recouvrement (12 relances/client/an) dans « Temps opérateur / client », aujourd'hui à 1h30–2h/mois. Le mandat §3 et sa procédure J−3 → J+30 deviennent **le processus nominal**, pas un repli |
| **D-02 = restriction géographique** | §3, §4, §6, §7 | §2 ICP (Sénégal exclu de l'accompagnement — or c'est le marché principal), §8 (volumes), §9 (la base existante est majoritairement sénégalaise). **C'est l'option qui détruit le plus de document** |

**Dans les six cas**, trois éléments de la source survivent intacts et devraient être promus au
PRD dès maintenant, parce qu'ils ne dépendent d'aucune de ces décisions : le **KPI J+30**, le
**plafond de livraison** et la **ligne rouge de concentration client (25 %)**.

### 2.5 Une dépendance croisée que le PRD casse sans le voir

`OFFRE_AGENCE_TPE.md §9` fonde le canal d'acquisition prioritaire de la ligne sur
« les **~1 486 étudiants** inscrits sur la plateforme », d'où un « CAC quasi nul » et le refus de
la publicité payante au démarrage. Or le PRD classe ce nombre en `[À SOURCER]` avec un **écart
d'un facteur 30** face aux « 50+ étudiants » affichés en façade (D-03).

Si D-03 tranche à la baisse, **la stratégie d'acquisition de la ligne 11 tombe avec le chiffre**,
et le CAC de ~25 000 XOF de §8 avec elle. Le PRD traite D-03 comme un problème de crédibilité
publique ; c'est aussi un problème de modèle économique. À signaler dans D-03 et dans R-06.

---

## 3. Le juridique — ce qui mérite d'y figurer

`LEGAL-TODO §9` récapitule neuf décisions à rendre. Le PRD en reprend **une** (n° 5, l'objet
social → R-08 / FR-086). Voici les huit autres, triées par ce qu'elles font à une lecture externe.

### 3.1 Bloquants pour une lecture externe

| Point source | Pourquoi c'est bloquant | Où l'insérer |
|---|---|---|
| **§4 — Accord écrit encadrant la marque Max-Morrys Agency** | Le site publie « Max-Morrys Agency est la practice […] de MY ONOMA » et le corporate publie « operated by MY ONOMA ». `LEGAL-TODO` demande de **vérifier que cette formulation correspond à un accord écrit**, et de confirmer **qui contracte avec le client final selon le canal d'entrée**. Un repreneur achète des contrats : savoir qui les signe est la première diligence | R-08 élargi, ou un R-14 ; Q-11 |
| **§6 — CGV ne couvrant ni le studio ni la ligne TPE ; TVA en suspens** | Deux des cinq lignes du §1 encaissent hors de tout document contractuel publié. Les gabarits TPE existent mais portent leur propre avertissement (« bases de travail, pas un avis juridique ») et laissent la TVA ouverte. Un investisseur lit §1, compte cinq lignes, et découvre que deux n'ont pas de CGV | R-15 ; FR-101 |
| **§8 — Aucune version linguistique désignée comme faisant foi** | Les pages légales sont traduites en anglais sans clause de préséance. Le PRD affiche NFR-06 « bilinguisme intégral » comme une force ; sur les pages légales, c'est une exposition. Vérifié : aucune occurrence de « faisant foi » dans `legal.json` | NFR-06 (réserve) ; FR-102 |
| **§1 (reste ouvert) — Renouvellement automatique du Club promis, non implémenté** | Art. 5.4 des CGV : renouvellement automatique au choix du client + information par e-mail **15 jours avant l'échéance**. Ni l'un ni l'autre n'existe. C'est un écart contractuel **de même nature que FR-098 (« Free Money »), et plus lourd** : il porte sur le mécanisme de revenu récurrent de la ligne la plus ancienne | FR-103, priorité égale à FR-098 ; à lier à D-02 |

### 3.2 À reprendre, non bloquants seuls

| Point source | Effet | Où |
|---|---|---|
| **§1 — Contradiction CGV art. 3.4 / art. 5.1** sur le prix du Club | Le PRD célèbre l'alignement 19 900 comme clos (FR-030, test unitaire). Le test garantit la **cohérence des chaînes**, pas la **cohérence des clauses** : art. 3.4 fixe un montant, art. 5.1 renvoie au prix affiché. Deux voies (retirer le montant de 3.4, ou clause de préséance), l'arbitrage est juridique | Réserve dans FR-030 ; FR-104 |
| **§1 — Offre Club mensuelle « fantôme » à 2 500 XOF** dans `BUSINESS_MODEL.md`, absente du code | Le PRD propose en FR-074 de « cadrer le tarif du Club au mois autant qu'à l'année (19 900/an ≈ 1 658/mois) » — sans savoir qu'un **autre** montant mensuel circule déjà dans les documents stratégiques. Deux ancres mensuelles concurrentes, à 50 % d'écart | FR-074 (note) |
| **§2 — Graphie et adresse de l'entité** | Le site écrit « My Onoma SARL », les gabarits contractuels « MY ONOMA SARL », le registre fait foi. Adresse publiée réduite à la ville alors que le siège complet est connu et présent dans `company.ts` | FR-085 élargi (il ne parle aujourd'hui que des e-mails) |
| **§3 — Deux adresses e-mail** | Déjà dans le PRD (FR-085). Ce que le PRD ne dit pas : `contact@maxmorrys.me` est **l'adresse des documents contractuels**, `hello@maxmorrys.me` celle de la façade. L'arbitrage n'est pas cosmétique, il désigne l'adresse opposable | FR-085 (précision) |
| **§7 — Newsletter : durée de conservation, double opt-in** | Le PRD clôt le sujet avec FR-006 (consentement livré, testé) et retire FR-083. Les deux décisions restantes sont réelles, et le double opt-in **suppose un ESP qu'aucun module du dépôt ne branche** | FR-105 |
| **§9-9 — Accord du client Amour Divin** | Voir E-10 ci-dessous : le problème est plus large que le seul Amour Divin | R-16 |

### 3.3 Un point de conformité qui appartient à l'addendum, pas au PRD

`LEGAL-TODO §7` : les règles Firestore de `newsletter` (5 clés) et `engagement_leads` (12 clés)
sont **exactement à leur plafond**. Ajouter un seul champ à l'un de ces formulaires sans relever
le plafond fait échouer **100 % des soumissions en production, silencieusement** — et le job
`rules-tests` de la CI est non bloquant (c'est FR-088). L'addendum §7 décrit le job non bloquant ;
il ne dit pas ce qui casse quand il est ignoré. C'est l'exemple qui rend FR-088 défendable.

---

## 4. Les frontières de propriété intellectuelle

**Le PRD n'en parle pas du tout. Pour un document destiné à un investisseur ou à un repreneur,
c'est l'omission la plus grave du lot.**

### 4.1 Le fait

`IP-BOUNDARIES §1` cartographie le « cœur de ce dépôt » — marque Max-Morrys et Max-Morrys Agency,
domaine et plateforme `maxmorrys.me`, système éditorial « Je te… », **contenus pédagogiques**,
**le Club des Digitos**, **Rysmo, ses prompts et sa mémoire produit** — et conclut :

> **Détenteur : distinct de MY ONOMA SARL.** La relation d'exploitation (« practice de
> MY ONOMA », « operated by MY ONOMA ») doit reposer sur un accord écrit — voir LEGAL-TODO §4.

`LEGAL-TODO §4` confirme que cet accord est **à vérifier**, donc non établi.

### 4.2 Ce que le code publie de cette hésitation

`src/i18n/locales/fr/legal.json`, CGV art. 7 :

> « Tous les contenus […] sont la propriété exclusive de MY ONOMA SARL **ou de Max-Morrys**. »

Une clause de propriété intellectuelle qui offre une alternative n'attribue rien. Le site publie
donc, aujourd'hui, une incertitude de titularité sur l'intégralité du catalogue payant.

### 4.3 Pourquoi c'est bloquant

Le PRD s'ouvre sur : « destiné à une lecture externe — investisseur, associé, développeur à
recruter » et se signe `entity: MY ONOMA SARL`. Un investisseur qui lit ce PRD croit financer une
société qui détient le produit décrit. Les sources disent qu'elle ne le détient probablement pas,
et qu'aucun acte ne règle la question. R-07 (« le fondateur est à la fois le moat et le point de
rupture ») effleure le sujet **par le mauvais bout** : il traite d'un risque de continuité
opérationnelle, pas d'un défaut de titularité — et il conclut « aucun traitement à ce stade », ce
qui est acceptable pour une dépendance humaine et ne l'est pas pour un titre de propriété.

### 4.4 Les trois autres frontières, utiles et absentes

- **Background Technology IP** (`§3`) : design system, patterns d'architecture, outillage,
  automatisations n8n — réutilisables d'un projet à l'autre, **mais jamais le code ou les données
  développés pour un client**. C'est ce qui rend défendable la réutilisation d'actifs entre la
  ligne TPE et le studio, et c'est aussi la limite à ne pas franchir en communication.
- **Client-specific IP** (`§4`) : ce qui est publiable sur `/agence` se limite au rôle tenu et à
  des éléments **vérifiables publiquement**. La page publie 12 clients avec domaine et capture
  live ; l'accord écrit est documenté comme non obtenu. Cette exposition doit devenir un risque
  du PRD.
- **Venture IP** (`§5`) : les actifs de DOVEN, NAYO et STEPS doivent rester **isolables** —
  condition pour qu'une venture devienne une société indépendante sans démembrement. Le modèle de
  `ventures.ts` sépare `operator`, `owner` et `status` précisément pour ça. C'est une contrainte
  d'architecture de données motivée par du droit : elle a sa place dans l'addendum.
- **Third-party IP** (`§6`) : licences des visuels non tracées. Le PRD a FR-084 sur les portraits
  IA ; il devrait couvrir les quatre `.webp` de `public/` et les médias de `media.maxmorrys.me`,
  ce que FR-084 mentionne à moitié (« tracer la licence des visuels de banque »).

### 4.5 La ligne TPE, elle, est propre

`IP-BOUNDARIES §4` note que les gabarits contractuels TPE (art. 8) opèrent **déjà** une
répartition explicite — au client le domaine, les contenus et les comptes ; au prestataire les
workflows, scripts et gabarits, sans licence ni transfert — et que cette répartition est cohérente
avec le reste du document. C'est le seul périmètre du groupe où la propriété est réglée par écrit.
Le PRD peut le dire : c'est un point fort, pas seulement une absence de problème.

---

## 5. Les documents contractuels sont-ils cohérents avec la grille ?

**Sur les montants, oui, intégralement.** Vérification croisée
`AGENCE_DOCUMENTS_CONTRACTUELS` ↔ `OFFRE_AGENCE_TPE.md` ↔ `src/lib/presence/offer.ts` :

| Élément | Gabarits | Doc commercial | Code | Verdict |
|---|---|---|---|---|
| 60 % commande / 40 % avant mise en ligne | art. 5 | §3.4 | `DEPOSIT_RATE = 0.6`, `depositAmount()` | ✅ |
| Deux séries de modifications incluses | art. 5 | §3.4 | clé `TERMS.revisions` | ✅ |
| Commerce 360 = 2 100 000 sur 6 mois | §1 (règle de rédaction) | §3.2 | `commitmentTotal = 750 000 + 225 000 × 6` | ✅ |
| Planchers 225 k / 400 k / 700 k, jamais affichés | §1 « aucune remise » | §3.1 | `floorPrice` sur les trois packs | ✅ |
| Promo Présence Locale 250 000 | — | §3.1 | `promoPrice: 250_000` | ✅ |
| Support 30 / 30 / 60 jours | devis | §3.1 | `supportDays: 30, 30, 60` | ✅ |
| Hébergement 12 mois | art. 8 | §3.1 « hébergement 1 an » | — (hors code) | ✅ |

**Quatre divergences de périmètre, en revanche :**

1. **L'engagement de 6 mois du contrat ne correspond pas au code.** L'article 4 fixe « une durée
   ferme de **[6] mois** à compter de la première échéance d'abonnement », sur un contrat unique
   servant les deux formules ; le devis type propose « [aucune / 6 mois] ». Dans
   `offer.ts`, `commitmentMonths` n'existe **que** sur `commerce360`, et `computeTotals()` ne
   renvoie donc **aucun `commitmentTotal`** pour Croissance Automatisée. Un contrat Croissance
   signé avec la case « 6 mois » cochée porterait un engagement que le devis généré par la
   plateforme n'a jamais chiffré. À trancher avant la première signature.
2. **Le devis publie des exclusions que la grille publique ne montre pas** : budget publicitaire
   minimum 100 000 XOF/mois si applicable, nom de domaine ~15 000 XOF/an, séance photo produits.
   La page `/presence-digitale` publie une grille complète ; elle ne publie pas le coût total.
   Cela renforce D-01, et cela concerne aussi FR-079 (désamorcer l'ancrage **en amont** du tunnel).
3. **FR-050 dit vrai d'une collection, pas d'un document.** « Les données du devis sont séparées
   des données personnelles » : c'est exact de la collection Firestore, et c'est un point de
   conception remarquable. Le **devis commercial** du gabarit porte, lui, raison sociale,
   représentant, adresse, téléphone et NINEA. Les deux objets s'appellent « devis » dans le
   glossaire §12 ; il faut les distinguer, sinon l'exigence se lit comme une garantie qu'elle
   n'offre pas.
4. **Le gabarit écrit « My Onoma SARL » en signature de devis et de mandat**, « MY ONOMA SARL » en
   en-tête de contrat. `LEGAL-TODO §2` rappelle que c'est la graphie du registre qui fait foi.

**Deux apports des gabarits que le PRD devrait citer :**

- **Le mandat §3 est déjà la réponse opérationnelle à D-02** : avertissement explicite sur
  l'indisponibilité du prélèvement récurrent, injonction de vérifier le mécanisme réellement
  supporté auprès de Bictorys ou PayDunya (*recurring token*, lien récurrent, ou rappel automatisé
  avec paiement manuel), et **procédure mensuelle J−3 → J+30** avec échelle de suspension
  graduée — dont la règle « ne jamais suspendre le site avant J+30 », motivée par le coût en
  réputation. D-02 n'est pas un espace vide : c'est un choix entre trois mécanismes déjà nommés.
- **L'article 10 fournit le levier que FR-082 réclame.** Le PRD demande de « construire une preuve
  autre que la démonstration Maps » et constate l'absence de témoignage, de logo et de référence.
  Le contrat porte déjà l'autorisation de référence commerciale **et** une clause « Client
  Fondateur » : tarif préférentiel contre témoignage vidéo de 60–90 s sous 90 jours, exploitable
  sans limitation de durée, à défaut de quoi le tarif standard s'applique au 91ᵉ jour. FR-082 a un
  outil ; il lui manque des clients signés, pas un mécanisme.

---

## 6. Récapitulatif des contradictions de prix, périmètre et positionnement

| Sujet | Source | PRD | Arbitrage |
|---|---|---|---|
| Modèle de la ligne TPE | **setup-first** (deux documents) | MRR-first | Source |
| KPI central de la ligne | conversion J+30 **≥ 40 %** | absent | Source |
| Risque n°1 de la ligne | plafond de livraison (3–4/mois, ~20 M XOF/an) | absence de rail de prélèvement | Source, sans supprimer D-02 |
| Coût année 1 au plancher ICP | pack + accompagnement, durée non engagée, 4,6 mois modélisés | 2 475 000 = 25,8 %, présenté sans hypothèse | **Recalcul : 28,4–30,9 % pack inclus**, ou requalification en annualisation |
| Prix plancher | **trois** planchers (225 k / 400 k / 700 k) | « un prix plancher jamais affiché » | Code |
| Concentration client | aucun compte > **25 % du CA de la ligne** | absent (M-04 traite la concentration par ligne) | Source |
| Pilier de Max-Morrys | LEARN est un **track**, les piliers sont BUILD·GROW·OWN | « pilier LEARN » | Code |
| Rattachement de la ligne TPE | **non tranché** ; « relève plus de GROW que de BUILD » | rattachée à Max-Morrys dans le schéma | Source |
| Registre de `/agence` | **vouvoiement** | « toute exigence s'y conforme » (tutoiement) | Source |
| Source de vérité des prix TPE | `OFFRE_AGENCE_TPE.md` désigne `src/lib/agency/offer.ts` | addendum §2 ne nomme pas de fichier | **Ni l'un ni l'autre : `src/lib/presence/offer.ts`** |
| Tests de règles Firestore | 29 (LEGAL-TODO, 13 août) | 43 | **PRD** — vérifié, 43 `it()` dans `tests/firestore-rules/rules.test.ts` |
| Date de l'entité | création 06/04/2022, immatriculation 11/04/2022 | « immatriculée le 11/04/2022 » | **PRD** — conforme à `company.ts` |
| Free Money aux CGV mais pas au tunnel | — | FR-015 / FR-098 | **PRD** — vérifié, `legal.json` art. 5.2 le nomme |

---

## 7. Corrections proposées, par ordre de rentabilité

**Six lignes à changer, dans cet ordre :**

1. **§6.1 D-02, l. 535** — remplacer « bâti sur un modèle *MRR-first* » par « bâti sur un modèle
   ***setup-first*** », et déplacer le poids du blocage : le rail de prélèvement grève le
   surcroît mensuel, il ne conditionne pas l'amorçage. Ajouter le renvoi au mandat §3 des
   gabarits.
2. **Nouvelle décision D-04 ou risque R-14** — la titularité des actifs (E-01), avec la citation
   de `IP-BOUNDARIES §1` et de l'art. 7 des CGV. C'est la première question d'un lecteur externe
   une fois passée celle de la traction.
3. **§6.1 D-01** — recalculer pack inclus (28,4 % / 28,9 % / 30,9 %), ou dire explicitement que
   2 475 000 est une **annualisation d'une formule sans engagement**, et retirer de §13 la phrase
   qui affirme que ces pourcentages ne reposent sur aucune hypothèse.
4. **§8 M-08** — substituer le couple conforme aux sources : conversion J+30 ≥ 40 % ↔ mises en
   place livrées et temps de livraison ; ajouter le plafond ~20 M XOF/an sous NFR-11 et la ligne
   rouge des 25 % sous M-04.
5. **§3** — corriger le schéma (BUILD·GROW·OWN, LEARN comme parcours, Product Lab présent),
   marquer le rattachement de `/presence-digitale` comme **décision ouverte** (nouvelle Q-11), et
   ajouter la règle des deux registres de voix.
6. **§9 et §6.2** — ouvrir les quatre risques juridiques bloquants de §3.1 ci-dessus (accord de
   marque, CGV manquantes + TVA, version faisant foi, renouvellement automatique promis et non
   implémenté), avec leurs FR.

---

## 8. Ce qui a été vérifié dans le code

| Affirmation | Fichier | Résultat |
|---|---|---|
| Trois planchers de prix TPE, non affichés | `src/lib/presence/offer.ts` | 225 000 / 400 000 / 700 000 — confirmé |
| Le devis additionne pack + mise en place accompagnement | `offer.ts` → `computeTotals()` | `upfront = packPrice + planSetup` — confirmé |
| Croissance Automatisée sans engagement | `offer.ts` → `PLANS` | `commitmentMonths` absent — confirmé |
| Promo 250 000, support 30/30/60 j | `offer.ts` → `PACKS` | conforme au document commercial |
| Source de vérité désignée par la doc commerciale | `src/lib/agency/` | `offer.ts` **n'existe pas** ; seul `engagement.ts` — chemin périmé |
| Routage growth vers Cléa, jamais de rejet | `src/lib/agency/engagement.ts` | `routingTagFor` → `MY_ONOMA_GROW` ; filet `GROWTH_KEYWORDS` (12 termes, `CRM`/`pipeline` exclus volontairement) — confirmé |
| Piliers de l'architecture de marque | `src/lib/brand/practices.ts` | `pillars = ['BUILD','GROW','OWN']` ; `practices` = build + grow — confirmé |
| LEARN = parcours, pas pilier | `src/lib/brand/company.ts` | `positioning.tracks = ['LEARN','WORK WITH ME']` — confirmé |
| Dates de l'entité | `company.ts` | `incorporatedAt: 2022-04-06`, `registeredAt: 2022-04-11` — le PRD est juste |
| Contradiction CGV art. 3.4 / 5.1 | `src/i18n/locales/fr/legal.json` | `art3.item4` porte 19 900 ; `art5.sub51Body` renvoie au prix affiché — toujours ouverte |
| CGV couvrant `/agence` ou `/presence-digitale` | `legal.json` (balayage complet) | aucune occurrence — confirmé absent |
| Clause de version faisant foi | `legal.json` | aucune — confirmé absent |
| Free Money aux CGV | `legal.json` art. 5.2 | présent — FR-098 fondée |
| Renouvellement automatique du Club | `functions/src/*.ts`, `payment.ts`, `useClubData.ts` | `autoRenew` **stocké et affiché**, aucune fonction planifiée de renouvellement ni de préavis à J−15 — promesse contractuelle non tenue |
| Historique d'abonnement Club | `useAdminClub.ts` l. 394-403, `payment.ts` l. 300 | `club_subscriptions/{uid}` écrasé au renouvellement — M-01 non calculable en l'état |
| Réalisations `/agence` | `Agence.tsx`, `ClientWorkIndex.tsx`, `VentureCard.tsx`, `SitePreview.tsx` | 12 projets clients + 3 ventures, deux composants et deux grilles distincts, aperçus live via `s.wp.com/mshots` et `api.microlink.io` — non spécifié au PRD |
| Nombre de tests de règles | `tests/firestore-rules/rules.test.ts` | 43 — le PRD est juste, `LEGAL-TODO` (29) est daté |
