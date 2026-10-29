# Recherche de mots-clés à intention locale

**Réussite :** une liste courte de requêtes réellement tapées par nos publics, classées par intention et par opportunité, chacune rattachée à un pôle et à une offre.

## Matière
- Search Console : export fourni par Max (⚠️ `scripts/gsc-pull.py` écrit encore dans Airtable ; la table NocoDB `seo` est figée au 06/08). Requêtes déjà vues : « booster tiktok afrique », « publicité facebook ads sénégal » (position 5), « blog marketing digital dakar ».
- Banque d'idées NocoDB (`Mot_Cle`, `Intent`, `Volume_Estime` — estimations Gemini, à ne pas croire sur parole).
- Recherche web (skills `firecrawl-search` / `firecrawl-scrape`, ou WebSearch) : suggestions, « Autres questions », pages classées.

## Démarche
1. Partir des problèmes des publics (`02-personas-et-marches.md`), pas des outils.
2. Générer les formulations réelles : mots locaux, villes (Dakar, Abidjan, Cotonou), monnaie (FCFA), moyens de paiement, formulations mobiles et vocales.
3. Pour chaque requête : intention, type de page qui se classe, qualité des concurrents, faisabilité pour nous, offre en aval.
4. Signaler explicitement quand un volume est inconnu ; classer par opportunité qualitative plutôt que par chiffre inventé.

## Livrable
`_bmad-output/editorial/mots-cles/AAAA-MM-JJ-<theme>.md` (tableau requête, intention, pôle, offre, concurrence, priorité).
