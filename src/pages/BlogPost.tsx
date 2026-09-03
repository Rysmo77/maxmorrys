import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Avatar, Breadcrumb, Button, GlassPanel, Icon, Num, ReadingBar, Skeleton, TerritoryCard, TranslationNotice } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { LinkedInIcon, XIcon } from '../components/shared/SocialIcons';
import { CoverImage, PageSite, SiteBand, SiteDisplay, SiteEyebrow, useActiveHeading, useReadingProgress } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useTranslatedText } from '../hooks/useTranslatedContent';
import { getPostBySlug, getPublishedFormations, getPublishedPosts, incrementBlogViews } from '../lib/firestore';
import { formationMiseEnAvant } from '../types/formationRelease';
import { markdownToHtml, withArticleToc, type ArticleHeading } from '../lib/markdown';
import { queryClient, queryKeys } from '../lib/queryClient';
import { useFormat } from '../hooks/useFormat';
import { categoryToPole } from '../lib/blogCategories';
import { HOUSE_AUTHOR, isHouseAuthor, portrait } from '../lib/author';
import type { BlogPost as BlogPostType } from '../types';
import { trackViewItem, trackShare } from '../lib/tracking';
import { useContentEngagement } from '../hooks/useContentEngagement';
import SEOHead from '../components/seo/SEOHead';
import { useLanguage } from '../contexts/LanguageContext';
import { contentPath } from '../lib/contentPath';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../components/seo/seo-config';



/**
 * LE SOMMAIRE — une seule écriture, deux emplacements.
 *
 * Il vit dans la colonne de droite au-delà de 1080 px, et repliable AU-DESSUS du corps
 * en dessous : la grille du kit passe à une colonne à cette rupture, et l'`aside`
 * atterrissait alors APRÈS l'article entier. Un sommaire qui résume ce qu'on vient de
 * lire ne sert à rien — sur un portable de 1024 px, une tablette ou un téléphone,
 * c'est-à-dire sur la majorité des visites, il n'a jamais rendu son service.
 *
 * Les entrées restent de vraies ancres `<a href="#…">` : le navigateur pose l'adresse,
 * empile l'historique, défile en douceur (ou pas, sous `prefers-reduced-motion`) et
 * déplace le focus, puisque `withArticleToc` rend les titres focalisables. Aucun
 * gestionnaire de clic : rien à désynchroniser.
 */
function Sommaire({ headings, actif }: { headings: ArticleHeading[]; actif: string | null }) {
  return (
    <div className="grid text-[13.5px] leading-[1.9]">
      {headings.map((h) => {
        const courant = h.id === actif;
        return (
          <a
            key={h.id}
            href={`#${h.id}`}
            aria-current={courant ? 'location' : undefined}
            /* LE REPÈRE EST UN FILET, PAS SEULEMENT UNE GRAISSE. Le kit dessine un
               sommaire STATIQUE, où la graisse suffit à marquer la première entrée. Ici
               il suit la lecture, et un simple passage de gras à gris se voit mal en
               vision périphérique — le panneau avait l'air figé. Le filet reprend la
               teinte du territoire ; il ne porte pas de texte, donc l'orange plein y est
               permis (AD-18 ne vise que l'encre). */
            className={`block border-l-2 no-underline transition-colors duration-ui hover:text-ink ${
              courant ? 'border-informe font-semibold text-ink' : 'border-transparent text-ink-2'
            } ${h.level === 3 ? 'pl-6' : 'pl-3'}`}
          >
            {h.text}
          </a>
        );
      })}
    </div>
  );
}

