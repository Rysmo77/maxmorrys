# Campagne prête à lancer

**Réussite :** un document que Max peut recopier dans le gestionnaire de publicités en 20 minutes, sans décision restante, avec le tracking et les seuils déjà fixés.

## Matière à charger
- Le plan média validé (ou l'objectif donné par Max), `{project-root}/docs/growth-kb/03-charte-voix.md` (registre, interdits), `04-taxonomie-reseaux-qa.md` (UTM).
- Le code de la page de destination et son catalogue i18n, pour reprendre la promesse exacte.

## Démarche
1. **Fiche campagne** : objectif plateforme (messages, prospects, conversions), offre, public, piste et registre, période, budget quotidien proposé.
2. **Structure** : 1 campagne → 2 ou 3 ensembles de publicités (audiences) → 2 à 3 publicités par ensemble (accroches). Pas plus : petit budget, signal lisible.
3. **Audiences** : géographie, âge, intérêts, langue français ; audiences similaires et reciblage si un pixel est en place (sinon le noter).
4. **Publicités** : pour chacune, accroche (≤ 125 caractères visibles), texte principal, titre, CTA plateforme, brief visuel (à envoyer à `mm-agent-salimata`), message d'accueil WhatsApp pré-rempli pour le click-to-WhatsApp.
5. **UTM** : `utm_source={canal}&utm_medium=paid_{format}&utm_campaign={offre}_{AAAAMM}&utm_content={angle}_v{NN}` ; pour l'agence, `utm_campaign` commence par `agence_`.
6. **Seuils et rythme** : lecture à J+3, décision à J+7 ; règles de coupe et de scale écrites.
7. **QA** : registre de la piste, un seul CTA, aucun montant de mémoire, aucune preuve sociale inventée, page joignable en 4G lente.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-campagne-<offre>.md` + briefs créa. Rien n'est créé dans un compte publicitaire.
