import type { Firestore } from '@mm/firestore-rest';

import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../constants';
import { asText } from '../seo/values';
import { enPath } from './segments';
import { stripMarkdown } from './html';
import type { PageMeta } from './types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES QUESTIONS DE LA FAQ N'AVAIENT PAS DE PRODUCTEUR.
 *
 * `routes.ts` envoie `/faq/**` au pré-rendu — la ligne y est même commentée « Une page PAR
 * question ». Mais `getContentMeta` ne connaissait que quatre collections (blog, formations,
 * podcasts, vidéos) : aucune branche `/faq/`. Toute adresse `/faq/<slug>` retombait donc dans
 * `unknownRouteMeta`, c'est-à-dire :
 *
 *   • `<meta name="robots" content="noindex, nofollow" />` — toutes les questions activement
 *     désindexées, alors que la fonctionnalité a été construite pour leur donner « une
 *     position propre en recherche » (kit, § FaqQuestion) ;
 *   • le titre et la description GÉNÉRIQUES du site — toutes les URL partagées sur WhatsApp
 *     produisaient donc le même aperçu, celui de la page d'accueil ;
 *   • `<h1>Max-Morrys</h1>` pour tout corps.
 *
 * Vérifié en production le 03/09/2026 sur `/faq/c-est-qui-max-morrys` : noindex, titre
 * générique, h1 générique. Rien ne le signalait — ni erreur, ni test, et le sitemap ne
 * déclarait aucune de ces adresses, donc Search Console n'avait rien à signaler non plus.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Un document `faq` réduit à ce dont le pré-rendu a besoin. */
export interface FaqDoc {
  question: string;
  answer: string;
  category?: string;
  /** Slug figé à l'administration. Absent sur les questions historiques. */
  slug?: string;
  order: number;
}

/** Champs rapatriés. La projection réduit la bande passante, pas les lectures facturées. */
const PROJECTION = ['question', 'answer', 'category', 'slug', 'order'];

/**
 * Miroir de `slugify` (`src/lib/utils.ts`).
 *
 * ⚠️ CETTE COPIE DOIT RESTER IDENTIQUE À L'ORIGINALE. C'est elle qui décide de l'adresse
 * d'une question : si les deux divergent d'un seul caractère, le Worker pré-rend une URL
 * que l'application ne sait pas ouvrir — le robot voit une page, le visiteur un 404.
 * `test/faq.test.ts` rejoue les cas qui séparent les deux implémentations.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Miroir de `faqSlug` (`src/lib/faq/slug.ts`) : slug renseigné d'abord, sinon dérivé du texte.
 */
export function faqSlug(item: Pick<FaqDoc, 'question' | 'slug'>): string {
  const authored = item.slug?.trim();
  return authored ? slugify(authored) : slugify(item.question);
}

/**
 * Toutes les questions, dans l'ordre d'affichage.
 *
 * `orderBy('order')` n'est pas cosmétique ici : deux questions peuvent produire le même slug
 * dérivé, et `findFaqBySlug` retient LA PREMIÈRE. Trier autrement ferait pré-rendre une autre
 * question que celle qu'ouvre l'application, à la même adresse.
 */
async function getAllFaq(db: Firestore): Promise<FaqDoc[]> {
  const documents = await db.query({
    collection: 'faq',
    orderBy: [{ field: 'order', direction: 'asc' }],
    select: PROJECTION,
  });

  return documents
    .map((document) => ({
      question: asText(document.data.question) ?? '',
      answer: asText(document.data.answer) ?? '',
      category: asText(document.data.category),
      slug: asText(document.data.slug),
      order: typeof document.data.order === 'number' ? document.data.order : 0,
    }))
    .filter((item) => item.question && item.answer);
}

