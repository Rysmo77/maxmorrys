# Maxmorrys — Flotte d'agents IA Marketing (Paperclip)

Org chart d'agents IA (dans **Paperclip**) qui prend en charge le marketing social de **maxmorrys.me** :
calendrier éditorial, contenu, réseaux sociaux, SEO/veille, blog, email, WhatsApp, CRM/lifecycle,
service client, analytics. Modelé sur la flotte khanouss, adapté au business ed-tech (Formations /
Club Digitos / Rysmo, Afrique francophone) et à l'infra réelle maxmorrys.

**Architecture** : Paperclip (le cerveau / org chart) · n8n `WF-*` (les mains) · **NocoDB**
`ph7ugup4mggzj2y` (la mémoire, depuis la migration du 2026-08-06) · Telegram `@MaxMorrys_notif_bot` (le garde-fou) ·
`renderSocialCard` + Gemini (les créas) · Meta/TikTok/YouTube/LinkedIn/X + Brevo + WhatsApp (les canaux).

## Contenu de ce dossier
```
paperclip/
├── org.json                    # Manifeste (company, secrets, 7 skills, 9 agents + routines)
├── setup-maxmorrys-org.mjs     # Applique l'org sur Paperclip (idempotent)
├── secrets.example.json        # Modèle de secrets (committé)
├── secrets.local.json          # Secrets réels (GITIGNORÉ)
├── .gitignore
├── skills/<slug>/SKILL.md      # 7 skills partagées
├── agents/<slug>.md            # 9 fiches de poste (= instructionsFilePath)
└── workspace/                  # cwd d'exécution (gitignoré)
```

## L'org chart — cœur allégé ~8 agents (+1 dormant)
- **CEO** → **Aïcha (CMO)** → Zara (Contenu & RS), Malik (DA), Ivan (SEO & Veille),
  Flora (CRM/Lifecycle & Email/WhatsApp), Sandra (Service Client), Nadia (Insights), Rachid (Ads — **dormant**).
- **CEO/board** → Oscar (Ops n8n, **transverse**).
- Runtimes : `claude_local` (raisonnement : Aïcha, Zara, Malik, Ivan, Flora, Oscar, Rachid) ·
  `gemini_local` (exécution légère : Sandra, Nadia).

### Le RACI des 3 missions (comme khanouss)
| Mission | Responsable | Concrètement |
|---|---|---|
| **Calendrier éditorial** | Aïcha *cadre* + Zara & Ivan *alimentent* | Aïcha pose le plan hebdo (lundi 8h, quota ~30 % non-produit) ; Zara ajoute ses idées, Ivan injecte les angles de veille |
| **Création de contenus** | Zara *(texte)* + Malik *(visuel)* | Zara rédige captions/scripts/blog ; Malik produit les créas (fond IA + overlay `renderSocialCard`, jamais de photo brute) |
| **Publication sur les RS** | Zara | Routine du soir (`0 8,18`) : passe les contenus à `prêt_à_valider` → ✅ Telegram → `WF-SOCIAL` |

## Prérequis machine
- Instance **Paperclip** locale sur `http://127.0.0.1:3100` (mode `local_trusted`), ou via tunnel
  `https://paperclip.maxmorrys.me` (CF Access).
- CLIs `claude` et `gemini` installés et authentifiés sur l'hôte.
- Node ≥ 18.

## Lancer / mettre à jour l'org
```bash
# 1) Secrets (copie l'exemple puis édite — gitignoré)
cp paperclip/secrets.example.json paperclip/secrets.local.json

# 2) ⚠ Renseigne company.ceoAgentId / company.environmentId dans org.json (placeholders __FILL_FROM_LIVE__)
curl -s http://127.0.0.1:3100/api/companies/29055790-7f09-4fe0-aa32-0cb8f2d206f4/org | jq '{ceo:.ceoAgentId, env:.environmentId}'

# 3) Prévisualise (n'écrit rien)
node paperclip/setup-maxmorrys-org.mjs

# 4) Applique (idempotent : ne recrée jamais un existant, ne supprime jamais)
node paperclip/setup-maxmorrys-org.mjs --apply

# Options
node paperclip/setup-maxmorrys-org.mjs --apply --only=cmo-aicha        # limite à des agents
node paperclip/setup-maxmorrys-org.mjs --apply --phase=1               # limite à une phase
node paperclip/setup-maxmorrys-org.mjs --apply --update-skills --update-agents  # resync fiches/skills
node paperclip/setup-maxmorrys-org.mjs --apply --activate-routines     # active les crons (défaut: en pause)
node paperclip/setup-maxmorrys-org.mjs --apply --skip-secrets
```

## Garde-fou (règle d'or)
Aucune action sortante (post, email, WhatsApp, article, pub) ne part sans **✅ Telegram**
(skill `approval-protocol`). Les agents posent un brouillon complet au `Statut='prêt_à_valider'` ;
un workflow notifie le board ; seule l'approbation passe l'état à `validé` et déclenche l'action.
Double garde publication : approbation **et** `PUBLISH_ENABLED=true`.

## Réconciliation avec la company live
Voir `RUNBOOK.md` §Réconciliation : ce repo est la **source de vérité** du cœur allégé ~8 agents ;
la company live `29055790…` héberge 33 agents historiques (tous en pause). Pousser les 8 et archiver
le surplus = étape board-gated, à faire quand le board le décide.
