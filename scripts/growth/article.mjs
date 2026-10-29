// Lecture d'un article du blog versionné (content/blog/<slug>.md).
//
// Format : un en-tête entre deux lignes `---`, puis le corps en Markdown.
// L'en-tête accepte un sous-ensemble volontairement réduit de YAML :
//   cle: valeur            (chaîne ; guillemets "…" facultatifs)
//   cle: [a, b, "c, d"]    (liste sur une ligne)
//   cle: true | false      (booléen)
// Pas d'imbrication, pas de liste multi-ligne : un format qu'on relit à l'œil.

import { readFileSync } from 'node:fs';

/** Les six pôles du blog — miroir de src/lib/blogCategories.ts (BLOG_POLES). */
export const BLOG_POLES = [
  'SEO & Visibilité',
  'Publicité en ligne',
  'Réseaux sociaux & Influence',
  'E-commerce & Vente en ligne',
  'IA & Automatisation',
  'Business & Gestion',
];

function unquote(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

function parseList(raw) {
  const inner = raw.trim().slice(1, -1);
  const out = [];
  let cur = '';
  let quote = null;
  for (const ch of inner) {
    if (quote) { if (ch === quote) quote = null; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === ',') { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function parseArticle(text, file = '(texte)') {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file} : en-tête « --- … --- » introuvable en tête de fichier.`);
  const meta = {};
  m[1].split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!kv) throw new Error(`${file} : ligne ${i + 2} de l'en-tête illisible : « ${line} »`);
    const [, key, raw] = kv;
    const v = raw.trim();
    if (v.startsWith('[') && v.endsWith(']')) meta[key] = parseList(v);
    else if (v === 'true' || v === 'false') meta[key] = v === 'true';
    else meta[key] = unquote(v);
  });
  const bodyStartLine = m[1].split(/\r?\n/).length + 3;
  return { meta, body: m[2], bodyStartLine };
}

export function readArticle(file) {
  return parseArticle(readFileSync(file, 'utf8'), file);
}

/** Miroir de slugify() de src/lib/utils.ts. */
export function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Miroir de calculateReadTime() de src/lib/utils.ts. */
export function readTime(content) {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
}
