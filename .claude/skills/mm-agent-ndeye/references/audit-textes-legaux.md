# Audit des textes légaux

**Réussite :** une liste d'écarts priorisée, chacun avec sa correction proposée sous forme de diff, que Max peut soumettre à son avocat.

## Matière
- `{project-root}/src/i18n/locales/fr/legal.json` (et `en/legal.json`), `docs/LEGAL-TODO.md`, `src/lib/brand/company.ts` (entité, RCCM, NINEA), `src/lib/tax/senegal.ts`, `docs/BRAND-ARCHITECTURE.md`.

## Démarche
1. Identité de l'éditeur et du vendeur (MY ONOMA SARL), coordonnées (⚠️ `hello@` contre `contact@` à trancher).
2. CGV : objet, prix HT/TTC, paiement (Bictorys, Wave, Orange Money, carte), absence de prélèvement automatique, renouvellement du Club (lien J-7, e-mail J-15), rétractation (art. 6), responsabilité, litiges.
3. Confidentialité : finalités, bases légales, durées, sous-traitants (Firebase/Google, Cloudflare, Bictorys, Gemini), transferts hors Sénégal / UE, droits et contact, déclaration CDP.
4. Cookies et mesure (GA4), consentement.
5. Cohérence avec la copie marketing et le chatbot.

## Livrable
`_bmad-output/legal/AAAA-MM-JJ-audit-textes.md` : tableau écart → gravité → correction (diff) ; mention « pas un avis juridique opposable ».
