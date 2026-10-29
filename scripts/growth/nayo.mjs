#!/usr/bin/env node
// Visuels sociaux : brief d'un post NocoDB → créas au kit DS produit.
//
// Deux moteurs, un seul brief :
//   - NAYO (https://nayo.pro) — visé pour les posts phares (studio, directions artistiques).
//     ⚠️ Au 29/10/2026 son API publique ne permet PAS de générer par clé : une clé d'API ne
//     porte que les scopes `projects:read` / `insights:read`, et `/api/public/v1/` n'expose que
//     la liste des projets. Voir docs/growth-kb/11-visuels-nayo.md § « Ce que NAYO permet ».
//   - render-card (VPS, Satori + resvg) — moteur de série, gabarits `kit: 'ds'`.
//
// La fonction `construireCharges` est la SOURCE UNIQUE de la mise en forme : le nœud
// « Build — URL publique » de WF-SOCIAL-04 en embarque une copie générée depuis ce fichier
// (scripts/growth/wf04-visuels-ds.mjs). La modifier ici, puis régénérer le workflow.
//
// Usage :
//   node scripts/growth/nayo.mjs estimate                       # ce que NAYO accepte aujourd'hui (sondage, sans clé)
//   node scripts/growth/nayo.mjs brief <Id> [--gabarit g] [--slides f.json]   # le brief et les charges, rien d'autre
//   node scripts/growth/nayo.mjs render <Id> --out <dossier> [--gabarit g] [--slides f.json]
//        → rend via render-card (SSH vers le VPS), télécharge les PNG ; n'écrit RIEN dans NocoDB
//   node scripts/growth/nayo.mjs render <Id> --apply            # idem + écrit Visuels_URLs (jamais Status)
//
// Garde-fous : ne touche jamais `Status` ; ne lit jamais la table Config ; la clé render-card
// reste sur le VPS (lue là-bas par la commande SSH, jamais rapatriée).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Post NocoDB (champs plats) → charges render-card. Fonction AUTONOME (aucune référence
 * extérieure) : elle est recopiée telle quelle dans un nœud Code n8n.
 *
 * Contrat de `Slides_JSON` (une entrée par visuel ; un seul hors carrousel) :
 *   { titre, corps?, cta?, options?[],                 — historiques
 *     gabarit?, territoire?, fond?: 'papier'|'nuit', sourcil?,
 *     chiffre?, source?,                                — gabarit chiffre (source obligatoire)
 *     avant?[], apres?[], avantTitre?, apresTitre?,    — gabarit avant_apres
 *     etapes?[],                                        — gabarit etapes (sinon corps « a · b · c »)
 *     prix?, prixUnite?, prixNote?, points?[], paiement?, — gabarit offre
 *     auteur?, role?,                                   — gabarit citation
 *     photo? }                                          — gabarit coulisses : URL d'une photo de Max
 * `[mot]` dans un titre le passe dans la couleur du territoire (convention des titres du site).
 */
