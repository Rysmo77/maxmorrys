---
title: "Revue adversariale — PRD Plateforme Max-Morrys"
type: cynical-review
target: prd.md + addendum.md + research-*.md
reviewed: 2026-08-29
posture: lecture hostile, simulation de due diligence
---

# Revue adversariale — PRD Plateforme Max-Morrys

## Verdict

**La Partie A est solide et vérifiable ; la Partie B est un inventaire de lucidité qui se fait
passer pour un plan. Le document ne se ferait pas démonter sur ce qu'il affirme du produit — il
se ferait démonter sur ce qu'il ne mesure pas, sur deux « faits » dont l'arithmétique change de
base au milieu du paragraphe, et sur une politique de confidentialité qui déclare un consentement
que le produit ne recueille pas.**

Le document a un défaut de structure profond : il a résolu le problème des chiffres faux en
supprimant *tous* les chiffres, y compris ceux qu'il pouvait produire. Résultat, un PRD destiné à
un investisseur qui ne contient ni utilisateur payant, ni transaction, ni audience, ni marge —
et qui conserve pourtant les conclusions stratégiques que ces chiffres étaient censés soutenir.

---

## Méthode de cette revue

Le PRD affirme en §0 que « chaque exigence [de la Partie A] est *constatée dans le code* ». J'ai
testé l'affirmation par échantillonnage direct dans le dépôt plutôt que de la croire. Les
vérifications sont citées dans l'attaque n°9. **Elles sont majoritairement concluantes** — ce qui
n'est pas une bonne nouvelle pour le document : quand vingt affirmations sur vingt-deux tiennent,
les deux qui glissent coûtent plus cher que si l'ensemble avait été flou.

---

## Les cinq attaques qui tuent

| # | Attaque | Sévérité |
|---|---|---|
| A-01 | La politique de confidentialité publiée affirme un consentement newsletter qui n'existe pas. Le PRD sous-qualifie son propre R-04 | **Critique** |
| A-02 | Aucun chiffre de traction. Zéro utilisateur payant, zéro revenu, zéro audience, dans un document destiné à un investisseur | **Critique** |
| A-03 | D-01 et UJ-3 changent de base de calcul en cours de paragraphe : le « fait » central de la ligne TPE est sous-évalué de 4 à 5 points | **Critique** |
| A-04 | Le moat n°2 (« distribution propriétaire ») survit à la mort de sa preuve : les chiffres qui le soutenaient sont retirés en D-03, la conclusion reste en §1 | **Critique** |
| A-05 | §4 est intégralement `[ASSUMPTION]` et sept exigences non taguées en dérivent sans hériter du tag | **Critique** |

---

## A — Ce que le PRD présente comme des faits et qui sont des inférences

### A-01 — La politique de confidentialité déclare un consentement que le produit ne recueille pas `Critique`

> **R-04** — « **Newsletter sans consentement explicite** — ni case, ni lien de politique, ni
> preuve conservée | Conformité | FR-083 »

Le PRD décrit cela comme une **absence**. Ce n'en est pas une. Vérification dans le dépôt :

- `src/i18n/locales/fr/legal.json:65` — « Envoi de newsletters (**avec votre consentement**) »
- `src/i18n/locales/en/legal.json:65` — « Sending newsletters (**with your consent**) »

Le site **publie**, en français et en anglais, dans un document juridique opposable, une
déclaration de traitement fondée sur un consentement que le PRD reconnaît ne pas collecter. La
catégorie n'est pas « fonctionnalité manquante » mais « déclaration inexacte dans une politique de
confidentialité ». Un conseil en due diligence classe cela avant tout le reste du §9.

Le PRD est par ailleurs muet sur la question qui suit immédiatement : **que devient la base déjà
collectée sans consentement ?** FR-083 ne parle que du formulaire futur.

**Ce qui la désamorce.** Requalifier R-04 en « divergence entre la politique de confidentialité
publiée et le traitement réel ». Étendre FR-083 en trois volets : (a) le formulaire, (b) la
correction du texte publié FR *et* EN, (c) le sort de la base existante — re-consentement ou
purge, décidé et daté. Tant que (b) et (c) manquent, FR-083 traite le symptôme visible et laisse
l'exposition juridique intacte.

### A-02 — Le document ne contient aucun chiffre de traction, et n'explique pas pourquoi `Critique`

> §0 — « Il décrit un produit **déjà en production**, pas un projet. »
> Addendum §9 — « Le modèle financier à cinq ans […] vivent dans `BUSINESS_PLAN.md`. **Le PRD
> n'en reprend aucun chiffre** : ils dépendent d'hypothèses de prix et de conversion que la
> recherche a établies comme non validées. »

L'argument est correct pour des *projections*. Il est appliqué, par glissement, à des *constats*.
Résultat : dans un PRD de 739 lignes destiné à « investisseur, associé, développeur à recruter »,
on ne trouve nulle part le nombre de comptes créés, d'acheteurs, de transactions Bictorys
réussies, de membres actifs du Club, de requêtes Rysmo servies, de sessions organiques.

Ces nombres ne sont pas des hypothèses de marché. **Ils sont dans Firestore**, la plateforme est
en production depuis assez longtemps pour que D-03 discute d'un écart entre « 50+ étudiants
affichés » et « 1 486 revendiqués » — donc l'ordre de grandeur réel est connu de l'auteur.

