# Modèle de revenus et contrevaleur

**Réussite :** un modèle lisible (scénarios bas / base / haut) et une contrevaleur à jour.

## Démarche
1. Partir de `finance/hypotheses.csv` ; distinguer hypothèses et données réelles (ventes, adhésions, devis signés, à demander à Max).
2. Revenus par offre (formations, Club, Rysmo, packs, accompagnements), coûts variables (TVA, Bictorys ≈ 3 %, Gemini, Cloudflare), sensibilités.
3. Contrevaleur : vérifier `FX_AS_OF` dans `src/lib/currency/convert.ts` (périmé après 180 jours, ≈ 02/03/2027) ; proposer la mise à jour conjointe `EUR_USD` + `FX_AS_OF` avec la source du taux — Max valide avant toute modification.

## Livrable
`_bmad-output/pricing/modele-revenus-AAAA-MM.md`.
