import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Button, GlassPanel, MediaCard, Num, Skeleton, TranslationNotice } from '@ds';
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



/**
 * D'OÙ VIENT LA VIDÉO — et ce que ça autorise à promettre.
 *
 * La provenance n'est pas un détail d'implémentation ici : elle décide de ce que la page a le
 * droit d'écrire. Sur une iframe YouTube ou Vimeo, la qualité est arbitrée par le lecteur
 * distant selon le réseau ; on ne la choisit pas d'ici, et un sélecteur de qualité maison
 * serait un décor. Sur un fichier servi tel quel, il n'y a qu'une version : il n'y a pas plus
 * de choix, mais pour la raison inverse. Les deux cas ne se disent donc pas avec la même
 * phrase, d'où ce troisième champ.
 */
type VideoSource = 'youtube' | 'vimeo' | 'file';

function resolveVideoEmbed(url: string): { type: 'iframe' | 'native'; src: string; source: VideoSource } {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  // `autoplay=1` N'EST PAS un démarrage automatique : l'iframe n'existe pas tant que « Lancer
  // ici » n'a pas été pressé. Sans lui, la porte coûterait deux clics — un pour la franchir,
  // un pour lancer — et la deuxième pression serait payée en octets déjà chargés.
  if (ytMatch) return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&autoplay=1`, source: 'youtube' };
  if (url.includes('youtube.com/embed')) return { type: 'iframe', src: url, source: 'youtube' };
  if (url.includes('player.vimeo.com') || url.includes('vimeo.com/video')) return { type: 'iframe', src: url, source: 'vimeo' };
  return { type: 'native', src: url, source: 'file' };
}

export default function VideoDetail() {
  const { t } = useTranslation('media');
  const { formatDate } = useFormat();
  const { language } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const [video, setVideo] = useState<Video | null | undefined>(undefined);
  const [others, setOthers] = useState<Video[]>([]);
  /**
   * LA PORTE. Tant qu'elle est fermée, aucun lecteur n'est monté — donc aucun script tiers,
   * aucune vignette de YouTube, aucun octet de vidéo. Elle se referme au changement de slug :
   * arriver sur une autre vidéo par la bande « À regarder ensuite » ne doit pas hériter d'un
   * consentement donné pour la précédente.
   */
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!slug) return;
    setPlaying(false);
    getVideoBySlug(slug, language).then((data) => {
      setVideo(data);
      if (data) {
        trackViewItem({ id: data.id, name: data.title, category: data.category, content_type: 'video' });
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

  /*
    `trackVideoPlay` SE DÉCLENCHE ICI, ET PLUS AU CHARGEMENT.

    Il partait dans l'effet de récupération : ouvrir la fiche comptait une lecture, même en
    repartant aussitôt. Avec une porte, l'événement a enfin un moment vrai — celui où
    quelqu'un décide de dépenser ses données. Un compteur qui compte autre chose que ce que
    son nom annonce est un chiffre inventé, simplement rangé ailleurs qu'à l'écran.
  */
  const startPlayback = () => {
    setPlaying(true);
    trackVideoPlay(video.id, video.title);
  };

  const externalLabel =
    embed?.source === 'youtube' ? t('detail.gateOpenYoutube')
    : embed?.source === 'vimeo' ? t('detail.gateOpenSource')
    : null;

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

        <div className="mt-4 grid items-start gap-12 wide:grid-cols-[1fr_300px]">
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
              LA PORTE, PUIS LE LECTEUR — dans cet ordre, et c'est tout l'écran.

              `loading="lazy"` ne servait à rien ici : l'attribut ne diffère le chargement que
              d'une iframe située hors du champ, et celle-ci était montée en tête de page, donc
              dans le premier écran, donc chargée. Une vidéo intégrée tire son propre script,
              sa vignette et son préchargement dès le montage. Sur un marché où le panier de
              2 Go coûte en médiane 4,2 % du revenu national brut par habitant, monter le
              lecteur sans le demander revient à dépenser l'argent de quelqu'un d'autre.

              CE QUE LA MAQUETTE DEMANDE, ET CE QUI EST TENU. Le kit fait choisir entre
              « 480p · 24 Mo » et « 720p HD · 96 Mo » avant lecture. Ces deux chiffres ne sont
              pas tenables : le type `Video` (src/types/index.ts) porte `videoUrl`,
              `thumbnailUrl` et `duration`, et RIEN sur le poids ni sur les variantes de
              qualité — l'encart de vérité de cette page le dit déjà. Les afficher serait
              exactement le chiffre inventé que la règle 6 interdit, sur l'écran qui prétend
              protéger le forfait.

              Ce qui est tenu à la place, et qui est la moitié qui compte : la vidéo ne se
              charge pas tant que personne ne l'a demandée. Le choix de qualité, lui, est
              énoncé pour ce qu'il est — arbitré par le lecteur distant, hors de portée d'ici
              — au lieu d'être mimé par un sélecteur qui ne commanderait rien.

              La vignette est l'image de couverture quand elle existe, sinon le dégradé du kit.
              Elle coûte quelques dizaines de kilo-octets contre plusieurs dizaines de
              méga-octets, et c'est précisément le rapport qui justifie la porte.
            */}
            {!playing ? (
              <div className="rv mt-5" style={{ ['--i' as string]: 4 }}>
                <div
                  className="relative aspect-video overflow-hidden rounded-media"
                  style={{
                    background: 'linear-gradient(140deg,var(--mm-bleu),var(--mm-violet))',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  {video.thumbnailUrl && (
                    <img
                      src={video.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {/*
                    Le disque blanc et son glyphe sombre sont l'exception assumée du système :
                    encre fixe dans les deux thèmes, parce qu'un `--ink` deviendrait blanc sous
                    `.dk` et le triangle disparaîtrait dans le disque. Même recette que
                    `MediaCard`, à la lettre.
                  */}
                  <button
                    type="button"
                    onClick={startPlayback}
                    aria-label={`${t('detail.gatePlay')} — ${tTitle || video.title}`}
                    className="mm-press-sm absolute inset-0 m-auto grid h-[62px] w-[62px] cursor-pointer place-items-center rounded-full border-0 p-0"
                    style={{ background: 'rgba(255,255,255,.92)', boxShadow: '0 8px 22px rgba(14,17,22,.24)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      <polygon points="7 4 20 12 7 20" fill="var(--night-2)" />
                    </svg>
                  </button>
                  {/*
                    La durée EST une valeur de base : elle passe donc par <Num>, qui nomme sa
                    source et sa date. C'est le seul chiffre que cette page ait le droit
                    d'écrire avant lecture — le poids, lui, n'existe pas.
                  */}
                  {video.duration && (
                    <span
                      className="absolute left-[14px] top-[14px] inline-flex h-[25px] items-center rounded-pill px-[10px] text-[10.5px] font-semibold"
                      style={{ background: 'rgba(0,0,0,.5)', color: 'var(--text-invert)' }}
                    >
                      <Num
                        value={video.duration}
                        source="db"
                        asOf={new Date(video.updatedAt ?? video.publishedAt)}
                      />
                    </span>
                  )}
                </div>

                <GlassPanel level="flat" padding={18} className="mt-3">
                  <SiteEyebrow style={{ marginBottom: '6px' }}>{t('detail.gateEyebrow')}</SiteEyebrow>
                  <p className="m-0 text-meta leading-[1.55] text-ink-2">
                    {embed?.type === 'native' ? t('detail.gateBodyFile') : t('detail.gateBody')}
                  </p>
                  {/*
                    Les deux sorties de la maquette. La seconde n'apparaît que si elle mène
                    quelque part de nommable : `video.videoUrl` est l'URL de la fiche, elle
                    n'est pas fabriquée ici. Sur un fichier servi tel quel, il n'y a pas de
                    « chez l'hébergeur » à proposer — le bouton disparaît plutôt que de mentir.
                  */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button tone="transforme" size="sm" onClick={startPlayback}>
                      {t('detail.gatePlay')}
                    </Button>
                    {externalLabel && (
                      <Button tone="quiet" size="sm" href={video.videoUrl} target="_blank">
                        {externalLabel}
                      </Button>
                    )}
                  </div>
                </GlassPanel>
              </div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-media bg-[color:var(--fill-2)]">
                {embed?.type === 'iframe' ? (
                  <iframe
                    src={embed.src}
                    title={video.title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="aspect-video w-full border-0"
                  />
                ) : (
                  // `ref` POSÉ, ce qu'il n'était pas : `useContentEngagement` reçoit
                  // `videoRef` depuis toujours, mais aucun élément ne s'y attachait — la
                  // position lue valait donc zéro par construction. Le brancher ne suffit pas
                  // encore : l'effet du hook ne se relie qu'une fois, sur `[user, consent,
                  // contentId]`, et la porte fait naître l'élément APRÈS. La correction vit
                  // dans le hook, qui n'est pas de ce lot ; la référence, elle, est juste.
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    preload="metadata"
                    poster={video.thumbnailUrl}
                    src={video.videoUrl}
                    className="aspect-video w-full"
                  >
                    <track kind="captions" />
                  </video>
                )}
              </div>
            )}

            <GlassPanel level="truth" className="mt-4 max-w-prose">
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('detail.weightTitle')}</SiteEyebrow>
              <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('detail.weightBodyVideo')}</p>
            </GlassPanel>

            <SiteEyebrow style={{ marginTop: '26px' }}>{t('detail.about')}</SiteEyebrow>
            <div
              className="mm-prose prose-article"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(tDescription || video.description) }}
            />
          </article>

          <aside className="grid gap-[14px] wide:sticky wide:top-[calc(var(--header-h)+1rem)]">
            {/*
              LA FICHE DE FAITS, AU-DESSUS DE L'AVEU.

              La colonne ne portait qu'un panneau, et ce panneau ne disait qu'une chose : que
              les chapitres n'existent pas. Une colonne collante qui suit le défilement pour ne
              répéter qu'un manque est un coût d'attention sans contrepartie.

              Les trois faits posés ici sont ceux que la page a DÉJÀ — date, catégorie, durée —
              et rien d'autre : ni poids, ni compteur de vues. `Video.views` existe pourtant sur
              le type, mais l'encart de vérité du pôle promet en toutes lettres qu'aucun
              compteur d'écoute n'est affiché ; le montrer ici démentirait la page d'à côté.
            */}
            <GlassPanel level="flat" padding={22}>
              <SiteEyebrow style={{ marginBottom: '10px' }}>{t('detail.facts')}</SiteEyebrow>
              <dl className="m-0 grid gap-[10px] text-meta-2">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-2">{t('detail.factsPublished')}</dt>
                  <dd className="mm-num m-0 text-right text-ink">{formatDate(video.publishedAt)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-2">{t('detail.factsCategory')}</dt>
                  <dd className="m-0 text-right text-ink">{tCategory || video.category}</dd>
                </div>
                {video.duration && (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-2">{t('detail.factsDuration')}</dt>
                    {/* La durée vient de la base : elle porte sa source et sa date, comme
                        celle de la porte. C'est la règle 6, pas une décoration. */}
                    <dd className="m-0 text-right text-ink">
                      <Num
                        value={video.duration}
                        source="db"
                        asOf={new Date(video.updatedAt ?? video.publishedAt)}
                      />
                    </dd>
                  </div>
                )}
              </dl>
            </GlassPanel>

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
          <div className="mt-5 grid gap-4 stack:grid-cols-3">
            {others.slice(0, 3).map((other, i) => (
              <div key={other.id} className="rv" style={{ ['--i' as string]: i + 1 }}>
                <MediaCard
                  format="video"
                  image={other.thumbnailUrl}
                  artRatio="16 / 9"
                  playHref={path(`/videos/${other.slug}`)}
                  playLabel={`${t('detail.watch')} — ${other.title}`}
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
