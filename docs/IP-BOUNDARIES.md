# Frontières de propriété intellectuelle

> **Portée strictement descriptive.** Ce document cartographie l'organisation des actifs tels
> qu'ils apparaissent dans ce dépôt. Il n'opère **aucune cession**, ne constitue aucun
> engagement contractuel et ne remplace ni les statuts, ni les contrats clients, ni un avis
> juridique. Voir [LEGAL-TODO.md](./LEGAL-TODO.md).

Document jumeau côté corporate : `My-onoma/docs/IP-ARCHITECTURE.md`.

_Dernière mise à jour : 13 août 2026._

---

## 1. Max-Morrys — Brand & Content IP

Le cœur de ce dépôt.

- Marque personnelle **Max-Morrys** et marque **Max-Morrys Agency**
- Domaine et plateforme `maxmorrys.me`
- Identité éditoriale : le système « Je te… », les formats **Le Marketing en Pratique** et
  **Le Podcast du Marketing**
- Contenus pédagogiques : formations, leçons, quiz, articles, épisodes, vidéos
- Le **Club des Digitos** : marque, contenus, communauté
- **Rysmo** : l'assistant pédagogique, ses prompts et sa mémoire produit
- Image, notoriété et parcours attachés à la personne

**Détenteur** : distinct de MY ONOMA SARL. La relation d'exploitation
(« practice de MY ONOMA », « operated by MY ONOMA ») doit reposer sur un accord écrit —
voir [LEGAL-TODO.md §4](./LEGAL-TODO.md).

---

## 2. MY ONOMA — Corporate IP

- Marque et dénomination **MY ONOMA**
- Architecture de marque **BUILD · GROW · OWN**
- Positionnement corporate et plateforme `myonoma.com`
- Marque **Cléa Growth Office**

**Détenteur** : MY ONOMA SARL.

Sur maxmorrys.me, ces éléments sont **cités**, jamais réappropriés. Ils vivent dans
[`src/lib/brand/`](../src/lib/brand/) en lecture seule, en miroir du dépôt corporate qui fait foi.

---

## 3. Background Technology IP

Savoir-faire et briques techniques **antérieurs ou indépendants** de toute mission client,
réutilisables d'un projet à l'autre.

- Méthodes de cadrage produit, d'architecture et de mise en production
- Design system : tokens Tailwind, primitives `src/components/ui/`, thèmes d'univers
  (`src/lib/sectionThemes.ts`), patterns d'accessibilité
- Patterns d'architecture applicative : frontière client/serveur, découpage des Cloud Functions
  et des Workers, modèles de règles Firestore
- Outillage interne : qualité, tests, CI, automatisations n8n
- Bibliothèques et abstractions internes non spécifiques à un client

**Limite impérative** : le background IP est constitué de **savoir-faire et de composants
génériques**. Il **n'inclut jamais** le code, les données, les modèles métier ni les actifs
propriétaires développés spécifiquement pour un client.

> Le site ne doit jamais laisser entendre que du code ou des actifs client sont réutilisés.
> Le compounding porte sur l'expérience et les méthodes, pas sur les livrables.

---

## 4. Client-specific IP

Tout ce qui est produit **pour** un client lui appartient, dans les termes de son contrat.

| Projet | Détenteur |
| --- | --- |
| Amour Divin — `amourdivin.app` | Le client |

Ce qui est publiable sur `/agence` se limite au **rôle tenu** et à des éléments **vérifiables
publiquement** : nom du produit, domaine, catégorie, capabilities mobilisées, stack technique.

Ce qui ne l'est pas : code, données, métriques, base utilisateurs, modèles métier, informations
contractuelles, tarifs.

⚠️ La publication de l'étude de cas suppose l'accord écrit du client — non obtenu à ce jour.
Voir [CONTENT-TODO.md §5](./CONTENT-TODO.md).

### Cas particulier — offre « Digital Commerce Local »

Les gabarits contractuels de la ligne TPE (`docs/AGENCE_DOCUMENTS_CONTRACTUELS.md`, art. 8)
opèrent déjà une répartition explicite :

- **au client** : nom de domaine, contenus publiés, comptes Google Business Profile, Meta et
  WhatsApp — créés à son nom ;
- **au prestataire** : workflows d'automatisation, scripts, gabarits et méthodes — sans licence
  ni transfert.

Cette répartition est cohérente avec les sections 3 et 4 ci-dessus.

---

## 5. Ventures MY ONOMA

Chaque venture est une marque autonome. Ses actifs doivent rester **isolables** — condition
nécessaire pour qu'une venture puisse devenir une société indépendante sans démembrement.

| Venture | Domaine | Opérateur | Détenteur |
| --- | --- | --- | --- |
| DOVEN | doven.app | MY ONOMA SARL | MY ONOMA SARL |
| NAYO | nayo.pro | MY ONOMA SARL | MY ONOMA SARL |
| STEPS | stepsmag.com | MY ONOMA SARL | MY ONOMA SARL |

Le modèle de données de [`src/lib/brand/ventures.ts`](../src/lib/brand/ventures.ts) sépare
`operator`, `owner` et `status` précisément pour absorber une divergence sans refonte.

Rien dans ce dépôt ne doit présupposer qu'une venture appartient personnellement à Max-Morrys.

> ⚠️ STEPS fait l'objet d'un écart de présentation entre les deux sites —
> voir [CONTENT-TODO.md §3](./CONTENT-TODO.md).

---

## 6. Third-party IP

Actifs de tiers présents ou consommés par la plateforme, soumis à leurs propres licences :

- Dépendances open source (React, Vite, Tailwind, TipTap, framer-motion, lucide-react,
  Phosphor Icons…)
- Services : Firebase / Google Cloud, Cloudflare, Bictorys, Google Generative AI (Gemini),
  Sentry, Typesense
- **Police Inter** — chargée depuis Google Fonts, licence SIL Open Font
- Banques d'images : les quatre `.webp` de `public/` sont des visuels génériques dont la licence
  n'est **pas documentée dans le dépôt** → à tracer

### À vérifier

Constituer la traçabilité des licences des visuels utilisés en production (`public/*.webp` et
les médias servis depuis `media.maxmorrys.me`). Aucune preuve de licence ne figure aujourd'hui
dans le dépôt.

---

## 7. Récapitulatif

```
MAX-MORRYS CONTENT IP     → marque personnelle, contenus, formations, Club, Rysmo
MY ONOMA CORPORATE IP     → MY ONOMA, BUILD·GROW·OWN, Cléa
BACKGROUND TECHNOLOGY IP  → méthodes, design system, patterns, outillage
CLIENT-SPECIFIC IP        → livrables client — jamais réutilisables par défaut
VENTURE IP                → DOVEN, NAYO, STEPS — isolables par construction
THIRD-PARTY IP            → dépendances, services, polices, visuels
```
