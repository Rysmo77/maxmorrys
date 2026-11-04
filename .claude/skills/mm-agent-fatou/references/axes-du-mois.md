# Axes et temps forts du mois suivant

Le 25 de chaque mois (et à la demande) : **4 à 6 axes** pour le mois suivant, proposés à Max, qui guident les idées de chaque semaine.

## 1. Ce qu'est un axe

Un **fil rouge** de 1 à 3 semaines, d'abord éducatif : « Décembre, le mois où ton commerce se fait trouver sur Google Maps », « Fin d'année : vendre sur WhatsApp sans harceler tes contacts ». Il dit : problème · public · ce qu'on apprendra · 3 idées de posts d'exemple · semaine(s) conseillée(s) · un temps fort éventuel. Au plus **un** axe porte une offre (et il apprend d'abord).

## 2. Temps forts à vérifier (proposer, jamais acter)

Chaque date se **vérifie** (recherche web, source officielle, année en cours) avant d'être écrite ; les fêtes religieuses dépendent de la lune : écrire « autour du … (date à confirmer) ».

| Période | Temps forts possibles | Pays |
|---|---|---|
| Toute l'année | paie de fin de mois, rentrée, vacances scolaires, soldes, Black Friday (⛔ aucune remise : décision du 29/10/2026) | tous |
| Calendrier musulman (dates mobiles) | Ramadan, Korité, Tabaski, Tamkharit, Maouloud | Sénégal, diaspora ; Côte d'Ivoire et Bénin en partie |
| Sénégal | Magal de Touba (date mobile), fête nationale 4 avril | SN |
| Côte d'Ivoire | fête nationale 7 août | CI |
| Bénin | fête nationale 1er août, fête des religions endogènes 10 janvier | BJ |
| Fin d'année | Noël, Saint-Sylvestre, bilans et bonnes résolutions | tous |

⚠️ `00-essentiel.md` : aucune règle de marque n'est encore écrite pour Ramadan, Korité, Tabaski, Magal. Un temps fort se **propose** à Max (« veux-tu un axe Tabaski ? »), il ne s'impose pas.

## 3. Proposition

- Rapport : `_bmad-output/growth/idees/<aujourd'hui>-axes-<AAAA-MM>.md` (axes, temps forts sourcés, ce qui a marché le mois écoulé d'après `mm-meta-verif`, ce que Max a refusé).
- NocoDB : une ligne par axe dans `Idees_Posts` avec `Horizon: "mois"`, `Periode: "AAAA-MM"`, `Format` = celui de l'idée d'exemple la plus forte.
- Telegram : une carte récapitulative, puis une carte par axe : `--question "Axe <n>/<N> · <titre>" --options "retenir:✅ Retenir,plus_tard:⏳ Plus tard,ecarter:❌ Non" --objet idee:<Id>`.
- Les axes retenus orientent la chasse hebdomadaire du mois : au moins la moitié des idées d'une semaine s'y rattachent.

## 4. Message final (4 lignes au plus)

1. `🗓 Axes <mois> : N proposés — cartes envoyées`
2. `Temps forts : … (date, source) · …`
3. `Le mois écoulé : idées retenues r/n · posts qui ont le mieux marché : …`
4. `Détail : _bmad-output/growth/idees/…`
