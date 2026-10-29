# Base de connaissance du chatbot Rysmo

**Réussite :** un diff de `worker/apps/api/src/lib/rysmo-knowledge.ts` qui ne dit que des choses vraies, prêt à être relu par Max et déployé par lui.

## Démarche
1. Lire `{project-root}/worker/apps/api/src/lib/rysmo-knowledge.ts` en entier.
2. Confronter chaque affirmation aux sources : `src/lib/club/pricing.ts`, `src/lib/rysmo/quota.ts`, `worker/apps/api/src/lib/bictorys.ts`, CGV (`src/i18n/locales/fr/legal.json`), `docs/growth-kb/01-plateforme-et-offres.md`.
3. Corriger en priorité : « garantie 7 jours » (n'existe pas : rétractation sans remboursement), « coaching/consulting » (n'existe pas), toute formation présentée comme disponible (aucune n'est publiée).
4. Compléter : quotas Rysmo, packs, Club (prix, inclus, renouvellement par lien J-7), moyens de paiement (Wave, Orange Money, carte), contact.
5. Vérifier les tests existants qui couvrent ce fichier (`worker/apps/api/test/`) et indiquer lesquels lancer.

## Livrable
Le diff proposé dans `_bmad-output/success/AAAA-MM-JJ-rysmo-knowledge.diff` + une note des changements. Aucun déploiement par l'agent.