En réunion, la première question n'est pas « quel est votre SAM ». C'est « combien de personnes
vous ont payé le mois dernier, et combien vous en ont repayé ». Le document n'y répond pas, et
son refus est formulé de façon à ressembler à de la rigueur.

**Ce qui la désamorce.** Une section « État mesuré au 29/08/2026 », adossée aux agrégats serveur
que FR-060 décrit déjà comme existants : comptes, acheteurs uniques, transactions et volume,
membres Club actifs, taux de complétion réel (que FR-069 exige de toute façon), sessions
organiques. Même faibles. **Le refus de publier un chiffre faux n'autorise pas à taire un chiffre
vrai qu'on peut lire en base.** Un document sans traction se lit comme un document qui la cache.

### A-03 — La base de calcul change au milieu du paragraphe, dans les deux arguments phares `Critique`

C'est l'erreur la plus concrètement démontable du document, et elle frappe le « fait » qui ouvre
la Partie B.

**En UJ-3 :**

> « elle compare […] un site à 400 000 francs une fois […] à **2 475 000 francs sur la première
> année**. Facteur six apparent. Et son commerce, à 1,2 million de CA mensuel, consacrerait
> **14,6 % de son chiffre d'affaires** à ce poste. »

Les deux nombres ne parlent pas de la même chose. 14,6 % = 175 000 / 1 200 000 — c'est le
**retainer mensuel seul**. Mais le coût que la phrase précédente vient d'établir est 2 475 000 sur
douze mois, soit **17,2 %** du chiffre d'affaires annuel (2 475 000 / 14 400 000). La frais
d'installation de 375 000 disparaît entre deux phrases.

**En D-01 :**

> « L'accompagnement Croissance à 175 000 FCFA par mois, appliqué au plancher déclaré de la cible
> […] représente **21,9 % de ce chiffre d'affaires**. »

Même omission : 175 000 / 800 000 = 21,9 %, correct pour le retainer seul, mais la première année
réelle est 2 475 000 / 9 600 000 = **25,8 %**. Et le seuil de bascule annoncé (« la formule ne
redevient soutenable qu'au-delà d'environ 2 millions de FCFA de CA mensuel, où elle retombe sous
9 % ») est calculé sur la même base tronquée : première année incluse, à 2 M de CA mensuel, on est
à 10,3 %, pas sous 9 %.

L'ironie est que **l'erreur va contre l'auteur** : la version correcte renforce D-01 et rend
l'option « Segmenter » encore plus évidente. Mais un lecteur qui recalcule et trouve un écart ne
se demande pas dans quel sens il penche — il se demande ce qu'il doit recalculer d'autre.

Second problème dans le même bloc : le repère de contrôle.

> « les fourchettes usuelles tournent autour de **7 à 16 % du chiffre d'affaires annuel**. »

Le PRD présente ce repère sans source. `research-agence-tpe.md:87` précise l'origine : « 7–16 % du
CA *annuel* pour les **PME françaises** ». Le PRD écrit en §8 : « Les cibles doivent être posées
[…] **pas empruntées à des repères occidentaux**. » **D-01 applique exactement la méthode que §8
interdit**, et efface la mention qui l'aurait signalé.

**Ce qui la désamorce.** Trois corrections mécaniques. (1) Fixer une base unique — coût première
année sur CA annuel — et recalculer les quatre pourcentages. (2) Restituer la population du repère
7–16 % ou le retirer : la contradiction interne entre la grille et le plancher ICP déclaré tient
toute seule, sans benchmark étranger. (3) Reformuler §8 ou D-01, l'un des deux ment sur la
méthode.

### A-04 — Le moat n°2 survit à la mort de sa preuve `Critique`

> §1 — « 2. **Une distribution propriétaire gratuite** — blog, podcast, chaîne vidéo,
> référencement — qui **supprime le coût d'acquisition payé** et alimente les cinq lignes depuis
> une seule audience. »

C'est l'un des deux piliers autour desquels le PRD déclare être construit. Il n'est adossé à
**aucun chiffre dans tout le document** : ni audience, ni sessions, ni abonnés podcast, ni
positions, ni un seul CAC comparé.

Or D-03 établit que les deux seuls chiffres qui soutenaient publiquement cette affirmation
(« +340 % (accueil) vs +1 790 % (À propos) de croissance de trafic ») se contredisent entre eux
sur le même site. Le PRD retire correctement les chiffres — **et conserve la conclusion qu'ils
étayaient**, promue au rang de moat structurant.

C'est le mécanisme classique que la revue cherche : l'inférence déguisée en fait. « Supprime le
CAC payé » est une affirmation testable ; en l'absence de toute mesure, elle signifie seulement
« nous ne dépensons pas en publicité », ce qui n'est pas un moat mais une contrainte de trésorerie.

**Ce qui la désamorce.** L'addendum §1 liste GA4, GTM, Search Console implicite, Sentry,
web-vitals : les données existent. Trois nombres suffisent — sessions organiques mensuelles,
part du trafic non payé, coût d'acquisition d'un acheteur. À défaut, rétrograder le moat n°2 en
`[ASSUMPTION]` au même titre que les parcours. **Un moat non mesuré est une intention.**

### A-05 — §4 est `[ASSUMPTION]`, sept exigences en dérivent sans l'être `Critique`

> §0 — « Un PRD de lancement dont les personas sont déduits plutôt qu'observés est vulnérable ;
> leur validation est le premier travail à faire sur ce document. »

