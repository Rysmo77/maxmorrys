# Revue externe — lecture due diligence

**Document examiné :** `prd.md` (v. 2026-08-29), `addendum.md`, les trois notes de recherche et
`.memlog.md`.
**Posture :** investisseur early-stage, Afrique de l'Ouest / edtech. Trente minutes. Je cherche
les raisons de dire non.
**Date de la revue :** 2026-08-29.

---

## 1. Réaction à la première lecture

### Où le doute a commencé

Section 1, deuxième phrase :

> « Elle est **en production, bilingue FR/EN, et monétisée par cinq lignes distinctes** : la vente
> de formations à l'unité, une communauté annuelle payante (le Club des Digitos), un assistant
> pédagogique IA (Rysmo) vendu au quota, une offre de présence digitale pour les commerces de
> proximité, et une practice d'agence high-ticket. »

Le doute n'est pas venu de ce qui est écrit là. Il est venu de la collision entre cette phrase et
la règle de preuve que le document s'était donnée quarante lignes plus haut :

> « **Partie A** décrit le produit tel qu'il fonctionne aujourd'hui. Chaque exigence y est
> *constatée dans le code*, pas souhaitée. C'est la baseline. »

Le mot **« monétisée »** ne peut pas être constaté dans le code. Le code prouve qu'un chemin de
paiement existe, jamais qu'il a été emprunté. Le standard de preuve que ce PRD adopte — *tout est
vérifié dans le dépôt* — est précisément le seul standard qui ne peut pas voir du revenu. Le
document ne remarque pas cet angle mort, et il construit son résumé exécutif dessus.

À partir de là, j'ai lu le reste en cherchant un chiffre de traction. Il n'y en a aucun. Pas un
franc, pas un client, pas une transaction, pas une date de première vente. 49 700 caractères,
91 exigences fonctionnelles, 13 NFR, 11 métriques appariées, 13 risques, 10 questions ouvertes —
et zéro unité vendue.

### Où le doute est devenu une objection

§6.1, D-03, dans le tableau des chiffres non sourcés :

> | **50+ étudiants** affichés vs **1 486** revendiqués | Écart d'un facteur 30 |

C'est le seul endroit du document où apparaît un ordre de grandeur d'utilisateurs — et il y
apparaît comme un **défaut à corriger**, pas comme une donnée. Autrement dit : la seule fois où ce
PRD me dit combien de gens utilisent le produit, c'est pour m'expliquer qu'il ne le sait pas à un
facteur 30 près, après six mois de production.

Ce n'est plus un problème de rédaction. Un opérateur qui ne peut pas compter ses propres élèves ne
peut me démontrer aucune des cinq lignes, ni maintenant ni dans six mois — parce que
l'instrumentation qui produirait la démonstration est elle-même reportée en Partie B (FR-068 à
FR-071).

### Trois vérifications que j'ai faites dans le dépôt, et ce qu'elles donnent

Un dossier qui se présente comme « constaté dans le code » m'invite à vérifier dans le code. Je
l'ai fait sur trois points. Les trois changent la lecture.

**a) L'âge réel.** Premier commit : **2026-03-07**. La monétisation (paiement Club, upsell Rysmo,
coupons serveur) arrive le **2026-04-13**. Le produit a donc **six mois**, dont **quatre et demi**
avec une caisse ouverte. Ce n'est écrit nulle part dans le PRD. Ce n'est pas disqualifiant — c'est
même une vitesse d'exécution remarquable pour une personne seule — mais ça recadre tout : je ne
lis pas une plateforme établie qui cherche à passer un cap, je lis un produit de six mois qui n'a
pas encore rencontré son marché. Le PRD, lui, se présente comme le premier.

**b) L'âge des lignes 4 et 5.** L'offre agence high-ticket : commit du **2026-08-13**. La
stratégie de contenu et l'offre agence : **2026-08-06**. Le déplacement de l'offre TPE vers
`/presence-digitale` : **2026-08-13**. Deux des « cinq lignes de revenu » du résumé exécutif ont
**seize jours** à la date du PRD. Et ce sont exactement les deux dont le §6.1 démontre, D-01 et
D-02 à l'appui, qu'elles ne sont ni finançables au bas de leur cible ni encaissables sur leur
marché principal. Le document affirme cinq lignes en page 1 et en démolit deux en page 12, sans
jamais réconcilier les deux affirmations.

