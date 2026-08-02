# Skill — Protocole d'approbation Telegram (garde-fou)

**Règle absolue, non négociable : aucune action sortante ne part sans validation humaine explicite du board sur Telegram** (bot `@MaxMorrys_notif_bot`, chat `TELEGRAM_CHAT_ID`).

Sont « sortantes / irréversibles » : publier un post (FB/IG/TikTok/YouTube/LinkedIn/X), envoyer un email ou un broadcast WhatsApp, publier un article (même en brouillon public), lancer/modifier une publicité payante, modifier un workflow n8n de production. Aussi : tout message à froid à un utilisateur réel, toute dépense externe.

## Mécanisme maxmorrys — piloté par l'état Airtable (PAS d'appel direct à une API sortante)
Le garde-fou est **piloté par le `Statut`** des enregistrements Airtable, relayé par les workflows n8n. Tu ne « publies » jamais : tu **poses un brouillon complet** et tu passes le `Statut` au point de hand-off. Un workflow notifie le board, et **seule l'approbation** déclenche l'action.

1. Prépare l'action **complètement** : texte finalisé, créa rendue (`renderSocialCard` → `Visuels_URLs`), canaux/segment choisis, tout dans l'enregistrement (`Contenus` pour le social, `Emails` pour l'email, `WhatsApp` pour WhatsApp).
2. **Passe le `Statut` à `prêt_à_valider`.** C'est le seul geste que tu fais.
3. Le workflow de notification correspondant envoie au board un message Telegram avec **aperçu (texte + visuel)** + boutons **✅ / ❌** :
   - Social → **WF-SOCIAL-07** → callback `approve:post:{recId}` / `reject:post:{recId}`.
   - Email → **WF-EMAIL-NOTIFY** → `approve:email:{id}`.
   - WhatsApp → **WF-WHATSAPP-NOTIFY** → `approve:wa:{id}`.
   - Gouvernance Paperclip → **WF-GOV-07** → `approve:pc:{id}`.
4. **Tu t'arrêtes là.** Tu ne passes JAMAIS un `Statut` à `validé`, tu n'appelles jamais WF-SOCIAL-05 / WF-EMAIL-SEND / WF-WHATSAPP-SEND toi-même.
   - `✅` → **WF-TG-ROUTER** passe l'enregistrement à `validé` → le workflow d'exécution publie/envoie (garde-fou supplémentaire côté social : `PUBLISH_ENABLED` doit être `true`).
   - `❌` → l'enregistrement est marqué `rejeté` ; tu classes le ticket ou tu révises et resoumets.

## Interdits
- Ne jamais passer un `Statut` directement à `validé` / `publié`.
- Ne jamais appeler directement une API de plateforme (Meta Graph, TikTok, Brevo, WhatsApp Cloud) : ces actions passent exclusivement par les workflows, déclenchés par l'approbation.
- En cas de doute sur le caractère sortant d'une action → traite-la comme sortante et pose `prêt_à_valider`.

## Commandes board (via le routeur Telegram)
`/pending` (file d'attente) · `/kpis` · `/budget` · `/pause` (kill-switch : met tous les agents en pause) · `/resume`.

Le garde-fou protège la marque et le budget : c'est la condition de confiance de toute la flotte.
