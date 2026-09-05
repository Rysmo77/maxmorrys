---
title: "PRD — Plateforme Max-Morrys"
status: final
created: 2026-08-29
updated: 2026-08-30
revision: 4
author: Rysmo (Max-Morrys Eyoum)
entity: MY ONOMA SARL
---

# PRD — Plateforme Max-Morrys

| § | Section | Pour qui c'est écrit |
|---|---|---|
| 0 | À propos de ce document | À lire en premier — la légende des marqueurs |
| **1** | Résumé exécutif · **§1.2 : ce que dit la base de production** | **Le fait qui gouverne tout le document** |
| 2 | Contexte de marché | Ce qui est établi, et ce qui ne l'est pas |
| 3 | Positionnement et architecture de marque | |
| 4 | Parcours utilisateur | Intentions de conception — aucun usage réel à observer |
| 5 | Partie A — le produit tel qu'il est | FR-001 à FR-067, constatées dans le code |
| 6 | Partie B — la phase suivante | Trois décisions, puis FR-068 à FR-111 |
| 7 | Exigences non fonctionnelles | NFR-01 à NFR-13, transverses aux deux parties |
| 8 | Métriques et contre-métriques | M-01 à M-12 — **toutes partent de zéro** |
| 9 | Risques | R-01 à R-20 |
| 10 | Hors périmètre | |
| 11 | Questions ouvertes | Q-01 à Q-13, dont **trois closes par le relevé du 30 août** |
| 12 | Glossaire | Le sens unique de quatorze noms de domaine |
| 13 | Index des hypothèses | Tout ce que ce document suppose sans le savoir |

---

## 0. À propos de ce document

**Ce qu'il est.** Le document de référence produit de la plateforme maxmorrys.me, destiné à une
lecture externe — investisseur, associé, développeur à recruter. Il décrit un produit déjà en
production, pas un projet.

**Comment le lire.** Deux parties. La Partie A (§5) décrit le produit tel qu'il fonctionne
aujourd'hui : chaque exigence y est constatée dans le code et porte une conséquence vérifiable.
La Partie B (§6) décrit ce qui est exigé pour la phase suivante ; rien n'y est acquis.
Le glossaire (§12) fixe le sens des noms de domaine, l'index des hypothèses (§13) récapitule tout
ce que ce document suppose sans le savoir.

**Comment lire les chiffres.** Trois recherches documentaires et quatre relectures adversariales
ont été menées le 29 août 2026. La recherche a établi que la donnée publique fiable existe sur la
connectivité et le paiement, et n'existe pas sur la demande et les prix en Afrique de l'Ouest
francophone. La relecture a établi que la première version de ce document affirmait quatre choses
fausses. D'où quatre marqueurs, appliqués sans exception :

| Marqueur | Signification |
|---|---|
| *(non marqué)* | Vérifié dans le code du dépôt, ou sourcé auprès d'une source primaire citée |
| `[HYPOTHÈSE]` | Inférence de l'auteur, non vérifiée. Récapitulée en §13 |
| `[FICTIF]` | Nombre calculé sur un scénario inventé. N'est pas une mesure |
| `[À SOURCER]` | Chiffre affiché en façade aujourd'hui sans source. Ne pas publier en l'état |

**Ce que le lecteur doit savoir avant tout le reste.** La base de production a été interrogée le
30 août 2026. **La plateforme n'a jamais encaissé un franc, et son catalogue ne contient aucune
formation publiée.** Cinq comptes existent, dont deux administrateurs. Le détail est en §1.2, et
il gouverne la lecture de tout ce document : la Partie A décrit un produit **construit et
déployé, jamais exploité**.

En conséquence, **les quatre parcours de §4 restent hypothétiques** — non par défaut de méthode,
mais parce qu'il n'y a aucun usage réel à observer. C'est une information sur le produit, pas sur
le document.

---

## 1. Résumé exécutif

Max-Morrys est une plateforme d'éducation au marketing digital, au SEO et à l'IA, opérée depuis
Dakar par MY ONOMA SARL, et destinée aux francophones d'Afrique de l'Ouest et à leur diaspora.
**La plateforme a six mois et n'a pas encore ouvert.** Premier commit le 7 mars 2026. Elle est
déployée, bilingue FR/EN, et *outillée* pour cinq lignes de revenu — mais aucune n'a produit de
chiffre d'affaires, et deux d'entre elles ont trois semaines d'existence :

| Ligne | Prix | Outillée depuis | **Chiffre d'affaires** |
|---|---|---|---|
| Formations (LMS) | 95 000–200 000 FCFA, achat unique | l'origine | **0 XOF · aucune formation publiée** |
| Club des Digitos | 19 900 FCFA/an | l'origine | **0 XOF** · 3 abonnements sans paiement associé |
| Rysmo (assistant IA) | packs 500–3 500 · abos 3 000/7 500 FCFA | l'origine | **0 XOF** · 0 pack, 0 abonnement |
| Présence Digitale (TPE) | packs 295 000–895 000 FCFA | 6 août 2026 | **0 XOF** · 1 prospect, statut « nouveau » |
| Max-Morrys Agency | non publié, high-ticket | 13 août 2026 | **0 XOF** · 0 demande |

### 1.2 Ce que dit la base de production

Relevé le 30 août 2026 sur la base `(default)` du projet, la seule qui existe et celle que
l'application lit.

| | |
|---|---|
| Comptes | **5** — dont 2 administrateurs et 3 apprenants |
| Transactions | **1**, en statut « en attente ». **Zéro franc encaissé** |
| Inscriptions | **2**, toutes deux à **0 % de progression** |
| Certificats émis | **0** |
| Formations publiées | **0** sur 2 existantes — *le catalogue est vide pour un visiteur* |
| Abonnements Club | 3 (2 actifs, 1 annulé), **sans transaction complétée en face** |
| Rysmo | 0 pack, 0 abonnement |
| Newsletter · messages · rendez-vous · parrainages | **0** partout |
| Prospects TPE · demandes agence | 1 · 0 |
| Articles publiés | **46** sur 93 · 1 podcast · 2 vidéos |
| Dernier compte créé | **10 mars 2026** |

**Trois faits en découlent, et ils gouvernent tout le document.**

1. **La plateforme n'a jamais vendu.** Ni formation, ni abonnement, ni pack. Le tunnel de paiement
   est construit, éprouvé par ses tests, et n'a jamais servi.
2. **Son catalogue est vide.** Deux formations existent en base, aucune n'est publiée : un visiteur
   qui arrive sur `/formations` ne peut rien acheter. **C'est le seul obstacle strictement bloquant
   du document, et il ne demande ni développement ni décision stratégique.**
3. **Seule la ligne éditoriale vit.** 46 articles publiés — c'est le seul actif qui fonctionne, et
   c'est précisément le haut de l'entonnoir décrit comme le moat n°2.

*Ce n'est pas un échec, c'est un stade : un produit construit avant d'avoir été lancé. Mais un
document qui laisserait entendre le contraire ne survivrait pas à trente secondes de vérification.*

Ce qui distingue la plateforme n'est ni son LMS, ni sa gamification, ni son tuteur IA — trois
briques que des spécialistes vendent mieux entre 9 et 99 USD par mois. **Deux choses la
distinguent, et une seule est démontrée :**

1. **Le paiement en monnaie électronique locale, nativement.** Dans l'UEMOA, la bancarisation
   stricte est de 25,2 % — *en baisse* — contre 73,6 % d'inclusion financière (BCEAO, 2024).
   Wave et Orange Money ne sont pas un détail d'intégration : ils **sont** le marché. Skool,
   Kajabi et Circle ne les servent pas. *C'est un fait de marché, vérifiable.*
   *Nuance : ce n'est pas un fossé infranchissable — Chariow, plateforme francophone pour
   créateurs, propose le mobile money natif sans abonnement, en prélevant une commission
   dégressive. Le moat n'est donc pas « personne ne sait faire », c'est « aucun acteur mondial ne
   veut faire » — et un acteur régional le fait déjà.*
2. **Une distribution propriétaire gratuite** — blog, podcast, chaîne vidéo, référencement —
   qui supprimerait le coût d'acquisition payé. `[HYPOTHÈSE]` *Cet avantage est plausible mais
   **non mesuré** : les chiffres de trafic actuellement affichés se contredisent (§6.1, D-03) et
   ne peuvent pas l'étayer. Tant que FR-069 n'a pas tourné, ce n'est pas une preuve, c'est une
   intention.*

**Trois décisions bloquent la phase suivante**, posées en tête de la Partie B : le segment bas
de la cible TPE n'est pas finançable au tarif d'accompagnement actuel ; le modèle de revenu
récurrent de cette même ligne n'a pas de rail de prélèvement au Sénégal ; et plusieurs chiffres
publics ne sont adossés à aucune source.

---

## 2. Contexte de marché — ce qui est établi, et ce qui ne l'est pas

### 2.1 Établi, et structurant pour le produit

**Le mobile money est le rail, pas une option.** Inclusion financière UEMOA 73,6 % contre 25,2 %
de bancarisation stricte (BCEAO, tableau de bord 2024). 248,7 millions de comptes de monnaie
électronique dont 76,9 millions actifs. À l'échelle ouest-africaine, la GSMA recense 517 millions
de comptes et 498 milliards USD transigés en 2025, le mobile money pesant plus de 5 % du PIB au
Bénin, en Côte d'Ivoire et au Sénégal.

**Le coût de la donnée mobile est une contrainte de conception.** En 2024, le panier haut débit
d'entrée (2 Go/mois) coûte en médiane **4,2 % du revenu national brut par habitant en Afrique**,
région la plus chère du monde, contre une cible ONU de 2 % (ITU, *The affordability of ICT
services*, 2025). → *Exigence NFR-04.*

**L'appareil est un obstacle plus fort que le réseau.** 960 millions de personnes en Afrique
(64 %) n'utilisent pas l'Internet mobile bien que couvertes. La possession de smartphone
plafonne à 24 % de la population (GSMA, 2024).

**Les trois capitales visées ne forment pas un marché homogène.** Pénétration Internet réelle :
Sénégal 60,6 %, Côte d'Ivoire 40,7 %, Bénin ~32 % (DataReportal, Digital 2026). L'âge médian
sénégalais est de 19,6 ans.

> ⚠️ **Piège de chiffre à ne jamais reprendre.** L'ARTP annonce 125,78 % de « pénétration
> Internet » fin 2025. C'est un décompte de cartes SIM, pas de personnes ; Africa Check a
> publiquement démonté cette lecture. Le chiffre d'usage est ~60 % (ITU : 60,1 % en 2024).

**L'espace produit est libre — ce qui coupe dans les deux sens.** Aucun acteur de l'Afrique de
l'Ouest francophone ne combine LMS payant, communauté annuelle, assistant IA et gamification
sous une marque personnelle. **L'absence de concurrent direct est aussi un signal de demande
non prouvée, pas seulement d'opportunité.**

**Le B2C edtech africain se rétracte vers le B2B.** Un tiers de la cohorte Africa EdTech 50 2025
(HolonIQ) est B2B ou institutionnel, et cette liste est dominée à ~73 % par l'Afrique du Sud et
le Nigeria — l'Afrique de l'Ouest francophone y est quasi absente.

### 2.2 Non établi — et que ce PRD n'affirmera pas

