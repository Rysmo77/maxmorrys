import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Button, GlassPanel, MediaCard, Skeleton, TranslationNotice } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useLanguage } from '../contexts/LanguageContext';
import { contentPath } from '../lib/contentPath';
import { getVideoBySlug, getPublishedVideos } from '../lib/firestore';
import { useTranslatedText } from '../hooks/useTranslatedContent';
import { markdownToHtml } from '../lib/markdown';
import { queryClient, queryKeys } from '../lib/queryClient';
import { useFormat } from '../hooks/useFormat';
import type { Video } from '../types';
import { trackViewItem, trackVideoPlay } from '../lib/tracking';
import { useContentEngagement } from '../hooks/useContentEngagement';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';



function resolveVideoEmbed(url: string): { type: 'iframe' | 'native'; src: string } {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` };
  if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com') || url.includes('vimeo.com/video')) {
    return { type: 'iframe', src: url };
  }
  return { type: 'native', src: url };
}

export default function VideoDetail() {
  const { t } = useTranslation('media');
  const { formatDate } = useFormat();
  const { language } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const [video, setVideo] = useState<Video | null | undefined>(undefined);
  const [others, setOthers] = useState<Video[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!slug) return;
    getVideoBySlug(slug, language).then((data) => {
      setVideo(data);
      if (data) {
        trackViewItem({ id: data.id, name: data.title, category: data.category, content_type: 'video' });
        trackVideoPlay(data.id, data.title);
        queryClient
          .fetchQuery({ queryKey: queryKeys.publishedVideos, queryFn: () => getPublishedVideos() })
          .then((all) => setOthers(all.filter((v) => v.id !== data.id).slice(0, 10)))
          .catch(() => null);
      }
    }).catch(() => setVideo(null));
  }, [slug, language]);

  useContentEngagement({
    contentId: video?.id,
    type: 'video',
    slug: video?.slug ?? '',
    title: video?.title ?? '',
    category: video?.category ?? 'général',
    mediaRef: videoRef,
  });

  // Contenu dynamique traduit (langue active). Hooks appelés inconditionnellement.
  const tTitle = useTranslatedText(video?.title);
  const tCategory = useTranslatedText(video?.category);
  const tDescription = useTranslatedText(video?.description);

  const path = useLocalizedPath();
  const embed = video ? resolveVideoEmbed(video.videoUrl) : null;

  if (video === undefined) {
    return (
      <PageSite>
        <div className="grid max-w-[760px] gap-4">
          <Skeleton width={200} height={12} />
          <Skeleton height={38} width="78%" />
          <Skeleton height={220} radius="var(--r-media)" style={{ marginTop: '10px' }} />
        </div>
      </PageSite>
    );
  }

  if (!video) {
    return (
      <PageSite>
        <SiteDisplay lines={[t('videos.notFound')]} size={34} />
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
      <SEOHead
        title={tTitle || video.title}
        description={tDescription || video.description}
        ogImage={video.thumbnailUrl}
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.title,
        description: video.description,
        uploadDate: video.publishedAt,
        thumbnailUrl: video.thumbnailUrl,
        contentUrl: video.videoUrl,
        url: `${SITE_URL}${contentPath('videos', video, language)}`,
      }} />

      <PageSite>
        <Breadcrumb
          label={t('detail.breadcrumbRoot')}
          items={[
            { label: t('detail.breadcrumbRoot'), href: path('/podcast-et-videos') },
            { label: tCategory || video.category },
          ]}
        />

        <div className="mt-4 grid items-start gap-12 lg:grid-cols-[1fr_300px]">
          <article>
            <SiteEyebrow>{t('detail.watch')}</SiteEyebrow>
            <SiteDisplay wrap lines={[tTitle || video.title]} size={40} from={1} style={{ maxWidth: '22ch' }} />

            <p className="mm-num rv mt-3 text-meta text-ink-2" style={{ ['--i' as string]: 3 }}>
              {formatDate(video.publishedAt)} · {video.duration}
            </p>

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
                date={formatDate(video.publishedAt)}
                href={`/videos/${video.slug}`}
                originalLabel={t('detail.translatedOriginal')}
                style={{ marginTop: '18px', maxWidth: 'var(--measure-prose)' }}
              />
            )}

            {/*
              LE LECTEUR. `loading="lazy"` sur l'iframe : une vidéo intégrée charge son propre
              script et sa vignette dès le montage si on ne l'en empêche pas — c'est le poste
              le plus lourd de la page, pour quelqu'un qui ne la lancera peut-être jamais.
            */}
            <div className="rv mt-5 overflow-hidden rounded-media bg-[color:var(--fill-2)]" style={{ ['--i' as string]: 4 }}>
              {embed?.type === 'iframe' ? (
                <iframe
                  src={embed.src}
                  title={video.title}
                  loading="lazy"
                  allowFullScreen
                  className="aspect-video w-full border-0"
                />
              ) : (
                <video controls preload="none" poster={video.thumbnailUrl} src={video.videoUrl} className="aspect-video w-full">
                  <track kind="captions" />
                </video>
              )}
            </div>

            <GlassPanel level="truth" className="mt-4 max-w-prose">
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('detail.weightTitle')}</SiteEyebrow>
              <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('detail.weightBody')}</p>
            </GlassPanel>

            <SiteEyebrow style={{ marginTop: '26px' }}>{t('detail.about')}</SiteEyebrow>
            <div
              className="mm-prose prose-article"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(tDescription || video.description) }}
            />
          </article>

          <aside className="grid gap-[14px] lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
            <GlassPanel level="hero" padding={22}>
              <SiteEyebrow style={{ marginBottom: '8px' }}>{t('detail.chapters')}</SiteEyebrow>
              {/*
                Le kit liste les chapitres ici, et note que « les chapitres se lisent sans
                lancer la vidéo — c'est souvent tout ce qu'on cherche ». Le type `Video` n'en
                porte pas. On le dit plutôt que d'en fabriquer.
              */}
              <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('detail.transcriptMissing')}</p>
            </GlassPanel>
          </aside>
        </div>
      </PageSite>

      {others.length > 0 && (
        <SiteBand>
          <SiteDisplay as="h2" lines={t('detail.nextTitleVideo', { returnObjects: true }) as string[]} size={34} />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {others.slice(0, 3).map((other, i) => (
              <div key={other.id} className="rv" style={{ ['--i' as string]: i + 1 }}>
                <MediaCard
                  format="video"
                  playHref={path(`/videos/${other.slug}`)}
                  playLabel={`${t('detail.watch')} — ${other.title}`}
                  title={other.title}
                  eyebrow={other.duration}
                  artHeight={130}
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
