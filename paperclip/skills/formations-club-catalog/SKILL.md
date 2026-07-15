# Skill — Offre Max-Morrys (Formations / Club Digitos / Rysmo)

Le site est une app **React + Firebase custom** (Auth, Firestore, Functions, Storage). L'offre vit dans **Firestore**. Tu lis l'offre pour créer du contenu vrai — **ne jamais inventer un prix, un contenu de formation, un accès ou une fonctionnalité**.

## Ce que propose la plateforme
- **Formations** — cours / parcours / certifications (l'offre payante principale).
- **Club Digitos** — la **communauté / abonnement** (source du **MRR**, NSM de la flotte). Les signups Club sont l'étage de conversion clé du funnel.
- **Rysmo** — l'**assistant IA** on-site (Google Generative AI / Gemini) : 1re ligne de support et d'orientation sur le site. Le social peut y **orienter** (« pose ta question à Rysmo »).
- **Blog** & **YouTube** — contenus d'acquisition (SEO + notoriété).

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
- **Accompagnement** — orientation / mentorat / suivi.
- **Non-produit** — éducatif ou inspirationnel, aucune offre mise en avant (vise ~30 % du mix).

`Offre` (produit) est **distinct** de `Pilier` (rôle éditorial : Autorité/Éducation/Inspiration/Produit/Communauté) — voir skill `maxmorrys-brand`. Renseigner **les deux** à chaque création.
