#!/usr/bin/env node
// Décisions par boutons (04/11/2026) — un agent pose une question fermée à Max dans Telegram,
// Max clique, l'agent lit la réponse au passage suivant.
//
//   node scripts/growth/decision.mjs ask --agent <nom> --question "…" --options "code1:Libellé 1,code2:Libellé 2"
//        [--contexte "…"] [--lien <url>] [--objet <type:id>] [--dry-run]
//   node scripts/growth/decision.mjs lire <Id>
//   node scripts/growth/decision.mjs liste [--en-attente] [--agent <nom>] [--motifs] [--depuis <jours>]
//   node scripts/growth/decision.mjs expirer [--jours 14]        (en_attente trop vieilles → expiré, boutons retirés)
//
// Stockage : table NocoDB `Decisions` (Question, Contexte, Options = JSON [{code, libelle}], Agent,
// Choix, ChoixLibelle, Commentaire, Status en_attente|répondu|expiré, TG_MsgId, RepondueAt, Lien,
// Objet). La carte part directement (sendMessage, HTML échappé, 2 à 6 boutons,
// `callback_data = choix:<Id>:<code>` ≤ 64 octets). Le CLIC est traité par n8n WF-TG-ROUTER
// (branche `choix`) : Choix + Status `répondu` + RepondueAt, boutons retirés, « ✅ Noté : … ».
// Les motifs de refus des posts et des articles (boutons envoyés par le routeur après un ❌)
// vivent dans la même table, avec `Agent = motif-refus` et `Objet = post:<Id>` / `article:<docId>` :
// `liste --motifs --depuis 14` les rend.
//
// ⛔ Une décision ne déclenche RIEN par elle-même : l'agent qui l'a posée lit la réponse et agit
// dans ses propres garde-fous (aucune dépense, aucun envoi, aucune publication n'en découle seul).
//
// Deux modes, même code :
//   - Mac : NOCODB_URL / NOCODB_TOKEN dans .env.local ;
//   - VPS : installé par ops/agents-autonomes/install.sh en /opt/mm-agents/bin/mm-decision.mjs
//     (root, lecture seule pour l'agent), environnement /etc/mm-agents/env (NocoDB local).
// Le jeton Telegram est lu dans la table Config et ne s'affiche jamais.
// Sortie JSON sur stdout ; code 1 = erreur d'usage ou d'API, 3 = NocoDB/Telegram non configuré.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_DEFAUT = 'ph7ugup4mggzj2y';
const CONFIG = 'mo6ubcgxi9x4u7d';
const TITRE_TABLE = 'Decisions';
const AGENT_MOTIFS = 'motif-refus';

function die(msg, code = 1) { console.error(`✖ ${msg}`); process.exit(code); }

function loadEnv() {
  if (process.env.NOCODB_TOKEN) return;
  for (const f of [resolve(process.cwd(), '.env.local'), '/etc/mm-agents/env']) {
    if (!existsSync(f)) continue;
    try {
      for (const line of readFileSync(f, 'utf8').split('\n')) {
        const m = line.match(/^\s*(?:export\s+)?(NOCODB_[A-Z_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
      }
    } catch { /* illisible : on continue */ }
  }
}

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2), n = argv[i + 1];
      if (n === undefined || n.startsWith('--')) a[k] = true; else { a[k] = n; i++; }
    } else a._.push(argv[i]);
  }
  return a;
}

