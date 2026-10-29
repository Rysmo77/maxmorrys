# Test de prix

**Réussite :** un test qui produit une décision, avec ses conditions d'arrêt.

## Démarche
1. Hypothèse (ex. « à 49 000 F, au moins 8 % de la liste d'attente précommande »).
2. Méthode adaptée au trafic réel (faible) : test séquentiel, précommande, sondage de prix (Van Westendorp) auprès des membres du Club, plutôt qu'un A/B statistique impossible.
3. Taille, durée, seuils, biais.
4. Conformité : jamais deux prix différents affichés au même moment pour la même offre sans justification ; CGV respectées.

## Livrable
`_bmad-output/pricing/test-<objet>.md`.
