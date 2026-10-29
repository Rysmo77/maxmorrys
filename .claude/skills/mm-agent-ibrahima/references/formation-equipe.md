# Formation d'équipe (B2B, sur devis)

**Réussite :** une proposition de formation d'équipe crédible, adaptée au besoin du client, avec une trame de devis que Max chiffre et valide.

## Matière à charger
- `src/i18n/locales/fr/formations.json` (carte « Former toute ton équipe ? »), `src/components/edu/g2/TeamQuoteCard.tsx` (lead `agency_leads` de type `training`) ; ⚠️ la copie « Max-Morrys Business » est orpheline : ne pas s'en servir comme offre en ligne.
- ⛔ Aucune formation n'est publiée : on vend un programme construit sur mesure, pas un catalogue.

## Démarche
1. **Besoin** : public (commerciaux, communication, dirigeants), niveau, objectifs mesurables, contraintes (présentiel, distanciel, data, horaires).
2. **Programme** : modules, durée, format, exercices appliqués à l'entreprise, livrables, certificat (gratuit, vérifiable sur `edu.maxmorrys.me/verifier` si le parcours se fait sur la plateforme).
3. **Proposition** : structure de prix à faire chiffrer par Max (enseignement exonéré de TVA — à revérifier dans `src/lib/tax/senegal.ts`), conditions, calendrier.
4. **Message** d'accompagnement (au tutoiement côté formations, sauf demande corporate explicite à traiter avec Max).

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-formation-equipe-<client>.md` (programme + trame de devis).