/** Réduit une réponse à une meta description : phrase entière quand c'est possible. */
function toDescription(answer: string, max = 160): string {
  const flat = stripMarkdown(answer).replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' ! '), cut.lastIndexOf(' ? '));
  // Une coupe nette sur une fin de phrase si elle laisse au moins la moitié du budget.
  if (lastStop > max / 2) return cut.slice(0, lastStop + 1).trim();
  return cut.slice(0, cut.lastIndexOf(' ')).trim() + '…';
}

/**
 * Le balisage d'une question.
 *
 * `FAQPage` et non `QAPage` : Google réserve `QAPage` aux forums où le public répond, et
 * `FAQPage` aux réponses écrites par le site — c'est le cas ici. Le rich result FAQ est
 * restreint depuis août 2023, mais le balisage reste lu par les autres moteurs et par les
 * moteurs de réponse, et il coûte une ligne.
 */
function questionJsonLd(item: FaqDoc, url: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: stripMarkdown(item.answer) },
      },
    ],
    '@id': url,
  };
}

/**
 * Méta d'une page `/faq/<slug>`.
 *
 * Retourne `null` quand le slug ne désigne aucune question — l'appelant retombe alors sur
 * `unknownRouteMeta`, donc en `noindex`, ce qui est le bon comportement pour une adresse
 * inventée.
 */
export async function getFaqQuestionMeta(
  db: Firestore,
  slug: string,
  lang: 'fr' | 'en',
): Promise<PageMeta | null> {
  const items = await getAllFaq(db);
  const wanted = slugify(slug);
  const item = items.find((candidate) => faqSlug(candidate) === wanted);
  if (!item) return null;

  const resolved = faqSlug(item);
  const frUrl = `${SITE_URL}/faq/${resolved}`;
  // Une question n'a pas de `slug_en` : l'adresse anglaise porte le même segment.
  const enUrl = `${SITE_URL}${enPath(`/faq/${resolved}`)}`;

  return {
    title: `${item.question} | ${SITE_NAME}`,
    description: toDescription(item.answer),
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: item.question,
    canonical: lang === 'en' ? enUrl : frUrl,
    altFr: frUrl,
    altEn: enUrl,
    lang,
    h1: item.question,
    bodyText: stripMarkdown(item.answer),
    jsonLd: questionJsonLd(item, frUrl),
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'FAQ', url: `${SITE_URL}/faq` },
      { name: item.question, url: frUrl },
    ],
  };
}

/**
 * Enrichit l'index `/faq` du balisage de ses questions.
 *
 * L'index est une page STATIQUE : sa méta ne dépend pas de la base, et c'est ce qui la rend
 * increvable. L'enrichissement est donc au mieux — si Firestore ne répond pas, la page garde
 * son titre, sa description et son fil d'Ariane, et perd seulement son JSON-LD.
 */
export async function withFaqIndexJsonLd(db: Firestore, meta: PageMeta): Promise<PageMeta> {
  let items: FaqDoc[];
  try {
    items = await getAllFaq(db);
  } catch (error: unknown) {
    console.error('Balisage FAQ indisponible :', error);
    return meta;
  }
  if (items.length === 0) return meta;

  return {
    ...meta,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: stripMarkdown(item.answer),
          url: `${SITE_URL}/faq/${faqSlug(item)}`,
        },
      })),
    },
    /*
     * L'index listait ses questions à l'écran et AUCUNE dans le corps pré-rendu : le robot
     * voyait un titre et rien d'autre, donc aucun lien vers les pages qu'on vient d'ouvrir.
     * Les questions elles-mêmes sont le meilleur texte d'ancre possible.
     */
    bodyText: [meta.bodyText, ...items.map((item) => item.question)].filter(Boolean).join('\n\n'),
  };
}

/** Les adresses des questions, pour le sitemap. */
export async function getFaqSlugs(db: Firestore): Promise<string[]> {
  const items = await getAllFaq(db);
  // Deux questions peuvent produire le même slug dérivé : une seule adresse existe.
  return [...new Set(items.map((item) => faqSlug(item)))];
}
