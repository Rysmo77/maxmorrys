# Chasse aux idées de la semaine

But : 8 à 12 idées de posts pour la **semaine visée** (en mission : W+3, la semaine que le lot du mercredi suivant écrira ; en session : celle que Max demande), chacune née d'un signal réel, notée, sans doublon.

## 1. Les gisements (dans cet ordre ; noter pour chacun ce qui a été lu, même vide)

| # | Gisement | Où le lire | Ce qu'on en tire |
|---|---|---|---|
| 1 | **Questions posées à Rysmo** | dernier `_bmad-output/growth/support/*-rysmo.md` (Josiane, lundi 09:00) ; en session : `node /opt/mm-agents/bin/mm-firestore.mjs rysmo --depuis <J-7>` sur le VPS | thèmes qui reviennent → ATELIER, « Ta question, ma réponse » |
| 2 | **Recherches Google** | `node /opt/mm-agents/bin/mm-gsc.mjs requetes --depuis <J-28> --jusqu <J-1> --limite 50` ; dernier `_bmad-output/growth/seo/*.md` | requêtes à impressions sans clic → le sujet intéresse, notre réponse manque |
| 3 | **Veille du lundi** | dernier `_bmad-output/growth/veille/*-veille-*.md` (Thierry, lundi 07:00) | faits datés → RADAR, « Nouveau sur… », « Mythe ou réalité ? » |
| 4 | **Nos posts publiés** | `node /opt/mm-agents/bin/mm-meta-verif.mjs --depuis <J-28> --jusqu <J-1>` (mesures) ; `nocodb.mjs list contenus --where "(Status,eq,publié)"` | ce qui a été enregistré, partagé, commenté → décliner ; ce qui est tombé à plat → ne pas refaire |
| 5 | **Motifs de refus de Max** | `node /opt/mm-agents/bin/mm-decision.mjs liste --motifs --depuis 28` | ce que Max ne veut plus (trop business, trop long…) → filtre |
| 6 | **Demandes reçues** | dernier `_bmad-output/commercial/*-demandes.md` (Ibrahima) — **thèmes seulement**, rien de nominatif | les blocages des commerçants → tutoriels |
| 7 | **Actualité digitale utile** | recherche web : centres d'aide et blogs officiels Meta, WhatsApp, Google, TikTok, Wave, Orange Money ; presse tech africaine (date < 30 jours) | changement de fonctionnalité, nouvelle règle, arnaque qui circule → RADAR / ATELIER |
| 8 | **Calendrier local** | `axes-du-mois.md` § 2 ; plan du mois `_bmad-output/growth/plans/AAAA-MM.md` | temps forts de la semaine visée (dates sourcées) |
| 9 | **Formats de référence** | 2 ou 3 comptes éducatifs francophones ou africains qui marchent (recherche web) | une **forme** à essayer (pas un sujet à copier, jamais un visuel repris) |

Un gisement vide se dit (« aucune question Rysmo cette semaine ») ; on ne le remplit pas d'imagination.

## 2. De la trouvaille à l'idée

Une idée = **un problème réel + une réponse utilisable ce soir + une forme**.

- **Titre** : l'accroche telle que le post pourrait l'ouvrir (≤ 90 caractères, tutoiement, sans emoji).
- **Angle** : 1-2 phrases : ce qu'on apprend, à qui, pourquoi maintenant.
- **Serie / Rubrique** : une des 6 séries et, si elle colle, une des 8 rubriques de `12-rubriques-editoriales.md`.
- **Pilier**, **Cible** (Apprenants / Commerçants / Mixte), **Reseau** (fb, ig, fb+ig, story), **Format** (post, carrousel, story — ⛔ plus de reel depuis le 04/11/2026).
- **Gabarit_Suggere** : famille de visuel conseillée (catalogue de Salimata, `docs/growth-kb/11-visuels-nayo.md`) ; varier d'une idée à l'autre.
- **Sources** : URL + date, ou chemin du rapport interne + thème (« support/2026-11-02-rysmo.md, thème « avis Google », 3 questions »).

## 3. Diversité du lot (contrôle avant notation)

- ≥ 80 % éducatives ; **0 ou 1** idée OFFRE (qui apprend d'abord).
- Au moins 4 séries différentes ; aucune série > 40 % du lot.
- Commerçants et Apprenants **tous deux** présents (≥ 3 chacun sur 10).
- Au moins 3 formats et 4 gabarits différents ; au moins 1 carrousel et 1 story/sondage.
- Au plus 2 idées issues d'un même gisement.

## 4. Anti-doublon

Avant de proposer : `node scripts/growth/nocodb.mjs list contenus --fields Id,Titre,Status,Date_Publication_Prevue --limit 400` et `node scripts/growth/nocodb.mjs list idees-posts --fields Id,Titre,Statut,Periode --limit 400`. Une idée **doublon** = même problème + même réponse qu'un post publié ou prévu depuis moins de 8 semaines, ou qu'une idée déjà proposée/écartée. Doublon → on change d'angle (autre cible, autre forme, approfondissement) ou on l'abandonne, et on le note.

## 5. Notation

Grille de `grille-notation.md`. On garde les 8 à 12 meilleures **après** le contrôle de diversité, classées par score.
