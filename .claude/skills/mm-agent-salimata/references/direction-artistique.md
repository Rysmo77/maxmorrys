# Direction artistique d'un lot social

**Réussite :** chaque ligne du lot a un `Gabarit`, un `Slides_JSON` complet (texte + données de la famille) et un `Visual_Strategy`, assez précis pour que render-card (WF-SOCIAL-04, kit DS) ou le studio NAYO produise un visuel conforme sans aller-retour.

## Matière à charger
- Le lot (fichier `_bmad-output/growth/*lot-social*.json` ou lignes NocoDB `rédigé` / `prêt_à_valider` / `image_needed` via `node scripts/growth/nocodb.mjs list contenus --where …`).
- ⭐ `{project-root}/docs/growth-kb/11-visuels-nayo.md` : familles `Gabarit`, données attendues dans `Slides_JSON`, territoire déduit de l'`Offre`, règles du kit DS, studio NAYO, coûts, et l'état du dépôt des visuels.
- Le design system produit : `Max-Morrys_DS_Platform/readme.md` et les planches `Max-Morrys_DS_Platform/guidelines/*.html`.

## Démarche
1. Pour chaque ligne : choisir le `Gabarit` selon ce que le post doit FAIRE (une idée → `affiche`, une méthode → `etapes`, une question → `question`, un nombre sourcé → `chiffre`, une transformation → `avant_apres`, une parole → `citation`, les coulisses → `coulisses`, un prix → `offre`, un post phare → `studio`), le texte à l'image (≤ 7 mots en couverture ; `[mot]` pour la couleur du territoire), et ce qui doit être une vraie photo (→ `photo` en `coulisses`, ou `image_needed`).
2. Remplir les données de la famille dans `Slides_JSON` (`etapes`, `options`, `chiffre` + `source`, `avant`/`apres`, `prix`/`prixUnite`/`prixNote`/`points`, `auteur`) ; prix revérifiés dans le code. Carrousels : une entrée par slide, slide 1 autonome, dernière avec le CTA unique.
3. Vérifier la cohérence du lot entier (rythme visuel, jamais trois fois la même famille d'affilée, territoires variés) ; contrôler chaque charge avec `node scripts/growth/nayo.mjs brief <Id> --slides <fichier>`.
4. Posts `studio` : brief NAYO séparé, devis avant toute dépense, procédure du § 5 de la fiche 11.
5. Préparer le fichier de mise à jour `{Id, Gabarit, Slides_JSON, Visual_Strategy}` dans `_bmad-output/growth/`, simuler, montrer à Max, puis `update contenus --file … --apply` (sans toucher au `Status`).

## Règles
- Aucun emoji sur les slides ; aucune photo de stock présentée comme réelle ; aucun visage généré ; aucun client identifiable sans accord écrit ; aucun montant dans une miniature ; aucun `chiffre` sans `source` (règle du monospace).

## Livrable
Fichier de mise à jour + récapitulatif visuel du lot (tableau).
