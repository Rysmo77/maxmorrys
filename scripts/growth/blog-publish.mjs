#!/usr/bin/env node
// Dépose un article versionné (content/blog/<slug>.md) dans Firestore `blog/`, EN BROUILLON.
//
// La mise en ligne reste un geste humain dans l'admin (/admin/articles → Publier) : c'est là
// que vivent les règles Firestore et l'envoi `notifyOnPublish` aux abonnés. Ce script ne pose
// jamais `status: 'published'`.
//
//   node scripts/growth/blog-publish.mjs content/blog/<slug>.md            (simulation)
//   node scripts/growth/blog-publish.mjs content/blog/<slug>.md --apply    (crée le brouillon)
//   node scripts/growth/blog-publish.mjs content/blog/<slug>.md --apply --update <docId>
//        (met à jour un BROUILLON existant ; refuse un article déjà publié)
//
// Avant d'écrire : le contrôle de charte (blog-lint) doit passer sans erreur, et le slug
// (fr comme en) ne doit appartenir à aucun autre document.
//
// Identifiants : compte de service Firebase (fichier JSON, jamais commité) pris dans
// GOOGLE_APPLICATION_CREDENTIALS, sinon le premier `max-morrys-*.json` à la racine.

import { readFileSync, readdirSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readArticle, readTime } from './article.mjs';

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = args._[0];
  if (!file) die('usage : blog-publish.mjs content/blog/<slug>.md [--apply] [--update <docId>]');

  // 1. Charte
  const lint = spawnSync(process.execPath, ['scripts/growth/blog-lint.mjs', file], { stdio: 'inherit' });
  if (lint.status !== 0) die('le contrôle de charte a relevé des erreurs : corriger avant de déposer.');

  // 2. Document
  const { meta, body } = readArticle(file);
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
    noIndex: meta.noIndex === true,
    canonicalUrl: '',
  };

  if (!args.apply) {
    const { content, ...apercu } = doc;
    console.log('\nSIMULATION — brouillon qui serait déposé dans Firestore `blog/` :');
    console.log(JSON.stringify({ ...apercu, content: `(${content.length} caractères)` }, null, 2));
    console.log('\nRelance avec --apply pour déposer le brouillon (accord de Max requis).');
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
  console.log(`\n✔ Brouillon ${args.update ? 'mis à jour' : 'créé'} : blog/${id}`);
  console.log('  Mise en ligne : /admin/articles → ouvrir le brouillon → Publier (déclenche la notification des abonnés).');
  console.log(`  Ensuite : https://maxmorrys.me/blog/${doc.slug} (prérendu sous 5 min, sitemap et RSS sous 1 h).`);
}

main().catch((e) => die(e.message));
