import DOMPurify from 'dompurify';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateString: string, locale = 'fr-FR'): string {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatPrice(price: number, currency = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function extractSpotifyEpisodeId(url: string): string | null {
  const match = url.match(/open\.spotify\.com\/episode\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? null;
}

export function parseMsDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')} min`;
  return `${minutes} min`;
}

export function extractYoutubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

export function parseISODuration(iso: string): string {
  const h = iso.match(/(\d+)H/)?.[1];
  const m = iso.match(/(\d+)M/)?.[1];
  const s = iso.match(/(\d+)S/)?.[1];
  const hours = parseInt(h ?? '0', 10);
  const minutes = parseInt(m ?? '0', 10);
  const seconds = parseInt(s ?? '0', 10);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

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
