#!/usr/bin/env node
// Idées de posts (Fatou, 04/11/2026) — le seul chemin par lequel un agent change le Statut
// d'une idée dans NocoDB `Idees_Posts`. Les agents CRÉENT des idées en `proposé`
// (`nocodb.mjs create idees-posts`) ; ce sont les boutons de Max qui les retiennent.
//
//   node mm-idees.mjs sync                       réponses de Max (table Decisions) → Statut des idées
//   node mm-idees.mjs lier <IdeeId> <DecisionId>  rattache la carte Telegram à l'idée
//   node mm-idees.mjs retenues [--pour post|carrousel|story|reel|article|lettre|lecon] [--periode S48|2026-12] [--horizon semaine|mois]
//   node mm-idees.mjs utiliser <IdeeId> --canal <canal>:<ref>   ex. post:212 · article:mon-slug · lettre:2026-11-26
//                                                  (--post <PostId> reste accepté = --canal post:<PostId>)
//
// Idée multi-usages (04/11/2026) : une idée retenue porte des `Declinaisons` (post, carrousel,
// story, reel, article, lettre, lecon). `utiliser` AJOUTE une ligne à `Utilisations` ; l'idée
// reste « retenu » tant qu'une déclinaison n'est pas faite, puis passe « utilisé ». Une idée
// retenue depuis plus de 60 jours passe « utilisé » au `sync` suivant, même incomplète.
// `retenues --pour <canal>` ne rend que les idées dont cette déclinaison reste à faire.
//
// Correspondance des boutons : retenir → retenu · plus_tard → plus_tard · ecarter → écarté.
// Une carte reste « en_attente » tant que Max n'a pas cliqué : l'idée reste « proposé ».
// Environnement : NOCODB_URL / NOCODB_TOKEN (Mac : .env.local ; VPS : /etc/mm-agents/env).
// Sortie JSON sur stdout ; code 1 = usage ou API, 3 = NocoDB non configuré.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.env.NOCODB_BASE || 'ph7ugup4mggzj2y';
const IDEES = process.env.NOCODB_TABLE_IDEES_POSTS || 'mk2n1mh0z4wx7w2';
const CHOIX = { retenir: 'retenu', plus_tard: 'plus_tard', ecarter: 'écarté' };
const CANAUX = ['post', 'carrousel', 'story', 'reel', 'article', 'lettre', 'lecon'];
const EXPIRATION_JOURS = 60;
const liste = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((x) => String(x).trim()).filter(Boolean);
const faits = (i) => String(i.Utilisations || '').split(/[;\n]/).map((x) => x.trim().split(':')[0]).filter(Boolean);
// Sans déclinaison renseignée (idées d'avant le 04/11), l'idée vaut pour son Format.
const declinaisons = (i) => { const d = liste(i.Declinaisons); return d.length ? d : [i.Format || 'post']; };
const restantes = (i) => { const f = new Set(faits(i)); return declinaisons(i).filter((d) => !f.has(d)); };
const aujourdhui = () => new Date().toISOString().slice(0, 10);

