# Tableau de bord KPI

**Réussite :** un tableau de bord d'une page, mis à jour à date, où chaque indicateur a une source, une définition et une tendance — et où ce qui n'est pas mesuré est dit.

## Sources (et leurs pièges)
- **NocoDB** `contenus` (production et statuts) via `node scripts/growth/nocodb.mjs stats contenus Status` ; ⚠️ `publié` ≠ en ligne.
- **Search Console** : table NocoDB `seo` ⚠️ figée au 06/08 ; `scripts/gsc-pull.py` écrit encore dans Airtable depuis le Mac ; à défaut, export demandé à Max.
- **GA4** : export ou accès fourni par Max.
- **Ventes et adhésions** : admin du site, Firestore (lecture via Max ou un script existant) ; leads `agency_leads`.
- **Plateformes sociales** : statistiques natives fournies par Max.

## Démarche
1. Définir l'arbre d'indicateurs : objectif business (adhésions Club, devis, achats Rysmo, inscrits liste d'attente) → indicateurs de tunnel (sessions qualifiées, conversations WhatsApp, taux de conversion) → indicateurs d'activité (posts publiés en ligne, articles, e-mails).
2. Pour chaque indicateur : définition, source, fréquence, valeur actuelle, tendance, niveau de confiance.
3. Signaler les trous de mesure et proposer de les combler (plan de tracking avec `mm-agent-koffi`).
4. Trois constats et trois questions pour Awa.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-kpi.md` (tableau + notes de méthode).