export function construireCharges(post, opts) {
  opts = opts || {};
  const GABARITS = ['affiche', 'citation', 'chiffre', 'avant_apres', 'question', 'etapes', 'coulisses', 'offre'];
  const s = (v) => (v == null ? '' : String(v)).trim();
  const liste = (v) => (Array.isArray(v) ? v.map(s).filter(Boolean) : []);
  const fp = s(post.Format_Post).toLowerCase();
  const fmtMap = { story: '9:16', reel: '9:16', short: '9:16', live: '9:16', carrousel: '4:5', post: '4:5', community_post: '1:1', thread: '1:1' };
  const format = fmtMap[fp] || '4:5';

  let cartes = [];
  let raw = opts.slides != null ? opts.slides : post.Slides_JSON;
  if (typeof raw === 'string') { try { raw = raw.trim() ? JSON.parse(raw) : []; } catch (e) { raw = []; } }
  if (Array.isArray(raw)) {
    for (const x of raw) {
      const o = x && typeof x === 'object' ? x : { titre: s(x) };
      if (!s(o.titre)) continue;
      cartes.push(o);
      if (cartes.length >= 10) break;
    }
  }
  if (fp !== 'carrousel' && cartes.length > 1) cartes = [cartes[0]];
  if (!cartes.length) cartes = [{ titre: s(post.Titre) || 'Max-Morrys' }];

  // Territoire : l'offre d'abord (c'est elle qui renvoie au site), puis la série et la cible.
  const offre = s(post.Offre), serie = s(post.Serie), cible = s(post.Cible);
  let territoire = 'informe';
  if (offre === 'Formations' || offre === 'Accompagnement') territoire = 'forme';
  else if (offre === 'Club Digitos' || offre === 'Rysmo') territoire = 'transforme';
  else if (offre === 'Agence') territoire = cible === 'Commerçants' ? 'digitalise' : 'agence';
  else if (cible === 'Commerçants') territoire = 'digitalise';
  else if (serie === 'CERCLE' || serie === 'COULISSES') territoire = 'transforme';
  else if (serie === 'PREUVE') territoire = 'forme';

  // Gabarit : celui du post (champ NocoDB `Gabarit`), sinon un choix par défaut prudent.
  const choisir = (c) => {
    const g = s(c.gabarit) || s(opts.gabarit) || s(post.Gabarit);
    if (GABARITS.indexOf(g) >= 0) return g;
    const m = s(c.corps).split(/\s+·\s+/).map(s).filter(Boolean);
    if (liste(c.options).length >= 2) return 'question';
    if (m.length >= 2 && m.every((x, k) => x.indexOf('ABCD'[k] + ' ') === 0 || x.indexOf('ABCD'[k] + '.') === 0)) return 'question';
    if (m.length >= 2 && m.length <= 5 && serie === 'ATELIER') return 'etapes';
    if (s(c.chiffre) && s(c.source)) return 'chiffre';
    if (liste(c.avant).length && liste(c.apres).length) return 'avant_apres';
    if (s(c.prix) || serie === 'OFFRE') return 'offre';
    if (liste(c.etapes).length >= 2) return 'etapes';
    if (serie === 'COULISSES') return 'coulisses';
    if (s(c.auteur)) return 'citation';
    return 'affiche';
  };
  const sourcil = [serie, s(post.Outil)].filter(Boolean).join(' · ');
  const avertissements = [];
  // `studio` : post phare fait à la main dans le studio NAYO. Le circuit rend quand même une
  // carte au kit DS (choix automatique) pour ne pas bloquer la file ; Max la remplace par
  // l'export du studio avant de valider.
  if (s(post.Gabarit) === 'studio') avertissements.push('studio : visuel provisoire, à remplacer par l’export NAYO avant validation');

  const charges = cartes.map((c, i) => {
    const total = cartes.length;
    const p = {
      kit: 'ds', format: format, template: 'poster',
      title: s(c.titre).slice(0, 140),
      eyebrow: s(c.sourcil) || sourcil,
      territoire: s(c.territoire) || territoire,
    };
    if (s(c.corps)) p.body = s(c.corps).slice(0, 260);
    if (s(c.cta)) p.cta = s(c.cta).slice(0, 44);
    if (s(c.fond) === 'nuit' || s(c.fond) === 'papier') p.fond = s(c.fond);

    if (fp === 'carrousel') {
      p.template = 'slide';
      p.gabarit = 'slide';
      p.slideRole = i === 0 ? 'cover' : i >= total - 1 ? 'outro' : 'body';
      p.slideIndex = i + 1;
      p.slideTotal = total;
      return p;
    }
    let g = choisir(c);
    // Corps « a · b · c » : la forme courte des rédacteurs pour une liste.
    const morceaux = s(c.corps).split(/\s+·\s+/).map(s).filter(Boolean);
    if (g === 'question') {
      let o = liste(c.options);
      if (o.length < 2 && morceaux.length >= 2) o = morceaux.map((m) => m.replace(/^[A-D][.)]?\s+/, ''));
      if (o.length >= 2) { p.options = o.slice(0, 4); delete p.body; } else g = 'affiche';
    }
    if (g === 'etapes') {
      let e = liste(c.etapes);
      if (e.length < 2 && morceaux.length >= 2) { e = morceaux; delete p.body; } // le corps EST la liste
      if (e.length >= 2) p.etapes = e.slice(0, 5); else g = 'affiche';
    }
    if (g === 'chiffre') {
      if (s(c.chiffre) && s(c.source)) { p.chiffre = s(c.chiffre); p.source = s(c.source); }
      else { avertissements.push('chiffre sans source → affiche (règle du monospace)'); g = 'affiche'; }
    }
    if (g === 'avant_apres') {
      if (liste(c.avant).length && liste(c.apres).length) {
        p.avant = liste(c.avant); p.apres = liste(c.apres);
        if (s(c.avantTitre)) p.avantTitre = s(c.avantTitre);
        if (s(c.apresTitre)) p.apresTitre = s(c.apresTitre);
      } else g = 'affiche';
    }
    if (g === 'offre') {
      for (const k of ['prix', 'prixUnite', 'prixNote', 'paiement']) if (s(c[k])) p[k] = s(c[k]);
      if (liste(c.points).length) p.points = liste(c.points).slice(0, 3);
      if (!p.prix && !p.points) avertissements.push('offre sans prix ni points : la carte ne montre que le titre');
    }
    if (g === 'citation') { if (s(c.auteur)) p.auteur = s(c.auteur); if (s(c.role)) p.role = s(c.role); }
    if (g === 'coulisses' && /^https:\/\//.test(s(c.photo))) p.photo = s(c.photo);
    p.gabarit = g;
    return p;
  });
  return { format: format, territoire: territoire, gabarits: charges.map((c) => c.gabarit), avertissements: avertissements, charges: charges };
}

// ───────────────────────────── CLI ─────────────────────────────

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..', '..');
const VPS = 'root@158.220.124.185';
const SSH_KEY = join(process.env.HOME || '', '.ssh', 'maxmorrys_vps');

function die(msg) { console.error(`✖ ${msg}`); process.exit(1); }

