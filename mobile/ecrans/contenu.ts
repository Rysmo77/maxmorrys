/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE TEXTE D'UNE LEÇON, EN BLOCS — pur, éprouvé par `tests/unit/mobile-hors-ligne.test.ts`.
 *
 * Le site rend `lesson.content` par `markdownToHtml` (`src/lib/markdown.ts`), qui accepte
 * DEUX entrées : du Markdown, ou du HTML déjà écrit (éditeur, génération). L'application n'a
 * ni DOM ni `dangerouslySetInnerHTML` : elle ramène les deux à une liste de blocs que des
 * `<Text>` savent dessiner. Rien n'est exécuté, rien n'est injecté — un `<script>` devient
 * du texte inerte, au pire.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export interface Segment { texte: string; gras?: boolean; italique?: boolean; lien?: string }

export type Bloc =
  | { type: 'titre'; niveau: 1 | 2 | 3; segments: Segment[] }
  | { type: 'paragraphe'; segments: Segment[] }
  | { type: 'citation'; segments: Segment[] }
  | { type: 'liste'; ordonnee: boolean; items: Segment[][] };

const ENTITES: Readonly<Record<string, string>> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

function decoder(t: string): string {
  return t.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g, (e) => ENTITES[e] ?? e)
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
}

/** Le HTML d'un éditeur, ramené au Markdown que l'analyseur lit. */
export function htmlVersMarkdown(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n: string, t: string) => `\n\n${'#'.repeat(Math.min(3, Number(n)))} ${t}\n\n`)
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, t: string) => `\n\n> ${t.replace(/<\/?p[^>]*>/gi, ' ')}\n\n`)
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, t: string) => `\n\n${t.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_x: string, li: string) => `1. ${li.replace(/<\/?p[^>]*>/gi, '')}\n`)}\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t: string) => `- ${t.replace(/<\/?p[^>]*>/gi, '')}\n`)
    .replace(/<\/?(ul|ol)[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '');
}

/** `**gras**`, `*italique*` / `_italique_`, `[texte](url)`, `` `code` `` (rendu en texte). */
export function segmenter(ligne: string): Segment[] {
  const out: Segment[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g;
  let dernier = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ligne)) !== null) {
    if (m.index > dernier) out.push({ texte: decoder(ligne.slice(dernier, m.index)) });
    if (m[1] !== undefined) out.push({ texte: decoder(m[1]), gras: true });
    else if (m[2] !== undefined || m[3] !== undefined) out.push({ texte: decoder(m[2] ?? m[3]), italique: true });
    else if (m[4] !== undefined) {
      /* Seuls http(s) et mailto deviennent des liens. `javascript:` reste du texte. */
      const sur = /^(https?:|mailto:)/i.test(m[5]);
      out.push(sur ? { texte: decoder(m[4]), lien: m[5] } : { texte: decoder(m[4]) });
    } else out.push({ texte: decoder(m[6]) });
    dernier = m.index + m[0].length;
  }
  if (dernier < ligne.length) out.push({ texte: decoder(ligne.slice(dernier)) });
  return out.filter((s) => s.texte !== '');
}

const estHtml = (t: string) => /^\s*<(h[1-6]|p|div|section|article|ul|ol|figure|blockquote|pre|table|img|!--)\b/i.test(t);

export function blocs(contenu: string): Bloc[] {
  const md = estHtml(contenu) ? htmlVersMarkdown(contenu) : contenu;
  const out: Bloc[] = [];
  let paragraphe: string[] = [];
  let liste: { ordonnee: boolean; items: Segment[][] } | null = null;

  const fermer = () => {
    if (paragraphe.length) out.push({ type: 'paragraphe', segments: segmenter(paragraphe.join(' ').trim()) });
    paragraphe = [];
    if (liste) out.push({ type: 'liste', ...liste });
    liste = null;
  };

  for (const brute of md.replace(/\r\n?/g, '\n').split('\n')) {
    const ligne = brute.trim();
    if (ligne === '') { fermer(); continue; }
    const titre = /^(#{1,6})\s+(.*)$/.exec(ligne);
    if (titre) {
      fermer();
      out.push({ type: 'titre', niveau: Math.min(3, titre[1].length) as 1 | 2 | 3, segments: segmenter(titre[2]) });
      continue;
    }
    const citation = /^>\s?(.*)$/.exec(ligne);
    if (citation) { fermer(); out.push({ type: 'citation', segments: segmenter(citation[1]) }); continue; }
    const puce = /^[-*+]\s+(.*)$/.exec(ligne);
    const numero = /^\d+[.)]\s+(.*)$/.exec(ligne);
    if (puce || numero) {
      const ordonnee = Boolean(numero);
      if (paragraphe.length) { out.push({ type: 'paragraphe', segments: segmenter(paragraphe.join(' ').trim()) }); paragraphe = []; }
      if (liste && liste.ordonnee !== ordonnee) { out.push({ type: 'liste', ...liste }); liste = null; }
      liste ??= { ordonnee, items: [] };
      liste.items.push(segmenter((puce ?? numero)![1]));
      continue;
    }
    if (liste) { out.push({ type: 'liste', ...liste }); liste = null; }
    paragraphe.push(ligne);
  }
  fermer();
  return out.filter((b) => b.type === 'liste' ? b.items.length > 0 : b.segments.length > 0);
}
