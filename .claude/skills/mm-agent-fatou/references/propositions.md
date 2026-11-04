# Proposer les idées à Max

## 1. Rapport

`_bmad-output/growth/idees/<aujourd'hui>-idees-<Période>.md` : tableau classé (rang · titre · angle · série/rubrique · cible · réseau · format · gabarit · score · sources), puis les gisements lus (vides compris), les doublons écartés et pourquoi, le contrôle de diversité.

## 2. Dépôt dans NocoDB (`Idees_Posts`)

Un fichier JSON (tableau) puis :
```
node scripts/growth/nocodb.mjs create idees-posts --file _bmad-output/growth/idees/<…>.json            # simulation, relire
node scripts/growth/nocodb.mjs create idees-posts --file _bmad-output/growth/idees/<…>.json --apply
```
Chaque ligne : `Titre`, `Angle`, `Statut: "proposé"`, `Horizon: "semaine"` (ou `"mois"`), `Periode` (`S48`, ou `2026-12` pour un axe du mois), `Serie`, `Rubrique`, `Pilier`, `Cible`, `Reseau`, `Format`, `Gabarit_Suggere`, `Score`, `Detail_Score`, `Sources`, `Agent: "Fatou"`. Le retour de `--apply` donne les `Id`.
⛔ Jamais `Statut: "retenu"` : l'outil le refuse, c'est le bouton de Max qui retient.

## 3. Cartes Telegram (si les cartes de décision sont en service)

1. **Carte récapitulative d'abord** (une seule) :
```
node /opt/mm-agents/bin/mm-decision.mjs ask --agent Fatou --question "💡 10 idées pour S48 (23-29/11) — choisis sous chaque carte" --options "ok:👀 Je regarde,plus_tard:⏳ Plus tard" --contexte "Top 3 : … · … · … — 8 éducatives, 1 coulisses, 1 offre · Commerçants 5 / Apprenants 4 / Mixte 1" --objet idees:S48
```
2. **Puis une carte par idée**, dans l'ordre du classement :
```
node /opt/mm-agents/bin/mm-decision.mjs ask --agent Fatou --question "<n>/<N> · <Titre>" --options "retenir:✅ Retenir,plus_tard:⏳ Plus tard,ecarter:❌ Non" --contexte "<Angle> · <Serie> · <Cible> · <Reseau> <Format> · <score>/10 · source : <la plus forte, courte>" --objet idee:<Id>
```
   Le retour donne l'`Id` de la décision → `node /opt/mm-agents/bin/mm-idees.mjs lier <IdeeId> <DecisionId>`.
   Sur le Mac : `node scripts/growth/decision.mjs ask …` et `node ops/agents-autonomes/outils/mm-idees.mjs lier …`.
3. Cartes de décision indisponibles (outil en code 3, table `Decisions` absente) : le dire dans le message final ; les idées restent `proposé`, Max peut les trancher directement dans NocoDB.

Contexte court (≤ 300 caractères), sans emoji en série, sans donnée personnelle.

## 4. Avant de proposer : relire les réponses précédentes

`mm-idees.mjs sync` au début de chaque passe : les clics de Max passent dans `Statut`. Une idée `plus_tard` se repropose au plus une fois, plus tard, si elle reste pertinente (marquée « déjà vue le … »). Une idée `écarté` ne revient jamais sous la même forme. Lire aussi les motifs de refus (`mm-decision.mjs liste --motifs --depuis 28`).

## 5. Message final (Telegram, 4 lignes au plus)

1. `💡 Idées <Période> : N proposées (k éducatives, o offre) — cartes envoyées`
2. `Top 3 : … (8,7) · … (8,4) · … (8,1)`
3. `Retenues la semaine passée : r sur n · reprises dans le lot : u`
4. `Choisis lundi ou mardi : le lot du mercredi part de ce que tu retiens. Détail : _bmad-output/growth/idees/…`
