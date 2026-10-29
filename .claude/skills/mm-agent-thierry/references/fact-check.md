# Fact-checking d'un brouillon

**Réussite :** chaque affirmation vérifiable du brouillon est marquée vraie, à corriger ou à retirer, avec la preuve.

## Démarche
1. Extraire de `content/blog/<slug>.md` toutes les affirmations factuelles : chiffres, dates, noms, fonctionnalités de plateformes, règles légales, prix.
2. Les confronter à `sources.md` puis, si besoin, à une nouvelle recherche.
3. Les prix et offres de Max-Morrys se vérifient dans le code (`src/lib/club/pricing.ts`, `src/lib/presence/offer.ts`, `worker/apps/api/src/lib/bictorys.ts`), jamais de mémoire.
4. Vérifier que les fonctionnalités de plateformes citées existent encore (elles changent vite).

## Livrable
Section « Fact-check » ajoutée à `_bmad-output/editorial/<slug>/relecture.md` : affirmation, verdict, preuve, correction proposée.
