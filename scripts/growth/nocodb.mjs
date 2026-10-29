#!/usr/bin/env node
// Accès NocoDB pour les agents BMad marketing et éditoriaux (mm-agent-*).
//
// Lecture libre ; écriture en simulation par défaut (--apply pour écrire).
// Garde-fous :
//   - la table Config (secrets en clair) n'est jamais lue ni écrite ;
//   - sur Contenus, poser Status = validé / en_publication / publié exige
//     --human-approved "<qui a validé, quand>" : l'humain valide, pas l'agent.
//     n8n (WF-SOCIAL-05) publie ensuite les lignes « validé ».
//
// Configuration (.env.local, jamais commitée) :
//   NOCODB_URL=https://noco.maxmorrys.me   (défaut)
//   NOCODB_TOKEN=<jeton API NocoDB>
//
// Exemples :
//   node scripts/growth/nocodb.mjs tables
//   node scripts/growth/nocodb.mjs list contenus --where "(Status,eq,prêt_à_valider)" --fields Id,Titre,Reseau,Date_Publication_Prevue
//   node scripts/growth/nocodb.mjs stats contenus Status
//   node scripts/growth/nocodb.mjs create contenus --file lot.json            (simulation)
//   node scripts/growth/nocodb.mjs create contenus --file lot.json --apply
//   node scripts/growth/nocodb.mjs update contenus --file maj.json --apply --human-approved "Max, 29/10 en session"

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const TABLES = {
  contenus: 'm3wim4coagaoot7',
  'idees-articles': 'mp8tvctpl38ufmo',
  'idees-cours': 'moz0ikbdwhdryvj',
  'cours-production': 'md9smxss10apci7',
  logs: 'm460m48wd0qnzsu',
  seo: 'mysghf7takowmb1',
  emails: 'ml6zyrbi30de7d4',
  whatsapp: 'mntnzprdk1m1jg2',
};
const FORBIDDEN = new Set(['config', 'mo6ubcgxi9x4u7d']);
const HUMAN_ONLY_STATUS = new Set(['validé', 'en_publication', 'publié']);

function loadEnv() {
  const file = resolve(process.cwd(), '.env.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*(NOCODB_[A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    } else args._.push(a);
  }
  return args;
}

function die(msg) { console.error(`✖ ${msg}`); process.exit(1); }

function tableId(name) {
  if (!name) die('table manquante. Tables : ' + Object.keys(TABLES).join(', '));
  if (FORBIDDEN.has(name)) die('la table Config contient des secrets : accès refusé aux agents.');
  const id = TABLES[name];
  if (!id) die(`table inconnue « ${name} ». Tables : ${Object.keys(TABLES).join(', ')}`);
  return id;
}

async function api(path, init = {}) {
  const base = (process.env.NOCODB_URL || 'https://noco.maxmorrys.me').replace(/\/$/, '');
  const token = process.env.NOCODB_TOKEN;
  if (!token) die('NOCODB_TOKEN absent. Ajoute-le dans .env.local (voir docs/growth-kb/06-outillage-n8n.md).');
  const res = await fetch(base + path, {
    ...init,
    headers: { 'xc-token': token, 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) die(`HTTP ${res.status} sur ${path} : ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

async function listAll(id, { where, fields, limit }) {
  const max = limit ? Number(limit) : Infinity;
  const out = [];
  let offset = 0;
  while (out.length < max) {
    const q = new URLSearchParams({ limit: String(Math.min(100, max - out.length)), offset: String(offset) });
    if (where) q.set('where', where);
    if (fields) q.set('fields', fields);
    const page = await api(`/api/v2/tables/${id}/records?${q}`);
    out.push(...page.list);
    if (page.pageInfo?.isLastPage || page.list.length === 0) break;
    offset += page.list.length;
  }
  return out;
}

function readRows(file) {
  if (!file || file === true) die('--file <chemin.json> requis (un objet ou un tableau).');
  const data = JSON.parse(readFileSync(resolve(file), 'utf8'));
  return Array.isArray(data) ? data : [data];
}

function guardStatus(table, rows, args) {
  if (table !== 'contenus') return;
  const gated = rows.filter((r) => HUMAN_ONLY_STATUS.has(r.Status));
  if (gated.length && (!args['human-approved'] || args['human-approved'] === true)) {
    die(`${gated.length} ligne(s) passent en ${[...new Set(gated.map((r) => r.Status))].join('/')}. ` +
      'Seul un humain valide : relance avec --human-approved "<qui, quand>" après son accord explicite, ' +
      'ou dépose en prêt_à_valider.');
  }
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const [cmd, table, extra] = args._;

  switch (cmd) {
    case 'tables':
      for (const [k, v] of Object.entries(TABLES)) console.log(`${k.padEnd(18)} ${v}`);
      console.log('config             (interdite aux agents : secrets)');
      return;

    case 'schema': {
      const meta = await api(`/api/v2/meta/tables/${tableId(table)}`);
      for (const c of meta.columns) {
        if (c.system || c.title.startsWith('nc_') || c.title.startsWith('__')) continue;
        const opts = c.colOptions?.options?.map((o) => o.title).join(' | ');
        console.log(`${c.title.padEnd(28)} ${c.uidt}${opts ? '  [' + opts + ']' : ''}`);
      }
      return;
    }

    case 'list': {
      const rows = await listAll(tableId(table), { where: args.where, fields: args.fields, limit: args.limit || 50 });
      console.log(JSON.stringify(rows, null, 2));
      console.error(`${rows.length} ligne(s)`);
      return;
    }

    case 'get': {
      if (!extra) die('usage : get <table> <Id>');
      console.log(JSON.stringify(await api(`/api/v2/tables/${tableId(table)}/records/${extra}`), null, 2));
      return;
    }

    case 'stats': {
      const field = extra || 'Status';
      const rows = await listAll(tableId(table), { fields: field, limit: 100000 });
      const counts = {};
      for (const r of rows) counts[r[field] ?? '(vide)'] = (counts[r[field] ?? '(vide)'] || 0) + 1;
      for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`${String(v).padStart(5)}  ${k}`);
      console.error(`${rows.length} ligne(s)`);
      return;
    }

    case 'create':
    case 'update': {
      const id = tableId(table);
      const rows = readRows(args.file);
      if (cmd === 'update' && rows.some((r) => r.Id === undefined)) die('update : chaque ligne doit porter son Id.');
      guardStatus(table, rows, args);
      if (!args.apply) {
        console.log(`SIMULATION — ${cmd} de ${rows.length} ligne(s) dans « ${table} ». Rien n'est écrit.`);
        console.log(JSON.stringify(rows, null, 2));
        console.log('Relance avec --apply pour écrire.');
        return;
      }
      const res = await api(`/api/v2/tables/${id}/records`, {
        method: cmd === 'create' ? 'POST' : 'PATCH',
        body: JSON.stringify(rows),
      });
      console.log(JSON.stringify(res));
      console.error(`✔ ${cmd} : ${rows.length} ligne(s) dans « ${table} »` +
        (args['human-approved'] && args['human-approved'] !== true ? ` — validé par : ${args['human-approved']}` : ''));
      return;
    }

    default:
      console.log('usage : node scripts/growth/nocodb.mjs <tables|schema|list|get|stats|create|update> [table] [...]');
      console.log('voir l\'en-tête du fichier pour les exemples.');
  }
}

main().catch((e) => die(e.message));
