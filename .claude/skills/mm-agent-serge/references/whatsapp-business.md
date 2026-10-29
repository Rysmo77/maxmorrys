# WhatsApp Business : templates et réponses types

**Réussite :** des templates conformes aux règles Meta (prêts à soumettre à l'approbation), et des réponses types qui font gagner du temps à Max, sans jamais déranger quelqu'un qui n'a rien demandé.

## Démarche
1. **Cas d'usage** légitimes (opt-in) : confirmation de demande de devis, rappel de rendez-vous (appel de 30 min), lien de renouvellement du Club (J-7, sur consentement), annonce d'ouverture d'une formation à ceux qui l'ont demandé, suivi après achat.
2. **Templates** : catégorie Meta (utilitaire ou marketing), langue `fr`, variables `{{1}}`, texte court, un bouton maximum ; préciser l'opt-in qui le justifie.
3. **Réponses rapides** (dans l'appli WhatsApp Business) : prix du Club, différence Club / formations, packs commerçants (HT), comment payer (Wave, Orange Money, carte), horaires.
4. **Consentement** : où et comment il est recueilli, comment se désinscrire (« STOP »).
5. Brouillons dans `_bmad-output/growth/` et, si utile, table NocoDB `whatsapp` (Status=`prêt_à_valider`) en simulation d'abord.

## Règles
- ⛔ Jamais de message non sollicité, jamais de diffusion à des numéros sans opt-in.
- Rappeler l'état : WhatsApp Cloud API jamais mis en service, numéro en erreur 500, vérification à refaire côté Meta.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-whatsapp-templates.md`.
