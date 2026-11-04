# Variété des formats d'un lot (décision de Max du 04/11/2026)

> « De meilleurs créateurs, un peu différents, pas toujours le même format — changer de format tout en restant fidèle à la charte. » Mesure du jour : sur 50 posts à venir, quatre familles en faisaient 42 (etapes 12, avant_apres 11, question 10, affiche 9).

## Règles (contrôlées par `ops/agents-autonomes/outils/qa-lot.mjs --semaine <lundi>`)
1. **Jamais la même famille deux fois de suite sur un même réseau** (posts, dans l'ordre des dates).
2. **Au plus 25 % de la semaine** pour une famille (2 posts sur 8 à 10).
3. **Au moins 6 familles distinctes** pour 9-10 posts (5 pour 6-8).
4. **Au moins un script de Reel** par semaine : `Format_Post = reel`, `Status = planifié`, script plan par plan dans `Brief` (ligne `DURÉE : 15 à 30 s`, au moins 3 lignes `PLAN n`). Méthode : `{project-root}/.claude/skills/mm-agent-kader/references/script-video.md`.
5. **Stories** : au moins 3 familles pour 7 stories, jamais plus de 3 fois la même ; aucun rappel d'offre.
6. Chaque nouvelle famille exige ses données dans `Slides_JSON` (sinon render-card retombe sur l'affiche, et `qa-lot` le refuse) : `docs/growth-kb/11-visuels-nayo.md` § 3 ter.

## Qui fait quoi
- **Kader** (`mm-agent-kader`) choisit et fait tourner les formats, propose les nouveaux (planche d'essai), écrit les scripts vidéo et les stories interactives.
- **Salimata** valide la marque de chaque format nouveau et tranche les désaccords ; elle peut refuser une forme jolie qui abîme la marque.
- **Max** choisit sur planche les formats qui entrent en rotation.

## Paragraphe à ajouter à la mission `lot-social` (fichier tenu par le chantier « idées de posts »)
> **Variété des formats (décision de Max, 04/11/2026).** Choisis la famille de chaque post par le geste attendu du lecteur (répertoire : `.claude/skills/mm-agent-kader/references/repertoire-formats.md`) : jamais la même famille deux fois de suite sur un réseau, au plus 25 % de la semaine pour une famille, au moins 6 familles pour 9-10 posts, au moins 3 familles pour les 7 stories. Puise d'abord dans les familles les moins utilisées des deux semaines précédentes (`mythe_realite`, `comparatif`, `erreur`, `quiz`, `signes`, `conversation`), avec leurs données dans `Slides_JSON` (`docs/growth-kb/11-visuels-nayo.md` § 3 ter). Ajoute un script de Reel par semaine (`Format_Post = reel`, `Status = planifié`, script plan par plan dans `Brief` : `.claude/skills/mm-agent-kader/references/script-video.md`). `qa-lot.mjs --semaine <lundi>` doit passer sans défaut avant tout dépôt.
