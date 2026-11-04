#!/usr/bin/env node
// WF-14 (formations) : la couverture passe de Gemini Image à render-card (décision de Max, 01/11/2026).
//
//   node scripts/growth/wf14-couverture.mjs            # simulation : écrit le JSON proposé, ne pousse rien
//   node scripts/growth/wf14-couverture.mjs --test     # essai isolé : workflow TEMPORAIRE (données fictives,
//                                                      # aucun nœud Firestore/NocoDB en écriture), supprimé ensuite
//   node scripts/growth/wf14-couverture.mjs --apply    # sauvegarde le live, puis pousse
//
// Ce que ça change : la chaîne IMG2 → IMG7 (Claude « enrichir prompt », Gemini Image, dépôt S3 R2)
// est remplacée par
//   IMG2 — Lire Config Render   (NocoDB Config : RENDER_CARD_URL / RENDER_KEY, comme WF-SOCIAL-04)
//   IMG3 — Build couverture     (charge `couverture` / `formation`, copie de scripts/growth/couverture.mjs)
//   IMG4 — render-card couverture (HTTP, comme « HTTP — renderSocialCard » de WF-SOCIAL-04)
//   IMG7 — Build URL            (même nom, même sortie : `public_url` → coverImage + ogImage)
// Un échec de rendu laisse `public_url` vide : la formation part sans image, et le site affiche
// sa couverture typographique (`CourseCover`). Le reste du workflow n'est pas touché.
//
// Après --apply : node scripts/n8n-export-live.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chargeFormation, promptFormation } from './couverture.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const BASE = 'https://n8n.maxmorrys.me/api/v1';
const WF_ID = 'OJMyvQPywIdhaVAj';
const WF04_ID = '774G38cqIvZsJUHm';
const BACKUP_DIR = path.join(ROOT, 'backups', 'n8n-corrections-20261029');
const ARGS = new Set(process.argv.slice(2));
// Clés de `settings` que l'API publique accepte en PUT.
const SETTINGS_OK = ['saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow', 'timezone', 'executionOrder'];

const ANCIENS = ['IMG2 — Claude Haiku — Enrichir prompt', 'IMG3 — Parse prompt', 'IMG4 — Generer image', 'IMG5 — Preparer R2', 'IMG6 — R2 Upload', 'IMG7 — Build URL'];
const N_CONFIG = 'IMG2 — Lire Config Render';
const N_BUILD = 'IMG3 — Build couverture';
const N_HTTP = 'IMG4 — render-card couverture';
const N_URL = 'IMG7 — Build URL';