| Sujet | État réel de la donnée |
|---|---|
| Taille du marché B2C edtech en AO francophone | Inconnue. Les projections disponibles partent de la même base 2024 et divergent d'un facteur 2,5 à l'arrivée, sans méthodologie publiée. Le SAM de « 300 000–500 000 personnes » de `BUSINESS_PLAN.md §5.1` n'est pas repris ici : il n'est adossé à aucune source |
| Élasticité au prix des formations | Inconnue. Deux bornes primaires existent pourtant et sont utilisées en FR-072 : ~25 000 FCFA d'ancrage créateur, 150 000–500 000 FCFA en école. Ce qui manque, c'est la réponse de la demande |
| Conversion, complétion, churn en contexte francophone africain | Aucune donnée publique |
| Pénétration de WhatsApp | Non sourcée en primaire — or deux tunnels de vente en dépendent |
| Salaire moyen sénégalais | 114 152 vs 186 710 FCFA selon la source. 63 % d'écart, aucune remontant proprement à l'ANSD |
| Rôle réel de Google Business Profile en AO | Zéro donnée régionale — or c'est la seule preuve de `/presence-digitale` |
| Propension à payer de la diaspora | Angle mort total, alors que c'est probablement le segment le plus solvable |
| Prix transactés (vs affichés) chez les agences TPE | Le trou principal. Toutes les grilles disponibles viennent d'agences qui vendent ces services |

**Conséquence assumée.** Tout ce qui touche au prix et à la demande entre dans ce PRD comme
hypothèse à valider (§13). Le premier jalon de la Partie B est un test de prix réel (FR-072), et
pour la ligne TPE, dix à quinze entretiens de qualification (FR-081).

---

## 3. Positionnement et architecture de marque

```
MY ONOMA SARL — société opératrice (Dakar, immatriculée le 11/04/2022)
   │  trois piliers : BUILD · GROW · OWN
   │
   ├── Max-Morrys — la marque (LEARN est un track, pas un pilier)
   │      ├── maxmorrys.me — la plateforme, objet de ce PRD
   │      └── /presence-digitale — offre « Digital Commerce Local », TPE  ← rattachement non arbitré
   │
   ├── Max-Morrys Agency — practice du pilier BUILD, high-ticket, /agence
   ├── Cléa Growth Office — practice du pilier GROW (hors dépôt ; routage des leads)
   └── pilier OWN — hors périmètre de ce PRD
```

> **Non arbitré.** Le rattachement de `/presence-digitale` à Max-Morrys n'est pas tranché.
> `docs/AGENCY-POSITIONING.md §9` note que cette offre « relève plus de GROW que de BUILD ».
> C'est une quatrième option que D-01 et D-02 n'envisagent pas : **déplacer la ligne plutôt que
> la corriger.** Elle appartient à Q-11.

**Le système de voix est un actif produit.** L'ensemble de la navigation publique est construit
au tutoiement autour de « Je te… » : *Je suis Max-Morrys · Je te forme · Je t'informe · Je te
transforme · Je te digitalise · Contacte-moi*. Rare, mémorable, cohérent sur tout le territoire
LEARN. Toute exigence de ce PRD s'y conforme.

**Deux frontières de marque à ne pas franchir :**
- `/agence` porte la practice BUILD. Elle est **high-ticket et sans grille tarifaire publique** —
  le formulaire y sert à *filtrer* les prospects, pas à maximiser leur volume. Jamais à confondre
  avec `/presence-digitale`, qui publie ses prix et cible les commerces de proximité.
- Les demandes de type `growth` sont **tagguées `MY_ONOMA_GROW` et orientées vers Cléa**, sans
  jamais être rejetées.

**Le dépôt My-onoma fait autorité sur les données corporate.**

> ⚠️ **Point juridique ouvert.** L'activité principale immatriculée de MY ONOMA SARL est
> « Activités de soutien aux entreprises N.C.A. », qui **ne recouvre ni l'édition de logiciels ni
> l'exploitation de plateformes**. Le site ne l'affirme nulle part, volontairement. Exposition
> réelle en cas de levée ou de cession — voir R-08.

---
## 4. Parcours utilisateur

> **Statut.** Les quatre parcours sont `[HYPOTHÈSE]` dans leur intégralité, et tous les nombres
> qu'ils contiennent sont `[FICTIF]` — calculés sur des personnes inventées.
>
> **Et ils ne peuvent pas être validés aujourd'hui.** Le relevé du 30 août établit qu'il n'existe
> aucun usage réel à observer : trois comptes apprenants, deux inscriptions à 0 %, aucun achat.
> Ces parcours ne décrivent donc pas ce qui se passe — ils décrivent **ce que le produit a été
> construit pour permettre**. C'est une intention de conception, lisible comme telle, et leur
> confrontation au réel viendra après FR-111 (Q-01).

### UJ-1 — Aïssatou achète sa première formation `[HYPOTHÈSE]`

Aïssatou a 27 ans, chargée de communication dans une PME à Dakar, et gère la page Instagram de sa
cousine coiffeuse le week-end. Un jeudi soir, dans les transports, elle tombe sur un extrait de
podcast partagé dans un groupe WhatsApp professionnel. Elle arrive sur un article de blog depuis
son téléphone, en 4G, avec un forfait qu'elle surveille.

Elle lit, elle repart. Trois jours plus tard une recherche Google la ramène sur une fiche
formation. Elle regarde le prix — **entre 95 000 et 200 000 FCFA**, soit 1,8 à 3,8 mois de SMIG —
et ne s'inscrit pas. Elle revient une semaine après, crée un compte, rouvre la fiche, lit la FAQ,
cherche des avis. **Le prix la fait hésiter plus longtemps que le contenu ne la convainc.**

> ⚠️ **Ce qui ne peut pas arriver dans ce parcours, aujourd'hui : qu'on la fasse revenir.** Le
> produit n'a aucun canal d'envoi d'e-mail (R-14). Entre son départ et son retour, il ne se passe
> rien d'autre que sa propre initiative — ou une pop-up si elle revient d'elle-même.

Au paiement, elle est sur mobile, choisit Wave, est redirigée vers une page hébergée, valide sur
son téléphone, revient. `[HYPOTHÈSE]` *C'est là que se perd le plus de monde — mais l'endroit
exact de la rupture n'est pas mesuré, et c'est précisément l'objet de FR-068.*

Elle ouvre la première leçon le soir même, puis plus rien pendant huit jours. Une relance
*applicative* — une notification dans son espace, pas un e-mail — la fait revenir. Elle termine, obtient son certificat, et le partage sur LinkedIn — où la portée
publicitaire sénégalaise est de 1,50 million de personnes, soit 7,9 % de la population *(fait
sourcé, DataReportal 2026)*.

**Ce que ce parcours exige :** que le tunnel survive à une session interrompue et reprise des
jours plus tard, sur un appareil modeste et une connexion payée au mégaoctet (NFR-05) ; que le
prix soit cadré avant d'être affiché (FR-074) ; et que le certificat soit une pièce publiquement
vérifiable, pas une image (FR-025).

### UJ-2 — Moussa renouvelle (ou non) son abonnement au Club `[HYPOTHÈSE]`

Moussa a 34 ans, freelance en growth à Abidjan. Il a rejoint le Club après une formation, séduit
par les opportunités et les sessions live. Deux mois d'activité, puis son travail reprend et il
n'ouvre plus l'onglet.

Onze mois plus tard, une notification lui annonce l'échéance. **Il n'a subi aucun prélèvement
mensuel qui l'aurait tenu au courant de ce qu'il payait : il redécouvre 19 900 FCFA d'un coup, et
évalue une année entière en une minute.**

**Ce que ce parcours exige :** que la valeur du Club soit *rendue visible en continu* pendant les
onze mois de silence (FR-076), et que le renouvellement soit préparé bien avant l'échéance
(FR-077). `[HYPOTHÈSE]` *Le churn médian des communautés payantes est donné à 5,8 % par mois —
environ 51 % par an — par un agrégateur dont la méthodologie n'est pas auditée. La même source
donne **3 à 5 % par mois** pour les formats cohorte et communauté, qui correspondent mieux au
Club. Aucune de ces bandes n'est régionale.* Ce qui ne dépend d'aucune de ces sources, en
revanche : un abonnement annuel ne supprime pas le churn, **il le concentre sur un instant.**

### UJ-3 — Fatou, gérante de boutique, demande un devis `[HYPOTHÈSE]`

Fatou a 41 ans et tient une boutique de cosmétiques aux Almadies. Chiffre d'affaires **`[FICTIF]`
d'environ 1,2 million de FCFA par mois**. Elle vend déjà par WhatsApp et par sa page Facebook,
qui lui coûtent zéro franc. *Au Sénégal, Facebook touche 3,60 millions de personnes pour
11,5 millions d'internautes — soit environ **31 % des internautes**, dérivé de deux chiffres
primaires (DataReportal 2026). En Côte d'Ivoire la proportion monte à environ 63 %, mais c'est un
autre marché : appliquer le chiffre ivoirien à une commerçante dakaroise doublerait la portée du
substitut.* Ce substitut gratuit reste son vrai point de comparaison.

Elle arrive sur `/presence-digitale`, répond au sélecteur en trois questions, voit un pack à
495 000 FCFA, remplit le formulaire. Un devis partageable est généré, la conversation bascule sur
WhatsApp.

**C'est là que le parcours se heurte au marché.** Si on lui propose un pack puis
l'accompagnement, elle compare — spontanément — un site à 400 000 francs une fois à ce que lui
coûterait la première année complète. `[HYPOTHÈSE]` *Ce prix de 400 000 est un prix affiché
par des agences de la place, relevé sur leurs propres pages ; la recherche le qualifie de
structurellement biaisé à la hausse, et le §2.2 de ce document classe les prix transactés comme
« le trou principal ». C'est un ordre de grandeur, pas une référence.* Sur son chiffre d'affaires
supposé, ce poste représenterait `[FICTIF]` **de 20 à 25 % la première année** (voir D-01 pour le
calcul et ses bornes).

**Ce que ce parcours exige :** que le segment de Fatou soit servi par un pack et non par un
accompagnement (D-01), et que l'écart d'ancrage soit désamorcé **en amont du tunnel** (FR-079).

### UJ-4 — Rysmo opère la plateforme, seul `[HYPOTHÈSE]`

L'opérateur est une personne. Il publie les articles, monte les fiches formation, importe les
épisodes, modère le Club, répond aux messages, suit les transactions, qualifie les prospects TPE,
et arbitre les litiges de paiement. Dix-neuf écrans d'administration existent pour ça.

**Cette contrainte n'est pas une faiblesse à masquer : c'est le paramètre de conception le plus
déterminant du produit.** Elle explique pourquoi l'automatisation est partout, pourquoi Rysmo est
plafonné au quota, pourquoi le Club a un digest hebdomadaire automatique et un classement
reconstruit par lot, et pourquoi la traduction anglaise est générée puis mise en cache.

**Ce que ce parcours exige :** que toute fonctionnalité nouvelle arrive avec son coût
opérationnel chiffré (NFR-11), et que la charge de support par utilisateur actif soit suivie
comme contre-métrique de premier rang (M-01).

---

## 5. PARTIE A — Le produit tel qu'il est en production

Chaque exigence de cette partie est **constatée dans le code au 29 août 2026** et porte une
**conséquence vérifiable** — la condition qu'un test ou une relecture peut trancher. Les
identifiants FR sont stables et globaux : ils ne seront jamais réattribués.

> **Ce que « constaté » veut dire, et ne veut pas dire.** La version 1 de ce document affirmait
> soixante-sept exigences comme constatées ; une vérification exigence par exigence contre le
> code en a trouvé **quatre fausses et dix partielles**. Les fausses venaient toutes d'une même
> faute : avoir fait confiance à un document d'audit daté plutôt qu'au code. Les quatre défauts
> ont été corrigés dans le produit, les dix formulations partielles ont été resserrées, et les
> limites qui subsistent sont désormais écrites dans l'exigence elle-même.

### 5.1 Périmètre livré

