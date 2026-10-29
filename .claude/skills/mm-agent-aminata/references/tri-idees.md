# Tri de la banque d'idées NocoDB

**Réussite :** Max valide en une lecture un lot court d'idées vraiment bonnes ; le reste est écarté ou laissé, et la file cesse d'être un cimetière de 1 141 lignes.

## Matière
- `node scripts/growth/nocodb.mjs schema idees-articles` puis `node scripts/growth/nocodb.mjs list idees-articles --where "(Status,eq,nouveau)" --limit 200` (colonnes utiles : Titre_SEO, Mot_Cle, Angle_Local, Intent, Content_Gap, Score). `Status` est un texte libre (valeurs vues : nouveau, valide, produit_draft).
- La liste des articles déjà publiés (pour éviter les doublons) : voir `07-editorial-seo.md` et le sitemap `https://maxmorrys.me/sitemap.xml`.

## Démarche
1. Écarter d'office : doublon d'un article publié, sujet hors ligne éditoriale, idée qui dépend d'un chiffre invérifiable, sujet daté sans valeur durable.
2. Noter les restantes : utilité lecteur, intention de recherche claire, offre en aval, faisabilité des sources.
3. Proposer à Max un lot de 5 à 10 idées, chacune en une ligne (titre de travail, public, pourquoi maintenant).
4. Après accord explicite seulement : préparer `_bmad-output/editorial/AAAA-MM-JJ-idees-validees.json` (`[{"Id": …, "Status": "valide"}]`), simuler puis écrire avec `node scripts/growth/nocodb.mjs update idees-articles --file … --apply`.

## Règles
- Aucune suppression de ligne. Une idée écartée peut rester en `nouveau` ou passer en `rejete` si Max le veut.