Le PRD identifie que sa section 4 entière n'est pas fondée, l'écrit en gras, et la publie quand
même en position d'ouverture, avec des protagonistes nommés, des âges, des métiers, des chiffres
d'affaires et des pourcentages précis. **Déclarer une limite n'est pas la traiter.**

Le coût n'est pas rhétorique. Des exigences non taguées en dérivent directement :

| Exigence | Justification unique |
|---|---|
| FR-076, FR-077 | « voir UJ-2 » — un parcours `[ASSUMPTION]` |
| FR-079 | l'ancrage décrit en UJ-3 — `[ASSUMPTION]` |
| NFR-05 | « Le parcours doit survivre à une session interrompue » — formulation reprise mot pour mot d'UJ-1 |
| NFR-11 | « pour un opérateur unique (UJ-4) » |
| M-11 | « C'est l'intervalle où se joue le remords d'achat » — assertion d'UJ-1 |

Une exigence dont la seule justification est un parcours tagué hérite du tag. Aucune ne le porte.
Q-01 dit que §4 est « bloquant pour : **tout le document** » — c'est exact, et c'est précisément
la raison pour laquelle le document ne devrait pas être diffusé dans cet état.

**Ce qui la désamorce.** Deux options honnêtes. Soit §4 sort de la version diffusée et devient une
annexe de travail. Soit il reste, et le PRD publie la liste explicite des exigences qui tombent si
Q-01 est infirmée. La troisième voie — publier et espérer que le lecteur crédite l'aveu — est
celle actuellement choisie, et c'est la seule qui ne survit pas à une lecture attentive.

---

## B — Où le PRD se félicite au lieu de traiter

### B-01 — R-08 : « Aucun traitement à ce stade » sur le risque de valorisation n°1 `Critique`

> **R-08** — « **Le fondateur est à la fois le moat et le point de rupture.** La marque n'est ni
> cessible ni délégable […] | Continuité, valorisation | **Aucun traitement à ce stade — à assumer
> explicitement devant un investisseur** »

C'est la seule ligne du tableau des risques dont la case *Traitement* est vide, et c'est celle qui
décide de la valeur de cession. « À assumer explicitement » est une posture, pas un traitement.

Pire, §3 **aggrave délibérément** le risque et le présente comme un atout :

> « **Le système de voix est un actif produit, pas une préférence esthétique.** […] *Je suis
> Max-Morrys · Je te forme · Je t'informe · Je te transforme* […] **Toute exigence de ce PRD s'y
> conforme.** »

Le PRD élève au rang de contrainte normative sur toutes les exigences futures la caractéristique
même qui rend l'entreprise non transférable. Un repreneur lit : l'actif est indissociable d'une
personne, et le document formalise cette indissociabilité comme une règle.

Ce que le PRD ne dit nulle part et qui sera demandé : **qui détient la marque « Max-Morrys »** ?
Une personne physique ou MY ONOMA SARL ? Existe-t-il une cession de droits ? À qui appartiennent
la chaîne YouTube, le flux Spotify, la liste e-mail ? Sans réponse, R-08 n'est pas un risque de
continuité, c'est un défaut de titre sur l'actif principal.

