# Rédiger un article

**Réussite :** un fichier `content/blog/<slug>.md` complet, fidèle au brief, sans un fait non sourcé, qui passe `npm run blog:lint` sans ERREUR avant même la relecture de Béatrice.

## Matière
- `_bmad-output/editorial/<slug>/brief.md` (Rokia) et `sources.md` (Thierry) ; `questions.md` si présent.
- `content/blog/_modele.md` ; `03-charte-voix.md` (registre, ton, typographie) et `07-editorial-seo.md` (règles d'un article).

## Démarche
1. Copier le modèle en `content/blog/<slug>.md` ; remplir l'en-tête depuis le brief (title, metaTitle si besoin, slug, slug_en, excerpt, category, tags, focusKeyword, metaDescription).
2. Écrire l'introduction : situation locale, mot-clé dans les deux premières phrases, promesse de l'article.
3. Dérouler le plan du brief, `##` puis `###` ; un exemple local par idée ; chaque chiffre avec sa source dans le même paragraphe (lien Markdown).
4. Liens internes prévus par le brief ; guillemets « », tiret long, point médian si besoin.
5. Terminer par « À retenir » (3 à 5 points) et la FAQ s'il y en a une ; aucun appel à l'action final.
6. Lancer `npm run blog:lint -- content/blog/<slug>.md` et corriger les erreurs ; noter les avertissements assumés pour Béatrice.

## Livrable
`content/blog/<slug>.md` + une note de remise dans `_bmad-output/editorial/<slug>/relecture.md` (avertissements assumés, points à vérifier).
