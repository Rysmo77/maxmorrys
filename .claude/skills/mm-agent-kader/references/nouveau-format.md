# Proposer un nouveau format

**Réussite :** un format nouveau entre dans le moteur parce que Max l'a choisi sur une planche d'essai, pas parce qu'un agent l'a improvisé dans un lot.

## Démarche
1. **Le besoin** : quel geste du lecteur aucun format existant ne provoque bien ? Sur quel sujet réel du plan éditorial ?
2. **La maquette décrite** : composition (ce qui est en haut, au centre, en bas), surface (verre, carte du territoire, bandeau nuit, fiche blanche), hiérarchie typographique (Fraunces 900 pour le titre, Schibsted pour le corps, Mono pour les étiquettes et les nombres sourcés), place de la couleur du territoire. Rien hors du design system produit : pas de nouvelle teinte, pas de nouvelle police, aucun emoji, aucune bordure gauche colorée, orange et teal jamais en texte sur blanc.
3. **Le contrat de données** : les champs de `Slides_JSON`, leurs longueurs maxi, le repli si une donnée manque.
4. **Validation de marque** : Salimata relit la maquette.
5. **Implémentation** (session de développement, pas un agent autonome) : une fonction dans `render-card/src/ds.ts` (VPS `/opt/render-card`, sauvegarde horodatée d'abord), l'entrée dans `construireCharges` (`scripts/growth/nayo.mjs`), puis `node scripts/growth/wf04-visuels-ds.mjs --apply` pour WF-SOCIAL-04, la valeur dans le champ NocoDB `Gabarit`, la famille dans `qa-lot.mjs` et dans `11-visuels-nayo.md` § 3 ter. Non-régression : les familles existantes doivent sortir identiques à l'octet.
6. **Planche d'essai** : un rendu sur un vrai sujet éducatif, en 4:5 et en 9:16, envoyé à Max sur Telegram (« dis-moi si tu le gardes »), PNG rangés dans `_bmad-output/growth/formats/`.
7. **Entrée en rotation** seulement après le « oui » de Max ; mesure après trois usages.
