# Calendrier éditorial

**Réussite :** un calendrier de 12 semaines réaliste (capacité de relecture de Max), où chaque article a un public, un pôle, un mot-clé, une offre en aval et un responsable.

## Matière
- Ligne éditoriale (`_bmad-output/editorial/ligne-editoriale.md` si elle existe), plan marketing courant (`_bmad-output/growth/*plan-360*`), temps forts proposés par Awa.
- ⚠️ `docs/calendrier_editorial_12_semaines.csv` s'arrête le 01/11/2026 et ne contient **aucun article de blog** : ne pas s'en servir comme base.
- Banque d'idées NocoDB : `node scripts/growth/nocodb.mjs list idees-articles --where "(Status,eq,valide)"`.

## Démarche
1. Fixer la cadence avec Max (par défaut : 1 article toutes les deux semaines tant que la chaîne n'a pas fait ses preuves). Ne jamais l'annoncer publiquement.
2. Commencer par le travail de réparation planifié (`remise-a-niveau`), qui compte dans la capacité.
3. Pour chaque créneau : sujet, angle, public, pôle, mot-clé (à confirmer par Rokia), offre en aval, date de remise à Béatrice, date de dépôt.
4. Vérifier l'équilibre : publics, pôles, et au moins un article par trimestre qui sert chaque offre vendable.
5. Affecter : Thierry (sources), Rokia (brief), Cheikh (rédaction), Béatrice (relecture), Omar (dépôt et diffusion).

## Livrable
`_bmad-output/editorial/AAAA-MM-calendrier.md` (tableau semaine par semaine).
