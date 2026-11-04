#!/usr/bin/env node
// Vérifie chez Meta (Graph API, LECTURE SEULE) ce que NocoDB dit « publié » sur une période,
// et relève les réactions / la portée quand l'API les donne.
//
// Installé dans /opt/mm-agents/bin/mm-meta-verif.mjs (root, hors de portée d'écriture de l'agent).
// Les secrets (META_TOKEN, IG_USER_ID, FB_PAGE_ID) sont lus dans la table Config et ne sortent
// JAMAIS : le jeton voyage dans l'en-tête Authorization, et chaque message d'erreur est expurgé.
// Aucun appel d'écriture : seulement des GET.
//
// Usage : node mm-meta-verif.mjs --depuis 2026-11-02 --jusqu 2026-11-08
//   → JSON sur stdout : { periode, lignes: [{Id, Reseau, Format_Post, Date, Status, id_plateforme,
//      verdict, permalien, mesures, note}], comptes, hors_nocodb: […] }
// verdict ∈ en_ligne | introuvable | sans_id | non_verifiable (réseau non Meta, story expirée…)

const CONFIG = 'mo6ubcgxi9x4u7d';
const CONTENUS = 'm3wim4coagaoot7';
const GRAPH = 'https://graph.facebook.com/v21.0';

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1]; i++; }
}
const jour = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s : null);
const depuis = jour(args.depuis), jusqu = jour(args.jusqu);
if (!depuis || !jusqu) { console.error('usage : mm-meta-verif.mjs --depuis AAAA-MM-JJ --jusqu AAAA-MM-JJ'); process.exit(1); }

const base = (process.env.NOCODB_URL || 'http://127.0.0.1:8091').replace(/\/$/, '');
if (!process.env.NOCODB_TOKEN) { console.error('✖ NOCODB_TOKEN absent (fichier /etc/mm-agents/env)'); process.exit(1); }

let SECRETS = [];
const expurge = (s) => { let t = String(s); for (const x of SECRETS) if (x && x.length > 6) t = t.split(x).join('***'); return t; };