**Ce qui la désamorce.** Trois traitements chiffrables, aucun exotique : (a) l'inventaire de
propriété — marque, comptes, audiences — et le contrat qui les rattache à la société ; (b) un plan
de dé-personnalisation partielle du contenu evergreen (quel pourcentage du catalogue reste
diffusable sans le fondateur à l'écran) ; (c) une clause de continuité. Ensuite seulement,
« assumer » devient une position tenable.

### B-02 — §2.2 : huit trous, deux jalons `Élevée`

> « **Conséquence assumée.** Tout ce qui touche au prix et à la demande entre dans ce PRD comme
> hypothèse à valider. »

Le tableau de §2.2 est le meilleur passage du document sur le plan intellectuel et le plus faible
sur le plan opérationnel. Huit lignes « Inconnue / Non sourcé / Angle mort total / Zéro donnée /
Le trou principal ». Deux jalons proposés : FR-072 (test de prix) et FR-081 (entretiens TPE).

**Six trous restent sans aucun jalon** : WhatsApp, Google Business Profile, diaspora, salaire
moyen, prix transactés, churn local. Le document note lui-même que « deux tunnels de vente en
dépendent » pour WhatsApp — et n'en tire rien. FR-049 fait basculer le tunnel TPE sur WhatsApp,
UJ-1 fait arriver l'apprenante par un groupe WhatsApp : deux mécaniques de conversion reposent sur
une pénétration que la recherche déclare introuvable en source primaire, et aucune exigence ne
prévoit de mesurer le canal réel d'arrivée.

L'ensemble des huit trous porte sur **la demande et le prix**, c'est-à-dire sur la totalité du
modèle de revenu. Traduit dans la langue d'un comité : ce document sait tout du produit et rien du
marché.

**Ce qui la désamorce.** Une colonne de plus au tableau de §2.2 : *jalon de levée du doute*, ou
*risque explicitement accepté*. Un trou sans jalon doit être marqué accepté, pas seulement
constaté — sinon le tableau mesure l'honnêteté de l'auteur au lieu de piloter le risque. Et
FR-068, qui instrumente déjà le tunnel, doit inclure la source d'arrivée : c'est le seul moyen
gratuit de sortir du trou WhatsApp.

### B-03 — D-03 n'est pas une décision, c'est une tâche `Moyenne`

> « **Ce que cela impose.** […] Chaque chiffre doit être sourcé, corrigé, ou retiré. **Il n'y a pas
> de quatrième option.** »

Exact — et c'est bien le problème. Une chose qui n'a qu'une seule issue n'est pas une décision.
D-03 occupe un tiers de la section « Les trois décisions bloquantes » pour dire qu'il faut arrêter
d'afficher des chiffres faux. Sa présence sert surtout à faire dire au document qu'il est lucide.

Pendant ce temps, D-02 — qui a réellement trois issues incompatibles et engage le modèle
économique d'une ligne entière — n'obtient **aucune recommandation**, alors que D-01 en obtient une.

**Ce qui la désamorce.** Sortir D-03 des décisions et en faire une checklist bloquante de
pré-diffusion, datée, avec un responsable. Et donner à D-02 une recommandation, comme à D-01 :
le prépaiement semestriel remisé est la seule des trois options qui ne dépende ni d'un rail
inexistant ni d'un recouvrement manuel imputé à UJ-4. Un document qui recommande sur la décision
facile et se tait sur la difficile s'entend.

### B-04 — `[À SOURCER]` est défini et jamais utilisé `Moyenne`

> §0 — « | `[À SOURCER]` | Chiffre actuellement affiché ou revendiqué sans source. Ne pas publier
> en l'état | »

Occurrences de ce marqueur dans le reste du document : **zéro**. Alors que D-03 recense six
chiffres qui correspondent exactement à sa définition. Un appareil méthodologique annoncé en tête
et non employé est la première chose qu'un lecteur méthodique va tester — et il la teste par
`Ctrl+F`.

**Ce qui la désamorce.** Trente secondes de travail : taguer les six chiffres de D-03, ou retirer
la ligne du tableau des marqueurs.

---

## C — Raisonnements circulaires

### C-01 — FR-080 : une exigence qui se rétracte dans son propre énoncé `Élevée`

> **FR-080** — « **Différencier la grille par ville.** Les trois capitales n'ont ni la même
> pénétration Internet, ni les mêmes prix affichés. `[ASSUMPTION]` *Les écarts observés dans les
> sources sont probablement un artefact d'échantillon — d'où FR-081 avant toute décision.* »

L'exigence dit : fais X. Puis, dans la même puce : la donnée qui justifie X est probablement
fausse, ne fais rien avant FR-081. Ce n'est pas une exigence, c'est un doute mis au format
exigence.

La circularité est complète en remontant à la source. `research-agence-tpe.md:124` conclut :
« **Ne pas appliquer une grille unique aux trois capitales sur cette seule base.** » La recherche
ne dit pas « différenciez » — elle dit que la donnée ne permet ni de différencier ni d'unifier.
Le PRD convertit une abstention documentaire en instruction produit.

**Ce qui la désamorce.** FR-080 n'est pas une exigence de la phase suivante, c'est une option
conditionnelle à la sortie de FR-081. Le rétrograder en question ouverte, ou le réécrire :
« décider, à la sortie de FR-081, si la grille se différencie par ville ». Une exigence qu'on ne
peut pas commencer à implémenter n'en est pas une.

### C-02 — R-11 : un risque tagué `[ASSUMPTION]` dans sa case traitement `Moyenne`

> **R-11** — « Le B2C edtech africain se rétracte vers le B2B […] | Marché | `[ASSUMPTION]` —
> évaluer une ligne B2B, déjà envisagée en An 4–5 dans le plan »

Le risque, lui, est sourcé (HolonIQ, cohorte 2025). C'est le *traitement* qui est marqué
`[ASSUMPTION]` — ce qui n'a pas de sens : un traitement est décidé ou ne l'est pas. Et §10 exclut
explicitement la ligne B2B du périmètre, tout en précisant que « R-11 en recommande l'évaluation
anticipée, ce qui n'est pas la même chose que la livrer ». Le document se répond à lui-même en
trois endroits sans jamais trancher.

**Ce qui la désamorce.** Le traitement de R-11 est soit « accepté, non traité dans cette phase »,
soit une exigence numérotée en Partie B. Le marqueur `[ASSUMPTION]` n'a rien à faire dans une
colonne *Traitement*.

---

## D — Décisions présentées comme tranchées qui ne le sont pas (et l'inverse)

### D-01 — « Cinq lignes monétisées » : deux d'entre elles ne le sont pas par la plateforme `Élevée`

> §1 — « Elle est en production, bilingue FR/EN, et **monétisée par cinq lignes distinctes** :
> […] une offre de présence digitale pour les commerces de proximité, et une practice d'agence
> high-ticket. »

La Partie A elle-même contredit cette symétrie. `/agence` (FR-053 à FR-056) et
`/presence-digitale` (FR-046 à FR-052) ne produisent **aucune transaction dans le produit** :
un formulaire, un devis partageable, un statut de prospect, puis « la conversation bascule sur
WhatsApp » (FR-049). Aucun encaissement, aucun webhook, aucun écran de facturation rattaché.

Trois lignes sont encaissées par la plateforme (formations, Club, Rysmo). Deux sont des tunnels de
génération de leads pour une prestation de service humaine facturée hors produit.

La conséquence est directement mesurable sur §8 : **M-04 « Revenu par ligne de service » n'est pas
calculable** pour deux lignes sur cinq avec les données du produit. Sa contre-métrique
(« concentration du revenu sur une seule ligne ») non plus.

**Ce qui la désamorce.** Distinguer en §1 « lignes encaissées dans le produit » et « lignes
servies hors produit », et dire où le revenu de ces dernières est enregistré. Sans cette
distinction, un investisseur conclut de lui-même que le produit porte trois lignes et que deux
sont du consulting avec une page d'atterrissage — conclusion qu'il vaut mieux formuler soi-même.

### D-02 — Le moat n°1 est une intégration achetée chez un prestataire unique `Élevée`

> §1 — « 1. **Le paiement en monnaie électronique locale, nativement.** […] Wave, Orange Money et
> Free Money […] **sont** le marché. Skool, Kajabi et Circle ne les servent pas. »

Le diagnostic de marché est le passage le mieux sourcé du document (BCEAO, GSMA). La conclusion
concurrentielle ne suit pas. Ce moat n'est pas propriétaire : l'addendum §1 dit
« Paiement | **Bictorys uniquement** ». C'est une intégration, achetée chez un prestataire, que
n'importe quel concurrent achète au même prix en quelques semaines.

Et le PRD nomme son propre contre-exemple deux pages plus loin, sans le relever :

> §2.1 — « infrastructure pour créateurs (**Chariow — 0 € d'abonnement, ~15 % de commission
> dégressive, mobile money natif**) »

Un acteur régional fait déjà exactement ça, à zéro coût fixe pour le créateur. La barrière contre
Skool/Kajabi existe ; la barrière contre Chariow n'existe pas, et Chariow est cité dans le même
document comme « concurrent d'infrastructure direct » par la recherche (`research-comparables.md:18`).

Corollaire absent du §9 : **il n'y a aucun risque « dépendance à un prestataire de paiement
unique »**. Un seul PSP, en monoculture, sur la totalité du revenu encaissé, sans plan de
repli mentionné.

**Ce qui la désamorce.** Ajouter R-14 (dépendance Bictorys : rupture de service, révision
tarifaire, conformité, et le fait que FR-018 — « le point le plus rigoureux du système » — est
couplé à un format de webhook propriétaire). Et reformuler le moat n°1 : ce qui est difficile à
copier n'est pas l'acceptation de Wave, c'est le catalogue en français ouest-africain adossé à une
audience — sous réserve de A-04, qui exige de la mesurer.

### D-03 — NFR-07 rassure, l'addendum inquiète, sur le même objet `Élevée`

> **NFR-07 — Sécurité et cloisonnement.** « **Les règles Firestore sont testées sous émulateur.** »
> **FR-088** — « Placer les **tests de règles Firestore dans les prérequis du déploiement**. Ils
> s'exécutent en intégration continue mais hors de la chaîne bloquante : **des règles peuvent
> partir sans que leurs tests soient verts.** »
> **R-12** — « Règles, index, fonctions et Workers sont **construits mais jamais déployés** par
> l'intégration continue | **Exploitation** | »

Combinés, ces trois passages disent : les règles de sécurité d'une base de **46 collections**
contenant des données personnelles, des transactions et des devis clients sont déployées à la
main, par une seule personne, sans que leurs tests bloquent quoi que ce soit.

Ce n'est pas de l'« Exploitation ». C'est de la sécurité et de la conformité. Et NFR-07, qui est
en Partie A et donc présentée comme un fait rassurant, est formellement vraie et
opérationnellement creuse : les tests existent, ils ne gardent rien.

Le PRD range ce risque au douzième rang sur treize.

**Ce qui la désamorce.** Reclasser R-12 en risque de sécurité. Reformuler NFR-07 : « testées sous
émulateur, **mais hors chaîne bloquante — voir FR-088** ». Et donner un fait vérifiable qui coûte
une commande : la date du dernier déploiement de règles et la couverture actuelle des tests.
C'est le genre de précision qui rachète une faiblesse en montrant qu'elle est tenue.

### D-04 — NFR-11 est énoncée puis violée par la section qui la suit `Élevée`

> **NFR-11 — Coût opérationnel humain.** « Toute fonctionnalité nouvelle arrive avec son coût en
> minutes par semaine pour un opérateur unique (UJ-4). **Une fonctionnalité sans réponse à cette
> question n'est pas spécifiée.** »

La Partie B contient **vingt-quatre exigences** (FR-068 à FR-091). **Aucune** ne porte de coût en
minutes par semaine. Aucune ne porte d'effort, de priorité, de dépendance ou de séquence.

Par sa propre définition, la totalité de la Partie B n'est pas spécifiée.

C'est aussi la question que pose immédiatement le lecteur destinataire : dans quel ordre, en
combien de temps, avec qui. §10 « Hors périmètre » exclut six choses et jamais celle qui manque
vraiment — un plan de charge. Le document est destiné entre autres à « un développeur à recruter »
et ne dit ni pour quoi faire, ni à quel horizon, ni financé comment.

**Ce qui la désamorce.** Une colonne *coût* et un ordonnancement en trois vagues suffisent, et
n'exigent aucune donnée nouvelle : (1) pré-diffusion bloquant — D-03, FR-083, FR-084, FR-085 ;
(2) mesure — FR-068 à FR-071, préalable déclaré à tout le reste ; (3) le solde, après D-01 et
D-02. Sans cet ordonnancement, les 24 exigences se lisent comme une liste de souhaits, ce qui
décrédibilise rétroactivement la rigueur de la Partie A.

---

## E — Métriques : élégantes, partiellement inapplicables

### E-01 — M-03 : une contre-métrique structurellement toujours nulle `Élevée`

> **M-03** | Taux de complétion réellement mesuré | **Certificats émis sans progression
> substantielle** | « Un certificat facile gonfle la complétion et détruit sa valeur »

Vérification dans le code : **FR-024** — « **À 100 % de progression**, un certificat est émis par
traitement serveur ». Un certificat ne *peut pas* être émis sans progression : la contre-métrique
mesure une quantité qui vaut zéro par construction. Elle est inerte.

Le risque réel que l'auteur vise — un certificat obtenu trop facilement — existe, mais il se
mesure autrement : par la **vitesse**. Un cours de six heures complété en dix-huit minutes de
lecteur est le signal cherché.

**Ce qui la désamorce.** Remplacer la contre-métrique de M-03 par « délai entre inscription et
100 %, et temps de lecteur cumulé rapporté à la durée du cours ». FR-022 suit déjà la progression
leçon par leçon : la donnée existe.

### E-02 — Deux contre-métriques sans mécanisme dans le produit `Élevée`

- **M-02** contre-métrique : « **Taux de remboursement et de litige** ». Le mot *remboursement*
  n'apparaît dans aucune des 67 exigences de la Partie A. Vérification dans le dépôt : le terme
  n'existe que dans `src/lib/mockData.ts` et `src/pages/admin/AdminTransactions.tsx`. **Il n'y a
  pas de procédure de remboursement dans le produit** — donc pas de taux à mesurer, et par ailleurs
  une question de conformité aux CGV que le PRD n'aborde pas.
- **M-01** contre-métrique : « **Charge de support par membre actif** » — présentée en §4 comme
  « une contre-métrique de premier rang ». Aucune exigence ne mesure le temps de support. FR-057
  liste un écran *messages*, ce qui n'est pas un chronomètre.

**Ce qui la désamorce.** Chaque contre-métrique non instrumentée exige sa propre FR en Partie B,
ou sort du tableau. Onze couples dont trois ne sont pas mesurables affaiblissent le principe
énoncé en tête de §8 — « Une métrique sans sa contre-métrique n'est pas pilotable » — en le
retournant : une contre-métrique sans instrument n'est pas une contre-métrique.

### E-03 — Trois NFR sans seuil ne sont pas opposables `Moyenne`

> **NFR-04 — Sobriété des données.** « Le poids en mégaoctets d'une page et d'un cours est une
> contrainte de conception, pas une optimisation. […] *Toute exigence nouvelle porte son budget en
> poids.* »

Aucun budget n'est donné, et aucune mesure actuelle non plus. Idem NFR-05 (« un appareil d'entrée
de gamme » — lequel ?) et NFR-12 (« Les métriques de performance web sont collectées » — avec
quelle cible ?). Ces NFR seront invoquées en revue de conception et ne trancheront jamais rien.