export default function BlogPost() {
  const { t } = useTranslation('blog');
  const { formatDate } = useFormat();
  const { slug } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [post, setPost] = useState<BlogPostType | null | undefined>(undefined);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);

  useEffect(() => {
    if (!slug) return;
    getPostBySlug(slug, language).then((data) => {
      setPost(data);
      if (data) {
        trackViewItem({
          id: data.id,
          name: data.title,
          category: data.category,
          content_type: 'article',
        });
        const viewKey = `blog-viewed-${data.id}`;
        if (typeof window !== 'undefined' && !sessionStorage.getItem(viewKey)) {
          incrementBlogViews(data.id)
            .then(() => sessionStorage.setItem(viewKey, '1'))
            .catch(() => null);
        }
        queryClient
          .fetchQuery({ queryKey: queryKeys.blogPosts, queryFn: () => getPublishedPosts() })
          .then((all) => {
            setRelatedPosts(all.filter((p) => p.id !== data.id && p.category === data.category).slice(0, 3));
          })
          .catch(() => null);
      }
    }).catch(() => setPost(null));
  }, [slug, language]);

  useContentEngagement({
    contentId: post?.id,
    type: 'article',
    slug: post?.slug ?? '',
    title: post?.title ?? '',
    category: post?.category ?? 'général',
  });

  // Traduction du contenu dynamique (FR -> EN selon langue active). Hooks au top-level,
  // avant les retours anticipés, pour respecter les règles des hooks.
  const translatedTitle = useTranslatedText(post?.title);
  const translatedExcerpt = useTranslatedText(post?.excerpt);
  const translatedPole = useTranslatedText(post ? categoryToPole(post.category) : '');
  const translatedBody = useTranslatedText(post?.content);
  const seoTitle = useTranslatedText(post?.metaTitle || post?.title);
  const seoDescription = useTranslatedText(post?.metaDescription) || translatedExcerpt;

  /*
   * Le corps est rendu UNE FOIS, et il rend son sommaire avec lui. Deux appels séparés — un
   * pour le HTML, un pour les titres — rejoueraient l'assainissement DOMPurify à chaque
   * rendu et pourraient, le jour où l'un des deux change, produire des ancres qui ne
   * correspondent plus aux titres du corps.
   */
  const corps = useMemo(
    () => withArticleToc(markdownToHtml(translatedBody || post?.content || '')),
    [translatedBody, post?.content],
  );

  /* La formation vers laquelle la passerelle envoie : la première publiée. Le modèle ne porte
     aucun lien entre un article et un cours ; choisir « la plus récente » serait une règle
     inventée, « la première du catalogue » est celle qu'un catalogue à une entrée impose. */
  const { data: formations = [] } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: () => getPublishedFormations(),
  });
  /* ⚠️ Une formation ouverte d'abord. La passerelle propose d'ACHETER : elle ne peut pas
     pointer une annonce tant qu'il existe quelque chose de disponible. */
  const cible = formationMiseEnAvant(formations);
  const cibleLecons = (cible?.modules ?? []).reduce((n: number, m) => n + (m.lessons?.length ?? 0), 0);

  const path = useLocalizedPath();

  /* LA BARRE MESURE L'ARTICLE, PAS LE DOCUMENT. Le pied de page et la bande « À lire
     ensuite » comptaient dans la hauteur : la barre n'atteignait 100 % que bien après la
     dernière phrase, donc elle annonçait qu'il restait à LIRE là où il ne restait qu'à
     faire défiler. */
  const articleRef = useRef<HTMLElement>(null);
  const progress = useReadingProgress(articleRef);

  /* Le repère du sommaire était `i === 0` — la PREMIÈRE entrée, en dur, quelle que soit
     la position de lecture. On cliquait la quatrième, la page défilait, et le gras ne
     bougeait pas : un panneau dont rien ne répond au défilement se lit « il ne marche pas ». */
  const ancres = useMemo(() => corps.headings.map((h) => h.id), [corps.headings]);
  const titreActif = useActiveHeading(ancres);

  /*
   * Le chargement est un SQUELETTE À LA FORME du contenu attendu, pour que rien ne saute
   * quand il arrive. Jamais un rond qui tourne : il ne dit ni ce qui se passe, ni combien de
   * temps. La page portait un `Loader2 animate-spin` centré ; il n'annonçait rien.
   */
  if (post === undefined) {
    return (
      <PageSite>
        {/* Le squelette prend LE MÊME gabarit que la page rendue : quatre pistes, mêmes
            cales. Une forme d'attente qui ne tombe pas là où le contenu tombera fait
            sauter la page au moment précis où elle devrait se poser. */}
        <div className="grid items-start gap-x-11 gap-y-12 wide:grid-cols-[1fr_minmax(0,var(--measure-prose))_300px_1fr]">
          <div className="hidden wide:block" aria-hidden="true" />
          <div className="grid gap-4">
            <Skeleton width={220} height={12} label={t('post.loading')} />
            <Skeleton height={44} width="82%" />
            <Skeleton height={44} width="58%" />
            <Skeleton height={40} radius="var(--r-m)" style={{ marginTop: '12px' }} />
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={14} width={i % 3 === 2 ? '72%' : '100%'} />)}
          </div>
          <Skeleton height={220} radius="var(--r-l)" />
          <div className="hidden wide:block" aria-hidden="true" />
        </div>
      </PageSite>
    );
  }

  if (!post) {
    return (
      <PageSite>
        <SiteDisplay lines={[t('post.notFoundTitle')]} size={34} />
        <p className="mt-4">
          <Button href={path('/blog')} tone="quiet" size="sm" fullWidth={false}>{t('post.notFoundLink')}</Button>
        </p>
      </PageSite>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackShare('copy_link', 'article', post.id);
  };

  /*
   * Navigation SPA pour les liens internes insérés dans le contenu HTML.
   *
   * LES GARDES DE MODIFICATEUR NE SONT PAS DÉCORATIVES. `DsNavHost` les pose
   * correctement (`DsNavHost.tsx:38-39`), mais ce gestionnaire-ci est plus bas dans
   * l'arbre : il s'exécute AVANT et marquait l'événement traité. Résultat, un ⌘-clic,
   * un ctrl-clic ou un clic milieu sur un lien interne d'article n'ouvrait pas de
   * nouvel onglet — il naviguait dans l'onglet courant, en perdant l'article.
   *
   * L'ancre de même page (`#section`) est laissée au navigateur, comme dans `DsNavHost` :
   * c'est le sommaire, et le routeur n'a rien à en faire.
   */
  const handleContentClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor || anchor.hasAttribute('download')) return;
    if (anchor.target && anchor.target !== '_self') return;

    const href = anchor.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      navigate(href);
    }
  };

  /* La signature affichée ET indexée. Une seule expression pour les deux, sinon elles
     divergent — c'est exactement ce qui s'était produit avec le nom écrit en dur. */
  const postAuthor = post.author || HOUSE_AUTHOR;

  const shareUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : `${SITE_URL}/blog/${post.slug}`);
  const shareBtn =
    'w-10 h-10 rounded-m border border-[color:var(--line)] flex items-center justify-center text-ink-2 transition';

  return (
    <DsNavHost>
      <SEOHead title={seoTitle} description={seoDescription} ogImage={post.coverImage || DEFAULT_OG_IMAGE} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt ?? post.publishedAt,
        url: `${SITE_URL}${contentPath('blog', post, language)}`,
        /*
          L'AUTEUR EST LU, ICI AUSSI. Le nom était écrit en dur alors que l'écran, lui, lit
          déjà `post.author` : les deux se contredisaient dès qu'un article était signé par
          quelqu'un d'autre — le lecteur voyait un nom, le moteur en indexait un autre.
          Le portrait ne s'attache QU'À la signature de la maison : une photo de visage sur
          le mauvais auteur n'est pas une coquille, c'est une attribution fausse.
        */
        author: {
          '@type': 'Person',
          name: postAuthor,
          ...(isHouseAuthor(post.author) ? { image: `${SITE_URL}${portrait.avatar}` } : {}),
        },
        publisher: { '@type': 'Organization', name: SITE_NAME },
      }} />

      {/*
        LA BARRE DE LECTURE. C'est la seule animation de `width` du produit, et l'exception
        est écrite dans le système : bornée à un élément de 3 px de haut, sans enfant. Elle
        porte `prog-fill`, le nom sous lequel le vérificateur la reconnaît.
      */}
      <ReadingBar value={progress} label={translatedTitle || post.title} />

      <PageSite>
        {/*
          LA GRILLE DE LECTURE — le gabarit du kit, celui qu'il livre et que personne ne
          posait : `1fr minmax(0, --measure-prose) 300px 1fr`, gouttière 44 px
          (`brand/breakpoints.css` § `.mm-article-grid`).

          CE QU'IL CHANGE. La page était en `1fr 300px` : la prose garde ses 68 caractères
          — la seule règle de mise en page sans exception du produit — mais son RAIL en
          faisait 850, donc trois cents et quelques pixels de vide s'ouvraient entre la
          dernière lettre et le sommaire, qui partait se coller au bord droit. Les quatre
          pistes rendent ce vide aux DEUX marges : la colonne de lecture se centre, et le
          sommaire revient à côté du texte qu'il résume.

          Le fil passe dans la colonne de lecture, où le kit le met lui aussi
          (`ui_kits/responsive/Responsive.js:155`) : laissé à la gouttière de page, il
          n'aurait plus été aligné sur rien.

          La classe du kit n'est pas posée telle quelle : elle est déclarée sans requête
          média et donnerait quatre colonnes à 375 px. On reprend ses pistes à `wide:`,
          et les deux cales n'existent pas en dessous.
        */}
        <div className="mt-4 grid items-start gap-x-11 gap-y-12 wide:grid-cols-[1fr_minmax(0,var(--measure-prose))_300px_1fr]">
          <div className="hidden wide:block" aria-hidden="true" />

          <article ref={articleRef} className="min-w-0">
            <Breadcrumb
              label={t('index.eyebrow')}
              /* TROIS NIVEAUX, comme le kit (`PagesCore.js:139`) : le VERBE du territoire, puis
                 la section, puis le sujet de l'article. Le niveau du milieu manquait — « Je
                 t'informe › SEO local » sautait l'étage qui dit où l'on est réellement, et le
                 premier lien renvoyait au blog sous un libellé qui ne le nomme pas. */
              items={[
                { label: t('index.eyebrow'), href: path('/blog') },
                { label: t('article.crumbBlog'), href: path('/blog') },
                { label: translatedPole || categoryToPole(post.category) },
              ]}
            />
            <SiteDisplay wrap lines={[translatedTitle || post.title]} size={46} style={{ marginTop: '12px', maxWidth: '20ch' }} />

            <div className="rv mt-[18px] flex max-w-prose flex-wrap items-center justify-between gap-5" style={{ ['--i' as string]: 3 }}>
              <div className="flex items-center gap-3">
                {/*
                  LE VISAGE NE SUIT QUE LA SIGNATURE DE LA MAISON. La pastille d'initiales
                  n'était pas un fond d'attente — elle était l'état livré, faute de
                  photographie au dépôt. Il y en a une depuis le 01/09/2026, et elle est
                  cadrée pour ce rond : `isHouseAuthor` décide, parce qu'un `<img>` posé en
                  dur mettrait le visage de Max-Morrys sur l'article d'un invité.
                  Le repli d'initiales reste, et redevient le rendu normal ce jour-là.
                */}
                {isHouseAuthor(post.author) ? (
                  <img
                    src={portrait.avatar}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-10 flex-none rounded-full object-cover"
                  />
                ) : (
                  <Avatar initials={postAuthor.slice(0, 1).toUpperCase()} size={40} />
                )}
                <div>
                  {/* L'auteur est LU, pas écrit en dur : le champ existe sur le modèle et
                      était ignoré, donc un article signé par quelqu'un d'autre affichait
                      quand même « Max-Morrys ». La chaîne reste le repli. */}
                  <p className="m-0 text-[13.5px] font-semibold text-ink">{postAuthor}</p>
                  {/* `readTime` est un NOMBRE de minutes, et il s'affichait brut :
                      « 12 août 2026 · 8 ». La clé `post.readTime` portait l'unité depuis
                      le début, sans qu'aucun écran ne la lise. */}
                  <p className="mm-num m-0 text-[11.5px] text-ink-2">
                    {formatDate(post.publishedAt)}
                    {post.readTime ? ` · ${t('post.readTime', { count: post.readTime })}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <a className={shareBtn} href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                   target="_blank" rel="noreferrer" aria-label="LinkedIn"
                   onClick={() => trackShare('linkedin', 'article', post.id)}>
                  <LinkedInIcon className="h-4 w-4" />
                </a>
                <a className={shareBtn} href={`https://twitter.com/intent/tweet?url=${shareUrl}`}
                   target="_blank" rel="noreferrer" aria-label="X"
                   onClick={() => trackShare('twitter', 'article', post.id)}>
                  <XIcon className="h-4 w-4" />
                </a>
                <button type="button" className={shareBtn} onClick={handleCopy}
                        aria-label={copied ? t('article.copied') : t('article.copy')}>
                  {copied ? <Icon name="check" size={16} /> : <Icon name="copy" size={16} />}
                </button>
              </div>
            </div>

            {/*
              LE BANDEAU DE TRADUCTION, obligatoire en tête de tout article anglais — jamais
              en pied, où un avertissement n'avertit plus. La traduction est générée au
              pré-rendu et mise en cache : une correction du français n'atteint cette page
              qu'à l'expiration du cache, et il n'y a pas d'invalidation manuelle.
            */}
            {language === 'en' && (
              <TranslationNotice
                date={formatDate(post.updatedAt ?? post.publishedAt)}
                href={`/blog/${post.slug}`}
                originalLabel={t('article.translatedOriginal')}
                style={{ marginTop: '18px', maxWidth: 'var(--measure-prose)' }}
              />
            )}

            {/*
              LA VIGNETTE DE L'ARTICLE.

              `coverImage` existait depuis toujours sur le modèle et ne servait QUE d'image
              de partage (`ogImage`, plus haut) : elle s'affichait sur Facebook et sur
              WhatsApp, jamais sur la page qu'elle illustre.

              Elle se pose ICI — après la signature, avant le corps — et non au-dessus du
              titre : le titre d'affichage est ce qui doit arriver en premier, et une image
              posée devant lui repousserait la première phrase hors du premier écran.

              Elle tient la mesure de lecture, comme le reste de la colonne : une vignette
              plus large que le texte qu'elle illustre casse l'alignement de la page.
            */}
            {post.coverImage && (
              <CoverImage
                src={post.coverImage}
                priority
                className="rv mt-6 max-w-[var(--measure-prose)]"
                style={{ ['--i' as string]: 4 } as React.CSSProperties}
              />
            )}

            {/*
              LE SOMMAIRE MOBILE — replié, au-dessus du corps.

              `<details>` natif plutôt qu'un état React : il s'ouvre sans JavaScript, la
              recherche du navigateur (⌘F) trouve son contenu même fermé, et il ne coûte
              rien à charger. `wide:hidden` parce que la colonne de droite le reprend dès
              que la grille passe à deux colonnes.
            */}
            {corps.headings.length > 1 && (
              <details className="rv group mt-6 rounded-m border border-[color:var(--line)] px-4 py-3 wide:hidden" style={{ ['--i' as string]: 4 }}>
                {/* `list-none` seul ne suffit pas : WebKit dessine son propre marqueur, qu'il
                    faut nommer pour le retirer. Le chevron du système le remplace, et il
                    tourne à l'ouverture — c'est ce qui dit que le bloc se replie. */}
                <summary className="mm-eyebrow flex cursor-pointer list-none items-center justify-between gap-3 text-ink [&::-webkit-details-marker]:hidden">
                  {t('article.tocTitle')}
                  <Icon name="chevron" size={16} className="transition-transform duration-ui group-open:rotate-180" />
                </summary>
                <div className="mt-3">
                  <Sommaire headings={corps.headings} actif={titreActif} />
                </div>
              </details>
            )}

            <div
              className="rv mm-prose prose-article mt-6"
              style={{ ['--i' as string]: 4 }}
              onClick={handleContentClick}
              dangerouslySetInnerHTML={{ __html: corps.html }}
            />

            {/*
              LES SUJETS DE L'ARTICLE.

              Le champ `tags` est saisi dans l'admin (`AdminArticles.tsx:211`), écrit en
              base, indexé chez Firestore (`tags CONTAINS + publishedAt`) et chez Typesense,
              et émis en `keywords` par le pré-rendu — mais AUCUNE page publique ne
              l'affichait ni ne filtrait dessus. On les rend, et chacun mène à l'index filtré.

              Pas `Tag` de `@ds` : ses quatre tons sont SÉMANTIQUES (`ok`/`warn`/`stop`/
              `neutral`) et disent un état. Un sujet n'est pas un état, et ce sont des LIENS.
            */}
            {post.tags?.length > 0 && (
              <div className="rv mt-8 max-w-[var(--measure-prose)]" style={{ ['--i' as string]: 5 }}>
                <SiteEyebrow style={{ margin: 0 }}>{t('article.tagsTitle')}</SiteEyebrow>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <a
                      key={tag}
                      href={`${path('/blog')}?tag=${encodeURIComponent(tag)}`}
                      className="rounded-pill border border-[color:var(--border-hair)] bg-[color:var(--fill-tag)] px-3 py-1.5 text-meta-2 text-ink-2 no-underline transition-colors duration-ui hover:text-ink"
                    >
                      {tag}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* La colonne latérale colle sous le chrome, pas sous le haut de la fenêtre. */}
          {/* `wide:` et non `wide:` : la colonne devient collante à la rupture où la grille
              passe à deux colonnes (1080), pas cinquante-six pixels plus tôt. */}
          <aside className="grid min-w-0 gap-[14px] wide:sticky wide:top-[calc(var(--header-h)+1rem)]">
            {/*
              LE SOMMAIRE, PREMIER PANNEAU DE LA COLONNE — l'ordre du kit
              (`PagesCore.js:166-174`) : on situe la lecture avant de proposer d'en sortir.
              La clé `article.tocTitle` vivait dans les deux catalogues sans qu'aucun écran ne
              la lise, et la colonne restait vide sur toute la hauteur d'un article long.

              Il n'apparaît qu'à partir de DEUX titres : un sommaire d'une seule entrée ne
              situe rien, il répète le titre de l'article et prend la place de la passerelle.
            */}
            {corps.headings.length > 1 && (
              <nav
                aria-label={t('article.tocTitle')}
                /* `hidden wide:block` : la colonne n'existe qu'à partir de 1080 px, et le
                   sommaire replié au-dessus du corps prend le relais en dessous. Deux
                   copies visibles à la fois donneraient deux `nav` de même nom au lecteur
                   d'écran, et deux ancres pour chaque section. */
                className="hidden wide:block"
              >
                <GlassPanel level="flat" padding={20} className="rv" style={{ ['--i' as string]: 5 }}>
                  <SiteEyebrow style={{ margin: 0 }}>{t('article.tocTitle')}</SiteEyebrow>
                  <div className="mt-3">
                    <Sommaire headings={corps.headings} actif={titreActif} />
                  </div>
                </GlassPanel>
              </nav>
            )}

            {/*
              LA PASSERELLE NOMME LA FORMATION, elle ne renvoie plus à l'index.

              Le kit compose ce panneau en trois temps (`PagesCore.js:175-178`) : un sourcil
              « La méthode complète », le TITRE du produit en affichage 18 px, puis son compte
              de leçons. La production affichait un texte générique et un bouton vers
              `/formations` : la personne quittait l'article sans savoir vers quoi.

              Quand aucune formation n'est publiée, on retombe sur l'ancien libellé et sur
              l'index — un titre de produit inventé serait pire qu'un lien générique.
            */}
            <GlassPanel level="hero" padding={22} className="rv" style={{ ['--i' as string]: 6 }}>
              <SiteEyebrow style={{ marginBottom: '8px' }}>
                {cible ? t('article.gateEyebrow') : t('article.gateTitle')}
              </SiteEyebrow>
              {cible ? (
                <>
                  <p className="m-0 font-display text-[18px] font-black tracking-[-.03em] text-ink">
                    {cible.title}
                  </p>
                  <p className="mt-2 mb-4 text-[13.5px] leading-[1.5] text-ink-2">
                    <Num value={cibleLecons} source="db" asOf={new Date()} showAsOf={false} />{' '}
                    {t('article.gateLessons', { count: cibleLecons })}
                  </p>
                </>
              ) : (
                <p className="m-0 mb-4 text-[14px] leading-[1.55] text-ink-2">{t('article.gateBody')}</p>
              )}
              <Button href={path(cible ? `/formations/${cible.slug}` : '/formations')} tone="forme">
                {t('article.gateCta')}
              </Button>
              {/* La sortie honnête : on ne ferme pas la porte du gratuit derrière le payant. */}
              <p className="mt-3 mb-0 text-center text-small leading-[1.5] text-ink-2">{t('article.gateAlt')}</p>
            </GlassPanel>
          </aside>

          <div className="hidden wide:block" aria-hidden="true" />
        </div>
      </PageSite>

      {relatedPosts.length > 0 && (
        <SiteBand>
          <SiteDisplay as="h2" lines={t('article.nextTitle', { returnObjects: true }) as string[]} size={34} />
          <div className="mt-5 grid gap-4 stack:grid-cols-3">
            {relatedPosts.slice(0, 3).map((related, i) => (
              <div key={related.id} className="rv" style={{ ['--i' as string]: i + 1 }}>
                <TerritoryCard
                  layout="plain"
                  territory={(['informe', 'rose', 'forme'] as const)[i % 3]}
                  href={path(`/blog/${related.slug}`)}
                  padding={22}
                  style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                  meta={`${formatDate(related.publishedAt)}${related.readTime ? ` · ${t('post.readTime', { count: related.readTime })}` : ''}`}
                  /* Le titre occupe DEUX lignes, toujours. `TerritoryCard` pose
                      `line-height: 1.08` sous 26 px : sans plancher, un titre d'une
                      ligne remontait la vignette et l'extrait de la carte voisine, et
                      la grille prenait trois hauteurs différentes. `line-clamp` borne
                      aussi le haut — un titre de quatre lignes déformait la rangée. */
                      title={<span className="line-clamp-2 min-h-[2.16em]">{related.title}</span>}
                  titleSize={19}
                >
                  {/* Même traitement que la grille de `/blog` : la vignette confirme le
                      titre au lieu de le précéder, et elle va au BORD de la carte. Gardée
                      avec le rembourrage tout autour, elle se lisait comme un autocollant
                      posé dessus — deux rectangles, deux rayons, un liseré de dégradé entre
                      les deux. En bas de page, donc toujours en chargement différé. */}
                  {related.coverImage && (
                    <div className="-mx-[22px] -mb-[22px] mt-4 overflow-hidden rounded-b-[23px]">
                      <CoverImage src={related.coverImage} radius="none" />
                    </div>
                  )}
                </TerritoryCard>
              </div>
            ))}
          </div>
        </SiteBand>
      )}

    </DsNavHost>
  );
}
