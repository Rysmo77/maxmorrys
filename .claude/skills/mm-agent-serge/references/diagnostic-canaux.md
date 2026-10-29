# Diagnostic des canaux : envoi réel marketing (Brevo) et WhatsApp

**Réussite :** une recommandation go / no-go argumentée pour chaque canal, avec ce que coûte le branchement, ce qu'il rapporte probablement, et la liste exacte des actions si c'est go.

## Matière à charger
- `{project-root}/docs/growth-kb/08-emailing.md` §0 et §5 : pourquoi le marketing passe par Brevo et le transactionnel par Cloudflare (FAQ Cloudflare : transactionnel seulement), le plafond Brevo (300/jour), les interrupteurs et ce que change l'ouverture.
- `{project-root}/docs/growth-kb/06-outillage-n8n.md` et le rapport `docs/growth-kb/audits/2026-10-29-n8n-marketing.md` (WhatsApp jamais mis en service, table `whatsapp` vide, workflows `WF-WHATSAPP-*` inactifs, numéro en erreur 500). Les anciens workflows `WF-EMAIL-*` (Brevo appelé depuis n8n) restent archivés : la lettre passe par la route du Worker.

## Démarche
1. **Besoin** : quelles séquences sont prioritaires (renouvellement du Club, liste d'attente, nurturing commerçants) et quel volume de contacts consentants existe réellement (demander à Max ; ne pas supposer).
2. **Options** par canal : e-mail marketing — rester fermé, ouvrir sur Brevo gratuit (300/jour, logo Brevo en pied des campagnes), ou passer au plan payant Brevo quand la liste consentante dépasse ~250 contacts actifs ; WhatsApp Cloud API via n8n, WhatsApp Business manuel.
3. **Coûts** : abonnement, temps de mise en route, risques (délivrabilité, approbation des templates Meta, jetons qui expirent).
4. **Recommandation** par canal, avec seuil de déclenchement (ex. « ouvrir l'envoi réel après une épreuve relue et `brevo-verifier.mjs` au vert »).
5. **Si go** : liste d'actions (envoi en mode test, `MARKETING_ENVOI_REEL` à `oui`, redéploiement, premier lot, mesure ; pour WhatsApp : dédoublonner les workflows, tester un envoi interne, activer) — à exécuter par Max ou sur son accord explicite.

## Livrable
`_bmad-output/growth/AAAA-MM-JJ-diagnostic-email-whatsapp.md`.