const die = (m, c = 1) => { console.error(`✖ ${m}`); process.exit(c); };
function env() {
  if (process.env.NOCODB_TOKEN) return;
  for (const f of [resolve(process.cwd(), '.env.local'), '/etc/mm-agents/env']) {
    if (!existsSync(f)) continue;
    try {
      for (const l of readFileSync(f, 'utf8').split('\n')) {
        const m = l.match(/^(?:export\s+)?(NOCODB_URL|NOCODB_TOKEN)=(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
      }
    } catch { /* illisible : on essaie le suivant */ }
  }
}
const base = () => (process.env.NOCODB_URL || 'https://noco.maxmorrys.me').replace(/\/$/, '');
async function noco(p, init = {}) {
  if (!process.env.NOCODB_TOKEN) die('NOCODB_TOKEN absent (.env.local ou /etc/mm-agents/env)', 3);
  const r = await fetch(base() + p, { ...init, headers: { 'xc-token': process.env.NOCODB_TOKEN, 'content-type': 'application/json' } });
  const t = await r.text();
  if (!r.ok) die(`HTTP ${r.status} sur ${p.split('?')[0]} : ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : {};
}
async function tout(table, where) {
  const out = [];
  for (let off = 0; ; off += 200) {
    const q = new URLSearchParams({ limit: '200', offset: String(off) });
    if (where) q.set('where', where);
    const j = await noco(`/api/v2/tables/${table}/records?${q}`);
    out.push(...(j.list || []));
    if (j.pageInfo?.isLastPage !== false) return out;
  }
}
async function tableDecisions() {
  if (process.env.NOCODB_TABLE_DECISIONS) return process.env.NOCODB_TABLE_DECISIONS;
  const j = await noco(`/api/v2/meta/bases/${BASE}/tables`);
  const t = (j.list || []).find((x) => x.title === 'Decisions');
  if (!t) die('table NocoDB « Decisions » introuvable (cartes de décision pas encore en service)', 3);
  return t.id;
}
const maj = (rows) => noco(`/api/v2/tables/${IDEES}/records`, { method: 'PATCH', body: JSON.stringify(rows) });
const opt = (a, k) => { const i = a.indexOf(`--${k}`); return i >= 0 ? a[i + 1] : undefined; };

env();
const [cmd, ...a] = process.argv.slice(2);
switch (cmd) {
  case 'sync': {
    const dec = await tableDecisions();
    const idees = await tout(IDEES, '(Statut,in,proposé,plus_tard)');
    const reponses = await tout(dec, '(Objet,like,idee:%)');
    const parId = new Map(reponses.map((d) => [d.Id, d]));
    const parObjet = new Map(reponses.map((d) => [String(d.Objet), d]));
    const changes = [];
    for (const i of idees) {
      const d = (i.Decision_Id && parId.get(i.Decision_Id)) || parObjet.get(`idee:${i.Id}`);
      if (!d) continue;
      const row = { Id: i.Id };
      if (!i.Decision_Id) row.Decision_Id = d.Id;
      if (d.Status === 'répondu' && CHOIX[d.Choix] && CHOIX[d.Choix] !== i.Statut) {
        row.Statut = CHOIX[d.Choix];
        if (row.Statut === 'retenu' && !i.Retenue_Le) row.Retenue_Le = aujourdhui();
      }
      if (Object.keys(row).length > 1) changes.push(row);
    }
    // Retenues trop anciennes : on les clôt, même si une déclinaison n'a pas été faite.
    const limite = new Date(Date.now() - EXPIRATION_JOURS * 864e5).toISOString().slice(0, 10);
    for (const i of await tout(IDEES, '(Statut,eq,retenu)')) {
      if (!i.Retenue_Le) changes.push({ Id: i.Id, Retenue_Le: aujourdhui() });
      else if (String(i.Retenue_Le).slice(0, 10) < limite) changes.push({ Id: i.Id, Statut: 'utilisé', Notes: `${i.Notes ? i.Notes + '\n' : ''}Close le ${aujourdhui()} : retenue depuis plus de ${EXPIRATION_JOURS} jours (restait : ${restantes(i).join(', ') || 'rien'}).` });
    }
    if (changes.length) await maj(changes);
    console.log(JSON.stringify({ examinees: idees.length, mises_a_jour: changes }, null, 2));
    break;
  }
  case 'lier': {
    const [idee, d] = a.map(Number);
    if (!idee || !d) die('usage : lier <IdeeId> <DecisionId>');
    const i = await noco(`/api/v2/tables/${IDEES}/records/${idee}`);
    if (i.Decision_Id && i.Decision_Id !== d) die(`idée #${idee} déjà liée à la décision #${i.Decision_Id}`);
    await maj([{ Id: idee, Decision_Id: d }]);
    console.log(JSON.stringify({ idee, decision: d }));
    break;
  }
  case 'retenues': {
    const pour = opt(a, 'pour');
    if (pour && !CANAUX.includes(pour)) die(`--pour : ${CANAUX.join(' | ')}`);
    const f = ['(Statut,eq,retenu)'];
    if (opt(a, 'periode')) f.push(`(Periode,eq,${opt(a, 'periode')})`);
    if (opt(a, 'horizon')) f.push(`(Horizon,eq,${opt(a, 'horizon')})`);
    const rows = (await tout(IDEES, f.join('~and'))).filter((i) => !pour || restantes(i).includes(pour));
    console.log(JSON.stringify(rows.map((i) => {
      const { Id, Titre, Angle, Serie, Rubrique, Cible, Reseau, Format, Gabarit_Suggere, Periode, Horizon, Sources, Score, Utilisations } = i;
      return { Id, Titre, Angle, Serie, Rubrique, Cible, Reseau, Format, Gabarit_Suggere, Periode, Horizon, Sources, Score,
        Declinaisons: declinaisons(i), Restantes: restantes(i), Utilisations: Utilisations || '' };
    }), null, 2));
    console.error(`${rows.length} idée(s) retenue(s)${pour ? ` pour « ${pour} »` : ''}`);
    break;
  }
  case 'utiliser': {
    const idee = Number(a[0]);
    const brut = opt(a, 'canal') || (opt(a, 'post') ? `post:${opt(a, 'post')}` : '');
    const m = brut.match(/^([a-z]+):(.+)$/);
    if (!idee || !m) die('usage : utiliser <IdeeId> --canal <canal>:<ref>   (ex. post:212, article:mon-slug, lettre:2026-11-26)');
    const [, canal, ref] = m;
    if (!CANAUX.includes(canal)) die(`canal inconnu « ${canal} » : ${CANAUX.join(' | ')}`);
    const i = await noco(`/api/v2/tables/${IDEES}/records/${idee}`);
    if (i.Statut !== 'retenu') die(`idée #${idee} en « ${i.Statut} » : seule une idée retenue par Max peut être utilisée`);
    const ligne = `${canal}:${ref}`;
    const deja = String(i.Utilisations || '').split(/[;\n]/).map((x) => x.trim()).filter(Boolean);
    if (deja.includes(ligne)) die(`déjà noté : ${ligne}`);
    const apres = { ...i, Utilisations: [...deja, ligne].join('; ') };
    const reste = restantes(apres);
    const row = { Id: idee, Utilisations: apres.Utilisations };
    if (canal === 'post' && !i.Post_Id && /^\d+$/.test(ref)) row.Post_Id = Number(ref);
    if (!reste.length) row.Statut = 'utilisé';
    await maj([row]);
    console.log(JSON.stringify({ idee, utilisation: ligne, restantes: reste, statut: row.Statut || 'retenu' }));
    break;
  }
  default:
    die('usage : mm-idees.mjs sync | lier <IdeeId> <DecisionId> | retenues [--pour <canal>] [--periode P] [--horizon semaine|mois] | utiliser <IdeeId> --canal <canal>:<ref>');
}
