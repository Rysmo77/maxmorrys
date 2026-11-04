#!/usr/bin/env node
// Lecture SEULE de Firestore pour les agents autonomes (aucune écriture : uniquement des GET).
//
// Installé dans /opt/mm-agents/bin/mm-firestore.mjs (root). Compte de service Firebase lu dans
// GOOGLE_APPLICATION_CREDENTIALS (fichier /etc/mm-agents/firebase-sa.json, 600) ; absent →
// message clair et code 3, pour que la mission le signale au lieu d'échouer en silence.
//
// Chaque tâche n'ouvre que SES collections (variable MM_TACHE posée par le lanceur) :
//   node mm-firestore.mjs blog                         articles : titre, slugs, statut, dates
//   node mm-firestore.mjs formations                   formations publiées : modules et leçons (contenu vide ou non)
//   node mm-firestore.mjs formations --contenu         … avec le contenu des leçons déjà rédigées
//   node mm-firestore.mjs rysmo --depuis AAAA-MM-JJ    questions posées à Rysmo, ANONYMISÉES (ni uid, ni e-mail, ni numéro)
//   node mm-firestore.mjs collection <nom> [--depuis AAAA-MM-JJ] [--champ createdAt] [--limite 500]
//
// Les ventes (tâche `revenus`) sortent sans donnée personnelle (e-mail, téléphone, nom, adresse
// retirés ; identifiants d'utilisateur remplacés par une empreinte courte).

import { readFileSync, existsSync } from 'node:fs';
import { createSign, createHash } from 'node:crypto';

const PERMIS = {
  article: ['blog'], diffusion: ['blog'], 'seo-mensuel': ['blog'], conformite: ['blog'],
  'revue-mensuelle': ['blog'], lettre: ['blog'],
  lecons: ['formations'],
  'rysmo-faq': ['rysmo'],
  demandes: ['agency_leads', 'agency_quotes', 'engagement_leads', 'messages', 'appointments'],
  revenus: ['transactions', 'club_subscriptions', 'rysmoSubscriptions', 'rysmoPackPurchases', 'enrollments'],
};
const ANONYME = new Set(['revenus']);

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : undefined; };
const [cmd, nom] = argv;
const tache = process.env.MM_TACHE || '';
const die = (m, code = 1) => { console.error('✖ ' + m); process.exit(code); };

const cible = cmd === 'collection' ? nom : cmd;
if (!cible) die('usage : mm-firestore.mjs <blog | formations [--contenu] | rysmo --depuis J | collection <nom> [--depuis J] [--champ c] [--limite n]>', 2);
if (!(PERMIS[tache] || []).includes(cible)) die(`la tâche « ${tache || '?'} » n'a pas accès à « ${cible} » (permis : ${(PERMIS[tache] || []).join(', ') || 'aucun'})`, 2);

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!saPath || !existsSync(saPath)) die('compte de service Firebase absent du VPS (GOOGLE_APPLICATION_CREDENTIALS) : lecture Firestore impossible — voir ops/agents-autonomes/README.md § Secrets', 3);
const sa = JSON.parse(readFileSync(saPath, 'utf8'));

async function jeton() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const u = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(u).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${u}.${sig}` }) });
  const j = await r.json();
  if (!j.access_token) die('authentification Google refusée (compte de service invalide ou révoqué)');
  return j.access_token;
}

const val = (v) => {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('referenceValue' in v) return v.referenceValue.split('/documents/')[1];
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)]));
  return null;
};

async function lister(collection, max = 3000) {
  const tok = await jeton();
  const base = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${collection}`;
  const out = [];
  let page = '';
  do {
    const q = new URLSearchParams({ pageSize: '300' });
    if (page) q.set('pageToken', page);
    const r = await fetch(`${base}?${q}`, { headers: { Authorization: `Bearer ${tok}` }, signal: AbortSignal.timeout(60000) });
    const j = await r.json();
    if (!r.ok) die(`Firestore HTTP ${r.status} sur ${collection} : ${(j.error && j.error.message || '').slice(0, 200)}`);
    for (const d of j.documents || []) out.push({ id: d.name.split('/').pop(), ...val({ mapValue: { fields: d.fields || {} } }), _maj: d.updateTime });
    page = j.nextPageToken || '';
  } while (page && out.length < max);
  return out;
}

