import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import { buildPodcastRss } from '../src/seo/podcast-rss';

/**
 * Un abonnement de podcast est un engagement durable : ce flux doit être valide au premier
 * essai, parce qu'un agrégateur qui le refuse ne réessaie pas de lui-même.
 *
 * Il remplace une situation où `/rss.xml` — qui n'interroge que le blog — était présenté comme
 * le flux d'écoute : qui s'y abonnait pour les épisodes recevait des articles.
 */

function db(episodes: Array<Record<string, unknown>>): Firestore {
  return {
    query: vi.fn(async () => episodes.map((data, i) => ({ id: `e${i}`, path: `podcasts/e${i}`, data }))),
  } as unknown as Firestore;
}

const EP = {
  slug: 'mon-episode',
  title: 'Mon épisode',
  description: 'Ce qui a marché',
  audioUrl: 'https://media.maxmorrys.me/ep1.mp3',
  coverImage: 'https://media.maxmorrys.me/ep1.jpg',
  duration: '32:10',
  publishedAt: '2026-09-01T10:00:00.000Z',
  status: 'published',
};

describe('buildPodcastRss', () => {
  it('déclare les namespaces et le lien de soi que réclament les agrégateurs', async () => {
    const xml = await buildPodcastRss(db([EP]));
    expect(xml).toContain('xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"');
    expect(xml).toContain('rel="self"');
    expect(xml).toContain('<itunes:owner>');
    expect(xml).toContain('<itunes:category text="Business" />');
  });

  it('porte l’enclosure audio, sans quoi ce n’est pas un podcast', async () => {
    const xml = await buildPodcastRss(db([EP]));
    expect(xml).toContain('<enclosure url="https://media.maxmorrys.me/ep1.mp3" type="audio/mpeg"');
    expect(xml).toContain('<itunes:duration>32:10</itunes:duration>');
  });

  /*
   * ⚠️ Un épisode sans fichier audio ferait rejeter le flux ENTIER par certains agrégateurs.
   * On l'écarte plutôt que de publier une entrée qui n'en est pas une.
   */
  it('écarte un épisode sans audio au lieu de casser le flux', async () => {
    const xml = await buildPodcastRss(db([EP, { ...EP, slug: 'sans-audio', audioUrl: undefined }]));
    expect(xml).toContain('mon-episode');
    expect(xml).not.toContain('sans-audio');
  });

  it('n’invente jamais une durée qu’il ne sait pas lire', async () => {
    // « environ 30 min » n'est pas une durée iTunes : mieux vaut ne rien déclarer.
    const xml = await buildPodcastRss(db([{ ...EP, duration: 'environ 30 min' }]));
    expect(xml).not.toContain('<itunes:duration>');
  });

  it('trie du plus récent au plus ancien', async () => {
    const xml = await buildPodcastRss(db([
      { ...EP, slug: 'vieux', publishedAt: '2020-01-01T00:00:00.000Z' },
      { ...EP, slug: 'recent', publishedAt: '2026-09-01T00:00:00.000Z' },
    ]));
    expect(xml.indexOf('recent')).toBeLessThan(xml.indexOf('vieux'));
  });

  it('échappe ce qui vient de la base', async () => {
    const xml = await buildPodcastRss(db([{ ...EP, audioUrl: 'https://x/a.mp3?a=1&b=2' }]));
    expect(xml).toContain('a=1&amp;b=2');
  });
});
