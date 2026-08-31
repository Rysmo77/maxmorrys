import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, GlassPanel, MediaCard, Segmented, SubNav, Tag } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { getPublishedPodcasts, getPublishedVideos } from '../lib/firestore/content';
import { queryKeys } from '../lib/queryClient';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE PÔLE MÉDIA — « Écouter & regarder », sous « Je te transforme ».
 *
 * Une seule page pour les deux formats. La distinction que le système fait n'est pas entre
 * l'audio et la vidéo, elle est entre la MÉTHODE et la VOIX : le blog donne des méthodes ;
 * ici, des gens racontent ce qu'ils ont fait.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES TROIS GARDE-FOUS DU TERRITOIRE VIOLET
 *
 * Ce territoire mêle du gratuit ouvert et du payant fermé — le pôle média et le Club. Trois
 * choses lèvent l'ambiguïté, et elles sont structurelles, pas rédactionnelles :
 *
 *   1. Une SOUS-NAVIGATION en tête, qui montre les deux étages d'un coup ;
 *   2. Le mot « gratuit » dans le PREMIER écran, pas en bas de page ;
 *   3. Le passage vers le Club EN BAS, jamais devant.
 *
 * Le troisième est le plus facile à perdre : une bande de conversion remonte toujours, sous
 * la pression du taux de clic. Elle est ici parce que quelqu'un qui vient d'écouter a une
 * raison d'y aller — pas avant.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ LE POIDS DES FICHIERS N'EST PAS AFFICHÉ, et c'est un manque, pas un choix. Le kit le
 * met sur chaque carte parce que c'est l'information qui permet de décider quand le forfait
 * est compté. Les types `Podcast` et `Video` ne portent pas de taille : elle n'est pas
 * relevée à l'enregistrement. L'encart de vérité le dit plutôt que d'afficher un chiffre
 * inventé — c'est la règle 6, appliquée à ce qu'on n'a pas.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
type Filter = 'all' | 'listen' | 'watch';

export default function MediaPole() {
  const { t } = useTranslation('media');
  const path = useLocalizedPath();
  const [filter, setFilter] = useState<Filter>('all');

  const { data: podcasts = [] } = useQuery({
    queryKey: queryKeys.publishedPodcasts,
    queryFn: () => getPublishedPodcasts(),
  });
  const { data: videos = [] } = useQuery({
    queryKey: ['videos', 'published'],
    queryFn: () => getPublishedVideos(),
  });

  const labels: Record<Filter, string> = {
    all: t('pole.filterAll'),
    listen: t('pole.filterListen'),
    watch: t('pole.filterWatch'),
  };

  const items = useMemo(() => {
    const audio = podcasts.map((p) => ({
      key: `p-${p.id}`, format: 'audio' as const, title: p.title,
      meta: p.duration, to: `/podcasts/${p.slug}`, at: p.publishedAt,
    }));
    const video = videos.map((v) => ({
      key: `v-${v.id}`, format: 'video' as const, title: v.title,
      meta: v.duration, to: `/videos/${v.slug}`, at: v.publishedAt,
    }));
    const all = filter === 'listen' ? audio : filter === 'watch' ? video : [...audio, ...video];
    return all.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
  }, [podcasts, videos, filter]);

  return (
    <DsNavHost>
      <SEOHead
        title={(t('pole.titleLines', { returnObjects: true }) as string[]).join(' ')}
        description={t('pole.lede')}
      />

      <PageSite>
        {/* Garde-fou 1 : les deux étages du territoire, montrés ensemble. */}
        <SubNav
          label={t('pole.eyebrow')}
          active={t('pole.filterAll')}
          items={[
            { label: t('pole.subnavFree'), href: path('/podcast-et-videos'), territory: 'transforme' },
            { label: t('pole.subnavClub'), href: path('/club-des-digitos'), territory: 'transforme' },
          ]}
        />

        {/* Garde-fou 2 : « gratuit » est dans le premier écran, dans le sourcil. */}
        <SiteEyebrow style={{ marginTop: '18px' }}>{t('pole.eyebrow')}</SiteEyebrow>
        <SiteDisplay lines={t('pole.titleLines', { returnObjects: true }) as string[]} size={52} from={1} />

        <p className="rv mt-[14px] max-w-[52ch] text-[16px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 5 }}>
          {t('pole.lede')}
        </p>

        <div className="rv mt-4 flex flex-wrap gap-2" style={{ ['--i' as string]: 6 }}>
          <Tag tone="ok">{t('pole.tagFree')}</Tag>
          <Tag>{t('pole.tagTranscript')}</Tag>
        </div>

        <div className="rv mt-6 max-w-[380px]" style={{ ['--i' as string]: 7 }}>
          <Segmented
            label={t('pole.eyebrow')}
            options={[labels.all, labels.listen, labels.watch]}
            value={labels[filter]}
            onChange={(o) => setFilter(o === labels.listen ? 'listen' : o === labels.watch ? 'watch' : 'all')}
          />
        </div>

        {items.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {items.map((item, i) => (
              <div key={item.key} className="rv" style={{ ['--i' as string]: i + 1 }}>
                <MediaCard
                  format={item.format}
                  playHref={path(item.to)}
                  playLabel={`${item.format === 'video' ? t('pole.filterWatch') : t('pole.filterListen')} — ${item.title}`}
                  title={item.title}
                  eyebrow={item.meta}
                  badge={item.format === 'video' ? t('pole.filterWatch') : t('pole.filterListen')}
                  artHeight={170}
                  titleSize={21}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 max-w-prose text-lede text-ink-2">{t('pole.empty')}</p>
        )}

        <p className="mt-5 max-w-[56ch] text-meta text-ink-2 leading-[1.55]">{t('pole.rhythm')}</p>

        {/* L'aveu : le poids manque, et on le dit. */}
        <GlassPanel level="truth" className="mt-4 max-w-[74ch]">
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('pole.truthTitle')}</SiteEyebrow>
          <p className="m-0 text-meta-2 text-ink-2 leading-[1.55]">{t('pole.truthBody')}</p>
        </GlassPanel>

        {/* Garde-fou 3 : le Club, EN BAS. Jamais devant. */}
        <div
          className="rv-s mt-[54px] rounded-xl p-[34px] text-white"
          style={{
            background: 'linear-gradient(140deg,var(--mm-violet),var(--mm-bleu) 72%,var(--mm-teal))',
            boxShadow: 'var(--sh-violet)',
          }}
        >
          <div className="grid items-center gap-8 lg:grid-cols-[1.25fr_.75fr]">
            <div>
              <SiteDisplay
                as="h2"
                lines={t('pole.clubTitle', { returnObjects: true }) as string[]}
                size={31}
                style={{ lineHeight: 1.06 }}
              />
              <p className="mt-3 mb-0 max-w-[48ch] text-[14px] leading-[1.6]" style={{ color: 'rgba(255,255,255,.86)' }}>
                {t('pole.clubBody')}
              </p>
            </div>
            <Button href={path('/club-des-digitos')} tone="ghost" focusInvert fullWidth={false}>
              {t('pole.clubCta')}
            </Button>
          </div>
        </div>
      </PageSite>
    </DsNavHost>
  );
}
