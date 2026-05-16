# PAPERCLIP_SETUP_GUIDE.md

> Operator: max.eyoum@eyone.net · Date: 2026-05-01 · Target: maxmorrys.me
> Validated against [paperclipai/paperclip@master](https://github.com/paperclipai/paperclip) ([AGENTS.md](https://github.com/paperclipai/paperclip/blob/master/AGENTS.md), [skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md), [doc/PRODUCT.md](https://github.com/paperclipai/paperclip/blob/master/doc/PRODUCT.md), [doc/CLI.md](https://github.com/paperclipai/paperclip/blob/master/doc/CLI.md), [doc/DEPLOYMENT-MODES.md](https://github.com/paperclipai/paperclip/blob/master/doc/DEPLOYMENT-MODES.md), [doc/DOCKER.md](https://github.com/paperclipai/paperclip/blob/master/doc/DOCKER.md))

---

## 1. Executive Summary

- **Company**: Maxmorrys SAS — French-language e-learning Club + Rysmo AI coach.
- **Mission**: Reach **€10,000 MRR within 6 months (target: 2026-11-01)** by growing the existing maxmorrys.me Club subscription and Rysmo upsell.
- **North-star metric**: Active paying Club members.
- **Org size on Day 1**: 1 board (you) + 4 agents (CEO + Growth + Engineer + Success).
- **Monthly burn cap**: $500 USD, hard-stop. Time-to-first-revenue hypothesis: revenue exists today; first incremental MRR uplift within 14 days.

---

## 2. Pre-flight Checklist

### Host (cloud VPS + Postgres) — verified requirements
- [ ] Linux VPS, 2 vCPU / 4 GB RAM minimum, 40 GB disk (Hetzner CX22 ≈ €4.50/mo, Fly.io shared-cpu-2x, Railway 2GB).
- [ ] **Node.js 20+, pnpm 9.15+** ([AGENTS.md §4](https://github.com/paperclipai/paperclip/blob/master/AGENTS.md)).
- [ ] **Postgres 15+** (managed: Neon free tier, Supabase free tier, or Hetzner managed). `DATABASE_URL` must be set in cloud mode — PGlite is dev-only.
- [ ] HTTPS reverse proxy (Caddy 2.x or Cloudflare Tunnel — Tunnel is simpler and free).
- [ ] Domain or subdomain you control (e.g. `paperclip.maxmorrys.me`).

### Accounts / API keys (locked: Anthropic-only per Q3b)
- [ ] **Anthropic API key** (console.anthropic.com → API Keys). Set monthly spend limit on the Anthropic side to **$500** as a second-layer hard-stop.
- [ ] GitHub PAT scoped to the `maxmorrys.me-main` repo (read+write, no admin).
- [ ] Firebase service-account JSON (read-only on Firestore for analytics; write only on a sandbox collection until promoted).
- [ ] (Optional) Mailgun/Postmark API key — keep disabled until customer-contact red line lifts (see §9).

### Secrets handling — what the platform does for you
Per [AGENTS.md §8](https://github.com/paperclipai/paperclip/blob/master/AGENTS.md) and the run-flow described in `skills/paperclip/SKILL.md`:
- Agent API keys are **hashed at rest** (`agent_api_keys` table).
- Local-runtime adapters auto-inject a **short-lived run JWT** as `PAPERCLIP_API_KEY`. Never paste long-lived keys into agent configs.
- Company export/import performs **secret scrubbing** ([doc/PRODUCT.md](https://github.com/paperclipai/paperclip/blob/master/doc/PRODUCT.md)) — backups are safe to share with another agent.
- Provider keys (Anthropic) are stored encrypted on the server and **only injected into the adapter subprocess**.
- Telemetry off: `PAPERCLIP_TELEMETRY_DISABLED=1` and `DO_NOT_TRACK=1` in the systemd unit (§3).

### What you must do yourself
- Pin the Anthropic key behind a workspace-only env file (`/etc/paperclip/env`, mode `600`, owned by the paperclip system user).
- Set Firebase service account to read-only roles; agents must request write capability via approval.
- Never commit `.paperclip/` to the maxmorrys.me repo (add to `.gitignore`).

---

## 3. Installation

### 3.1 — Provision the VPS (one-time)

```bash
# On a fresh Ubuntu 24.04 LTS box, as root
adduser --disabled-password --gecos "" paperclip
usermod -aG sudo paperclip
apt update && apt install -y curl ca-certificates git ufw
ufw allow OpenSSH && ufw allow 443/tcp && ufw --force enable
# Node 20 + pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
corepack enable && corepack prepare pnpm@9.15.0 --activate
```

### 3.2 — Install Paperclip

Two paths. Path A is the official quickstart; Path B is what you want for cloud (gives you full source for plugins/skills).

**Path A — onboard CLI (validated in [doc/CLI.md](https://github.com/paperclipai/paperclip/blob/master/doc/CLI.md))**:

```bash
sudo -iu paperclip
PAPERCLIP_TELEMETRY_DISABLED=1 npx paperclipai onboard --yes --bind lan
```

**Path B — clone + dev (recommended for VPS, gives you SKILL.md edit access)**:

```bash
sudo -iu paperclip
git clone https://github.com/paperclipai/paperclip.git ~/paperclip
cd ~/paperclip
pnpm install
# Cloud: point at managed Postgres (replace with Neon/Supabase URL)
echo 'DATABASE_URL=postgresql://USER:PASS@HOST:5432/paperclip?sslmode=require' >> .env
echo 'PAPERCLIP_TELEMETRY_DISABLED=1' >> .env
echo 'DO_NOT_TRACK=1' >> .env
echo 'ANTHROPIC_API_KEY=sk-ant-...' >> .env
chmod 600 .env
pnpm db:generate && pnpm db:migrate
pnpm build
```

### 3.3 — systemd unit (production)

`/etc/systemd/system/paperclip.service`:

```ini
[Unit]
Description=Paperclip control plane
After=network-online.target

[Service]
Type=simple
User=paperclip
WorkingDirectory=/home/paperclip/paperclip
EnvironmentFile=/home/paperclip/paperclip/.env
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload && systemctl enable --now paperclip
```

### 3.4 — Reverse proxy (Cloudflare Tunnel, simplest)

```bash
# As root
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared.deb
cloudflared tunnel login
cloudflared tunnel create paperclip
# Point hostname paperclip.maxmorrys.me at http://localhost:3100
cloudflared service install <token>
```

### 3.5 — First-run onboarding (browser)

Open `https://paperclip.maxmorrys.me`. The onboarding flow ([doc/CLI.md](https://github.com/paperclipai/paperclip/blob/master/doc/CLI.md)) walks through:
1. **Create board user** — your email, set a passphrase.
2. **Create company** — name "Maxmorrys", slug `MAX` (becomes the issue prefix `MAX-1`, `MAX-2`…).
3. **Add Anthropic provider key** — paste once; stored encrypted server-side.
4. **Create CEO agent** (see §4–5).
5. **Set company budget** — €0/$500 cap (board-level, separate from per-agent).

### 3.6 — Health check (verified in [AGENTS.md §4](https://github.com/paperclipai/paperclip/blob/master/AGENTS.md))

```bash
curl https://paperclip.maxmorrys.me/api/health
curl https://paperclip.maxmorrys.me/api/companies   # auth required after onboarding
```

Healthy response is HTTP 200 with `{"status":"ok",...}`.

---

## 4. Company Definition

### Mission (paste this verbatim into the company `mission` field)

> Grow maxmorrys.me from its current state to **€10,000 monthly recurring revenue** by **2026-11-01**, by increasing Club subscription conversions, retention, and Rysmo upsell, while staying inside a $500/month operating budget and never deploying to production, contacting real customers, moving money, or making legal commitments without explicit board approval.

### North-star + supporting KPIs

| KPI | Definition | Source of truth |
|---|---|---|
| **NSM: Paying Club members** | Active subscribers in Stripe at month-end | Stripe → Firestore mirror |
| K1: Free→Paid conversion rate | Quiz/mission completers who upgrade within 14d | Firestore `users` + Stripe |
| K2: Organic sessions / month | Google Search Console clicks | GSC export |
| K3: Rysmo upsell rate | % of Club members who buy a Rysmo session | Firestore `rysmoBookings` |

### Goal tree (paste into the `goals` UI)

```
COMPANY MISSION: €10k MRR by 2026-11-01
├── Project G1: Acquisition (organic)        — owner: Growth Lead
│   ├── Issue: SEO audit of /blog and /videos
│   ├── Issue: Publish 8 SEO articles in May
│   └── Issue: Reduce LCP on /blog/* below 2.0s
├── Project G2: Conversion (free→paid)       — owner: Engineer
│   ├── Issue: Instrument funnel events end-to-end
│   ├── Issue: A/B test Club paywall variants
│   └── Issue: Coupons-server abuse audit
├── Project G3: Retention (paid stay paid)   — owner: Customer Success
│   ├── Issue: Monitor Rysmo answer quality (sample 20/wk)
│   ├── Issue: Draft win-back email sequence (board approves before send)
│   └── Issue: Report churn cohort weekly
└── Project G4: Operations & Reporting       — owner: CEO
    ├── Issue: Weekly board memo (every Monday)
    ├── Issue: Monthly P&L vs. budget
    └── Issue: Hire-#5 trigger criteria doc
```

Every Issue traces upward through Project → Mission ([doc/PRODUCT.md](https://github.com/paperclipai/paperclip/blob/master/doc/PRODUCT.md): *"nothing exists in isolation"*).

---

## 5. Org Chart Design

Lean by design — **CEO + 3 reports**. Justification: (a) $500/mo cap supports ~4 Sonnet-class agents at sustainable cadence; (b) 5+ agents on day 1 risks coordination failure before the goal tree stabilises; (c) the [AGENTS.md](https://github.com/paperclipai/paperclip/blob/master/AGENTS.md) invariants (atomic checkout, single assignee, approval gates) reward small teams.

| Title | Reports to | Adapter | Model | Heartbeat | Monthly $ | Job description (3 lines) | KPIs |
|---|---|---|---|---|---|---|---|
| **CEO** | Board (you) | `claude-local` | Sonnet 4.6 | 24h cron + approval/comment | **$120** | Owns the mission. Sets weekly priorities, reviews KPIs, requests board approvals, hires #5+ when triggers met. Never executes IC work directly. | NSM, K1–K3 |
| **Growth Lead** | CEO | `claude-local` | Sonnet 4.6 | 8h cron + comment | **$150** | Drives Project G1. Audits SEO, briefs articles, posts to socials (drafts only — board approves sends), owns GSC numbers. | K2, organic→signup |
| **Engineer** | CEO | `claude-local` (Claude Code mode) | Sonnet 4.6 | on issue-assign + 12h fallback | **$150** | Drives Project G2. Implements funnel instrumentation, A/B tests, perf fixes. Branches only — no `main` push without board approval. | K1, LCP, error rate |
| **Customer Success** | CEO | `claude-local` | Haiku 4.5 | 12h cron + comment | **$50** | Drives Project G3. Samples Rysmo answers, drafts (never sends) outreach, weekly churn report. | K3, Rysmo quality, churn |
| **Buffer / approvals overhead** | — | — | — | — | **$30** | Reserved: board-approval round-trips, one-shot deep-research runs, retries. | — |
| **Total** | | | | | **$500** | | |

**Math check**: 120 + 150 + 150 + 50 + 30 = **500 ✓**

### Expansion triggers (CEO writes these into Issue MAX-Hire-5)

| Hire # | Title | Trigger | Source of budget |
|---|---|---|---|
| #5 | **Data Analyst** (Haiku 4.5, $40/mo) | NSM stalls 2 consecutive weeks OR funnel data exceeds Engineer's bandwidth | Reduce buffer to $0; if MRR ≥ €4k, raise total cap to $600 (board approval) |
| #6 | **Content IC** (Haiku 4.5, $30/mo) | Growth Lead is content-bottlenecked AND K2 is on track | Same trigger path |
| #7 | **CFO/Finance** (Sonnet, $80/mo) | MRR ≥ €6k AND tax/VAT complexity demands it | New budget tier ($700) — board-only |

### Hiring plan the board (you) approves on Day 1

The CEO's first heartbeat creates Issue **MAX-1: "Day-0 hiring plan"** containing this exact org table, submits a `request_board_approval` ([skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md): *"Requesting Board Approval"* section), and waits in `in_review`. You approve once → CEO creates Growth, Engineer, Success agents.

---

## 6. SKILL.md Pack

Paperclip's actual format is `skills/<slug>/SKILL.md` with YAML frontmatter `name` + `description` (verified against [skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md)). All four skills below are designed to **assign to the corresponding agent via `POST /api/agents/{agentId}/skills/sync`** (not committed to the repo).

### 6.1 — `skills/maxmorrys-ceo/SKILL.md`

```markdown
---
name: maxmorrys-ceo
description: >
  CEO of Maxmorrys. Use this skill at every heartbeat to: (1) read the latest
  KPI numbers from the company dashboard, (2) update the weekly board memo,
  (3) escalate blockers to the board, (4) request board approval for any
  hire/spend/strategy/legal/customer/payment action, (5) reassign or unblock
  ICs, (6) trigger Hire-#5 if expansion criteria are met. Do NOT do IC work
  (writing code, drafting copy, querying analytics) — delegate via subtasks.
---

You are CEO of Maxmorrys. Mission: €10k MRR by 2026-11-01. Budget: $500/mo total ($120 yours).

## Heartbeat procedure (every 24h or on approval/comment wake)

1. Get identity: `GET /api/agents/me`. Confirm budget < 80%; if 80–99%, focus only on critical path; at 100% you're auto-paused — file an approval to raise cap.
2. Read dashboard: `GET /api/companies/{companyId}/dashboard`. Note current NSM, K1–K3.
3. Read inbox: `GET /api/agents/me/inbox-lite`. Process in priority: in_progress → in_review → todo.
4. Pick the most-leveraged work for THIS heartbeat. Default order:
   - any board-approval responses (resolve linked issues per skills/paperclip rules)
   - any agent stuck >48h (reassign or unblock with `blockedByIssueIds`)
   - the weekly board memo (every Monday)
   - hiring-trigger check (Hire-#5)
5. Update issues with `PATCH /api/issues/{id}` and a markdown comment. Always include `X-Paperclip-Run-Id`.
6. Exit. You do NOT continue executing.

## When to request board approval (mandatory gates per Q3 red lines + Q6 Balanced)

Use `POST /api/companies/{companyId}/approvals` with `type: request_board_approval` for ALL of:
- Hiring any C-suite or any agent that pushes total budget >$500.
- Any production deploy (push to `main`, Firebase deploy, function publish).
- Any outbound message to a real customer (email, DM, support reply).
- Any payment action (Stripe, refund, payout).
- Any legal/regulatory commitment (ToS edit, GDPR response, contract).
- Any single-action spend > $50.
- Any change to the company mission or the goal tree above Project level.

## What you can do unilaterally
- Hire/fire ICs within the existing $500 cap.
- Reassign issues among existing agents.
- Update the goal tree at Issue level.
- Publish to STAGING (never production).

## Weekly memo template (drop into `documents.weekly-memo`)
- This week's NSM and delta vs. last week
- K1/K2/K3 deltas
- Wins (3 bullets), Stuck (3 bullets), Spend YTD vs. cap
- Decisions needed from board (each links an approval)
- Next week's top 3 priorities

## Rule #1
Never ask a human to do what an agent could do. Escalate sideways before escalating up.
```

### 6.2 — `skills/maxmorrys-growth/SKILL.md`

```markdown
---
name: maxmorrys-growth
description: >
  Growth Lead of Maxmorrys. Use to drive Project G1 (Acquisition): SEO audits,
  article briefs, content drafts, social-post drafts, GSC reporting. Do NOT
  send any outbound message to real users — produce drafts and request board
  approval. Do NOT publish to production — open PRs against the maxmorrys.me
  repo and assign to Engineer for implementation.
---

You drive organic acquisition. Budget: $150/mo. Cadence: 8h.

## Every heartbeat
1. `GET /api/agents/me` → check budget. >80% = stop content production, only finish open drafts.
2. Inbox check (`inbox-lite`). Priority: in_review (your drafts pending review) → in_progress → todo.
3. If you hold a draft article: finalise it as an issue document `documents.draft-article`, set issue to `in_review`, assign to CEO for board-send approval.
4. New SEO audit: pull GSC data via the company-skill `gsc-reader` (Engineer wires this in week 1). Until then, inspect static sitemap and on-page signals manually.
5. Update the issue with what changed and the next concrete step. Exit.

## Red lines
- No social posts go out without board approval (use `request_board_approval`).
- No emails to real users.
- No edits to the live site — open PRs only and tag Engineer.

## Tools you can call freely
- Read: `GET /api/issues/...`, `GET /api/companies/{id}/dashboard`, repo file reads via Engineer subtasks.
- Write: issue documents (`PUT /api/issues/{id}/documents/draft-*`), comments, subtasks for Engineer.

## Critical reminders
- Use first-class blockers (`blockedByIssueIds`), not free-text "blocked by".
- Mention agents as `[@Engineer](agent://<engineer-id>)` not raw `@Engineer`.
- All ticket references in comments must be Markdown links: `[MAX-12](/MAX/issues/MAX-12)`.
```

### 6.3 — `skills/maxmorrys-engineer/SKILL.md`

```markdown
---
name: maxmorrys-engineer
description: >
  Engineer for Maxmorrys. Use to drive Project G2 (Conversion): instrumentation,
  A/B tests, perf fixes, bug fixes on the maxmorrys.me-main repo. Always work
  on a branch — never push to main. Open PRs and request board approval before
  any production deploy. Do NOT touch payment logic in Firestore Functions
  without explicit board approval.
---

You ship code on the maxmorrys.me-main repo. Adapter: claude-local in Claude Code mode. Budget: $150/mo.

## Heartbeat (on issue-assign or 12h fallback)

1. Identity + budget check.
2. Checkout the assigned issue (`POST /api/issues/{id}/checkout`). On 409, stop — pick another or exit.
3. Read `heartbeat-context` for the issue. Read the codebase only enough to implement the change.
4. Branch: `agent/<issue-id>-<slug>`. Commit with EXACT trailer:
   `Co-Authored-By: Paperclip <noreply@paperclip.ing>`
5. Run typecheck, lint, build. If they pass: open PR, set issue `in_review`, assign back to CEO for production-deploy approval.
6. If blocked, set issue `blocked` with `blockedByIssueIds` and exit.

## What you can do unilaterally
- Branches, PRs, staging deploys (Firebase preview channels).
- Read-only access to Firestore.
- Open issues for Growth/Success when you discover a need.

## Red lines (Q3c)
- Never push to `main` without board approval.
- Never modify `functions/src/*` if it touches Stripe, payments, or coupons-server logic without board approval.
- Never expose secrets in commits — `git diff --cached` must not include `.env*` or service-account JSON.

## Repo conventions (codebase-derived, do not deviate)
- TypeScript strict, no `any`. `error: unknown` in catches.
- Imports: `lucide-react` for icons, `firebase/*` only via `src/config/firebase.ts`.
- File pattern conventions documented in `CLAUDE.md` of the repo.
```

### 6.4 — `skills/maxmorrys-success/SKILL.md`

```markdown
---
name: maxmorrys-success
description: >
  Customer Success agent for Maxmorrys. Use to monitor Rysmo answer quality,
  draft retention messaging, and report churn cohorts weekly. Do NOT send any
  message to real users — all customer-facing copy must go through board
  approval before send. You may not initiate refunds or comp accounts.
---

You protect retention. Budget: $50/mo. Adapter: claude-local on Haiku 4.5. Cadence: 12h.

## Heartbeat
1. Identity + budget. >80%: only finish open drafts.
2. Sample 5 recent Rysmo conversations from Firestore (read-only). Score: helpful / off-brand / broken.
3. If broken: file issue, assign Engineer, set `priority: high`.
4. If a paying user shows churn signal (no login >14d): draft a win-back email as an issue document, request board approval to send.
5. Weekly: write churn cohort report into `documents.churn-cohort-W{n}`.

## Red lines
- No outbound message of any kind without board approval.
- No Stripe actions.
- No edits to live Rysmo prompts (Engineer ships those).
```

### How to install these skills (verified flow)

Per [skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md) → "Company Skills Workflow":

1. CEO heartbeat reads `skills/paperclip/references/company-skills.md` first.
2. CEO uploads each SKILL.md via the company-skills API.
3. CEO assigns each to the corresponding agent: `POST /api/agents/{agentId}/skills/sync`.
4. On hire, include `desiredSkills` in the agent-create payload so the assignment happens on day one.

---

## 7. Heartbeat Schedule

Justification: cadence = max(work-cycle-time, cost-floor / model-cost-per-run). Faster heartbeats burn budget without producing more work.

| Agent | Cron | Event triggers | Avg runs/week | Justification |
|---|---|---|---|---|
| CEO | `0 9 * * *` (daily 09:00 UTC) | `PAPERCLIP_APPROVAL_ID` resolved, mention from any agent | 7 + ~3 events | Strategy moves on day-scale; faster wastes tokens. Approvals must wake immediately. |
| Growth | `0 */8 * * *` | Comment from CEO; Engineer PR merged | 21 + events | Content production cycle = ~8h; SEO data refreshes daily. |
| Engineer | (no cron) | issue-assign, comment from CEO/Growth | as needed | Pure event-driven — only burns when there's actual code work. 12h safety net. |
| Engineer safety | `30 6,18 * * *` | — | 14 | Catches issues that didn't fire an event wake (e.g. blockers resolved). |
| Customer Success | `0 */12 * * *` | comment, mention | 14 + events | Retention is slow-cycle; 12h is sufficient. |

CEO and Engineer share an additional **routine** ([skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md): *"Routines"*): Monday 08:00 UTC — generates the weekly-board-memo execution issue assigned to CEO.

---

## 8. Budget Plan

### Per-agent caps (sums to total cap, verified §5)

| Agent | Monthly $ | Warn (80%) | Hard-stop (100%) |
|---|---|---|---|
| CEO | $120 | $96 | $120 |
| Growth | $150 | $120 | $150 |
| Engineer | $150 | $120 | $150 |
| Success | $50 | $40 | $50 |
| Buffer | $30 | n/a | n/a (unallocated, requires CEO + board approval to draw) |
| **Total** | **$500** | | |

### Burn-down model (4-week projection, conservative)

| Week | CEO | Growth | Engineer | Success | Total | Notes |
|---|---|---|---|---|---|---|
| W1 | $35 | $50 | $60 | $15 | **$160** | Ramp: heavy goal-tree + skill installs + first 2 PRs |
| W2 | $30 | $40 | $40 | $12 | **$122** | Stable cadence kicks in |
| W3 | $30 | $35 | $30 | $12 | **$107** | Most learnings cached in issues |
| W4 | $25 | $30 | $25 | $10 | **$90** | Steady-state, well below cap |
| **Sum** | **$120** | **$155** | **$155** | **$49** | **~$479** | $21 buffer remaining |

If actuals exceed W2 projection by >25%, CEO files a budget-review approval.

### Throttling rules (enforced by Paperclip per [doc/PRODUCT.md](https://github.com/paperclipai/paperclip/blob/master/doc/PRODUCT.md))

- **80% reached**: agent receives `PAPERCLIP_BUDGET_WARNING` flag. Per `skills/paperclip/SKILL.md` rule: *"Above 80%, focus on critical tasks only."* Each agent skill enforces this in step 1 of its heartbeat (see §6).
- **100% reached**: agent is **auto-paused** by the platform. CEO is woken to file `request_board_approval` with proposed remediation (raise cap, kill agent, defer work).

### Provider-side defense in depth

Set the Anthropic console workspace spend limit to $500 as a hard ceiling **outside** Paperclip — second guarantee that a control-plane bug can't blow the cap.

---

## 9. Governance Charter (Balanced, Q6)

### What the BOARD (you) must approve before action — board approval gates

1. Any new hire (agent creation) that pushes total budget > $500.
2. **Any production deploy** (push to `main`, Firebase deploy, function publish). [Q3c]
3. **Any outbound message to a real customer** (email, DM, support reply, social post send). [Q3c]
4. **Any payment action** (Stripe charge/refund/payout, coupon issuance > 5/day, account comp). [Q3c]
5. **Any legal / regulatory commitment** (ToS, privacy policy, GDPR response, contract). [Q3c]
6. Any single-action spend over $50 (compute, third-party API, ad spend).
7. Any change to the company mission, NSM definition, or top-level goal tree.
8. Any agent termination after that agent has produced at least one merged PR (preserves audit trail).

### What the CEO can do unilaterally

- Hire ICs within the existing cap.
- Reassign issues, set priorities, manage the goal tree below project level.
- Publish to STAGING.
- Issue read-only queries against Firestore.
- File approvals (which is itself the act that requires board response).

### Kill-switch procedure (verified in [skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md))

| Severity | Action | API |
|---|---|---|
| Pause one agent | Set agent status `paused` | `PATCH /api/agents/{id}` |
| Pause all (panic) | Pause company | board-only UI control on company page |
| Reassign in-flight | Reassign issue, then pause | `PATCH /api/issues/{id}` then pause |
| Terminate | Pause first, audit run logs, then terminate after 24h cooldown | UI |
| Hard cut (only if exfil suspected) | Stop systemd: `systemctl stop paperclip` | shell |

### Audit cadence

- **Daily**: CEO posts a 5-line "what ran, what cost" summary in the company dashboard's pinned issue.
- **Weekly (Monday)**: board reviews the weekly memo + a 10-issue random sample of agent runs.
- **Monthly**: full P&L review against the burn-down (§8). Any agent whose cost-per-completed-issue > $5 is reviewed.

---

## 10. Day-0 Runbook (first 24 hours, hour-by-hour)

| H | You (board) | What's happening |
|---|---|---|
| H+0 | Provision VPS per §3.1 | — |
| H+1 | Install Paperclip per §3.2 (Path B) | Service starts on :3100 |
| H+2 | Set up Cloudflare Tunnel per §3.4 | `paperclip.maxmorrys.me` resolves |
| H+3 | Browser onboarding per §3.5: create company "Maxmorrys" (slug `MAX`), add Anthropic key, set company budget $500 | Company exists, key encrypted |
| H+4 | Create CEO agent: claude-local, Sonnet 4.6, budget $120, cadence 24h. Paste `maxmorrys-ceo/SKILL.md` (§6.1) as a company skill, assign to CEO | CEO exists, skill assigned |
| H+5 | Set company mission verbatim (§4). Create the goal tree (§4): 4 projects, 12 seed issues. Assign Project G4 to CEO | Goal tree visible on dashboard |
| H+6 | Trigger CEO's first heartbeat manually: UI → "Run now" on CEO | CEO drafts MAX-1 hiring plan in `in_review` |
| H+7 | Review and **approve** the hiring approval. CEO unblocks and creates Growth, Engineer, Success agents with their respective SKILL.md | 4 agents exist |
| H+8 | Validate budgets sum to $500 in the budget UI | Math checks |
| H+9 | Assign 3 seed issues each to Growth, Engineer, Success | First IC heartbeats begin firing |
| H+12 | Mid-day check: read the activity log at `/MAX/dashboard`. Anything `blocked`? | Should see 1–2 in_progress per agent |
| H+18 | First Engineer PR likely posted as `in_review` against you | Code review (manual — by you, the board) |
| H+24 | First retro: did total spend match §8 W1 projection (~$23)? Are red lines holding? Any agent stuck? | If yes, continue. If no, pause the offender, file a CEO investigation issue. |

---

## 11. Week-1 → Week-4 Operating Plan

### Weekly board review checklist (every Monday, ~30 minutes)

- [ ] Read CEO's weekly memo (`documents.weekly-memo`).
- [ ] Spend YTD ≤ §8 projection? If not, why?
- [ ] NSM delta vs. last week?
- [ ] K1, K2, K3 deltas?
- [ ] Are any agents stuck >48h (issue `blocked` with no progress)?
- [ ] Any red-line near-misses in the run log? (search comments for "approval")
- [ ] Decide on each pending approval (don't let them rot — agents block on you).
- [ ] Confirm next week's top-3 priorities CEO proposed.

### Leading indicators that you're on track

| Week | Expected signal |
|---|---|
| W1 | Goal tree fully populated; ≥1 PR shipped to staging; first weekly memo delivered |
| W2 | First A/B test live in staging; SEO audit complete; first Rysmo quality report |
| W3 | First production deploy approved + shipped; K2 trending up; first organic article ranked |
| W4 | First measurable lift on K1 (free→paid); MRR run-rate visible; CEO proposes Hire-#5 if applicable |

### Stop-loss conditions (pause everything if any one is true)

- Spend exceeds §8 projection by >40% by W2.
- Any red-line breach (deploy, customer message, payment, legal action without approval).
- Any agent runs >5 heartbeats without status change on its assigned issue (stuck loop).
- Any month-on-month NSM decline by W4.
- Any secret leakage (run-log inspection finds an Anthropic key, Firebase JSON, etc., echoed in comments).

Stop = pause company in UI, then file a CEO post-mortem issue.

---

## 12. Failure Modes & Recovery

| Failure | Detection signal | Recovery (using Paperclip primitives) |
|---|---|---|
| **Runaway loop** (agent re-enters same heartbeat work) | Same comment posted twice in 1h on the same issue | Use [skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md) "blocked-task dedup" rule — if it's still firing, pause agent via UI, post a comment naming the loop, reassign issue with explicit next step. |
| **Hallucinated tool calls** | Run log shows API calls returning 404 / 422 patterns | Run validates against the API surface; failures auto-log. Open issue, assign CEO, attach run id. CEO updates the agent's SKILL.md to be more specific about which endpoints to use. |
| **Agent stuck `in_progress` >48h** | Inbox-lite shows stale `in_progress` for that agent | CEO posts a comment requesting status; if no reply in next heartbeat, reassign to another agent or set `blocked` with `blockedByIssueIds` naming what's missing. |
| **Budget breach (run hit hard-stop)** | Agent auto-pauses at 100%; CEO is woken via routine | CEO files `request_board_approval` with proposed remediation: kill non-critical work, raise cap (board), or carry over to next month. |
| **Contradictory goals between agents** | Two agents both set their issue to `done` with conflicting outcomes | CEO mediates: open a parent issue linking both as `blockedByIssueIds`, write a decision comment, reassign to the winner. |
| **Secret leakage** | Comment text matches `sk-ant-`, `firebase-adminsdk`, `STRIPE_*`, etc. | Hard cut: `systemctl stop paperclip`. Rotate the leaked secret at provider. Use company export with secret-scrubbing to capture state, redeploy, re-import. File a board incident issue. |
| **Comment storm** (agents @-mentioning each other in a loop) | >10 comments on one issue from agents in <1h | CEO pauses the noisier agent, sets the issue to `in_review` assigned to board, edits the agents' SKILL.md to forbid replies-to-replies. |
| **Database corruption** | `pnpm db:migrate` fails, or agents hit 500s on `GET /api/agents/me` | Restore from the daily Postgres dump. Re-run migrations. Verify health (`/api/health`). |

---

## 13. Extension Roadmap

### Month 2 (only if W4 stop-loss conditions are clean)

- **Add Data Analyst (#5)** — see §5 expansion triggers.
- **Install routine: weekly Stripe export** — pulls MRR / churn / ARPU into Firestore for analyst access.
- **Plugin: GSC reader** ([packages/plugins/](https://github.com/paperclipai/paperclip/blob/master/AGENTS.md)) — gives Growth direct GSC data instead of manual exports.
- **Adapter swap evaluation**: try `claude-local` Opus for CEO on Mondays only (memo days), measure whether quality lift justifies cost.

### Month 3

- **Cliphub templates** ([doc/CLIPHUB.md](https://github.com/paperclipai/paperclip/blob/master/doc/CLIPHUB.md)) — if a "Solo founder e-learning" template exists at runtime, evaluate cherry-picking its skills/routines.
- **Add Content IC (#6)** if K2 still capacity-bound.
- **External adapter plugin**: explore the Hermes/Droid plugin pattern ([AGENTS.md §11](https://github.com/paperclipai/paperclip/blob/master/AGENTS.md)) for a custom Rysmo-tester adapter.

### Month 4–6

- Start lifting the customer-contact red line (Q3c) gradually: one templated email type at a time, each with explicit board approval, then promote to "CEO-can-send-without-approval" once 50 sends are clean.
- Expand to Aggressive risk appetite (Q6) if MRR ≥ €5k.

---

## 14. ⚠️ Reality vs. Spec

Direct contradictions between your original brief and the live repo (resolved in favour of the repo throughout this guide):

| Your brief said | Live repo says | Source |
|---|---|---|
| "SKILLS.md" | File is `skills/<slug>/SKILL.md` (singular, per skill folder) | [skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md) |
| "Tickets" | Primitive is **Issues** (with identifiers like `MAX-1`) | [skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md) |
| "Company Mission → Project Goal → Agent Goal → Task" | Real hierarchy: Company → Goals + Projects → Issues (parent/child). No "agent goal" entity — agents have role/JD; goals link via `goalId`/`projectId` on issues | [doc/PRODUCT.md](https://github.com/paperclipai/paperclip/blob/master/doc/PRODUCT.md) |
| "Claude Code, OpenClaw, Codex, Cursor, Bash, HTTP" adapters | Actual list: `claude-local`, `codex-local`, `cursor-local`, `gemini-local`, `opencode-local`, `pi-local`, `acpx-local`, `openclaw-gateway` (+ external plugin loader) | [packages/adapters/](https://github.com/paperclipai/paperclip/tree/master/packages/adapters) |
| `npx paperclipai onboard --yes --help` to discover CLI | The real flag set includes `--bind lan` / `--bind tailnet`. There is no documented `--help` output in the public docs at this time | [doc/CLI.md](https://github.com/paperclipai/paperclip/blob/master/doc/CLI.md) |
| Docs at `https://docs.paperclip.ing` | Currently fails to render (returns "Could not load this guide" as of 2026-05-01). Authoritative source is the repo `doc/` directory + Discord | observed |
| "Heartbeat config" as a separate primitive | Heartbeats are a property of the agent's adapter config + routines (cron triggers) — not a top-level entity | [skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md) "Routines" section |

Items I could **not** verify and have marked accordingly:
- `[UNVERIFIED]` Exact JSON shape of the agent-create payload — the [skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md) references `desiredSkills` and `chainOfCommand` but the full schema is in `references/api-reference.md` which I did not fully read.
- `[UNVERIFIED]` Cloudflare Tunnel as a "supported" reverse proxy — it works for any HTTP service but is not specifically blessed by Paperclip docs.
- `[UNVERIFIED]` Anthropic console hard-cap workspace feature exact UI path — the feature exists but the menu name may have changed.

To resolve these before execution: read `skills/paperclip/references/api-reference.md` (only available after install) and the Discord (`discord.gg/m4HZY7xNG3`).

---

## 15. Appendix

### A. `.env` (production VPS) — ready to commit to `/etc/paperclip/env`

```env
# Paperclip platform
PAPERCLIP_TELEMETRY_DISABLED=1
DO_NOT_TRACK=1
PORT=3100
NODE_ENV=production

# Database (Neon free tier example)
DATABASE_URL=postgresql://USER:PASS@ep-xxx.eu-central-1.aws.neon.tech/paperclip?sslmode=require

# Provider (Anthropic only per Q3b)
ANTHROPIC_API_KEY=sk-ant-...

# Bind: cloud + tunnel
HOST=127.0.0.1
```

### B. Goal-tree seed (paste into onboarding UI)

```yaml
mission: |
  Grow maxmorrys.me to €10,000 MRR by 2026-11-01 within $500/mo total spend,
  honouring red lines on prod, customer contact, payments, and legal.
projects:
  - key: G1-acquisition
    title: Acquisition (organic)
    owner: growth
  - key: G2-conversion
    title: Conversion (free→paid)
    owner: engineer
  - key: G3-retention
    title: Retention
    owner: success
  - key: G4-operations
    title: Operations & Reporting
    owner: ceo
```

### C. systemd unit — see §3.3 above (full file).

### D. Glossary

| Term | Meaning in Paperclip |
|---|---|
| **Company** | Multi-tenant org with its own goal tree, agents, budget. (Maxmorrys is one.) |
| **Agent** | An AI worker bound to an adapter + role + budget + heartbeat. |
| **Adapter** | Code that knows how to invoke a specific runtime (claude-local, codex-local, etc.). |
| **Issue** | A unit of work (Paperclip's term for "task"/"ticket"). Single assignee, atomic checkout. |
| **Goal / Project** | Containers above Issues that tie work to the mission. |
| **Heartbeat** | One scheduled or event-triggered run of an agent. Wakes → checks → does → exits. |
| **Run** | One execution of a heartbeat. Has a `PAPERCLIP_RUN_ID` for audit. |
| **Routine** | Recurring task definition (cron/webhook/api trigger) that creates execution issues. |
| **Approval** | Board gate. CEO files `request_board_approval`; you respond approve/deny. |
| **Skill (`SKILL.md`)** | Runtime-injected instruction set for one agent. Stored at `skills/<slug>/SKILL.md`. |
| **Document** | Markdown attached to an issue with a `key` (e.g. `plan`, `weekly-memo`). |
| **Workspace** | The execution context (working dir / branch) the agent operates in for a given issue. |

### E. Source citations

All non-trivial claims in this guide trace to one of:
- [paperclipai/paperclip — README](https://github.com/paperclipai/paperclip)
- [AGENTS.md](https://github.com/paperclipai/paperclip/blob/master/AGENTS.md)
- [skills/paperclip/SKILL.md](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md)
- [doc/PRODUCT.md](https://github.com/paperclipai/paperclip/blob/master/doc/PRODUCT.md)
- [doc/CLI.md](https://github.com/paperclipai/paperclip/blob/master/doc/CLI.md)
- [doc/DEPLOYMENT-MODES.md](https://github.com/paperclipai/paperclip/blob/master/doc/DEPLOYMENT-MODES.md)
- [doc/DOCKER.md](https://github.com/paperclipai/paperclip/blob/master/doc/DOCKER.md)
- [doc/CLIPHUB.md](https://github.com/paperclipai/paperclip/blob/master/doc/CLIPHUB.md)
- [packages/adapters/](https://github.com/paperclipai/paperclip/tree/master/packages/adapters)
- [paperclip.ing/llms.txt](https://paperclip.ing/llms.txt)

### F. Verification (end-to-end smoke test)

```bash
# 1. Service up
curl -fsS https://paperclip.maxmorrys.me/api/health | jq .

# 2. Auth + company exists
curl -fsS -H "Authorization: Bearer $BOARD_TOKEN" \
  https://paperclip.maxmorrys.me/api/companies | jq '.[].slug'   # → "MAX"

# 3. CEO agent exists and has the skill assigned
curl -fsS -H "Authorization: Bearer $BOARD_TOKEN" \
  https://paperclip.maxmorrys.me/api/companies/$CID/agents \
  | jq '.[] | select(.title=="CEO") | {id, skills: [.skills[].name]}'

# 4. Trigger a heartbeat manually and watch it land
curl -fsS -X POST -H "Authorization: Bearer $BOARD_TOKEN" \
  https://paperclip.maxmorrys.me/api/agents/$CEO_ID/run

# 5. Inspect the run log
curl -fsS -H "Authorization: Bearer $BOARD_TOKEN" \
  "https://paperclip.maxmorrys.me/api/companies/$CID/dashboard" | jq '.recentRuns'
```

If all five succeed, install is healthy and you're ready for Day-0 Runbook §10.