const jour = (x) => { const s = typeof x === 'string' ? x : x && x.seconds ? new Date(x.seconds * 1000).toISOString() : ''; return s.slice(0, 10); };
const PII = /e-?mail|phone|t[ée]l[ée]?phone|^tel$|whatsapp|^name$|^nom$|pr[ée]nom|displayName|fullName|firstName|lastName|address|adresse|^ip$|userAgent/i;
const empreinte = (s) => 'u_' + createHash('sha256').update(String(s)).digest('hex').slice(0, 8);
function anonymiser(o) {
  if (Array.isArray(o)) return o.map(anonymiser);
  if (!o || typeof o !== 'object') return o;
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    if (PII.test(k)) continue;
    r[k] = /^(uid|userId|user_id|customerId|ownerId)$/.test(k) && typeof v === 'string' ? empreinte(v) : anonymiser(v);
  }
  return r;
}
const nettoyerTexte = (t) => String(t || '')
  .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[e-mail]')
  .replace(/(\+?\d[\d .-]{6,}\d)/g, '[numéro]')
  .replace(/https?:\/\/\S+/g, '[lien]')
  .slice(0, 600);

async function main() {
  if (cmd === 'blog') {
    const docs = await lister('blog');
    const l = docs.map((d) => ({ id: d.id, titre: d.title, slug: d.slug, slug_en: d.slug_en, statut: d.status, categorie: d.category, publie_le: d.publishedAt, cree_le: d.createdAt, maj: d._maj }))
      .sort((a, b) => String(b.publie_le || b.cree_le || '').localeCompare(String(a.publie_le || a.cree_le || '')));
    console.log(JSON.stringify(l, null, 2)); console.error(`${l.length} article(s)`); return;
  }
  if (cmd === 'formations') {
    const docs = (await lister('formations')).filter((f) => f.status === 'published');
    const avecContenu = opt('contenu') === true;
    const l = docs.map((f) => ({
      id: f.id, titre: f.title, slug: f.slug, niveau: f.level, description: f.description,
      modules: (f.modules || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((m) => ({
        id: m.id, titre: m.title, ordre: m.order,
        lecons: (m.lessons || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((x) => ({
          id: x.id, titre: x.title, type: x.type, ordre: x.order, duree: x.duration, gratuite: x.isFree,
          contenu_vide: !String(x.content || '').trim(), longueur: String(x.content || '').length,
          ...(avecContenu && String(x.content || '').trim() ? { contenu: x.content } : {}),
        })),
      })),
    }));
    console.log(JSON.stringify(l, null, 2)); console.error(`${l.length} formation(s) publiée(s)`); return;
  }
  if (cmd === 'rysmo') {
    const depuis = opt('depuis');
    if (typeof depuis !== 'string') die('rysmo : --depuis AAAA-MM-JJ requis', 2);
    const docs = await lister('rysmoConversations');
    const q = [];
    for (const d of docs) for (const m of d.messages || []) if (m && m.role === 'user' && String(m.ts || '').slice(0, 10) >= depuis) q.push({ jour: String(m.ts).slice(0, 10), question: nettoyerTexte(m.content) });
    q.sort(() => Math.random() - 0.5); // aucun ordre qui permette de recoller une conversation
    console.log(JSON.stringify({ depuis, conversations_actives: docs.filter((d) => String(d.updatedAt || '').slice(0, 10) >= depuis).length, questions: q }, null, 2));
    console.error(`${q.length} question(s)`); return;
  }
  if (cmd === 'collection') {
    const champ = typeof opt('champ') === 'string' ? opt('champ') : 'createdAt';
    const depuis = typeof opt('depuis') === 'string' ? opt('depuis') : '';
    const limite = Number(opt('limite')) || 500;
    let l = await lister(nom);
    if (depuis) l = l.filter((d) => (jour(d[champ]) || jour(d._maj)) >= depuis);
    l = l.sort((a, b) => String(jour(b[champ]) || b._maj).localeCompare(String(jour(a[champ]) || a._maj))).slice(0, limite);
    if (ANONYME.has(tache)) l = l.map(anonymiser);
    console.log(JSON.stringify(l, null, 2)); console.error(`${l.length} document(s) dans ${nom}`); return;
  }
  die('commande inconnue', 2);
}
main().catch((e) => die(String(e.message || e).slice(0, 300)));
