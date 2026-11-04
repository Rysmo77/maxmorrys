# Varier les formats d'un lot social

**Réussite :** chaque post du lot a la forme qui provoque le geste visé, le lot passe `qa-lot.mjs` sans défaut de variété, et Salimata n'a rien à reprendre côté marque.

## Matière à charger
- Le lot : fichier `_bmad-output/growth/*lot*.json` (avant dépôt) ou lignes NocoDB `rédigé` / `prêt_à_valider` de la semaine (`node scripts/growth/nocodb.mjs list contenus --where "(Date_Publication_Prevue,gte,exactDate,<lundi>)" --fields Id,Reseau,Format_Post,Serie,Gabarit,Titre`).
- Les deux semaines précédentes (même requête) : on ne répète pas la forme de la semaine d'avant.
- `references/repertoire-formats.md` et `docs/growth-kb/11-visuels-nayo.md` § 3 ter (données exactes).

## Démarche
1. Pour chaque post, écrire en une ligne le **geste visé** (enregistrer, répondre, partager, se reconnaître, apprendre un mot, cliquer).
2. Choisir la famille qui sert ce geste dans le répertoire ; à geste égal, prendre celle qui a le moins servi depuis deux semaines.
3. Remplir `Gabarit` et les données de la famille dans `Slides_JSON` (première entrée hors carrousel ; une entrée par slide en carrousel, `gabarit` par slide si besoin). Textes à l'image dans les limites du répertoire, sans emoji.
4. répartir les 3 stories sur au moins 2 familles (`stories-interactives.md`).
5. Contrôler : `node ops/agents-autonomes/outils/qa-lot.mjs <lot.json> --semaine <lundi>` jusqu'à zéro défaut ; aperçu d'une charge : `node scripts/growth/nayo.mjs brief <Id> --slides <fichier>`.
6. Sur des lignes déjà déposées : préparer `{Id, Gabarit, Slides_JSON, Visual_Strategy}`, simuler (`update contenus --file …`), montrer à Salimata et à Max, puis `--apply` **sans toucher au `Status`**.

## Livrable
Le lot complété + un tableau « post · geste · famille · pourquoi » dans `_bmad-output/growth/AAAA-MM-JJ-formats-<semaine>.md`.
