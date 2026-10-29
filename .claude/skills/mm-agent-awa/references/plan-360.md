# Plan marketing 360 (trimestre)

**Réussite :** Max repart avec un plan d'une page de décisions + annexes, qu'il peut tenir seul avec les agents, et dont chaque ligne a un indicateur, une échéance et un propriétaire (humain ou agent).

## Matière à charger
- `{project-root}/docs/growth-kb/01-plateforme-et-offres.md`, `02-personas-et-marches.md`, `04-taxonomie-reseaux-qa.md`, `09-trous-et-decisions-ouvertes.md`.
- L'état réel : `node scripts/growth/nocodb.mjs stats contenus Status`, le dernier rapport dans `docs/growth-kb/audits/`, le dernier plan dans `_bmad-output/growth/` s'il existe.
- Si des chiffres GA4 / GSC / ventes sont disponibles, les demander à Max ou à Yann plutôt que de les supposer.

## Démarche
1. **Diagnostic en 5 lignes** : ce qui marche, ce qui est cassé, ce qui manque (ex. : aucune formation publiée, social à l'arrêt depuis août, Brevo jamais branché).
2. **Ambition et objectifs** : 1 objectif business (ex. adhésions Club, devis commerces) et 3 objectifs intermédiaires mesurables. Étiqueter chaque cible chiffrée « hypothèse » tant qu'il n'existe pas de base historique.
3. **Offres prioritaires** : classer les offres vendables (Club, Rysmo, packs commerces, sur mesure) par potentiel × effort × preuve disponible. Au plus deux offres « poussées » par trimestre, les autres en entretien.
4. **Publics et messages** : pour chaque offre poussée, le public (Apprenants / Commerçants / B2B / diaspora), la douleur, la promesse vérifiable, la preuve, le CTA unique, le registre (tu ou vous selon la piste).
5. **Mix canaux** : canal principal + canal d'appui par public ; justifier chaque canal coupé. Tenir compte de l'état réel des canaux (`06-outillage-n8n.md`) et du temps de validation de Max.
6. **Temps forts** : rentrée, fêtes de fin d'année, Ramadan / Korité, Tabaski, Magal, rentrée scolaire, soldes. Les présenter comme **propositions** à valider (aucune règle n'existe encore dans la marque).
7. **Plan d'action** : tableau semaine par semaine (12 semaines) — action, propriétaire (agent `mm-agent-*` ou Max), livrable, indicateur.
8. **Budget** en FCFA (outils, pub, production) avec un scénario bas et un scénario cible ; rien n'est engagé sans accord.
9. **Risques et décisions humaines** : lister ce que Max doit trancher (ex. jeu de personas officiel, kit visuel social, sort de Brevo/WhatsApp).

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-plan-360-T<n>.md` : page 1 = décisions ; puis objectifs, offres, messages, canaux, calendrier, budget, KPI, risques, décisions attendues. Proposer ensuite de briefer l'équipe (menu **BR**).
