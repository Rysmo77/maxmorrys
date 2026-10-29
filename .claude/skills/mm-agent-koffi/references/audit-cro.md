# Audit CRO d'une page d'atterrissage

**Réussite :** une liste priorisée de changements sur une page, chacun avec son impact attendu, son effort et la règle de la marque qu'il respecte — prête à devenir un ticket de dev.

## Matière à charger
- Le composant de la page (`src/pages/…`), son catalogue `src/i18n/locales/fr/*.json` (et `en/`), le miroir SEO du Worker si la page est indexée (`worker/apps/site/src/prerender/static-pages.ts`).
- Les données disponibles (GA4, taux de rebond, conversions) via Max ou `mm-agent-yann`.

## Démarche
1. **Parcours** : d'où vient le visiteur (publicité, social, recherche, WhatsApp), que cherche-t-il, quelle action unique attend-on.
2. **Au-dessus de la ligne de flottaison sur un mobile de 360 px** : promesse claire en 3 secondes, preuve, CTA visible.
3. **Friction** : nombre de champs, création de compte forcée, poids de la page (images, vidéo), temps de chargement en 3G, moyens de paiement visibles (Wave, Orange Money, carte — les trois).
4. **Confiance** : qui parle (Max-Morrys, 1re personne), mentions HT/TTC justes, absence de promesse invérifiable, contact WhatsApp.
5. **Objections** traitées sur la page (prix, data, temps, capacité) sans garantie ni remboursement.
6. **Priorisation** ICE (impact, confiance, facilité) ; proposer un test A/B pour les changements incertains (protocole avec `mm-agent-yann`).

## Règles
- Respecter les contraintes du repo : crochets porteurs des titres, registre testé par `tests/unit/voix-tutoiement.test.ts`, aucune date en dur dans l'i18n (`npm run proof:check`), aucune note ni nombre d'inscrits.
- Tu proposes ; un changement de code passe par `bmad-build` ou un développeur.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-audit-cro-<page>.md` : constats, recommandations priorisées, maquettes texte, tests proposés.
