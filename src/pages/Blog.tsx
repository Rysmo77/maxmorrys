import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, ChipRow, EmptyState, GlassPanel, Icon, SearchPill, Skeleton, TerritoryCard } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { CoverImage, PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
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
 * DEUX DÉCISIONS DU KIT, portées ici — et une TROISIÈME, LEVÉE :
 *
 * 1. ⚠️ « AUCUNE VIGNETTE PHOTO » NE TIENT PLUS. Le kit l'écrit — « la couleur de la carte dit
 *    le type de contenu, et ne coûte rien à charger » — et l'argument est le coût des données :
 *    sur le marché visé, le panier de 2 Go vaut 4,2 % du revenu national brut par habitant.
 *    Le porteur a tranché le 01/09/2026 : les vignettes s'affichent, ici comme sur l'article.
 *
 *    CE QUE ÇA COÛTE, MESURÉ le même jour sur les 40 articles publiés : chaque `coverImage`
 *    pèse ~750 Ko — des JPEG 1408×768 nommés `.png`, servis tels quels depuis un bucket R2
 *    public. Le budget de premier écran du kit est de 900 Ko au total. `CoverImage` fait ce
 *    qu'un composant peut faire (chargement différé hors écran, boîte réservée, une seule
 *    image en priorité), mais AUCUN attribut ne réduit ces octets : le redimensionnement
 *    d'images Cloudflare répond 404 sur la zone. La correction est en amont — conversion en
 *    AVIF/WebP au téléversement, ou activation du redimensionnement.
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
/** Combien d'articles la grille rend d'un coup. Le bouton en révèle autant à chaque appui. */
const PAR_PAGE = 12;


