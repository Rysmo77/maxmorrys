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

export function debounce<T extends (...args: unknown[]) => void>(
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
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
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
      return `<p class="text-neutral-600 dark:text-neutral-400 leading-relaxed">${block.trim()}</p>`;
    })
    .join('\n');
}