**c) Le commit qui aligne le prix du Club** (`5b2ca5c`, 13 août 2026), cité dans l'addendum §2
comme une histoire de dette technique. Son message dit ceci :

> « Les CGV annonçaient 10 000 FCFA/an quand le code en prélevait 19 900, sur un abonnement
> engageant douze mois. […] **Aucun abonné n'était concerné.** »

Cette dernière phrase est la donnée de traction la plus lourde de tout le dossier, et elle est
enterrée dans un message de commit. Le paiement du Club est en ligne depuis le 13 avril. Si aucun
abonné n'était concerné par un prix erroné affiché pendant ce temps, alors le Club — la ligne dont
le PRD fait de M-01 « *la métrique de survie* » — a un dénominateur nul ou proche de nul sur
quatre mois. Le PRD ne le dit pas. Il présente au contraire R-13 comme une inconnue *externe* :

> « **Aucune preuve publique** qu'une communauté annuelle payante à prix élevé tienne durablement
> en Afrique de l'Ouest francophone. »

L'absence de preuve publique n'est pas le sujet. L'absence de preuve *interne* l'est, et elle est
disponible, et elle est passée sous silence.

### Ce que ce doute n'est pas

Je ne doute pas de la qualité de fabrication. Elle est visible et vérifiable, et j'y reviens en
§4. Je doute d'une chose et d'une seule : **ce document décrit une capacité de production de
revenu, et il la présente comme un revenu.**

---

## 2. Les dix questions, dans l'ordre où je les poserais

L'ordre n'est pas thématique. Il est décroissant selon la probabilité que la réponse arrête la
réunion.

---

### Q1 — « Combien de francs cette plateforme a-t-elle encaissés, par ligne, mois par mois, depuis le 13 avril 2026 ? »

**Ce que le PRD répond aujourd'hui : rien.**

Aucun montant, aucune transaction, aucune date de première vente n'apparaît dans les 739 lignes.
FR-021 établit pourtant que « *l'historique des transactions est consultable par l'utilisateur et
réconciliable par l'administration* » : la donnée existe, elle est à une requête. Le PRD prix tout
sauf ce qui est entré en caisse.

C'est ma première question et ce sera toujours ma première question. Une réponse de trois lignes
la traite. Le fait qu'elle ne soit pas anticipée dans un document qui se déclare « *destiné à une
lecture externe — investisseur* » est en soi une information.

---

### Q2 — « Combien de personnes ont payé le Club, depuis l'origine ? Votre commit du 13 août écrit "Aucun abonné n'était concerné". »

**Ce que le PRD répond aujourd'hui : rien — et il détourne la question vers l'extérieur.**

M-01 désigne le taux de renouvellement à 12 mois comme métrique de survie de la ligne. R-13 traite
l'incertitude comme un trou de donnée publique. Les deux supposent une base d'abonnés dont le
document ne produit jamais le nombre, et dont le dépôt suggère qu'elle est nulle sur la période
vérifiable.

Si je me trompe dans ma lecture du commit, une phrase suffit à me corriger, et je l'accepterai
sans réserve. Si je ne me trompe pas, alors M-01 n'est pas une métrique, c'est une intention, et
FR-076/FR-077 (rendre la valeur visible pendant les onze mois de silence) optimisent une rétention
qui n'a jamais eu lieu.

---

### Q3 — « Quel est le prix d'une formation ? »

**Ce que le PRD répond aujourd'hui : rien. Et les documents voisins se contredisent.**

C'est l'anomalie la plus étrange du dossier. Ce PRD chiffre :
- le Club — 19 900 FCFA/an (FR-030) ;
- Rysmo — packs 500 / 1 500 / 3 500, abonnements 3 000 et 7 500 (FR-041) ;
- toute la grille TPE — 295 000 / 495 000 / 895 000, 375 000 + 175 000/mois, 750 000 + 225 000/mois
  (FR-047) ;

et **ne chiffre jamais la formation**. FR-014 dit seulement « *avec prix, prix promotionnel
optionnel* ». R-01 raisonne sur un prix qu'il ne nomme pas : « *Il dépasse un mois de salaire moyen
sénégalais* ».

Or `BUSINESS_PLAN.md` (ligne 44) désigne cette ligne comme « **Cœur du CA (~85 %)** », dans une
fourchette de **95 000–200 000 FCFA**, pendant que la recherche raisonne sur **125 000**. Trois
documents de la même société, trois réponses.

Le PRD publie le prix de tout ce qui pèse 15 % du chiffre d'affaires et tait le prix des 85 %.