C'est d'autant plus dommage que NFR-04 est le meilleur argument produit du document : la
justification ITU (4,2 % du RNB par habitant) est solide, primaire, et pertinente.

**Ce qui la désamorce.** Trois nombres, mesurables aujourd'hui puisque `web-vitals` est branché
(addendum §1) : poids maximal d'une page publique, poids maximal d'une leçon, LCP cible sur un
appareil et un réseau de référence nommés. Une NFR chiffrée vaut dix NFR bien écrites.

---

## F — Crédibilité de « constaté dans le code »

### F-01 — L'affirmation tient à l'échantillonnage, ce qui rend les écarts plus coûteux `Moyenne`

J'ai testé directement la Partie A. Résultat : **elle est honnête**, et c'est le principal actif du
document.

| Affirmation | Vérification |
|---|---|
| « 46 collections Firestore » | 46 blocs `match` uniques dans `firestore.rules` ✔ |
| « 23 espaces de noms de traduction » | 23 fichiers dans `src/i18n/locales/fr/` ✔ |
| « trois applications Cloudflare Workers » | `worker/apps/{site,api,media}` ✔ |
| « ~45 fonctions Cloud v2 » | 46 symboles exportés dans `functions/src/index.ts` ✔ |
| FR-030 — 19 900 FCFA, miroirs serveur | `src/lib/club/pricing.ts`, `functions/src/payment.ts:249`, `worker/apps/api/src/lib/bictorys.ts:123` ✔ |
| FR-020 — parrainage 15 % côté serveur | `functions/src/payment.ts:256` ✔ |
| FR-040 — quotas 2 / 5 / 20 / 100 | `functions/src/rysmo.ts:23-25` ✔ |
| FR-041 — packs 500 / 1 500 / 3 500, Lite 3 000, Pro 7 500 | `functions/src/payment.ts:341-348`, côté serveur ✔ |
| FR-047 — `floorPrice` jamais affiché | `src/lib/presence/offer.ts:62-64` ✔ |
| FR-007 — groupe témoin des pop-ups | `src/lib/popups/variant.ts`, `settings.ts` ✔ |
| NFR-09 — 2,6:1 interdit pour du texte | `tailwind.config.js:130` ✔ |
| FR-065 — aucune chaîne accentuée en dur | 0 occurrence dans `src/pages` ✔ |
| Addendum §2 — CGV alignées à 19 900, FR **et** EN | `legal.json:127` FR et EN ✔ |

