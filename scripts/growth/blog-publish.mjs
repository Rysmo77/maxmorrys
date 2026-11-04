#!/usr/bin/env node
// Dépose un article versionné (content/blog/<slug>.md) dans Firestore `blog/`, EN BROUILLON,
// et le SOUMET à la validation de Max dans Telegram (depuis le 04/11/2026).
//
// La mise en ligne reste un geste humain : le clic « ✅ Publier » sous la carte Telegram
// (WF-BLOG-NOTIFY envoie la carte, WF-TG-ROUTER relaie le clic au Worker api `blog/validation`,
// qui publie et prévient les abonnés), ou l'admin (/admin/articles → Publier). Ce script ne pose
// JAMAIS `status: 'published'`.
//
// Soumission : le brouillon porte `pretAValider: true` et `telegramNotifiedAt: ''` ; après
// l'écriture, le script réveille WF-BLOG-NOTIFY (webhook n8n `mm-run-article`, clé
// `N8N_BLOG_TRIGGER_KEY` de .env.local). Sans clé ou si l'appel échoue, la carte part quand même
// au passage suivant du workflow (toutes les 30 min, 6 h-22 h 30, heure de Dakar).
// `--sans-carte` dépose un brouillon de travail sans le soumettre (`pretAValider: false`).
// Un article dont l'en-tête porte `test: true` reçoit une carte « 🧪 TEST » : le Worker refuse
// de le publier quoi qu'on clique (il simule et n'écrit rien).
//
//   node scripts/growth/blog-publish.mjs content/blog/<slug>.md            (simulation)
//   node scripts/growth/blog-publish.mjs content/blog/<slug>.md --apply    (crée le brouillon + carte Telegram)
//   node scripts/growth/blog-publish.mjs content/blog/<slug>.md --apply --update <docId>
//        (met à jour un BROUILLON existant et renvoie une carte ; refuse un article déjà publié)
//   … --apply --sans-carte   (brouillon de travail, sans carte Telegram)
//   node scripts/growth/blog-publish.mjs content/blog/<slug>.md --cover-only [--force]
//        (rend SEULEMENT la couverture et écrit `coverImage` dans l'en-tête du fichier)
//
// Couverture (décision de Max du 01/11/2026) : si l'en-tête n'a pas de `coverImage`, elle est
// rendue par render-card (famille `couverture`, kit DS, 1200×630) via le VPS — la clé reste
// là-bas — et déposée sur R2 (`https://media.maxmorrys.me/social-cards/…`). Elle remplit
// `coverImage` ET `ogImage`. Mode hybride par défaut : photo générée par Workers AI depuis le
// titre et le pôle ; `--fond <url>` impose une photo ; `--sans-photo` rend la version
// typographique. Si la génération échoue, la couverture sort typographique (et le script le dit).
// En simulation, la couverture est rendue (URL affichée, `--out <dossier>` pour le PNG) mais
// rien n'est écrit. Conseil : `--cover-only` d'abord, la simulation et `--apply` réutilisent
// alors la couverture écrite dans l'en-tête (une seule génération payante).
//
// Avant d'écrire : le contrôle de charte (blog-lint) doit passer sans erreur, et le slug
// (fr comme en) ne doit appartenir à aucun autre document.
//
// Identifiants : compte de service Firebase (fichier JSON, jamais commité) pris dans
// GOOGLE_APPLICATION_CREDENTIALS, sinon le premier `max-morrys-*.json` à la racine.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createSign } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readArticle, readTime } from './article.mjs';
import { chargeArticle } from './couverture.mjs';
import { renderVps } from './nayo.mjs';

function die(msg) { console.error(`✖ ${msg}`); process.exit(1); }

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      const n = argv[i + 1];
      if (n === undefined || n.startsWith('--')) a[k] = true; else { a[k] = n; i++; }
    } else a._.push(argv[i]);
  }
  return a;
}

/** Lit une variable dans l'environnement, sinon dans .env.local (dernière occurrence). */
function envLocal(nom) {
  if (process.env[nom]) return process.env[nom];
  let v = '';
  try {
    for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = l.match(new RegExp(`^(?:export\\s+)?${nom}=(.*)$`));
      if (m) v = m[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* pas de .env.local */ }
  return v;
}

/** Réveille WF-BLOG-NOTIFY pour que la carte parte tout de suite. Ne lève jamais. */
async function reveillerCarte(id) {
  const cle = envLocal('N8N_BLOG_TRIGGER_KEY');
  if (!cle) return 'N8N_BLOG_TRIGGER_KEY absente de .env.local';
  try {
    const r = await fetch('https://n8n.maxmorrys.me/webhook/mm-run-article', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-MM-Blog-Trigger': cle },
      body: JSON.stringify({ id, source: 'blog-publish' }),
      signal: AbortSignal.timeout(15000),
    });
    return r.ok ? '' : `webhook n8n HTTP ${r.status}`;
  } catch (e) {
    return `webhook n8n injoignable (${e.message})`;
  }
}

