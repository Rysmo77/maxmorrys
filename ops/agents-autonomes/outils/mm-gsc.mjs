#!/usr/bin/env node
// Google Search Console en LECTURE SEULE (portée webmasters.readonly) pour les agents autonomes.
//
// Installé dans /opt/mm-agents/bin/mm-gsc.mjs (root). Compte de service : MM_GSC_SA
// (/etc/mm-agents/gsc-sa.json, copie de /opt/maxmorrys-stack/gsc-sa.json faite par install.sh).
//
//   node mm-gsc.mjs inspect <url> [<url>…]                 indexation de chaque URL (20 au plus)
//   node mm-gsc.mjs pages --depuis J --jusqu J [--limite 50]    clics, impressions, CTR, position par page
//   node mm-gsc.mjs requetes --depuis J --jusqu J [--limite 50] [--page <url>]   idem par requête

import { readFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';

const SITE = process.env.GSC_SITE_URL || 'sc-domain:maxmorrys.me';
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : undefined; };
const die = (m, c = 1) => { console.error('✖ ' + m); process.exit(c); };
const p = process.env.MM_GSC_SA;
if (!p || !existsSync(p)) die('compte de service Search Console absent (MM_GSC_SA) — voir ops/agents-autonomes/README.md § Secrets', 3);
const sa = JSON.parse(readFileSync(p, 'utf8'));

async function jeton() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const u = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(u).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${u}.${sig}` }) });
  const j = await r.json();
  if (!j.access_token) die('authentification Google refusée');
  return j.access_token;
}
async function post(url, body, tok) {
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`HTTP ${r.status} ${(j.error && j.error.message || '').slice(0, 200)}`);
  return j;
}

async function main() {
  const [cmd, ...rest] = argv;
  const tok = await jeton();
  if (cmd === 'inspect') {
    const urls = rest.filter((x) => /^https:\/\//.test(x)).slice(0, 20);
    if (!urls.length) die('inspect : au moins une URL https://', 2);
    const out = [];
    for (const u of urls) {
      try {
        const j = await post('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', { inspectionUrl: u, siteUrl: SITE, languageCode: 'fr' }, tok);
        const s = j.inspectionResult?.indexStatusResult || {};
        out.push({ url: u, verdict: s.verdict, couverture: s.coverageState, indexation: s.indexingState, dernier_passage: s.lastCrawlTime, canonique_google: s.googleCanonical, robots: s.robotsTxtState, recuperation: s.pageFetchState });
      } catch (e) { out.push({ url: u, erreur: e.message }); }
    }
    console.log(JSON.stringify(out, null, 2)); return;
  }
  if (cmd === 'pages' || cmd === 'requetes') {
    const depuis = opt('depuis'), jusqu = opt('jusqu');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(depuis || '') || !/^\d{4}-\d{2}-\d{2}$/.test(jusqu || '')) die(`${cmd} : --depuis et --jusqu AAAA-MM-JJ`, 2);
    const body = { startDate: depuis, endDate: jusqu, dimensions: [cmd === 'pages' ? 'page' : 'query'], rowLimit: Math.min(Number(opt('limite')) || 50, 500) };
    if (opt('page')) body.dimensionFilterGroups = [{ filters: [{ dimension: 'page', operator: 'equals', expression: opt('page') }] }];
    const j = await post(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, body, tok);
    console.log(JSON.stringify((j.rows || []).map((r) => ({ cle: r.keys[0], clics: r.clicks, impressions: r.impressions, ctr: Math.round(r.ctr * 1000) / 10, position: Math.round(r.position * 10) / 10 })), null, 2)); return;
  }
  die('usage : mm-gsc.mjs <inspect url… | pages --depuis J --jusqu J | requetes --depuis J --jusqu J [--page url]>', 2);
}
main().catch((e) => die(String(e.message || e).slice(0, 300)));