**Mais deux écarts ressortent d'autant plus.**

1. **FR-057 annonce vingt écrans et en énumère dix-neuf.** Le vingtième fichier du répertoire
   `src/pages/admin/` est `AdminPlaceholder.tsx`. Le PRD compte un fichier vide comme un écran
   livré, dans une section dont tout l'argument est « constaté, pas souhaité ».
2. **FR-047 décrit la grille TPE de façon incomplète** alors qu'il se prévaut d'une « source de
   vérité unique » : `src/lib/presence/offer.ts:62` porte un `promoPrice: 250_000` sur le pack
   Présence que le PRD ne mentionne pas. Le prix effectivement pratiqué du pack d'entrée est
   250 000, pas 295 000 — ce qui déplace au passage l'argument d'ancrage de UJ-3 et de D-01.

**Ce qui les désamorce.** Corriger les deux (« dix-neuf écrans », et mentionner le prix
promotionnel), puis **dater le constat** : la Partie A devrait porter le SHA du commit sur lequel
elle a été vérifiée. C'est trivial à produire et cela répond d'avance à Q-03.

### F-02 — Les formulations qui trahissent la paraphrase plutôt que la lecture `Moyenne`

Plusieurs exigences décrivent une périodicité sans jamais la donner :

> FR-003 — « synchronisées **périodiquement** »
> FR-027 — « reconstruit par lot, **à intervalle régulier** »
> FR-039 — « régénérée **à intervalle de requêtes** »
> FR-052 — « Les devis expirés sont purgés **automatiquement** »

