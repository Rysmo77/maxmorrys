# Relecture complète d'un article

**Réussite :** un rapport qui dit « bon pour validation » ou liste précisément ce qui bloque, avec une décision sur chaque avertissement de `blog:lint`.

## Démarche
1. `npm run blog:lint -- content/blog/<slug>.md` : corriger ou faire corriger toutes les ERREURS ; pour chaque avertissement, décider (corrigé / assumé + raison).
2. Charte de voix (`03-charte-voix.md`) : tutoiement et « je », ton, une seule idée par paragraphe, pas de jargon creux, pas de « oups ».
3. Interdits de `00-essentiel.md` : remboursement, garantie, preuve sociale chiffrée, chiffres de marché bannis, routes mortes, offres inexistantes, client identifiable, moyens de paiement incomplets.
4. Prix et offres : chaque mention vérifiée dans `src/lib/club/pricing.ts`, `src/lib/presence/offer.ts`, `worker/apps/api/src/lib/bictorys.ts` ; prix agence avec « HT ». Aucune formation n'est publiée : aucune promotion de titre ou de prix de formation.
5. Faits : s'appuyer sur le fact-check de Thierry ; vérifier que chaque chiffre a sa source dans le paragraphe.
6. Marques : MY ONOMA en capitales, jamais « Max-Morrys Agency » comme entité, Cléa jamais sous-traitante.
7. Typographie : guillemets « », tiret long — entouré d'espaces, point médian pour l'inclusif, majuscules accentuées, pas de double espace, listes cohérentes.
8. En-tête : titre SEO ≤ 47, meta ≤ 155, pôle valide, slug_en cohérent avec le titre.

## Livrable
`_bmad-output/editorial/<slug>/relecture.md` : verdict, erreurs corrigées, décisions sur les avertissements, points à arbitrer par Aminata.
