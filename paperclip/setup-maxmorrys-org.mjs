#!/usr/bin/env node
/**
 * setup-maxmorrys-org.mjs — Applique l'org chart marketing de maxmorrys.me sur l'instance
 * Paperclip locale, de façon idempotente. (Adapté de khanouss/setup-khanouss-org.mjs.)
 *
 * Lit :
 *   - paperclip/org.json                 (manifeste : company, secrets, skills, agents, routines)
 *   - paperclip/skills/<slug>/SKILL.md   (contenu markdown des skills)
 *   - paperclip/agents/<slug>.md         (fiche de poste = instructionsFilePath des agents)
 *   - paperclip/secrets.local.json       (valeurs des secrets, gitignoré) ou variables d'env
 *
 * Crée / met à jour (sans doublon) : Secrets, Skills, Agents, Routines (+ triggers cron).
 * Ne supprime JAMAIS : archiver le surplus des agents live se fait à la main (UI Paperclip).
 *
 * Usage :
 *   node paperclip/setup-maxmorrys-org.mjs                 # DRY-RUN (n'écrit rien)
 *   node paperclip/setup-maxmorrys-org.mjs --apply         # applique
 *   node paperclip/setup-maxmorrys-org.mjs --apply --phase=0        # limite à une phase
 *   node paperclip/setup-maxmorrys-org.mjs --apply --only=cmo-aicha # limite à des agents
 *   node paperclip/setup-maxmorrys-org.mjs --apply --activate-routines  # active les crons
 *   node paperclip/setup-maxmorrys-org.mjs --apply --skip-secrets       # ne touche pas aux secrets
 *   node paperclip/setup-maxmorrys-org.mjs --apply --update-skills --update-agents  # resync fiches
 *
 * ⚠ Avant un --apply réel : renseigner company.ceoAgentId / company.environmentId dans org.json
 *   (placeholders `__FILL_FROM_LIVE__`) via : GET /api/companies/<id>/org.
 *
 * Env : PAPERCLIP_BASE (défaut http://127.0.0.1:3100/api), PAPERCLIP_TOKEN (optionnel, si non local_trusted)
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BASE = process.env.PAPERCLIP_BASE || 'http://127.0.0.1:3100/api';
const TOKEN = process.env.PAPERCLIP_TOKEN || '';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const SKIP_SECRETS = args.includes('--skip-secrets');
const ACTIVATE_ROUTINES = args.includes('--activate-routines');
const UPDATE_SKILLS = args.includes('--update-skills');
const UPDATE_AGENTS = args.includes('--update-agents');
const PHASE = (args.find((a) => a.startsWith('--phase=')) || '').split('=')[1];
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1];
const onlySet = ONLY ? new Set(ONLY.split(',').map((s) => s.trim())) : null;

const org = JSON.parse(readFileSync(join(HERE, 'org.json'), 'utf8'));
const COMPANY = org.company.id;
const CEO = org.company.ceoAgentId;
const ENV_ID = org.company.environmentId;
const D = org.defaults;

// --- secrets values (env prioritaire, sinon fichier local) ---
let secretsFile = {};
const secretsPath = join(HERE, 'secrets.local.json');
if (existsSync(secretsPath)) secretsFile = JSON.parse(readFileSync(secretsPath, 'utf8'));
const secretVal = (name) => process.env[name] || secretsFile[name] || '';

// Environnement runtime injecté à chaque agent (pour appeler ses "mains" n8n + NocoDB + créas).
// AIRTABLE_PAT retiré : Airtable est gelé depuis le 2026-08-06 et n'est plus lu — l'injecter
// donnerait à un agent le moyen d'écrire dans une base morte, sans erreur visible.
const AGENT_ENV_KEYS = ['N8N_BASE_URL', 'N8N_WEBHOOK_BASE_URL', 'NOCODB_URL', 'NOCODB_TOKEN', 'NOCODB_BASE', 'NOCODB_TABLE_CONTENUS', 'NOCODB_TABLE_CONFIG', 'FIREBASE_PROJECT_ID', 'FIREBASE_STORAGE_BUCKET', 'RENDER_CARD_URL', 'RENDER_KEY'];
function buildAgentEnv() {
  const e = { SITE_URL: D.siteUrl || 'https://maxmorrys.me', PAPERCLIP_COMPANY_ID: org.company.id };
  for (const k of AGENT_ENV_KEYS) { const v = secretVal(k); if (v) e[k] = v; }
  return e;
}
function adapterConfigFor(ag) {
  return clean({
    instructionsFilePath: join(HERE, 'agents', `${ag.slug}.md`),
    cwd: D.workspaceDir,
    effort: ag.runtime === 'claude_local' ? D.effort : undefined,
    model: ag.runtime === 'claude_local' ? D.claudeModel : D.geminiModel,
    env: buildAgentEnv(),
  });
}

// --- http helper ---
async function api(method, path, body) {
  const headers = { 'content-type': 'application/json' };
  if (TOKEN) headers.authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) {
    const msg = typeof json === 'string' ? json : JSON.stringify(json);
    throw new Error(`${method} ${path} → ${res.status} ${msg}`);
  }
  return json;
}
const listOf = (r) => (Array.isArray(r) ? r : r?.items || r?.data || []);

const log = (...a) => console.log(...a);
const tag = APPLY ? '' : '[DRY-RUN] ';

async function main() {
  log(`\n=== Setup Maxmorrys org — ${APPLY ? 'APPLY' : 'DRY-RUN'} ===`);
  log(`Paperclip: ${BASE} · company ${COMPANY}`);
  if (PHASE) log(`Filtre phase = ${PHASE}`);
  if (onlySet) log(`Filtre only = ${[...onlySet].join(', ')}`);

  // Garde-fou : placeholders company non résolus
  const needsIds = APPLY && (String(CEO).includes('__FILL') || String(ENV_ID).includes('__FILL'));
  if (needsIds) {
    log('\n⚠ ceoAgentId / environmentId non renseignés dans org.json (placeholders __FILL_FROM_LIVE__).');
    log('  Récupère-les via : GET ' + BASE + '/companies/' + COMPANY + '/org , puis relance.');
    log('  (Les agents ne pourront pas être rattachés au CEO ni recevoir defaultEnvironmentId.)\n');
  }

  // health
  const health = await api('GET', '/health').catch((e) => { throw new Error(`Instance injoignable: ${e.message}`); });
  log(`Instance: v${health.version} · mode ${health.deploymentMode} · ${health.bootstrapStatus}`);

  // ---------- SECRETS ----------
  if (!SKIP_SECRETS) {
    log('\n-- Secrets --');
    const existing = listOf(await api('GET', `/companies/${COMPANY}/secrets`));
    const byName = new Map(existing.map((s) => [s.name || s.key, s]));
    for (const sec of org.secrets) {
      const value = secretVal(sec.name);
      if (byName.has(sec.name)) { log(`  = ${sec.name} (existe déjà, inchangé)`); continue; }
      if (!value) { log(`  ~ ${sec.name} (pas de valeur → ignoré)`); continue; }
      if (!APPLY) { log(`  ${tag}+ créerait secret ${sec.name}`); continue; }
      await api('POST', `/companies/${COMPANY}/secrets`, {
        name: sec.name, key: sec.name, provider: 'local_encrypted',
        managedMode: 'paperclip_managed', value, description: sec.description || '',
      });
      log(`  + secret ${sec.name} créé`);
    }
  }

  // ---------- SKILLS ----------
  log('\n-- Skills --');
  const skillsExisting = listOf(await api('GET', `/companies/${COMPANY}/skills`));
  const skillBySlug = new Map(skillsExisting.map((s) => [s.slug || s.name, s]));
  for (const sk of org.skills) {
    const mdPath = join(HERE, 'skills', sk.slug, 'SKILL.md');
    const markdown = existsSync(mdPath) ? readFileSync(mdPath, 'utf8') : `# ${sk.name}\n`;
    if (skillBySlug.has(sk.slug)) {
      if (!UPDATE_SKILLS) { log(`  = ${sk.slug} (existe)`); continue; }
      const ex = skillBySlug.get(sk.slug);
      if (!APPLY) { log(`  ${tag}↻ mettrait à jour skill ${sk.slug}`); continue; }
      await api('PATCH', `/companies/${COMPANY}/skills/${ex.id}`, { markdown, description: sk.tagline || sk.name, tagline: sk.tagline });
      log(`  ↻ skill ${sk.slug} mis à jour`);
      continue;
    }
    if (!APPLY) { log(`  ${tag}+ créerait skill ${sk.slug} (${markdown.length} car.)`); continue; }
    const created = await api('POST', `/companies/${COMPANY}/skills`, {
      name: sk.name, slug: sk.slug, description: sk.tagline || sk.name, markdown,
      color: sk.color, tagline: sk.tagline, categories: sk.categories || [], sharingScope: 'company',
    });
    skillBySlug.set(sk.slug, created);
    log(`  + skill ${sk.slug} créé`);
  }

  // ---------- AGENTS ----------
  log('\n-- Agents --');
  const agentsExisting = listOf(await api('GET', `/companies/${COMPANY}/agents`));
  const agentByName = new Map(agentsExisting.map((a) => [a.name, a]));
  const slugToId = new Map(); // slug d'org.json -> agent id

  for (const ag of org.agents) {
    if (PHASE !== undefined && String(ag.phase) !== String(PHASE)) continue;
    if (onlySet && !onlySet.has(ag.slug)) continue;

    // resolve reportsTo
    let reportsTo = null;
    if (ag.reportsTo === '__ceo__') reportsTo = CEO;
    else if (ag.reportsTo) reportsTo = slugToId.get(ag.reportsTo) || agentByName.get(orgNameOf(ag.reportsTo))?.id || null;

    if (agentByName.has(ag.name)) {
      const ex = agentByName.get(ag.name);
      slugToId.set(ag.slug, ex.id);
      if (!UPDATE_AGENTS) { log(`  = ${ag.name} (${ag.title}) existe → ${ex.id}`); continue; }
      if (!APPLY) { log(`  ${tag}↻ mettrait à jour ${ag.name} → ${ag.runtime} + env`); continue; }
      await api('PATCH', `/agents/${ex.id}`, { adapterType: ag.runtime, adapterConfig: adapterConfigFor(ag) });
      log(`  ↻ ${ag.name} mis à jour → ${ag.runtime} + env (${Object.keys(buildAgentEnv()).length} vars)`);
      continue;
    }
    const adapterConfig = adapterConfigFor(ag);
    // heartbeat désactivé : la planification passe par les Routines (opt-in)
    const runtimeConfig = { heartbeat: { enabled: false } };
    const payload = {
      name: ag.name, role: ag.role, title: ag.title, icon: ag.icon,
      reportsTo: reportsTo || undefined,
      capabilities: ag.capabilities,
      desiredSkills: ag.desiredSkills || [],
      adapterType: ag.runtime,
      adapterConfig,
      runtimeConfig,
      defaultEnvironmentId: ENV_ID && !String(ENV_ID).includes('__FILL') ? ENV_ID : undefined,
      budgetMonthlyCents: ag.budgetMonthlyCents,
      metadata: { department: 'marketing', slug: ag.slug, phase: ag.phase },
    };
    if (!APPLY) {
      log(`  ${tag}+ embaucherait ${ag.name} — ${ag.title} [${ag.runtime}] reportsTo=${reportsTo || '(none)'} budget=${(ag.budgetMonthlyCents/100).toFixed(0)}$`);
      slugToId.set(ag.slug, `dry:${ag.slug}`);
      continue;
    }
    const created = await api('POST', `/companies/${COMPANY}/agent-hires`, payload);
    const id = created.id || created.agent?.id || created.agentId;
    slugToId.set(ag.slug, id);
    agentByName.set(ag.name, { id, name: ag.name });
    log(`  + ${ag.name} embauché → ${id}`);
  }

  // ---------- ROUTINES ----------
  log('\n-- Routines --');
  const routinesExisting = listOf(await api('GET', `/companies/${COMPANY}/routines`).catch(() => []));
  const routineByTitle = new Map(routinesExisting.map((r) => [r.title, r]));
  for (const ag of org.agents) {
    if (!ag.routine) continue;
    if (PHASE !== undefined && String(ag.phase) !== String(PHASE)) continue;
    if (onlySet && !onlySet.has(ag.slug)) continue;
    const assignee = slugToId.get(ag.slug);
    const title = ag.routine.title;
    if (routineByTitle.has(title)) {
      // Routine déjà là : (ré)active statut + trigger si --activate-routines.
      if (APPLY && ACTIVATE_ROUTINES) {
        const ex = routineByTitle.get(title);
        try {
          await api('PATCH', `/routines/${ex.id}`, { status: 'active' });
          const det = await api('GET', `/routines/${ex.id}`).catch(() => ({}));
          for (const t of (det.triggers || [])) await api('PATCH', `/routine-triggers/${t.id}`, { enabled: true }).catch(() => {});
          log(`  ▶ routine « ${title} » activée`);
        } catch (e) { log(`  ⚠ routine « ${title} » : ${e.message}`); }
      } else log(`  = routine « ${title} » existe`);
      continue;
    }
    if (!APPLY || !assignee || String(assignee).startsWith('dry:')) {
      log(`  ${tag}+ créerait routine « ${title} » (${ag.routine.cron}) pour ${ag.name}${ACTIVATE_ROUTINES ? ' [ACTIVE]' : ' [paused]'}`);
      continue;
    }
    const routine = await api('POST', `/companies/${COMPANY}/routines`, {
      title, description: ag.routine.description,
      assigneeAgentId: assignee,
      priority: 'medium',
      status: ACTIVATE_ROUTINES ? 'active' : 'paused',
      concurrencyPolicy: 'skip_if_active',
      catchUpPolicy: 'skip_missed',
    });
    await api('POST', `/routines/${routine.id}/triggers`, {
      kind: 'schedule', cronExpression: ag.routine.cron,
      timezone: D.timezone, enabled: ACTIVATE_ROUTINES, label: 'cron',
    });
    log(`  + routine « ${title} » créée${ACTIVATE_ROUTINES ? ' (active)' : ' (en pause)'}`);
  }

  log(`\n=== ${APPLY ? 'Terminé' : 'DRY-RUN terminé — relance avec --apply'} ===\n`);
}

function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));
}

function orgNameOf(slug) {
  const a = org.agents.find((x) => x.slug === slug);
  return a ? a.name : slug;
}

main().catch((e) => { console.error('\nÉCHEC:', e.message); process.exit(1); });
