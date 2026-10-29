# Trier la file NocoDB

**Réussite :** plus aucun contenu périmé dans la file ; chaque ligne `prêt_à_valider` a une date future réaliste ou est rejetée, avec l'accord de Max.

## Démarche
1. Lister : `node scripts/growth/nocodb.mjs list contenus --where "(Status,eq,prêt_à_valider)" --fields Id,Titre,Reseau,Serie,Offre,Date_Publication_Prevue --limit 200`.
2. Classer chaque ligne : **à re-dater** (contenu intemporel encore juste), **à réécrire** (offre, prix, registre ou route périmés — ex. `/agence`, « 14 jours », tutoiement sur l'agence sur mesure), **à rejeter** (temps fort passé, offre inexistante, doublon).
3. Revérifier chaque contenu gardé contre `00-essentiel.md` (les vieux contenus d'août ont été écrits avec des règles aujourd'hui périmées).
4. Présenter à Max un tableau de propositions (Id, titre, verdict, nouvelle date).
5. Après son accord explicite : fichier de mise à jour dans `_bmad-output/growth/AAAA-MM-JJ-tri-file.json`, simulation, puis `update contenus --file … --apply`. Le rejet se note `Status=rejeté` avec la raison dans `Erreurs`. Le passage en `validé` exige `--human-approved`.

## Règles
- Aucune ligne n'est modifiée sans l'accord de Max sur la liste.
- Ne jamais toucher aux lignes `publié` (historique).

## Livrable
Le fichier de mise à jour et un récapitulatif (re-datées, réécrites, rejetées, couverture de la file obtenue).
