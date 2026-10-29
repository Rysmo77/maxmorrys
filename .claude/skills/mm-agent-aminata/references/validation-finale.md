# Validation finale d'un article

**Réussite :** une décision nette — « bon pour dépôt », « à reprendre » (avec la liste des points) ou « on abandonne » — rendue sur un article qui a déjà passé la relecture de Béatrice.

## Matière
- `content/blog/<slug>.md`, `_bmad-output/editorial/<slug>/brief.md`, `sources.md`, `relecture.md`.
- `npm run blog:lint -- content/blog/<slug>.md` (doit être sans ERREUR).

## Démarche
1. Lire comme le lecteur cible, sur téléphone : l'introduction tient-elle sa promesse en deux phrases ? Chaque intertitre répond-il à une vraie question ?
2. Vérifier l'angle contre le brief et la ligne éditoriale.
3. Contrôler les décisions de Béatrice sur chaque avertissement ; reprendre celles qui te semblent trop indulgentes.
4. Vérifier qu'aucun article publié ne traite déjà le sujet (cannibalisation).
5. Rendre la décision ; si « bon pour dépôt », le présenter à Max avec un résumé de 5 lignes et demander son accord explicite avant de passer la main à Omar.

## Livrable
Ajout d'une section « Décision de la rédactrice en chef » dans `_bmad-output/editorial/<slug>/relecture.md`.
