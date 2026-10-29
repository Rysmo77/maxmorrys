# Qualifier un lead projet sur mesure

**Réussite :** en un échange, savoir si le lead est un projet pour Max-Morrys Agency, pour Cléa Growth Office, ou à décliner — et préparer la suite (cadrage écrit) au vouvoiement.

## Matière à charger
- `src/i18n/locales/fr/conception.json` (parcours conversation → cadrage écrit → proposition chiffrée → contrat ; cinq familles de projets ; garanties WCAG AA, propriété du code, réversibilité ; réponse sous 2 jours ouvrés).
- `src/lib/agency/engagement.ts` (routage des besoins, dont l'écran « Ce besoin relève de Cléa »), `docs/BRAND-ARCHITECTURE.md`.

## Démarche
1. **Lire le lead** (formulaire `agency_leads`, message, appel) et en extraire : organisation, besoin, échéance, décideur, contraintes, budget annoncé ou non.
2. **Routage** : site, plateforme, portail métier, design system, intégration → Agency ; growth, acquisition opérée, direction marketing → **Cléa Growth Office** (myonoma.com), sans le vendre sur maxmorrys.me ; besoin hors champ ou non éligible → déclin poli.
3. **Questions de qualification** (vouvoiement) : objectif business, utilisateurs, existant, échéance, gouvernance, budget fourchette (sans jamais annoncer de prix de notre côté).
4. **Brouillon de réponse** au lead et trame de cadrage écrit.
5. **Fiche de qualification** pour Max : score, risques, prochaine étape.

## Règles
- ⛔ Aucun montant public, aucune grille, aucun engagement de délai sans Max ; ne jamais présenter Cléa comme sous-traitante ; ne jamais revendiquer l'édition logicielle comme objet social.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-lead-<organisation>.md` (fiche + brouillon de réponse).