---

### Q4 — « Sur cinq lignes, lesquelles deux tournez-vous les six prochains mois, et lesquelles trois gelez-vous ? »

**Ce que le PRD répond aujourd'hui : rien.**

Le §10 « Hors périmètre » exclut une application mobile, une recherche plein texte, une ligne B2B,
une grille tarifaire pour l'agence, l'ouverture de nouveaux pays, l'IA illimitée. Six exclusions,
toutes gratuites — aucune ne coûte un arbitrage. **Aucune ligne de revenu n'est exclue.** La
Partie B, au contraire, s'étend sur les cinq.

R-10 (« Cinq produits, une équipe ») est correctement identifié. NFR-11 institutionnalise la
contrainte. Puis le document ne tire pas la conclusion, qui est arithmétique et non stratégique :
un opérateur unique n'a pas un problème de portefeuille, il a un problème de séquencement.

---

### Q5 — « Vous êtes indisponible 90 jours. Quel revenu survit, et combien ? »

**Ce que le PRD répond aujourd'hui : rien, et il le dit explicitement.**

> R-08 — « **Le fondateur est à la fois le moat et le point de rupture.** La marque n'est ni
> cessible ni délégable, et plafonne le volume de communauté animable » → traitement : « **Aucun
> traitement à ce stade — à assumer explicitement devant un investisseur.** »

Je développe ma lecture de cette ligne en §3, point 7. En réunion, je ne demande pas une solution.
Je demande une frontière : quelle part du revenu continue de tomber sans vous, et ce que coûterait
de rendre le Club animable par quelqu'un d'autre.

---

### Q6 — « FR-072, le test de prix : quel protocole, quel volume, quelle durée, et quel résultat tue le prix actuel ? »

**Ce que le PRD répond aujourd'hui : partiellement — bien sur le besoin, rien sur la méthode.**

L'argumentaire est solide et honnête : les deux estimations publiques de salaire moyen divergent
de 63 %, aucune ne remonte proprement à l'ANSD, « *la seule sortie est le test, pas l'arbitrage
documentaire* ». C'est exactement le bon raisonnement.

Mais un test sans critère d'échec pré-engagé n'est pas un test, c'est une formalité. Sur quel
volume de trafic ? Combien de temps ? Quel écart de conversion entre variantes déclenche quoi ? Et
surtout : **quel résultat vous ferait baisser le prix de la ligne qui fait 85 % du CA ?** Si la
réponse est « aucun », le test est décoratif.

---

### Q7 — « La Partie B fait 24 exigences. NFR-11 dit que toute fonctionnalité arrive avec son coût en minutes par semaine. Où sont les minutes ? »

**Ce que le PRD répond aujourd'hui : rien — et c'est sa propre règle qu'il enfreint.**

> NFR-11 — « Toute fonctionnalité nouvelle arrive avec son coût en minutes par semaine pour un
> opérateur unique (UJ-4). **Une fonctionnalité sans réponse à cette question n'est pas
> spécifiée.** »

FR-068 à FR-091 : vingt-quatre exigences. Zéro minute. Zéro ordre de priorité. Zéro responsable.
Zéro date. Par son propre critère, **la Partie B n'est pas spécifiée**.

C'est la contradiction interne la plus élégante du document, et c'est aussi la plus utile : elle
donne exactement le travail à faire. Vingt-quatre lignes de chiffrage, une demi-journée, et le
séquencement de Q4 tombe tout seul.

---

### Q8 — « D-02 : montrez-moi l'arithmétique du recouvrement manuel. Et pourquoi pas le prépaiement annuel remisé ? »

**Ce que le PRD répond aujourd'hui : bien sur le diagnostic, rien sur la décision.**

Le diagnostic est la meilleure page de business du dossier, et il est contre-intéressé : Wave, qui
domine le marché principal, ne supporte pas le prélèvement récurrent par API ; le module
d'abonnement de CinetPay est en bêta ; donc « *le churn est actif, pas passif* », l'engagement de
six mois « *n'est pas exécutoire en pratique* » face à un tissu informel à 85–97 %, et le coût de
recouvrement s'impute sur un opérateur unique.

