# Runbook — Flotte d'agents IA maxmorrys (marketing social)

Doc de pilotage. Architecture : **Paperclip** (cerveau / 9 agents) · **n8n** (workflows `WF-*` = les
mains) · **Airtable** `apppkEbepilHCYiso` (mémoire) · **Telegram** `@MaxMorrys_notif_bot` (garde-fou) ·
`renderSocialCard` + Gemini (créas) · canaux Meta/TikTok/YouTube/LinkedIn/X + Brevo + WhatsApp.

## La commande (idempotente)
```bash
node paperclip/setup-maxmorrys-org.mjs --apply                         # crée/maj (dry-run sans --apply)
node paperclip/setup-maxmorrys-org.mjs --apply --update-skills --update-agents  # resync fiches/skills
node paperclip/setup-maxmorrys-org.mjs --apply --activate-routines             # active les cadences
```
Config & secrets : `paperclip/secrets.local.json` (**gitignoré**).

## Le garde-fou (règle d'or)
Aucune action sortante ne part sans **✅ Telegram**. Flux **piloté par l'état Airtable** :
`agent pose Statut='prêt_à_valider' → WF-*-NOTIFY (Telegram [✅ ❌]) → (sur ✅) WF-TG-ROUTER passe à 'validé' → WF-*-SEND/PUBLISH`.
Les agents ne passent JAMAIS un `Statut` à `validé`/`publié`. Publication = **double garde** :
approbation **et** `PUBLISH_ENABLED=true` (+ WF-SOCIAL-05 actif).

## Pipeline social (table `Contenus` `tblPYoyzcZLdtBTO3`, champ `Statut`)
`idée → planifié → rédigé → visuel prêt → prêt_à_valider → (✅) → validé → publié`

| Étape | Workflow | Agent responsable |
|---|---|---|
| Idéation / veille | WF-SOCIAL-01 + angles Ivan | Zara / Ivan |
| Planif | WF-SOCIAL-02 | Aïcha / Zara |
| Rédaction | WF-SOCIAL-03 | Zara |
| Fond IA | WF-SOCIAL-04 (`gemini-2.5-flash-image-preview`) | Malik |
| Overlay créa | `renderSocialCard` → `Visuels_URLs` | Malik |
| Notif validation | WF-SOCIAL-07 → Telegram (`approve:post:{recId}`) | garde-fou |
| Routage callback | WF-TG-ROUTER | garde-fou |
| **Publication** | **WF-SOCIAL-05** (APIs natives, `PUBLISH_ENABLED`) | board only |
| Tracking | WF-SOCIAL-06 | Nadia |

Email : WF-EMAIL-NOTIFY → `approve:email` → WF-EMAIL-SEND (Brevo). WhatsApp : WF-WHATSAPP-NOTIFY →
`approve:wa` → WF-WHATSAPP-SEND. Gouvernance : WF-GOV-07. Digest : WF-DIGEST (8h).

## Agents (Paperclip)
CEO → **Aïcha (CMO)** → Zara (contenu+publication), Malik (DA), Ivan (SEO+veille), Flora (CRM/lifecycle),
Sandra (service), Nadia (insights), Rachid (ads — **dormant**). CEO/board → Oscar (Ops n8n, transverse).
Routines créées **en pause** — activer avec `--activate-routines` quand prêt.

## Réconciliation avec la company live (source de vérité = ce repo)
La company live `29055790-7f09-4fe0-aa32-0cb8f2d206f4` (« Maxmorrys Growth », préfixe **MAX**) héberge
**33 agents historiques, TOUS EN PAUSE**. Ce repo décrit le **cœur allégé ~8 agents**. Pour réconcilier
(étape **board-gated**, à faire hors de l'écriture du scaffold) :
1. Renseigner `ceoAgentId` / `environmentId` dans `org.json` (via `GET /api/companies/{id}/org`).
2. `node setup-maxmorrys-org.mjs --apply` : crée les agents/skills/routines **manquants** (idempotent, ne
   touche pas aux existants portant le même nom).
3. **Archiver à la main** dans l'UI Paperclip le surplus des 33 agents (le script **ne supprime jamais**).
4. Reprendre les agents un par un (`POST /api/agents/{id}/resume`), en commençant par le CMO, une fois
   les canaux prêts et le garde-fou testé.

## Activations externes restantes (avant go-live publication)
1. Tokens plateformes dans `Config` (`PUBLISH_ENABLED`, `META_TOKEN`, `IG_USER_ID`, `FB_PAGE_ID`,
   `TIKTOK_TOKEN`, `LINKEDIN_TOKEN`, `LINKEDIN_AUTHOR_URN`, `X_TOKEN`).
2. Reconstruire/activer **WF-SOCIAL-05** en APIs natives (garde-fou : reste inactif tant que non prêt).
3. WhatsApp : re-vérifier numéro + token (⚠ 60j) et templates approuvés Meta.
4. Email : activer WF-EMAIL-NOTIFY + WF-EMAIL-SEND (Brevo, expéditeur `hello@maxmorrys.me` vérifié).
5. `renderSocialCard` : déployer la Cloud Function (bloquée sur Secret Manager / billing GCP côté prod).

## Dépannage (Oscar / Ops)
- **Réponse n8n vide / échec** : lire `/executions?workflowId=…&includeData=true`.
- **Action gatée refusée** : vérifier que le callback marque l'état **avant** exec, jeton présent.
- **530 / 403 tunnel** : `/api/health` doit être 200 ; `allowed-hostname` posé (redémarrage Paperclip requis).
- **Modèle image cassé** : utiliser `gemini-2.5-flash-image-preview` (⚠ pas les `gemini-3-*`).
- Patch workflow : `scripts/n8n-patch.py --dry-run` d'abord + backup.

## Sécurité
`secrets.local.json`, les service accounts (GSC/Firebase) et `paperclip/workspace/` sont **gitignorés** —
jamais committés. Les tokens vivent dans Paperclip (coffre secrets) et n8n (`Config` / credentials chiffrés).
