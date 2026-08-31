import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, ChipRow, GlassPanel, Icon, SearchPill, Skeleton, TerritoryCard } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useFormat } from '../hooks/useFormat';
import { getPublishedPosts } from '../lib/firestore';
import { queryKeys } from '../lib/queryClient';
import { categoryToPole } from '../lib/blogCategories';
import { trackSearch } from '../lib/tracking';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /blog — LE MOTIF « INDEX », et le seul territoire qui vit vraiment.
 *
 * Structure de la maquette : sourcil → titre → chapô → filtres → article à la une en grande
 * carte territoire → grille de trois → bande de renvoi vers le pôle média.
 *
 * TROIS DÉCISIONS DU KIT, portées ici :
 *
 * 1. AUCUNE VIGNETTE PHOTO. « La couleur de la carte dit le type de contenu, et ne coûte rien
 *    à charger. » Sur un marché où le panier de données 2 Go vaut 4,2 % du revenu national
 *    brut par habitant, une grille de douze vignettes est un choix qu'on fait payer au
 *    lecteur. Les cartes territoire portent un dégradé — poids zéro.
 *
 * 2. LE PODCAST N'EST PLUS ICI. Il est passé sous « Je te transforme » : le blog donne une
 *    MÉTHODE, le pôle média donne une VOIX. La bande du bas le dit explicitement plutôt que
 *    de laisser quelqu'un chercher.
 *
 * 3. AUCUN CHAMP DE LETTRE D'INFORMATION. Le produit n'a pas de canal d'envoi. Le panneau
 *    « Suivre les publications » propose ce qui existe — un flux RSS, une alerte dans
 *    l'espace — et écrit pourquoi il ne propose pas d'e-mail.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export default function Blog() {
  const { t } = useTranslation('blog');
  const path = useLocalizedPath();
  const { formatDate } = useFormat();
  const [pole, setPole] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: queryKeys.blogPosts,
    queryFn: () => getPublishedPosts(),
  });

  /* Les compteurs de filtre DÉRIVENT de la liste — ce n'est pas un compteur libre. */
  const poles = useMemo(() => {
    const tally = new Map<string, number>();
    for (const post of posts) {
      const key = categoryToPole(post.category);
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
    return [...tally.entries()].sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const chips = useMemo(
    () => [`${t('index.filterAll')} · ${posts.length}`, ...poles.map(([name, n]) => `${name} · ${n}`)],
    [poles, posts.length, t],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesPole = !pole || categoryToPole(post.category) === pole;
      const matchesSearch = !q || post.title.toLowerCase().includes(q) || post.excerpt?.toLowerCase().includes(q);
      return matchesPole && matchesSearch;
    });
  }, [posts, pole, search]);

  const [featured, ...rest] = filtered;

  return (
    <DsNavHost>
      <SEOHead title={t('seo.title')} description={t('seo.description')} />
      {posts.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          url: `${SITE_URL}/blog`,
          blogPost: posts.slice(0, 10).map((p) => ({
            '@type': 'BlogPosting', headline: p.title, datePublished: p.publishedAt,
            url: `${SITE_URL}/blog/${p.slug}`,
          })),
        }} />
      )}

      <PageSite>
        <SiteEyebrow>{t('index.eyebrow')}</SiteEyebrow>
        {/*
          La première ligne porte un COMPTE RÉEL, dérivé de la liste. La contrainte d'AD-13
          n'est pas que la ligne soit une constante — c'est qu'elle ne se replie jamais toute
          seule. Elle est composée, puis rendue insécable.
        */}
        <SiteDisplay
          lines={[t('index.countLine', { count: posts.length }), t('index.freeLine')]}
          size={52}
          from={1}
        />

        <p className="rv mt-[14px] max-w-[52ch] text-[16px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 4 }}>
          {t('index.lede')}
        </p>

        <div className="rv mt-6 flex flex-wrap items-center justify-between gap-5" style={{ ['--i' as string]: 5 }}>
          <div className="min-w-0 flex-1 max-w-[640px]">
            <ChipRow
              label={t('index.eyebrow')}
              options={chips}
              value={pole ? chips.find((c) => c.startsWith(pole)) : chips[0]}
              onChange={(option) => setPole(option.startsWith(t('index.filterAll')) ? '' : option.split(' · ')[0])}
            />
          </div>
          <div className="w-full sm:w-[300px] sm:flex-none">
            <SearchPill
              label={t('index.searchLabel')}
              labelHidden
              hint={t('index.searchHint')}
              icon={<Icon name="search" size={16} strokeWidth={2.4} />}
              value={search}
              onChange={(v) => { setSearch(v); if (v.trim().length > 2) trackSearch(v.trim()); }}
            />
          </div>
        </div>

        {isLoading ? (
          /* Un squelette À LA FORME du contenu attendu, pour que rien ne saute quand il
             arrive. Jamais un rond qui tourne : il ne dit ni quoi, ni combien de temps. */
          <div className="mt-[22px] grid gap-4">
            <Skeleton height={210} radius="var(--r-l)" label={t('index.eyebrow')} />
            <div className="grid gap-[14px] md:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} height={140} radius="var(--r-l)" />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-[22px] max-w-prose text-lede text-ink-2">{t('index.empty')}</p>
        ) : (
          <>
            {featured && (
              <div className="rv mt-[22px]" style={{ ['--i' as string]: 6 }}>
                <TerritoryCard
                  layout="plain"
                  territory="informe"
                  href={path(`/blog/${featured.slug}`)}
                  padding={30}
                  meta={`${formatDate(featured.publishedAt)}${featured.readTime ? ` · ${featured.readTime}` : ''}`}
                  title={featured.title}
                  titleSize={32}
                  trailing={<Button tone="primary" size="sm" fullWidth={false}>{t('index.read')}</Button>}
                >
                  {featured.excerpt && (
                    <p className="mt-[11px] mb-0 max-w-[60ch] text-[15px] leading-[1.55]" style={{ color: 'var(--card-ink-2)' }}>
                      {featured.excerpt}
                    </p>
                  )}
                </TerritoryCard>
              </div>
            )}

            {rest.length > 0 && (
              <div className="mt-[14px] grid gap-[14px] md:grid-cols-3">
                {rest.map((post, i) => (
                  <div key={post.id} className="rv" style={{ ['--i' as string]: 7 + i }}>
                    <TerritoryCard
                      layout="plain"
                      /* La couleur alterne sur les quatre territoires plus le rose : elle
                         donne un rythme à la grille sans qu'aucune photo ne se charge. */
                      territory={(['informe', 'rose', 'transforme', 'forme'] as const)[i % 4]}
                      href={path(`/blog/${post.slug}`)}
                      padding={22}
                      meta={`${formatDate(post.publishedAt)}${post.readTime ? ` · ${post.readTime}` : ''}`}
                      title={post.title}
                      titleSize={19}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </PageSite>

      {/* ── Le renvoi vers le pôle média, et ce qu'on peut suivre ─────────────── */}
      <SiteBand>
        <div className="grid items-center gap-9 lg:grid-cols-2">
          <div>
            <SiteDisplay as="h2" lines={t('index.listenTitle', { returnObjects: true }) as string[]} size={34} />
            <p className="rv mt-3 max-w-[44ch] text-[15.5px] leading-[1.6] text-ink-2" style={{ ['--i' as string]: 1 }}>
              {t('index.listenBody')}
            </p>
            <Button
              href={path('/podcast-et-videos')}
              tone="transforme"
              size="sm"
              fullWidth={false}
              className="rv mt-4"
              style={{ ['--i' as string]: 2 }}
            >
              {t('index.listenCta')}
            </Button>
          </div>

          <GlassPanel level="flat" padding={22} className="rv" style={{ ['--i' as string]: 2 }}>
            <SiteEyebrow style={{ margin: 0 }}>{t('index.followTitle')}</SiteEyebrow>
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border-hair)] py-[11px]">
              <b className="text-[14px]">{t('index.rss')}</b>
              <Button href={`${SITE_URL}/rss.xml`} tone="quiet" size="sm" fullWidth={false}>{t('index.rssAction')}</Button>
            </div>
            <div className="flex items-center justify-between gap-3 py-[11px]">
              <b className="text-[14px]">{t('index.alert')}</b>
              <Button href={path('/inscription')} tone="quiet" size="sm" fullWidth={false}>{t('index.alertAction')}</Button>
            </div>
            {/* La contrainte, nommée. Ne jamais promettre un canal que le produit n'a pas. */}
            <p className="mt-2 mb-0 text-small leading-[1.5] text-ink-2">{t('index.noEmail')}</p>
          </GlassPanel>
        </div>
      </SiteBand>
    </DsNavHost>
  );
}
