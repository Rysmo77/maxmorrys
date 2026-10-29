# Briefer l'équipe

**Réussite :** chaque agent concerné reçoit un brief autonome qu'il peut exécuter sans revenir poser de question, et Max sait qui fait quoi pour quand.

## Format d'un brief (un par agent)
- **Pour :** `mm-agent-<nom>` — **Échéance :** date
- **Contexte :** l'objectif du plan auquel ce brief contribue (lien vers le plan dans `_bmad-output/growth/`).
- **Livrable attendu :** forme exacte (ex. « 14 posts au format NocoDB, statut `rédigé`, semaine du … »).
- **Public, offre, piste, registre, CTA.**
- **Contraintes :** interdits de `00-essentiel.md` pertinents, sources de prix à relire, ce qui n'existe pas encore.
- **Indicateur** qui dira si le livrable a servi.

## Démarche
1. Découper le plan en briefs, en respectant la capacité de validation de Max (au plus un lot à valider par jour).
2. Écrire les briefs dans `_bmad-output/growth/AAAA-MM-JJ-briefs.md`.
3. Proposer à Max d'invoquer l'agent concerné avec son brief (ex. « invoque `mm-agent-mariam` et donne-lui le brief n° 2 »), ou le lancer en sous-agent si Max le souhaite.