| Domaine | Surface |
|---|---|
| Pages publiques | 20 routes, chacune montée en français canonique et en anglais sous `/en` |
| Espace apprenant | 10 onglets, plus lecteur de cours, tunnel d'achat et certificat |
| Club des Digitos | 8 onglets de navigation (11 fichiers ; `agenda` regroupe événements et sessions) |
| Administration | 19 écrans, dont 5 ouverts au rôle `support` |
| Données | 44 collections de premier niveau et 8 sous-collections, règles testées sous émulateur (43 tests) |
| Traitements serveur | 46 fonctions Cloud v2 et trois applications Cloudflare Workers |
| Langues | 23 espaces de noms × 2 langues (8 chargés statiquement, 15 à la demande), segments d'URL traduits |

### 5.2 Acquisition et contenu public

- **FR-001** — La plateforme publie quatre familles de contenu gratuit : articles, épisodes de
  podcast, vidéos, et questions fréquentes. *Conséquence : les trois premières ont un index et
  une page de détail adressable ; **la FAQ n'a qu'un index — il n'existe pas de page par
  question**, ce qui la prive d'URL partageable et de position propre en recherche.*
- **FR-002** — Les épisodes sont importables depuis Spotify et les métadonnées vidéo depuis
  YouTube, **par proxy serveur**. *Conséquence : aucune clé d'API tierce n'est présente dans le
  bundle client — vérifiable par inspection du build.*
- **FR-003** — Les statistiques de diffusion sont synchronisées périodiquement. *Conséquence :
  la synchronisation est planifiée côté serveur et déclenchable à la demande par l'administration ;
  un compteur affiché ne dépend jamais d'un appel client à une API tierce.*
- **FR-004** — Un flux RSS et un plan de site sont générés à la demande. *Conséquence : **seul le
  plan de site** porte les paires FR/EN et les alternances `hreflang` ; le flux RSS n'en a pas.*
- **FR-005** — Chaque page de contenu émet des données structurées adaptées à son type et une
  carte sociale rendue côté serveur. *Conséquence : un validateur de données structurées accepte
  chaque page de détail sans erreur. **Limite connue** : le fil d'Ariane manque sur quatre pages
  publiques et la liste d'éléments n'existe que sur le catalogue (FR-108).*
- **FR-006** — L'inscription à la newsletter **exige un consentement explicite** : case jamais
  pré-cochée, lien vers la politique de confidentialité, horodatage conservé. *Conséquence : la
  règle Firestore **refuse** une écriture sans `consent == true` — couvert par un test de règles
  dédié.* *Limite : **la liste ainsi constituée n'est envoyée nulle part** — le produit n'a
  aucun canal d'envoi d'e-mail (FR-035, R-14).*
- **FR-007** — Six pop-ups sont pilotées par un registre unique, avec déclencheurs distincts,
  **groupe témoin et mesure d'effet**. *Conséquence : aucune pop-up ne peut exister hors du
  registre — couvert par un test unitaire.*
- **FR-008** — Un système de redirections administrable couvre les URL héritées et les liens de
  campagne. *Conséquence : une redirection créée depuis l'administration est servie au bord sans
  redéploiement. **Elle exige en revanche que le code du Worker soit à jour** — la table est lue
  par lui, pas par l'hébergement (R-11).*

### 5.3 Compte, identité et rôles

- **FR-009** — Authentification par e-mail et mot de passe ou via Google, avec réinitialisation.
  *Conséquence : un compte créé par l'un des deux moyens accède au même espace et aux mêmes
  inscriptions ; le rôle par défaut est `student` et ne peut pas être élevé depuis le client — les
  règles interdisent au titulaire de modifier son propre rôle.*
- **FR-010** — Trois rôles : `student`, `admin`, `support`. *Conséquence : le rôle `support`
  atteint **exactement cinq écrans** — messages, témoignages, rendez-vous, prospects, projets — et
  toute autre URL d'administration le renvoie vers `/403`. Le périmètre est déclaré **une seule
  fois**, lu à la fois par le menu et par le garde de route.*
- **FR-011** — Chaque compte porte des préférences. *Conséquence : la langue et le thème sont
  effectifs ; **le champ de réglage des notifications est stocké mais n'est lu nulle part** — il
  ne produit aucun effet aujourd'hui.*
- **FR-012** — L'utilisateur peut **exporter ses données** et **supprimer son compte**, par
  traitement serveur dédié. *Conséquence : l'export produit un document reprenant l'ensemble des
  collections où l'utilisateur apparaît, et la suppression retire à la fois le compte
  d'authentification et ses documents. Aucune des deux opérations ne passe par le support.*
- **FR-013** — Un centre de notifications applicatives couvre cinq types : inscription,
  certificat, contenu, club, système. *Conséquence : chaque notification est écrite dans une
  sous-collection propre à son destinataire, lisible par lui seul. **Ce centre est aujourd'hui le
  seul canal sortant du produit** — voir R-14.*

### 5.4 Catalogue, achat et paiement

- **FR-014** — Le catalogue expose des formations en modules et leçons, avec prix, prix
  promotionnel optionnel et ressources attachées. **Fourchette pratiquée : 95 000–200 000 FCFA.**
  *Conséquence : seules les formations en statut publié apparaissent au catalogue, et le prix
  promotionnel, quand il existe, prime sur le prix courant — dans l'affichage comme au débit.*
- **FR-015** — Le paiement passe par Bictorys, en francs CFA. *Conséquence : Wave, Orange Money et
  la carte sont proposés au tunnel ; **« Free Money » n'apparaît que dans les conditions générales
  et n'est pas offert au paiement** — l'écart est contractuel, pas cosmétique.*
- **FR-016** — **Le prix débité est toujours relu côté serveur.** Le client n'envoie jamais de
  montant. *Conséquence : sans exception pour les formations, le Club et Rysmo — vérifiable par
  lecture des quatre fonctions de charge.*
- **FR-017** — Une formation gratuite crée inscription et transaction en une écriture par lot.
  *Conséquence : les deux documents existent ou aucun. Les règles n'autorisent une transaction
  créée par le client que si son montant est nul — un cours payant ne peut pas être auto-inscrit.*
- **FR-018** — Le webhook **dédoublonne par identifiant de charge**, contrôle le montant, et
  applique ses effets **avant** de marquer la transaction terminée. *Conséquence : rejouer
  le même webhook ne crée ni double inscription ni double transaction ; un montant reçu inférieur
  au prix serveur n'ouvre aucun accès ; et une interruption entre l'effet et le marquage laisse une
  transaction rejouable, jamais un accès accordé sans trace. Point le plus rigoureux du système —
  aucune évolution ne doit affaiblir cet ordre.*
- **FR-019** — Des coupons administrables sont validés côté serveur. *Conséquence : le code est
  relu dans la collection au moment de la charge — validité, plafond d'utilisations, type et
  valeur de la remise. Un coupon expiré ou épuisé n'altère pas le montant débité, quel que soit ce
  que le client envoie.*
- **FR-020** — Le parrainage accorde **15 % de remise au filleul**, appliquée exclusivement côté
  serveur. *Conséquence : 19 900 → 16 915 FCFA, couvert par un test unitaire.*
- **FR-021** — L'historique des transactions est réconciliable par l'administration.
  *Conséquence : **il n'existe aucun écran d'historique côté apprenant** — un acheteur ne peut pas
  consulter ses propres paiements dans son espace.*

### 5.5 Apprentissage et certification

- **FR-022** — Le lecteur suit la progression leçon par leçon et la conserve entre sessions et
  appareils. *Conséquence : la progression est stockée sur l'inscription, pas dans le navigateur ;
  une leçon cochée sur téléphone est cochée sur ordinateur. Elle peut redescendre — décocher est
  permis — mais le repère de progression maximale, lui, ne décroît jamais (FR-026).*
- **FR-023** — L'apprenant prend des notes personnelles. *Conséquence : elles vivent dans une
  sous-collection de son propre document utilisateur, lisible par lui seul, et survivent à la fin
  du cours. Créer une note rapporte de l'expérience, la rééditer n'en rapporte pas.*
- **FR-024** — **À 100 % de progression, un certificat est émis par traitement serveur**, avec un
  code de vérification généré cryptographiquement. *Conséquence : la complétion est **re-dérivée
  côté serveur** depuis l'ensemble réel des leçons, jamais depuis le champ de progression
  modifiable par le client.*
- **FR-025** — Chaque certificat est vérifiable publiquement, sans compte, à une URL portant
  son code. *Conséquence : la vérification lit un miroir public indexé par le code, qui ne porte
  **aucun identifiant d'utilisateur** et **ne peut pas être énuméré** — un visiteur anonyme
  résout un code, personne ne peut lister les certificats émis. Couvert par quatre tests de
  règles. Le certificat affiche le nom de son titulaire.*
- **FR-026** — La gamification couvre **neuf barèmes d'expérience**, dix niveaux, dix badges,
  un compteur de séries et son record. *Conséquence : les neuf barèmes sont câblés — terminer une
  leçon, un module ou une formation rapporte de l'expérience. **Un palier ne peut être encaissé
  qu'une fois** : un repère de progression maximale, que la règle Firestore empêche de décroître,
  interdit de refarmer en décochant puis recochant une leçon, tout en laissant décocher.*
- **FR-027** — Un classement communautaire est reconstruit par lot, à intervalle régulier et à la
  demande de l'administration. *Conséquence : il est servi depuis un document agrégé unique.
  **Aucun client ne lit les profils de gamification des autres membres** — les règles l'interdisent,
  précisément parce qu'une lecture directe divulguait l'expérience et les séries de tout le monde.*
- **FR-028** — Des relances automatiques existent sur la reprise de cours et la série quotidienne.
  *Conséquence : elles sont planifiées côté serveur et **écrivent dans le centre de notifications
  applicatif**. Elles ne partent pas par e-mail, faute de canal (R-14) : une personne qui ne revient
  pas d'elle-même ne les voit jamais.*
- **FR-029** — L'apprenant peut soumettre un témoignage, sous forme de texte, d'audio ou de
  vidéo. *Conséquence : il est créé en statut en attente et n'apparaît publiquement qu'après
  approbation. La soumission rapporte de l'expérience, l'approbation n'en rapporte pas — c'est
  l'effort qui est récompensé, pas la décision de l'administrateur.*

### 5.6 Club des Digitos

- **FR-030** — L'accès est conditionné à un abonnement annuel actif. **19 900 FCFA par an**,
  source de vérité unique côté client. *Conséquence : la cohérence entre le tarif affiché et le
  texte des conditions générales est couverte par un test unitaire — c'est par son absence que
  les CGV ont pu annoncer 10 000 FCFA pendant que le code en prélevait 19 900.*
- **FR-031** — Le Club offre **huit onglets de navigation** : fil, discussions, membres, agenda
  (événements et sessions), classement, opportunités, informations, parrainage. *Conséquence : les
  huit sont derrière le mur d'abonnement — un compte sans abonnement actif n'atteint aucun contenu
  du Club, y compris par URL directe.*
- **FR-032** — Les publications acceptent mentions j'aime, republications et commentaires, et
  sont classées par catégorie. *Conséquence : chaque interaction est attribuée à son auteur et
  réversible par lui seul ; le décompte affiché dérive des listes stockées, il n'est pas un
  compteur libre que le client pourrait incrémenter.*
- **FR-033** — Les événements et sessions gèrent leurs inscriptions, en ligne comme en présentiel.
  *Conséquence : une inscription est un document identifié par l'utilisateur sous l'événement — se
  réinscrire ne crée pas de doublon, et personne ne peut inscrire quelqu'un d'autre.*
- **FR-034** — Une messagerie privée entre membres existe, **avec mécanisme de signalement**.
  *Conséquence : un signalement crée un document portant l'auteur du signalement, la personne
  signalée et le message incriminé, dans une collection que seule l'administration lit. Le
  signalement n'est pas révocable par la personne signalée.*
- **FR-035** — Un digest hebdomadaire est composé automatiquement. *Conséquence et limite
  majeure : il est **écrit dans le centre de notifications de l'application et dans le contenu du
  Club — il n'est pas envoyé par e-mail.** Le produit ne porte **aucune dépendance d'envoi**, ni
  service tiers, ni extension : la personne ne voit le digest que si elle revient d'elle-même.
  Voir R-14.*
