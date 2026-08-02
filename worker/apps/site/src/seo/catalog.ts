import type { Firestore } from '@mm/firestore-rest';

import { DEFAULT_OG_IMAGE, SITE_URL } from '../constants';
import { asNumber, asText } from './values';

/** Port fidèle de `functions/src/catalog.ts` (flux produits Meta Commerce). */

const BRAND = 'Max-Morrys';
const CURRENCY = 'XOF';

/**
 * Échappement CSV selon RFC 4180 : guillemets si le champ contient une virgule,
 * un guillemet ou un saut de ligne ; guillemets internes doublés.
 */
function csvEscape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsvRow(values: Array<string | number | undefined | null>): string {
  return values.map(csvEscape).join(',');
}

/** Retire le markdown et borne la longueur (Meta accepte 5000 caractères). */
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

const HEADERS = [
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

export async function buildCatalog(db: Firestore): Promise<string> {
  const documents = await db.query({
    collection: 'formations',
    where: [{ field: 'status', op: '==', value: 'published' }],
  });

  const rows: string[] = [HEADERS.join(',')];

  for (const document of documents) {
    const data = document.data;
    const price = asNumber(data.price);
    const promoPrice = asNumber(data.promoPrice);

    rows.push(
      buildCsvRow([
        document.id,
        asText(data.title),
        sanitizeDescription(asText(data.description) ?? ''),
        'in stock',
        'new',
        `${price} ${CURRENCY}`,
        `${SITE_URL}/formations/${asText(data.slug) ?? ''}`,
        asText(data.coverImage) || DEFAULT_OG_IMAGE,
        BRAND,
        promoPrice ? `${promoPrice} ${CURRENCY}` : '',
        asText(data.category) || 'Formation',
        // Approximation de la taxonomie produits Google.
        'Online Course',
      ]),
    );
  }

  return rows.join('\n');
}
