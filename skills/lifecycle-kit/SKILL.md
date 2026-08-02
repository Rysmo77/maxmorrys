---
name: lifecycle-kit
description: >
  CRM & Lifecycle Kit Max-Morrys — référence partagée Email + WhatsApp + Customer Success.
  Infra réelle, données abonnés Firestore, RGPD/opt-in, Brevo, Meta WhatsApp Cloud API,
  règles 24h/templates. À consulter avant toute action lifecycle.
---

## Données & infra réelles
- **Abonnés newsletter** : collection Firestore `newsletter` (`{id,email,subscribedAt,source}`),
  type `NewsletterSubscriber` (`src/types/index.ts`). Form : `src/components/shared/NewsletterForm.tsx`
  (source: footer/home/page). Stat : `getNewsletterCount()` (`src/lib/firestore/admin.ts`).
- **Consentement** : `UserPreferences.newsletter` (boolean). **Pas de double opt-in** (à améliorer).
- **Digest IA** : `functions/src/digest.ts` (Gemini, actuellement notification IN-APP, pas email).
- **WhatsApp** : numéro Business `+221 77 604 19 85` ; chaîne officielle
  `https://whatsapp.com/channel/0029Vb2mX9zDjiOe1qo3IR1H` ; champ `User.whatsapp` (profil, ≠ marketing).
- **Manque** : envoi email (→ **Brevo**), API WhatsApp (→ **Meta Cloud API**), champ
  `whatsapp_marketing_consent`, transactionnel email.

## Email (Brevo)
- Envoi via **Brevo** (n8n `WF-EMAIL` : lit abonnés/segments → campagne Brevo brandée). Secret `BREVO_API_KEY`.
- Types : bienvenue, newsletter, nurture cours, upsell Rysmo (Club), ré-engagement, panier abandonné.
- **Règles** : opt-in respecté, **unsubscribe** dans chaque email (natif Brevo), 1 CTA principal,
  objet <50c, préheader, voix Max-Morrys (brand kit), mobile-first, FR (EN si préf).
- Segments possibles : `preferences.language`, `role` (student/admin), statut Club, formations suivies, activité.

## WhatsApp (Meta Cloud API)
- **Business** (Cloud API) : broadcasts vers **opt-in uniquement** + réponses 1:1.
  - **Fenêtre 24h** : hors fenêtre → uniquement des **templates approuvés Meta**. Dans la fenêtre → libre.
  - Secrets : `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`, `WABA_ID` (n8n `WF-WHATSAPP`).
- **Chaîne** : **pas d'API publique** → le Channel Mgr rédige, le board poste en manuel.
- Opt-in WhatsApp **distinct** de l'email et de `User.whatsapp` (profil). Jamais de message non sollicité.

## Customer Success / Rétention
- Onboarding Club, signaux de churn (inactivité, non-complétion), upsell Rysmo, NPS, ré-engagement.
- Orchestré via Email + WhatsApp (opt-in) ; lecture data Firestore (enrollments, engagement, club_subscriptions).

## Red lines (NON négociables)
- **AUCUN envoi** email / broadcast WhatsApp / message 1:1 sortant sans **approbation board (Telegram)**.
- RGPD : opt-in explicite, séparé email/WhatsApp ; unsubscribe ; minimisation ; pas de données perso en clair.
- Pas de cold-email/cold-WhatsApp non sollicité. Respect fenêtre 24h + templates WhatsApp.
- Secrets via Config/n8n, jamais en commentaire.