Trois issues sont posées. **Aucune n'est choisie** (Q-05). Or l'une des trois est très fortement
suggérée par la recherche elle-même : la maintenance se vend **à l'année** dans les trois
capitales, et le marché n'a « *aucune ancre mensuelle pour le site* ». Le prépaiement annuel remisé
n'est pas un pis-aller — c'est le format que le marché pratique déjà. Le modèle *MRR-first* de
`docs/OFFRE_AGENCE_TPE.md` est un import de doctrine SaaS occidentale dans un marché qui n'en a ni
le rail ni l'habitude.

Je veux entendre pourquoi ce n'est pas tranché, alors que la recherche a fait le travail.

---

### Q9 — « Bictorys est votre unique rail de paiement, et le paiement est votre moat déclaré. Que se passe-t-il s'ils changent leurs conditions, perdent un partenaire, ou s'arrêtent ? »

**Ce que le PRD répond aujourd'hui : rien. Ce n'est pas dans les treize risques.**

Le §2.1 fait du mobile money natif l'un des deux différenciateurs — « *ils **sont** le marché* ».
FR-015 établit que tout passe par un prestataire unique. NFR-02 protège la fiabilité du webhook,
mais rien ne protège de la disparition de l'intermédiaire.

Un moat qui repose entièrement sur un agrégateur tiers, lui-même une jeune société, n'est pas un
moat : c'est une dépendance présentée comme un avantage. Le registre de risques a été construit
depuis le code — d'où sa qualité sur R-12, FR-088, FR-089 — et pas depuis l'exposition. C'est
visible ici, et aussi sur la fenêtre CGV d'avril à août (voir §3, point 8).

---

### Q10 — « Vos quatre parcours sont inférés. Votre journal de rédaction dit que c'est après trois relances sans narration. Que sauriez-vous après une semaine avec dix clients que ce document n'a pas pu tirer du code ? »

**Ce que le PRD répond aujourd'hui : partiellement — le besoin est nommé trois fois, l'action n'est
pas faite.**

Le PRD est irréprochable sur l'aveu. Il le met en §0, il le répète en tête du §4, il en fait Q-01
« *Tout le document. À traiter en premier* », et FR-081 demande dix à quinze entretiens de
qualification côté TPE.

Mais `.memlog.md`, listé en annexe du PRD et donc partie du dossier, dit ceci :

> « (override) Bascule Coaching path → Fast path **à la demande de Rysmo, après 3 relances sans
> narration**. Conséquence : les 4 parcours utilisateur sont inférés du code, des docs et des
> recherches, PAS narrés par l'utilisateur. »

La différence est décisive. Un persona inféré *faute de données* est une contrainte de marché. Un
persona inféré *après trois demandes restées sans réponse* est un arbitrage de temps. L'élément le
moins cher de tout ce dossier — une heure de l'opérateur pour raconter quatre parcours qu'il a
vécus — est celui qui n'a pas été dépensé.

Je ne poserais pas cette question pour piéger. Je la poserais parce que la réponse me dit ce que
je veux vraiment savoir : où va l'heure marginale de la seule personne qui compte ici.

---

## 3. Ce que j'exigerais avant d'aller plus loin

Huit points. Ils sont ordonnés par ratio valeur/coût, pas par gravité.

### 1. Le relevé de caisse — bloquant

