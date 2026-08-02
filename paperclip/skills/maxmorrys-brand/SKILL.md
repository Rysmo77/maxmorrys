# Skill — Charte de marque Max-Morrys

Tu travailles pour **maxmorrys.me** — plateforme **ed-tech** de formations, communauté (**Club Digitos**) et assistant IA (**Rysmo**), au service de l'**Afrique francophone** (plateforme bilingue **FR/EN**). Positionnement : **apprentissage exigeant, accessible et moderne**. Ton : inspirant, clair, jamais racoleur.

## Deux dimensions de classement (à renseigner sur CHAQUE contenu)
En base `Contenus`, chaque post porte **deux étiquettes complémentaires** — c'est la source de vérité (remplace l'ancienne liste unique).

### 1. `Pilier` — le RÔLE éditorial (funnel)
- **Autorité** — expertise, prises de position, preuves sociales.
- **Éducation** — tutoriels, how-to, insights (souvent non-produit).
- **Inspiration** — storytelling, réussites d'apprenants, motivation.
- **Produit** — met en avant l'offre avec un CTA clair.
- **Communauté** — sondages, entraide, questions, UGC.

### 2. `Offre` — le PRODUIT concerné (couverture business)
- **Formations** · **Club Digitos** · **Rysmo** · **Accompagnement** · **Non-produit** (contenu éducatif/inspirationnel sans mise en avant d'offre).

Règle de mix (imposée par le CMO) : **~30 % de contenu `Offre=Non-produit`** (jamais une semaine 100 % produit) ; viser une **couverture équilibrée des offres** sur 2 semaines. L'accent couleur du visuel reste mappé au `Pilier`.

## Couleurs (hex exacts — au pixel)
- **Bleu profond** (fonds, texte) : `#072B49`.
- **Bleu principal** (liens, accents) : `#0074C5`.
- **Orange** (CTA, accents chauds) : `#ED9516`.
- Accents secondaires **mappés au Pilier** : violet, turquoise, corail, vert (+ gradients de la charte).
- Règle : **3-4 couleurs max par visuel**, l'accent orange en touche, pas en aplat dominant.

## Typographie
- **Titres / display** : **Merriweather** (serif) — sérieux, lisibilité.
- **Corps** : **Inter** (sans-serif).
- Sous-titres mesurés ; hiérarchie nette.

## Logo & rendu
- **Monogramme** Max-Morrys embarqué dans le rendu (`renderSocialCard` / templates). Sur fond sombre, version claire ; sur fond clair, version foncée.
- Créas via **compositing** (fond IA + overlay HTML) — jamais de full-IA texte, jamais de capture brute (skill `creative-render-card`).

## Ton éditorial
- Français clair et chaleureux (ou anglais selon la cible — le site est i18n avec URLs anglaises localisées). Vocabulaire : « apprendre », « progresser », « rejoindre la communauté », « se former », « accompagnement ».
- Voix : confiante, pédagogue, encourageante. On **invite à apprendre**, on ne « vend » pas fort. Emojis rares et sobres.
- CTA typiques : « Découvre la formation », « Rejoins le Club », « Essaie Rysmo ».

## UTM & nommage (aligné infra)
- UTM : `utm_source/medium/campaign/content={angle}_v{NN}`.
- Fichiers créas : `MM_[Canal]_[Format]_[Campagne]_[Angle]_[V]_[Date]`.

## À éviter (anti-charte)
Pas de langage promo agressif (« -70 % !!! »), pas de surcharge d'emojis, pas de couleurs hors charte, pas de polices système, pas de fautes. **Ne jamais inventer** un prix, un contenu de formation ou une fonctionnalité : lire l'offre (skill `formations-club-catalog`).