Ce sont exactement les endroits où un auditeur soupçonne que l'auteur a vu qu'un `onSchedule`
existait sans lire son cron. Le dépôt contient quinze `onSchedule` : les valeurs sont à portée de
`grep`.

**Ce qui les désamorce.** Remplacer chaque intervalle vague par sa valeur, ou renvoyer
explicitement à l'addendum. Un PRD qui écrit « toutes les six heures » est cru sur le reste ; un
PRD qui écrit « périodiquement » quatre fois invite à vérifier les quatre-vingt-sept autres.

### F-03 — FR-016 : « sans exception » est démenti par l'addendum `Moyenne-Élevée`

> **FR-016** — « **Le prix débité est toujours relu côté serveur** […] Cette règle vaut **sans
> exception** pour les formations, le Club et Rysmo. »
> Addendum §4 — « Une exception connue : **la charge d'abonnement au Club est implémentée dans le
> Worker mais absente de la liste de préversion.** »
> **FR-089** — les tests « **ne peuvent pas atteindre les miroirs serveur** ».

Il existe donc deux implémentations serveur du prix du Club, dont une inactive et non testée, et
rien ne détecte leur divergence. J'ai vérifié qu'elles sont aujourd'hui alignées à 19 900 — mais
c'est un constat instantané, pas une garantie. « Toujours » et « sans exception » sont vrais
aujourd'hui et invérifiables demain, et le document possède ailleurs le récit de ce qui arrive
quand un miroir dérive (CGV à 10 000 pendant des mois).

**Ce qui la désamorce.** « Relu côté serveur dans chacune des deux implémentations, dont l'une
n'est pas encore active ; FR-089 doit rendre leur divergence détectable **avant** toute bascule. »
Le fait devient plus fort en devenant précis.

---

## G — Ce que le PRD ne dit pas, et qui sera demandé dans les dix premières minutes

Par ordre de probabilité de survenue en réunion :

1. **Combien de clients payants, et combien ont repayé ?** (voir A-02) — aucune réponse.
2. **Qui possède la marque et les audiences ?** (voir B-01) — non traité.
3. **Depuis quand la plateforme est-elle en production, et quel est le revenu cumulé ?** — le
   document ne donne aucune date de mise en ligne. On sait que MY ONOMA SARL est immatriculée le
   11/04/2022 et que des miroirs de prix ont été alignés le 13/08/2026 ; entre les deux, rien.
4. **Combien coûte l'exploitation par mois ?** Firebase, Cloudflare, Gemini, Bictorys, Sentry,
   VPS : NFR-10 pose un principe de marge sur l'IA sans jamais donner un coût unitaire. M-05
   demande de suivre « le coût IA par membre actif » — sa valeur actuelle n'est nulle part.
5. **Que se passe-t-il si Bictorys s'arrête ?** — aucun risque, aucun plan de repli (voir D-02).
6. **Quel est le taux de renouvellement du Club aujourd'hui ?** M-01 le déclare « métrique de
   survie de la ligne » ; FR-071 demande de le mesurer. Le Club existe donc depuis moins de douze
   mois, ou bien la donnée existe et n'est pas donnée. Le document ne tranche pas, et c'est la
   deuxième question de tout investisseur sur une ligne d'abonnement.
7. **Le produit est-il conforme au RGPD ou au régime sénégalais (CDP) ?** FR-012 offre export et
   suppression, une politique de confidentialité existe — mais aucune mention d'une déclaration
   CDP, ni du régime applicable aux utilisateurs européens de la diaspora que FR-075 vise
   explicitement.
8. **Q-02 est en question ouverte.** « Quel lecteur externe précis vise ce PRD ? » Un document qui
   ne sait pas à qui il parle ne peut pas être calibré. Ce n'est pas une question ouverte, c'est un
   préalable de rédaction non tenu — et sa présence en n°2 sur 10 le dit à voix haute.

---

## H — Deux points mineurs mais gratuits à corriger

