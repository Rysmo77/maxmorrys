# Lot social de 2 semaines (NocoDB)

**Réussite :** 14 posts **et 14 stories** (7 par semaine, à 12 h, Instagram) déposés dans NocoDB `Contenus` au statut `rédigé` (WF-SOCIAL-04 rend alors les visuels et passe lui-même chaque ligne en `prêt_à_valider`), conformes à la grille, que Max valide en dix minutes — et la file de publication est couverte pour deux semaines.

## Matière à charger
- ⭐ `{project-root}/docs/growth-kb/10-community-management.md` — **fait autorité pour l'écriture FB/IG** (signaux algorithmiques, gabarit accroche / lignes courtes / micro-CTA, longueurs, emojis, hashtags, voix CM) ; il prime sur les longueurs de `04`.
- `{project-root}/docs/growth-kb/04-taxonomie-reseaux-qa.md` (mix hebdomadaire, grille de créneaux, UTM, règles LinkedIn/X), `03-charte-voix.md`, `01-plateforme-et-offres.md` pour les offres citées.
- L'état de la file : `node scripts/growth/nocodb.mjs stats contenus Status` et les lignes à venir (`list contenus --where "(Status,eq,validé)"`), pour ne rien doublonner.
- Le schéma exact : `node scripts/growth/nocodb.mjs schema contenus`.
- Les priorités du moment (plan d'Awa dans `_bmad-output/growth/`, articles récents à relayer).

> **Cadence (décision de Max, 29/10/2026) : 8 à 10 posts par semaine + 7 stories**, rubriques de `12-rubriques-editoriales.md` prioritaires, OFFRE ≤ 2 par semaine. Elle remplace le mix de 14 de `04`.

## Démarche
1. **Cadrer** avec Max (une question au plus) : période, offres à pousser, temps fort éventuel, réseaux actifs. Par défaut : Facebook et Instagram (seuls canaux câblés), LinkedIn en option (pas de jeton : publication manuelle).
2. **Grille** : 14 posts **+ 7 stories par semaine** (grille de 21 créneaux, `04-taxonomie-reseaux-qa.md`). Répartir les posts par série (ATELIER 3, OFFRE 3 maximum, RADAR, PREUVE, COULISSES, CERCLE à 2 chacun sur 14), par cible (≈ 5 Apprenants, 3,5 Commerçants, 5,5 Mixte) et par créneau (Facebook midi et week-end pour les commerçants ; Instagram le soir ; LinkedIn en semaine le matin). Couvrir les offres sur 3 semaines glissantes.
3. **Rédiger** chaque post au gabarit du guide 10 (§2) : accroche d'une ligne (≤ 110 caractères, visible avant « …plus »), 2 à 5 lignes courtes, un micro-CTA qui provoque un signal fort (commentaire, enregistrement, partage). Au registre de sa piste, une seule idée.
   - **Longueur de `Texte`** (guide 10 §3) : FB post 40-90 mots (120 pour un ATELIER très concret) · IG post 30-80 · IG carrousel 20-60 · OFFRE 35-70 (douleur → offre en une phrase → prix → CTA) · CERCLE 15-40.
   - **Emojis** : 1 à 3 par légende, chacun justifié (fin d'accroche, un repère, l'appel à l'action) ; ⛔ jamais un par ligne — une liste se fait avec des tirets « – » ; jamais deux à la suite, jamais dans les visuels ni `Slides_JSON`.
   - **Hashtags** dans le champ `Hashtags` uniquement, jamais dans `Texte` : IG 4 à 6 (`#MaxMorrys` + 1-2 géo + 2-3 niche), FB 2 à 3 (marque + géo + sujet), sans accent.
   - **Liens** : IG « le lien est dans ma bio », aucune URL ; FB au plus un lien UTM, en dernière ligne.
   - **Voix CM** : tu/je, phrases de 5 à 15 mots, pas de listes à « · », pas de points-virgules, pas de « en sus », « offre », « solution », « n'hésitez pas ».
3 bis. **Stories (7 par semaine, une par jour à 12:00 Dakar)** — chacune a UN rôle clair, varié dans la semaine : sondage, question ouverte (réponse en message privé), rappel du post du jour (« ce soir, 19 h »), coulisses, rappel d'offre, compte à rebours daté et vérifiable. Règles :
   - `Reseau = ig` (Facebook en miroir seulement si la story parle aux commerçants : une ligne `fb` en plus, même `Slides_JSON`) ; `Format_Post = story` ; `Date_Publication_Prevue` à `T12:00:00+00:00`.
   - **Visuel seul** : l'API ne publie ni légende, ni hashtag, ni lien cliquable, ni autocollant interactif (sondage, curseur, lien). Le texte et le CTA vivent DANS `Slides_JSON` : « Réponds en message », « Le lien est dans ma bio », « Écris « MOT » en message ». Un sondage = gabarit `question` avec `options` affichées, réponse en message.
   - Texte à l'image très court (titre ≤ 70 caractères, corps ≤ 1 phrase) ; `Gabarit` choisi parmi `question`, `affiche`, `chiffre` (source obligatoire, même pour un compte à rebours : « Du 11/11 au 25/12/2026 »), `citation`, `etapes`, `offre`, `coulisses` — rendu 9:16 automatique (`fmtMap.story = '9:16'`, zones de sécurité haut 11 % / bas 14 % gérées par render-card) ; jamais trois fois la même famille d'affilée ; `sourcil` explicite (« Sondage du lundi », « Compte à rebours · Fêtes »).
   - `Texte` = les mots de la story et le CTA en clair (il sert à la carte Telegram, il n'est pas publié) ; `Hashtags` vide ; `Brief` = le rôle et l'Id du post relayé.
   - Exemple de lot : `_bmad-output/growth/2026-10-29-stories-S45-S46.json` (Ids 181-194).
4. **Remplir les champs exacts** de chaque ligne :
   - `Titre` (interne, court), `Thematique` (Marketing digital, SEO, Social media, Entrepreneuriat, E-commerce, IA & automatisation, Branding, Growth, Autre), `Pilier`, `Serie`, `Offre`, `Cible` ;
   - `Reseau` (`fb`, `ig`, `tiktok`, `youtube`, `linkedin`, `x`), `Format_Post` (`post`, `carrousel`, `story`, `reel`, `thread`, `short`…) ;
   - `Date_Publication_Prevue` en ISO avec fuseau de Dakar (`2026-11-04T12:00:00+00:00`) ;
   - `Brief` (intention, public, preuve), `Texte` (légende finale), `Hashtags`, `Visual_Strategy` (brief visuel), `Slides_JSON` pour **chaque** post (tableau d'entrées `{titre, corps?, cta?, …}` ; une seule hors carrousel) ;
   - **`Gabarit`**, choisi **post par post** selon ce que le post doit faire — `affiche` (une idée), `etapes` (méthode ATELIER : `etapes` ou `corps` « a · b · c »), `question` (CERCLE : `options` ou `corps` « A … · B … »), `chiffre` (exige `chiffre` + `source`), `avant_apres` (`avant`, `apres`), `citation` (`auteur`), `coulisses` (`photo` réelle facultative), `offre` (`prix`, `prixUnite`, `prixNote`, `points`, `paiement`), `studio` (post phare fait par Max dans le studio NAYO, avec Salimata). Jamais trois fois la même famille d'affilée. Détail et exemples : `{project-root}/docs/growth-kb/11-visuels-nayo.md` § 3. Contrôle : `node scripts/growth/nayo.mjs brief <Id>` ;
   - `Status` = **`rédigé`** : WF-SOCIAL-04 ne lit que ce statut (6 lignes toutes les 2 h), rend le visuel, puis pose `prêt_à_valider` ; WF-SOCIAL-07 n'envoie la carte Telegram qu'à ce moment. ⛔ Déposer directement en `prêt_à_valider` fait partir des cartes sans visuel. `image_needed` si le visuel exige un apport humain (photo réelle, capture client).
5. **QA** de chaque ligne — d'abord le **contrôle §8 du guide 10** (accroche, longueur, emojis, hashtags, une seule action à signal fort, « ça se partage ? »), vérifié par script avant tout dépôt : mots par format, emojis comptés avec `/\p{Extended_Pictographic}/gu` (1-3, aucune ligne qui commence par un emoji dans une liste), hashtags 4-6 IG / 2-3 FB, aucun « · » ni « ; », aucun vous/votre/vos, aucun `#` dans `Texte`. Puis : compris en 3 secondes, identifiable Max-Morrys, un seul CTA, registre conforme, aucun montant de mémoire, aucune preuve sociale inventée, aucune formation promue, liens vers les bons hôtes, crochets intacts si on cite un titre du site.
6. **Écrire le lot** dans `_bmad-output/growth/AAAA-MM-JJ-lot-social.json` (tableau de lignes), puis simuler : `node scripts/growth/nocodb.mjs create contenus --file <lot>`.
7. **Montrer** le lot à Max sous forme de tableau lisible (date, réseau, série, accroche, CTA). Corriger selon ses retours.
8. **Écrire** avec `--apply` (statut `rédigé`). Prévoir ~1 h de rendu par 2 posts : déposer au moins 3 jours avant le premier créneau. Si Max dit explicitement « je valide » pour tout ou partie, préparer un fichier de mise à jour `{Id, Status: "validé"}` et l'appliquer avec `--human-approved "Max, <date>, en session"`.
9. **Rappeler l'état des canaux** (`06-outillage-n8n.md`) : FB et IG sont câblés (posts, carrousels, stories) ; LinkedIn, TikTok, YouTube ne publient pas.

## Livrable
Le fichier JSON du lot (posts) et celui des stories, les lignes NocoDB créées (Ids), et un récapitulatif : couverture par série, offre, cible, réseau, le tableau des stories (date, rôle, gabarit), et ce qui attend Max.
