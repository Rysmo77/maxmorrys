# Analyse de performance des contenus

**Réussite :** savoir quelles séries, offres, cibles et réseaux produisent de l'engagement utile et des conversions — et quoi changer dans la grille.

## Démarche
1. **Vérifier la base** d'abord : les contenus `publié` sont-ils en ligne (menu **VP**) ? Sans cela, l'analyse porte sur du vide.
2. Extraire les contenus publiés : `node scripts/growth/nocodb.mjs list contenus --where "(Status,eq,publié)" --fields Id,Reseau,Serie,Pilier,Offre,Cible,Format_Post,Date_Publication_Prevue --limit 500`.
3. Croiser avec les statistiques natives des plateformes (fournies par Max) et les UTM dans GA4.
4. Analyser par série, offre, cible, réseau, format, créneau ; utiliser des métriques de qualité (enregistrements, partages, commentaires, clics) plutôt que les seules impressions.
5. Tenir compte des petits effectifs : ne pas conclure sur 3 posts ; donner un niveau de confiance.
6. Recommandations pour la grille (`mm-agent-mariam`) et les sujets éditoriaux (`mm-agent-aminata`).

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-analyse-contenus.md`.