async function noco(path) {
  const r = await fetch(base + path, { headers: { 'xc-token': process.env.NOCODB_TOKEN }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`NocoDB HTTP ${r.status}`);
  return r.json();
}
async function listAll(table, where, fields) {
  const out = [];
  for (let off = 0; ; ) {
    const q = new URLSearchParams({ limit: '100', offset: String(off), fields });
    if (where) q.set('where', where);
    const p = await noco(`/api/v2/tables/${table}/records?${q}`);
    out.push(...p.list);
    if (p.pageInfo?.isLastPage || !p.list.length) return out;
    off += p.list.length;
  }
}

let TOKEN = '';
async function graph(path, params = {}) {
  const q = new URLSearchParams(params);
  const r = await fetch(`${GRAPH}/${path}${q.toString() ? '?' + q : ''}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }, signal: AbortSignal.timeout(30000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) {
    const e = new Error(expurge(j.error ? `${j.error.code || r.status} ${j.error.message || ''}` : `HTTP ${r.status}`));
    e.code = j.error?.code; throw e;
  }
  return j;
}
const essai = async (f) => { try { return await f(); } catch (e) { return { erreur: expurge(e.message) }; } };

async function main() {
  const cfgRows = await listAll(CONFIG, '(Cle,in,META_TOKEN,IG_USER_ID,FB_PAGE_ID)', 'Cle,Valeur');
  const cfg = Object.fromEntries(cfgRows.map((r) => [r.Cle, String(r.Valeur ?? '').trim()]));
  TOKEN = cfg.META_TOKEN || '';
  SECRETS = [TOKEN, process.env.NOCODB_TOKEN];
  if (!TOKEN || !cfg.IG_USER_ID || !cfg.FB_PAGE_ID) throw new Error('META_TOKEN / IG_USER_ID / FB_PAGE_ID manquants dans Config');

  const fields = 'Id,Titre,Reseau,Format_Post,Serie,Offre,Status,Date_Publication_Prevue,Blotato_PostSubmissionID,Blotato_PublicUrl,Erreurs';
  const toutes = await listAll(CONTENUS, '', fields);
  const dansPeriode = (r) => { const d = String(r.Date_Publication_Prevue || '').slice(0, 10); return d >= depuis && d <= jusqu; };
  const lignes = toutes.filter((r) => dansPeriode(r) && ['publié', 'en_publication', 'échec', 'validé'].includes(r.Status));

  // Ce que les comptes montrent vraiment sur la période (pour repérer les écarts dans les deux sens).
  const t0 = Math.floor(Date.parse(depuis + 'T00:00:00Z') / 1000), t1 = Math.floor(Date.parse(jusqu + 'T23:59:59Z') / 1000);
  const igMedia = await essai(async () => {
    const j = await graph(`${cfg.IG_USER_ID}/media`, { fields: 'id,permalink,timestamp,media_type,media_product_type,like_count,comments_count', limit: '50' });
    return (j.data || []).filter((m) => { const t = Date.parse(m.timestamp) / 1000; return t >= t0 && t <= t1; });
  });
  const fbPosts = await essai(async () => {
    const j = await graph(`${cfg.FB_PAGE_ID}/published_posts`, { fields: 'id,permalink_url,created_time', since: String(t0), until: String(t1), limit: '50' });
    return j.data || [];
  });

  const resultat = [];
  for (const r of lignes) {
    const id = String(r.Blotato_PostSubmissionID || '').trim();
    const l = { Id: r.Id, Titre: r.Titre, Reseau: r.Reseau, Format_Post: r.Format_Post, Serie: r.Serie, Date: r.Date_Publication_Prevue, Status: r.Status, id_plateforme: id || null, permalien: r.Blotato_PublicUrl || null };
    if (!['publié', 'en_publication'].includes(r.Status)) { l.verdict = r.Status === 'échec' ? 'échec_nocodb' : 'pas_encore_publié'; if (r.Erreurs) l.note = String(r.Erreurs).slice(0, 300); resultat.push(l); continue; }
    if (r.Reseau !== 'ig' && r.Reseau !== 'fb') { l.verdict = 'non_verifiable'; l.note = 'réseau hors Meta'; resultat.push(l); continue; }
    if (!id) { l.verdict = 'sans_id'; resultat.push(l); continue; }
    try {
      if (r.Reseau === 'ig') {
        const m = await graph(id, { fields: 'id,permalink,timestamp,media_type,media_product_type,like_count,comments_count' });
        l.verdict = 'en_ligne'; l.permalien = m.permalink || l.permalien;
        l.mesures = { likes: m.like_count, commentaires: m.comments_count };
        const metr = (m.media_product_type || '').toUpperCase() === 'STORY' ? 'reach,replies' : 'reach,saved,shares,total_interactions';
        const ins = await essai(() => graph(`${id}/insights`, { metric: metr }));
        if (ins.data) for (const x of ins.data) l.mesures[x.name] = x.values?.[0]?.value ?? x.total_value?.value;
        else if (ins.erreur) l.mesures.insights = 'indisponible : ' + ins.erreur.slice(0, 120);
      } else {
        const p = await graph(id, { fields: 'id,permalink_url,created_time,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)' });
        l.verdict = 'en_ligne'; l.permalien = p.permalink_url || l.permalien;
        l.mesures = { reactions: p.reactions?.summary?.total_count, commentaires: p.comments?.summary?.total_count, partages: p.shares?.count ?? 0 };
        // Meta a renommé les métriques de portée des Pages (2025) : on essaie la nouvelle, puis l'ancienne.
        let ins = {};
        for (const metric of ['post_total_media_view_unique', 'post_impressions_unique']) {
          ins = await essai(() => graph(`${id}/insights`, { metric }));
          if (ins.data) break;
        }
        if (ins.data) for (const x of ins.data) l.mesures.portee = x.values?.[0]?.value;
        else if (ins.erreur) l.mesures.insights = 'indisponible : ' + ins.erreur.slice(0, 120);
      }
    } catch (e) {
      // 100 / 803 = objet inexistant ou inaccessible. Une story IG expirée (>24 h) peut aussi répondre ainsi.
      l.verdict = r.Format_Post === 'story' ? 'non_verifiable' : 'introuvable';
      l.note = expurge(e.message).slice(0, 200) + (r.Format_Post === 'story' ? ' (story : l’API ne garde pas toujours les stories expirées)' : '');
    }
    resultat.push(l);
  }

  const connus = new Set(resultat.map((l) => l.id_plateforme).filter(Boolean));
  const horsNoco = [];
  if (Array.isArray(igMedia)) for (const m of igMedia) if (!connus.has(m.id)) horsNoco.push({ reseau: 'ig', id: m.id, permalien: m.permalink, date: m.timestamp });
  if (Array.isArray(fbPosts)) for (const p of fbPosts) if (!connus.has(p.id)) horsNoco.push({ reseau: 'fb', id: p.id, permalien: p.permalink_url, date: p.created_time });

  const comptes = {};
  for (const l of resultat) comptes[l.verdict] = (comptes[l.verdict] || 0) + 1;
  console.log(JSON.stringify({
    periode: { depuis, jusqu },
    comptes,
    meta_vu_sur_la_periode: {
      instagram: Array.isArray(igMedia) ? igMedia.length : igMedia,
      facebook: Array.isArray(fbPosts) ? fbPosts.length : fbPosts,
    },
    lignes: resultat,
    hors_nocodb: horsNoco,
  }, null, 2));
}

main().catch((e) => { console.error('✖ ' + expurge(e.message || e)); process.exit(1); });
