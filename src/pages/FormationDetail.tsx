import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Breadcrumb, Button, CheckLine, GlassPanel, Icon, LessonRow, PriceBlock, Skeleton, Tag, TranslationNotice } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLanguage, useLocalizedPath } from '../contexts/LanguageContext';
import { useFormat } from '../hooks/useFormat';
import { PriceApprox } from '../components/shared/PriceApprox';
import { useTranslatedContent, useTranslatedText } from '../hooks/useTranslatedContent';
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
  const { formatDate } = useFormat();
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
        <div className="grid items-start gap-11 wide:grid-cols-[1.1fr_.9fr]">
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
  /** Une leçon marquée gratuite existe-t-elle ? C'est ce qui autorise à parler d'aperçu. */
  const hasFreeLesson = modules.some((m) => (m.lessons ?? []).some((l) => l.isFree));
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

        <div className="mt-4 grid items-start gap-11 wide:grid-cols-[1.1fr_.9fr]">
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

            {/*
              LE BANDEAU EST OBLIGATOIRE SUR TOUT CORPS TRADUIT À LA MACHINE.

              `longDescription` passe par `useTranslatedText()` — donc par une traduction
              générée au pré-rendu ET MISE EN CACHE, sans invalidation manuelle : une
              correction du français n'atteint cette page qu'à l'expiration du cache.
              L'article, le podcast et la vidéo le disent ; la fiche formation était la
              seule surface à servir un corps traduit sans l'annoncer. La date est celle de
              la dernière révision de la fiche — la seule que le modèle porte.
            */}
            {/* `updatedAt ?? publishedAt` : les deux seules dates que le modèle porte. Sans
                ni l'une ni l'autre, PAS de bandeau — un bandeau daté d'aujourd'hui serait le
                nombre inventé que la règle 6 refuse, exactement le raisonnement que
                `FAQQuestion` tient pour ne pas en poser du tout. */}
            {language === 'en' && formation.longDescription && (formation.updatedAt ?? formation.publishedAt) && (
              <TranslationNotice
                date={formatDate((formation.updatedAt ?? formation.publishedAt) as string)}
                href={`/formations/${formation.slug}`}
                originalLabel={t('sheet.translatedOriginal')}
                style={{ marginTop: '18px', maxWidth: 'var(--measure-prose)' }}
              />
            )}

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
                /*
                  LA GRATUITÉ EST UNE DONNÉE, PAS UN RANG.

                  C'était `mi === 0` : le premier module portait l'étiquette « Gratuit » et
                  le glyphe de lecture SANS que rien ne soit consulté. `Lesson.isFree` existe
                  pourtant au modèle. Une promesse d'avant-achat — « le module d'ouverture est
                  en accès libre, tu juges avant de payer » — était donc affichée pour toutes
                  les formations, y compris celles dont aucune leçon n'est marquée gratuite.
                  C'est la donnée factice de la maquette reprise telle quelle, que
                  `MAQUETTES.md` demande explicitement de ne pas rejouer.
                */
                const moduleFree = (module.lessons ?? []).some((l) => l.isFree);
                return (
                  <div key={module.id}>
                    <LessonRow
                      state="plain"
                      title={<b className="font-semibold">{module.title}</b>}
                      /* Il rendait « 11 · Le programme » : le nombre de leçons collé au TITRE
                         DE SECTION, faute d'une clé qui compte. Le kit écrit « 11 leçons ·
                         1 h 08 » (`PagesFormations.js:62`) ; la durée n'est pas reprise parce
                         que `Lesson.duration` est une chaîne libre — l'additionner produirait
                         un nombre que personne ne pourrait sourcer, ce que la règle 6 interdit. */
                      meta={t('sheet.moduleMeta', { count: module.lessons?.length ?? 0 })}
                      onClick={() =>
                        setExpandedModules((prev) =>
                          prev.includes(module.id) ? prev.filter((id) => id !== module.id) : [...prev, module.id],
                        )
                      }
                      icon={
                        moduleFree
                          ? <Icon name="play" size={13} color="var(--paper-fixed)" />
                          : <Icon name="lock" size={14} color="var(--ink-2)" strokeWidth={2.4} />
                      }
                      iconBackground={moduleFree ? 'var(--action-forme)' : 'var(--fill-2)'}
                      trailing={moduleFree ? <Tag tone="ok">{t('sheet.free')}</Tag> : undefined}
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
          <aside className="grid gap-[14px] wide:sticky wide:top-[calc(var(--header-h)+1rem)]">
            <GlassPanel level="hero" padding={26} className="rv" style={{ ['--i' as string]: 4 }}>
              <PriceBlock
                size={36}
                amount={{ value: price, source: 'db', asOf }}
                strike={formation.promoPrice ? { value: formation.price, source: 'db', asOf } : undefined}
                currency="FCFA"
                approx={<PriceApprox xof={price} />}
                note={t('sheet.lifetime')}
              />
              {/*
                ── LE CTA POINTE SUR LE PAIEMENT, CONNECTÉ OU NON ────────────────────────
                Il envoyait les visiteurs déconnectés sur `/connexion` SANS état de retour.
                Or `Login.tsx:43` retombe alors sur son défaut, `/mon-espace` : quelqu'un
                qui venait de cliquer « S'inscrire » sur une formation atterrissait sur son
                tableau de bord, et devait retrouver la formation à la main. Six à sept clics
                au lieu de trois, au moment de la plus forte intention d'achat du site.

                Le mécanisme correct existait déjà et sert partout ailleurs : `/checkout/:slug`
                est sous `ProtectedRoute` (`App.tsx:455-457`), qui renvoie vers la connexion
                AVEC `state={{ from: location }}` — et `Login` lit ce `from`. Cette page était
                la seule à court-circuiter le garde en devinant la destination elle-même.

                Le `href` est conservé plutôt qu'un `navigate()` : c'est une page publique, et
                un CTA de vente doit rester ouvrable dans un nouvel onglet et copiable. Le
                rechargement complet que `Button href` provoque est un défaut réel, mais il est
                SYSTÉMIQUE au composant — le corriger ici seul, en dégradant le lien en bouton,
                échangerait un défaut contre un autre.
              */}
              <Button
                href={path(`/checkout/${formation.slug}`)}
                tone="forme"
                onClick={() => trackAddToCart({ id: formation.id, name: formation.title, category: formation.category, price, currency: 'XOF' })}
                style={{ marginTop: '15px' }}
              >
                {t('sheet.enroll')}
              </Button>
              {/*
                « Commencer le module gratuit » MENAIT AU CATALOGUE — c'est-à-dire à la page
                d'où l'on vient. Le geste promis ne se produisait pas : la personne revenait
                en arrière en croyant avancer.

                Il ouvre maintenant le lecteur, qui sert l'aperçu des leçons marquées
                gratuites (voir `CoursePlayer`). Et il ne s'affiche QUE si une telle leçon
                existe : proposer d'ouvrir un module gratuit sur une formation qui n'en a
                aucun serait la même promesse creuse, un cran plus loin.
              */}
              {hasFreeLesson && (
                <Button href={path(`/cours/${formation.slug}`)} tone="quiet" style={{ marginTop: '10px' }}>
                  {t('sheet.startFree')}
                </Button>
              )}

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
        {/* Marge 22, pas 24 — `PagesFormations.js:109`. */}
        <div className="mt-[22px] grid gap-4 stack:grid-cols-2">
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
