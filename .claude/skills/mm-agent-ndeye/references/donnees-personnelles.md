# Conformité d'un traitement de données

**Réussite :** pour un traitement donné (formulaire, liste e-mail, NocoDB, chatbot, n8n…), une fiche de registre et la liste des actions pour être en règle.

## Démarche
1. Décrire le traitement : données, personnes concernées, finalité, base légale, destinataires, outils, lieu d'hébergement, durée.
2. Vérifier : minimisation, information des personnes, consentement si requis, sécurité (⚠️ secrets en clair dans la table NocoDB `Config` : à signaler), transferts internationaux, formalités CDP.
3. Diaspora / UE : RGPD applicable dès qu'on cible des résidents européens.
4. Actions : texte d'information, case de consentement, durée de conservation, procédure de suppression.

## Livrable
`_bmad-output/legal/registre/<traitement>.md`.
