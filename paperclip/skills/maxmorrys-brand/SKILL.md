# Skill — Charte de marque Max-Morrys

Tu travailles pour **maxmorrys.me**. La marque porte désormais **deux lignes** :
- une plateforme **ed-tech** — formations, communauté (**Club Digitos**), assistant IA (**Rysmo**) ;
- une **agence** — « Digital Commerce Local », qui digitalise les commerces de quartier
  (skill `agency-offer`, page `/agence`).

Au service de l'**Afrique francophone** (plateforme bilingue **FR/EN**). Positionnement :
**apprentissage exigeant, accessible et moderne**. Ton : inspirant, clair, jamais racoleur.
Le fil qui relie les deux lignes : **« Soit tu apprends à le faire, soit je le fais pour toi. »**

## Quatre dimensions de classement (à renseigner sur CHAQUE contenu)
En base `Contenus`, chaque post porte **quatre étiquettes**. C'est la source de vérité.

### 1. `Pilier` — le RÔLE éditorial (funnel)
- **Autorité** — expertise, prises de position, preuves sociales.
- **Éducation** — tutoriels, how-to, insights (souvent non-produit).
- **Inspiration** — storytelling, réussites d'apprenants, motivation.
- **Produit** — met en avant l'offre avec un CTA clair.
- **Communauté** — sondages, entraide, questions, UGC.

> ⚠️ Ces valeurs sont **validées en dur** dans `WF-TG-ROUTER` (nœud `TH — Parse posts`). Ne pas les
> renommer : ça casse le pipeline. Les listes `Formations/Contenus/Communauté/IA/Accompagnement` et
> `Apprendre/Progresser/Partager/Impacter/Accompagner` qu'on croise ailleurs sont **périmées**.

### 2. `Serie` — le RENDEZ-VOUS éditorial
**RADAR** (tendances datées) · **ATELIER** (un outil, un réglage, un gain) · **PREUVE** (chiffres,
avant/après) · **COULISSES** (parcours, fabrication) · **CERCLE** (communauté, sondages) ·
**OFFRE** (mise en avant assumée). Détail : skills `content-strategy` et `trends-radar`.

### 3. `Offre` — le PRODUIT concerné (couverture business)
- **Formations** · **Club Digitos** · **Rysmo** · **Agence** · **Accompagnement** ·
  **Non-produit** (éducatif ou inspirationnel, aucune offre mise en avant).

### 4. `Cible` — la PISTE d'audience
- **Apprenants** (entrepreneurs, marketeurs, reconversions) · **Commerçants** (TPE physiques,
  Dakar/Abidjan/Cotonou) · **Mixte** (sert honnêtement les deux — pas par facilité).

**Règle de mix hebdomadaire** (imposée par le CMO, sur 14 posts) :
`ATELIER 3 · OFFRE 3 · RADAR 2 · PREUVE 2 · COULISSES 2 · CERCLE 2`.
**Contrainte dure : `Serie=OFFRE` ≤ 3 sur 14.** Couverture des cinq offres sur **trois semaines
glissantes**. L'accent couleur du visuel reste mappé au `Pilier`.

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
- **Tutoiement systématique**, y compris avec les commerçants (la page `/agence` est en tutoiement).
  Le vouvoiement est réservé aux blocs **B2B entreprise** (« Formez vos équipes »).
- Français clair et chaleureux (ou anglais selon la cible — le site est i18n avec URLs anglaises
  localisées). Phrases courtes, « sans blabla », zéro jargon creux, zéro théorie abstraite.
- Toujours orienté action : chaque contenu se termine par la prochaine étape concrète.
  Résultats **mesurables** (« +1 790 % », « en 3 mois », « 33 clients ») — jamais « beaucoup ».
- **Touches locales légères**, 1 à 3 par contenu : Dakar/Abidjan/Douala, Wave et Orange Money,
  WhatsApp Business, boutiques de quartier. Français standard — la diaspora doit suivre.
- Voix : confiante, pédagogue, encourageante. On **invite à apprendre**, on ne « vend » pas fort.
  Emojis rares et sobres.
- **CTA selon la piste** — un seul par contenu, deux CTA = zéro CTA :
  - `Cible=Apprenants` : « Découvre la formation », « Rejoins le Club », « Essaie Rysmo ».
  - `Cible=Commerçants` : « Fais le test sur Google Maps », « Trouve ton pack en 3 questions ».
- **Ce qu'on n'est pas** : corporate rigide, gourou américain traduit, hustle toxique, fausse modestie.

## UTM & nommage (aligné infra)
- UTM : `utm_source/medium/campaign/content={angle}_v{NN}`.
- Fichiers créas : `MM_[Canal]_[Format]_[Campagne]_[Angle]_[V]_[Date]`.

## À éviter (anti-charte)
Pas de langage promo agressif (« -70 % !!! »), pas de surcharge d'emojis, pas de couleurs hors charte, pas de polices système, pas de fautes. **Ne jamais inventer** un prix, un contenu de formation ou une fonctionnalité : lire l'offre (skill `formations-club-catalog`).

**Aucun montant de mémoire.** Les prix agence se lisent dans `src/lib/agency/offer.ts`
(skill `agency-offer`) ; les prix de formation dans l'offre réelle. Un prix inventé finit dans un
devis, puis dans un litige.

**Vocabulaire interdit face aux commerçants** (`Cible=Commerçants`) : « site web », « SEO »,
« catalogue Meta », « Merchant Center », « GA4 », « pixel », « workflow », « n8n ». La table de
traduction complète est dans le skill `agency-offer`, et elle est obligatoire.
