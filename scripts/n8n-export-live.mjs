#!/usr/bin/env node
/**
 * Exporte TOUS les workflows n8n ACTIFS de production dans `n8n/live/<NOM>.json`.
 *
 *   node scripts/n8n-export-live.mjs            # écrit n8n/live/
 *   node scripts/n8n-export-live.mjs --dry-run  # n'écrit rien, liste ce qui serait fait
 *
 * - Instance : https://n8n.maxmorrys.me (VPS). On n'utilise PAS `N8N_URL` de `.env.local`, qui peut
 *   encore viser l'ancien n8n Cloud désactivé. Surcharge possible par `N8N_EXPORT_URL`.
 * - Clé : `N8N_API_KEY` (env), sinon la DERNIÈRE occurrence dans `.env.local` (la première est
 *   celle de l'ancien Cloud). Jamais affichée.
 * - **Lecture seule** côté n8n.
 * - Nom de fichier = préfixe du nom avant « — » (« WF-SOCIAL-05 — Publication… » → WF-SOCIAL-05.json).
 * - Métadonnées serveur retirées (bruit de diff), `staticData` et `pinData` retirés (état runtime,
 *   peut contenir des données réelles).
 * - Garde anti-secret : chaque JSON est scanné (jetons Meta EAA…, clés Google AIza…, Brevo xkeysib-,
 *   jetons de bot Telegram, clés sk-…, PAT Airtable, en-têtes Bearer en dur). Un seul motif trouvé
 *   ⇒ RIEN n'est écrit et le script sort en erreur.
 * - Les `.json` de n8n/live/ qui ne correspondent plus à un workflow actif sont supprimés
 *   (l'historique git fait foi ; les exports d'archivage vivent dans backups/).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'n8n', 'live');
const BASE = (process.env.N8N_EXPORT_URL || 'https://n8n.maxmorrys.me').replace(/\/$/, '') + '/api/v1';
const DRY = process.argv.includes('--dry-run');

function apiKey() {
  if (process.env.N8N_API_KEY) return process.env.N8N_API_KEY;
  const p = path.join(ROOT, '.env.local');
  let key = null;
  if (fs.existsSync(p)) for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = l.match(/^(?:export\s+)?N8N_API_KEY=(.*)$/);
    if (m) key = m[1].trim().replace(/^["']|["']$/g, '');
  }
  if (!key) { console.error('N8N_API_KEY introuvable (env ou .env.local)'); process.exit(1); }
  return key;
}
const KEY = apiKey();

async function api(p) {
  const r = await fetch(BASE + p, { headers: { 'X-N8N-API-KEY': KEY, accept: 'application/json' } });
  if (!r.ok) throw new Error(`GET ${p} -> HTTP ${r.status}`);
  return r.json();
}

const SERVER_META = ['activeVersion', 'activeVersionId', 'versionId', 'versionCounter', 'shared', 'triggerCount',
  'createdAt', 'isArchived', 'sourceWorkflowId', 'meta', 'pinData', 'staticData', 'parentFolder', 'description'];

export const SECRET_PATTERNS = [
  ['jeton Meta', /EAA[A-Za-z0-9]{20,}/],
  ['clé Google', /AIza[0-9A-Za-z_-]{30,}/],
  ['clé Brevo', /xkeysib-[0-9a-f]{20,}/i],
  ['jeton de bot Telegram', /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/],
  ['clé sk-', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['PAT Airtable', /\bpat[A-Za-z0-9]{14}\.[a-f0-9]{40,}/],
  ['Bearer en dur', /Bearer [A-Za-z0-9._-]{30,}/],
];

const fileName = (name) => name.split(' — ')[0].trim().replace(/[^A-Za-z0-9._-]+/g, '-') + '.json';

const list = await api('/workflows?limit=250&active=true');
const active = list.data.filter((w) => w.active && !w.isArchived);
const out = new Map();
const leaks = [];
for (const s of active) {
  const w = await api(`/workflows/${s.id}`);
  for (const k of SERVER_META) delete w[k];
  const txt = JSON.stringify(w, null, 2) + '\n';
  for (const [label, re] of SECRET_PATTERNS) if (re.test(txt)) leaks.push(`${s.name} : ${label}`);
  const f = fileName(w.name);
  if (out.has(f)) throw new Error(`deux workflows actifs donnent le même fichier ${f}`);
  out.set(f, txt);
}
if (leaks.length) {
  console.error('⛔ Secret(s) détecté(s), aucun fichier écrit :\n  ' + leaks.join('\n  '));
  process.exit(2);
}
if (!DRY) fs.mkdirSync(OUT, { recursive: true });
for (const [f, txt] of out) {
  if (!DRY) fs.writeFileSync(path.join(OUT, f), txt);
  console.log(`${DRY ? '[simulation] ' : ''}écrit n8n/live/${f}`);
}
for (const f of fs.existsSync(OUT) ? fs.readdirSync(OUT) : []) {
  if (f.endsWith('.json') && !out.has(f)) {
    if (!DRY) fs.unlinkSync(path.join(OUT, f));
    console.log(`${DRY ? '[simulation] ' : ''}supprimé n8n/live/${f} (plus actif)`);
  }
}
console.log(`${out.size} workflow(s) actif(s) exporté(s) depuis ${BASE.replace('/api/v1', '')}`);