export default function Blog() {
  const { t } = useTranslation('blog');
  const path = useLocalizedPath();
  const { formatDate } = useFormat();

  /*
   * L'ÉTAT DU FILTRE VIT DANS L'ADRESSE, PAS DANS `useState`.
   *
   * Il était local : une vue filtrée ne se partageait pas, le rechargement la perdait, et
   * le retour arrière depuis un article ramenait sur la liste entière. C'est aussi ce qui
   * permet aux tags de la page article de pointer ici — `?tag=` est une adresse, pas un clic.
   */
  const [params, setParams] = useSearchParams();
  const pole = params.get('pole') ?? '';
  const tag = params.get('tag') ?? '';

  /*
   * LA RECHERCHE FILTRE TOUT DE SUITE, ET L'ADRESSE SUIT AVEC RETARD.
   *
   * Écrire `?q=` à chaque frappe fait passer une navigation du routeur par caractère —
   * donc un rendu complet de la route par caractère, sur des appareils à 2 Go. Le champ
   * garde donc son état local, qui filtre sans latence, et l'adresse est un MIROIR écrit
   * une fois la frappe retombée. Elle reste partageable ; elle n'est simplement pas
   * réécrite trente fois pour un mot.
   */
  const [search, setSearch] = useState(() => params.get('q') ?? '');

  const setParam = (cle: string, valeur: string) => {
    const suivant = new URLSearchParams(params);
    if (valeur) suivant.set(cle, valeur);
    else suivant.delete(cle);
    // `replace` : affiner un filtre n'est pas une étape de navigation. Sans ça, revenir
    // en arrière depuis un article oblige à défaire une frappe à la fois.
    setParams(suivant, { replace: true });
    setVisibles(PAR_PAGE);
  };

  const [visibles, setVisibles] = useState(PAR_PAGE);

  useEffect(() => {
    const minuteur = setTimeout(() => {
      setParams(
        (courant) => {
          const suivant = new URLSearchParams(courant);
          if (search.trim()) suivant.set('q', search);
          else suivant.delete('q');
          return suivant;
        },
        { replace: true },
      );
      if (search.trim().length > 2) trackSearch(search.trim());
    }, 350);
    return () => clearTimeout(minuteur);
    // `setParams` est stable, et le relire ferait repartir le minuteur à chaque rendu.
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: posts = [], isLoading, isError, refetch } = useQuery({
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

  /*
   * LE LIBELLÉ N'EST PLUS L'ÉTAT.
   *
   * `ChipRow` rend des chaînes (« SEO & Visibilité · 19 ») et la sélection était
   * reconstruite par `option.split(' · ')[0]`, avec un `startsWith(t('index.filterAll'))`
   * pour reconnaître « Tout ». Deux hypothèses fragiles : qu'aucun libellé de pôle ne
   * contienne «  ·  », et qu'aucune traduction ne fasse commencer un pôle par le mot
   * « Tout ». On garde donc la table dans les deux sens, et on ne redécoupe jamais rien.
   */
  const chips = useMemo(() => {
    const tout = `${t('index.filterAll')} · ${posts.length}`;
    const table = new Map<string, string>([[tout, '']]);
    for (const [nom, n] of poles) table.set(`${nom} · ${n}`, nom);
    return { options: [...table.keys()], versPole: table, versLibelle: new Map([...table].map(([l, p]) => [p, l])) };
  }, [poles, posts.length, t]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tagBas = tag.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesPole = !pole || categoryToPole(post.category) === pole;
      const matchesTag = !tagBas || (post.tags ?? []).some((x) => x.toLowerCase() === tagBas);
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt?.toLowerCase().includes(q) ||
        (post.tags ?? []).some((x) => x.toLowerCase().includes(q));
      return matchesPole && matchesTag && matchesSearch;
    });
  }, [posts, pole, tag, search]);

  /* « À la une » ne se dit que sur la liste ENTIÈRE. Sous un filtre ou une recherche, la
     première carte est le premier RÉSULTAT — la mettre en avant sous ce marqueur
     annoncerait une mise en avant éditoriale qui n'a pas eu lieu. */
  const filtreActif = Boolean(pole || tag || search.trim());
  const [featured, ...rest] = filtered;
  const visible = rest.slice(0, visibles);
  const restants = rest.length - visible.length;

  const viderFiltres = () => {
    setParams(new URLSearchParams(), { replace: true });
    setVisibles(PAR_PAGE);
  };

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
          /* Le kit pose 8 px sous le sourcil (`pages-core.jsx` § Blog). */
          style={{ marginTop: '8px' }}
        />

        <p className="rv mt-[14px] max-w-[52ch] text-[16px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 4 }}>
          {t('index.lede')}
        </p>

        <div className="rv mt-6 flex flex-wrap items-center justify-between gap-5" style={{ ['--i' as string]: 5 }}>
          <div className="min-w-0 flex-1 max-w-[640px]">
            <ChipRow
              label={t('index.eyebrow')}
              options={chips.options}
              value={chips.versLibelle.get(pole) ?? chips.options[0]}
              onChange={(option) => setParam('pole', chips.versPole.get(option) ?? '')}
            />
          </div>
          <div className="w-full sm:w-[300px] sm:flex-none">
            {/* LE LIBELLÉ REDEVIENT VISIBLE. Le kit le rend en deux temps DANS la pilule —
                « Cherche » en gras, « une question » en gris (`PagesUtiles.js:24`) : c'est ce qui
                donne au champ sa silhouette et dit ce qu'on remplit avant d'y toucher. `labelHidden`
                le réservait au lecteur d'écran, et il ne restait qu'un placeholder — qui disparaît,
                lui, à la première frappe. */}
            <SearchPill
              height={48}
              label={t('index.searchLabel')}
              hint={t('index.searchHint')}
              icon={<Icon name="search" size={16} strokeWidth={2.4} />}
              value={search}
              onChange={(v) => { setSearch(v); setVisibles(PAR_PAGE); }}
            />
          </div>
        </div>

        {/* LE FILTRE PAR SUJET SE NOMME. Il arrive par l'adresse, depuis un tag d'article :
            sans bandeau, on tomberait sur une liste courte sans savoir pourquoi. */}
        {tag && (
          <div className="rv mt-4 flex flex-wrap items-center gap-3" style={{ ['--i' as string]: 5 }}>
            <span className="rounded-pill border border-[color:var(--border-hair)] bg-[color:var(--fill-tag)] px-3 py-1.5 text-meta-2 text-ink">
              {t('index.tagFilter', { tag })}
            </span>
            <Button tone="quiet" size="sm" fullWidth={false} onClick={() => setParam('tag', '')}>
              {t('index.clearFilter')}
            </Button>
          </div>
        )}

        {isLoading ? (
          /* Un squelette À LA FORME du contenu attendu, pour que rien ne saute quand il
             arrive. Jamais un rond qui tourne : il ne dit ni quoi, ni combien de temps. */
          <div className="mt-[22px] grid gap-4">
            <Skeleton height={210} radius="var(--r-l)" label={t('index.eyebrow')} />
            <div className="grid gap-[14px] stack:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} height={140} radius="var(--r-l)" />)}
            </div>
          </div>
        ) : isError ? (
          /* `isError` n'était jamais lu : une panne réseau rendait exactement le même
             écran qu'un catalogue vide, et la personne concluait qu'il n'y a pas
             d'articles. Les deux clés existaient depuis le début sans lecteur. */
          <EmptyState
            style={{ marginTop: '22px' }}
            glyph={<Icon name="alert-circle" size={24} />}
            title={t('index.errorTitle')}
            body={t('states.loadError')}
            action={
              <Button tone="primary" fullWidth={false} onClick={() => refetch()}>
                {t('states.retry')}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            style={{ marginTop: '22px' }}
            glyph={<Icon name="search" size={24} />}
            title={t('index.emptyTitle')}
            body={t('index.empty')}
            action={
              filtreActif ? (
                <Button tone="quiet" fullWidth={false} onClick={viderFiltres}>
                  {t('index.emptyAction')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {featured && (
              <div className="rv mt-[22px]" style={{ ['--i' as string]: 6 }}>
                <TerritoryCard
                  layout="plain"
                  territory="informe"
                  href={path(`/blog/${featured.slug}`)}
                  padding={30}
                  style={{ display: 'flex', flexDirection: 'column' }}
                  /* « À la une » ouvre la méta dans le kit (`PagesCore.js:97`) : c'est ce qui
                     dit POURQUOI cette carte est plus grande que les autres. Sans le marqueur,
                     la première carte n'est qu'une carte au format différent, sans raison. */
                  meta={[
                    filtreActif ? categoryToPole(featured.category) : t('index.featuredMarker'),
                    formatDate(featured.publishedAt),
                    featured.readTime ? t('post.readTime', { count: featured.readTime }) : '',
                  ].filter(Boolean).join(' · ')}
                  title={featured.title}
                  titleSize={32}
                  trailing={<Button tone="primary" size="sm" fullWidth={false}>{t('index.read')}</Button>}
                >
                  {/*
                    LA CARTE À LA UNE GARDE SON IMAGE DE CÔTÉ.

                    Les cartes de la grille la portent en pleine largeur ; celle-ci la met
                    à droite du texte. C'est ce qui continue de dire « celle-là n'est pas
                    comme les autres » maintenant que toutes en ont une — sans quoi la
                    carte à la une ne serait plus qu'une carte de la grille en plus grand.

                    C'est la SEULE de la page en chargement immédiat : elle est en haut,
                    donc elle est la mesure de LCP. Les autres restent en `lazy`.
                  */}
                  <div className={featured.coverImage ? 'mt-[11px] grid flex-1 gap-6 stack:grid-cols-[1fr_46%]' : ''}>
                    {featured.excerpt && (
                      <p className="m-0 min-w-0 max-w-[60ch] self-center text-[15px] leading-[1.55]" style={{ color: 'var(--card-ink-2)' }}>
                        {featured.excerpt}
                      </p>
                    )}
                    {featured.coverImage && (
                      /* La vignette rejoint le bord droit et le bord bas, et n'arrondit que
                         le coin qu'elle occupe. Le rembourrage de cette carte vaut 30. */
                      /* LE FOND PERDU CHANGE DE CÔTÉS AVEC LA COMPOSITION. En une seule
                         colonne, la vignette passe SOUS le texte : saigner du seul bord
                         droit la rendait bancale — bord gauche en retrait, bord droit à
                         fleur. Sous `stack` elle saigne des deux côtés et arrondit ses deux
                         coins bas ; au-delà, elle tient le flanc droit et n'en arrondit
                         qu'un. Le rayon passe par des classes, pas par le style en ligne :
                         un style en ligne ne connaît pas les points de rupture. */
                      <div className="-mx-[30px] -mb-[30px] mt-4 overflow-hidden rounded-b-[23px] stack:mx-0 stack:-mr-[30px] stack:mt-0 stack:rounded-bl-none">
                        <CoverImage src={featured.coverImage} priority fill radius="none" />
                      </div>
                    )}
                  </div>
                </TerritoryCard>
              </div>
            )}

            {visible.length > 0 && (
              <div className="mt-[14px] grid gap-[14px] stack:grid-cols-3">
                {visible.map((post, i) => (
                  <div key={post.id} className="rv" style={{ ['--i' as string]: 7 + (i % 3) }}>
                    <TerritoryCard
                      layout="plain"
                      /* TROIS teintes en rotation, pas quatre. Le kit cycle sur
                         `informe · rose · transforme` (`PagesCore.js:110`) : le bleu appartient
                         à « Je te forme », et une carte d'article qui le porte annonce une
                         formation. La quatrième entrée brouillait le seul repère de territoire
                         du produit, une carte sur quatre. */
                      territory={(['informe', 'rose', 'transforme'] as const)[i % 3]}
                      href={path(`/blog/${post.slug}`)}
                      padding={22}
                      /* LA CARTE REMPLIT SA RANGÉE. `TerritoryCard` est un bloc à hauteur de
                         contenu : dans une rangée dont la hauteur est fixée par la carte la
                         plus haute, les autres s'arrêtaient avant le bas et laissaient voir
                         la rangée sous leur fond — et la vignette à fond perdu ne touchait
                         plus rien. En colonne flexible à 100 %, le fond va jusqu'en bas.
                         `style` est appliqué en dernier par la primitive : c'est le point
                         d'extension prévu, pas un contournement. */
                      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                      /*
                        LE SOURCIL NE PORTE PLUS QUE LE SUJET.
                        Il empilait pôle · date · durée — trois données en monospace, sur deux
                        lignes dès que la carte se resserre, juste au-dessus du titre qu'elles
                        concurrençaient. Or elles ne servent pas au même moment : le SUJET
                        aide à choisir, la date et la durée qualifient un choix déjà fait.
                        Le sujet reste donc en tête ; les deux autres descendent en pied de
                        bloc, juste avant la vignette.
                      */
                      meta={categoryToPole(post.category)}
                      /* Le titre occupe DEUX lignes, toujours. `TerritoryCard` pose
                         `line-height: 1.08` sous 26 px : sans plancher, un titre d'une ligne
                         remontait la vignette et l'extrait de la carte voisine, et la rangée
                         prenait trois hauteurs différentes. `line-clamp` borne aussi le haut —
                         un titre de quatre lignes déformait la rangée. */
                      title={<span className="line-clamp-2 min-h-[2.16em]">{post.title}</span>}
                      titleSize={19}
                    >
                      {post.excerpt && (
                        <p className="m-0 mt-[9px] line-clamp-2 text-meta leading-[1.5]" style={{ color: 'var(--card-ink-2)' }}>
                          {post.excerpt}
                        </p>
                      )}
                      <p className="mm-num m-0 mt-3 text-small" style={{ color: 'var(--card-ink-2)' }}>
                        {formatDate(post.publishedAt)}
                        {post.readTime ? ` · ${t('post.readTime', { count: post.readTime })}` : ''}
                      </p>
                      {/*
                        LA VIGNETTE VA AU BORD.

                        Gardée avec le rembourrage de la carte tout autour, elle se lit comme
                        un autocollant collé dessus : deux rectangles concentriques, deux
                        rayons d'arrondi, et un liseré de dégradé qui n'appartient à aucun des
                        deux. À fond perdu, elle devient le PIED de la carte — un seul objet.

                        LE FOND PERDU PASSE PAR UN CONTENEUR, PAS PAR L'IMAGE. Une marge
                        négative posée sur l'image ne suffit pas : elle est à la fois élément
                        étiré et boîte à largeur explicite, et les deux mécanismes se
                        contredisent — le bord ne rejoignait jamais celui de la carte. Sur un
                        bloc en flux normal à largeur `auto`, une marge négative élargit la
                        boîte, point. Le conteneur porte l'arrondi et le `overflow: hidden`.

                        Les marges valent le rembourrage (22) ; le bord de 1 px de la carte
                        reste visible, ce qui garde son contour, et le rayon n'est repris que
                        sur les deux coins occupés, moins ce 1 px.
                      */}
                      {post.coverImage && (
                        <div className="-mx-[22px] -mb-[22px] mt-4 overflow-hidden rounded-b-[23px]">
                          <CoverImage src={post.coverImage} radius="none" />
                        </div>
                      )}
                    </TerritoryCard>
                  </div>
                ))}
              </div>
            )}

            {/*
              « VOIR PLUS » PLUTÔT QUE TOUT D'UN COUP.

              La page rendait les 50 articles rapportés : quarante-six cartes empilées, et
              rien d'autre à faire que défiler. Le bouton dit combien il en reste — un
              « voir plus » qui ne chiffre rien n'aide pas à décider si ça vaut la peine.

              Le compte affiché EST le nombre restant, dérivé de la liste. Pas un chiffre
              de façade : c'est la règle du produit, et elle vaut aussi pour un bouton.
            */}
            {restants > 0 && (
              <div className="mt-6 grid justify-items-center gap-2">
                <Button tone="quiet" fullWidth={false} onClick={() => setVisibles((n) => n + PAR_PAGE)}>
                  {t('index.moreCount', { count: restants })}
                </Button>
                <p className="mm-num m-0 text-small text-ink-2">
                  {t('index.shown', { shown: Math.min(filtered.length, visibles + 1), total: filtered.length })}
                </p>
              </div>
            )}
          </>
        )}
      </PageSite>

      {/* ── Le renvoi vers le pôle média, et ce qu'on peut suivre ─────────────── */}
      <SiteBand>
        <div className="grid items-center gap-9 wide:grid-cols-2">
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
