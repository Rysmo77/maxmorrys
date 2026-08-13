# Positionnement — Max-Morrys Agency

Practice **BUILD** de MY ONOMA. Ce document définit ce que l'agence vend, ce qu'elle ne vend
pas, et où partent les demandes qui ne relèvent pas d'elle.

Source de vérité technique : [`src/lib/brand/practices.ts`](../src/lib/brand/practices.ts).
Architecture d'ensemble : [BRAND-ARCHITECTURE.md](./BRAND-ARCHITECTURE.md).

_Dernière mise à jour : 13 août 2026._

---

## 1. Positionnement

> **Digital Product · AI · Technology · Brand**

Phrase d'accroche retenue :

> Nous concevons les produits numériques, systèmes IA et expériences digitales dont les
> entreprises ont besoin pour avancer.

Ce que l'agence vend : **des systèmes qui fonctionnent en production**, à l'intersection du
produit, de la technologie et du business.

Ce qu'elle ne vend pas : des prestations techniques à l'unité, des heures, ou « de l'IA ».

---

## 2. Ce que Max-Morrys Agency n'est pas

Le positionnement doit activement écarter les perceptions suivantes :

- développeur freelance générique ;
- agence web low-cost ;
- agence 360° ;
- agence de communication traditionnelle ;
- vendeur de packs marketing ;
- gourou IA ;
- spécialiste de tous les sujets.

---

## 3. Les quatre capabilities

### `01` Digital Product

SaaS · plateformes métier · applications web · applications mobiles lorsque pertinent ·
plateformes communautaires · marketplaces · portails · outils internes · MVP · prototypes ·
digital transformation · product strategy · product architecture.

### `02` AI Systems & Automation

Automatisation de workflows · agents IA · intégrations LLM · assistants métier · automatisations
n8n / Make · systèmes de génération de contenu · outils internes augmentés par IA · intégrations
API · produits AI-enabled.

> **Règle absolue — l'IA ne se vend jamais pour elle-même.** Elle est toujours rattachée à un
> problème, un workflow, un produit ou une amélioration mesurable. Une page qui vend « de l'IA »
> vend du vent.

### `03` Technology & Digital Infrastructure

Architecture produit · intégrations · APIs · authentification · paiement · dashboards ·
intégrations CRM · backend · infrastructure applicative · architecture de données ·
automatisations.

> Le langage commercial reste orienté **résultat**, pas stack technique.

### `04` Brand & Executive Digital Presence

Personal branding · executive branding · brand positioning · écosystème digital · content
architecture · sites personnels · authority building · infrastructure de thought leadership.

> Cette capability est cohérente avec la marque personnelle Max-Morrys — c'est précisément ce
> que ce site démontre. Elle ne doit pas glisser vers l'agence de communication.

---

## 4. Clients cibles

Entrepreneurs · fondateurs · PME · startups · scale-ups · institutions · entreprises ·
organisations · marques personnelles premium.

Formulation à éviter :

> ~~Nous faisons des sites pour tout le monde.~~

Formulation retenue :

> Nous intervenons sur des projets où produit, technologie et business doivent fonctionner
> ensemble.

---

## 5. Ce qui sort du périmètre — vers Cléa Growth Office

Ces expertises relèvent de la practice **GROW**, portée par **Cléa Growth Office** au sein de
MY ONOMA :

Growth Strategy généraliste · Go-to-Market consulting · Revenue Operations · CRM strategy ·
sales pipeline consulting · performance media · programmatique · DSP / SSP · media buying ·
fractional Head of Growth · Chief of Staff · executive operations.

### La distinction structurante

> Max-Morrys Agency **construit les systèmes**.
> Cléa Growth Office **construit et opère la machine de croissance**.

### La relation

```
MY ONOMA
├── Max-Morrys Agency     (BUILD)
└── Cléa Growth Office    (GROW)
```

Cléa n'est **jamais** présentée comme une sous-traitante de Max-Morrys. Ce sont deux practices
sœurs du même studio.

### ⚠️ Ce que cette frontière ne recouvre pas

