import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon, Skeleton } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import DsNavHost from '../components/layout/DsNavHost';
import { Eyebrow, KitH2, KitSection, NightAccent, NightHero, Photo, type PhotoTone } from '../components/site/v3/kit';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useTranslatedList } from '../hooks/useTranslatedContent';
import { useFormat } from '../hooks/useFormat';
import { getPublishedPodcasts, getPublishedVideos } from '../lib/firestore/content';
import { queryKeys } from '../lib/queryClient';
import { podcastPlatform } from '../lib/brand';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PODCAST ET VIDÉOS — LA MAQUETTE `Site-Media` (bureau) / `-mobile` (390 px), PASSE 2.
 *
 * ⚠️ DÉCISIONS LEVÉES (porteur, 29/10/2026) : la grille mêlée filtrée par segment, le panneau
 * « écoute où tu veux » et l'encart Club cèdent la place à la planche — le dernier épisode en
 * lecteur, puis « Tous les épisodes » et « Vidéos » côte à côte, avec l'encart data.
 *
 * Ce qui reste tenu :
 * - LE POIDS N'EST PAS MESURÉ : la planche promet « le poids de chaque fichier » et
 *   « [N] Mo en 360p » ; le produit n'a que la DURÉE, c'est donc elle seule qui s'affiche. L'ancien
 *   aveu `weightNote` (note interne vue du public, audit 29/10/2026) est retiré : on se tait sur
 *   le poids plutôt que de le promettre (la règle 10 de `proof:check` garde la promesse) ;
 * - pas de Spotify ni d'Apple Podcasts inventés : la puce de plateforme ne paraît que si
 *   `podcastPlatform` existe ; « Télécharger » pointe le vrai fichier audio ;
 * - le lecteur est l'élément `<audio>` natif, sans préchargement (`preload="none"`) ;
 * - l'encart data ne dit que ce que `VideoDetail` fait réellement : aucune lecture
 *   automatique, l'intégration ne se charge qu'au clic. Le 360p de la planche n'existe pas ;
 * - titres traduits en `/en` comme sur les fiches ; chargement = squelette, jamais « vide ».
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const VIDEO_TONES: PhotoTone[] = ['informe', 'club', 'studio', 'edu'];

