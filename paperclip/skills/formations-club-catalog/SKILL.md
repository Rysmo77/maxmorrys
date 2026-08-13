# Skill — Offre Max-Morrys (Formations / Club Digitos / Rysmo / Agence)

Le site est une app **React + Firebase custom** (Auth, Firestore, Functions, Storage). L'offre vit dans **Firestore**. Tu lis l'offre pour créer du contenu vrai — **ne jamais inventer un prix, un contenu de formation, un accès ou une fonctionnalité**.

## Ce que propose la plateforme
- **Formations** — cours / parcours / certifications (l'offre payante principale).
- **Club Digitos** — la **communauté / abonnement** (source du **MRR**). Les signups Club sont l'étage de conversion clé du funnel côté apprenants.
- **Rysmo** — l'**assistant IA** on-site (Google Generative AI / Gemini) : 1re ligne de support et d'orientation sur le site. Le social peut y **orienter** (« pose ta question à Rysmo »).
- **Blog** & **YouTube** — contenus d'acquisition (SEO + notoriété).

## Et la ligne agence — voir le skill dédié
- **Agence « Digital Commerce Local »** (`/agence`) — je digitalise les commerces de quartier.
  Mise en place 295 000 / **495 000** / 895 000 XOF + accompagnement mensuel 175 000 – 225 000.
  **Tous les détails, les montants et les red lines : skill `agency-offer`.**
  Les montants font autorité dans **`src/lib/agency/offer.ts`**, jamais de mémoire.
  → C'est la **piste B** de la stratégie de contenu (skill `content-strategy`) : une audience
  différente, un vocabulaire différent, un canal différent (Facebook).

## Sources de lecture
- **Firestore** : collections de formations / cours / abonnements (via les helpers `src/lib/firestore.ts` côté app ; en lecture agent, passer par les fonctions/flux exposés — ne pas inventer de champ).
- **Miroir Stripe → Firestore** : source de vérité du **MRR Club** (lu par Nadia).
- **Contenu i18n** : la plateforme est **bilingue FR/EN** avec URLs anglaises localisées — vérifier la langue cible d'un contenu.

## Convention
- Ne mets en avant que des formations/offres **publiées et actives**.
- URL publique : `https://maxmorrys.me/...` (respecter la locale FR/EN).
- Pour tout chiffre (prix, durée, nombre de modules) : **lire l'offre**, ne jamais estimer.

## Étiquetage `Offre` (dimension produit d'un contenu)
Chaque contenu porte un champ **`Offre`** en base (`Contenus`) = le produit mis en avant :
- **Formations** — un cours / parcours / certification.
- **Club Digitos** — l'abonnement communauté (MRR).
- **Rysmo** — l'assistant IA on-site.
- **Agence** — une mise en place agence (skill `agency-offer`).
- **Accompagnement** — l'accompagnement mensuel agence, ou l'orientation / mentorat côté plateforme.
- **Non-produit** — éducatif ou inspirationnel, aucune offre mise en avant.

`Offre` est l'une des **quatre** étiquettes obligatoires, avec `Pilier` (rôle éditorial), `Serie`
(rendez-vous) et `Cible` (piste d'audience) — voir skills `maxmorrys-brand` et `content-strategy`.
Renseigner **les quatre** à chaque création.

**Couverture** : sur trois semaines glissantes, les cinq offres doivent chacune avoir été citées au
moins une fois. Ne jamais laisser une offre disparaître un mois entier.
