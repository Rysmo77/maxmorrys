import type { Firestore } from '@mm/firestore-rest';

import { SITE_URL } from '../constants';
import { asText, cdata, escapeXml, rfc822 } from './values';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE FLUX PODCAST — il n'en existait aucun, et un autre en tenait lieu.
 *
 * ⚠️ CE QUI ÉTAIT FAUX. `/rss.xml` n'interroge que la collection `blog`. Le pôle média le
 * présentait pourtant comme le flux d'écoute, sous le libellé « Flux RSS », dans sa bande
 * « écoute où tu veux » : qui s'y abonnait pour les épisodes recevait des articles. Ce n'est
 * pas un détail de plomberie — un abonnement de podcast est un engagement durable, et celui-là
 * livrait autre chose que ce qu'il annonçait.
 *
 * ⚠️ POURQUOI ÇA VAUT PLUS QU'UNE CORRECTION. Un vrai flux ouvre Apple Podcasts et les
 * agrégateurs, qui n'acceptent QUE ce format. C'est de la distribution qui se cumule et ne se
 * consomme pas : une fois l'émission référencée, chaque épisode y arrive sans rien relancer.
 * Aucune fenêtre, aucune relance ne produit ce genre d'effet.
 *
 * ⚠️ CE QUE CE FLUX NE PEUT PAS DÉCLARER, ET QU'IL N'INVENTE PAS. La spécification attend un
 * `length` en octets sur chaque `<enclosure>` : le produit ne stocke pas le poids des fichiers
 * audio. On écrit `0`, valeur que les agrégateurs tolèrent, plutôt qu'un nombre estimé qui
 * serait faux. Le jour où `Podcast` portera la taille, elle se substituera ici sans rien
 * changer d'autre.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const FEED_TITLE = 'Max-Morrys — Podcast';
const FEED_DESCRIPTION =
  'Des gens qui vendent vraiment quelque chose à Dakar et à Abidjan racontent ce qui a marché, et ce qui leur a coûté cher.';
const FEED_AUTHOR = 'Max-Morrys';
const FEED_EMAIL = 'contact@maxmorrys.com';
const FEED_IMAGE = `${SITE_URL}/icone-mm.png`;

interface EpisodeDoc {
  slug?: string;
  title?: string;
  description?: string;
  audioUrl?: string;
  coverImage?: string;
  duration?: string;
  publishedAt?: string;
  updatedAt?: string;
}

/**
 * `hh:mm:ss` ou `mm:ss` passent tels quels — c'est ce qu'attend `itunes:duration`. Toute autre
 * forme est écartée plutôt que devinée : une durée fausse est pire qu'une durée absente.
 */
function dureeItunes(brut: string | undefined): string | null {
  if (!brut) return null;
  const nettoye = brut.trim();
  return /^\d{1,2}:\d{2}(:\d{2})?$/.test(nettoye) ? nettoye : null;
}

export async function buildPodcastRss(db: Firestore): Promise<string> {
  const documents = await db.query({
    collection: 'podcasts',
    where: [{ field: 'status', op: '==', value: 'published' }],
    select: ['slug', 'title', 'description', 'audioUrl', 'coverImage', 'duration', 'publishedAt', 'updatedAt'],
  });

  const episodes: EpisodeDoc[] = documents
    .map((document) => ({
      slug: asText(document.data.slug),
      title: asText(document.data.title),
      description: asText(document.data.description),
      audioUrl: asText(document.data.audioUrl),
      coverImage: asText(document.data.coverImage),
      duration: asText(document.data.duration),
      publishedAt: asText(document.data.publishedAt),
      updatedAt: asText(document.data.updatedAt),
    }))
    /* Un épisode sans fichier audio n'est pas un épisode : un agrégateur le rejetterait, et
       il ferait échouer la validation du flux entier chez certains. */
    .filter((episode) => episode.slug && episode.audioUrl)
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  const lastBuild = rfc822(episodes[0]?.updatedAt || episodes[0]?.publishedAt);

  const items = episodes
    .map((episode) => {
      const lien = `${SITE_URL}/podcasts/${episode.slug}`;
      const duree = dureeItunes(episode.duration);
      return [
        '    <item>',
        `      <title>${cdata(episode.title ?? '')}</title>`,
        `      <link>${escapeXml(lien)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(lien)}</guid>`,
        `      <pubDate>${rfc822(episode.publishedAt)}</pubDate>`,
        `      <description>${cdata(episode.description ?? '')}</description>`,
        `      <enclosure url="${escapeXml(episode.audioUrl ?? '')}" type="audio/mpeg" length="0" />`,
        duree ? `      <itunes:duration>${escapeXml(duree)}</itunes:duration>` : '',
        episode.coverImage ? `      <itunes:image href="${escapeXml(episode.coverImage)}" />` : '',
        '      <itunes:explicit>false</itunes:explicit>',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${cdata(FEED_TITLE)}</title>`,
    `    <link>${escapeXml(`${SITE_URL}/podcast-et-videos`)}</link>`,
    `    <description>${cdata(FEED_DESCRIPTION)}</description>`,
    '    <language>fr</language>',
    `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(`${SITE_URL}/podcast.xml`)}" rel="self" type="application/rss+xml" />`,
    `    <itunes:author>${escapeXml(FEED_AUTHOR)}</itunes:author>`,
    `    <itunes:summary>${cdata(FEED_DESCRIPTION)}</itunes:summary>`,
    '    <itunes:explicit>false</itunes:explicit>',
    '    <itunes:type>episodic</itunes:type>',
    `    <itunes:image href="${escapeXml(FEED_IMAGE)}" />`,
    '    <itunes:category text="Business" />',
    '    <itunes:owner>',
    `      <itunes:name>${escapeXml(FEED_AUTHOR)}</itunes:name>`,
    `      <itunes:email>${escapeXml(FEED_EMAIL)}</itunes:email>`,
    '    </itunes:owner>',
    items,
    '  </channel>',
    '</rss>',
  ]
    .filter(Boolean)
    .join('\n');
}
