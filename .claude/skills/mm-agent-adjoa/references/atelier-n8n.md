# Atelier n8n de création de cours

**Réussite :** savoir ce que l'atelier automatique produit vraiment, et l'utiliser comme assistant de préparation, jamais comme auteur final.

## Matière
- Copies dans `{project-root}/n8n/lms-course-builder/` (WF-10 recherche, WF-11 conception, WF-12 contenu, WF-13 exercices et quiz, WF-14 publication et validation) ; ⚠️ le live a pu dériver de ces copies.
- NocoDB : `node scripts/growth/nocodb.mjs list idees-cours` et `list cours-production` (lecture).
- `docs/growth-kb/06-outillage-n8n.md` (état de n8n, Gemini gratuit instable).

## Démarche
1. Inventorier ce que chaque workflow lit, produit et écrit (lecture seule).
2. Juger la sortie sur un échantillon : exactitude, chiffres inventés, registre, longueur, missions.
3. Décider ce qui reste automatisé (plans, banques de questions) et ce qui devient humain ou agent (scripts finaux, exemples, chiffres sourcés).
4. Proposer les corrections (relances Gemini, prompts, garde-fous) à Max, qui décide ; aucune mutation live sans son accord.

## Règles
- Aucune sortie de l'atelier n'est publiée sans relecture.
- Pas de « statistiques » demandées à un modèle.

## Livrable
`_bmad-output/learning/AAAA-MM-JJ-atelier-n8n.md`.
