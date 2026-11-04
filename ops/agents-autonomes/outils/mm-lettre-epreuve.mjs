#!/usr/bin/env node
// Envoie l'ÉPREUVE d'une lettre (mode « test ») par la route POST /marketing/campagne.
// Ne peut PAS envoyer le réel : toute demande en `mode: "reel"` est refusée, et le mode est
// forcé à « test » avant l'envoi. L'épreuve part vers une adresse de MARKETING_TEST_TO (Worker).
//
// Installé dans /opt/mm-agents/bin/mm-lettre-epreuve.mjs (root). Clé : MM_MARKETING_KEY_FILE
// (/etc/mm-agents/marketing.key, 600) — absente → code 3 et message clair, rien n'est envoyé.
//
//   node mm-lettre-epreuve.mjs _bmad-output/growth/lettres/<date>-lettre-<n>.json

import { readFileSync, existsSync } from 'node:fs';

const die = (m, c = 1) => { console.error('✖ ' + m); process.exit(c); };
const f = process.argv[2];
if (!f || !/^_bmad-output\/growth\/lettres\/[\w.-]+\.json$/.test(f)) die('usage : mm-lettre-epreuve.mjs _bmad-output/growth/lettres/<fichier>.json', 2);
let d; try { d = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { die('JSON illisible : ' + e.message, 2); }
if (d.mode && d.mode !== 'test') die(`mode « ${d.mode} » refusé : cet outil n'envoie que des épreuves (mode test)`, 2);
d.mode = 'test';

const kf = process.env.MM_MARKETING_KEY_FILE;
if (!kf || !existsSync(kf)) die('clé marketing absente du VPS (MM_MARKETING_KEY_FILE) : épreuve NON envoyée — voir ops/agents-autonomes/README.md § Secrets', 3);
const cle = readFileSync(kf, 'utf8').trim();
const url = process.env.MM_MARKETING_URL || 'https://api.maxmorrys.me/marketing/campagne';

const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'X-Marketing-Key': cle }, body: JSON.stringify(d), signal: AbortSignal.timeout(60000) });
const t = await r.text();
let j; try { j = JSON.parse(t); } catch { j = { brut: t.slice(0, 300) }; }
console.log(JSON.stringify({ http: r.status, ...j }, null, 2).split(cle).join('***'));
if (!r.ok) process.exit(1);
