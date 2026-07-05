# Prompt — Configurer Paperclip en agence social media (maxmorrys.me)

> **Comment l'utiliser** : copie tout le bloc ci-dessous (entre les ```` ``` ````) et colle-le dans une
> nouvelle session Claude Code, à la racine du repo `maxmorrys.me-main`. Claude lira le repo + le repo
> Paperclip réel, puis produira `PAPERCLIP_MARKETING_SETUP_GUIDE.md`.
>
> Contexte des décisions : agence **in-house** maxmorrys.me · livrable = **guide de config complet** ·
> budget **>$1500/mo flexible** · plateformes **Instagram, TikTok, YouTube, LinkedIn/X, Facebook**.

---

```
# Mission
Tu configures Paperclip (`paperclipai/paperclip`) pour moi. Produis un guide de
configuration **complet et exécutable** qui transforme Paperclip en **agence de
marketing social media in-house pour maxmorrys.me**. Livrable : un seul fichier
Markdown `PAPERCLIP_MARKETING_SETUP_GUIDE.md`, rédigé en français.

## Règles non négociables
1. **Valide chaque primitive Paperclip** (API, noms d'adapters, format de fichier,
   flags CLI) contre le repo réel AVANT de l'affirmer. Lis via WebFetch sur
   github.com/paperclipai/paperclip : `AGENTS.md`, `skills/paperclip/SKILL.md`
   (+ `references/`), `doc/PRODUCT.md`, `doc/CLI.md`, `doc/DEPLOYMENT-MODES.md`,
   `doc/DOCKER.md`, `packages/adapters/`. Toute affirmation invérifiable → marque-la
   `[UNVERIFIED]` en disant quoi vérifier.
2. **Réutilise, ne réinvente pas.** Lis le `PAPERCLIP_SETUP_GUIDE.md` déjà présent
   dans ce repo : son install infra (§3 VPS/systemd/Cloudflare Tunnel), sa gestion
   des secrets, son squelette de gouvernance (§9), son kill-switch et ses failure
   modes sont DÉJÀ validés, ainsi que la section « Reality vs Spec » (Issues et non
   « tickets » ; `skills/<slug>/SKILL.md` au singulier ; liste réelle d'adapters
   `claude-local/codex-local/cursor-local/gemini-local/...`). Hérite de ces sections
   PAR RÉFÉRENCE — ne recopie pas les étapes VPS verbatim, pointe vers elles et ne
   décris QUE le delta spécifique au marketing.
3. **Ancre-toi dans MON contexte** (lis) : la mémoire projet (`MEMORY.md`,
   `oss_tools_roadmap.md`, `n8n_airtable_infra.md`), le `CLAUDE.md` du repo, et mes
   assets sociaux existants : `PROMPTS_YOUTUBE_MAXMORRYS.md`,
   `calendrier-prompts-youtube-maxmorrys.ics`, `docs/prompts-creation-cours.md`.
   Rappel : maxmorrys.me = Club e-learning francophone + coach IA Rysmo + chaîne
   YouTube. Stack React/Vite/Firebase/Gemini, infra automation n8n+Airtable.

## Définition de la company
- Company Paperclip **in-house** unique (nom « Maxmorrys Social », slug court ex.
  `SOC` → préfixe d'Issues `SOC-1`…). PAS une agence multi-clients.
- **Mission** : faire croître l'audience et le revenu Club/Rysmo de maxmorrys.me via
  le social organique + paid, en full-funnel. Définis une **NSM** + 3-4 KPI support
  avec leur source de vérité, chaînés reach → abonnés → sessions site → signups Club
  → MRR (sources : insights plateformes, Google Search Console, Firestore, miroir
  Stripe).
- **Périmètre de travail couvert de bout en bout** : social media marketing
  (organique + paid), community management, social listening / veille, création &
  production de contenu, analytics & reporting.

## Plateformes (les cinq, traitées par canal)
Pour CHAQUE plateforme, précise cadence, formats, sources de listening et KPI :
Instagram (Reels/Stories/posts), TikTok (short-form + tendances), YouTube (long +
Shorts — exploite mon calendrier de prompts existant), LinkedIn + X (autorité/B2B +
veille), Facebook (page + groupes).

## Org chart (budget flexible >$1500/mo — dimensionne pour la capacité)
Conçois une vraie org marketing, pas une équipe lean de 4 agents. Pour CHAQUE rôle :
justifie-le, et assigne adapter + modèle + heartbeat + budget + KPIs, mappé sur les
primitives Paperclip réelles. Forme suggérée (affine et justifie) :
- **Head of Social / CMO** — orchestrateur, possède la mission + le goal tree, filtre
  les approbations board. Ne fait pas de travail d'IC.
- **Social Media Strategist** — calendrier éditorial, stratégie paid, plan par canal.
- **Community Manager** — engagement, triage commentaires/DM en **BROUILLONS
  uniquement** (approbation board avant tout envoi).
- **Social Listening / Insights Analyst** — sentiment, tendances, veille concurrentielle
  et mots-clés, rapport d'insights hebdo.
- **Content squad** — lead vidéo short-form, copywriter, designer (peut exploiter mes
  MCP connectés : Canva, Google Drive, Notion — évalue la faisabilité réelle selon les
  capacités des adapters et marque `[UNVERIFIED]` si incertain), producteur YouTube.
- **Analytics & Reporting**.
Fournis le **goal tree** : Mission company → Projects (un par fonction) → Issues seed,
chaque Issue traçant vers le haut.

## Pack SKILL.md
Écris un `skills/<slug>/SKILL.md` par agent (frontmatter YAML `name` + `description`,
puis procédure de heartbeat, red lines, outils autorisés, règles d'escalade). Respecte
le format de skill vérifié et le flow de sync « company skills » de Paperclip.

## Heartbeats, budget, gouvernance, runbook
- **Heartbeats** alignés sur le cycle de travail réel de chaque fonction (community =
  rapide ; listening = quotidien ; stratégie = plus lent ; content = event-driven).
- **Plan de budget** : répartis les >$1500 par agent avec warn (80%) / hard-stop (100%),
  un burn-down 4 semaines, un tiering de modèles (Opus/Sonnet/Haiku là où chacun se
  justifie) et un plafond de dépense côté provider (défense en profondeur).
- **Gouvernance / red lines spécifiques au social** : AUCUNE publication sur un compte
  de marque live sans approbation board ; AUCUNE dépense pub paid sans approbation (avec
  gate $ par campagne) ; AUCUN DM/réponse sortant à de vrais utilisateurs sans
  approbation ; garde-fous brand-safety & ton ; RGPD ; gestion des secrets pour les
  tokens plateformes (API Meta/TikTok/YouTube/LinkedIn) — hashés/chiffrés, jamais dans
  les commentaires.
- **Runbook Day-0** (heure par heure), plan opératoire Semaine 1→4, conditions de
  stop-loss, failure modes & recovery (comment storms, boucles infinies, appels API
  hallucinés, fuite de secret, brouillon hors-marque), roadmap d'extension.

## Format de sortie
Calque la structure et la rigueur du `PAPERCLIP_SETUP_GUIDE.md` existant : sections
numérotées, tableaux, snippets prêts à coller, une section « Reality vs Spec » listant
tout ce que tu as corrigé face au repo, des flags `[UNVERIFIED]`, des citations de
sources, et un smoke test de vérification end-to-end (curl sur l'API). Un seul fichier :
`PAPERCLIP_MARKETING_SETUP_GUIDE.md`.

Avant d'écrire : liste ce que tu as lu et toute hypothèse que tu poses ; ne me pose une
question QUE s'il reste une ambiguïté bloquante.
```