Un tableau d'une page : **FCFA encaissés par ligne et par mois depuis le 13 avril 2026**, extrait
de la collection `transactions` (FR-021 confirme qu'elle est réconciliable). Plus : nombre de
comptes créés, nombre d'inscriptions payantes, nombre d'abonnements Club depuis l'origine.

Ce n'est pas une étude, c'est une requête. **Zéro daté est recevable ; inconnu ne l'est pas.**
Un produit de six mois à zéro franc est un dossier normal, et j'en finance. Un produit de six mois
qui ne sait pas s'il est à zéro n'est pas un dossier.

### 2. D-03 exécuté en ligne, pas planifié — bloquant

Le PRD identifie parfaitement le problème et le qualifie lui-même de « **risque le plus
immédiat** » :

> « **un lecteur qui connaît le secteur s'arrête au 98 % et cesse de croire le reste.** »

C'est exact, et c'est exactement ce qui se passe. Mais D-03 est une *décision à prendre* et
FR-069/FR-070 sont des *exigences de phase suivante*. Ce qu'il faut, c'est que le site public ne
porte plus, à la date du second rendez-vous : le 98 % de complétion, le +340 % / +1 790 %
contradictoires, le « 50+ étudiants », le 94/98 % de réussite, ni les portraits générés par IA
(FR-084).

Deux jours de travail. Meilleur ratio du document. Tant que le 98 % est affiché, plus rien de ce
dossier n'est lisible par quelqu'un de mon métier — y compris tout ce qui est bon dedans.

### 3. Le séquencement des lignes, signé

Deux lignes actives sur six mois, trois gelées, page en ligne et formulaire routé. Écrit dans le
§10 « Hors périmètre », qui aujourd'hui n'exclut que des choses qui ne coûtent rien.

Je ne demande pas la bonne réponse — je ne la connais pas mieux que l'opérateur. Je demande **une**
réponse. Cinq lignes menées de front par une personne, ce n'est pas de la diversification, c'est
cinq courbes de churn contre un seul calendrier.

### 4. Le prix de la formation, à une seule source

Dans le PRD, avec sa fourchette réelle, réconcilié entre `BUSINESS_PLAN.md` (95 000–200 000), la
recherche (125 000) et le code. Avec la règle de fractionnement (FR-073) attachée. Et
réconciliation du décompte : **quatre flux** dans le business plan, **cinq lignes** dans le PRD.

### 5. FR-068 instrumenté et vivant depuis 30 jours

Pas la spécification — la donnée. L'exigence la moins chère de la Partie B est aussi celle qui
débloque FR-069 à FR-072, M-01 à M-03, M-11, et la moitié du registre de risques. Tant qu'elle
n'est pas posée, chaque discussion de prix, de conversion ou de rétention est une conversation
d'opinions.

### 6. Le chiffrage en minutes de la Partie B

Vingt-quatre lignes, vingt-quatre coûts hebdomadaires, un ordre. C'est la règle que le document
s'est donnée en NFR-11. L'appliquer à lui-même produit mécaniquement la feuille de route qui
manque, et probablement l'arbitrage du point 3.

### 7. Une frontière écrite sur R-08 — et je détaille pourquoi

**Comment je lis « le fondateur est le moat et le point de rupture, aucun traitement à ce
stade » :** l'énoncé est juste, il est courageux, et il ne me sert à rien.

Nommer un risque n'est pas le traiter, et ici l'honnêteté n'achète rien, parce que le risque *est*
l'actif. Ce n'est pas un risque parmi treize : c'est la structure du dossier. Le système de voix
(« Je te forme · Je t'informe · Je te transforme »), que le §3 qualifie à juste titre d'« *actif
produit* », est aussi ce qui rend l'entreprise incessible. C'est un plafond de valorisation, pas
seulement une continuité à assurer — et le PRD range R-08 dans « Continuité, valorisation » sans
développer le second terme.

Ce qui me gêne n'est pas l'absence de solution, c'est l'absence de **pesée**. Des traitements
partiels existent et ne sont pas même évalués pour être écartés : contenu evergreen enregistré qui
vend sans présence, second animateur sur le Club, ligne TPE délivrée par un sous-traitant sous la
marque, séparation de la marque personnelle et de la marque plateforme. Certains sont mauvais.
Aucun n'est examiné.

Ce que j'exige tient en une page : **quelle part du revenu tombe sans vous à 90 jours, et ce que
coûterait de la doubler.** Pas une solution. Une frontière chiffrée.

### 8. Le juridique, deux points

**R-09 (objet social)** — un avis écrit de conseil. Le PRD a raison de le qualifier de bloquant en
cas de levée ou de cession, et il a le mérite rare de l'avoir soulevé lui-même. Mais c'est
justement pour ça qu'il faut l'avis avant, pas pendant.

**La fenêtre CGV d'avril à août** — l'addendum §2 raconte que les conditions générales ont annoncé
10 000 FCFA pendant que le code prélevait 19 900, sur un abonnement engageant douze mois, jusqu'à
l'alignement du 13 août. Le PRD en tire une exigence d'ingénierie (FR-089, « rendre détectable la
désynchronisation des miroirs de prix ») et **rien d'autre**. C'est une exposition de droit de la
consommation, pas seulement une dette technique. Le commit dit qu'aucun abonné n'était concerné —
très bien, alors qu'on l'écrive, daté et signé, dans le registre §9. Son absence du registre
confirme ce que je disais en Q9 : les risques ont été inventoriés depuis le code, pas depuis
l'exposition.

---

## 4. Ce qui m'a convaincu

Je serais malhonnête de m'arrêter à ce qui précède. Il y a dans ce dossier des choses que je vois
rarement, et deux que je ne vois presque jamais.

### D-01 et D-02 sont les deux meilleures pages du dossier — et elles sont contre-intéressées

Un fondateur qui calcule lui-même que son accompagnement représente **21,9 % du chiffre d'affaires
mensuel** du plancher de sa propre cible, et qui écrit que « *aucun repère budgétaire, même le plus
généreux, ne survit à cet ordre de grandeur* », fait quelque chose que je ne vois pratiquement
jamais. Ces arithmétiques-là, dans mon métier, c'est en général moi qui les fais, en réunion, et je
regarde le visage en face pendant que je les fais.

Idem pour D-02 : aller chercher que **Wave ne supporte pas le prélèvement récurrent par API**, et
en tirer publiquement que le modèle *MRR-first* de son propre document commercial « *suppose un
rail qui n'existe pas sur le marché principal* », c'est se tirer dans le pied avec méthode. C'est
la raison principale pour laquelle j'écris cette revue au lieu de classer le dossier.

### La discipline sur les chiffres externes est de premier ordre

Le PRD refuse un TAM (§0), démonte le piège des 125,78 % de l'ARTP en expliquant que c'est un
décompte de cartes SIM, écarte le chiffre A4AI obsolète, écarte le « 46 % des recherches sont
locales » comme une statistique globale recyclée sans validité régionale, écarte les taux
d'ouverture WhatsApp comme du matériel commercial d'agence, et signale que les deux estimations de
salaire moyen divergent de 63 % sans qu'aucune ne remonte à l'ANSD.

Ce sont cinq pièges dans lesquels tombe la moitié des dossiers que je lis sur cette région. Les
éviter tous les cinq n'est pas un hasard, et ça me dit quelque chose de vrai sur la façon dont
cette personne me reportera plus tard.

### La couche paiement est au-dessus de la médiane de ce que je vois en seed

FR-016 (« *le prix débité est toujours relu côté serveur* », sans exception, pour les trois
lignes), FR-018 et NFR-02 (dédoublonnage par identifiant de charge, contrôle du montant, effets de
bord appliqués **avant** le marquage de la transaction). L'ordre des opérations est correct, il est
énoncé comme intangible, et il est justifié. C'est l'endroit où l'argent touche le système, et
c'est fait proprement, par une personne seule.

### FR-050 / NFR-08 : la séparation des données de devis et des données personnelles

Imposée dans les règles, pas seulement dans le code. Personne ne fait ça spontanément à ce stade,
et le PRD a raison de le signaler comme « *un point de conception remarquable, à préserver* ».

### Le §8 est la meilleure section du document

Onze métriques appariées à leur contre-métrique, chacune avec sa raison d'être. Trois sont
excellentes :

- **M-05** — requêtes Rysmo par membre actif, contre **coût IA par membre actif et sa
  dispersion** : « *les meilleurs usagers sont les plus coûteux ; c'est la marge qu'on suit, pas
  l'usage* ».
- **M-08** — prospects TPE qualifiés, contre **taux de recouvrement mensuel effectif** :
  « *sans rail de prélèvement, un contrat signé n'est pas un revenu encaissé* ».
- **M-03** — complétion mesurée, contre **certificats émis sans progression substantielle**.

La plupart des dossiers me servent des métriques de vanité. Celui-ci me donne la métrique **et** la
façon dont elle sera truquée. Et le refus de fixer des cibles empruntées à des repères occidentaux
est le bon réflexe.

Une réserve, cela dit : **M-04** (revenu par ligne, contre concentration du revenu sur une seule
ligne) a déjà sa réponse dans `BUSINESS_PLAN.md`, qui met les formations à **~85 % du CA**. La
contre-métrique est donc au rouge avant d'avoir été mesurée, et le résumé exécutif vend pourtant
« cinq lignes » comme une force. Ce sont deux affirmations du même dossier qui ne se regardent pas.

### NFR-04 et NFR-05 : une vraie localisation, pas une localisation marketing

Faire du **poids en mégaoctets une contrainte de conception**, adossée à la donnée ITU (panier
d'entrée à 4,2 % du RNB par habitant, région la plus chère du monde), et de la survie à une session
interrompue une exigence de robustesse adossée aux 24 % de possession de smartphone — c'est le
genre de contrainte qui produit un produit différent, pas un argumentaire différent. C'est
également le seul endroit où je vois un avantage que Skool ne peut pas copier en un sprint, avec le
mobile money.

### NFR-10 : le quota IA comme choix de marge

« *Aucune offre d'IA illimitée ne sera introduite : le coût est variable et corrélé aux
utilisateurs les plus engagés, c'est-à-dire ceux qui ne partent pas.* » Raisonnement correct,
correctement benchmarké (Kajabi en crédits, Circle en Enterprise, Khanmigo en SKU séparé), et
assumé comme une décision plutôt que subi comme une limitation. Bien vu.

---

## 5. Réponses directes aux quatre points d'attention

### L'auto-déclaration d'incomplétude : rassurante ou inquiétante ? La ligne de partage

Il y a **trois honnêtetés différentes** dans ce document, et elles ne valent pas la même chose.

**L'honnêteté sur la donnée externe : elle me rassure, franchement.** Ne pas savoir la taille du
marché B2C edtech en AO francophone est l'état normal de la connaissance. Refuser d'inventer un TAM
dans un document destiné à des investisseurs, alors que la tentation est maximale et le coût du
mensonge nul à court terme, c'est un signal de gouvernance. Je saurai comment cette personne me
reportera une mauvaise nouvelle.

**L'honnêteté sur la donnée interne : elle m'inquiète, et c'est la ligne de partage.** Ne pas
connaître son propre taux de complétion, son propre effectif à un facteur 30 près, son propre point
de rupture de tunnel, son propre taux de renouvellement — après quatre mois et demi de caisse
ouverte — n'est pas un problème de donnée, c'est un problème d'instrumentation. Et le document le
transforme en *exigence de phase suivante* (FR-068 à FR-071) au lieu de le traiter comme une dette
déjà échue. Il est rigoureux sur les faits qu'il ne contrôle pas et flou sur ceux qu'il possède.
C'est exactement l'inverse de la répartition que j'attends.

**La troisième : l'honnêteté déployée à la place d'une décision.** C'est le cas des parcours
utilisateurs (Q10 ci-dessus), et c'est aussi le cas de D-01, D-02 et D-03 — trois décisions
parfaitement instruites, trois options proposées à chaque fois, aucune tranchée, renvoyées en Q-04,
Q-05, Q-06. Le document a fait le travail intellectuel jusqu'au dernier centimètre et s'est arrêté
avant l'arbitrage.

Un aveu qui accélère la décision est un actif. Un aveu qui la remplace est une élégance coûteuse.
Ce dossier fait les deux, et il faut lire ligne par ligne pour savoir lequel on a sous les yeux.

### L'absence de chiffre de marché : courage ou trou ?

**Courage sur le top-down, trou sur le bottom-up. Et le document confond les deux.**

Refuser IMARC et Research Nester — même base 2024, facteur 2,5 d'écart à l'arrivée, aucune
méthodologie publiée — est la bonne décision, et refuser de reprendre le SAM de 300 000–500 000
personnes de `BUSINESS_PLAN.md §5.1` faute de source est encore mieux, parce que ça coûte
quelque chose en interne.

Mais « aucune taille de marché » et « aucun dimensionnement » ne sont pas la même chose. Personne
n'a besoin d'un cabinet pour poser : *nombre de commerces formels de la cible à Dakar × hypothèse
de capture = plafond de la ligne 11*. Les éléments sont déjà dans le dossier — taux d'informalité
de 85,4 à 97 % (RGE/ANSD), part des PME à 99,8 %, pénétration Internet par pays. La recherche TPE
écrit d'ailleurs elle-même la phrase qui manque au PRD : « *La cible « 1–15 salariés, formelle,
800 k–5 M/mois, prête à s'engager 6 mois » est une **fraction étroite** d'un très grand nombre. Le
TAM apparent est trompeur.* » Cette phrase n'est pas remontée au PRD. C'est pourtant la seule
information de dimensionnement solide du dossier, et elle est défavorable — ce qui est
précisément pourquoi elle a de la valeur.

Un bottom-up construit sur la donnée que le PRD tient déjà n'est pas la fantaisie qu'il refuse à
juste titre. C'est de l'arithmétique, et c'est une demi-journée. Le courage est réel ; le trou
aussi.

### Cinq lignes de revenu, un opérateur : mon avis

**Ce n'est pas un portefeuille, c'est un problème de calendrier.** Et le PRD est son propre meilleur
témoin à charge : R-10 le dit, NFR-11 en fait une règle, UJ-4 en fait « *le paramètre de conception
le plus déterminant du produit* » — formulation que je trouve juste et lucide. Puis la Partie B
s'étend sur les cinq lignes comme si la contrainte ne s'appliquait pas à la roadmap.

Trois observations concrètes :

1. **La concentration est déjà connue et déjà extrême** : ~85 % du CA sur les formations selon le
   modèle interne. Les cinq lignes ne diversifient rien aujourd'hui ; elles dispersent l'attention
   de la seule personne qui pourrait faire décoller la première.
2. **Deux des cinq ont seize jours** et sont déjà démontrées cassées par le document lui-même
   (D-01, D-02). Les compter dans le résumé exécutif au même rang que les trois autres est le seul
   endroit du PRD où je trouve une présentation avantageuse.
3. **Chaque ligne a sa propre courbe de rétention et son propre cycle de vente.** Le Club se joue à
   douze mois, la formation à l'achat unique, Rysmo au mois, la TPE au recouvrement mensuel manuel,
   l'agence au cycle long de qualification. Ce sont cinq métiers différents, et l'opérateur en fait
   correctement le décompte en heures dans UJ-4 sans jamais le faire en arbitrage.

Ce qui me ferait changer d'avis : une page qui dit « pendant six mois, formations et Club ; Rysmo
en maintenance ; TPE et agence gelées, pages en ligne, formulaires routés ». Ça ne coûte rien à
écrire, ça coûte beaucoup à décider, et c'est exactement pour ça que ça vaut quelque chose.

---

## 6. Verdict

### **Revenez quand deux choses sont réglées.**

**Ce n'est pas un non.** D-01, D-02 et le §8 sont le travail de quelqu'un qui pense en opérateur et
qui sait se contredire lui-même par écrit — c'est rare, et la couche paiement démontre qu'il sait
aussi livrer ; je ne classe pas un dossier qui a ces trois qualités simultanément. **Mais je ne
peux pas prendre un second rendez-vous sur un document qui annonce cinq lignes monétisées et ne
produit pas un franc encaissé, alors que la donnée est à une requête de sa propre base et que le
seul ordre de grandeur d'utilisateurs qu'il contient y figure comme une erreur d'un facteur 30 à
corriger.** Revenez avec le relevé de caisse par ligne depuis le 13 avril et le site public purgé
de ses chiffres non sourcés — c'est deux jours de travail, ça ne demande aucune décision
stratégique, et sans ça la qualité réelle de ce dossier reste invisible pour tout lecteur de mon
métier.

---

### Ce qui débloque un second rendez-vous, dans l'ordre

| # | Exigence | Coût estimé | Statut |
|---|---|---|---|
| 1 | Relevé de caisse par ligne et par mois depuis le 13/04/2026 + nombre d'abonnés Club depuis l'origine | une requête | **Bloquant** |
| 2 | D-03 exécuté sur le site public (98 %, +340/+1 790 %, 50+/1 486, 94/98 %, portraits IA) | 2 jours | **Bloquant** |
| 3 | Séquencement : 2 lignes actives / 3 gelées, écrit au §10 | 1 décision | Attendu |
| 4 | Prix de la formation, source unique, réconcilié entre les trois documents | 1 heure | Attendu |
| 5 | Chiffrage NFR-11 des 24 exigences de la Partie B | ½ journée | Attendu |
| 6 | FR-068 instrumenté, 30 jours de données | 1 semaine + 1 mois | Avant tout débat de prix |
| 7 | R-08 : frontière chiffrée à 90 jours | 1 page | Avant toute discussion de valorisation |
| 8 | R-09 : avis de conseil + fenêtre CGV avril–août portée au registre §9 | externe | Avant toute levée |

### Ce que je regarderais en priorité au second rendez-vous, si les deux bloquants tombent

- Le taux de renouvellement du Club sur la première cohorte réelle, quelle qu'en soit la taille.
- L'endroit exact de la rupture du tunnel, mesuré et non supposé (FR-068).
- Laquelle des trois options de D-02 a été choisie, et pourquoi ce n'est pas le prépaiement annuel
  remisé que la recherche désigne pratiquement.
- Les dix à quinze entretiens de FR-081, faits — pas planifiés.

---

*Revue rédigée le 2026-08-29. Les faits de dépôt cités (dates de commit, message du commit
`5b2ca5c`, `BUSINESS_PLAN.md` lignes 40–44) ont été vérifiés directement dans le dépôt à cette
date. Toute correction sur la lecture du commit `5b2ca5c` — notamment sur le nombre réel
d'abonnés Club — modifie substantiellement les §1, Q2 et le verdict, et je la prendrai en compte
sans réserve.*
