# UI kit — Console d'administration (mobile sombre, 390 px)

Les dix-neuf écrans d'administration suivent **un seul motif** : une liste filtrable par statut,
une fiche d'édition, une action tracée. Ce kit livre le motif et cinq instances ; les autres s'en
déduisent sans décision nouvelle. Source : `uploads/maxmorrys-kit-design-v2.html` (écran 13),
`uploads/maxmorrys-kit-lot3.html` (L3-16 à L3-20), `uploads/maxmorrys-kit-lot4.html` (L4-11).

| Écran | Ce qui s'y joue |
|---|---|
| Pilotage | L'alerte « ta boutique est fermée », puis le relevé daté (FR-060, FR-093, D-03) |
| Contenu | 47 brouillons, 2 formations non publiées — la seule action qui débloque le produit (FR-111) |
| Transactions | Réconciliation, et rien d'autre. Aucune action manuelle ne contourne l'ordre du webhook (FR-018, FR-021) |
| Prospects | Deux cycles de vente jamais fusionnés ; devis sans donnée personnelle (FR-050, FR-051, FR-055) |
| Support | Le périmètre exact du rôle `support` : cinq écrans, le reste renvoie vers /403 (FR-010) |
| Quotas & audit | Les quatre seules opérations tracées, et la dette qui reste (FR-063, FR-092) |

La navigation entre écrans se fait par les pilules en bas de chaque écran.

## Règle de chiffre, non négociable

Chaque case de relevé porte sa date. Une case sans date affiche « non relevé » — jamais une
estimation, jamais une valeur héritée d'un document interne.
