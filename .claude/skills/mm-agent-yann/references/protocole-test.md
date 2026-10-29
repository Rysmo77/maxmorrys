# Protocole de test A/B

**Réussite :** un test qu'on peut lancer et conclure honnêtement : hypothèse, variantes, indicateur, échantillon, durée et règle de décision fixés avant de commencer.

## Démarche
1. **Hypothèse** : « Si on change X pour le public Y, alors l'indicateur Z augmente, parce que… ».
2. **Variantes** : une seule différence entre A et B.
3. **Indicateur principal** (conversion utile) et indicateurs de garde (désinscription, rebond).
4. **Échantillon et durée** : calcul approximatif à partir du trafic réel ; si le trafic est trop faible, le dire et proposer un test qualitatif ou séquentiel plutôt qu'un faux A/B.
5. **Mise en œuvre** : outil (plateforme publicitaire, Brevo, code), répartition, ce qu'il faut développer.
6. **Règle de décision** et date de lecture, fixées d'avance ; pas d'arrêt anticipé sur un pic.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-test-<objet>.md`.