- **FR-036** — Des défis communautaires sont administrables. *Conséquence : ils sont créés et
  clos depuis l'espace d'administration du Club ; aucun membre ne peut en créer.*

### 5.7 Rysmo — l'assistant pédagogique

- **FR-037** — Rysmo s'appuie sur **le catalogue publié et la progression réelle** de la personne.
  *Conséquence : pour un apprenant inscrit et en cours, la réponse cite une leçon de ses propres
  cours avant d'en suggérer un nouveau ; pour un apprenant inactif, elle l'invite à reprendre là
  où il s'est arrêté. Un contenu non publié n'est jamais cité.*
- **FR-038** — Le contexte transmis au modèle est **borné par collection**. *Conséquence : le coût
  par requête est plafonné indépendamment de la taille du catalogue.*
- **FR-039** — Rysmo entretient une mémoire de profil que l'utilisateur peut **consulter et
  effacer**. *Conséquence : l'effacement est immédiat et sans recours au support ; la mémoire se
  reconstitue ensuite à partir des seuls échanges postérieurs.*
- **FR-040** — L'accès est **plafonné par quota quotidien** : 2 en gratuit, 5 pour un membre du
  Club, 20 en Lite, 100 en Pro. *Conséquence : le quota est décompté serveur et remis à zéro par
  jour calendaire ; la requête au-delà du plafond est refusée avant tout appel au modèle, donc sans
  coût. Choix de marge assumé — aucun acteur mondial comparable ne vend l'IA en illimité inclus
  (R-09).*
- **FR-041** — Packs de requêtes (30/100/300 pour 500/1 500/3 500 FCFA) et abonnements mensuels
  (Lite 3 000, Pro 7 500 FCFA). *Conséquence : un pack acheté s'ajoute au solde et **ne se périme
  pas au changement de jour**, contrairement au quota quotidien ; un abonnement actif remplace le
  quota de base au lieu de s'y ajouter.*
- **FR-042** — L'administration peut ajuster le quota d'un compte. *Conséquence : l'ajustement
  laisse une trace d'audit (FR-063).*
- **FR-043** — L'usage est borné par le quota quotidien. *Conséquence : **il n'existe pas de
  limitation de débit distincte** — un compte disposant d'un large quota peut le consommer aussi
  vite qu'il le souhaite.*
- **FR-044** — Rysmo peut analyser un CV déposé par l'utilisateur. *Conséquence : l'analyse se
  fait côté serveur et le fichier n'est pas conservé au-delà du traitement.*
- **FR-045** — Une relance de coaching automatique existe. *Conséquence : elle est planifiée
  côté serveur et **écrit dans le centre de notifications**, comme FR-028 — elle ne part pas par
  e-mail (R-14).*

> **Garde-fou dans le code :** l'invite système interdit à Rysmo d'inventer tout fait au-delà des
> informations fournies. C'est une exigence produit, pas un réglage.

### 5.8 Présence Digitale — les commerces de proximité

- **FR-046** — `/presence-digitale` présente l'offre avec grille publique complète et sélecteur
  de pack en trois questions. *Conséquence : le sélecteur aboutit toujours à une recommandation,
  y compris quand les réponses ne tranchent pas — l'indécision est une valeur de sortie prévue,
  pas une impasse.*
- **FR-047** — Trois packs (295 000, dont **250 000 en promotion de lancement** ; 495 000 ;
  895 000 FCFA), deux accompagnements (375 000 + 175 000/mois ; 750 000 + 225 000/mois sur six
  mois) et six options sont définis dans une **source de vérité unique**, qui porte aussi un
  **prix plancher jamais affiché**. *Conséquence : le prix d'entrée réellement pratiqué est
  250 000, pas 295 000 — couvert par un test unitaire.*
- **FR-048** — Une preuve interactive fondée sur Google Maps est **la seule démonstration de la
  page**. *Limite : son socle de données régionales est vide — voir R-06.*
- **FR-049** — Le formulaire produit un **devis partageable à URL propre**, puis bascule sur
  WhatsApp. *Conséquence : le devis est consultable sans compte par qui détient le lien, et son
  contenu est figé à l'émission — une évolution de la grille tarifaire ne réécrit pas un devis déjà
  envoyé.*
- **FR-050** — **Les données du devis sont séparées des données personnelles.** *Conséquence : la
  collection de devis n'en contient aucune, et les règles l'imposent explicitement. Point de
  conception remarquable, à préserver.*
- **FR-051** — Les prospects sont suivis par statut : nouveau, qualifié, devisé, signé, perdu.
  *Conséquence : le statut est modifiable par l'administration seule, et un prospect perdu reste
  consultable — rien n'est supprimé du suivi commercial.*
- **FR-052** — Les devis expirés sont purgés automatiquement. *Conséquence : passé sa date de
  validité, l'URL d'un devis ne résout plus. La purge est planifiée côté serveur et ne touche pas
  au prospect, qui reste au suivi.*

### 5.9 Max-Morrys Agency — la practice high-ticket

- **FR-053** — `/agence` **ne publie aucune grille tarifaire**. *Conséquence : le formulaire
  demande une fourchette budgétaire au prospect au lieu de lui en annoncer une, et aucun montant
  n'apparaît sur la page. C'est une décision de positionnement : la page qui publie ses prix est
  `/presence-digitale`, et les deux ne doivent jamais converger.*
- **FR-054** — Neuf types de projet. Les demandes `growth` sont **enregistrées et tagguées
  `MY_ONOMA_GROW`**. *Conséquence : **aucun prospect n'est jamais rejeté** — il est réorienté.*
- **FR-055** — Les demandes sont suivies par statut jusqu'à la signature : nouveau, qualifié,
  cadrage, proposition, gagné, perdu. *Conséquence : elles vivent dans une collection **distincte**
  de celle des prospects TPE, aux schémas volontairement non fusionnés — confondre les deux
  mélangerait deux cycles de vente qui n'ont ni la même durée ni le même interlocuteur.*
- **FR-056** — Les anciennes URL de devis redirigent vers la nouvelle route. *Conséquence : un
  devis émis avant le déplacement de l'offre reste atteignable par son lien d'origine.*

### 5.10 Administration et exploitation

- **FR-057** — Dix-neuf écrans couvrent le pilotage, le contenu, la communauté et le commerce.
  *Conséquence : chacun est atteignable par une URL propre, et le rôle `support` en atteint cinq
  (FR-010). Le nombre d'écrans du menu et le nombre de routes gardées sont égaux par construction —
  ils lisent la même source.*
- **FR-058** — Un éditeur de texte riche gère le contenu éditorial, avec **assainissement
  systématique du HTML rendu**. *Conséquence : un script injecté dans un article ne s'exécute pas à
  l'affichage, et les URL d'images sont assainies séparément. L'assainisseur vit dans un module à
  part, chargé seulement là où du HTML est rendu — il pèse une centaine de kilo-octets (NFR-04).*
- **FR-059** — L'administration peut créer un compte et gérer une inscription, par traitement
  serveur authentifié. *Conséquence : le traitement revérifie le rôle de l'appelant côté serveur —
  un client modifié ne suffit pas — **et ne permet pas de créer un compte administrateur**. Chaque
  opération laisse une trace d'audit (FR-063).*
- **FR-060** — Les statistiques d'administration s'appuient sur des agrégats serveur.
  *Conséquence : un décompte d'utilisateurs ou de transactions ne télécharge pas la collection pour
  la compter. Le coût de lecture du tableau de bord ne croît donc pas avec la base.*
- **FR-061** — Une sauvegarde Firestore est planifiée, le stockage temporaire nettoyé.
  *Conséquence : il existe à tout moment une copie de la base datée de moins d'un cycle de
  planification. **Sa restauration n'a jamais été exercée** — voir §2.2 de l'addendum : il n'existe
  aucun environnement où l'exercer.*
- **FR-062** — La suppression d'un contenu déclenche le nettoyage de ses dépendances.
  *Conséquence : supprimer un article, une formation, un podcast ou une vidéo retire aussi ses
  commentaires, ses médias et ses références — aucun document orphelin ne subsiste, et aucune page
  de détail ne reste servie pour un contenu disparu.*
- **FR-063** — Un journal d'audit immuable enregistre les opérations privilégiées. *Conséquence
  et limite : il couvre **les quatre opérations qui passent par une fonction serveur
  authentifiée** — création de compte, gestion d'inscription, ajustement de quota Rysmo, émission
  de certificat. **Les écrans qui écrivent directement dans Firestore depuis le navigateur ne
  sont pas tracés** (FR-092). La collection est fermée en écriture au client, y compris aux
  admins : un journal auquel le sujet de l'audit peut écrire ne vaut rien.*

### 5.11 Bilinguisme et référencement

- **FR-064** — L'arbre de routes est **monté deux fois**, et **les segments d'URL sont traduits**.
  *Conséquence : ajouter une route impose deux éditions, et chaque valeur anglaise doit être
  unique sur toute la table — couvert par un test unitaire.*
- **FR-065** — Vingt-trois espaces de noms couvrent la copie. *Conséquence : **aucune chaîne
  accentuée n'est codée en dur dans les pages** — à une exception connue : le sélecteur
  téléphonique embarque cent quatre-vingt-dix noms de pays en français, jamais traduits.*
- **FR-066** — Le contenu éditorial est traduit vers l'anglais et mis en cache au pré-rendu.
  *Conséquence : un article publié en français est lisible sous `/en` sans intervention humaine, et
  la traduction n'est pas recalculée à chaque visite. **Une correction du texte français ne se
  propage qu'à l'expiration du cache** — il n'y a pas d'invalidation manuelle.*
- **FR-067** — Le pré-rendu sert aux robots une page complète. *Conséquence : un robot qui
  n'exécute pas de JavaScript reçoit le titre, la description, le contenu et les données
  structurées de la page demandée — pas la coquille de l'application. **Trois copies des valeurs
  par défaut coexistent** et peuvent diverger sans que rien ne le signale (FR-087).*

---
## 6. PARTIE B — Exigences de la phase suivante

Rien de cette partie n'est livré. Elle s'ouvre sur trois décisions qui doivent être tranchées
avant que les exigences qui suivent aient un sens.

### 6.1 Les trois décisions bloquantes

#### D-01 — Le bas de la cible TPE n'est pas finançable au tarif d'accompagnement

**Le calcul, sur la grille réelle** *(tarifs publiés, pas de chiffre inventé)*. Le générateur de
devis additionne **le pack et la mise en place du plan** — c'est ce que le prospect voit sur son
devis — d'où une fourchette selon le pack retenu :

| CA mensuel du commerce | Année 1, plan seul | Année 1, pack d'entrée + plan | Année 1, pack Visible + plan |
|---|---|---|---|
| 800 000 FCFA — plancher déclaré de l'ICP | 2 475 000 → 25,8 % | 2 725 000 → 28,4 % | 2 970 000 → 30,9 % |
| 2 000 000 FCFA | 10,3 % | 11,4 % | 12,4 % |
| 5 000 000 FCFA — plafond de l'ICP | 4,1 % | 4,5 % | 4,95 % |

> **Erratum.** Deux corrections par rapport aux versions précédentes de ce document. La v1 annonçait
> 21,9 % — l'abonnement seul, sans la mise en place. La v2 annonçait 25,8 % — le plan seul, sans
> le pack, alors que le devis les additionne. **Au plancher de l'ICP, la facture de première année
> représente en réalité 26 à 31 % du chiffre d'affaires selon le pack.** L'erreur allait toujours
> dans le même sens : sous-estimer.

