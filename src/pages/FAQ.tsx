import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, ChipRow, GlassPanel, Icon, LessonRow, SearchPill, Skeleton } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteDisplay, SiteEyebrow } from '../components/site';
import TranslatedText from '../components/shared/TranslatedText';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { getAllFAQ } from '../lib/firestore';
import { faqSlug } from '../lib/faq/slug';
import { queryKeys } from '../lib/queryClient';
import type { FAQ as FAQItem } from '../types';

/**
 * /faq — LE MOTIF « INDEX » appliqué aux questions.
 *
 * Les blocs du kit : sourcil → titre → chapô → recherche → filtres → deux colonnes de listes
 * groupées par catégorie → panneau de contact → encart de vérité.
 *
 * CHAQUE LIGNE EST UN LIEN, PLUS UN ACCORDÉON — et c'est le kit qui tranche : le chevron
 * `forward` de sa maquette dit « ça mène ailleurs », pas « ça se déplie ». L'accordéon était
 * un pis-aller tant que `/faq/:slug` n'existait pas ; il rendait la réponse consultable et
 * rien d'autre — impossible d'envoyer à quelqu'un LA question qui le concerne, aucune
 * position propre en recherche, et un moteur qui voit toutes les réponses sur une seule adresse.
 *
 * Le `FAQPage` en données structurées reste ici, et il garde son sens : il décrit l'index.
 * Chaque page de question en déclare une seule, la sienne.
 */
