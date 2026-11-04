#!/usr/bin/env node
// Contrôle mécanique d'un lot social avant dépôt NocoDB (guide 10 §8 + fiche lot-social de Mariam).
// Aucun réseau, aucune écriture : lit un fichier JSON (tableau de lignes `Contenus`), affiche les
// défauts, sort en 1 s'il y en a. Ne remplace pas la relecture : il attrape ce qu'un script voit.
//
// Usage : node qa-lot.mjs <lot.json> [--semaine AAAA-MM-JJ]   (lundi attendu : vérifie les dates)

import { readFileSync } from 'node:fs';

const [file, ...rest] = process.argv.slice(2);
if (!file) { console.error('usage : qa-lot.mjs <lot.json> [--semaine AAAA-MM-JJ]'); process.exit(2); }
const iSem = rest.indexOf('--semaine');
const lundi = iSem >= 0 ? rest[iSem + 1] : null;

let rows;
try { rows = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error('✖ JSON illisible : ' + e.message); process.exit(2); }
if (!Array.isArray(rows)) rows = [rows];

const EMOJI = /\p{Extended_Pictographic}/gu;
const SERIES = ['RADAR', 'ATELIER', 'PREUVE', 'COULISSES', 'CERCLE', 'OFFRE'];
const GABARITS = ['affiche', 'citation', 'chiffre', 'avant_apres', 'question', 'etapes', 'coulisses', 'offre', 'studio',
  // Formats variés (04/11/2026) — docs/growth-kb/11-visuels-nayo.md § 3 ter.
  'mythe_realite', 'checklist', 'comparatif', 'erreur', 'glossaire', 'quiz', 'signes', 'conversation'];
// Données exigées par chaque nouvelle famille (sinon render-card retombe sur l'affiche).
const DONNEES = {
  mythe_realite: (s) => s.mythe && s.realite,
  checklist: (s) => (s.coches || s.etapes || []).length >= 2,
  comparatif: (s) => (s.gauche || []).length && (s.droite || []).length,
  erreur: (s) => s.erreur && s.correction,
  glossaire: (s) => s.definition || s.corps,
  quiz: (s) => (s.options || []).length >= 2,
  signes: (s) => (s.signes || s.etapes || []).length >= 2,
  conversation: (s) => (s.messages || []).filter((m) => m && m.texte).length >= 2,
};
// Vidéo courte : un script à tourner, pas une carte. Déposée en `planifié` (WF-SOCIAL-04 ne la
// rend pas) ; Max filme, pose la vidéo dans Visuels_URLs, puis valide.
const VIDEO = ['reel', 'short'];
const REQUIS = ['Titre', 'Thematique', 'Pilier', 'Serie', 'Offre', 'Cible', 'Reseau', 'Format_Post', 'Date_Publication_Prevue', 'Brief', 'Texte', 'Visual_Strategy', 'Gabarit', 'Slides_JSON', 'Status'];
const mots = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;
const defauts = [];
const ko = (r, i, m) => defauts.push(`#${i + 1} ${r.Reseau || '?'} ${r.Format_Post || '?'} ${String(r.Date_Publication_Prevue || '').slice(0, 16)} « ${String(r.Titre || '').slice(0, 40)} » : ${m}`);

let fin = null;
if (lundi) { const d = new Date(lundi + 'T00:00:00Z'); fin = new Date(d.getTime() + 7 * 864e5); }
const familles = [];
const videos = [];

