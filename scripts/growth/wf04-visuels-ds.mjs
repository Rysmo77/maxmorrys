#!/usr/bin/env node
// Met à jour WF-SOCIAL-04 pour rendre au kit DS les posts qui portent un `Gabarit`.
//
//   node scripts/growth/wf04-visuels-ds.mjs            # simulation : écrit le JSON proposé, ne pousse rien
//   node scripts/growth/wf04-visuels-ds.mjs --apply    # sauvegarde le live, puis pousse
//
// Ce que ça change, et seulement ça : le code du nœud « Build — URL publique ».
//   - post SANS `Gabarit` (tout le lot S45-S46 au 29/10) → charge historique, octet pour octet ;
//   - post AVEC `Gabarit` → charge `kit: 'ds'` construite par `construireCharges`
//     (scripts/growth/nayo.mjs, recopiée ici depuis la source : une seule vérité).
// Le circuit de statut (`rédigé` → `prêt_à_valider` / `image_needed`) n'est pas touché.
//
// Après --apply : node scripts/n8n-export-live.mjs
import fs from 'node:fs';
import path from 'node:path';
import { construireCharges } from './nayo.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const BASE = 'https://n8n.maxmorrys.me/api/v1';
const WF_ID = '774G38cqIvZsJUHm';
const NODE = 'Build — URL publique';
const BACKUP_DIR = path.join(ROOT, 'backups', 'n8n-corrections-20261029');
const APPLY = process.argv.includes('--apply');

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
  return JSON.parse(t);
}

const MARQUE = '// ── kit DS (29/10/2026)';

// Première ligne du code historique du nœud : tout ce qui la précède est l'en-tête du kit DS.
const DEBUT_HISTORIQUE = '// Compose la charge du moteur de rendu';

function entete(dsParDefaut) {
  return `${MARQUE} — bascule globale. false tant que le lot S45-S46 (sans Gabarit) n'est pas fini ;
// true = TOUT post sans Gabarit passe aussi au kit DS (gabarit choisi automatiquement).
const DS_PAR_DEFAUT = ${dsParDefaut ? 'true' : 'false'};
${construireCharges.toString()}

`;
}

function nouveauCode(ancien) {
  if (ancien.includes(MARQUE)) {
    // Déjà équipé : on ne remplace QUE l'en-tête (nouvelle version de construireCharges),
    // en conservant la valeur de DS_PAR_DEFAUT réglée à la main dans n8n.
    const i = ancien.indexOf(DEBUT_HISTORIQUE);
    if (i < 0) throw new Error('début du code historique introuvable : relire le nœud avant de pousser');
    const actuel = /const DS_PAR_DEFAUT = (true|false);/.exec(ancien);
    return entete(actuel ? actuel[1] === 'true' : false) + ancien.slice(i);
  }
  // Le `return $input.all().map(item => {` final est le point d'insertion : la charge historique
  // est calculée comme avant, puis remplacée si le post porte un Gabarit.
  const ancre = "  return { json: { id: b.id, image_index: idx, total_images: total, carte: carte,";
  if (!ancien.includes(ancre)) throw new Error('ancre introuvable dans le nœud : le code live a changé, relire avant de pousser');
  const insertion =
`  ${MARQUE} : un post qui porte un \`Gabarit\` est rendu au kit DS produit.
  // Sans Gabarit → charge historique ci-dessus, inchangée. Source : scripts/growth/nayo.mjs.
  if (DS_PAR_DEFAUT || String(f.Gabarit || '').trim()) {
    try {
      const ds = construireCharges(f).charges[idx - 1];
      if (ds) {
        for (const k of Object.keys(payload)) delete payload[k];
        Object.assign(payload, ds);
      }
    } catch (e) { /* en cas de doute, la charge historique part : la file ne bloque jamais */ }
  }
`;
  if (!ancien.startsWith(DEBUT_HISTORIQUE)) throw new Error('le nœud ne commence plus par le code historique attendu');
  return entete(false) + ancien.replace(ancre, insertion + ancre);
}

async function main() {
  const wf = await api(`/workflows/${WF_ID}`);
  const node = wf.nodes.find((n) => n.name === NODE);
  if (!node) throw new Error(`nœud « ${NODE} » introuvable`);
  const code = nouveauCode(node.parameters.jsCode);
  // Contrôle : le code produit doit se compiler.
  new Function('$input', '$', code);

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const propose = path.join(BACKUP_DIR, `${WF_ID}-WF-SOCIAL-04-propose-kit-ds.json`);
  const neuf = { ...wf, nodes: wf.nodes.map((n) => (n.name === NODE ? { ...n, parameters: { ...n.parameters, jsCode: code } } : n)) };
  fs.writeFileSync(propose, JSON.stringify(neuf, null, 2));
  if (!APPLY) { console.log(`SIMULATION — proposé dans ${path.relative(ROOT, propose)}. --apply pour pousser.`); return; }

  const sauvegarde = path.join(BACKUP_DIR, `${WF_ID}-WF-SOCIAL-04-avant-kit-ds.json`);
  fs.writeFileSync(sauvegarde, JSON.stringify(wf, null, 2));
  const body = { name: wf.name, nodes: neuf.nodes, connections: wf.connections, settings: { executionOrder: wf.settings?.executionOrder || 'v1', errorWorkflow: wf.settings?.errorWorkflow }, staticData: wf.staticData ?? null };
  const res = await api(`/workflows/${WF_ID}`, { method: 'PUT', body: JSON.stringify(body) });
  console.log(`✔ WF-SOCIAL-04 mis à jour (actif : ${res.active}). Sauvegarde : ${path.relative(ROOT, sauvegarde)}`);
}

main().catch((e) => { console.error('✖ ' + e.message); process.exit(1); });