export default function FAQPage() {
  const { t } = useTranslation('faq');
  const path = useLocalizedPath();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  /*
   * Même clé que la page d'une question, DONC MÊME REQUÊTE — la nuance n'est pas cosmétique :
   * deux `queryFn` différentes derrière une clé unique font que le contenu du cache dépend de
   * l'écran ouvert en premier. Le tri par `order` vient de la requête Firestore elle-même
   * (`getAllFAQ` porte son `orderBy`), il n'a rien à faire ici.
   */
  const { data: faqs = null } = useQuery({
    queryKey: queryKeys.faq,
    queryFn: () => getAllFAQ(),
  });

  const categories = useMemo(() => {
    const tally = new Map<string, number>();
    for (const item of faqs ?? []) tally.set(item.category, (tally.get(item.category) ?? 0) + 1);
    return [...tally.entries()];
  }, [faqs]);

  const chips = useMemo(
    () => [`${t('index.filterAll')} · ${faqs?.length ?? 0}`, ...categories.map(([c, n]) => `${c} · ${n}`)],
    [categories, faqs, t],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (faqs ?? []).filter((item) => {
      const matchesCategory = !category || item.category === category;
      const matchesSearch = !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [faqs, category, search]);

  /* Les questions sont groupées par catégorie, comme dans le kit — deux colonnes de blocs. */
  const grouped = useMemo(() => {
    const map = new Map<string, FAQItem[]>();
    for (const item of filtered) map.set(item.category, [...(map.get(item.category) ?? []), item]);
    return [...map.entries()];
  }, [filtered]);

  return (
    <DsNavHost>
      {/* `seoTitle` / `seoDescription`, à la racine du namespace — et non `seo.title`, qui
          n'existe pas : i18next rendait alors la CLÉ, et l'onglet du navigateur affichait
          « seo.title » sur la page publique la plus liée du site. */}
      <SEOHead title={t('seoTitle')} description={t('seoDescription')} />
      {faqs && faqs.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }} />
      )}

      <PageSite>
        {/* NI SOURCIL, NI TITRE SUR DEUX LIGNES. Le kit ouvre cette page par un seul mot
            d'affichage à 50 px — « Questions fréquentes » (`PagesUtiles.js:22`) — sans sourcil
            de territoire au-dessus. C'est aussi le libellé du pied de page : la page et le lien
            qui y mène disaient deux choses différentes. */}
        <SiteDisplay lines={t('index.titleLines', { returnObjects: true }) as string[]} size={50} />
        <p className="rv mt-[14px] max-w-[54ch] text-[16px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 4 }}>
          {t('index.lede')}
        </p>

        <div className="rv mt-[22px] max-w-[520px]" style={{ ['--i' as string]: 5 }}>
          {/* LE LIBELLÉ REDEVIENT VISIBLE. Le kit le rend en deux temps DANS la pilule —
              « Cherche » en gras, « une question » en gris (`PagesUtiles.js:24`) : c'est ce qui
              donne au champ sa silhouette et dit ce qu'on remplit avant d'y toucher. `labelHidden`
              le réservait au lecteur d'écran, et il ne restait qu'un placeholder — qui disparaît,
              lui, à la première frappe. */}
          <SearchPill
            label={t('index.searchLabel')}
            hint={t('index.searchHint')}
            icon={<Icon name="search" size={16} strokeWidth={2.4} />}
            value={search}
            onChange={setSearch}
          />
        </div>

        {categories.length > 0 && (
          <div className="rv mt-[18px] max-w-[620px]" style={{ ['--i' as string]: 6 }}>
            <ChipRow
              label={t('index.eyebrow')}
              options={chips}
              value={category ? chips.find((c) => c.startsWith(category)) : chips[0]}
              onChange={(o) => setCategory(o.startsWith(t('index.filterAll')) ? '' : o.split(' · ')[0])}
            />
          </div>
        )}

        {faqs === null ? (
          <div className="mt-6 grid gap-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={54} radius="var(--r-m)" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-6 max-w-prose text-lede text-ink-2">{t('index.empty')}</p>
        ) : (
          /*
            DEUX COLONNES EXPLICITES, ET LE PANNEAU DE CONTACT AU PIED DE LA DROITE.
            Le kit répartit les blocs entre deux colonnes et ferme la seconde par « Pose-la-moi
            directement » (`PagesUtiles.js:28-40`) : les deux colonnes se terminent alors à la
            même hauteur. En flux libre, les groupes se répartissaient tout seuls et le panneau
            passait pleine largeur sous la grille — la colonne de droite s'arrêtait court.
          */
          <div className="mt-[10px] grid gap-5 wide:grid-cols-2 wide:items-start">
            {[grouped.slice(0, Math.ceil(grouped.length / 2)), grouped.slice(Math.ceil(grouped.length / 2))].map((colonne, ci) => (
              <div key={ci}>
                {colonne.map(([name, items], g) => (
              <div key={name}>
                <SiteEyebrow style={{ marginTop: '22px' }}>{name}</SiteEyebrow>
                {/* `"6px 22px"` — le contenant canonique d'une liste de `LessonRow`. */}
                <GlassPanel level="flat" padding="6px 22px" className="rv" style={{ ['--i' as string]: 7 + g }}>
                  {items.map((item, i) => (
                    <LessonRow
                      key={item.id}
                      state="plain"
                      href={path(`/faq/${faqSlug(item)}`)}
                      title={<TranslatedText text={item.question} as="b" className="font-semibold" />}
                      trailing={<Icon name="forward" size={15} color="var(--ink-2)" strokeWidth={2.4} />}
                      last={i === items.length - 1}
                    />
                  ))}
                </GlassPanel>
              </div>
                ))}

                {/*
                  Le panneau ferme la SECONDE colonne.

                  LES DEUX TEXTES ÉTAIENT AUSSI INTERVERTIS. Le chapô de la page portait « Si la
                  question revient, elle finit ici » — qui est, dans le kit, le CORPS de ce
                  panneau (`PagesUtiles.js:36`) — pendant que le panneau affichait en gros titre
                  « Tu ne trouves pas ? », qui en est le SOURCIL. L'argument de la page, lui, ne
                  s'affichait nulle part.
                */}
                {ci === 1 && (
                  <GlassPanel level="hero" padding={24} className="rv mt-[22px]" style={{ ['--i' as string]: 8 }}>
                    <SiteEyebrow style={{ margin: 0 }}>{t('index.contactEyebrow')}</SiteEyebrow>
                    <p className="m-0 mt-[7px] font-display text-[19px] font-black tracking-[-.03em] text-ink">
                      {t('index.contactTitle')}
                    </p>
                    <p className="mt-2 mb-4 max-w-[52ch] text-meta leading-[1.55] text-ink-2">{t('index.contactBody')}</p>
                    <Button href={path('/contact')} tone="primary" size="sm" fullWidth={false}>
                      {t('index.contactCta')}
                    </Button>
                  </GlassPanel>
                )}
              </div>
            ))}
          </div>
        )}

        <GlassPanel level="truth" className="mt-[22px] max-w-[76ch]">
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('index.truthTitle')}</SiteEyebrow>
          <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('index.truthBody')}</p>
        </GlassPanel>
      </PageSite>
    </DsNavHost>
  );
}