function serviceAccount() {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || readdirSync('.').find((f) => /^max-morrys-.*\.json$/.test(f));
  if (!path) die('compte de service introuvable (GOOGLE_APPLICATION_CREDENTIALS ou max-morrys-*.json à la racine).');
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function accessToken(sa) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const j = await res.json();
  if (!j.access_token) die(`authentification Google refusée : ${JSON.stringify(j).slice(0, 300)}`);
  return j.access_token;
}

const toValue = (v) => {
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  return { stringValue: String(v ?? '') };
};
const fromValue = (v) => v.stringValue ?? v.booleanValue ?? v.integerValue ?? v.doubleValue ?? null;

/** Rend la couverture via render-card (VPS). Renvoie l'URL R2 et, si une photo a été générée, son URL. */
async function rendreCouverture(meta, args) {
  // Photo : `--fond` d'abord, sinon celle déjà générée pour cet article (`coverFond`, réutilisée
  // quand on refait la couverture après un changement de titre : pas de seconde génération).
  const fond = typeof args.fond === 'string' ? args.fond : (args['sans-photo'] ? '' : (meta.coverFond || ''));
  if (args.fond !== undefined && !/^https:\/\//.test(fond)) die('--fond attend une URL https.');
  const charge = chargeArticle(meta, { fond, photo: !args['sans-photo'] });
  const mode = charge.fond ? 'hybride (photo fournie)' : charge.fondPrompt ? 'hybride (photo générée par Workers AI)' : 'typographique';
  console.error(`… couverture ${mode} — territoire ${charge.territoire}, titre « ${charge.title} »`);
  const r = renderVps(charge);
  if (r.fondErreur) console.error(`⚠ photo non générée (${r.fondErreur}) : couverture typographique.`);
  if (args.out && args.out !== true) {
    const dir = resolve(args.out);
    mkdirSync(dir, { recursive: true });
    const f = join(dir, `${meta.slug || 'article'}-couverture.png`);
    writeFileSync(f, Buffer.from(await (await fetch(r.url)).arrayBuffer()));
    console.error(`✔ ${f}`);
  }
  return { url: r.url, fond: r.fond || charge.fond || '' };
}

/** Écrit `cle: "valeur"` dans l'en-tête du fichier (remplace la ligne existante, sinon l'ajoute). */
function ecrireEnTete(file, cle, valeur) {
  const texte = readFileSync(file, 'utf8');
  const m = texte.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!m) die(`${file} : en-tête introuvable.`);
  const lignes = m[2].split(/\r?\n/);
  const i = lignes.findIndex((l) => new RegExp(`^${cle}\\s*:`).test(l));
  const ligne = `${cle}: "${valeur}"`;
  if (i >= 0) lignes[i] = ligne; else lignes.push(ligne);
  writeFileSync(file, m[1] + lignes.join('\n') + texte.slice(m[1].length + m[2].length));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = args._[0];
  if (!file) die('usage : blog-publish.mjs content/blog/<slug>.md [--apply] [--update <docId>] [--cover-only [--force]] [--fond <url> | --sans-photo] [--out <dossier>]');

  // 0. Couverture seule : rien d'autre n'est lu ni écrit.
  if (args['cover-only']) {
    const { meta } = readArticle(file);
    if (meta.coverImage && !args.force) die(`coverImage déjà rempli (${meta.coverImage}) : --force pour la refaire.`);
    const c = await rendreCouverture(meta, args);
    ecrireEnTete(file, 'coverImage', c.url);
    if (c.fond) ecrireEnTete(file, 'coverFond', c.fond);
    console.log(JSON.stringify({ coverImage: c.url, coverFond: c.fond || undefined, ecrit: file }, null, 2));
    return;
  }

  // 1. Charte
  const lint = spawnSync(process.execPath, ['scripts/growth/blog-lint.mjs', file], { stdio: 'inherit' });
  if (lint.status !== 0) die('le contrôle de charte a relevé des erreurs : corriger avant de déposer.');

  // 2. Document (+ couverture automatique si l'en-tête n'en a pas)
  const { meta, body } = readArticle(file);
  let couverture = null;
  if (!meta.coverImage) {
    couverture = await rendreCouverture(meta, args);
    meta.coverImage = couverture.url;
  }
  const doc = {
    title: meta.title,
    slug: meta.slug,
    slug_en: meta.slug_en,
    excerpt: meta.excerpt,
    content: body.trim() + '\n',
    category: meta.category,
    coverImage: meta.coverImage || '',
    tags: meta.tags || [],
    author: 'Max-Morrys',
    // Vide : l'admin posera la date du jour au moment de publier (useArticles.ts).
    publishedAt: meta.publishedAt || '',
    updatedAt: new Date().toISOString(),
    readTime: readTime(body),
    featured: meta.featured === true,
    status: 'draft',
    focusKeyword: meta.focusKeyword || '',
    metaTitle: meta.metaTitle || '',
    metaDescription: meta.metaDescription || meta.excerpt,
    ogTitle: meta.ogTitle || '',
    ogDescription: meta.ogDescription || '',
    ogImage: meta.ogImage || meta.coverImage || '',
    twitterTitle: '', twitterDescription: '', twitterImage: '',
    noIndex: meta.noIndex === true || meta.test === true,
    canonicalUrl: '',
    // Validation Telegram : soumis (sauf --sans-carte), carte pas encore partie.
    pretAValider: !args['sans-carte'],
    telegramNotifiedAt: '',
    telegramMessageId: '',
    // Article de test : le Worker refuse de le publier (simulation), quel que soit le clic.
    test: meta.test === true,
  };

  if (!args.apply) {
    const { content, ...apercu } = doc;
    console.log('\nSIMULATION — brouillon qui serait déposé dans Firestore `blog/` :');
    console.log(JSON.stringify({ ...apercu, content: `(${content.length} caractères)` }, null, 2));
    if (couverture) console.log(`\nCouverture rendue (non écrite dans le fichier) : ${couverture.url}\n  → --cover-only pour l'écrire dans l'en-tête et ne pas la regénérer à l'--apply.`);
    console.log(`\nRelance avec --apply pour déposer le brouillon${doc.pretAValider ? ' et envoyer la carte de validation Telegram' : ''} (accord de Max requis).`);
    return;
  }

  // 3. Unicité des slugs, puis écriture
  const sa = serviceAccount();
  const token = await accessToken(sa);
  const base = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  for (const [field, value] of [['slug', doc.slug], ['slug_en', doc.slug_en], ['slug', doc.slug_en], ['slug_en', doc.slug]]) {
    const r = await fetch(`${base}:runQuery`, {
      method: 'POST', headers,
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'blog' }], where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } }, limit: 5 } }),
    });
    const rows = (await r.json()).filter((x) => x.document);
    const autres = rows.filter((x) => x.document.name.split('/').pop() !== args.update);
    if (autres.length) die(`le slug « ${value} » est déjà pris (${field}) par ${autres.map((x) => x.document.name.split('/').pop()).join(', ')}.`);
  }

  const fields = Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, toValue(v)]));
  let res;
  if (args.update && args.update !== true) {
    const cur = await (await fetch(`${base}/blog/${args.update}`, { headers })).json();
    if (cur.error) die(`document ${args.update} introuvable : ${cur.error.message}`);
    if (fromValue(cur.fields?.status ?? {}) !== 'draft') die('cet article n\'est pas un brouillon : le modifier depuis l\'admin.');
    const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    res = await fetch(`${base}/blog/${args.update}?${mask}`, { method: 'PATCH', headers, body: JSON.stringify({ fields }) });
  } else {
    res = await fetch(`${base}/blog`, { method: 'POST', headers, body: JSON.stringify({ fields }) });
  }
  const out = await res.json();
  if (out.error) die(`Firestore a refusé l'écriture : ${out.error.message}`);
  const id = out.name.split('/').pop();
  // Le fichier versionné garde la couverture déposée.
  if (couverture) {
    ecrireEnTete(file, 'coverImage', couverture.url);
    if (couverture.fond) ecrireEnTete(file, 'coverFond', couverture.fond);
  }
  console.log(`\n✔ Brouillon ${args.update ? 'mis à jour' : 'créé'} : blog/${id}${doc.test ? '  (🧪 article de TEST : jamais publiable)' : ''}`);
  if (doc.pretAValider) {
    const echec = await reveillerCarte(id);
    console.log(echec
      ? `  ⚠ Carte Telegram non déclenchée tout de suite (${echec}) : elle partira au prochain passage de WF-BLOG-NOTIFY (≤ 30 min, 6 h-22 h 30).`
      : '  📨 Carte de validation envoyée à Max dans Telegram (couverture, résumé, article complet en pièce jointe, boutons ✅ Publier / ❌ Refuser).');
    console.log('  Mise en ligne : clic « ✅ Publier » sous la carte (publie, prévient les abonnés, vérifie la page 6 min après),');
    console.log('  ou /admin/articles → ouvrir le brouillon → Publier.');
  } else {
    console.log('  Brouillon de travail (--sans-carte) : aucune carte Telegram. Mise en ligne : /admin/articles → Publier,');
    console.log('  ou redéposer sans --sans-carte (`--apply --update ' + id + '`) pour soumettre à validation.');
  }
  console.log(`  Ensuite : https://maxmorrys.me/blog/${doc.slug} (prérendu sous 5 min, sitemap et RSS sous 1 h).`);
}

main().catch((e) => die(e.message));
