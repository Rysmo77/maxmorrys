import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Breadcrumb, Button, CheckLine, GlassPanel, Icon, LessonRow, PriceBlock, Skeleton, Tag } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLanguage, useLocalizedPath } from '../contexts/LanguageContext';
import { useTranslatedContent, useTranslatedText } from '../hooks/useTranslatedContent';
import { useAuth } from '../contexts/AuthContext';
import { getFormationBySlug } from '../lib/firestore';
import { markdownToHtml } from '../lib/markdown';
import type { Formation } from '../types';
import { trackViewItem, trackAddToCart } from '../lib/tracking';
import SEOHead from '../components/seo/SEOHead';
import { contentPath } from '../lib/contentPath';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';




export default function FormationDetail() {
  const { t } = useTranslation('formations');
  const { slug } = useParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [formation, setFormation] = useState<Formation | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    getFormationBySlug(slug, language).then((data) => {
      setFormation(data);
      if (data) {
        trackViewItem({
          id: data.id,
          name: data.title,
          category: data.category,
          content_type: 'formation',
          price: data.promoPrice ?? data.price,
          currency: 'XOF',
        });
      }
    }).catch(() => setFormation(null));
  }, [slug, language]);


  /* Traduction du contenu dynamique Firestore (FR -> EN selon langue active). */
  const tFormation = useTranslatedContent(
    formation as (Formation & Record<string, unknown>) | null | undefined,
    ['title', 'description', 'longDescription', 'category'],
  ) as Formation | null | undefined;
  const seoTitleSource = formation ? formation.metaTitle || formation.title : '';
  const seoDescSource = formation ? formation.metaDescription || formation.description : '';
  const seoTitle = useTranslatedText(seoTitleSource);
  const seoDescription = useTranslatedText(seoDescSource);
  const longDescriptionBody = useTranslatedText(formation?.longDescription);

  const path = useLocalizedPath();

  if (formation === undefined) {
    return (
      <PageSite>
        <div className="grid items-start gap-11 lg:grid-cols-[1.1fr_.9fr]">
          <div className="grid gap-4">
            <Skeleton width={180} height={12} />
            <Skeleton height={40} width="80%" />
            <Skeleton height={210} radius="var(--r-media)" />
          </div>
          <Skeleton height={280} radius="var(--r-xl)" />
        </div>
      </PageSite>
    );
  }

  if (!formation) {
    return (
      <PageSite>
        <SiteDisplay lines={[t('detail.notFoundTitle')]} size={34} />
        <p className="mt-4">
          <Button href={path('/formations')} tone="quiet" size="sm" fullWidth={false}>
            {t('detail.notFoundLink')}
          </Button>
        </p>
      </PageSite>
    );
  }

  /*
   * Les compteurs de l'encart de vérité viennent du CONTENU RÉEL de la formation, pas d'une
   * constante. C'est ce qui les rend affichables : « un nombre en monospace vient de la base
   * ou d'une source citée ».
   */
  const modules = formation.modules ?? [];
  const lessons = modules.reduce((n, m) => n + (m.lessons?.length ?? 0), 0);
  const price = formation.promoPrice ?? formation.price;
  const asOf = new Date();

  return (
    <DsNavHost>
      <SEOHead title={seoTitle} description={seoDescription} ogImage={formation.coverImage} />
      {/*
        ═══════════════════════════════════════════════════════════════════════════
        L'`AggregateRating` A ÉTÉ RETIRÉ DES DONNÉES STRUCTURÉES.
        Il injectait `ratingValue: formation.rating` et `ratingCount: formation.students || 1`
        — c'est-à-dire qu'il DÉCLARAIT À GOOGLE une note et un nombre d'avis sur un produit
        qui n'a jamais été vendu. La base compte 5 comptes, 2 inscriptions à 0 % et 0
        certificat émis.
        Afficher un chiffre faux est une faute ; le publier en données structurées, c'est le
        faire répéter par un tiers. Les champs restent en base ; ils ne sortent plus d'ici.
        ═══════════════════════════════════════════════════════════════════════════
      */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: formation.title,
        description: formation.description,
        url: `${SITE_URL}${contentPath('formations', formation, language)}`,
        provider: { '@type': 'Organization', name: SITE_NAME },
        offers: {
          '@type': 'Offer', price, priceCurrency: 'XOF',
          availability: 'https://schema.org/InStock',
        },
      }} />

      <PageSite>
        <Breadcrumb
          label={t('sheet.eyebrow')}
          items={[
            { label: t('sheet.eyebrow'), href: path('/formations') },
            { label: formation.category },
          ]}
        />

        <div className="mt-4 grid items-start gap-11 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <SiteDisplay wrap lines={[tFormation?.title || formation.title]} size={48} style={{ maxWidth: '18ch' }} />
            <p className="rv mt-4 max-w-[48ch] text-[16px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 3 }}>
              {tFormation?.description || formation.description}
            </p>

            {/*
              L'emplacement d'aperçu : un dégradé de marque, pas une photographie. Le dépôt
              n'en contient aucune, et c'est ce qui tient le budget de première vue.
            */}
            <div
              className="rv-s mt-5 flex h-[210px] items-end rounded-media p-4"
              style={{
                background: 'var(--action-forme)',
                boxShadow: 'var(--sh-bleu)',
                ['--i' as string]: 4,
              }}
            >
              <Tag style={{ background: 'rgba(255,255,255,.9)', color: 'var(--ink-fixed)' }}>
                {t('sheet.preview')}
              </Tag>
            </div>

            {formation.longDescription && (
              /* La description longue, en prose bornée à 68 caractères. Elle portait le
                 détail de la promesse ; la perdre aurait vidé la page de son argument. */
              <div
                className="mm-prose prose-article mt-7"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(longDescriptionBody || formation.longDescription) }}
              />
            )}

            <SiteEyebrow style={{ marginTop: '28px' }}>{t('sheet.program')}</SiteEyebrow>
            <GlassPanel level="flat" padding="6px 22px">
              {modules.map((module, mi) => {
                const open = expandedModules.includes(module.id);
                const firstFree = mi === 0;
                return (
                  <div key={module.id}>
                    <LessonRow
                      state="plain"
                      title={<b className="font-semibold">{module.title}</b>}
                      meta={`${module.lessons?.length ?? 0} · ${t('sheet.program')}`}
                      onClick={() =>
                        setExpandedModules((prev) =>
                          prev.includes(module.id) ? prev.filter((id) => id !== module.id) : [...prev, module.id],
                        )
                      }
                      icon={
                        firstFree
                          ? <Icon name="play" size={13} color="var(--paper-fixed)" />
                          : <Icon name="lock" size={14} color="var(--ink-2)" strokeWidth={2.4} />
                      }
                      iconBackground={firstFree ? 'var(--action-forme)' : 'var(--fill-2)'}
                      trailing={firstFree ? <Tag tone="ok">{t('sheet.free')}</Tag> : undefined}
                      last={mi === modules.length - 1 && !open}
                    />
                    {open && (
                      <ul className="list-none m-0 pb-3 pl-[46px]">
                        {(module.lessons ?? []).map((lesson) => (
                          <li key={lesson.id} className="flex items-baseline justify-between gap-3 py-[5px]">
                            <span className="text-meta-2 text-ink-2">{lesson.title}</span>
                            <span className="mm-num text-small text-ink-2">{lesson.duration}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </GlassPanel>
          </div>

          {/* LA CARTE DE PRIX, COLLANTE — le seul `hero` de la page. */}
          <aside className="grid gap-[14px] lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
            <GlassPanel level="hero" padding={26} className="rv" style={{ ['--i' as string]: 4 }}>
              <PriceBlock
                size={36}
                amount={{ value: price, source: 'db', asOf }}
                strike={formation.promoPrice ? { value: formation.price, source: 'db', asOf } : undefined}
                currency="FCFA"
                note={t('sheet.lifetime')}
              />
              <Button
                href={user ? path(`/checkout/${formation.slug}`) : path('/connexion')}
                tone="forme"
                onClick={() => trackAddToCart({ id: formation.id, name: formation.title, category: formation.category, price, currency: 'XOF' })}
                style={{ marginTop: '15px' }}
              >
                {t('sheet.enroll')}
              </Button>
              <Button href={path('/formations')} tone="quiet" style={{ marginTop: '10px' }}>
                {t('sheet.startFree')}
              </Button>

              <div className="my-5 h-px bg-[color:var(--border-hair)]" />
              {(['c1', 'c2', 'c3'] as const).map((key, i) => (
                <CheckLine key={key} tone="ok" style={{ fontSize: '13.5px', marginTop: i === 0 ? 0 : undefined }}>
                  {t(`sheet.${key}`)}
                </CheckLine>
              ))}
            </GlassPanel>

            {/*
              L'ENCART DE VÉRITÉ — ce qui remplace la note et le nombre d'inscrits. Ses deux
              nombres viennent du contenu réel de la formation, comptés à l'affichage.
            */}
            <GlassPanel level="truth" className="rv" style={{ ['--i' as string]: 5 }}>
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('sheet.truthTitle')}</SiteEyebrow>
              <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">
                {t('sheet.truthBody', { lessons, modules: modules.length })}
              </p>
            </GlassPanel>
          </aside>
        </div>
      </PageSite>

      <SiteBand>
        <SiteDisplay as="h2" lines={t('sheet.forWhoTitle', { returnObjects: true }) as string[]} size={34} />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <GlassPanel level="flat" padding={24}>
            <p className="m-0 mb-3 font-display text-[19px] font-black tracking-[-.03em] text-ink">{t('sheet.forYes')}</p>
            {(['y1', 'y2', 'y3'] as const).map((k) => <CheckLine key={k} tone="ok">{t(`sheet.${k}`)}</CheckLine>)}
          </GlassPanel>
          <GlassPanel level="flat" padding={24}>
            <p className="m-0 mb-3 font-display text-[19px] font-black tracking-[-.03em] text-ink">{t('sheet.forNo')}</p>
            {(['n1', 'n2', 'n3'] as const).map((k) => (
              <CheckLine key={k} tone="neutre" dash>{t(`sheet.${k}`)}</CheckLine>
            ))}
          </GlassPanel>
        </div>
      </SiteBand>

      <PageSite>
        <SiteDisplay as="h2" lines={t('sheet.faqTitle', { returnObjects: true }) as string[]} size={34} />
        <GlassPanel level="flat" padding="8px 26px" className="rv mt-5" style={{ ['--i' as string]: 2 }}>
          {(['1', '2', '3'] as const).map((n, i) => (
            <div
              key={n}
              className="py-4"
              style={i > 0 ? { borderTop: '1px solid var(--border-hair)' } : undefined}
            >
              <p className="m-0 text-[14.5px] font-bold text-ink">{t(`sheet.q${n}`)}</p>
              <p className="m-0 mt-1 max-w-prose text-meta leading-[1.6] text-ink-2">{t(`sheet.a${n}`)}</p>
            </div>
          ))}
        </GlassPanel>
      </PageSite>
    </DsNavHost>
  );
}
