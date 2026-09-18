import type { Firestore } from '@mm/firestore-rest';

import { SITE_URL } from '../constants';
import { getFaqSlugs } from '../prerender/faq';
import { enPath } from '../prerender/segments';
import { REALISATIONS } from '../prerender/realisations';
import { asIsoDate, asText, escapeXml } from './values';

/** Port fidèle de `functions/src/sitemap.ts`. */

interface ContentDoc {
  slug?: string;
  slug_en?: string;
  title?: string;
  publishedAt?: string;
  updatedAt?: string;
  coverImage?: string;
  thumbnailUrl?: string;
}

const PROJECTION = [
  'slug',
  'slug_en',
  'title',
  'publishedAt',
  'updatedAt',
  'coverImage',
  'thumbnailUrl',
];

async function getPublished(db: Firestore, collection: string): Promise<ContentDoc[]> {
  const documents = await db.query({
    collection,
    where: [{ field: 'status', op: '==', value: 'published' }],
    select: PROJECTION,
  });

  return documents.map((document) => ({
    slug: asText(document.data.slug),
    slug_en: asText(document.data.slug_en),
    title: asText(document.data.title),
    publishedAt: asText(document.data.publishedAt),
    updatedAt: asText(document.data.updatedAt),
    coverImage: asText(document.data.coverImage),
    thumbnailUrl: asText(document.data.thumbnailUrl),
  }));
}

interface UrlEntryOptions {
  frPath: string;
  enFullPath: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  imageLoc?: string;
  imageTitle?: string;
}

/** Émet DEUX entrées <url> (fr + en) partageant les mêmes alternates hreflang. */
function urlEntryPair(options: UrlEntryOptions): string {
  const {
    frPath,
    enFullPath,
    lastmod,
    changefreq = 'weekly',
    priority = '0.5',
    imageLoc,
    imageTitle,
  } = options;

  const frLoc = `${SITE_URL}${frPath}`;
  const enLoc = `${SITE_URL}${enFullPath}`;
  const iso = asIsoDate(lastmod);
  const lastmodTag = iso ? `<lastmod>${iso}</lastmod>` : '';
  const imageTag = imageLoc
    ? `<image:image><image:loc>${escapeXml(imageLoc)}</image:loc>${
        imageTitle ? `<image:title>${escapeXml(imageTitle)}</image:title>` : ''
      }</image:image>`
    : '';
  const alternates =
    `<xhtml:link rel="alternate" hreflang="fr" href="${escapeXml(frLoc)}"/>` +
    `<xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enLoc)}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(frLoc)}"/>`;

  const make = (loc: string) =>
    `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority>${alternates}${imageTag}</url>`;

  return `${make(frLoc)}\n${make(enLoc)}`;
}

const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/a-propos', changefreq: 'monthly', priority: '0.7' },
  { path: '/blog', changefreq: 'daily', priority: '0.9' },
  { path: '/formations', changefreq: 'weekly', priority: '0.9' },
  /*
   * LE PÔLE MÉDIA, ET PAS SES DEUX ANCÊTRES. `/podcasts` et `/videos` REDIRIGENT désormais
   * vers `/podcast-et-videos` : les laisser au sitemap y déclarait deux redirections comme
   * des pages, ce que Google signale en « page avec redirection » et n'indexe pas. Leurs
   * FICHES de détail, elles, gardent leurs adresses et restent poussées plus bas.
   */
  { path: '/podcast-et-videos', changefreq: 'weekly', priority: '0.8' },
  /*
   * L'autre étage du territoire violet — payant, fermé, mais sa page de vente est publique.
   */
  { path: '/club-des-digitos', changefreq: 'monthly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.5' },
  /*
   * LA PISTE CONCEPTION — ET PAS SES DEUX ANCÊTRES. `/agence` et `/presence-digitale` sont
   * désormais des 301 (CDC §3.4) : les laisser ici déclarerait deux redirections comme des
   * pages, ce que Google signale en « page avec redirection » et n'indexe jamais. C'est
   * exactement ce qui avait été corrigé pour `/podcasts` et `/videos` au-dessus, et
   * `npm run seo:check` le voit — il demande chaque URL du sitemap et échoue sur un 3xx.
   *
   * Les FICHES `/conception/realisations/<slug>` ne sont pas dans cette liste : elles sont
   * poussées plus bas, DÉRIVÉES de `REALISATIONS` — voir la boucle qui suit les pages statiques.
   */
  { path: '/conception', changefreq: 'monthly', priority: '0.9' },
  { path: '/conception/commerces-et-tpe', changefreq: 'monthly', priority: '0.8' },
  { path: '/conception/projets-sur-mesure', changefreq: 'monthly', priority: '0.8' },
  { path: '/conception/realisations', changefreq: 'monthly', priority: '0.7' },
  { path: '/apprendre', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  /*
   * La vérification d'un code. Elle se cherche depuis un moteur par quelqu'un qui a un
   * document entre les mains et ne connaît pas la marque — c'est exactement son public.
   */
  { path: '/verifier', changefreq: 'yearly', priority: '0.4' },
  { path: '/legal/mentions-legales', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/confidentialite', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cgv', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cgu', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cookies', changefreq: 'yearly', priority: '0.3' },
];