rows.forEach((r, i) => {
  if (VIDEO.includes(String(r.Format_Post))) {
    if (r.Status !== 'planifié') ko(r, i, `vidéo courte : Status « planifié » attendu (le rendu automatique ferait une image), pas « ${r.Status} »`);
    if (r.Id !== undefined) ko(r, i, 'porte un Id : une création ne doit pas viser une ligne existante');
    const b = String(r.Brief || '');
    const plans = (b.match(/^\s*PLAN\s*\d/gim) || []).length;
    if (plans < 3) ko(r, i, `vidéo courte : ${plans} plan(s) dans Brief (au moins 3 lignes « PLAN 1 (0-3 s) : … »)`);
    const duree = /(\d{2})\s*s\b/.exec(b.match(/DUR[ÉE]E[^\n]*/i)?.[0] || '');
    if (!duree || +duree[1] < 15 || +duree[1] > 30) ko(r, i, 'vidéo courte : une ligne « DURÉE : 15 à 30 s » est attendue dans Brief');
    if (!String(r.Texte || '').trim()) ko(r, i, 'vidéo courte : légende (Texte) vide');
    videos.push(r);
    return;
  }
  for (const k of REQUIS) if (r[k] == null || String(r[k]).trim() === '') {
    if (k === 'Hashtags' || (k === 'Texte' && r.Format_Post === 'story')) continue;
    ko(r, i, `champ ${k} vide`);
  }
  if (r.Status !== 'rédigé') ko(r, i, `Status « ${r.Status} » : seul « rédigé » est permis`);
  if (r.Id !== undefined) ko(r, i, 'porte un Id : une création ne doit pas viser une ligne existante');
  if (!SERIES.includes(r.Serie)) ko(r, i, `Serie inconnue « ${r.Serie} »`);
  if (r.Gabarit && !GABARITS.includes(r.Gabarit)) ko(r, i, `Gabarit inconnu « ${r.Gabarit} »`);
  if (!['fb', 'ig'].includes(r.Reseau)) ko(r, i, `Reseau « ${r.Reseau} » : seuls fb et ig sont câblés`);
  if (r.Offre === 'Formations') ko(r, i, 'Offre Formations : aucune promotion sans accord explicite de Max');

  const d = Date.parse(r.Date_Publication_Prevue);
  if (!Number.isFinite(d)) ko(r, i, 'Date_Publication_Prevue illisible');
  else if (fin && (d < Date.parse(lundi + 'T00:00:00Z') || d >= fin.getTime())) ko(r, i, `date hors de la semaine du ${lundi}`);

  let slides = r.Slides_JSON;
  if (typeof slides === 'string') { try { slides = JSON.parse(slides); } catch { ko(r, i, 'Slides_JSON n’est pas du JSON'); slides = []; } }
  if (!Array.isArray(slides) || !slides.length) ko(r, i, 'Slides_JSON doit être un tableau non vide');
  else {
    if (r.Format_Post !== 'carrousel' && slides.length > 1) ko(r, i, 'plusieurs slides hors carrousel (seule la 1re sera rendue)');
    if (JSON.stringify(slides).match(EMOJI)) ko(r, i, 'emoji dans Slides_JSON (interdit sur les visuels)');
    const g0 = r.Format_Post === 'carrousel' ? null : r.Gabarit;
    if (g0 && DONNEES[g0] && !DONNEES[g0](slides[0] || {})) ko(r, i, `Gabarit « ${g0} » sans ses données dans Slides_JSON (voir 11-visuels-nayo.md § 3 ter) : la carte retomberait sur l'affiche`);
    for (const s of slides) {
      if (s && s.gabarit && DONNEES[s.gabarit] && !DONNEES[s.gabarit](s)) ko(r, i, `slide « ${String(s.titre || '').slice(0, 30)} » : famille ${s.gabarit} sans ses données`);
      if (s && s.gabarit && !GABARITS.includes(s.gabarit)) ko(r, i, `slide : gabarit inconnu « ${s.gabarit} »`);
      if (!s || !String(s.titre || '').trim()) ko(r, i, 'slide sans titre');
      if (r.Gabarit === 'chiffre' && s && s.chiffre && !s.source) ko(r, i, 'chiffre sans source');
      if (r.Format_Post === 'story' && s && String(s.titre || '').length > 70) ko(r, i, 'titre de story > 70 caractères');
    }
  }
  familles.push(r.Format_Post === 'story' ? null : r.Gabarit);

  const texte = String(r.Texte || '');
  const tags = String(r.Hashtags || '').split(/\s+/).filter((t) => t.startsWith('#'));
  if (r.Format_Post === 'story') {
    if (tags.length) ko(r, i, 'story avec hashtags (non publiés : laisser vide)');
    if (!/T12:00:00/.test(String(r.Date_Publication_Prevue))) ko(r, i, 'story hors du créneau de 12:00');
    return;
  }
  const n = mots(texte);
  const [mn, mx] = r.Serie === 'OFFRE' ? [35, 70] : r.Serie === 'CERCLE' ? [15, 40]
    : r.Format_Post === 'carrousel' ? [20, 60] : r.Reseau === 'ig' ? [30, 80] : [40, r.Serie === 'ATELIER' ? 120 : 90];
  if (n < mn || n > mx) ko(r, i, `Texte : ${n} mots (attendu ${mn}-${mx})`);
  const accroche = texte.split('\n')[0] || '';
  if (accroche.length > 110) ko(r, i, `accroche de ${accroche.length} caractères (> 110)`);
  const nbEmoji = (texte.match(EMOJI) || []).length;
  if (nbEmoji < 1 || nbEmoji > 3) ko(r, i, `${nbEmoji} emoji(s) dans Texte (1 à 3)`);
  if (/\p{Extended_Pictographic}\s*\p{Extended_Pictographic}/u.test(texte)) ko(r, i, 'deux emojis à la suite');
  if (texte.split('\n').filter((l) => /^\s*\p{Extended_Pictographic}/u.test(l)).length >= 2) ko(r, i, 'liste à puces en emojis (utiliser « – »)');
  if (/[·;]/.test(texte)) ko(r, i, '« · » ou « ; » dans Texte');
  if (/#/.test(texte)) ko(r, i, 'hashtag dans Texte (ils vont dans Hashtags)');
  if (/\b(vous|votre|vos)\b/i.test(texte)) ko(r, i, 'vouvoiement (vous/votre/vos)');
  if (/n['’]hésitez pas|en sus\b/i.test(texte)) ko(r, i, 'tournure interdite (n’hésitez pas, en sus)');
  if (r.Reseau === 'ig' && /https?:\/\//.test(texte)) ko(r, i, 'URL dans une légende Instagram (« le lien est dans ma bio »)');
  if (r.Reseau === 'fb' && (texte.match(/https?:\/\//g) || []).length > 1) ko(r, i, 'plus d’un lien sur Facebook');
  const [tmn, tmx] = r.Reseau === 'ig' ? [4, 6] : [2, 3];
  if (tags.length < tmn || tags.length > tmx) ko(r, i, `${tags.length} hashtag(s) (attendu ${tmn}-${tmx})`);
  if (tags.some((t) => /[À-ÿ]/.test(t))) ko(r, i, 'hashtag accentué');
});

// Jamais trois fois la même famille d'affilée (posts, dans l'ordre chronologique).
const posts = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.Format_Post !== 'story' && !VIDEO.includes(String(r.Format_Post)))
  .sort((a, b) => Date.parse(a.r.Date_Publication_Prevue) - Date.parse(b.r.Date_Publication_Prevue));
for (let k = 2; k < posts.length; k++) {
  const g = posts[k].r.Gabarit;
  if (g && g === posts[k - 1].r.Gabarit && g === posts[k - 2].r.Gabarit) ko(posts[k].r, posts[k].i, `3e « ${g} » d’affilée`);
}

// ── Variété des formats (demande de Max du 04/11/2026 : « pas toujours le même format ») ──
// Même famille deux fois de suite sur un même réseau : refusé.
for (const res of ['fb', 'ig']) {
  const fil = posts.filter(({ r }) => r.Reseau === res);
  for (let k = 1; k < fil.length; k++) {
    const g = fil[k].r.Gabarit;
    if (g && g === fil[k - 1].r.Gabarit) ko(fil[k].r, fil[k].i, `même famille « ${g} » que le post ${res} précédent : alterne les formats`);
  }
}
{
  const n = posts.length;
  const compte = {};
  for (const { r } of posts) if (r.Gabarit) compte[r.Gabarit] = (compte[r.Gabarit] || 0) + 1;
  const plafond = Math.max(1, Math.floor(n * 0.25));
  for (const [g, k] of Object.entries(compte)) if (n >= 4 && k > plafond) defauts.push(`variété : « ${g} » sur ${k} posts (plafond ${plafond}, soit 25 % de ${n}) — remplace par un format peu utilisé`);
  const requis = n >= 9 ? 6 : n >= 6 ? 5 : Math.ceil(n / 2);
  const distinctes = Object.keys(compte).length;
  if (lundi && distinctes < requis) defauts.push(`variété : ${distinctes} familles distinctes pour ${n} posts (au moins ${requis}) — puise dans mythe_realite, checklist, comparatif, erreur, glossaire, quiz, signes, conversation`);
  const stories = rows.filter((r) => r.Format_Post === 'story');
  const cs = {};
  for (const r of stories) cs[r.Gabarit || '(vide)'] = (cs[r.Gabarit || '(vide)'] || 0) + 1;
  if (lundi && stories.length >= 5 && Object.keys(cs).length < 3) defauts.push(`variété des stories : ${Object.keys(cs).length} famille(s) pour ${stories.length} stories (au moins 3 : quiz, question, glossaire, mythe_realite, signes…)`);
  for (const [g, k] of Object.entries(cs)) if (stories.length >= 5 && k > 3) defauts.push(`variété des stories : « ${g} » sur ${k} stories (3 au plus)`);
  if (lundi && videos.length < 1) defauts.push('vidéo courte : aucun script de Reel cette semaine (au moins 1, Format_Post « reel », Status « planifié », plan par plan dans Brief)');
}

const nPosts = posts.length, nStories = rows.filter((r) => r.Format_Post === 'story').length;
const nOffre = posts.filter(({ r }) => r.Serie === 'OFFRE').length;
console.log(`${nPosts} post(s), ${nStories} story(ies), ${videos.length} vidéo(s) courte(s), ${nOffre} OFFRE`);
if (lundi && (nPosts < 8 || nPosts > 10)) defauts.push(`cadence : ${nPosts} posts (attendu 8 à 10)`);
if (lundi && nStories < 7) defauts.push(`cadence : ${nStories} stories (attendu 7)`);
if (nOffre > 2) defauts.push(`${nOffre} OFFRE (2 au plus par semaine)`);
if (defauts.length) { console.log(`✖ ${defauts.length} défaut(s) :`); for (const d of defauts) console.log('  - ' + d); process.exit(1); }
console.log('✔ aucun défaut mécanique');
