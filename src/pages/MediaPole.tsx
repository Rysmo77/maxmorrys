import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, GlassPanel, Icon, LessonRow, MediaCard, Num, Segmented, Skeleton, SubNav, Tag } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useTranslatedList } from '../hooks/useTranslatedContent';
import { useFormat } from '../hooks/useFormat';
import { getPublishedPodcasts, getPublishedVideos } from '../lib/firestore/content';
import { queryKeys } from '../lib/queryClient';
import { socialLinks } from '../lib/brand';
import { CLUB_PRICE_XOF } from '../lib/club/pricing';

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
  const { formatDate } = useFormat();
  const [filter, setFilter] = useState<Filter>('all');

  /* L'URL vient du module de marque, jamais réécrite ici : elle est déjà la source des
     profils sociaux du pied de page et des données structurées de la page à propos. */
  const youtubeUrl = socialLinks.find((l) => l.name === 'YouTube')?.url ?? '';

  /* Le tarif se cadre au mois — jamais l'annuel nu. Recalculé, jamais recopié. */
  const monthly = Math.round(CLUB_PRICE_XOF / 12);
  /* Le tarif est une constante de l'offre, pas une mesure : sa « date de relevé » est celle du
     module qui le porte. `showAsOf` reste à false — un prix n'affiche pas sa date à l'écran. */
  const asOf = new Date();

  /*
    `isLoading` EST LU, ce qu'il n'était pas.

    Les deux requêtes se déstructuraient en `data = []` sans jamais regarder leur état. Pendant
    la récupération, `items` était donc vide — et la page affichait « Rien n'est encore en ligne
    ici », l'état VIDE, à chaque arrivée. La page d'entrée du territoire violet annonçait un
    catalogue mort pendant tout le temps du chargement, sur les réseaux où il dure le plus
    longtemps. Un squelette de la forme attendue le dit correctement : ça arrive.
  */
  const { data: podcasts = [], isLoading: podcastsLoading } = useQuery({
    queryKey: queryKeys.publishedPodcasts,
    queryFn: () => getPublishedPodcasts(),
  });
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    /* La clé du module, pas une copie écrite à la main : `VideoDetail` précharge la même
       liste par `queryKeys.publishedVideos`, et deux orthographes de la même clé sont deux
       caches — donc deux allers-retours réseau pour une seule donnée. */
    queryKey: queryKeys.publishedVideos,
    queryFn: () => getPublishedVideos(),
  });
  const loading = podcastsLoading || videosLoading;

  const labels: Record<Filter, string> = {
    all: t('pole.filterAll'),
    listen: t('pole.filterListen'),
    watch: t('pole.filterWatch'),
  };

  /*
    LE CATALOGUE COMPLET, TRIÉ UNE FOIS — et surtout INDÉPENDANT DU FILTRE.

    Le tri se faisait deux fois, sur deux tableaux construits séparément : un pour la grille,
    un pour la vedette, chacun réécrivant la même projection. Le filtre s'applique désormais
    APRÈS, sur une liste déjà traduite : changer de segment ne redemande pas au serveur de
    traduire des titres déjà payés.

    L'IMAGE EST PORTÉE ICI. C'est la ligne exacte qui la perdait : `coverImage` et
    `thumbnailUrl` sont obligatoires sur les deux types, remplis par les imports Spotify et
    YouTube, et cette projection les laissait au sol.
  */
  const catalogue = useMemo(() => [
    ...podcasts.map((p) => ({
      key: `p-${p.id}`, format: 'audio' as const, title: p.title, image: p.coverImage,
      duration: p.duration, to: `/podcasts/${p.slug}`, at: p.publishedAt,
    })),
    ...videos.map((v) => ({
      key: `v-${v.id}`, format: 'video' as const, title: v.title, image: v.thumbnailUrl,
      duration: v.duration, to: `/videos/${v.slug}`, at: v.publishedAt,
    })),
  ].sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '')), [podcasts, videos]);

  /*
    LES TITRES SE TRADUISENT, comme partout ailleurs.

    Cette page était la SEULE des trois à ne pas le faire : en `/en`, la grille servait le
    titre français, puis la fiche ouverte servait le même titre traduit. La liste et sa fiche
    ne parlaient pas la même langue, sur le clic qui les relie.
  */
  const titres = useTranslatedList(catalogue.map((e) => e.title));
  const traduits = useMemo(
    () => catalogue.map((e, i) => ({ ...e, title: titres[i] || e.title })),
    [catalogue, titres],
  );

  const items = useMemo(
    () => traduits.filter((e) =>
      filter === 'all' ? true : filter === 'listen' ? e.format === 'audio' : e.format === 'video'),
    [traduits, filter],
  );

  /* La carte vedette du héros : le plus récent des deux formats, sans filtre appliqué —
     elle présente le pôle, elle ne répond pas au sélecteur. */
  const vedette = traduits[0] ?? null;

  /* La date situe, la durée engage : les deux ensemble répondent à « est-ce récent » et
     « ai-je le temps », qui sont les deux questions posées devant une liste de médias. */
  const meta = (e: { at?: string; duration?: string }) =>
    [e.at ? formatDate(e.at) : null, e.duration].filter(Boolean).join(' · ');

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
          /* `SubNav` compare `active` au LIBELLÉ d'une entrée. Cette ligne passait
             `pole.filterAll` — « Tout », le libellé du filtre de la liste plus bas, qui ne
             correspond à aucune des deux entrées : la sous-navigation ne marquait donc
             AUCUNE entrée active, ni au voile ni en `aria-current`. C'est le premier des
             trois garde-fous que ce fichier revendique en tête — celui qui dit « tu es à
             l'étage gratuit » — et il ne disait rien. */
          active={t('pole.subnavFree')}
          items={[
            { label: t('pole.subnavFree'), href: path('/podcast-et-videos'), territory: 'transforme' },
            { label: t('pole.subnavClub'), href: path('/club-des-digitos'), territory: 'transforme' },
          ]}
        />

        {/*
          ── LE HÉROS EN DEUX COLONNES, AVEC SA CARTE VEDETTE ────────────────────────
          `Pages.js:215-234` : grille `.92fr 1.08fr`, gouttière 44, alignée au centre. À
          gauche le sourcil, le titre, le chapô, les deux étiquettes et la note de rythme ;
          à DROITE une `MediaCard` du dernier média publié, en grand — vignette de 190 px,
          titre à 25.

          La production rendait une colonne unique : la page d'entrée du territoire violet
          n'avait aucune image, et rien ne donnait envie d'écouter avant la grille.

          La carte vedette est le média le plus récent, pas un choix éditorial : il n'existe
          aucun champ « à la une » sur `Podcast` ni sur `Video`.
        */}
        <div className="mt-[26px] grid items-center gap-[44px] wide:grid-cols-[.92fr_1.08fr]">
          <div>
            {/* Garde-fou 2 : « gratuit » est dans le premier écran, dans le sourcil. */}
            <SiteEyebrow>{t('pole.eyebrow')}</SiteEyebrow>
            <SiteDisplay arc lines={t('pole.titleLines', { returnObjects: true }) as string[]} size={52} from={1} />

            <p className="rv mt-4 max-w-[42ch] text-[16px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 5 }}>
              {t('pole.lede')}
            </p>

            <div className="rv mt-5 flex flex-wrap gap-2" style={{ ['--i' as string]: 6 }}>
              <Tag tone="ok">{t('pole.tagFree')}</Tag>
              <Tag>{t('pole.tagTranscript')}</Tag>
            </div>

            {/* La note de rythme remonte DANS le héros — c'est là que le kit la pose, et
                c'est là qu'elle répond à « est-ce que ce truc est encore vivant ». */}
            <p className="rv mt-4 max-w-[56ch] text-small leading-[1.5] text-ink-2" style={{ ['--i' as string]: 7 }}>
              {t('pole.rhythm')}
            </p>
          </div>

          {loading ? (
            <Skeleton height={360} radius="var(--r-l)" label={t('pole.eyebrow')} />
          ) : vedette && (
            <div className="rv" style={{ ['--i' as string]: 6 }}>
              <MediaCard
                format={vedette.format}
                image={vedette.image}
                artRatio="16 / 9"
                titleSize={25}
                eyebrow={meta(vedette)}
                title={vedette.title}
                playHref={path(vedette.to)}
                playLabel={`${vedette.format === 'video' ? t('pole.featuredWatch') : t('pole.featuredPlay')} — ${vedette.title}`}
                actions={
                  <Button href={path(vedette.to)} tone="transforme" size="sm" fullWidth={false}>
                    {vedette.format === 'video' ? t('pole.featuredWatch') : t('pole.featuredPlay')}
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {/* Le titre de la grille et le sélecteur, sur la même ligne — `Pages.js:236-240`.
            La section n'avait aucun titre : la grille suivait le héros sans qu'on sache ce
            qu'elle listait. */}
        <div className="mm-section flex flex-wrap items-center justify-between gap-5">
          <SiteDisplay as="h2" lines={t('pole.gridTitle', { returnObjects: true }) as string[]} size={34} />
          <div className="w-full max-w-[320px] shrink-0">
            <Segmented
              label={t('pole.eyebrow')}
              options={[labels.all, labels.listen, labels.watch]}
              value={labels[filter]}
              onChange={(o) => setFilter(o === labels.listen ? 'listen' : o === labels.watch ? 'watch' : 'all')}
            />
          </div>
        </div>

        {/*
          TROIS COLONNES EN GRAND, DEUX EN INTERMÉDIAIRE. Deux colonnes de vignettes 16:9 sur
          un écran de 1440 px donnaient des cartes de 640 px de large : une galerie de médias
          y ressemblait à deux bannières empilées. Le rapport remplace la hauteur figée —
          `artHeight` recadrait l'image différemment à chaque largeur de colonne.
        */}
        {loading ? (
          <div className="mt-6 grid gap-4 stack:grid-cols-2 wide:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} height={268} radius="var(--r-l)" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="mt-6 grid gap-4 stack:grid-cols-2 wide:grid-cols-3">
            {items.map((item, i) => (
              <div key={item.key} className="rv" style={{ ['--i' as string]: i + 1 }}>
                <MediaCard
                  format={item.format}
                  image={item.image}
                  playHref={path(item.to)}
                  playLabel={`${item.format === 'video' ? t('pole.filterWatch') : t('pole.filterListen')} — ${item.title}`}
                  title={item.title}
                  eyebrow={meta(item)}
                  badge={item.format === 'video' ? t('pole.filterWatch') : t('pole.filterListen')}
                  artRatio="16 / 9"
                  titleSize={21}
                />
              </div>
            ))}
          </div>
        ) : (
          /* L'ÉTAT VIDE SAIT CE QU'ON LUI A DEMANDÉ. « Rien n'est encore en ligne ici » était
             faux dès qu'un filtre était posé : il y a bien quelque chose, ce n'est simplement
             pas le format demandé — et la sortie est de retirer le filtre, pas de partir. */
          <p className="mt-6 max-w-prose text-lede text-ink-2">
            {filter === 'listen' ? t('pole.emptyListen')
              : filter === 'watch' ? t('pole.emptyWatch')
              : t('pole.empty')}
          </p>
        )}

        {/* L'aveu : le poids manque, et on le dit. */}
        <GlassPanel level="truth" className="mt-4 max-w-[74ch]">
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('pole.truthTitle')}</SiteEyebrow>
          <p className="m-0 text-meta-2 text-ink-2 leading-[1.55]">{t('pole.truthBody')}</p>
        </GlassPanel>

        {/*
          ── « ÉCOUTE OÙ TU VEUX. » ──────────────────────────────────────────────────
          La section du kit (`ui_kits/site-public/Pages.js:261-272`) n'existait pas : la page
          d'entrée du territoire violet ne disait nulle part où les épisodes vivent en dehors
          d'elle. C'est pourtant l'argument qui désamorce la question « faut-il revenir ici
          pour écouter ».

          DEUX RANGÉES, PAS TROIS. Le kit en dessine trois — Spotify, YouTube, Flux RSS. Le
          dépôt ne contient AUCUNE URL de show Spotify : `extractSpotifyEpisodeId` sait lire un
          épisode collé dans une fiche, il n'y a pas de flux à nous. Inventer le lien aurait été
          exactement ce que l'encart de vérité de cette page reproche au reste du web ; la
          troisième ligne est donc remplacée par la phrase qui dit ce qui manque.

          AUCUNE COULEUR DE MARQUE dans les puits d'icône, là où le kit pose `#1DB954` et
          `#FF0000` : c'est la décision déjà prise pour les sept réseaux de `ProfileTab`, et
          elle vaut ici pour la même raison — deux hexadécimaux hors système, qui ne basculent
          pas sous `.dk`.
        */}
        <div className="mm-section grid items-center gap-[34px] wide:grid-cols-2">
          <div>
            <SiteDisplay as="h2" lines={t('pole.elsewhereTitle', { returnObjects: true }) as string[]} size={34} />
            <p className="rv mt-3 max-w-[42ch] text-prose text-ink-2 leading-[1.6]" style={{ ['--i' as string]: 3 }}>
              {t('pole.elsewhereBody')}
            </p>
            <p className="rv mt-3 max-w-[46ch] text-small leading-[1.5] text-ink-2" style={{ ['--i' as string]: 4 }}>
              {t('pole.elsewhereNote')}
            </p>
          </div>
          <GlassPanel level="flat" padding="6px 22px" className="rv" style={{ ['--i' as string]: 5 }}>
            <LessonRow
              state="plain"
              icon={<Icon name="play" size={16} />}
              title={t('pole.elsewhereYoutube')}
              trailing={
                <Button href={youtubeUrl} target="_blank" tone="quiet" size="sm" fullWidth={false}>
                  {t('pole.elsewhereYoutubeCta')}
                </Button>
              }
            />
            <LessonRow
              state="plain"
              icon={<Icon name="doc" size={16} />}
              title={t('pole.elsewhereRss')}
              last
              trailing={
                <Button href="/rss.xml" tone="quiet" size="sm" fullWidth={false}>
                  {t('pole.elsewhereRssCta')}
                </Button>
              }
            />
          </GlassPanel>
        </div>

        <p className="mt-3 max-w-[74ch] text-small leading-[1.55] text-ink-2">{t('pole.elsewhereMissing')}</p>

        {/* Garde-fou 3 : le Club, EN BAS. Jamais devant. */}
        <div
          className="rv-s mm-section rounded-xl p-[34px] text-white"
          style={{
            background: 'linear-gradient(140deg,var(--mm-violet),var(--mm-bleu) 72%,var(--mm-teal))',
            boxShadow: 'var(--sh-violet)',
          }}
        >
          {/* Gouttière 34, pas 32 — `Pages.js:276`. */}
          <div className="grid items-center gap-[34px] wide:grid-cols-[1.25fr_.75fr]">
            <div>
              {/* Le sourcil du kit — « L'étage au-dessus » (`Pages.js:277`). Il situe le Club
                  par rapport à ce qu'on vient d'écouter, au lieu de l'annoncer à froid. */}
              <SiteEyebrow style={{ color: 'rgba(255,255,255,.72)', marginBottom: '8px' }}>
                {t('pole.clubEyebrow')}
              </SiteEyebrow>
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
            {/*
              LE PRIX EST SUR LE BOUTON, et la mention annuelle dessous — c'est la règle de
              cadrage du système : un tarif annuel s'écrit au MOIS, avec la mention annuelle
              en dessous. Le bouton disait seulement « Voir le Club des Digitos » : la personne
              ne savait pas si elle cliquait vers une page à deux mille ou à deux cent mille.

              Aucun montant n'est écrit ici, pas même en commentaire : `club-pricing.test.ts`
              l'interdit sur tout le fichier, et il a raison — un chiffre recopié dans une
              explication ment le jour où la grille bouge, sans que personne ne relise.

              Les deux montants sont recalculés depuis `lib/club/pricing`, jamais recopiés.
            */}
            <div>
              {/* Le montant sort de la chaîne traduite : c'est un <Num>. Il porte donc sa
                  source, sa monospace tabulaire, et le séparateur de milliers de LA LANGUE —
                  espace insécable en français, virgule en anglais. Interpolé dans la chaîne,
                  il aurait été figé sur une seule des deux. */}
              <Button href={path('/club-des-digitos')} tone="ghost" focusInvert fullWidth={false}>
                {t('pole.clubCtaPriced')}{' '}
                <Num value={monthly} unit="F/mois" source="server" asOf={asOf} showAsOf={false} />
              </Button>
              <p className="mt-2 mb-0 text-small" style={{ color: 'rgba(255,255,255,.72)' }}>
                {t('pole.clubBilled')}{' '}
                <Num value={CLUB_PRICE_XOF} unit="F" source="server" asOf={asOf} showAsOf={false} />{' '}
                {t('pole.clubBilledSuffix')}
              </p>
            </div>
          </div>
        </div>
      </PageSite>
    </DsNavHost>
  );
}
