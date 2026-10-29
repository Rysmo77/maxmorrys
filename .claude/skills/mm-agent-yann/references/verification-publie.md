# Vérifier « publié dans NocoDB » = « visible en ligne »

**Réussite :** une liste fiable de ce qui est réellement en ligne, et l'explication des écarts — base indispensable à toute analyse de contenu.

## Contexte
L'audit du 29/10/2026 a trouvé 79 lignes `publié` dans NocoDB, mais seulement 8 médias Instagram visibles, et des identifiants de posts introuvables chez Meta. Hypothèses : posts supprimés, ou `WF-SOCIAL-05` qui enregistre l'identifiant du conteneur quand la publication n'a pas abouti.

## Démarche
1. Extraire les lignes `publié` avec leurs identifiants et liens (`Blotato_PostSubmissionID`, `Blotato_PublicUrl`) via `scripts/growth/nocodb.mjs`.
2. Vérifier en ligne : par l'API Graph en lecture si Max fournit l'accès, sinon par un échantillon que Max vérifie dans Meta Business Suite (historique d'activité).
3. Classer : en ligne, supprimé, jamais publié, inconnu.
4. Conclure sur la cause probable et recommander le correctif de `WF-SOCIAL-05` (ne passer en `publié` que si la publication renvoie un identifiant, et stocker le permalien).

## Règles
- Lecture seule ; aucune correction de statut sans accord de Max.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-verification-publie.md`.