export default function MediaPole() {
  const { t } = useTranslation('media');
  const path = useLocalizedPath();
  const { formatDate } = useFormat();

  const { data: podcasts = [], isLoading: podcastsLoading } = useQuery({
    queryKey: queryKeys.publishedPodcasts,
    queryFn: () => getPublishedPodcasts(),
  });
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: queryKeys.publishedVideos,
    queryFn: () => getPublishedVideos(),
  });
  const loading = podcastsLoading || videosLoading;

  const titresPodcasts = useTranslatedList(podcasts.map((p) => p.title));
  const titresVideos = useTranslatedList(videos.map((v) => v.title));
  const episodes = useMemo(() => podcasts.map((p, i) => ({ ...p, title: titresPodcasts[i] || p.title })), [podcasts, titresPodcasts]);
  const clips = useMemo(() => videos.map((v, i) => ({ ...v, title: titresVideos[i] || v.title })), [videos, titresVideos]);
  const dernier = episodes[0] ?? null;

  const meta = (at?: string, duration?: string) => [at ? formatDate(at) : null, duration].filter(Boolean).join(' · ');
  const chipNuit = 'mm-chip !border-[color:rgb(255_255_255/.14)] !bg-[color:rgb(255_255_255/.08)] !text-[color:var(--paper-fixed)] no-underline';

  return (
    <DsNavHost>
      <SEOHead title={t('pole.seoTitle')} description={t('pole.lede')} />

      <NightHero mesh="club" className="pb-[30px] stack:pb-16">
        <div className="relative z-[1] mx-auto box-border w-full max-w-[1360px] px-5 pt-9 stack:px-10 stack:pt-[110px]">
          <Eyebrow className="text-[color:var(--mm-violet-c)]">
            <span className="stack:hidden">{t('pole.eyebrowShort')}</span>
            <span className="hidden stack:inline">{t('pole.eyebrow')}</span>
          </Eyebrow>
          <h1 className="mm-d mb-[14px] mt-[14px] text-[52px] leading-[.9] stack:mb-[22px] stack:mt-5 stack:text-[clamp(56px,7.4vw,112px)] stack:leading-[.88] stack:tracking-[-.05em]">
            {(t('pole.titleLines', { returnObjects: true }) as string[]).map((l, i) => (
              <span key={i}>
                {i > 0 && <br className="hidden stack:inline" />}
                {i > 0 && ' '}
                <NightAccent text={l} />
              </span>
            ))}
          </h1>
          <p className="m-0 text-[15.5px] leading-[1.55] text-ink-2 stack:hidden">{t('pole.ledeShort')}</p>
          <p className="m-0 mb-[26px] hidden max-w-[52ch] text-[18px] leading-[1.55] text-ink-2 stack:block">{t('pole.lede')}</p>
          <nav aria-label={t('pole.tabsAria')} className="mm-seg mt-[6px] hidden bg-[color:rgb(255_255_255/.1)] stack:inline-flex">
            <a href={path('/blog')} className="flex items-center px-[13px] text-[12.5px] font-semibold text-ink-2 no-underline">
              {t('pole.tabArticles')}
            </a>
            <span aria-current="page" className="flex items-center rounded-pill bg-[color:rgb(255_255_255/.9)] px-[13px] text-[12.5px] font-semibold text-[color:var(--ink-fixed)]">
              {t('pole.tabMedia')}
            </span>
          </nav>
        </div>
      </NightHero>

      {loading ? (
        <KitSection className="pt-11 stack:pt-[72px]">
          <Skeleton height={276} radius="var(--r-l)" label={t('pole.loading')} />
          <div className="mt-[72px] grid gap-8 wide:grid-cols-[1fr_1.4fr]">
            <Skeleton height={240} radius="var(--r-l)" />
            <Skeleton height={240} radius="var(--r-l)" />
          </div>
        </KitSection>
      ) : (
        <>
          {/* ── LE DERNIER ÉPISODE ───────────────────────────────────────────── */}
          {dernier && (
            <KitSection className="pt-11 stack:pt-[72px]">
              <div className="dk grid items-center gap-[26px] rounded-xl bg-[color:var(--surface-ink)] p-[18px] text-ink stack:grid-cols-[220px_1fr] stack:p-7">
                <Photo
                  tone="club"
                  className="h-[180px] !min-h-0 !rounded-card stack:h-[220px]"
                  img={dernier.coverImage ? { src: dernier.coverImage, alt: '' } : undefined}
                />
                <div className="min-w-0">
                  <Eyebrow className="text-[color:var(--mm-violet-c)]">{t('pole.latestEyebrow')}</Eyebrow>
                  <a href={path(`/podcasts/${dernier.slug}`)} className="mb-4 mt-[10px] block font-display text-[26px] font-black leading-[1.02] text-ink no-underline stack:text-[36px]">
                    {dernier.title}
                  </a>
                  {dernier.audioUrl && (
                    <audio controls preload="none" src={dernier.audioUrl} className="w-full">
                      {t('pole.audioUnsupported')}
                    </audio>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {podcastPlatform !== null && (
                      <a className={chipNuit} href={podcastPlatform.url} target="_blank" rel="noopener noreferrer">
                        {podcastPlatform.name}
                      </a>
                    )}
                    {dernier.audioUrl && (
                      <a className={chipNuit} href={dernier.audioUrl} download>
                        {t('pole.download')}
                      </a>
                    )}
                    {dernier.duration && <span className={chipNuit}><span className="mm-n">{dernier.duration}</span></span>}
                  </div>
                </div>
              </div>
            </KitSection>
          )}

          {/* ── ÉPISODES | VIDÉOS ────────────────────────────────────────────── */}
          <KitSection className="grid items-start gap-11 pt-11 stack:pt-[72px] wide:grid-cols-[1fr_1.4fr] wide:gap-8">
            <div>
              <KitH2 className="m-0 mb-3 stack:mb-4" size="clamp(28px, 3.2vw, 44px)">
                <span className="stack:hidden">{t('pole.episodesTitleShort')}</span>
                <span className="hidden stack:inline">{t('pole.episodesTitle')}</span>
              </KitH2>
              {episodes.length === 0 ? (
                <p className="m-0 text-ink-2">{t('pole.emptyEpisodes')}</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0 stack:gap-[10px]">
                  {episodes.map((e) => (
                    <li key={e.id} className="flex items-center gap-[14px] rounded-card border border-solid border-[color:var(--line)] bg-bento p-[14px]">
                      <a
                        className="mm-iconbtn h-12 w-12 flex-none !border-0 bg-[color:var(--mm-violet)] text-[color:var(--paper-fixed)]"
                        href={path(`/podcasts/${e.slug}`)}
                        aria-label={t('pole.listen', { title: e.title })}
                      >
                        <Icon name="play" size={16} />
                      </a>
                      <div className="min-w-0 flex-1">
                        <b className="block text-[15.5px]">{e.title}</b>
                        <span className="mm-n text-[12.5px] text-ink-2">{meta(e.publishedAt, e.duration)}</span>
                      </div>
                      {e.audioUrl && (
                        <a className="mm-chip flex-none no-underline" href={e.audioUrl} download>
                          {t('pole.download')}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <KitH2 className="m-0 mb-3 stack:mb-4" size="clamp(28px, 3.2vw, 44px)">{t('pole.videosTitle')}</KitH2>
              <div className="grid gap-4 stack:grid-cols-2">
                {clips.length === 0 && <p className="m-0 text-ink-2">{t('pole.emptyVideos')}</p>}
                {clips.map((v, i) => (
                  <a key={v.id} href={path(`/videos/${v.slug}`)} className="flex flex-col gap-[10px] text-ink no-underline">
                    <Photo
                      tone={VIDEO_TONES[i % VIDEO_TONES.length]}
                      className="relative grid h-[190px] !min-h-0 place-items-center !rounded-card stack:h-[230px]"
                      img={v.thumbnailUrl ? { src: v.thumbnailUrl, alt: '' } : undefined}
                    >
                      <span aria-hidden="true" className="absolute left-1/2 top-1/2 grid h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-[color:rgb(255_255_255/.9)] text-[color:var(--ink-fixed)]">
                        <Icon name="play" size={18} />
                      </span>
                      {v.duration && (
                        <span className="mm-tag absolute bottom-[10px] right-[10px] bg-[color:rgb(10_13_17/.8)] text-[color:var(--paper-fixed)]">
                          <span className="mm-n">{v.duration}</span>
                        </span>
                      )}
                    </Photo>
                    <b className="font-display text-[21px] font-black leading-[1.1]">
                      {v.title}
                    </b>
                  </a>
                ))}
                <div className="flex flex-col justify-center gap-[10px] rounded-card bg-[color:var(--paper-2)] p-[14px] stack:p-5">
                  <b className="font-display text-[18px] font-black leading-[1.1] stack:text-[22px]">{t('pole.dataTitle')}</b>
                  <span className="text-[14px] text-ink-2">{t('pole.dataBody')}</span>
                </div>
              </div>
            </div>
          </KitSection>
        </>
      )}
    </DsNavHost>
  );
}