export async function buildSitemap(db: Firestore): Promise<string> {
  const [posts, formations, podcasts, videos] = await Promise.all([
    getPublished(db, 'blog'),
    getPublished(db, 'formations'),
    getPublished(db, 'podcasts'),
    getPublished(db, 'videos'),
  ]);

  const urls: string[] = [];

  /*
   * ───────────────────────────────────────────────────────────────────────────
   * UNE PAGE, UNE ENTRÉE — ET LE DÉDOUBLONNAGE PORTE SUR LA PAIRE.
   *
   * Trois articles français étaient déclarés DEUX FOIS, chaque fois avec un
   * `hreflang="en"` différent : deux documents de traduction anglais coexistaient en
   * base pour un même article, l'un des slugs finissant par `-2` — la signature d'une
   * déduplication à l'écriture. Ce fichier recopiait fidèlement les deux.
   *
   * CE QUE ÇA COÛTE. La page, elle, est irréprochable : elle ne déclare qu'un seul
   * alternate. C'est la rencontre des deux entrées qui se contredit — et un cluster
   * hreflang non réciproque n'est pas arbitré par Google, il est ignoré EN BLOC. Les
   * deux versions linguistiques perdent leur appariement d'un coup, sans qu'une seule
   * URL soit en erreur.
   *
   * ⚠️ POURQUOI PAS UN SIMPLE `Set` SUR LES `<loc>`. Écarter la seconde entrée FRANÇAISE
   * ne suffit pas : la seconde entrée ANGLAISE a une adresse différente, elle survivrait
   * au filtre, et elle continuerait d'annoncer `hreflang="fr"` vers le même article. La
   * contradiction resterait entière. C'est la PAIRE qu'il faut écarter.
   *
   * ⚠️ CE N'EST PAS LE CORRECTIF DE FOND. Le doublon vit dans Firestore ; il est
   * seulement rendu inoffensif ici. Tant qu'il y est, une traduction reste orpheline —
   * publiée, atteignable, annoncée nulle part.
   * ───────────────────────────────────────────────────────────────────────────
   */
  const locsVues = new Set<string>();
  const pushPair = (options: UrlEntryOptions): void => {
    const frLoc = `${SITE_URL}${options.frPath}`;
    const enLoc = `${SITE_URL}${options.enFullPath}`;
    if (locsVues.has(frLoc) || locsVues.has(enLoc)) {
      console.warn(`Sitemap : doublon écarté — ${frLoc} / ${enLoc}`);
      return;
    }
    locsVues.add(frLoc);
    locsVues.add(enLoc);
    urls.push(urlEntryPair(options));
  };

  for (const page of STATIC_PAGES) {
    pushPair({
      frPath: page.path,
      enFullPath: enPath(page.path),
      changefreq: page.changefreq,
      priority: page.priority,
    });
  }

  /*
   * ── LES FICHES DE RÉALISATION, DÉRIVÉES DE LA TABLE QUE LE PRÉ-RENDU LIT ───────────────────
   *
   * Absentes du sitemap à la mise en ligne du 18/09/2026. Le commentaire qui l'expliquait
   * affirmait qu'elles « vivent en base » et seraient poussées « quand la collection existera » :
   * c'était faux. Elles vivent dans `REALISATIONS`, et `prerender/realisations.ts` s'en sert déjà
   * pour servir chaque fiche aux robots. Les onze étaient donc pré-rendues, et annoncées à
   * personne — Google ne pouvait les découvrir qu'en suivant les liens de l'index.
   *
   * Dérivées, pas écrites : l'objection du commentaire d'origine — « la déclarer en dur mentirait
   * au premier ajout » — était juste, et c'est pourquoi la liste vient de la table. Une fiche
   * ajoutée entre dans le sitemap ET dans le pré-rendu au même geste ; elle ne peut exister dans
   * l'un sans l'autre.
   */
  for (const fiche of REALISATIONS) {
    const chemin = `/conception/realisations/${fiche.slug}`;
    pushPair({
      frPath: chemin,
      enFullPath: enPath(chemin),
      changefreq: 'yearly',
      priority: '0.5',
    });
  }

  const pushDynamic = (
    items: ContentDoc[],
    segment: string,
    changefreq: string,
    priority: string,
    imageKey: 'coverImage' | 'thumbnailUrl',
  ) => {
    for (const item of items) {
      if (!item.slug) continue;
      pushPair({
        frPath: `/${segment}/${item.slug}`,
        enFullPath: enPath(`/${segment}/${item.slug_en || item.slug}`),
        lastmod: item.updatedAt || item.publishedAt,
        changefreq,
        priority,
        imageLoc: item[imageKey],
        imageTitle: item.title,
      });
    }
  };

  pushDynamic(posts, 'blog', 'monthly', '0.7', 'coverImage');
  pushDynamic(formations, 'formations', 'weekly', '0.8', 'coverImage');
  pushDynamic(podcasts, 'podcasts', 'monthly', '0.6', 'coverImage');
  pushDynamic(videos, 'videos', 'monthly', '0.6', 'thumbnailUrl');

  /*
   * LES QUESTIONS DE LA FAQ.
   *
   * Elles ont une adresse depuis que `/faq/:slug` existe, et le sitemap n'en déclarait
   * AUCUNE : autant de pages que rien n'annonçait aux moteurs — ni le sitemap, ni un lien
   * interne dans le corps pré-rendu, ni la page elle-même, qui repartait en `noindex`. Les
   * trois manques se tenaient, et se réparent ensemble.
   *
   * Pas de `lastmod` : les documents `faq` ne portent pas de date de modification. Mieux vaut
   * l'omettre qu'inventer une date, qu'un moteur croirait.
   *
   * En cas d'échec, le sitemap sort SANS les questions plutôt que pas du tout : perdre
   * les questions est un moindre mal ; perdre tout le reste du sitemap n'en est pas un.
   */
  try {
    for (const slug of await getFaqSlugs(db)) {
      pushPair({
        frPath: `/faq/${slug}`,
        enFullPath: enPath(`/faq/${slug}`),
        changefreq: 'monthly',
        priority: '0.4',
      });
    }
  } catch (error: unknown) {
    console.error('Questions de la FAQ absentes du sitemap :', error);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
}