function loadEnv() {
  const file = join(ROOT, '.env.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*(NOCODB_[A-Z_]+|NAYO_[A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x.startsWith('--')) {
      const n = argv[i + 1];
      if (n === undefined || n.startsWith('--')) a[x.slice(2)] = true; else { a[x.slice(2)] = n; i++; }
    } else a._.push(x);
  }
  return a;
}

async function noco(path, init = {}) {
  const base = (process.env.NOCODB_URL || 'https://noco.maxmorrys.me').replace(/\/$/, '');
  if (!process.env.NOCODB_TOKEN) die('NOCODB_TOKEN absent de .env.local');
  const res = await fetch(base + path, { ...init, headers: { 'xc-token': process.env.NOCODB_TOKEN, 'content-type': 'application/json' } });
  const t = await res.text();
  if (!res.ok) die(`NocoDB HTTP ${res.status} : ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}
const CONTENUS = 'm3wim4coagaoot7';

/** Rend une charge via render-card sur le VPS. La clé est lue SUR le VPS, jamais ici. */
function renderVps(payload) {
  const cmd = 'K=$(grep ^RENDER_KEY= /etc/render-card/env | cut -d= -f2-); ' +
    'curl -sS -m 170 -X POST http://127.0.0.1:8787/render -H "Content-Type: application/json" -H "X-Render-Key: $K" --data-binary @-';
  const out = execFileSync('ssh', ['-i', SSH_KEY, '-o', 'ConnectTimeout=15', VPS, cmd], { input: JSON.stringify(payload), encoding: 'utf8', maxBuffer: 1 << 20 });
  let r; try { r = JSON.parse(out); } catch { throw new Error('réponse render-card illisible : ' + out.slice(0, 200)); }
  if (!r.url) throw new Error('render-card : ' + (r.error || 'sans url') + (r.detail ? ' — ' + r.detail : ''));
  return r;
}

async function estimate() {
  const probe = async (p) => { try { const r = await fetch('https://nayo.pro' + p, { signal: AbortSignal.timeout(15000) }); return r.status; } catch (e) { return 'injoignable'; } };
  const health = await probe('/api/health');
  const projets = await probe('/api/public/v1/projects');
  const generation = await probe('/api/public/v1/designs');
  console.log(JSON.stringify({
    nayo: { health, 'public/v1/projects': projets, 'public/v1/designs': generation },
    verdict: generation === 404
      ? "NAYO ne génère pas par clé d'API aujourd'hui (aucune route publique d'écriture). Moteur de série : render-card, coût 0 crédit."
      : 'Une route publique de génération répond : relire docs/growth-kb/11-visuels-nayo.md avant de basculer.',
    render_card: { cout: '0 crédit (service local au VPS)', depot: 'R2 via media-api.maxmorrys.me' },
  }, null, 2));
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const [cmd, id] = args._;
  if (cmd === 'estimate') return estimate();
  if (cmd !== 'brief' && cmd !== 'render') {
    console.log('usage : node scripts/growth/nayo.mjs <estimate | brief <Id> | render <Id> --out <dossier> [--apply]> [--gabarit g] [--slides f.json]');
    return;
  }
  if (!id) die(`${cmd} : Id NocoDB manquant`);
  const post = await noco(`/api/v2/tables/${CONTENUS}/records/${id}`);
  const opts = {};
  if (args.gabarit && args.gabarit !== true) opts.gabarit = args.gabarit;
  if (args.slides && args.slides !== true) opts.slides = JSON.parse(readFileSync(resolve(args.slides), 'utf8'));
  const brief = construireCharges(post, opts);
  if (cmd === 'brief') {
    console.log(JSON.stringify({ Id: post.Id, Titre: post.Titre, Status: post.Status, ...brief }, null, 2));
    return;
  }
  const out = args.out && args.out !== true ? resolve(args.out) : null;
  if (!out && !args.apply) die('render : --out <dossier> (aperçu local) ou --apply (écrit Visuels_URLs)');
  if (out) mkdirSync(out, { recursive: true });
  const urls = [];
  for (let i = 0; i < brief.charges.length; i++) {
    const r = renderVps(brief.charges[i]);
    urls.push(r.url);
    if (out) {
      const png = Buffer.from(await (await fetch(r.url)).arrayBuffer());
      const f = join(out, `${post.Id}-${String(i + 1).padStart(2, '0')}-${brief.charges[i].gabarit}.png`);
      writeFileSync(f, png);
      console.error(`✔ ${f} (${png.length} o)`);
    }
  }
  if (brief.avertissements.length) console.error('⚠ ' + brief.avertissements.join(' ; '));
  if (!args.apply) {
    console.log(JSON.stringify({ Id: post.Id, Visuels_URLs: urls, ecrit: false }, null, 2));
    console.error('SIMULATION — rien n\'est écrit dans NocoDB. --apply pour écrire Visuels_URLs.');
    return;
  }
  await noco(`/api/v2/tables/${CONTENUS}/records`, { method: 'PATCH', body: JSON.stringify([{ Id: post.Id, Visuels_URLs: JSON.stringify(urls) }]) });
  console.error(`✔ Visuels_URLs écrit pour ${post.Id} (Status inchangé : ${post.Status})`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => die(e.message || String(e)));
