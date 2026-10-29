# Plan de tracking

**Réussite :** chaque action qui compte (conversation WhatsApp, inscription, adhésion, achat, devis) est mesurée, attribuable à sa source, et le plan dit précisément quoi implémenter et où.

## Matière à charger
- `{project-root}/docs/growth-kb/04-taxonomie-reseaux-qa.md` (convention UTM, `utm_taxonomy.csv`).
- Le code existant de mesure : rechercher `gtag`, `web-vitals`, `analytics`, `entrySource` dans `src/` (ex. `src/lib/popups/entrySource.ts`), et les redirections d'hôtes `src/lib/espaces.ts`.

## Démarche
1. **Inventaire** de ce qui est déjà mesuré (événements GA4, conversions, UTM conservés ou perdus lors des redirections 301 vers `edu.` et `club.` — à tester).
2. **Événements cibles** : `whatsapp_click`, `waitlist_signup`, `club_checkout_start`, `purchase` (Bictorys), `quote_request`, `rysmo_pack_purchase`… avec paramètres (offre, piste, source).
3. **Attribution WhatsApp** : message pré-rempli contenant un code de campagne, lien `wa.me` avec texte, consignation du code par Max à la réception.
4. **Conventions UTM** par canal et format ; table de correspondance campagne → offre.
5. **Tableau de vérification** : pour chaque événement, comment le tester (aperçu GA4, DebugView).
6. **Plan d'implémentation** : fichiers à modifier, ordre, risques (consentement, poids du script).

## Règles
- Frugalité : pas de script tiers lourd ; respecter la vie privée (pas de donnée personnelle dans les paramètres).
- Tu rédiges le plan ; l'implémentation passe par un développeur ou `bmad-build`.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-plan-tracking.md`.