**Elle concerne l'offre commerciale B2B, pas le contenu éditorial.** Max-Morrys continue de
produire des formations, articles, épisodes et vidéos sur le growth, l'acquisition, le SEO ou la
publicité. Aucun contenu pédagogique n'a été retiré, et la taxonomie de contenu conserve ses
territoires growth.

---

## 6. Routage des demandes Growth

Un prospect dont le besoin relève de GROW **n'est jamais rejeté**.

### Mécanisme implémenté

Le formulaire de qualification propose un type de projet couvrant les besoins growth. Lorsqu'il
est sélectionné :

1. une carte s'affiche, expliquant que ces missions sont portées par Cléa Growth Office au sein
   de MY ONOMA ;
2. le lead est enregistré normalement, avec le marqueur `routedTo: 'MY_ONOMA_GROW'` ;
3. l'événement `growth_referral_click` est émis si le prospect suit le renvoi.

Formulation retenue :

> Pour les missions de Growth, Revenue & Operations, nous intervenons au sein de MY ONOMA avec
> Cléa Growth Office.

### Ce qui n'a pas été construit

Aucune automatisation de transfert, aucun webhook, aucune synchronisation CRM inter-entités :
l'infrastructure n'existe pas encore, et la construire par anticipation serait prématuré.

---

## 7. Modèle commercial

L'agence fonctionne en **high-ticket**. Aucune grille tarifaire publique, aucune formule
« Basic / Pro / Premium ».

Formats d'engagement :

```
Custom engagement
Project-based
Retainer
Advisory
```

Le formulaire de qualification comporte une fourchette budgétaire — **configurable**, définie
dans `src/lib/agency/engagement.ts`, jamais codée en dur dans un composant. Son rôle est de
filtrer les leads, pas d'en maximiser le volume.

---

## 8. Preuve

### Ce qui est publié

| Réalisation | Classification | Mention |
| --- | --- | --- |
| Amour Divin — amourdivin.app | `CLIENT` | Client product |
| Khanouss — khanouss.shop | `CLIENT` | Client product |
| Loma — loma-plateforme.web.app | `CLIENT` | Client product |
| HolyCash — holycash.net | `CLIENT` | Client product |
| English Lab — yessienglish.com | `CLIENT` | Client product |
| Klio Pro — kliopro.com | `CLIENT` | Client product |
| ResHo Konnexion — resho.vasesdhonneursenegal.com | `CLIENT` | Client product |
| Je Témoigne — temoignage.vasesdhonneursenegal.com | `CLIENT` | Client product |
| LauraVerse — lauraverse.blog | `CLIENT` | Client product |
| Dunamis Holydays — holydays.vasesdhonneursenegal.com | `CLIENT` | Client product |
| Jubilé de Grâce — jubile-de-grace.com | `CLIENT` | Client product |
| IN Sénégal 2026 — insenegal.web.app | `CLIENT` | Client product |
| DOVEN — doven.app | `MY_ONOMA_VENTURE` | A MY ONOMA Venture |
| NAYO — nayo.pro | `MY_ONOMA_VENTURE` | A MY ONOMA Venture |
| STEPS — stepsmag.com | `MY_ONOMA_VENTURE` | A MY ONOMA Venture |

Les projets clients sont présentés dans un **index navigable et filtrable par catégorie**, avec
aperçu ancré ; les ventures gardent leur grille. Deux blocs, deux composants, deux mentions.

Les deux ensembles ne sont **jamais** rendus dans la même grille, et portent deux mentions
distinctes. Amour Divin n'est en aucun cas présenté comme une venture MY ONOMA.

Chaque carte porte un **aperçu réel du site en production**, capturé à la volée (WordPress
mShots en bureau, Microlink en mobile), avec bascule bureau/mobile. Ce sont des captures de
pages publiques : de la preuve vérifiable, pas de l'illustration.

### Ce qui n'est pas publié