### H-01 — La « baisse » de la bancarisation est un artefact présenté comme une tendance `Faible`

> §1 — « la bancarisation stricte est de 25,2 % — ***en baisse*** — contre 73,6 % d'inclusion
> financière »

`research-marche-edtech-ao.md:42` donne la cause : « en *baisse* (**fermeture de comptes
dormants**) ». Le PRD conserve la direction alarmante et supprime l'explication technique. C'est un
gain rhétorique d'une demi-ligne pour un risque de crédibilité disproportionné : n'importe quel
lecteur du tableau de bord BCEAO le sait.

**Ce qui la désamorce.** Restituer la parenthèse. L'argument tient sans elle et devient
inattaquable avec.

### H-02 — Le hors-périmètre « recherche plein texte » minimise une dépendance qui a déjà gelé la production `Moyenne`

> §10 — « **La recherche plein texte serveur.** L'intégration existe mais est neutralisée par
> configuration ; un filtrage côté client couvre le besoin. **Ne pas en construire une seconde.** »

`reindexSearch` reste exportée dans `functions/src/index.ts` (commentée « gated par secrets ») —
elle reste donc dans le graphe de déploiement des Cloud Functions. Une fonction dormante dont un
secret manquant peut faire échouer un déploiement entier n'est pas un « non-sujet » : c'est
exactement le genre de dette que R-12 devrait couvrir.

**Ce qui la désamorce.** Une phrase dans R-12 ou NFR-13, ou la suppression de la fonction. Le
présenter comme un choix de périmètre alors que c'est une dépendance latente est le seul endroit
du document où le hors-périmètre sert à cacher quelque chose.

---

## Ce qui tient, et qu'il ne faut pas abîmer en corrigeant

Par honnêteté de revue, et parce que ces points sont ce qui rend le document défendable :

- **La Partie A est vérifiable et vérifiée** (voir F-01). C'est rare et c'est l'actif principal.
- **§2.1 est correctement sourcé en sources primaires** (BCEAO, ITU, GSMA, DataReportal) et le
  piège ARTP à 125,78 % est désamorcé explicitement. Un lecteur averti le remarquera en faveur du
  document.
- **FR-018 et NFR-02** (dédoublonnage, contrôle de montant, effets avant marquage) décrivent une
  discipline réelle dans le code et sont formulés en contrainte durable, pas en constat.
- **FR-050 / NFR-08** (séparation des données de devis, imposée par les règles) est un vrai point
  de conception, et le PRD a raison de le signaler.
- **§8, dans son principe**, est la meilleure idée du document. Ce sont trois de ses onze couples
  qui sont défaillants, pas la méthode.
- **NFR-10 et l'alternative écartée de l'IA illimitée** sont une décision d'économie unitaire
  correctement argumentée et adossée à des comparables réels.

---

## Ordre de correction avant toute diffusion externe

**Bloquant — le document ne doit pas sortir avant :**

1. A-01 — corriger la politique de confidentialité publiée (FR/EN) et trancher le sort de la base
   newsletter existante.
2. A-03 — recalculer D-01 et UJ-3 sur une base unique, sourcer ou retirer le repère 7–16 %.
3. D-03 du PRD — les six chiffres publics : sourcés, corrigés ou retirés, et taggés `[À SOURCER]`
   en attendant (B-04).
4. FR-084 — les portraits générés par IA. Sur un site dont R-08 dit que le fondateur *est* l'actif,
   un portrait synthétique est une contradiction visible en trois secondes, pas un détail de
   conformité.
5. A-05 — trancher le sort de §4 : annexe de travail, ou propagation du tag `[ASSUMPTION]` aux sept
   exigences dérivées.

**Avant la première réunion — sinon le document ne répond pas aux dix premières minutes :**

6. A-02 — la section « État mesuré », même modeste.
7. B-01 — l'inventaire de propriété de la marque et des audiences.
8. A-04 — mesurer le moat n°2 ou le rétrograder.
9. D-02 — ajouter R-14 (dépendance Bictorys).
10. D-04 — ordonnancer la Partie B en trois vagues avec un coût par exigence, conformément à
    NFR-11.

**Hygiène — peu coûteux, forte valeur perçue :**

11. F-01 — « dix-neuf écrans », le `promoPrice` de 250 000, et un SHA de commit daté sur la
    Partie A.
12. E-01 / E-02 — refonte de la contre-métrique de M-03, instrumentation ou retrait de celles de
    M-01 et M-02.
13. F-02 / E-03 — remplacer les périodicités vagues par leurs valeurs et donner trois seuils
    chiffrés à NFR-04.
14. C-01 — rétrograder FR-080 en décision conditionnelle à FR-081.
15. H-01 / H-02 — la parenthèse BCEAO, et la dépendance Typesense.

---

## Note finale

Le document ne souffre pas d'un manque de rigueur. Il souffre d'avoir converti sa rigueur en
posture : à plusieurs endroits, énoncer le problème avec précision y tient lieu de l'avoir traité.
C'est visible dans la « réserve majeure » de §0, dans le tableau de §2.2, dans la case *Traitement*
de R-08, et dans une Partie B qui viole la NFR qu'elle vient d'écrire. Un lecteur bienveillant y
verra de l'honnêteté. Un lecteur en due diligence y verra un auteur qui connaît tous les endroits
où le dossier est faible et qui n'en a réparé aucun — ce qui est une position plus difficile à
défendre que l'ignorance.
