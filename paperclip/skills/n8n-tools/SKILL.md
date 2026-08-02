# Skill — Outils n8n (les « mains » de la flotte)

Tu ne touches **jamais** directement aux réseaux sociaux, emails, WhatsApp, Firestore ou aux paiements. Tu agis sur le monde **via l'infra n8n + Airtable** déjà en place :
- API n8n : `N8N_BASE_URL` = `https://n8n.maxmorrys.me`
- Webhooks n8n : `N8N_WEBHOOK_BASE_URL` = `https://n8n.maxmorrys.me/webhook`

C'est la couche d'exécution auditée et sécurisée. **Airtable est la mémoire partagée** entre toi et n8n.

## Trois façons d'agir
1. **Écrire l'état dans Airtable (la mémoire)** : tu crées/complètes un enregistrement `Contenus` et tu poses son champ **`Status`**. C'est la source de vérité.
2. **Appeler directement le workflow n8n pour agir MAINTENANT (temps réel)** : après avoir posé un `Status`, tu déclenches l'étape n8n correspondante par un `POST` sur son webhook, avec l'en-tête d'authentification **`X-MM-Trigger: {N8N_TRIGGER_TOKEN}`** :
   - après avoir posé `Status='planifié'` → `curl -X POST {N8N_WEBHOOK_BASE_URL}/mm-run-redaction -H "X-MM-Trigger: $N8N_TRIGGER_TOKEN"` → **WF-SOCIAL-03** rédige le lot en attente → `rédigé`.
   - après `Status='rédigé'` → `POST {N8N_WEBHOOK_BASE_URL}/mm-run-visuel` (même en-tête) → **WF-SOCIAL-04** génère la carte → `prêt_à_valider`.
   - `POST {N8N_WEBHOOK_BASE_URL}/mm-run-notif` → **WF-SOCIAL-07** envoie la carte + boutons sur Telegram au board.
   - Les **Crons restent actifs en filet de sécurité** : si tu n'appelles pas le webhook, l'étape se fera quand même plus tard. L'appel direct sert à agir **tout de suite**.
   - Un `POST` sans l'en-tête `X-MM-Trigger` = **403** (seule la flotte peut déclencher).
   - ⛔ **Il n'existe AUCUN webhook de publication.** Tu ne peux PAS déclencher WF-SOCIAL-05 : la publication reste **exclusivement** derrière ton ✅ Telegram (skill `approval-protocol`).
3. **Appel HTTP direct de rendu** : `renderSocialCard` via `$RENDER_CARD_URL` (en-tête `X-Render-Key`) — non sortant (skill `creative-render-card`).

## Pipeline social — table `Contenus` (`tblPYoyzcZLdtBTO3`), champ `Status`
`idée` → `planifié` → `rédigé` → `prêt_à_valider` → *(✅ Telegram)* → `validé` → `publié`

| Workflow | Rôle | Webhook « run-now » | Sortant ? |
|---|---|---|---|
| WF-SOCIAL-03 | Rédaction (Gemini) | `mm-run-redaction` | non |
| WF-SOCIAL-04 | **Fond IA** + overlay `renderSocialCard` → `Visuels_URLs` | `mm-run-visuel` | non |
| WF-SOCIAL-07 | Notifie le board sur Telegram (aperçu + boutons) | `mm-run-notif` | — (garde-fou) |
| WF-TG-ROUTER | Route les callbacks Telegram → `validé`/`rejeté` | — (Telegram) | — (garde-fou) |
| **WF-SOCIAL-05** | **Publie** FB/IG/TikTok/LinkedIn/X (APIs natives) | **AUCUN** (jamais appelable) | **OUI** — `PUBLISH_ENABLED` + ✅ |
| WF-SOCIAL-06 | Tracking / insights | — | non |

## Email / WhatsApp / gouvernance
| Workflow | Rôle | Sortant ? |
|---|---|---|
| WF-EMAIL-NOTIFY → WF-EMAIL-SEND | Aperçu Telegram (`approve:email:{id}`) → envoi Brevo | **OUI** |
| WF-WHATSAPP-NOTIFY → WF-WHATSAPP-SEND | Aperçu Telegram (`approve:wa:{id}`) → WhatsApp Cloud API | **OUI** |
| WF-GOV-07 | Notifie les approbations de gouvernance Paperclip | — |
| WF-DIGEST | Digest KPIs | non |

## Règle d'or (invariant)
Tout ce qui est **OUI (sortant)** ne s'exécute que **sur approbation ✅ Telegram** : tu poses le brouillon + `Status='prêt_à_valider'`, **jamais** `Status='validé'` ni un appel de publication. Double garde publication : approbation **et** `PUBLISH_ENABLED=true` (+ WF-SOCIAL-05 actif). Tu peux appeler `mm-run-redaction/visuel/notif` (production, non sortant) ; tu ne peux **rien** appeler qui publie.

## Gotchas API n8n (pour Oscar / Ops)
- `PUT /api/v1/workflows/{id}` n'accepte que `{name,nodes,connections,settings,staticData}` — et `settings` doit être filtré aux clés autorisées (sinon 400 « must NOT have additional properties »).
- `POST /workflows/{id}/activate` **fonctionne** par API (ne plus croire la vieille note « bloqué par classifier »). Un `docker restart maxmorrys-n8n` réenregistre triggers/webhooks.
- Modifier un workflow : backup JSON d'abord (`scripts/n8n-patch.py --dry-run` pour le pattern).
- Credential d'auth des webhooks « run-now » = `httpHeaderAuth` **« MM Trigger »** (en-tête `X-MM-Trigger`).
