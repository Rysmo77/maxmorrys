import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Button, GlassPanel, MediaCard, Skeleton, SubNav, TranslationNotice } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import ShareButtons from '../components/shared/ShareButtons';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useLanguage } from '../contexts/LanguageContext';
import { contentPath } from '../lib/contentPath';
import { getPodcastBySlug, getPublishedPodcasts } from '../lib/firestore';
import { useTranslatedText } from '../hooks/useTranslatedContent';
import { markdownToHtml } from '../lib/markdown';
import { queryClient, queryKeys } from '../lib/queryClient';
import { useFormat } from '../hooks/useFormat';
import type { Podcast } from '../types';
import { trackViewItem, trackPodcastPlay } from '../lib/tracking';
import { useContentEngagement } from '../hooks/useContentEngagement';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';



function resolveAudioEmbed(url: string): { type: 'iframe' | 'native'; src: string } {
  const spotifyMatch = url.match(/open\.spotify\.com\/(episode|show|track)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) return { type: 'iframe', src: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}` };
  // Apple Podcasts → forme embed
  if (url.includes('embed.podcasts.apple.com')) return { type: 'iframe', src: url };
  if (url.includes('podcasts.apple.com')) {
    return { type: 'iframe', src: url.replace('://podcasts.apple.com', '://embed.podcasts.apple.com') };
  }
  if (url.includes('/embed/') || url.includes('anchor.fm') || url.includes('podcasters.spotify.com')) {
    return { type: 'iframe', src: url };
  }
  return { type: 'native', src: url };
}

export default function PodcastDetail() {
  const { t } = useTranslation('media');
  const { formatDate } = useFormat();
  const { language } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const [podcast, setPodcast] = useState<Podcast | null | undefined>(undefined);
  const [others, setOthers] = useState<Podcast[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!slug) return;
    getPodcastBySlug(slug, language).then((data) => {
      setPodcast(data);
      if (data) {
        trackViewItem({ id: data.id, name: data.title, category: data.category, content_type: 'podcast' });
        trackPodcastPlay(data.id, data.title);
        queryClient
          .fetchQuery({ queryKey: queryKeys.publishedPodcasts, queryFn: () => getPublishedPodcasts() })
          .then((all) => setOthers(all.filter((p) => p.id !== data.id).slice(0, 4)))
          .catch(() => null);
      }
    }).catch(() => setPodcast(null));
  }, [slug, language]);

  useContentEngagement({
    contentId: podcast?.id,
    type: 'podcast',
    slug: podcast?.slug ?? '',
    title: podcast?.title ?? '',
    category: podcast?.category ?? 'général',
    mediaRef: audioRef,
  });

  // Contenu dynamique traduit (langue active). Hooks appelés inconditionnellement.
  const tTitle = useTranslatedText(podcast?.title);
  const tCategory = useTranslatedText(podcast?.category);
  const tDescription = useTranslatedText(podcast?.description);
  const tTranscript = useTranslatedText(podcast?.transcript);

  const path = useLocalizedPath();
  /* Spotify, Apple, Anchor ou fichier brut : la résolution existait déjà, on la garde. */
  const embed = podcast ? resolveAudioEmbed(podcast.audioUrl) : null;

  if (podcast === undefined) {
    return (
      <PageSite>
        <div className="grid max-w-[760px] gap-4">
          <Skeleton width={200} height={12} />
          <Skeleton height={38} width="80%" />
          <Skeleton height={38} width="52%" />
          <Skeleton height={190} radius="var(--r-media)" style={{ marginTop: '10px' }} />
        </div>
      </PageSite>
    );
  }

  if (!podcast) {
    return (
      <PageSite>
        <SiteDisplay lines={[t('detail.notFound')]} size={34} />
        <p className="mt-4">
          <Button href={path('/podcast-et-videos')} tone="quiet" size="sm" fullWidth={false}>
            {t('pole.subnavFree')}
          </Button>
        </p>
      </PageSite>
    );
  }

  return (
    <DsNavHost>
      <SEOHead title={tTitle || podcast.title} description={tDescription || podcast.description} ogImage={podcast.coverImage} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'PodcastEpisode',
        name: podcast.title,
        description: podcast.description,
        datePublished: podcast.publishedAt,
        url: `${SITE_URL}${contentPath('podcasts', podcast, language)}`,
        associatedMedia: { '@type': 'MediaObject', contentUrl: podcast.audioUrl },
      }} />

      <PageSite>
        {/*
          ── LES DEUX ÉTAGES DU TERRITOIRE, DANS LA PAGE ────────────────────────────────
          Elle vivait dans le chrome fixe, et deux mesures l'ont condamnée là : la rangée
          portait `px-[18px]` sur toute la fenêtre, donc à 1440 px les deux pilules
          ouvraient à x=18 quand la colonne de la page ouvre à x=120 — cent deux pixels
          plus à gauche que TOUT le reste de l'écran, pilule de navigation comprise. Et
          n'ayant aucune surface derrière elle, elle laissait le corps de l'article lui
          passer AU TRAVERS dès le premier défilement : « Pourquoi écouter cet audio ? »
          se lisait en toutes lettres par-dessus « Écouter & regarder ».

          Les deux défauts ont la même cause — une primitive de page posée dans du chrome.
          `SubNav` le dit dans son propre en-tête : « elle est en tête de page, elle défile
          avec elle ». Ici, elle est dans `PageSite` : sa gouttière est celle du contenu par
          construction, elle défile, et elle ne recouvre plus rien. C'est aussi l'endroit
          exact où `MediaPole` et `ClubDigitos` la posent — la rangée ne se déplace donc
          plus d'une route à l'autre du territoire.
        */}
        <SubNav
          className="mb-[18px]"
          label={t('pole.eyebrow')}
          active={t('pole.subnavFree')}
          items={[
            { label: t('pole.subnavFree'), href: path('/podcast-et-videos'), territory: 'transforme' },
            { label: t('pole.subnavClub'), href: path('/club-des-digitos'), territory: 'transforme' },
          ]}
        />

        <Breadcrumb
          label={t('detail.breadcrumbRoot')}
          items={[
            { label: t('detail.breadcrumbRoot'), href: path('/podcast-et-videos') },
            { label: tCategory || podcast.category },
          ]}
        />

        <div className="mt-4 grid items-start gap-12 wide:grid-cols-[1fr_300px]">
          <article>
            {/*
              ── LA POCHETTE ENTRE DANS LA PAGE ──────────────────────────────────────────
              `coverImage` est un champ OBLIGATOIRE du type `Podcast`, rempli par l'import
              Spotify. Il ne servait qu'à `ogImage` : la pochette existait pour les réseaux
              sociaux et pour personne d'autre — la fiche elle-même n'avait AUCUNE image.

              Carrée, parce que c'est le format natif d'une pochette : l'étaler en bandeau
              obligerait à recadrer, et un recadrage automatique coupe les visages.
            */}
            <div className="grid items-start gap-[26px] stack:grid-cols-[220px_1fr]">
              <div
                className="rv aspect-square w-full overflow-hidden rounded-media"
                style={{
                  /* Le dégradé audio est le FOND, donc le repli : pochette absente ou URL
                     cassée, c'est lui qu'on voit — jamais une icône de lien brisé. */
                  background: 'linear-gradient(140deg,var(--mm-violet),var(--mm-bleu) 62%,var(--mm-teal))',
                  border: '1px solid var(--border-glass)',
                  ['--i' as string]: 2,
                }}
              >
                {podcast.coverImage && (
                  <img
                    /* `key` SUR LA SOURCE : sans lui, React réutilise le même élément d'un
                       épisode à l'autre, et le `display:none` posé par l'échec de la pochette
                       précédente survit — la pochette suivante, bonne, resterait cachée. */
                    key={podcast.coverImage}
                    src={podcast.coverImage}
                    alt={t('detail.coverAlt')}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-0">
                <SiteEyebrow>{t('detail.listen')}</SiteEyebrow>
                <SiteDisplay wrap lines={[tTitle || podcast.title]} size={40} from={1} style={{ maxWidth: '22ch' }} />

                <p className="mm-num rv mt-3 text-meta text-ink-2" style={{ ['--i' as string]: 3 }}>
                  {formatDate(podcast.publishedAt)} · {podcast.duration}
                </p>

                {/* Un épisode s'envoie à quelqu'un ; il n'y avait aucun bouton pour le faire. */}
                <ShareButtons
                  className="rv mt-3"
                  url={`/podcasts/${podcast.slug}`}
                  title={podcast.title}
                  contentType="podcast"
                  contentId={podcast.id}
                />

                {/*
                  LE BANDEAU DE TRADUCTION, EN TÊTE DE CORPS.

                  Le titre, la catégorie et la description passent par `useTranslatedText` : cette
                  page sert donc bien du texte traduit à la machine, au même titre qu'un article.
                  La traduction est générée au pré-rendu ET MISE EN CACHE — une correction du
                  français n'atteint la version anglaise qu'à l'expiration du cache, et il n'y a
                  pas d'invalidation manuelle. Le dire coûte moins cher que de faire semblant.

                  Jamais en pied : après le contenu, un avertissement n'avertit plus.
                */}
                {language === 'en' && (
                  <TranslationNotice
                    date={formatDate(podcast.publishedAt)}
                    href={`/podcasts/${podcast.slug}`}
                    originalLabel={t('detail.translatedOriginal')}
                    style={{ marginTop: '18px', maxWidth: 'var(--measure-prose)' }}
                  />
                )}

                {/*
                  LE LECTEUR. Il ne se charge que si on le lance — `preload="none"` : sur un
                  forfait compté, un audio préchargé est de l'argent dépensé pour rien.
                */}
                <div className="rv mt-5 overflow-hidden rounded-media" style={{ ['--i' as string]: 4 }}>
                  {embed?.type === 'iframe' ? (
                    <iframe
                      src={embed.src}
                      title={podcast.title}
                      loading="lazy"
                      className="h-[180px] w-full border-0"
                      allow="encrypted-media"
                    />
                  ) : (
                    <audio
                      controls
                      preload="none"
                      src={podcast.audioUrl}
                      className="w-full"
                      onPlay={() => trackPodcastPlay(podcast.id, podcast.title)}
                    >
                      <track kind="captions" />
                    </audio>
                  )}
                </div>
              </div>
            </div>

            {/* L'aveu du poids manquant — la règle 6 appliquée à ce qu'on n'a pas. */}
            <GlassPanel level="truth" className="mt-4 max-w-prose">
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('detail.weightTitle')}</SiteEyebrow>
              <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('detail.weightBody')}</p>
            </GlassPanel>

            <SiteEyebrow style={{ marginTop: '26px' }}>{t('detail.about')}</SiteEyebrow>
            <div
              className="mm-prose prose-article"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(tDescription || podcast.description) }}
            />
          </article>

          <aside className="grid gap-[14px] wide:sticky wide:top-[calc(var(--header-h)+1rem)]">
            <GlassPanel level="hero" padding={22}>
              <SiteEyebrow style={{ marginBottom: '8px' }}>{t('detail.transcript')}</SiteEyebrow>
              {podcast.transcript ? (
                /*
                  La transcription se lit SANS charger l'audio. Sur un forfait compté, c'est
                  souvent tout ce qu'on cherche — d'où sa place dans la colonne, visible sans
                  qu'on ait à lancer quoi que ce soit.
                */
                <div className="mm-prose text-meta-2">
                  <div dangerouslySetInnerHTML={{ __html: markdownToHtml(tTranscript || podcast.transcript) }} />
                </div>
              ) : (
                /* On ne fabrique pas ce qui n'existe pas : on dit que ça manque. */
                <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('detail.transcriptMissing')}</p>
              )}
            </GlassPanel>
          </aside>
        </div>
      </PageSite>

      {others.length > 0 && (
        <SiteBand>
          <SiteDisplay as="h2" lines={t('detail.nextTitle', { returnObjects: true }) as string[]} size={34} />
          <div className="mt-5 grid gap-4 stack:grid-cols-3">
            {others.slice(0, 3).map((other, i) => (
              <div key={other.id} className="rv" style={{ ['--i' as string]: i + 1 }}>
                <MediaCard
                  format="audio"
                  image={other.coverImage}
                  artRatio="16 / 9"
                  playHref={path(`/podcasts/${other.slug}`)}
                  playLabel={`${t('detail.listen')} — ${other.title}`}
                  title={other.title}
                  eyebrow={other.duration}
                  titleSize={17}
                />
              </div>
            ))}
          </div>
        </SiteBand>
      )}
    </DsNavHost>
  );
}