const base = () => (process.env.NOCODB_URL || 'https://noco.maxmorrys.me').replace(/\/$/, '');
async function noco(path, init = {}) {
  if (!process.env.NOCODB_TOKEN) die('NOCODB_TOKEN absent (.env.local ou /etc/mm-agents/env)', 3);
  const res = await fetch(base() + path, {
    ...init,
    headers: { 'xc-token': process.env.NOCODB_TOKEN, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  const t = await res.text();
  if (!res.ok) die(`NocoDB HTTP ${res.status} : ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

let tableId = process.env.NOCODB_TABLE_DECISIONS || '';
async function table() {
  if (tableId) return tableId;
  const j = await noco(`/api/v2/meta/bases/${process.env.NOCODB_BASE || BASE_DEFAUT}/tables`);
  const t = (j.list || []).find((x) => x.title === TITRE_TABLE);
  if (!t) die(`table NocoDB « ${TITRE_TABLE} » introuvable`, 3);
  return (tableId = t.id);
}

async function cfg(cle) {
  const j = await noco(`/api/v2/tables/${CONFIG}/records?where=${encodeURIComponent(`(Cle,eq,${cle})`)}&fields=Cle,Valeur&limit=1`);
  return String(j.list?.[0]?.Valeur ?? '').trim();
}

async function telegram(methode, corps) {
  const token = await cfg('TELEGRAM_BOT_TOKEN');
  if (!token) die('TELEGRAM_BOT_TOKEN absent de Config', 3);
  const res = await fetch(`https://api.telegram.org/bot${token}/${methode}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corps),
    signal: AbortSignal.timeout(20000),
  });
  const j = await res.json().catch(() => ({}));
  if (!j.ok) throw new Error(`Telegram ${methode} : ${String(j.description || res.status).slice(0, 200)}`);
  return j.result;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** "a:Libellé A,b:Libellé B" (ou séparées par « | » si un libellé contient une virgule). */
export function lireOptions(brut) {
  const s = String(brut || '');
  const items = (s.includes('|') ? s.split('|') : s.split(',')).map((x) => x.trim()).filter(Boolean);
  const options = items.map((x) => {
    const i = x.indexOf(':');
    if (i <= 0) die(`option « ${x} » : forme attendue code:Libellé`);
    return { code: x.slice(0, i).trim(), libelle: x.slice(i + 1).trim() };
  });
  if (options.length < 2 || options.length > 6) die(`2 à 6 options (reçu ${options.length})`);
  const vus = new Set();
  for (const o of options) {
    if (!/^[a-z0-9_-]{1,24}$/i.test(o.code)) die(`code « ${o.code} » : lettres, chiffres, _ ou -, 24 au plus`);
    if (vus.has(o.code)) die(`code « ${o.code} » en double`);
    vus.add(o.code);
    if (!o.libelle || o.libelle.length > 60) die(`libellé de « ${o.code} » vide ou > 60 caractères`);
  }
  return options;
}

export function clavier(id, options) {
  const boutons = options.map((o) => ({ text: o.libelle, callback_data: `choix:${id}:${o.code}` }));
  for (const b of boutons) if (Buffer.byteLength(b.callback_data) > 64) die(`callback_data > 64 octets : ${b.callback_data}`);
  const court = options.every((o) => o.libelle.length <= 18);
  const lignes = [];
  for (let i = 0; i < boutons.length; i += court ? 2 : 1) lignes.push(boutons.slice(i, i + (court ? 2 : 1)));
  return { inline_keyboard: lignes };
}

export function texteCarte(id, d) {
  return '🤔 <b>Décision à prendre</b> — ' + esc(d.agent) + '\n\n<b>' + esc(d.question) + '</b>' +
    (d.contexte ? '\n\n' + esc(String(d.contexte).slice(0, 2500)) : '') +
    (d.lien ? '\n\n🔗 ' + esc(d.lien) : '') +
    '\n\n<i>Décision #' + id + ' · clique un bouton</i>';
}

const plat = (r) => {
  let options = [];
  try { options = JSON.parse(r.Options || '[]'); } catch { /* illisible */ }
  return {
    id: r.Id, agent: r.Agent, question: r.Question, contexte: r.Contexte || '', options,
    statut: r.Status, choix: r.Choix || '', choixLibelle: r.ChoixLibelle || '', commentaire: r.Commentaire || '',
    repondueAt: r.RepondueAt || '', creeeAt: r.CreatedAt || '', lien: r.Lien || '', objet: r.Objet || '',
  };
};

async function ask(a) {
  for (const k of ['agent', 'question', 'options']) if (!a[k] || a[k] === true) die(`--${k} obligatoire`);
  const options = lireOptions(a.options);
  if (a.lien && a.lien !== true && !/^https:\/\//.test(a.lien)) die('--lien attend une URL https');
  const d = {
    agent: String(a.agent).slice(0, 40), question: String(a.question).slice(0, 300),
    contexte: a.contexte && a.contexte !== true ? String(a.contexte) : '',
    lien: a.lien && a.lien !== true ? String(a.lien) : '', objet: a.objet && a.objet !== true ? String(a.objet).slice(0, 80) : '',
  };
  if (a['dry-run'] || process.env.MM_DRY_RUN === '1') {
    console.log(JSON.stringify({ simulation: true, carte: texteCarte('…', d), boutons: clavier('9999', options) }, null, 2));
    return;
  }
  const t = await table();
  const cree = await noco(`/api/v2/tables/${t}/records`, {
    method: 'POST',
    body: JSON.stringify({
      Question: d.question, Contexte: d.contexte, Options: JSON.stringify(options), Agent: d.agent,
      Status: 'en_attente', Lien: d.lien, Objet: d.objet,
    }),
  });
  const id = cree.Id ?? cree.id;
  if (!id) die('NocoDB : création sans Id');
  const chat = await cfg('TELEGRAM_CHAT_ID');
  if (!chat) die('TELEGRAM_CHAT_ID absent de Config', 3);
  try {
    const m = await telegram('sendMessage', {
      chat_id: chat, text: texteCarte(id, d), parse_mode: 'HTML', reply_markup: clavier(id, options),
      link_preview_options: { is_disabled: true },
    });
    await noco(`/api/v2/tables/${t}/records`, { method: 'PATCH', body: JSON.stringify({ Id: id, TG_MsgId: String(m.message_id) }) });
    console.log(JSON.stringify({ id, statut: 'en_attente', carte: 'envoyée', tg_msg_id: m.message_id }));
  } catch (e) {
    await noco(`/api/v2/tables/${t}/records`, { method: 'PATCH', body: JSON.stringify({ Id: id, Status: 'expiré', Commentaire: `carte non envoyée : ${e.message}` }) });
    die(`décision #${id} créée mais carte non envoyée (${e.message}) : marquée expirée`);
  }
}

async function lire(id) {
  if (!/^\d+$/.test(String(id || ''))) die('usage : decision.mjs lire <Id>');
  const r = await noco(`/api/v2/tables/${await table()}/records/${id}`);
  console.log(JSON.stringify(plat(r), null, 2));
}

async function liste(a) {
  const w = [];
  if (a['en-attente']) w.push('(Status,eq,en_attente)');
  if (a.motifs) w.push(`(Agent,eq,${AGENT_MOTIFS})`);
  else if (a.agent && a.agent !== true) w.push(`(Agent,eq,${a.agent})`);
  if (a.depuis && a.depuis !== true) {
    const jours = Number(a.depuis);
    if (!(jours > 0)) die('--depuis attend un nombre de jours');
    const d = new Date(Date.now() - jours * 864e5).toISOString().slice(0, 10);
    w.push(`(CreatedAt,ge,exactDate,${d})`);
  }
  const q = new URLSearchParams({ limit: '200', sort: '-Id' });
  if (w.length) q.set('where', w.join('~and'));
  const j = await noco(`/api/v2/tables/${await table()}/records?${q}`);
  console.log(JSON.stringify((j.list || []).map(plat), null, 2));
}

async function expirer(a) {
  const jours = a.jours && a.jours !== true ? Number(a.jours) : 14;
  const t = await table();
  const j = await noco(`/api/v2/tables/${t}/records?${new URLSearchParams({ where: '(Status,eq,en_attente)', limit: '200' })}`);
  const limite = Date.now() - jours * 864e5;
  const vieilles = (j.list || []).filter((r) => r.CreatedAt && new Date(String(r.CreatedAt).replace(' ', 'T')).getTime() < limite);
  if (!vieilles.length) { console.log(JSON.stringify({ expirees: 0 })); return; }
  const chat = await cfg('TELEGRAM_CHAT_ID');
  for (const r of vieilles) {
    await noco(`/api/v2/tables/${t}/records`, { method: 'PATCH', body: JSON.stringify({ Id: r.Id, Status: 'expiré' }) });
    if (r.TG_MsgId && chat) {
      try { await telegram('editMessageReplyMarkup', { chat_id: chat, message_id: Number(r.TG_MsgId), reply_markup: { inline_keyboard: [] } }); } catch { /* message trop vieux */ }
    }
  }
  console.log(JSON.stringify({ expirees: vieilles.length, ids: vieilles.map((r) => r.Id) }));
}

async function main() {
  loadEnv();
  const a = parseArgs(process.argv.slice(2));
  const cmd = a._[0];
  if (cmd === 'ask') return ask(a);
  if (cmd === 'lire') return lire(a._[1]);
  if (cmd === 'liste') return liste(a);
  if (cmd === 'expirer') return expirer(a);
  die('usage : decision.mjs ask --agent <nom> --question "…" --options "code:Libellé,…" [--contexte "…"] [--lien URL] [--objet type:id] [--dry-run]\n' +
    '        decision.mjs lire <Id> · liste [--en-attente] [--agent <nom>] [--motifs] [--depuis <jours>] · expirer [--jours 14]');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('decision.mjs')) {
  main().catch((e) => die(e.message));
}