`[HYPOTHÈSE]` *Ces pourcentages supposent douze mensualités sur l'année. Or l'accompagnement
Croissance **ne porte aucune clause d'engagement** — seul Commerce 360 en a une, de six mois — et
le modèle financier de la ligne table sur **4,6 mois de facturation moyens en première année**,
une mise en place livrée au mois m ne convertissant qu'à m+1. Le coût réellement supporté par un
client qui part en cours d'année est donc plus faible ; le coût annoncé au moment de la vente,
lui, est bien celui du tableau.*

**Le repère de comparaison, et sa faiblesse.** Les fourchettes budgétaires usuelles pour ce type
de poste tournent autour de 7 à 16 % du chiffre d'affaires annuel — **mais ce repère est établi
sur des PME françaises**, et le §2.2 de ce document interdit précisément d'emprunter des repères
occidentaux faute de données locales. `[HYPOTHÈSE]` *La tension est assumée et signalée : aucun
repère budgétaire ouest-africain n'existe. Ce qui ne dépend d'aucun repère, en revanche, c'est
qu'un poste de dépense à un quart du chiffre d'affaires ne se finance pas.*

**Trois issues, il faut en choisir une :**

| Option | Conséquence |
|---|---|
| Segmenter — le palier 800 k–2 M est servi par un pack seul, l'accompagnement démarre au-dessus | Préserve la grille. `[HYPOTHÈSE]` sur la taille relative de chaque palier — inconnue |
| Créer un palier d'accompagnement bas | Nouvelle offre à concevoir et à rendre rentable en solo — coût à chiffrer contre NFR-11 |
| Relever le plancher de l'ICP | Le plus honnête ; réduit mécaniquement le volume de prospects qualifiés |

**Recommandation.** Segmenter. Le pack seul est déjà l'offre naturelle de ce palier, et le prix
plancher existe déjà dans le code pour encadrer la négociation.

#### D-02 — Le mécanisme censé briser le plafond de la ligne TPE n'a pas de rail d'encaissement

**Le modèle réel de la ligne, et son risque n°1.** `docs/OFFRE_AGENCE_TPE.md` décrit un modèle
**setup-first** : la mise en place est vendue seule (60 % à la commande, 40 % avant mise en ligne),
l'accompagnement mensuel est vendu ensuite. Sa contrainte structurelle est explicite : **en solo,
chaque franc exige une nouvelle livraison. À 3–4 mises en place par mois, le plafond de la ligne
est d'environ 20 millions XOF par an.**

**Ce qui casse ce plafond est la conversion des clients livrés vers l'accompagnement** — d'où le
KPI central de la ligne, **≥ 40 % de conversion mesurés à J+30**, à la fin du support inclus
(M-12).

**Le fait qui met ce mécanisme en danger.** **Wave, dominant au Sénégal, ne prend pas en charge le
paiement récurrent par API.** Seuls Orange Money Côte d'Ivoire et MTN MoMo Côte d'Ivoire le font
nativement ; le module d'abonnement de CinetPay est en bêta depuis 2025.

**Trois conséquences :**

1. **Le churn est actif, pas passif.** Le client re-décide douze fois par an. Un abonnement qu'on
   doit redemander n'a pas la même économie qu'un abonnement qu'on oublie.
2. **L'engagement de six mois de Commerce 360 n'est pas exécutoire en pratique** face à un
   commerce informel — et 85 à 97 % des unités économiques sénégalaises le sont.
3. **Le coût de recouvrement s'impute sur l'opérateur unique** : douze relances par client et par
   an, à une personne déjà au plafond de livraison (NFR-11).

**La sortie de plafond de la ligne repose donc sur un revenu que rien n'encaisse
automatiquement.** Trois options : basculer vers un prépaiement semestriel ou annuel remisé,
assumer le recouvrement manuel et l'inscrire au coût d'exploitation, ou restreindre
l'accompagnement aux zones où le prélèvement existe.

> Les gabarits contractuels de la ligne portent déjà une procédure de conversion J−3 → J+30. Elle
> est à raccrocher à M-12 plutôt qu'à réinventer.

#### D-03 — Les chiffres affichés en façade sont contredits par la base de production

**La question n'est plus de savoir si ces chiffres sont sourcés.** Le relevé du 30 août les
contredit un par un.

| Chiffre affiché en façade | Ce que dit la base | Écart |
|---|---|---|
| **98 %** de complétion | **0 %** — 2 inscriptions, toutes deux à 0 % de progression | absolu |
| **1 486** étudiants revendiqués, « 50+ » affichés | **3** comptes apprenants | facteur 495 |
| **45 000 000 XOF** de revenu cumulé | **0 XOF** — une seule transaction, en attente | absolu |
| **94 %** de taux de réussite | **0 certificat émis** | absolu |
| **+340 %** (accueil) contre **+1 790 %** (À propos) de trafic | Non vérifiable ici, et les deux valeurs se contredisent déjà entre elles | — |
| **~85 %** du CA porté par les formations | Il n'y a pas de chiffre d'affaires à répartir | sans objet |
| Portraits du fondateur | Générés par IA, aucune photographie réelle au dépôt | — |

**Ce n'est plus un risque de crédibilité, c'est une exposition.** Des chiffres publiés en
contradiction avec la réalité de l'exploitation ne se plaident pas comme une approximation
marketing : ils engagent l'entreprise et son dirigeant, et n'importe quelle diligence les trouve
en quelques minutes — comme celle-ci vient de le faire.

**Il n'y a donc pas d'arbitrage à rendre, seulement une exécution : ces chiffres sortent du site
public.** Pas « sont sourcés », pas « sont nuancés ». Sortent.

*Et la position de repli est meilleure que ce qu'elle remplace.* Une plateforme neuve, complète,
bilingue, avec un tunnel de paiement éprouvé et quarante-six articles publiés, se présente très
bien. Une plateforme qui revendique 1 486 étudiants et n'en a trois ne se présente plus du tout,
une fois le chiffre vérifié.

### 6.2 Exigences de la phase suivante

**Dans quel ordre.** Les huit groupes ci-dessous ne se valent pas. Trois seulement conditionnent
les autres :

| Rang | Ce qu'il faut faire | Pourquoi ce rang |
|---|---|---|
| **1** | **FR-111 — publier une formation** | Le catalogue est vide. Aucune autre exigence ne produira un franc tant que rien n'est achetable. Ni développement ni décision : de l'édition |
| **2** | **D-03 — retirer les chiffres faux du site** | Exposition, pas optimisation. Indépendant de tout le reste, exécutable le même jour |
| **3** | Ce que le produit promet sans le tenir | FR-101 (canal e-mail) débloque à lui seul cinq autres exigences |
| **4** | Mesure et vérité | *Après* le premier achat, pas avant : instrumenter un entonnoir vide ne mesure rien |
| 5–8 | Prix · Club · Ligne TPE · Conformité · Écarts de Partie A · Dette | Ordonnancement libre, à arbitrer au découpage en lots |

> **Ce que le relevé du 30 août déplace.** Les versions précédentes plaçaient la mesure au premier
> rang. C'était juste pour une plateforme qui vend sans savoir où elle perd ; c'est faux pour une
> plateforme dont le catalogue est vide. **On ne mesure pas un entonnoir avant d'y faire entrer
> quelqu'un.**

**Critère d'acceptation.** Chaque exigence porte une clause **Fait quand** : la condition
observable qui permet de la déclarer close. Elle n'est pas une suggestion de mise en œuvre — deux
équipes peuvent la satisfaire différemment — mais elle ne se satisfait pas à moitié. Une exigence
sans clause vérifiable ne peut pas être découpée en récits, et c'est l'usage prévu de ce document.


#### Ouvrir la boutique — préalable à tout

- **FR-111** — **Publier au moins une formation achetable.** *Deux formations existent en base,
  aucune n'est en statut publié : un visiteur qui atteint `/formations` ne peut rien acheter, et
  aucune des cent dix autres exigences de ce document ne produira un franc tant que c'est vrai.
  Cette exigence ne demande ni développement ni arbitrage — le tunnel d'achat est construit,
  éprouvé par ses tests, et n'attend qu'un produit.*
  **Fait quand** : un visiteur non connecté voit au moins une formation au catalogue, ouvre sa
  fiche, atteint le paiement, et une transaction en statut complété existe en base — fût-elle la
  vôtre.

#### Mesure et vérité

- **FR-068** — Exploiter l'instrumentation du tunnel d'achat pour localiser la rupture réelle,
  et **combler ses deux trous**. *Le tunnel émet déjà consultation → ajout au panier → début de
  paiement → achat, côté formation comme côté agence : l'exigence n'est pas de le réinstrumenter.
  Ce qui manque est (a) l'angle mort de la redirection vers le prestataire de paiement, où se joue
  probablement l'abandon, (b) le délai entre le paiement et la première leçon ouverte (M-11), et
  (c) l'exploitation effective — aucune de ces données n'est lue aujourd'hui.*
  **Fait quand** : un tableau nomme le pourcentage de perte à chacune des cinq étapes, dont la redirection vers le prestataire, et le délai médian entre paiement et première leçon est connu.

