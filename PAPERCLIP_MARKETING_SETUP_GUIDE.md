# PAPERCLIP_MARKETING_SETUP_GUIDE.md
### Configurer Paperclip en agence social media in-house pour **maxmorrys.me**

> **Statut de vérification** : chaque primitive Paperclip de ce guide (CLI, adapters,
> endpoints API, format de fichier, modèle de données) a été validée contre le repo réel
> `github.com/paperclipai/paperclip` (branche `master`) le 2026-06-25. Les sources sont
> citées en §15. Tout ce qui n'a pas pu être confirmé porte un flag `[UNVERIFIED]` avec
> l'action de vérification.
>
> **Ce guide est un *delta*.** Il **hérite par référence** de l'infra déjà validée dans
> [`PAPERCLIP_SETUP_GUIDE.md`](./PAPERCLIP_SETUP_GUIDE.md) (le guide de la company « dev-team »).
> Il **ne recopie pas** les étapes VPS / systemd / Cloudflare Tunnel / secrets — il y pointe et ne
> décrit **que** ce qui est spécifique au marketing social.

---

## §1 — Résumé exécutif

**Objectif** : faire de Paperclip l'**agence social media in-house** de maxmorrys.me — une
seule company Paperclip, **pas** une agence multi-clients.

**Modèle directeur — « cerveau / mains »** :

| Couche | Rôle | Outils |
|---|---|---|
| **Cerveau** (Paperclip) | Gouvernance, stratégie, calendrier éditorial, QA, brand-safety, approbations, reporting | Agents Paperclip (adapters `claude-local` / `gemini-local`) |
| **Mains** (existant) | Production & publication réelles | n8n (`eyonemedical.app.n8n.cloud`) + Airtable (`apppkEbepilHCYiso`) + **APIs natives des plateformes** + Gemini |

