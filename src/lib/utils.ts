
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

export function formatPrice(price: number, currency = 'XOF', locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
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

// ── Export CSV ────────────────────────────────────────────────────────────────

/**
 * Échappe une cellule CSV.
 *
 * Deux protections distinctes :
 *  1. **Échappement CSV standard** — guillemets doublés, encadrement dès qu'une
 *     cellule contient un séparateur, un guillemet ou un retour à la ligne.
 *  2. **Injection de formule** — une cellule commençant par `=`, `+`, `-` ou `@`
 *     est interprétée comme formule à l'ouverture dans Excel, LibreOffice ou
 *     Google Sheets. Un nom de commerce saisi par un inconnu ne doit jamais
 *     pouvoir s'exécuter sur le poste de celui qui ouvre l'export : on préfixe
 *     donc par une apostrophe, qui neutralise sans altérer la lecture.
 */
function escapeCsvCell(value: unknown): string {
  const raw = value == null ? '' : String(value);
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",;\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/**
 * Déclenche le téléchargement d'un CSV depuis le navigateur.
 *
 * Le séparateur est le point-virgule et non la virgule : c'est ce qu'attend Excel
 * en locale française, où la virgule est le séparateur décimal. Le BOM UTF-8 en
 * tête est indispensable, sans quoi Excel affiche « Ã© » à la place de « é ».
 */
export function exportToCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(';'));
  // U+FEFF (BOM UTF-8), écrit en séquence d'échappement : en caractère littéral il
  // serait invisible à la relecture et signalé comme espace irrégulier par ESLint.
  const BOM = '\uFEFF';
  const blob = new Blob([`${BOM}${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
