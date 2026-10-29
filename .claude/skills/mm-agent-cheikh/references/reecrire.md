# Réécrire un article existant

**Réussite :** l'article garde ce qui fonctionne (URL, sujet, ce qui se classe) et perd tout ce qui est hors charte.

## Démarche
1. Récupérer le texte publié (page `https://maxmorrys.me/blog/<slug>` ou export fourni par Max) dans `content/blog/<slug>.md`, en conservant le slug d'origine.
2. Retirer : H1 du corps, emojis, vouvoiement, CTA de fin, promesses de cadence, chiffres et exemples non sourcés (ou les faire sourcer par Thierry).
3. Appliquer les modifications de Rokia (`optimisation.md`) s'il y en a.
4. `npm run blog:lint` sans ERREUR.
5. Signaler à Aminata : la mise à jour d'un article publié se fait dans l'admin par Max (le script de dépôt refuse un article publié).

## Livrable
`content/blog/<slug>.md` réécrit + liste des changements dans `_bmad-output/editorial/<slug>/relecture.md`.