Les agents Paperclip **orchestrent** le pipeline n8n/Airtable/Gemini + APIs natives déjà en place
(voir [`n8n_airtable_infra.md`](file:///Users/macbookair/.claude/projects/-Users-macbookair-maxmorrys-me-main/memory/n8n_airtable_infra.md)) ;
ils ne le réinventent pas. Ils exploitent aussi les assets sociaux existants :
[`PROMPTS_YOUTUBE_MAXMORRYS.md`](./PROMPTS_YOUTUBE_MAXMORRYS.md) (librairie P0–P10 + grille 6 mois)
et [`calendrier-prompts-youtube-maxmorrys.ics`](./calendrier-prompts-youtube-maxmorrys.ics)
(cadence hebdo, publication **samedi 19h `Africa/Dakar`**).

**Relation à la company existante** : Paperclip supporte plusieurs companies par instance
(« One instance of Paperclip can run multiple companies », `doc/PRODUCT.md`). On crée donc une
**2ᵉ company** — *Maxmorrys Social*, préfixe d'Issues **`SOC`** — sur la **même instance** que la
company dev-team. Aucune nouvelle infra serveur : on réutilise le VPS, systemd, le tunnel et la
gestion de secrets déjà en place.

**Mission de la company** (NSM en §4) : *croître l'audience et le revenu Club/Rysmo via le social
organique + paid, en full-funnel (reach → abonnés → sessions site → signups Club → MRR).*

---

## §2 — Pré-vol & héritage par référence

> **Tout le bloc infra est déjà fait et validé.** Ne le rejoue pas.

| Sujet | Où c'est traité | Action ici |
|---|---|---|
| Provision VPS, systemd unit, Cloudflare Tunnel | `PAPERCLIP_SETUP_GUIDE.md` **§3** | **Hériter.** Aucune action si l'instance tourne déjà. |
| Secrets handling (mode `.env` 600, chiffrement at rest) | `PAPERCLIP_SETUP_GUIDE.md` **§2 / §15.A** | **Hériter.** On ajoute en §10 les *nouveaux* secrets plateformes. |
| Squelette de gouvernance & kill-switch | `PAPERCLIP_SETUP_GUIDE.md` **§9** | **Hériter.** On ajoute en §10 les red lines *spécifiques social*. |
| Failure modes génériques | `PAPERCLIP_SETUP_GUIDE.md` **§12** | **Hériter.** On ajoute en §13 les failure modes *spécifiques social*. |
| Port, bind, health check | port **3100**, bind `loopback`, `GET /api/health` | Réutilisés tels quels (voir §16). |

**Pré-requis spécifiques marketing à réunir AVANT le Day-0** (§12) :

- [ ] L'instance Paperclip dev-team tourne (`curl http://localhost:3100/api/health` → `ok`).
- [ ] Un **board token** marketing dédié : `pnpm paperclipai token board create --ttl-days 90`.
- [ ] Comptes plateformes créés (IG, TikTok, YouTube, LinkedIn, X, Facebook).
- [ ] **Une app développeur par plateforme** + tokens OAuth (publication via **APIs natives**, pas
      d'agrégateur tiers — cf. §11). Spécificités :
  - **Instagram** : compte **Business/Creator** lié à une **Page Facebook** (publication via Meta Graph API).
  - **TikTok** : **app review** requise pour la Content Posting API (Direct Post).
  - **YouTube / Meta** : **refresh tokens** OAuth (tokens longue durée).
  - **X** : **tier payant** pour l'accès write (`POST /2/tweets`).
- [ ] Clés modèles : `ANTHROPIC_API_KEY` (déjà en place) + `GEMINI_API_KEY` (réutilise l'infra).

---

## §3 — Définition de la company

**Création** (CLI validée `doc/CLI.md`) :

```bash
# Board token requis pour toutes les commandes ci-dessous
export PCLI="pnpm paperclipai"          # ou: npx paperclipai
export PC_API="http://localhost:3100"   # local ; via tunnel: https://paperclip.maxmorrys.me
export BOARD_TOKEN="$(pnpm paperclipai token board create --ttl-days 90 --json | jq -r .token)"

$PCLI company create --api-base "$PC_API" --api-key "$BOARD_TOKEN" --payload-json '{
  "name": "Maxmorrys Social",
  "slug": "maxmorrys-social",
  "issuePrefix": "SOC",
  "mission": "Faire croître l’audience et le revenu Club/Rysmo de maxmorrys.me via le social organique + paid, en full-funnel (reach -> abonnés -> sessions site -> signups Club -> MRR), en restant sous le plafond budgétaire mensuel et SANS JAMAIS publier sur un compte de marque live, dépenser en paid, ni contacter un utilisateur réel sans approbation explicite du board."
}'
```

> **`[UNVERIFIED]` — nom exact des champs du payload `company create`.** `doc/PRODUCT.md` confirme
> qu'une company porte un *goal/mission*, un *slug* et un préfixe d'Issues, mais le schéma JSON
> littéral (`issuePrefix` vs `prefix`, etc.) n'est pas publié hors-repo. **À vérifier** :
> `references/api-reference.md` (dispo après install) ou `pnpm paperclipai company create --help`.
> Le **préfixe `SOC`** donne des Issues `SOC-1`, `SOC-2`… (pattern `{PREFIX}-{N}` confirmé,
> `skills/paperclip/SKILL.md`).

Récupère l'ID de la company pour la suite :

```bash
export CID="$($PCLI company list --api-base "$PC_API" --api-key "$BOARD_TOKEN" --json \
  | jq -r '.[] | select(.slug=="maxmorrys-social") | .id')"
```

---

## §4 — North Star Metric & KPIs

**NSM = MRR Club net nouveau (€ / mois)** — la fin de chaîne du funnel : c'est le seul nombre dont
la croissance prouve que tout le reste sert à quelque chose.

**Chaîne full-funnel & sources de vérité** (chaque KPI alimente le suivant) :

| # | Métrique | Étage funnel | Source de vérité | Comment l'agent la lit |
|---|---|---|---|---|
| **NSM** | **MRR Club net nouveau (€/mo)** | Revenu | **Miroir Stripe → Firestore** | Lecture Firestore (collection abonnements) |
| K1 | Reach / impressions | Notoriété | Insights natifs IG/TikTok/YT/LI/X/FB | API insights par plateforme (token en §10) |
| K2 | Net-new followers / abonnés | Audience | Insights natifs plateformes | idem |
| K3 | Sessions site **social-attribuées** | Trafic | **Google Search Console** + **UTM** (+ GA/Firestore) | GSC API + filtre `utm_source` |
| K4 | Signups Club issus du social | Conversion | **Firestore** (avec `utm_source` capturé au signup) | Lecture Firestore |

> La chaîne se lit : **K1 reach → K2 abonnés → K3 sessions → K4 signups → NSM MRR.** Chaque Issue de
> contenu porte un `goalId` qui la rattache à l'un de ces étages (§6), de sorte que le dashboard
> (`pnpm paperclipai dashboard get --company-id $CID`) agrège la contribution de chaque pièce.

**Convention UTM obligatoire** (taxonomie officielle du Brand Kit — `07_Templates_Marketing/utm_taxonomy.csv`) :
`?utm_source={canal}&utm_medium={format}&utm_campaign={campagne}&utm_content={angle}_v{NN}`
(ex. `utm_source=instagram&utm_medium=carousel&utm_campaign=formation_whatsapp&utm_content=angle_gain_temps_v01`).
Le Community Manager et le YouTube Producer **doivent** inscrire l'UTM dans chaque lien sortant ; sinon l'Analytics Lead remonte
un blocker.

---

## §5 — Org chart (capacité, budget ~$1 800/mo)

> Conçu **pour la capacité**, pas en équipe lean de 4. 10 rôles, mappés sur les primitives réelles :
> chaque rôle = un **agent** (`agent create`), un **adapter**, un **modèle**, un **heartbeat**
> (routine cron, §8), un **budget** (§9), un **skill** (§7).

| # | Rôle | Justification | Adapter | Modèle | Heartbeat | $/mo | KPI possédé |
|---|---|---|---|---|---|---|---|
| 1 | **Head of Social / CMO** | Orchestrateur ; possède mission + goal tree ; filtre les approbations board ; **pas d'IC** | `claude-local` | Opus 4.8 | daily 08:00 + wake sur approbation/mention | $300 | NSM |
| 2 | **Social Media Strategist** | Calendrier éditorial, stratégie paid, plan par canal | `claude-local` | Sonnet 4.6 | 2×/sem (lun + jeu) | $220 | K1, K2 |
| 3 | **Community Manager** | Engagement & triage commentaires/DM — **BROUILLONS uniquement** | `claude-local` | Haiku 4.5 | toutes les 4 h (fenêtre 08–22 Dakar) | $180 | K2 |
| 4 | **Social Listening / Insights Analyst** | Sentiment, tendances, veille concurrentielle, mots-clés, rapport hebdo | `gemini-local` | `gemini-2.5-flash` | daily 07:00 | $150 | K1 |
| 5 | **Short-form Video Lead** | Lead Reels/TikTok/Shorts (hooks, structure, B-roll) | `claude-local` | Sonnet 4.6 | event-driven (issue-assign) | $180 | K1, K2 |
| 6 | **Copywriter** | Captions, hooks, scripts, légendes multi-canal | `gemini-local` | `gemini-2.5-pro` | event-driven | $120 | K1 |
| 7 | **Designer** | Visuels/templates (Canva MCP — voir flag) | `claude-local` | Sonnet 4.6 | event-driven | $120 | K1 |
| 8 | **YouTube Producer** | Exploite P0–P10 + `.ics` ; long + Shorts | `claude-local` | Sonnet 4.6 | hebdo lun 09:00 (aligné Mon script-gen) | $160 | K1, K3 |
| 9 | **Paid / Performance Marketer** | Campagnes paid full-funnel, **$-gate/campagne** | `claude-local` | Sonnet 4.6 | hebdo + wake sur approbation | $130 | K3, K4 |
| 10 | **Analytics & Reporting Lead** | Rapport hebdo + board memo mensuel, attribution UTM | `claude-local` | Haiku 4.5 | hebdo ven 16:00 + 1er du mois | $90 | K3, K4, NSM |
| — | **Buffer** | Retries, deep-research ponctuelle | — | — | — | $50 | — |
| | **Total** | | | | | **$1 800** | |

> **`[UNVERIFIED]` — Designer via Canva MCP.** Les MCP Canva / Google Drive / Notion sont connectés à
> **ma session claude.ai**, pas nécessairement au runtime `claude-local` tournant **sur le VPS**.
> La dispo MCP est une config **per-adapter** côté serveur. **À vérifier** :
> `pnpm paperclipai adapter config-schema claude-local` et `plugin tools <plugin-id>` pour confirmer
> que le runtime de l'agent expose bien ces MCP. **Fallback si non** : le Designer produit un brief
> + appelle le WF-SOCIAL-04 « Visuels » (Gemini `gemini-2.5-flash-image-preview`) déjà en place.

**Chaîne de commandement** : tous reportent au CMO (`chainOfCommand` = ID du CMO) ; le CMO reporte au
**board (toi)**. Exemple d'embauche :

```bash
# 1) CMO (top of chain)
CMO_ID="$($PCLI agent hire --company-id $CID --api-key "$BOARD_TOKEN" --payload-json '{
  "title":"Head of Social / CMO","adapter":"claude-local","model":"opus-4-8",
  "desiredSkills":["soc-cmo"]
}' --json | jq -r .id)"

# 2) Un IC qui reporte au CMO
$PCLI agent hire --company-id $CID --api-key "$BOARD_TOKEN" --payload-json "{
  \"title\":\"Community Manager\",\"adapter\":\"claude-local\",\"model\":\"haiku-4-5\",
  \"chainOfCommand\":\"$CMO_ID\",\"desiredSkills\":[\"soc-community\"]
}"
```

> **`[UNVERIFIED]` — identifiants de modèle exacts par adapter** (`opus-4-8` / `sonnet-4-6` /
> `haiku-4-5` vs IDs internes). **À vérifier** : `pnpm paperclipai adapter models claude-local`
> (commande validée dans `doc/CLI.md`). Les champs `title`, `adapter`, `model`, `chainOfCommand`,
> `desiredSkills` sont, eux, confirmés (`skills/paperclip/SKILL.md`).

---

## §6 — Goal tree (Mission → Goals + Projects → Issues)

Le modèle réel (`doc/PRODUCT.md`) : une **Issue** lie **à la fois** un `goalId` **et** un `projectId`.
On exploite ça :

- **Goals = étages du funnel** (le « pourquoi », la chaîne NSM) ;
- **Projects = fonctions** (le « qui/comment ») ;
- chaque **Issue** trace donc *verticalement* (quel étage funnel) **et** *horizontalement* (quelle équipe).

```
Mission (company SOC)
│
├── GOALS (étages funnel)            ├── PROJECTS (fonctions)
│   ├── G-REACH      (K1)            │   ├── P-STRATEGY   (owner: Strategist)
│   ├── G-FOLLOWERS  (K2)            │   ├── P-CONTENT    (owner: Short-form Lead)
│   ├── G-SESSIONS   (K3)            │   ├── P-COMMUNITY  (owner: Community Mgr)
│   ├── G-SIGNUPS    (K4)            │   ├── P-LISTENING  (owner: Insights Analyst)
│   └── G-MRR        (NSM)           │   ├── P-PAID       (owner: Paid Mktr)
│                                    │   ├── P-ANALYTICS  (owner: Analytics Lead)
│                                    │   └── P-OPS        (owner: CMO)
│
└── ISSUES (chacune: goalId + projectId)
    ex. SOC-12 "Reel 'IA pour ton business'" → goalId=G-REACH, projectId=P-CONTENT
```

**Création** (CLI validée) :

```bash
# Goals (funnel)
for g in "G-REACH:Reach & impressions" "G-FOLLOWERS:Croissance abonnés" \
         "G-SESSIONS:Sessions site social-attribuées" "G-SIGNUPS:Signups Club via social" \
         "G-MRR:MRR Club net nouveau (NSM)"; do
  $PCLI goal create --company-id $CID --api-key "$BOARD_TOKEN" \
    --payload-json "{\"key\":\"${g%%:*}\",\"title\":\"${g#*:}\"}"
done

# Projects (fonctions)
$PCLI project create --company-id $CID --api-key "$BOARD_TOKEN" \
  --name "P-CONTENT" --goal-ids "G-REACH,G-FOLLOWERS"
# … idem pour P-STRATEGY, P-COMMUNITY, P-LISTENING, P-PAID, P-ANALYTICS, P-OPS
```

**Issues seed (Day-0)** — une par fonction, chacune traçant vers le haut :

| Issue | Projet | Goal | Assignee | Objet |
|---|---|---|---|---|
| SOC-1 | P-OPS | G-MRR | CMO | Établir le board memo hebdo + valider le goal tree |
| SOC-2 | P-STRATEGY | G-REACH | Strategist | Calendrier éditorial 4 semaines, 6 canaux |
| SOC-3 | P-LISTENING | G-REACH | Insights Analyst | Rapport veille v0 (sentiment + 10 mots-clés + 3 concurrents) |
| SOC-4 | P-CONTENT | G-FOLLOWERS | Short-form Lead | 3 brouillons Reels/TikTok depuis le thème du mois |
| SOC-5 | P-CONTENT | G-SESSIONS | YouTube Producer | Pipeline semaine YT depuis `PROMPTS_YOUTUBE` (P1 Tuto) |
| SOC-6 | P-COMMUNITY | G-FOLLOWERS | Community Mgr | Brouillons de réponses au backlog commentaires |
| SOC-7 | P-PAID | G-SIGNUPS | Paid Mktr | Plan paid v0 + **demande d'approbation budget/campagne** |
| SOC-8 | P-ANALYTICS | G-MRR | Analytics Lead | Brancher lectures KPI (§4) + dashboard baseline |

```bash
$PCLI issue create --company-id $CID --api-key "$BOARD_TOKEN" --payload-json '{
  "title":"Calendrier éditorial 4 semaines, 6 canaux",
  "projectId":"P-STRATEGY","goalId":"G-REACH","assigneeAgentId":"<STRATEGIST_ID>",
  "priority":"high","status":"todo"
}'
```

> Champs Issue confirmés (`skills/paperclip/SKILL.md`) : `title, description, priority,
> assigneeAgentId, projectId, goalId, parentId, status, blockedByIssueIds, billingCode`.
> Statuts : `backlog, todo, in_progress, in_review, done, blocked, cancelled`.

---

## §7 — Pack SKILL.md (un par agent)

**Format validé** : `skills/<slug>/SKILL.md` (**singulier**, un dossier par skill), frontmatter YAML
`name` + `description`. **Sync vers un agent** :

```bash
# Installer le skill dans la bibliothèque de la company, puis l'attacher à l'agent
$PCLI skills import ./skills/soc-community --company-id $CID --api-key "$BOARD_TOKEN"
$PCLI skills agent sync <AGENT_ID> --company-id $CID --api-key "$BOARD_TOKEN"
# (équivalent API: POST /api/agents/{agentId}/skills/sync ; ou desiredSkills à l'embauche, §5)
```

Chaque skill suit le même gabarit. **Exemple complet — Community Manager** (le plus sensible) :

```markdown
---
name: soc-community
description: >
  Community Manager de Maxmorrys Social. À CHAQUE heartbeat : trier les
  commentaires/DM entrants des 6 plateformes, rédiger des réponses EN BROUILLON
  uniquement, et router vers approbation board. NE JAMAIS publier ni envoyer un
  message sortant à un utilisateur réel. Escalader sentiment négatif / crise.
---

## Procédure de heartbeat
1. `GET /api/agents/me` — vérifier identité + budget. Si budget > 80 % : critique seulement.
2. `GET /api/agents/me/inbox-lite` — lire mes Issues (priorité in_progress → in_review → todo).
3. Récupérer les nouveaux commentaires/DM via l'API insights de chaque plateforme
   (token via Paperclip secrets, §10). NE PAS appeler d'endpoint d'envoi.
4. Pour chaque item : rédiger une réponse en BROUILLON, ton « Max-Morrys » (voix du
   PROMPT MAÎTRE, §10), et la déposer en commentaire sur l'Issue correspondante.
5. Regrouper tous les brouillons sortants dans UNE demande d'approbation :
   `POST /api/companies/{companyId}/approvals` (type request_board_approval).
6. Si sentiment négatif / mention de crise / plainte RGPD : `priority=urgent`,
   mention @CMO, et stop — ne rien drafter publiquement.
7. `PATCH /api/issues/{id}` (header X-Paperclip-Run-Id) pour mettre à jour le statut.

## Red lines (NON négociables)
- AUCUN envoi/publication. Brouillons + approbation board, point.
- AUCUNE donnée personnelle d'utilisateur recopiée dans un commentaire (RGPD).
- AUCUN token plateforme en clair dans un commentaire ou une Issue.

## Outils autorisés
- API plateformes : lecture seule (insights, commentaires). Endpoints d'envoi INTERDITS.
- Paperclip API : inbox, issues, comments, approvals.

## Escalade
- Crise / sentiment négatif viral → @CMO + priority=urgent.
- Doute brand-safety → ne pas drafter, demander au CMO.
```

**Gabarit pour les 9 autres skills** (`soc-cmo`, `soc-strategist`, `soc-listening`,
`soc-shortform`, `soc-copywriter`, `soc-designer`, `soc-youtube`, `soc-paid`, `soc-analytics`) :
même structure (frontmatter `name`/`description` + *Procédure de heartbeat* + *Red lines* + *Outils
autorisés* + *Escalade*). Deltas clés par rôle :

- **`soc-cmo`** : ne fait **pas** d'IC ; lit le dashboard, met à jour le board memo, **filtre les
  approbations** avant de les remonter au board, ré-assigne/débloque, déclenche l'extension (§14).
- **`soc-strategist`** : produit le calendrier éditorial 4 semaines + plan paid ; crée des Issues
  `P-CONTENT`/`P-PAID` avec `goalId` correct ; aucune publication.
- **`soc-listening`** : veille (sentiment, tendances, concurrents, mots-clés) ; **lecture seule** ;
  rapport hebdo en work-product ; jamais d'interaction sortante.
- **`soc-youtube`** : exploite `PROMPTS_YOUTUBE_MAXMORRYS.md` (P0–P10) + `.ics` ; respecte la cadence
  (script lun, Shorts mar, métadonnées mer, publication **sam 19h Dakar** — *en brouillon
  programmé, jamais auto-publié sans approbation*).
- **`soc-paid`** : **aucune** dépense sans approbation board avec **gate $ par campagne** ; calcule
  CAC/ROAS prévisionnel ; toute mise en ligne passe par `approvals`.
- **`soc-analytics`** : lit K1–K4 + NSM (§4), vérifie l'attribution UTM, produit le rapport ;
  lève un blocker si UTM manquant.

---

## §8 — Heartbeats (routines cron)

Les **routines** sont la mécanique de heartbeat planifiée (`skills/paperclip/SKILL.md`,
`doc/CLI.md`) : triggers `schedule`(cron) / `webhook` / `api`, avec `concurrencyPolicy` et
`catchUpPolicy`. Chaque tir crée une *execution-issue* assignée à l'agent. Un heartbeat agent est
aussi déclenché *event-driven* (assignation, mention, approbation résolue, blocker levé).

**Cadence alignée sur le cycle réel de chaque fonction** :

| Agent | Cron (UTC) | Justification | Event-wakes additionnels |
|---|---|---|---|
| CMO | `0 8 * * *` | Stratégie au jour ; approbations doivent réveiller vite | approbation résolue, mention |
| Strategist | `0 7 * * 1,4` | Cycle de planif ~2×/sem | — |
| Community Mgr | `0 8,12,16,20 * * *` | Engagement = rapide (fenêtre 08–22 Dakar = 08–22 UTC) | nouveau commentaire (webhook) |
| Insights Analyst | `0 6 * * *` | Veille quotidienne | — |
| Short-form Lead | *(pas de cron)* | Pur event-driven (issue-assign) | issue-assign, mention |
| Copywriter | *(pas de cron)* | Event-driven | issue-assign |
| Designer | *(pas de cron)* | Event-driven | issue-assign |
| YouTube Producer | `0 9 * * 1` | Aligné « lundi = génération de script » du `.ics` | issue-assign |
| Paid Marketer | `0 9 * * 1` | Revue paid hebdo | approbation campagne résolue |
| Analytics Lead | `0 16 * * 5` + `0 9 1 * *` | Rapport hebdo (ven) + board memo mensuel | — |

> **Dakar = UTC±0** (`Africa/Dakar`, GMT+0) : les crons UTC tombent à l'heure locale Dakar — pratique,
> la publication YouTube « samedi 19h Dakar » du `.ics` = `19:00 UTC` samedi.

**Création d'une routine** (CLI validée) :

```bash
$PCLI routine create --company-id $CID --api-key "$BOARD_TOKEN" --payload-json '{
  "agentId":"<COMMUNITY_ID>",
  "title":"Heartbeat Community (4h)",
  "trigger":{"type":"schedule","schedule":"0 8,12,16,20 * * *"},
  "concurrencyPolicy":"forbid",
  "catchUpPolicy":"skip"
}'
```

> **`[UNVERIFIED]` — nom exact des clés `trigger`/`concurrencyPolicy`/`catchUpPolicy` dans le payload.**
> Les concepts sont confirmés (`skills/paperclip/SKILL.md` § *Routines*) mais le schéma JSON littéral
> est dans `references/`. **À vérifier** : `pnpm paperclipai routine create --help` post-install.

---

## §9 — Plan de budget

**Enveloppe : $1 800 / mois** (« >$1500 flexible » → dimensionné capacité). Règles plateforme
confirmées (`skills/paperclip/SKILL.md`) : **warn à 80 %** (« focus critical only »),
**auto-pause à 100 %**.

**Répartition par agent + seuils** :

| Agent | $/mo | Warn 80 % | Hard-stop 100 % | Tier modèle |
|---|---|---|---|---|
| CMO | $300 | $240 | $300 | Opus (raisonnement stratégique) |
| Strategist | $220 | $176 | $220 | Sonnet |
| Community Mgr | $180 | $144 | $180 | Haiku (volume, tâche cadrée) |
| Insights Analyst | $150 | $120 | $150 | Gemini 2.5-flash (coût/veille) |
| Short-form Lead | $180 | $144 | $180 | Sonnet |
| Copywriter | $120 | $96 | $120 | Gemini 2.5-pro |
| Designer | $120 | $96 | $120 | Sonnet |
| YouTube Producer | $160 | $128 | $160 | Sonnet |
| Paid Marketer | $130 | $104 | $130 | Sonnet |
| Analytics Lead | $90 | $72 | $90 | Haiku |
| Buffer | $50 | — | — | — (board-approval pour puiser) |
| **Total** | **$1 800** | | | |

**Application** (CLI budget validée) :

```bash
# Politique de company (warn 80 / hard-stop 100)
$PCLI budget company:update --company-id $CID --api-key "$BOARD_TOKEN" \
  --payload-json '{"monthlyUsd":1800,"warnPct":80,"hardStopPct":100}'

# Politique par agent
$PCLI budget policy:upsert --company-id $CID --api-key "$BOARD_TOKEN" \
  --payload-json '{"agentId":"<CMO_ID>","monthlyUsd":300,"warnPct":80,"hardStopPct":100}'

# Suivi
$PCLI budget overview --company-id $CID --api-key "$BOARD_TOKEN" --json
$PCLI cost by-agent --company-id $CID --api-key "$BOARD_TOKEN" --json
```

> **`[UNVERIFIED]` — clés exactes `monthlyUsd/warnPct/hardStopPct`.** Commandes `budget
> company:update` / `budget policy:upsert` confirmées (`doc/CLI.md`) ; noms de champs à confirmer via
> `pnpm paperclipai budget policy:upsert --help`.

**Burn-down 4 semaines (cible)** : S1 ≤ 20 % ($360, setup + premiers contenus), S2 ≤ 45 %, S3 ≤ 70 %,
S4 ≤ 95 % (laisser 5 % de marge). L'Analytics Lead remonte un blocker si la pente dépasse +15 % vs
la cible hebdo.

**Défense en profondeur (plafond côté provider)** — *en plus* des limites Paperclip :
- **Anthropic Console** : workspace spend limit = $1 200/mo (part Claude). `[UNVERIFIED]` chemin UI
  exact (la console évolue) → **vérifier** dans *Settings → Limits/Workspaces*.
- **Google AI Studio / Gemini** : quota projet plafonné (part Gemini ≈ $300/mo).
Ainsi, un bug du control-plane Paperclip ne peut pas dépasser le plafond provider.

---

## §10 — Gouvernance & red lines spécifiques au social

> **Hérite** du squelette de gouvernance + kill-switch de `PAPERCLIP_SETUP_GUIDE.md` **§9**.
> Ci-dessous **uniquement** le delta social.

**Red lines (codées dans chaque SKILL.md + à inscrire dans la charte company)** :

| # | Red line | Mécanisme d'enforcement |
|---|---|---|
| R1 | **Aucune publication sur un compte de marque live** sans approbation board | Brouillons only ; `approvals` obligatoire ; **WF-SOCIAL-05 reste INACTIF** (garde-fou infra, §11) |
| R2 | **Aucune dépense paid** sans approbation, **gate $ par campagne** | `soc-paid` : tout passe par `POST /approvals` avec montant ; aucun token d'ads write côté agent |
| R3 | **Aucun DM/réponse sortant** à un utilisateur réel sans approbation | `soc-community` : endpoints d'envoi interdits ; brouillons + approbation |
| R4 | **Brand-safety & ton** | Voix « Max-Morrys » du PROMPT MAÎTRE (`PROMPTS_YOUTUBE_MAXMORRYS.md`) ; CMO valide le ton |
| R5 | **RGPD** | Pas de données perso recopiées dans Issues/commentaires ; minimisation |
| R6 | **Secrets tokens plateformes** | Stockés chiffrés via Paperclip `secrets` — **jamais** en commentaire/Issue |

**Gestion des secrets plateformes** (CLI `secrets` validée) — délègue le chiffrement à Paperclip :

```bash
# Tokens des APIs natives (un set par plateforme — aucun token d'agrégateur tiers).
# Charger chaque token depuis une env var (jamais en clair sur la ligne de commande de log).
export META_TOKEN="…"        # Meta Graph (IG + Page FB), token longue durée
export TIKTOK_TOKEN="…"      # TikTok Content Posting API (app review requise)
export YT_REFRESH_TOKEN="…"  # YouTube Data API v3 (OAuth refresh token)
export LINKEDIN_TOKEN="…"    # LinkedIn Posts API (scope w_member_social)
export X_TOKEN="…"           # X API v2 (tier payant pour write)

for s in META_TOKEN TIKTOK_TOKEN YT_REFRESH_TOKEN LINKEDIN_TOKEN X_TOKEN; do
  $PCLI secrets create --company-id $CID --api-key "$BOARD_TOKEN" \
    --name "$s" --value-env "$s"
done
$PCLI secrets doctor --company-id $CID --api-key "$BOARD_TOKEN"
```

> Les agents référencent ces secrets **par nom** ; ils n'en voient jamais la valeur en clair dans une
> Issue. `secrets create --value-env <VAR>` et `secrets doctor` sont confirmés (`doc/CLI.md`).

**Approbations board** (le seul chemin vers le monde réel) :

```bash
# Côté agent (dans le skill) :
POST /api/companies/$CID/approvals   # type: request_board_approval, payload = lot de brouillons / budget campagne
# Côté board (toi) :
$PCLI approval list --company-id $CID --api-key "$BOARD_TOKEN" --status pending --json
$PCLI approval approve <APPROVAL_ID> --api-key "$BOARD_TOKEN"   # ou: reject / request-revision
```

---

## §11 — Intégration n8n / Airtable / APIs natives (couche « mains »)

Les agents Paperclip pilotent le pipeline existant **par HTTP** (les adapters `claude-local` /
`gemini-local` ont un runtime shell → `curl`). Référence : `n8n_airtable_infra.md`.
**Décision 2026-06-27 : la publication n'utilise PAS d'agrégateur tiers (pas de Blotato)** — elle
appelle directement les **APIs natives** de chaque plateforme depuis n8n.

**Mapping pipeline ↔ Paperclip** :

| Étape | Workflow n8n | État Airtable (`tblPYoyzcZLdtBTO3`) | Agent Paperclip responsable |
|---|---|---|---|
| Idéation | WF-SOCIAL-01 `wJDQo9PjaT7RSJkw` | `idée` | Strategist / Insights |
| Planif | WF-SOCIAL-02 `5ynAS12PX2x4o2BV` | `planifié` | Strategist |
| Rédaction | WF-SOCIAL-03 `k9vnobzVadNeU3tk` | `rédigé` | Copywriter |
| Visuels | WF-SOCIAL-04 `774G38cqIvZsJUHm` | `visuel prêt` | Designer |
| **Publication** | WF-SOCIAL-05 `wrRa0I7tYAsPJSOA` **(INACTIF)** — **à reconstruire en APIs natives** | `validé` → `publié` | **Board uniquement** (R1) |
| Tracking | WF-SOCIAL-06 `TLnJDukLRM3zyL65` (inactif) | `publié` | Analytics Lead |

**Publication par APIs natives** (WF-SOCIAL-05, un nœud HTTP par plateforme, à la place des nœuds
Blotato) :

| Plateforme | API | Flux de publication |
|---|---|---|
| **Instagram** | Meta Graph API | `POST /{ig-user-id}/media` (crée le container) → `POST /{ig-user-id}/media_publish` |
| **Facebook Page** | Meta Graph API | `POST /{page-id}/feed` (texte/lien) ou `/photos` `/videos` |
| **TikTok** | Content Posting API | `POST /v2/post/publish/video/init/` (Direct Post — app review requise) `[UNVERIFIED]` chemin exact selon version d'API |
| **YouTube** | Data API v3 | `videos.insert` (upload résumable, OAuth, ~1600 quota units/vidéo) |
| **LinkedIn** | Posts API | `POST /rest/posts` (URN membre/org, scope `w_member_social`) |
| **X** | API v2 | `POST /2/tweets` (+ media upload ; **tier payant** pour l'écriture) |

> Tokens via Paperclip `secrets` (§10), jamais en clair. YouTube/Meta utilisent des **refresh
> tokens** (renouvellement OAuth) ; le nœud n8n doit rafraîchir avant chaque publication.

**Le garde-fou anti-auto-publication demeure** : WF-SOCIAL-05/06 restent **INACTIFS** ⇒ rien ne peut
s'auto-publier. On **garde** cet état tant que la gouvernance R1 n'est pas rodée. La publication =
action manuelle board (reconstruire puis activer WF-05 après approbation), pas une action agent.
*(Le verrou passe simplement de « `BLOTATO_ACCOUNTS=__FILL_ME__` » à « workflow non reconstruit/non
activé » — même effet : pas de publication automatique.)*

**Appels types depuis un skill** (base Airtable `apppkEbepilHCYiso`) :

```bash
# Lire la file de contenus à l'état "rédigé"
curl -fsS -H "Authorization: Bearer $AIRTABLE_PAT" \
  "https://api.airtable.com/v0/apppkEbepilHCYiso/tblPYoyzcZLdtBTO3?filterByFormula=Statut%3D'rédigé'"

# Déclencher un workflow n8n (ex. Visuels) — modèles Gemini validés gemini-2.5-flash-image-preview
curl -fsS -X POST -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "https://eyonemedical.app.n8n.cloud/api/v1/workflows/774G38cqIvZsJUHm/activate"

# Exemple publication native (IG, board-gated) — création du container puis publish :
curl -fsS -X POST "https://graph.facebook.com/v21.0/$IG_USER_ID/media" \
  -d "image_url=$ASSET_URL" -d "caption=$CAPTION" -d "access_token=$META_TOKEN"
# → renvoie {creation_id}; puis:
curl -fsS -X POST "https://graph.facebook.com/v21.0/$IG_USER_ID/media_publish" \
  -d "creation_id=$CREATION_ID" -d "access_token=$META_TOKEN"
```

> **Gotchas hérités** (`n8n_airtable_infra.md`) : l'API n8n PUT `/workflows/{id}` n'accepte que
> `name, nodes, connections, settings, staticData` ; l'**activation** d'un workflow par l'agent est
> bloquée par le classifieur d'auto-approbation → **activation manuelle board** (cohérent avec R1).
> Modèles Gemini cassés à NE PAS utiliser : `gemini-3-*` (cf. mémoire).

---

## §12 — Runbook Day-0 (heure par heure) & plan Semaine 1→4

**Day-0 (≈ 4 h, board présent)** :

| H | Action | Commande / contrôle |
|---|---|---|
| H+0 | Vérifier l'instance | `curl $PC_API/api/health` → `ok` |
| H+0:15 | Board token + company `SOC` | §3 |
| H+0:45 | Secrets plateformes | §10 (`secrets create` × 6, `secrets doctor`) |
| H+1:15 | Goals + Projects + Issues seed | §6 |
| H+2:00 | Embaucher les 10 agents (CMO d'abord) | §5 |
| H+2:45 | Importer & sync les 10 SKILL.md | §7 |
| H+3:15 | Créer les routines (heartbeats) | §8 |
| H+3:45 | Budgets (company + par agent) + plafond provider | §9 |
| H+4:00 | **Smoke test E2E** + réveil manuel du CMO | §16 |

```bash
# Réveil manuel du CMO pour le premier heartbeat
$PCLI agent wake $CMO_ID --reason "Day-0 kickoff" --api-key "$BOARD_TOKEN"
```

**Semaine 1→4** :

- **S1 — Calibrage** : production en **brouillons only**, R1–R6 strictement. Le board approuve/refine
  chaque lot ; on mesure le taux d'approbation. Cible budget ≤ 20 %.
- **S2 — Rythme** : calendrier éditorial 6 canaux actif ; veille hebdo ; 1er rapport Analytics.
  Première campagne paid **proposée** (pas lancée). ≤ 45 %.
- **S3 — Première publication contrôlée** : après ≥ 2 semaines de brouillons sans incident, le board
  active WF-SOCIAL-05 pour **un** canal pilote, publication manuelle approuvée. ≤ 70 %.
- **S4 — Bilan & itération** : board memo mensuel (Analytics) ; revue NSM/K1–K4 ; décision d'étendre
  la publication à d'autres canaux. ≤ 95 %.

**Stop-loss (déclencheurs d'arrêt immédiat)** :
- Budget company à 100 % → auto-pause (Paperclip) ; ne pas relever sans revue.
- > 2 brouillons hors-marque approuvés par erreur → suspendre le canal, re-calibrer le ton.
- Toute publication non approuvée détectée → `agent pause` global + post-mortem (§13).

---

## §13 — Failure modes & recovery (delta social)

> Hérite des failure modes génériques de `PAPERCLIP_SETUP_GUIDE.md` §12.

| Mode | Symptôme | Recovery |
|---|---|---|
| **Comment storm** | Crise virale, afflux de commentaires négatifs | `soc-community` escalade @CMO (R-line), **stop drafting** ; board prend la main ; pas de réponse auto |
| **Boucle infinie** | Deux agents se relancent (mention ping-pong) | `routine` `concurrencyPolicy:forbid` ; CMO détecte via `run live` ; `agent pause` du fautif |
| **Appel API halluciné** | Agent invente un endpoint plateforme | Skills listent les endpoints autorisés (read-only) ; échec → blocker, pas de retry aveugle ; `run log` |
| **Fuite de secret** | Token aperçu dans une Issue/commentaire | Révoquer : `secrets` rotation + révoquer le token plateforme ; purger l'Issue ; post-mortem RGPD |
| **Brouillon hors-marque** | Ton/contenu non conforme | Le board **reject** l'approbation (`approval reject`) ; le ton est re-précisé dans le SKILL.md ; re-sync |
| **Auto-publish accidentel** | Contenu parti sans approbation | WF-SOCIAL-05 re-désactivé immédiatement ; `agent pause` ; revue de la chaîne d'approbation |

```bash
# Kill-switch gradué (hérité §9 du guide existant)
$PCLI agent pause <AGENT_ID> --api-key "$BOARD_TOKEN"      # 1 agent
# … company entière : voir §9 du guide infra (pause company / systemctl stop paperclip)
```

---

## §14 — Roadmap d'extension

1. **Activer la publication multi-canal** (après rodage R1) : reconstruire WF-SOCIAL-05 avec les
   nœuds **APIs natives** (§11), activer WF-SOCIAL-05/06, déléguer la **programmation** (pas
   l'auto-publish) aux agents.
2. **Boucle d'attribution fermée** : brancher K3/K4 sur PostHog/Umami (Phase 3 de
   `oss_tools_roadmap.md`) pour une attribution social → signup plus fine que GSC+UTM.
3. **RAG veille** : indexer le rapport Insights dans Qdrant/pgvector (Phase 2 roadmap) pour mémoire
   concurrentielle persistante.
4. **11ᵉ rôle — Partnerships/Influence** quand le board valide un budget d'influence dédié.
5. **A/B testing de hooks** piloté par l'Analytics Lead (variantes d'Issues sur G-REACH).

---

## §15 — ⚠️ Reality vs. Spec

Corrections effectuées face au **repo réel** (`master`, 2026-06-25) et au brief initial :

| Affirmation (brief / intuition) | Réalité repo | Source |
|---|---|---|
| « tickets » | Primitive = **Issues** (`{PREFIX}-{N}`, ex. `SOC-1`) | `skills/paperclip/SKILL.md` |
| « SKILLS.md » | `skills/<slug>/SKILL.md` (**singulier**, 1 dossier/skill) | `skills/paperclip/SKILL.md` |
| Hiérarchie « Mission→Project→Agent goal→Task » | Réel : **Company → Goals + Projects → Issues** ; une Issue lie `goalId` **et** `projectId` ; pas d'entité « agent goal » | `doc/PRODUCT.md` |
| Adapters (guide dev-team) `claude/codex/cursor/gemini/opencode/pi/acpx/openclaw` | Liste réelle `master` ajoute **`cursor-cloud`** et **`grok-local`** : `acpx-local, claude-local, codex-local, cursor-cloud, cursor-local, gemini-local, grok-local, openclaw-gateway, opencode-local, pi-local` | `packages/adapters/` (tree) |
| CLI = `npx paperclipai onboard …` flou | CLI riche `pnpm paperclipai <noun> <verb>` : nouns dédiés `company/goal/project/issue/agent/skills/routine/budget/cost/finance/secrets/approval/token/run/dashboard` | `doc/CLI.md` |
| « Heartbeat = primitive séparée » | Heartbeats = **routines** (cron/webhook/api) + wakes event-driven ; chaque tir crée une execution-issue | `skills/paperclip/SKILL.md` §Routines |
| « Plafonner via console provider seulement » | Budget natif Paperclip : `budget company:update` / `budget policy:upsert` / `budget overview` ; warn 80 % / auto-pause 100 % | `doc/CLI.md`, `skills/paperclip/SKILL.md` |
| Bind/port supposés | Port **3100**, bind `loopback|lan|tailnet|custom` ; `loopback` derrière reverse proxy recommandé | `AGENTS.md`, `doc/DEPLOYMENT-MODES.md` |

**Items `[UNVERIFIED]` (et comment les lever)** :

1. Schéma JSON exact de `company create` / `agent create|hire` / `routine create` / `budget
   policy:upsert` (champs confirmés, clés littérales non publiées hors-repo) → `pnpm paperclipai
   <noun> <verb> --help` et `references/api-reference.md` (dispo **après install**).
2. IDs de modèles par adapter (`opus-4-8`/`sonnet-4-6`/`haiku-4-5`) → `pnpm paperclipai adapter
   models claude-local`.
3. **MCP Canva/Drive/Notion dans le runtime adapter du VPS** (≠ session claude.ai) →
   `pnpm paperclipai adapter config-schema claude-local` + `plugin tools <id>`. Fallback : WF-SOCIAL-04.
4. Chemins UI exacts des plafonds Anthropic Console / Google AI Studio (les consoles évoluent).

Sources (toutes `github.com/paperclipai/paperclip/blob/master/…`) : `AGENTS.md`,
`skills/paperclip/SKILL.md`, `doc/PRODUCT.md`, `doc/CLI.md`, `doc/DEPLOYMENT-MODES.md`,
`packages/adapters/` (tree). Doc publique `docs.paperclip.ing` non fiable → **autorité = repo**.

### §15bis — Vérifié À L'EXÉCUTION sur l'instance locale (2026-06-25, build `2026.618.0`)

Setup réellement effectué contre l'API REST de l'instance (`http://localhost:3100`, mode
`local_trusted` → **aucune auth requise sur localhost**, pas de board token nécessaire). Corrections
qui **lèvent** des `[UNVERIFIED]` ci-dessus :

| Sujet | Réalité observée (API live) |
|---|---|
| **Budget** | Champ `budgetMonthlyCents` (en **centimes**, pas `monthlyUsd`). $1 800 = `180000`. Posé à la création company + par agent. |
| **Préfixe d'Issues** | **Auto-dérivé du nom**, immuable : « Maxmorrys Social » → **`MAX`** (pas `SOC`). Le PATCH `issuePrefix` est ignoré. Issues = `MAX-1`…`MAX-8`. |
| **Adapters** | Types en **underscore** : `claude_local`, `gemini_local`, `codex_local`, `cursor`, `grok_local`, `acpx_local`, `hermes_local`, `opencode_local`, `pi_local`, `http`, `process`, `cursor_cloud`, `openclaw_gateway`. Tous `loaded`. |
| **Modèles** | `claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gemini-2.5-flash`, `gemini-2.5-pro` acceptés. |
| **Org chain** | Champ **`reportsTo`** (UUID du boss), pas `chainOfCommand`. |
| **Création d'agent** | Gatée par `requireBoardApprovalForNewAgents:true` → `POST /api/companies/{cid}/agent-hires` crée l'agent en `pending_approval` + une approbation `hire_agent`, puis **`POST /api/approvals/{approvalId}/approve`**. |
| **`icon`** | Enum strict (`bot, brain, rocket, target, radar, crown, telescope, microscope, wand, gem, star, message-square, …`) — valeur hors-liste → 400. |
| **Heartbeat** | Dans `runtimeConfig.heartbeat` `{enabled,intervalSec,wakeOnDemand,maxConcurrentRuns}`. **⚠️ Piège** : `wakeOnDemand:true` + **assigner une Issue réveille l'agent immédiatement**, même avec `enabled:false`. Pour un vrai « hold », créer les Issues **non assignées** ou créer les agents **paused**. |
| **Goals / Projects** | Goal : champ **`title`** (pas `name`). Project : `name` + `goalIds[]`. Issue : `title,description,projectId,goalId,assigneeAgentId,priority,status`. |
| **`capabilities`** | Paragraphe de rôle posé via **`PATCH /api/agents/{id}`** (top-level, pas sous `/companies/`). |
| **Company skills** | `POST /api/companies/{cid}/skills` (slug/name/description) OK ; pas d'endpoint REST trouvé pour **poser le corps SKILL.md** → fichiers sur disque + import CLI. |
| **Spend `claude_local`/`gemini_local`** | `spentMonthlyCents` reste `0` : ces adapters passent par les **CLI locales** (Claude Code / Gemini), non métrées en \$ par Paperclip → le plafond \$ Paperclip ne s'applique **pas** à ces adapters. La défense en profondeur **provider-side** (§9) est donc d'autant plus importante. |
| **Publication** | **APIs natives des plateformes** (Meta Graph, TikTok Content Posting, YouTube Data v3, LinkedIn Posts, X v2) — **pas Blotato** (décision user 2026-06-27). Aucun agrégateur tiers. WF-SOCIAL-05 à reconstruire en nœuds HTTP natifs ; reste inactif = garde-fou (§11). |

---

## §16 — Smoke test E2E

À exécuter une fois l'instance up (port 3100 ; via tunnel, remplace par
`https://paperclip.maxmorrys.me`). Toutes les routes proviennent de
`AGENTS.md` / `skills/paperclip/SKILL.md` / `doc/CLI.md`.

```bash
set -euo pipefail
export PC_API="http://localhost:3100"
export BOARD_TOKEN="…"   # pnpm paperclipai token board create

# 1. Service vivant
curl -fsS "$PC_API/api/health" | jq .                         # => {"status":"ok"}

# 2. Company SOC présente
curl -fsS -H "Authorization: Bearer $BOARD_TOKEN" \
  "$PC_API/api/companies" | jq '.[] | select(.slug=="maxmorrys-social") | {id,issuePrefix}'
export CID="…"   # id renvoyé ci-dessus

# 3. 10 agents + leurs skills
curl -fsS -H "Authorization: Bearer $BOARD_TOKEN" \
  "$PC_API/api/companies/$CID/agents" | jq '[.[] | {title, skills:[.skills[].name]}]'

# 4. Goals (funnel) + Projects (fonctions)
pnpm paperclipai goal    list --company-id "$CID" --api-key "$BOARD_TOKEN" --json | jq '[.[].key]'
pnpm paperclipai project list --company-id "$CID" --api-key "$BOARD_TOKEN" --json | jq '[.[].name]'

# 5. Routines (heartbeats) actives
pnpm paperclipai routine list --company-id "$CID" --api-key "$BOARD_TOKEN" --json | jq '[.[].title]'

# 6. Budgets en place (warn 80 / hard-stop 100)
pnpm paperclipai budget overview --company-id "$CID" --api-key "$BOARD_TOKEN" --json

# 7. Secrets plateformes déclarés (valeurs JAMAIS exposées)
pnpm paperclipai secrets doctor --company-id "$CID" --api-key "$BOARD_TOKEN"

# 8. Déclencher le 1er heartbeat du CMO et lire le run
pnpm paperclipai agent wake "$CMO_ID" --reason "smoke-test" --api-key "$BOARD_TOKEN"
pnpm paperclipai run live --company-id "$CID" --api-key "$BOARD_TOKEN" --json | jq '.[0]'

# 9. Vérifier qu'aucune approbation n'a été auto-validée (R1)
pnpm paperclipai approval list --company-id "$CID" --status pending --api-key "$BOARD_TOKEN" --json
```

**Critère de succès** : (1) `health=ok` ; (2) company `SOC` avec `issuePrefix:"SOC"` ; (3) 10 agents,
chacun avec son skill `soc-*` ; (4) 5 goals + 7 projects ; (5) routines listées ; (6) budget = $1 800
warn 80/stop 100 ; (7) `secrets doctor` OK sans fuite ; (8) un run CMO démarre ; (9) toute action
réelle reste **en attente d'approbation** (aucune publication/dépense auto).

---

*Fin du guide. Infra (VPS/systemd/tunnel/secrets/kill-switch) : voir
[`PAPERCLIP_SETUP_GUIDE.md`](./PAPERCLIP_SETUP_GUIDE.md). Pipeline production : voir
`n8n_airtable_infra.md`. Assets contenu : `PROMPTS_YOUTUBE_MAXMORRYS.md` +
`calendrier-prompts-youtube-maxmorrys.ics`.*
