import DOMPurify from 'dompurify';

/**
 * Rendu Markdown → HTML assaini.
 *
 * Module à part et non dans `lib/utils` : DOMPurify pèse 104 Ko bruts, et
 * `utils` est importé par le squelette de l'application pour `cn`, `formatPrice`
 * ou `debounce`. La bibliothèque se retrouvait donc dans le chunk d'entrée de
 * chaque visiteur, alors que `markdownToHtml` n'est appelé que par des routes
 * chargées à la demande (article, formation, podcast, vidéo, leçon, Club).
 */

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:\/\/|\/|#|mailto:)/i.test(trimmed)) return trimmed;
  return '#'; // protocole dangereux (javascript:, data:, vbscript:…) → lien neutre
}

// Detecte si le contenu est deja du HTML (genere par Gemini ou colle dans l'editeur)
function isHtmlContent(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  // Match les balises bloc courantes au debut, ou n'importe quelle balise sur la 1ere ligne
  return /^<(h[1-6]|p|div|section|article|ul|ol|figure|blockquote|pre|table|img|!--)\b/i.test(trimmed);
}

export function markdownToHtml(md: string): string {
  if (!md) return '';

  // Si le contenu est deja du HTML, on bypass le parsing markdown.
  // Le wrapper `prose` de Tailwind Typography gere automatiquement le styling.
  let raw: string;
  if (isHtmlContent(md)) {
    raw = md;
  } else {
    raw = md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, src: string) => `<img src="${sanitizeUrl(src)}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy" />`)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, href: string) => `<a href="${sanitizeUrl(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`)
      .split('\n\n')
      .map((block) => {
        if (/^<(h[1-6]|img|ul|ol|blockquote|pre|figure|table)/i.test(block)) return block;
        if (/^- /.test(block)) {
          const items = block.split('\n').filter((l) => l.startsWith('- ')).map((l) => `<li>${l.slice(2)}</li>`).join('');
          return `<ul>${items}</ul>`;
        }
        if (/^\d+\. /.test(block)) {
          const items = block.split('\n').filter((l) => /^\d+\. /.test(l)).map((l) => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
          return `<ol>${items}</ol>`;
        }
        if (!block.trim()) return '';
        return `<p>${block.trim()}</p>`;
      })
      .join('\n');
  }

  // Whitelist large : on s'appuie sur la liste safe par défaut de DOMPurify
  // (couvre toutes les balises HTML standard sauf script/style/iframe/etc.),
  // qu'on étend aux quelques balises sémantiques utiles, et on autorise tous
  // les attributs HTML/data/ARIA standards via ALLOW_DATA_ATTR + ALLOW_ARIA_ATTR.
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ['figure', 'figcaption', 'picture', 'source', 'details', 'summary', 'mark', 'kbd', 'samp', 'var', 'time', 'address', 'abbr', 'cite', 'dfn', 'sub', 'sup'],
    ADD_ATTR: ['class', 'style', 'target', 'rel', 'loading', 'colspan', 'rowspan', 'datetime', 'cite', 'open', 'controls', 'autoplay', 'muted', 'loop', 'poster', 'preload', 'srcset', 'sizes', 'media'],
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
  });
}