function apiKey() {
  let key = process.env.N8N_API_KEY || null;
  if (!key) for (const l of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
    const m = l.match(/^(?:export\s+)?N8N_API_KEY=(.*)$/);
    if (m) key = m[1].trim().replace(/^["']|["']$/g, ''); // la DERNIÈRE occurrence (VPS)
  }
  if (!key) throw new Error('N8N_API_KEY introuvable');
  return key;
}

async function api(p, init = {}) {
  const r = await fetch(BASE + p, { ...init, headers: { 'X-N8N-API-KEY': apiKey(), 'Content-Type': 'application/json' } });
  const t = await r.text();
  if (!r.ok) throw new Error(`n8n ${r.status} ${p} : ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

const settingsPut = (s = {}) => Object.fromEntries(Object.entries(s).filter(([k]) => SETTINGS_OK.includes(k)));

/** Code du nœud « IMG3 — Build couverture » (fonctions recopiées depuis couverture.mjs). */
function codeBuild() {
  return `// Couverture de formation au kit DS (render-card, famille \`couverture\`) — 01/11/2026.
// Source : scripts/growth/couverture.mjs (regénérer avec scripts/growth/wf14-couverture.mjs).
// Photo : générée par Workers AI à partir de \`fondPrompt\` ; personnes FICTIVES, aucun texte.
const s = (v) => (v == null ? '' : String(v)).trim();
const sansCrochets = (t) => s(t).replace(/[[\\]]/g, '');
${promptFormation.toString()}
${chargeFormation.toString()}

let RENDER_CARD_URL = '', RENDER_KEY = '';
try {
  const rc = $input.all().map((i) => i.json.fields || i.json);
  const g = (k) => { const r = rc.find((x) => x.Cle === k); return r ? r.Valeur : ''; };
  RENDER_CARD_URL = g('RENDER_CARD_URL'); RENDER_KEY = g('RENDER_KEY');
} catch (e) {}

return $('IMG1 — Normaliser').all().map((it) => {
  const f = it.json.formation_passthrough || {};
  return { json: { ...it.json, render_url: RENDER_CARD_URL, render_key: RENDER_KEY, payload: chargeFormation(f.title || '') } };
});
`;
}

const CODE_URL = `// Sortie identique à l'ancien IMG7 : \`public_url\` alimente coverImage et ogImage (« Merge — Image + Formation »).
// Rendu en échec → public_url vide : la formation part sans image (couverture typographique du site).
const src = $('${N_BUILD}').all();
return $input.all().map((it, i) => {
  const m = (src[i] || {}).json || {};
  const j = it.json || {};
  const url = typeof j.url === 'string' && /^https:\\/\\//.test(j.url) ? j.url : '';
  const erreur = url ? (j.fondErreur || '') : String((j.error && (j.error.message || j.error)) || 'render-card sans url');
  return { json: { public_url: url, cover_fond: j.fond || '', cover_erreur: erreur,
    formation_passthrough: m.formation_passthrough, ids: m.ids, slug: m.slug,
    total_modules: m.total_modules, total_lessons: m.total_lessons, estimated_hours: m.estimated_hours } };
});
`;

function nouveauxNoeuds(wf, wf04) {
  const pos = (nom, dx = 0) => {
    const n = wf.nodes.find((x) => x.name === nom);
    return n ? [n.position[0] + dx, n.position[1]] : [0, 0];
  };
  const cfg04 = wf04.nodes.find((n) => n.name === 'NocoDB — Lire Config Render');
  const http04 = wf04.nodes.find((n) => n.name === 'HTTP — renderSocialCard');
  if (!cfg04 || !http04) throw new Error('nœuds de référence de WF-SOCIAL-04 introuvables');
  const code = codeBuild();
  new Function('$input', '$', code); // doit compiler
  new Function('$input', '$', CODE_URL);
  return [
    {
      id: 'wf14-couv-config', name: N_CONFIG, type: cfg04.type, typeVersion: cfg04.typeVersion, position: pos('IMG2 — Claude Haiku — Enrichir prompt'),
      parameters: cfg04.parameters, credentials: cfg04.credentials,
      // Une seule lecture, quel que soit le nombre de formations ; une panne NocoDB n'arrête rien.
      executeOnce: true, alwaysOutputData: true, onError: 'continueRegularOutput',
    },
    {
      id: 'wf14-couv-build', name: N_BUILD, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos('IMG3 — Parse prompt'),
      parameters: { mode: 'runOnceForAllItems', jsCode: code },
    },
    {
      id: 'wf14-couv-http', name: N_HTTP, type: http04.type, typeVersion: http04.typeVersion, position: pos('IMG4 — Generer image'),
      // Génération de la photo (~16 s) + rendu : 170 s, sous le délai de render-card (180 s).
      parameters: { ...http04.parameters, options: { ...(http04.parameters.options || {}), timeout: 170000 } },
      onError: 'continueRegularOutput', alwaysOutputData: true,
    },
    {
      id: 'wf14-couv-url', name: N_URL, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos('IMG7 — Build URL'),
      parameters: { mode: 'runOnceForAllItems', jsCode: CODE_URL },
    },
  ];
}

function transformer(wf, wf04) {
  for (const nom of ANCIENS.slice(0, 5)) if (!wf.nodes.some((n) => n.name === nom)) throw new Error(`nœud « ${nom} » absent : le live a changé, relire avant de pousser`);
  const neufs = nouveauxNoeuds(wf, wf04);
  const nodes = wf.nodes.filter((n) => !ANCIENS.includes(n.name)).concat(neufs);
  const lien = (vers) => ({ main: [[{ node: vers, type: 'main', index: 0 }]] });
  const connections = Object.fromEntries(Object.entries(wf.connections).filter(([k]) => !ANCIENS.includes(k)));
  connections['IMG1 — Normaliser'] = lien(N_CONFIG);
  connections[N_CONFIG] = lien(N_BUILD);
  connections[N_BUILD] = lien(N_HTTP);
  connections[N_HTTP] = lien(N_URL);
  connections[N_URL] = lien('Merge — Image + Formation');
  return { nodes, connections };
}

async function essai(wf04) {
  // Workflow temporaire : webhook → données fictives → les 4 nouveaux nœuds. Rien n'écrit dans
  // Firestore ni dans NocoDB ; la seule trace est un PNG sous social-cards/ (et, si le Worker
  // media est déployé, une photo sous ai-covers/).
  const chemin = `mm-test-wf14-couv-${Date.now().toString(36)}`;
  const faux = { nodes: [{ name: 'IMG2 — Claude Haiku — Enrichir prompt', position: [600, 0] }, { name: 'IMG3 — Parse prompt', position: [800, 0] }, { name: 'IMG4 — Generer image', position: [1000, 0] }, { name: 'IMG7 — Build URL', position: [1200, 0] }] };
  const neufs = nouveauxNoeuds(faux, wf04);
  const nodes = [
    { id: 't-hook', name: 'Webhook — test', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 0], webhookId: chemin, parameters: { httpMethod: 'POST', path: chemin, responseMode: 'lastNode', options: {} } },
    { id: 't-img1', name: 'IMG1 — Normaliser', type: 'n8n-nodes-base.code', typeVersion: 2, position: [300, 0],
      parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: { slug: 'automatisation-whatsapp-test', formation_passthrough: { title: 'Automatisation WhatsApp', slug: 'automatisation-whatsapp-test', coverImage: '', ogImage: '' }, ids: ['test'], total_modules: 0, total_lessons: 0, estimated_hours: 0 } }];" } },
    ...neufs,
  ];
  const lien = (vers) => ({ main: [[{ node: vers, type: 'main', index: 0 }]] });
  const connections = { 'Webhook — test': lien('IMG1 — Normaliser'), 'IMG1 — Normaliser': lien(N_CONFIG), [N_CONFIG]: lien(N_BUILD), [N_BUILD]: lien(N_HTTP), [N_HTTP]: lien(N_URL) };
  const cree = await api('/workflows', { method: 'POST', body: JSON.stringify({ name: 'TEST — WF-14 couverture (temporaire, à supprimer)', nodes, connections, settings: { executionOrder: 'v1' } }) });
  console.error(`… workflow temporaire ${cree.id} créé (inactif)`);
  try {
    await api(`/workflows/${cree.id}/activate`, { method: 'POST' });
    const r = await fetch(`https://n8n.maxmorrys.me/webhook/${chemin}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(200000) });
    const t = await r.text();
    console.log(`Réponse du workflow temporaire (HTTP ${r.status}) :\n${t}`);
  } finally {
    await api(`/workflows/${cree.id}/deactivate`, { method: 'POST' }).catch(() => {});
    await api(`/workflows/${cree.id}`, { method: 'DELETE' });
    console.error(`✔ workflow temporaire ${cree.id} désactivé et supprimé`);
  }
}

async function main() {
  const wf04 = await api(`/workflows/${WF04_ID}`);
  if (ARGS.has('--test')) return essai(wf04);

  const wf = await api(`/workflows/${WF_ID}`);
  if (wf.nodes.some((n) => n.name === N_BUILD)) { console.log('WF-14 est déjà équipé de la couverture render-card : rien à faire.'); return; }
  const { nodes, connections } = transformer(wf, wf04);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const propose = path.join(BACKUP_DIR, `${WF_ID}-WF-14-propose-couverture.json`);
  fs.writeFileSync(propose, JSON.stringify({ ...wf, nodes, connections }, null, 2));
  if (!ARGS.has('--apply')) { console.log(`SIMULATION — proposé dans ${path.relative(ROOT, propose)}. --test pour l'essai isolé, --apply pour pousser.`); return; }

  const sauvegarde = path.join(BACKUP_DIR, `${WF_ID}-WF-14-Publication-de-Cours-sous-Validation-avant-couverture.json`);
  if (!fs.existsSync(sauvegarde)) fs.writeFileSync(sauvegarde, JSON.stringify(wf, null, 2));
  const body = { name: wf.name, nodes, connections, settings: settingsPut(wf.settings), staticData: wf.staticData ?? null };
  await api(`/workflows/${WF_ID}`, { method: 'PUT', body: JSON.stringify(body) });
  const apres = await api(`/workflows/${WF_ID}`);
  if (wf.active && !apres.active) await api(`/workflows/${WF_ID}/activate`, { method: 'POST' });
  const fin = await api(`/workflows/${WF_ID}`);
  console.log(`✔ WF-14 mis à jour (actif : ${fin.active}, avant : ${wf.active}). Sauvegarde : ${path.relative(ROOT, sauvegarde)}`);
}

main().catch((e) => { console.error('✖ ' + e.message); process.exit(1); });