- **FR-069** — Publier un **taux de complétion mesuré** et retirer toute valeur non calculée.
  *Le relevé du 30 août donne la première mesure : **0 %** sur deux inscriptions. Une valeur
  calculée sur deux cas n'est pas publiable — l'exigence porte donc sur la **règle** (n'afficher
  qu'un taux calculé, avec son effectif et sa date) autant que sur le nombre.*
  **Fait quand** : le taux affiché en façade est produit par une requête sur les inscriptions, sa date de calcul est visible, et aucune valeur non calculée ne subsiste sur le site.

- **FR-070** — Établir une **règle de gouvernance des chiffres publics** : tout nombre affiché en
  façade est calculé depuis les données, ou porte sa source, ou n'est pas affiché.
  **Fait quand** : chaque nombre affiché en façade a été rattaché à un calcul ou à une source, ou retiré ; la règle est écrite et un contrôle la fait respecter avant mise en ligne.

- **FR-071** — Mesurer le **taux de renouvellement du Club à douze mois** et en faire la métrique
  de survie de la ligne, devant tout indicateur d'activité.
  **Fait quand** : le taux de renouvellement à douze mois est calculé sur la première cohorte arrivée à échéance, et il figure au tableau de bord avant tout indicateur d'activité.

- **FR-093** — **Extraire et publier les chiffres de traction.** *Première extraction faite le
  30 août 2026, reportée en §1.2 : zéro franc encaissé, 5 comptes, 2 inscriptions, 0 certificat.
  Reste dû : le **coût d'exploitation** — infrastructure, IA, paiement — qui n'a pas été relevé, et
  la **récurrence** de l'extraction.*
  **Fait quand** : le relevé est reproductible sur commande, inclut le coût d'exploitation, et
  une valeur datée existe pour chaque ligne. **Un zéro daté satisfait cette exigence ; un inconnu
  non.**

#### Ce que le produit promet sans le tenir

Ces exigences ne comblent pas un manque : elles ferment un **écart entre ce qui est affiché ou
contracté et ce que le code fait**. Ce sont les plus urgentes de la Partie B.

- **FR-101** — Doter le produit d'un **canal d'envoi d'e-mail**. *Il n'en existe aucun. Sans lui :
  le digest hebdomadaire est composé et jamais expédié, la liste newsletter est constituée pour
  rien, aucune relance ne peut ramener un acheteur hésitant (UJ-1), le préavis de renouvellement
  promis par les conditions générales est impossible (FR-102), et FR-076/FR-077 n'ont pas de
  support. **C'est le déblocage à plus fort effet de levier de toute la Partie B.***
  **Fait quand** : un e-mail transactionnel part effectivement vers une adresse réelle, son échec est journalisé, et le digest hebdomadaire arrive dans une boîte de réception au lieu de rester en base.

- **FR-102** — Implémenter le **renouvellement automatique du Club et son préavis à quinze jours**,
  que les conditions générales promettent depuis l'origine. *L'option est stockée à la
  souscription ; aucun traitement planifié ne la lit. Dépend de FR-101.*
  **Fait quand** : un abonnement arrivé à échéance avec renouvellement actif est reconduit sans intervention, et son titulaire a reçu un avis quinze jours avant. Dépend de FR-101.

- **FR-103** — Publier des **conditions générales pour `/agence` et `/presence-digitale`**.
  *Deux des cinq lignes vendent aujourd'hui sans, et la question de la TVA reste en suspens.*
  **Fait quand** : les deux pages renvoient vers des conditions générales qui les nomment, et la question de la TVA y est tranchée.

- **FR-104** — Faire établir un **accord écrit sur la titularité** de la marque, des contenus, du
  Club et de l'assistant, entre la société opératrice et le détenteur. *Voir R-15 : c'est la
  première diligence d'un investisseur ou d'un repreneur.*
  **Fait quand** : un accord signé nomme le détenteur de chaque actif, et les conditions générales publiées disent la même chose que lui.

- **FR-105** — Obtenir l'**accord écrit des douze organisations nommées** sur la page d'agence, ou
  les retirer.
  **Fait quand** : chaque organisation nommée a donné son accord par écrit, ou son nom ne figure plus sur la page.

- **FR-106** — Spécifier la **garantie satisfait ou remboursé de quatorze jours**, affichée en
  production et absente de toute exigence. *La contre-métrique M-02 la présuppose sans qu'elle
  existe au périmètre.*
  **Fait quand** : la garantie a une exigence qui dit qui l'accorde, sous quel délai, par quel geste, et ce qu'il advient de l'inscription et du certificat.

- **FR-107** — Rattacher les **messages de contact anonymes** à leur expéditeur lorsqu'il est
  connecté. *Sans identifiant, un message n'apparaît jamais dans la boîte de son auteur.*
  **Fait quand** : un message envoyé depuis un compte connecté apparaît dans la boîte de son auteur ; les messages anonymes restent possibles et restent anonymes.

#### Prix et accessibilité de l'achat

- **FR-072** — Conduire un **test de prix réel** sur la ligne formation. *La fourchette actuelle
  vaut **1,8 à 3,8 mois de SMIG** — seul repère de revenu solide, les estimations de salaire moyen
  divergeant de 63 %. Deux bornes de marché encadrent par ailleurs cette fourchette : un ancrage
  observé autour de **25 000 FCFA** pour un cours digital au Sénégal, et **150 000–500 000 FCFA
  par formation** chez une école de la place à Abidjan.* `[HYPOTHÈSE]` *La plateforme se situe
  donc côté école, pas côté créateur. C'est un positionnement à assumer ou à corriger, et seul le
  test tranche.*
  **Fait quand** : au moins deux niveaux de prix ont été exposés à des cohortes comparables, et l'écart de conversion est mesuré avec son intervalle.

- **FR-073** — Offrir un paiement fractionné sur les formations. *Réponse structurelle au
  seuil d'investissement, indépendante du niveau de prix retenu.*
  **Fait quand** : un acheteur peut régler en plusieurs fois, l'accès s'ouvre selon une règle écrite, et un échéancier interrompu a un traitement défini.

- **FR-074** — Cadrer explicitement le tarif du Club **au mois autant qu'à l'année** (19 900/an ≈
  1 658/mois). `[HYPOTHÈSE]` *Le cadrage paraît décisif : mensualisé, le montant relève de l'achat
  impulsif ; annualisé, il franchit un seuil de délibération.*
  **Fait quand** : les quatre emplacements publics qui affichent le tarif du Club portent aussi son équivalent mensuel, et l'effet sur la conversion est mesuré.

- **FR-075** — Ouvrir l'évaluation du segment diaspora, absent du produit comme de la
  stratégie, alors qu'il est probablement le plus solvable.
  **Fait quand** : la part diaspora des acheteurs existants est chiffrée, et la décision de la servir ou non est écrite avec son motif.

#### Club — rendre la valeur visible pendant le silence

- **FR-076** — Restituer périodiquement à chaque membre **ce que son abonnement lui a apporté**,
  afin que le renouvellement ne soit pas une redécouverte. *Dérivé de UJ-2, donc `[HYPOTHÈSE]`.*
  **Fait quand** : chaque membre reçoit un récapitulatif périodique de ce que son abonnement lui a apporté. Dépend de FR-101.

- **FR-077** — Préparer le renouvellement **plusieurs semaines avant l'échéance**, et non par une
  notification terminale. *Dérivé de UJ-2, donc `[HYPOTHÈSE]`.*
  **Fait quand** : une séquence de renouvellement démarre au moins quatre semaines avant l'échéance. Dépend de FR-101.

- **FR-078** — Réviser le classement pour qu'il **cesse de nuire au quartile inférieur**.
  `[HYPOTHÈSE]` *Une étude de 2023 conclut qu'une position basse dégrade le sentiment de
  compétence et bloque l'appartenance — mais la recherche décrit un champ où **le consensus
  scientifique est absent** et les études longitudinales manquent. Un travail fondateur de 2014
  conclut au contraire que points et classements ne créent ni ne détruisent la motivation
  intrinsèque. Le motif d'agir n'est donc pas la certitude, c'est l'asymétrie du risque : mesurer
  M-09 coûte peu, et un classement qui fait décrocher les derniers coûte cher.* Piste : classement
  par cohorte ou par progression relative.
  **Fait quand** : l'activité du quartile inférieur (M-09) ne se dégrade plus après exposition au classement, ou le classement absolu a été remplacé.

#### Ligne TPE — après D-01 et D-02

- **FR-079** — Désamorcer l'écart d'ancrage **en amont du tunnel**. *Le marché ancre « site =
  achat unique, maintenance = annuelle », et aucune ancre mensuelle n'existe pour le site. La
  réponse appartient à la page, pas au closing.* `[HYPOTHÈSE]` *dérivée de UJ-3.*
  **Fait quand** : la page répond à la comparaison « une fois contre première année » avant le formulaire, et le taux d'abandon au moment du prix est mesuré avant et après.

- **FR-080** — **Différencier la grille par ville.** *Les trois capitales n'ont ni la même
  pénétration Internet ni les mêmes prix affichés.* `[HYPOTHÈSE]` *les écarts observés sont
  probablement un artefact d'échantillon — d'où FR-081 avant toute décision.*
  **Fait quand** : chaque ville a sa grille, ou une note écrite justifie qu'une grille unique est maintenue. Dépend de FR-081.

- **FR-081** — Conduire **dix à quinze entretiens de qualification** avec des commerces de la
  cible avant de figer la grille. *La recherche a établi que ce marché est trop opaque et ses
  sources trop intéressées pour fonder un prix.*
  **Fait quand** : dix entretiens au minimum sont menés et restitués, avec les prix réellement payés par ces commerces et leur réaction au récurrent.

- **FR-082** — Construire une **preuve autre que la démonstration Maps**. *Elle repose sur une
  zone de donnée vide, et la page n'a ni témoignage, ni logo client, ni référence.*
  **Fait quand** : la page porte au moins une preuve indépendante de la démonstration Maps — référence nommée, résultat chiffré, ou témoignage attribuable.

#### Conformité, contenu et traçabilité

- ~~**FR-083**~~ — *Retirée. Le consentement newsletter est livré : voir FR-006. Identifiant
  conservé vide pour ne jamais être réattribué.*
- **FR-084** — Remplacer les **portraits générés par IA** par des photographies réelles, et tracer
  la licence des visuels de banque.
  **Fait quand** : aucun visuel généré par IA ne représente plus une personne réelle sur le site, et chaque image de banque a sa licence tracée.

- **FR-085** — Aligner les coordonnées publiques. *Le pied de page lit déjà les constantes de
  marque — ce point est réglé. Ce qui reste : deux adresses coexistent (l'une légale, l'autre
  commerciale), et l'écran des paramètres d'administration porte une adresse sur un **domaine de
  premier niveau erroné** (`.com` au lieu de `.me`).*
  **Fait quand** : une seule adresse de contact est publiée, le domaine de premier niveau est correct partout, et aucun écran ne porte de coordonnée en dur.

- **FR-086** — Faire trancher par un conseil la question de l'objet social (R-08).
  **Fait quand** : un conseil a rendu un avis écrit, et l'objet social a été étendu ou l'avis conclut qu'il n'y a pas lieu.

- **FR-092** — Étendre le journal d'audit aux écrans d'administration qui écrivent directement
  depuis le navigateur. *FR-063 ne couvre aujourd'hui que les quatre opérations passant par une
  fonction serveur.*
  **Fait quand** : toute écriture d'administration laisse une entrée d'audit, quel que soit le chemin — navigateur compris.

#### Combler les écarts constatés en Partie A

Chacune de ces exigences ferme une limite explicitement décrite dans la Partie A.

- **FR-094** — Écran d'**historique des transactions côté apprenant** (comble FR-021).
  **Fait quand** : un acheteur voit ses propres transactions, leur montant, leur date et leur statut, sans passer par le support.

- **FR-095** — **Page de détail par question** de FAQ, adressable et référençable (comble FR-001).
  **Fait quand** : chaque question a une URL propre, un titre et des données structurées, et le plan de site les liste.

- **FR-096** — **Paires FR/EN et `hreflang` sur le flux RSS**, comme le plan de site les porte
  déjà (comble FR-004).
  **Fait quand** : le flux porte ses alternances de langue, et un validateur de flux l'accepte sans avertissement.

- **FR-097** — Rendre **effectifs les réglages de notification**, aujourd'hui stockés sans être
  lus (comble FR-011).
  **Fait quand** : modifier un réglage de notification change ce que la personne reçoit ; le réglage n'est plus stocké sans être lu.

- **FR-098** — Aligner **« Free Money »** entre les conditions générales et le tunnel de paiement :
  l'offrir, ou le retirer du contrat (comble FR-015). *Écart contractuel, à traiter en priorité.*
  **Fait quand** : le moyen de paiement est offert au tunnel, ou il ne figure plus au contrat. **Les deux ne peuvent pas rester en désaccord.**

- **FR-099** — Ajouter une **limitation de débit distincte du quota** sur Rysmo (comble FR-043).
  **Fait quand** : un compte à large quota ne peut plus émettre de rafale ; la limite est distincte du quota quotidien et se teste séparément.

- **FR-100** — Traduire les **noms de pays du sélecteur téléphonique**, seule entorse connue à la
  discipline i18n (comble FR-065).
  **Fait quand** : la liste des pays s'affiche dans la langue active, et aucune chaîne accentuée ne subsiste en dur dans le composant.

#### Dette structurelle

- **FR-087** — Réduire à une seule source les **trois copies des valeurs SEO par défaut**, qui
  divergent silencieusement entre le front, le Worker et le pré-rendu.
  **Fait quand** : les trois copies sont réduites à une source, et un test échoue si elles réapparaissent.

- **FR-088** — Placer les **tests de règles Firestore dans les prérequis du déploiement**. *Ils
  s'exécutent en intégration continue mais hors de la chaîne bloquante.*
  **Fait quand** : le job de règles figure dans les prérequis du déploiement ; un test rouge empêche la mise en ligne.

- **FR-089** — Rendre **détectable la désynchronisation des miroirs de prix serveur**. *Les tests
  vérifient la cohérence entre les conditions générales et l'interface, mais **ne peuvent pas
  atteindre les miroirs serveur** — c'est exactement par là que les CGV ont annoncé pendant des
  mois un tarif que le code ne pratiquait plus.*
  **Fait quand** : modifier un prix dans un seul des miroirs serveur fait échouer un test. **C'est le seul critère qui compte : les trois miroirs non couverts du tableau de l'addendum doivent le devenir.**

- **FR-090** — Localiser les **navigations programmatiques non traduites**, qui renvoient un
  visiteur anglophone dans l'arbre français.
  **Fait quand** : aucune navigation programmatique ne sort de l'arbre de langue courant ; un test parcourt les redirections des deux arbres.

- **FR-108** — Compléter les données structurées : le fil d'Ariane manque sur quatre pages
  publiques, et la liste d'éléments n'existe que sur le catalogue de formations — le blog, les
  vidéos et les podcasts n'ont qu'une page de collection.
  **Fait quand** : les quatre pages portent leur fil d'Ariane, les trois index portent leur liste d'éléments, et un validateur les accepte.

- **FR-109** — Conditionner le chargement de la vidéo de fond de la page d'accueil à la bande
  passante disponible, et faire **échouer l'intégration continue au-delà d'un budget de poids
  défini pour cette page**. *Elle est aujourd'hui servie en plein écran, en lecture automatique,
  sans condition, sur la seule page importée statiquement : NFR-04 est violée à l'endroit le plus
  visible du site, et rien ne le détecte.*
  **Fait quand** : la vidéo ne se charge pas sous un seuil de bande passante défini, et l'intégration continue échoue si la page dépasse son budget de poids.

- **FR-110** — Établir un **vocabulaire d'appel à l'action partagé**. *Six formulations mènent au
  catalogue, cinq au contact ; et le titre par défaut vouvoie dans ses trois copies quand le
  premier titre de page tutoie — le système de voix de §3 est rompu là où il compte le plus.*
  **Fait quand** : un module unique porte les libellés d'appel à l'action, chaque destination n'en a plus qu'un, et le vouvoiement a disparu des titres par défaut.

- ~~**FR-091**~~ — *Retirée : les cinq équivalents anglais des routes privées sont déjà exclus du
  fichier `robots.txt`. Identifiant conservé vide pour ne jamais être réattribué.*

---

## 7. Exigences non fonctionnelles

- **NFR-01 — Intégrité du prix.** Aucun montant n'est accepté du client. Toute somme débitée est
  relue côté serveur. Tout changement de tarif est répercuté dans l'intégralité de ses miroirs, y
  compris le **texte contractuel des conditions générales**, avant déploiement.
- **NFR-02 — Fiabilité du paiement.** Le webhook dédoublonne par identifiant de charge, contrôle
  le montant, et applique ses effets avant de marquer la transaction terminée.
- **NFR-03 — Stabilité des URL de paiement.** Le segment de retour est **codé en dur côté serveur,
  en exactement deux fichiers**. Le renommer ferait atterrir tout paiement en cours sur une page
  introuvable. Renommer un segment public impose une mise à jour coordonnée de six emplacements.
- **NFR-04 — Sobriété des données.** Le poids en mégaoctets d'une page et d'un cours est une
  contrainte de conception. *Toute exigence nouvelle porte son budget en poids.*
- **NFR-05 — Robustesse mobile et réseau dégradé.** Le parcours doit survivre à une session
  interrompue et reprise des jours plus tard, sur un appareil d'entrée de gamme. `[HYPOTHÈSE]`
  *dérivée de UJ-1 ; le profil d'appareil réel des acheteurs n'est pas mesuré.*
- **NFR-06 — Bilinguisme intégral.** Aucune chaîne visible codée en dur. Ajouter une route impose
  **deux éditions**, et chaque valeur anglaise doit être unique sur toute la table.
- **NFR-07 — Sécurité et cloisonnement.** Règles testées sous émulateur. Clés tierces jamais
  côté client. HTML éditorial assaini. Variables d'environnement validées au démarrage.
  **Un garde de route est du code client : le confinement réel est dans les règles.**
- **NFR-08 — Protection des données.** Export et suppression de compte en autonomie. **Les données
  de devis TPE restent séparées des données personnelles.** La vérification publique de certificat
  n'expose aucun identifiant d'utilisateur et ne peut pas être énumérée.
- **NFR-09 — Accessibilité.** Les contrastes documentés sont contraignants : la teinte
  d'accentuation de l'offre TPE atteint 2,6:1 sur blanc et **est interdite pour du texte**.
- **NFR-10 — Coût unitaire de l'IA.** Contexte borné par collection, accès plafonné par quota.
  **Aucune offre d'IA illimitée ne sera introduite.**
- **NFR-11 — Coût opérationnel humain.** Toute fonctionnalité nouvelle arrive avec son coût en
  minutes par semaine pour un opérateur unique. *Statut : **aucune des exigences de la Partie B ne porte
  encore ce chiffrage.** La NFR est donc, à ce jour, violée par le document lui-même — c'est un
  travail à faire au moment du découpage en lots, pas une clause décorative.*
- **NFR-12 — Observabilité.** Les erreurs remontent par un point de passage unique, qui retombe
  proprement en l'absence de configuration.
- **NFR-13 — Portabilité de l'infrastructure.** Le produit fonctionne à cheval sur deux
  fournisseurs. **Tout interrupteur de bascule doit rester réversible.**

---
## 8. Métriques de succès et contre-métriques

Chaque métrique est appariée à la contre-métrique qui se dégraderait si l'on optimisait la
première sans discernement. **Une métrique sans sa contre-métrique n'est pas pilotable.**

| # | Métrique de succès | Contre-métrique appariée | Pourquoi ce couple |
|---|---|---|---|
| M-01 | Taux de renouvellement du Club à 12 mois *(métrique de survie de la ligne)* | Charge de support par membre actif | Un Club qu'on retient à force de sollicitations coûte à l'opérateur unique ce qu'il rapporte |
| M-02 | Conversion visiteur → compte → acheteur | Taux de remboursement et de litige | Une conversion obtenue par la pression produit des acheteurs qui contestent |
| M-03 | Taux de complétion réellement mesuré | Certificats émis sans progression substantielle | Un certificat facile gonfle la complétion et détruit sa valeur sur le marché du travail |
| M-04 | Revenu par ligne de service | Concentration du revenu sur une seule ligne | **Sans objet tant qu'aucune ligne ne produit.** Le « ~85 % porté par les formations » venait d'un document interne, pas d'un calcul (D-03) |
| M-05 | Requêtes Rysmo par membre actif | Coût IA par membre actif, et sa dispersion | Les meilleurs usagers sont les plus coûteux ; c'est la marge qu'on suit, pas l'usage |
| M-06 | Conversion des pop-ups | Rebond et sortie induits, mesurés contre le groupe témoin | Le registre prévoit déjà un groupe témoin : il faut s'en servir |
| M-07 | Trafic organique et positions | Part du trafic dépendant d'un seul canal | La distribution propriétaire est le moat supposé ; sa concentration est le risque |
| M-08 | Prospects TPE qualifiés | Taux de recouvrement mensuel effectif | Sans rail de prélèvement (D-02), un contrat signé n'est pas un revenu encaissé |
| M-09 | Engagement du Club | Activité du quartile inférieur du classement | La littérature établit qu'un classement peut faire décrocher les derniers tout en flattant les premiers |
| M-10 | Séries quotidiennes maintenues | Reprise après rupture de série | Une mécanique de série qui punit l'échec fabrique de l'abandon définitif |
| M-11 | Temps jusqu'à la première leçon ouverte | Délai entre le paiement et cette ouverture | C'est l'intervalle où se joue le remords d'achat. `[HYPOTHÈSE]` *dérivée de UJ-1* |
| M-12 | Conversion mise en place → accompagnement, mesurée à J+30, cible ≥ 40 % | Taux de résiliation dans les trois mois suivant la conversion | C'est LE KPI de la ligne TPE selon sa propre documentation : c'est lui, et non le volume de prospects, qui brise le plafond de livraison (D-02, R-17). Convertir à marche forcée un client qui part à M+2 ne brise rien |

**Le point de départ de ces douze métriques est zéro.** Relevé du 30 août : aucun achat, aucun
certificat, aucun abonnement payé, aucune requête Rysmo facturée, aucun prospect converti. Onze
des douze n'ont donc **pas de valeur courante à améliorer — elles ont une première valeur à
produire**, et celle-ci dépend de FR-111.

Une seule est déjà mesurable, et déjà mauvaise : **M-07**, le trafic organique. Quarante-six
articles sont publiés et aucun compte n'a été créé depuis le 10 mars. Que le trafic soit faible ou
qu'il ne convertisse pas, le moat n°2 n'est pas démontré (R-20).

`[HYPOTHÈSE]` **Aucune valeur cible n'est fixée**, et il serait prématuré d'en fixer. Il n'existe
aucune donnée publique de conversion, de complétion ou de churn en contexte francophone africain
sur laquelle asseoir un objectif, et la plateforme n'a pas encore la sienne. Les cibles se posent
après les premières ventes — **pas empruntées à des repères occidentaux**, ce que ce document
s'interdit ailleurs (§2.2) et doit s'interdire ici.

---

## 9. Risques

| # | Risque | Portée | Traitement |
|---|---|---|---|
| **R-01** | Le prix de la formation n'est pas validé par le marché. 95 000–200 000 FCFA vaut de 1,8 à 3,8 mois de SMIG (52 500 FCFA). Les estimations de salaire *moyen* divergent de 63 % (114 152 vs 186 710) et aucune ne remonte proprement à l'ANSD : le SMIG est le seul repère solide | Ligne de revenu principale | FR-072, FR-073 |
| **R-02** | Le récurrent TPE n'a pas de rail de prélèvement au Sénégal | Modèle économique de la ligne 11 | D-02 |
| **R-03** | Le bas de la cible TPE est infinançable : de 26 à 31 % de son chiffre d'affaires la première année selon le pack retenu | Cohérence offre/cible | D-01 |
| **R-04** | **Chiffres publics contredits par la base de production** : 98 % de complétion contre 0 %, 1 486 étudiants contre 3, 45 M XOF contre 0 | **Exposition juridique et réputationnelle, pas seulement crédibilité** | D-03 — exécution, pas arbitrage |
| **R-05** | Les mécaniques de série et de classement sont documentées comme potentiellement nuisibles aux apprenants les plus fragiles | Éthique produit et rétention | FR-078, M-09, M-10 |
| **R-06** | La seule preuve de `/presence-digitale` repose sur une zone de donnée vide : aucune statistique régionale n'existe sur Google Business Profile | Conversion de la ligne 11 | FR-082 |
| **R-07** | Le fondateur est à la fois le moat et le point de rupture. La marque n'est ni cessible ni délégable, et plafonne le volume de communauté animable | Continuité, valorisation | Aucun traitement à ce stade — à assumer explicitement devant un investisseur |
| **R-08** | L'objet social de MY ONOMA SARL ne recouvre pas l'exploitation d'une plateforme logicielle | Juridique — bloquant en cas de levée ou de cession | FR-086 |
| **R-09** | Cinq produits, une équipe. Chaque brique isolée est mieux faite par un spécialiste à 9–99 USD/mois ; Skool à 9 USD/mois est la menace directe | Stratégie | Les deux seules réponses défendables sont le mobile money natif et le contenu en contexte ouest-africain. La gamification et le tuteur IA ne sont pas des moats |
| **R-10** | Le B2C edtech africain se rétracte vers le B2B ; l'AO francophone est quasi absente des classements sectoriels | Marché | `[HYPOTHÈSE]` — évaluer une ligne B2B |
| **R-11** | La chaîne de déploiement ne pousse que l'hébergement. Règles, index, fonctions et Workers sont construits mais jamais déployés par l'intégration continue | Exploitation | FR-088, et documentation du chemin réel de mise en ligne |
| **R-12** | Aucune preuve **publique** qu'une communauté annuelle payante tienne en AO francophone — **ni aucune preuve interne** : zéro abonnement payé par le tunnel | Ligne Club | M-01 — à prouver avant d'investir davantage |
| **R-13** | ~~Absence de chiffres de traction~~ → **résolu, et le résultat est le risque** : la plateforme n'a jamais encaissé un franc et son catalogue est vide. Toute projection de ce document part de zéro, pas d'une base installée | **Recevabilité, et calibrage de tout le reste** | FR-111 d'abord |
| **R-14** | Le produit n'a aucun canal d'envoi d'e-mail. Aucune dépendance d'envoi dans les trois projets. Le digest hebdomadaire est composé mais jamais expédié, la liste newsletter n'est envoyée nulle part, et aucune relance ne peut ramener un acheteur hésitant | Rétention, acquisition, et deux engagements contractuels (R-16) | FR-101 |
| **R-15** | La titularité des actifs n'est pas établie par écrit. La documentation interne place la marque, les contenus, le Club et Rysmo chez un détenteur distinct de la société opératrice, sans accord signé — et les CGV publiées hésitent elles-mêmes entre les deux | Bloquant en cas de levée ou de cession : c'est la première diligence | FR-104, Q-12 |
| **R-16** | Deux des cinq lignes vendent sans conditions générales, et les CGV du Club promettent un renouvellement automatique avec préavis à quinze jours que rien n'implémente — l'option est stockée, aucun traitement ne l'exécute | Contractuel, sur la ligne la plus ancienne | FR-102, FR-103 |
| **R-17** | La ligne TPE a un plafond de livraison, et c'est son risque n°1 — 3 à 4 mises en place par mois en solo, soit environ 20 M XOF par an. Ce n'est pas une projection, c'est une borne de capacité | Ligne 11 | D-02, M-12, NFR-11 |
| **R-18** | Douze organisations tierces sont nommées publiquement sur la page d'agence, et le code lui-même note que l'accord écrit n'est pas obtenu | Juridique et réputationnel | FR-105 |
| **R-19** | **Le catalogue est vide.** Deux formations existent, aucune n'est publiée : la ligne de revenu principale est fermée au public, sur un produit construit depuis six mois | **Bloquant absolu — rien ne se vend** | FR-111 |
| **R-20** | **Aucun compte créé depuis le 10 mars 2026.** Quarante-six articles sont publiés, et personne n'arrive — ou personne ne s'inscrit. Le moat n°2 (distribution propriétaire) n'a jamais été démontré | Acquisition | FR-069 après FR-111 |

---

## 10. Hors périmètre

- **L'application mobile native.** La plateforme est une application web, et le reste.
- **La recherche plein texte serveur.** L'intégration existe mais est neutralisée par
  configuration ; un filtrage côté client couvre le besoin. Ne pas en construire une seconde.
- **Une ligne B2B formalisée.** R-10 en recommande l'évaluation, ce qui n'est pas la livrer.
- **La publication d'une grille tarifaire pour Max-Morrys Agency.** Décision de positionnement,
  pas un manque.
- **L'ouverture de nouveaux pays** au-delà des trois capitales déjà visées.
- **Toute offre d'IA illimitée** (NFR-10).
- **Le gel ou l'arrêt d'une ligne de revenu.** *Décision par défaut, pas arbitrage :
  pas un arbitrage : à cinq lignes pour un opérateur (R-09), la question de savoir lesquelles
  tourner et lesquelles suspendre se posera. Elle est renvoyée à Q-08, pas résolue ici.*

---

## 11. Questions ouvertes

| # | Question | Bloquant pour |
|---|---|---|
| **Q-01** | Les quatre parcours de §4 sont inférés. **Ils ne peuvent pas être validés par l'observation : il n'existe aucun usage réel.** La question devient : les valider auprès de qui, et quand ? | §4 — après FR-111 |
| ~~Q-02~~ | ~~Quel chiffre d'affaires par ligne ?~~ **Répondu le 30/08 par la base : zéro, toutes lignes confondues.** Une transaction existe, en statut « en attente » | *clos* |
| ~~Q-03~~ | ~~Combien de personnes ont payé le Club ?~~ **Répondu : aucune.** Trois abonnements existent (2 actifs, 1 annulé) sans transaction complétée en face — ils n'ont pas transité par le tunnel | *clos* |
| **Q-04** | Quel lecteur externe précis vise ce PRD — investisseur, associé, recrutement ? | Cadrage de §1 et §2 |
| **Q-05** | D-01 : segmenter, créer un palier bas, ou relever le plancher ? | Ligne 11 |
| **Q-06** | D-02 : prépaiement annuel remisé, recouvrement manuel assumé, ou restriction géographique ? | Modèle de la ligne 11 |
| **Q-07** | D-03 : chaque chiffre non sourcé est-il corrigé, sourcé, ou retiré — du site public ? | Lecture externe |
| **Q-08** | Sur cinq lignes, lesquelles tourner à fond six mois et lesquelles suspendre ? | Allocation du temps de l'opérateur unique |
| **Q-09** | Les portraits générés par IA sont-ils remplacés avant diffusion du document ? | Crédibilité |
| **Q-10** | Le segment diaspora entre-t-il au périmètre de cette phase ? | FR-075 |
| **Q-11** | `/presence-digitale` reste-t-elle rattachée à Max-Morrys ? La documentation de positionnement note qu'elle relève plus de GROW que de BUILD. C'est une quatrième issue à D-01 : déplacer la ligne plutôt que la corriger | §3, D-01 |
| **Q-12** | Qui détient la marque, les contenus, le Club et Rysmo ? La documentation interne et les CGV publiées ne disent pas la même chose | **R-15 — diligence bloquante** |
| ~~Q-13~~ | ~~Le revenu de 45 M XOF est-il réel ?~~ **Répondu : non.** La base porte zéro franc encaissé | *clos* |

---

## 12. Glossaire

Les noms de domaine ci-dessous ont un sens unique dans tout le document. Les employer autrement
est une erreur, pas une variante de style.

| Terme | Définition |
|---|---|
| **Formation** | Produit d'apprentissage acheté à l'unité, structuré en modules et leçons, ouvrant droit à un certificat. Accès à vie. Jamais « cours » dans un contexte normatif |
| **Inscription** | Lien entre une personne et une formation achetée, portant sa progression. Créée par le webhook de paiement ou par écriture directe pour une formation gratuite |
| **Certificat** | Pièce émise par le serveur à 100 % de complétion re-dérivée. Immuable. Porte un code de vérification unique |
| **Miroir de vérification** | Document public indexé par le code d'un certificat, ne portant aucun identifiant d'utilisateur. Distinct du certificat lui-même |
| **Club** | Le Club des Digitos. Communauté à abonnement annuel. Jamais « communauté » seule, qui désigne l'audience au sens large |
| **Rysmo** | L'assistant pédagogique IA du produit. À ne pas confondre avec l'opérateur, dont c'est aussi le nom d'usage |
| **Quota** | Plafond de requêtes Rysmo par jour, attaché au statut de la personne. Distinct d'une limitation de débit, qui n'existe pas (FR-043) |
| **Pack** | Prestation TPE à paiement unique. Jamais employé pour les packs de requêtes Rysmo dans un contexte TPE, et inversement |
| **Accompagnement** | Prestation TPE à mise en place plus abonnement mensuel. N'est jamais un pack |
| **Prospect** | Demande entrante non qualifiée, sur `/presence-digitale` ou `/agence`. Devient *qualifié*, *devisé*, *signé* ou *perdu* |
| **Devis** | Document partageable à URL propre, généré pour un prospect TPE, ne contenant aucune donnée personnelle |
| **Ligne** | Ligne de service monétisée. Il y en a cinq (§1). Jamais « flux », employé par `BUSINESS_PLAN.md` avec un découpage différent |
| **Opérateur** | La personne unique qui exploite la plateforme (UJ-4) |
| **Repère de progression** | Progression maximale jamais atteinte sur une inscription. Ne décroît pas. Borne l'attribution de l'expérience |

---

## 13. Index des hypothèses

Tout ce que ce document suppose sans le savoir. **Rien de cette liste n'est vérifié.**

| Emplacement | Hypothèse | Comment la lever |
|---|---|---|
| §1, moat n°2 | La distribution propriétaire supprime effectivement le coût d'acquisition | FR-069, M-07 |
| §4, UJ-1 à UJ-4 | Les quatre parcours en entier, protagonistes et enchaînements | Q-01 — observation d'utilisateurs réels |
| §4, UJ-1 | La rupture principale du tunnel est au moment du paiement | FR-068 |
| §4, UJ-3 | Un commerce type de la cible fait 1,2 M FCFA de CA mensuel `[FICTIF]` | FR-081 |
| §6.1, D-01 | Le repère budgétaire de 7–16 % du CA, établi sur des PME françaises, transpose au marché ouest-africain | FR-081 — aucun repère local n'existe |
| §6.1, D-01 | La taille relative des paliers 800 k–2 M et 2 M–5 M | FR-081 |
| §6.1, D-01 | Que le client paie douze mensualités : l'accompagnement Croissance ne porte aucune clause d'engagement, et le modèle financier de la ligne table sur 4,6 mois moyens en première année | FR-081, M-12 |
| §6.1, D-01 | Que le pack et l'accompagnement soient vendus ensemble — ce que le générateur de devis additionne, mais qui n'est pas une obligation commerciale | FR-081 |
| §4, UJ-2 | Le churn de référence des communautés payantes (5,8 %/mois selon un agrégateur non audité ; 3–5 % pour les formats communautaires) | M-01 |
| §6.2, FR-078 | Qu'un classement absolu nuise réellement — une seule étude le conclut, dans un champ sans consensus | M-09 |
| §6.2, FR-072 | Le prix actuel est un frein dominant à la conversion | FR-072 lui-même |
| §6.2, FR-074 | Le cadrage mensuel du tarif du Club change la conversion | Test A/B après FR-071 |
| §6.2, FR-076/077 | Le renouvellement du Club échoue par oubli de la valeur reçue | Q-01, puis M-01 |
| §6.2, FR-078 | Un classement par cohorte nuirait moins que le classement absolu | Mesure de M-09 |
| §6.2, FR-079/080 | L'écart d'ancrage est la cause principale de perte sur `/presence-digitale` | FR-081 |
| §7, NFR-05 | Le profil d'appareil et de connexion des acheteurs impose la robustesse décrite | FR-068 |
| §8 | Les douze couples métrique / contre-métrique sont les bons | Première mesure |
| §9, R-10 | Une ligne B2B serait pertinente pour ce produit | Étude à mener |

**Chiffres marqués `[FICTIF]`** — calculés sur des scénarios inventés, à ne jamais citer comme
mesures : le chiffre d'affaires de Fatou (1,2 M FCFA/mois) en §4, UJ-3, et la fourchette de 20 à
25 % qui en dérive. *Les pourcentages de §6.1, D-01 ne sont pas fictifs : ils sont calculés sur la
grille tarifaire réelle et sur le plancher d'ICP déclaré, à l'hypothèse de durée près (voir
ci-dessus).*

---

## Annexes

- `addendum.md` — tout ce qui relève du *comment*, ordonné par le moment où on en a besoin :
  avant d'écrire, avant de déployer, avant de modifier quelque chose de transverse. Contient les
  **invariants à ne pas casser** (§5), le **journal des correctifs du 29 août** (annexe A) et les
  **errata sur les autres documents du dépôt** (annexe B).
- `research-marche-edtech-ao.md` — marché, connectivité, paiement, coût de la donnée. Sourcé.
- `research-comparables.md` — packaging concurrent, rétention, facturation de l'IA, gamification.
- `research-agence-tpe.md` — prix affichés régionaux, substituts, rails de paiement récurrent.
- `review-rubric.md` · `review-adversarial-general.md` · `review-factcheck-code.md` ·
  `review-lecteur-externe.md` — les quatre relectures du 29 août 2026.
- `.memlog.md` — journal des décisions de rédaction.

**Sur le relevé du 30 août 2026.** Les chiffres de §1.2 et de D-03 proviennent d'une interrogation
en lecture seule de la base `(default)` du projet de production, vérifiée comme la seule existante
et comme celle que l'application lit. Aucune écriture n'a été faite. Les **dates** des trois
abonnements Club et de la transaction en attente n'ont pas pu être récupérées : elles auraient
précisé le calendrier, elles ne changent rien aux montants.