Aucune métrique, aucun chiffre d'utilisateurs, de revenus ou de traction. Aucun logo client,
aucun témoignage, aucun compteur. Aucune `capabilities` ni `stack` là où le dépôt ne les
documente pas — les blocs correspondants ne sont simplement pas rendus. La page reste livrée
**sans preuve chiffrée** tant que [CONTENT-TODO.md](./CONTENT-TODO.md) n'est pas renseigné.

### Sur l'usage de l'IA dans la production

Plusieurs produits ont été construits avec l'assistance d'outils d'IA. Cela peut nourrir le
positionnement de builder, mais **jamais** sous la forme « l'IA a fait le produit ». Formulation
admissible : _AI-assisted product engineering_. L'expertise vendue reste celle du studio.

---

## 9. Relation avec l'offre « Digital Commerce Local »

L'offre TPE (packs 295 000 – 895 000 XOF, accompagnement mensuel, ciblage commerces de
proximité) **n'est pas** Max-Morrys Agency. Elle est :

- déplacée de `/agence` vers **`/presence-digitale`**, à contenu et à tarifs constants ;
- conservée intégralement : tunnel, sélecteur, devis partageable, admin, collections Firestore ;
- accessible par une entrée de navigation dédiée, le pied de page, la page d'accueil et un
  renvoi en bas de `/agence`.

### Entrée de navigation — révision du 13 août 2026

L'offre est **entrée dans la navigation principale**, sous le libellé **« Je te digitalise »**
(`nav.presence`), placé entre le menu « Je te transforme » et « Contacte-moi ».

Ce point revient sur la décision initiale, qui la maintenait hors nav. L'objection d'origine
(`UX-AUDIT §1`) était que « le libellé annonce un service aux commerçants, pas une practice
produit » — elle visait un lien « Je te digitalise » qui pointait alors vers **`/agence`**. Depuis
le déplacement de l'offre, le libellé pointe vers `/presence-digitale` : il décrit exactement sa
destination, et complète le système de marque « Je te forme · Je t'informe · Je te transforme ».

Les deux offres restent séparées **par la forme**, pas par l'absence de l'une des deux :

| | Présence Digitale | Max-Morrys Agency |
| --- | --- | --- |
| Nav | Lien texte, tutoiement, famille « Je te… » | Pastille pleine, nom d'entité |
| Registre | « Je te digitalise » | « Agence » |

⚠️ Ne pas donner de pastille pleine à Présence Digitale, et ne pas rapprocher son lien de la
pastille Agence : deux entrées lagoon voisines ont déjà dû être fusionnées une fois
(`Header.tsx`, commit `7ba7874`).

### Pourquoi elle sort du périmètre

Son contenu — site vitrine, fiche Google Business Profile, catalogue WhatsApp, GA4/Pixel, SEO
local, publication de contenu — relève de la présence et de l'acquisition locale, donc plus de
**GROW** que de **BUILD**. Son ICP (commerce physique de 1 à 15 salariés) et son plafond de prix
sont par ailleurs incompatibles avec un positionnement high-ticket.

### ⚠️ Décision commerciale ouverte

Le rattachement à long terme de cette ligne **n'a pas été tranché ici** : offre productisée de
la marque personnelle Max-Morrys, ou transfert vers Cléa Growth Office. C'est une décision
métier. En l'état, elle reste une ligne autonome de maxmorrys.me, sans être présentée comme
« Max-Morrys Agency ».

Miroirs de prix à maintenir synchronisés (imposés par l'en-tête de `src/lib/presence/offer.ts`) :
`docs/OFFRE_AGENCE_TPE.md`, `skills/commercial-kit/SKILL.md`, `finance/model.py`,
`functions/src/prerender.ts`.

---

## 10. Test de cohérence

Avant de publier quoi que ce soit sur `/agence` :

1. Est-ce que cela parle **résultat** plutôt que stack ?
2. Est-ce que l'IA mentionnée est rattachée à un problème réel ?
3. Est-ce que cela reste dans **Product · AI · Technology · Brand** ?
4. Est-ce qu'un chiffre, un logo ou un témoignage non vérifiable s'est glissé dedans ?
5. Est-ce qu'un projet client est présenté comme une venture, ou l'inverse ?
