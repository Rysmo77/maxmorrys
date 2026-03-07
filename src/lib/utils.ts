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

export function markdownToHtml(md: string): string {
  if (!md) return '';
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-black mt-8 mb-3 text-neutral-900 dark:text-white">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-black mt-10 mb-4 text-neutral-900 dark:text-white">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-black mt-10 mb-4 text-neutral-900 dark:text-white">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, src: string) => `<img src="${sanitizeUrl(src)}" alt="${alt.replace(/"/g, '&quot;')}" class="rounded-xl max-w-full my-4" loading="lazy" />`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, href: string) => `<a href="${sanitizeUrl(href)}" class="text-brand-600 dark:text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">${text}</a>`)
    .split('\n\n')
    .map((block) => {
      if (/^<h[123]/.test(block) || block.startsWith('<img')) return block;
      if (/^- /.test(block)) {
        const items = block.split('\n').filter((l) => l.startsWith('- ')).map((l) => `<li>${l.slice(2)}</li>`).join('');
        return `<ul class="list-disc pl-6 space-y-1.5 my-4 text-neutral-600 dark:text-neutral-400">${items}</ul>`;
      }
      if (/^\d+\. /.test(block)) {
        const items = block.split('\n').filter((l) => /^\d+\. /.test(l)).map((l) => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
        return `<ol class="list-decimal pl-6 space-y-1.5 my-4 text-neutral-600 dark:text-neutral-400">${items}</ol>`;
      }
      if (!block.trim()) return '';
      return `<p class="text-neutral-600 dark:text-neutral-400 leading-relaxed my-5">${block.trim()}</p>`;
    })
    .join('\n');
}
