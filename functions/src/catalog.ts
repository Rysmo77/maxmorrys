import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const SITE_URL = 'https://maxmorrys.me';
const BRAND = 'Max-Morrys';
const CURRENCY = 'XOF';

interface FormationDoc {
  id: string;
  title: string;
  description: string;
  slug: string;
  coverImage: string;
  level: string;
  price: number;
  promoPrice?: number;
  category: string;
  status: string;
}

/**
 * CSV escaping per RFC 4180:
 * - If field contains comma, quote, or newline → wrap in double quotes
 * - Double quotes inside field → escape as ""
 */
function csvEscape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(values: (string | number | undefined | null)[]): string {
  return values.map(csvEscape).join(',');
}

/**
 * Sanitize description for catalog: strip markdown, limit length.
 * Meta accepts up to 5000 chars for description.
 */
function sanitizeDescription(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

export const catalog = onRequest(
  { region: 'europe-west1', memory: '256MiB' },
  async (_req, res) => {
    try {
      const db = admin.firestore();
      const snap = await db
        .collection('formations')
        .where('status', '==', 'published')
        .get();

      const formations: FormationDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as FormationDoc));

      // Meta Catalog CSV header (Facebook Commerce spec)
      const headers = [
        'id',
        'title',
        'description',
        'availability',
        'condition',
        'price',
        'link',
        'image_link',
        'brand',
        'sale_price',
        'product_type',
        'google_product_category',
      ];

      const rows: string[] = [headers.join(',')];

      for (const f of formations) {
        const fullPrice = `${f.price} ${CURRENCY}`;
        const salePrice = f.promoPrice ? `${f.promoPrice} ${CURRENCY}` : '';

        rows.push(buildCsvRow([
          f.id,
          f.title,
          sanitizeDescription(f.description || ''),
          'in stock',
          'new',
          fullPrice,
          `${SITE_URL}/formations/${f.slug}`,
          f.coverImage || `${SITE_URL}/og-default.jpg`,
          BRAND,
          salePrice,
          f.category || 'Formation',
          'Online Course', // Google product taxonomy proxy
        ]));
      }

      const csv = rows.join('\n');

      res.set('Content-Type', 'text/csv; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
      res.set('Content-Disposition', 'inline; filename="catalog.csv"');
      res.status(200).send(csv);
    } catch (error: unknown) {
      console.error('Catalog generation error:', error);
      res.status(500).set('Content-Type', 'text/plain').send('Catalog generation failed');
    }
  },
);
