# Renouvellement, rétention et réactivation du Club

**Réussite :** un plan qui rend la valeur du Club visible toute l'année et un parcours de renouvellement honnête, sur consentement, qui ne tombe jamais sur une porte fermée.

## Matière à charger
- `src/lib/club/pricing.ts` (19 900 F/an, parrainage −15 %), `worker/apps/api/src/lib/renewal.ts` (J-15), `worker/apps/api/src/lib/bictorys-billing.ts` et `club-autorenew.ts` (lien J-7), CGV `src/i18n/locales/fr/legal.json` (art. 6 : pas de remboursement au prorata).
- Persona du membre inactif (`02-personas-et-marches.md` : membre qui ne voit plus la valeur après 2 mois).

## Démarche
1. **Cartographier** le cycle du membre : adhésion → activation (J+7) → habitude (M+1) → risque d'inactivité (M+2) → avant-échéance (J-30) → J-15 (information) → J-7 (lien de paiement, si consentement) → échéance → après échéance.
2. **Signaux d'inactivité** mesurables (sessions manquées, aucune question Rysmo, aucune connexion) — à faire vérifier par `mm-agent-yann`.
3. **Réactivation à M+2** : message qui montre ce qui s'est passé (sessions, replays à venir, opportunités) et propose une action de 5 minutes.
4. **Bilan d'année** avant J-15 : ce que le membre a reçu, concrètement.
5. **Parrainage** : quand le proposer (après un moment de valeur), mécanique −15 % pour le filleul, message type.
6. **Après échéance** : relance unique, porte ouverte, sans culpabiliser.

## Règles
- ⛔ Aucun prélèvement automatique, aucune pression type compte à rebours, aucun remboursement promis.
- La page publique et les CGV divergent sur le renouvellement (J-15 vs lien J-7) : le signaler à Max plutôt que choisir.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-retention-club.md` (cycle, messages, indicateurs : taux d'activation, de renouvellement, de parrainage).
