#!/usr/bin/env node
// Garde de charte sur le CORPS des articles du blog (content/blog/*.md).
//
// Les tests du dépôt ne lisent que les catalogues i18n : rien ne contrôlait le texte des
// articles, d'où 29 articles sur 46 avec emojis, 46 avec un H1 dans le corps, 10 qui
// vouvoient (audit du 29/10/2026). Ce script ferme ce trou avant toute publication.
//
//   node scripts/growth/blog-lint.mjs                       (tous les articles)
//   node scripts/growth/blog-lint.mjs content/blog/x.md     (un ou plusieurs fichiers)
//   node scripts/growth/blog-lint.mjs --json …
//
// Sortie non nulle s'il reste au moins une ERREUR. Les AVERTISSEMENTS se lèvent à la main
// par la secrétaire de rédaction (mm-agent-beatrice), qui note sa décision dans le rapport.

import { readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { readArticle, BLOG_POLES, slugify } from './article.mjs';

const SUFFIXE_TITRE = ' | Max-Morrys'; // ajouté par le Worker : 60 - 13 = 47
const TITRE_MAX = 47;
const META_MIN = 110;
const META_MAX = 155;

const REGLES_TEXTE = [
  // [niveau, code, motif, message]
  ['erreur', 'vouvoiement', /\b(vous|votre|vos)\b/i, 'le blog est piste Apprendre : tutoiement (une parole rapportée qui vouvoie s\'encadre de « »)'],
  ['erreur', 'emoji', /\p{Extended_Pictographic}/u, 'aucun emoji sur le web (DS_Final/readme.md)'],
  ['erreur', 'h1', /^#\s|<h1[\s>]/i, 'le titre est le seul H1, rendu par la page : commencer le corps au niveau ##'],
  ['erreur', 'remboursement', /rembours|garanti(e|r)?\b|sans risque|satisfait ou|14 jours/i, 'CGV art. 6 : aucun remboursement, aucune garantie'],
  ['erreur', 'cadence', /(je (publie|t'envoie|partage|poste)|tu (recevras|reçois)|pour recevoir|reçois|recevoir|nouvel article|nouvelle vidéo|ma lettre|la lettre|newsletter|rendez-vous)[^.!?]{0,60}(chaque semaine|toutes les semaines|hebdomadaire|chaque mois|tous les mois|tous les jours|chaque jour|chaque (lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche))|\b(hebdomadaire|mensuelle) (lettre|newsletter)/i, 'aucune promesse de cadence de publication ou d\'envoi (le blog et la lettre ne paraissent pas à date fixe)'],
  ['erreur', 'route-morte', /\/agence\b|presence-digitale/i, '/agence et /presence-digitale sont des 301 : viser /conception…'],
  ['erreur', 'marque', /\bMy Onoma\b|Max-Morrys Agency/, 'MY ONOMA en capitales via la marque ; jamais « Max-Morrys Agency » comme entité'],
  ['erreur', 'offre-fantome', /coaching|mentorat payant|consulting|toutes les formations (pour|avec) (un|ton) (seul )?abonnement/i, 'offre qui n\'existe pas'],
  ['avertissement', 'preuve-sociale', /\b\d[\d  ]*\s*(inscrits|élèves|étudiants|abonnés|clients satisfaits)|\b[0-5]([.,]\d)?\s*\/\s*5\b/i, 'aucune preuve sociale chiffrée sans source (tests/unit/interdits-preuve-sociale.test.ts)'],
  ['avertissement', 'date', /\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+20\d\d\b/i, 'date écrite : l\'article vieillira ; la garder seulement si elle date un fait sourcé'],
  ['avertissement', 'jargon-commercant', /\b(pixel|GA4|workflow|n8n|Merchant Center)\b/i, 'jargon à éviter si l\'article vise les commerçants'],
];

const CTA_FIN = /(rejoins|inscris-toi|abonne-toi|découvre (la|ma|nos) formation|clique ici|contacte-moi|réserve un appel)/i;

function paragraphs(body, startLine) {
  const out = [];
  let buf = [];
  let first = startLine;
  body.split('\n').forEach((line, i) => {
    if (line.trim() === '') {
      if (buf.length) out.push({ text: buf.join('\n'), line: first });
      buf = [];
      first = startLine + i + 1;
    } else {
      if (!buf.length) first = startLine + i;
      buf.push(line);
    }
  });
  if (buf.length) out.push({ text: buf.join('\n'), line: first });
  return out;
}

function lintFile(file) {
  const issues = [];
  const add = (niveau, code, ligne, message) => issues.push({ niveau, code, ligne, message });
  let art;
  try { art = readArticle(file); } catch (e) { add('erreur', 'format', 1, e.message); return issues; }
  const { meta, body, bodyStartLine } = art;

  // En-tête
  for (const champ of ['title', 'slug', 'slug_en', 'excerpt', 'category', 'focusKeyword', 'metaDescription', 'tags']) {
    if (meta[champ] === undefined || meta[champ] === '' || (Array.isArray(meta[champ]) && !meta[champ].length)) {
      add('erreur', 'en-tete', 1, `champ « ${champ} » manquant`);
    }
  }
  const titreSeo = meta.metaTitle || meta.title || '';
  if (titreSeo.length > TITRE_MAX) add('erreur', 'titre', 1, `titre SEO de ${titreSeo.length} caractères (> ${TITRE_MAX} : le Worker ajoute « ${SUFFIXE_TITRE} »)`);
  if (meta.metaDescription && meta.metaDescription.length > META_MAX) add('erreur', 'meta', 1, `metaDescription de ${meta.metaDescription.length} caractères (> ${META_MAX})`);
  if (meta.metaDescription && meta.metaDescription.length < META_MIN) add('avertissement', 'meta', 1, `metaDescription courte (${meta.metaDescription.length} < ${META_MIN})`);
  if (meta.category && !BLOG_POLES.includes(meta.category)) add('erreur', 'pole', 1, `catégorie « ${meta.category} » hors des six pôles : ${BLOG_POLES.join(' · ')}`);
  if (meta.slug) {
    if (meta.slug !== slugify(meta.slug)) add('erreur', 'slug', 1, `slug non normalisé (attendu « ${slugify(meta.slug)} »)`);
    if (basename(file, '.md') !== meta.slug) add('erreur', 'slug', 1, `le fichier doit s'appeler ${meta.slug}.md`);
    if (meta.slug.length > 75) add('avertissement', 'slug', 1, 'slug long (> 75 caractères)');
    if (/20\d\d/.test(meta.slug)) add('avertissement', 'slug', 1, 'année dans le slug : l\'URL vieillira');
  }
  if (meta.slug_en && meta.slug_en !== slugify(meta.slug_en)) add('erreur', 'slug', 1, 'slug_en non normalisé');
  if (meta.focusKeyword && titreSeo && !titreSeo.toLowerCase().includes(meta.focusKeyword.toLowerCase().split(' ')[0])) {
    add('avertissement', 'mot-cle', 1, 'le mot-clé principal n\'apparaît pas dans le titre');
  }

  // Corps, ligne à ligne
  body.split('\n').forEach((line, i) => {
    const n = bodyStartLine + i;
    const sansExempt = line.replace(/rendez-vous/gi, '').replace(/vos échanges/gi, '');
    for (const [niveau, code, motif, message] of REGLES_TEXTE) {
      const cible = code === 'vouvoiement' ? sansExempt : line;
      // Une citation entre « » peut vouvoyer (parole rapportée).
      if (code === 'vouvoiement' && /(«[^»]*|“[^”]*|"[^"]*|\s'[^']*)\b(vous|votre|vos)\b/i.test(line)) continue;
      if (motif.test(cible)) add(niveau, code, n, message);
    }
  });

  // Corps, paragraphe par paragraphe
  const paras = paragraphs(body, bodyStartLine);
  for (const p of paras) {
    const aSource = /\]\(https?:\/\/|source\s*:|selon /i.test(p.text);
    if (/\d+([.,]\d+)?\s?%/.test(p.text) && !aSource) add('erreur', 'chiffre-source', p.line, 'pourcentage sans source citée (lien ou « Source : … ») dans le paragraphe');
    else if (/\b\d{2,}[\d  ]*\s?(F\b|FCFA|XOF|€|\$)/.test(p.text) && !aSource) add('avertissement', 'montant', p.line, 'montant sans source : prix d\'une offre → vérifier dans le code ; exemple → le présenter comme hypothétique');
    if (/\b(Wave|Orange Money)\b/.test(p.text) && !(/Wave/.test(p.text) && /Orange Money/.test(p.text) && /carte/i.test(p.text))) {
      add('avertissement', 'paiement', p.line, 'si l\'on énumère les moyens de paiement de la plateforme : Wave, Orange Money et carte, les trois');
    }
  }
  const dernier = paras.at(-1);
  if (dernier && CTA_FIN.test(dernier.text)) add('avertissement', 'cta-fin', dernier.line, 'la page porte déjà son CTA de fin : pas d\'appel concurrent en conclusion');

  // Structure
  const mots = body.split(/\s+/).filter(Boolean).length;
  if (mots < 600) add('avertissement', 'longueur', 1, `${mots} mots : court pour se positionner`);
  if (mots > 2200) add('avertissement', 'longueur', 1, `${mots} mots : long pour une lecture sur téléphone`);
  const h2 = (body.match(/^##\s/gm) || []).length;
  if (h2 < 3) add('avertissement', 'structure', 1, `${h2} intertitre(s) ## : le sommaire en a besoin d'au moins 3`);
  const internes = (body.match(/\]\((\/(?!\/)|https:\/\/(edu\.|club\.)?maxmorrys\.me)/g) || []).length;
  if (internes < 2) add('avertissement', 'maillage', 1, `${internes} lien(s) interne(s) : en viser au moins 2`);
  if (meta.focusKeyword && !body.slice(0, 900).toLowerCase().includes(meta.focusKeyword.toLowerCase())) {
    add('avertissement', 'mot-cle', bodyStartLine, 'le mot-clé principal n\'apparaît pas dans l\'introduction');
  }
  return issues;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  let files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) {
    const dir = 'content/blog';
    files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md').map((f) => join(dir, f)) : [];
  }
  if (!files.length) { console.log('Aucun article à contrôler (content/blog/*.md).'); return; }

  let erreurs = 0;
  const rapport = {};
  for (const f of files) {
    const issues = lintFile(f);
    rapport[f] = issues;
    erreurs += issues.filter((x) => x.niveau === 'erreur').length;
    if (!json) {
      const e = issues.filter((x) => x.niveau === 'erreur').length;
      const w = issues.length - e;
      console.log(`${e ? '✖' : '✔'} ${f} — ${e} erreur(s), ${w} avertissement(s)`);
      for (const x of issues) console.log(`   ${x.niveau === 'erreur' ? 'ERREUR' : 'avert.'}  l.${x.ligne}  [${x.code}] ${x.message}`);
    }
  }
  if (json) console.log(JSON.stringify(rapport, null, 2));
  process.exit(erreurs ? 1 : 0);
}

main();
