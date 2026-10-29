import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon, Num } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../components/seo/seo-config';
import LocalizedLink from '../components/shared/LocalizedLink';
import { PriceApprox } from '../components/shared/PriceApprox';
import CourseCover from '../components/formations/CourseCover';
import { EduNightHero, PillLink } from '../components/edu/g1/EduPublic';
import EduPreFooter from '../components/edu/g2/EduPreFooter';
import { useLanguage } from '../contexts/LanguageContext';
import { getPublishedFormations } from '../lib/firestore';
import { queryKeys } from '../lib/queryClient';
import { portrait } from '../lib/author';
import { CLUB_MEMBER_FORMATION_DISCOUNT } from '../lib/club/pricing';
import { RYSMO_BASE_DAILY, RYSMO_CLUB_BONUS, RYSMO_CLUB_DAILY } from '../lib/rysmo/quota';
import { estAVenir } from '../types/formationRelease';
import type { Formation } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /apprendre — L'ACCUEIL PUBLIC D'EDU.  Maquettes `Edu-Accueil.dc.html` (+ `-mobile`), passe 2.
 *
 * La passe 2 lève la page mère « quatre territoires » du CDC du 14/09 : la maquette fait foi.
 * Ordre des sections : héros de nuit · pourquoi ces formations · ton formateur · ce que tu
 * vas apprendre · les formations · Rysmo IA et le Club · la mission · pré-pied Edu.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LA MAQUETTE MONTRE ET QUE CETTE PAGE NE REND PAS — ET POURQUOI
 *
 *  · Le compte à rebours du « prochain live gratuit » (« compte à rebours d'exemple ») :
 *    aucun producteur de lives datés n'existe. Le bloc est MASQUÉ, pas simulé.
 *  · « 20+ personnes formées en salle » : aucun relevé en base ne le porte. Masqué.
 *  · Le catalogue d'exemple (« titres et prix à confirmer ») : remplacé par les formations
 *    PUBLIÉES, lues comme le catalogue (même clé de cache), prix et nombre de leçons compris.
 *    Le nombre de leçons libres est COMPTÉ (`isFree`), jamais annoncé d'avance.
 *  · « club.maxmorrys.me » : pas de sous-domaine. La remise membre et le bonus Rysmo IA sont
 *    DÉRIVÉS de `lib/club/pricing` et `lib/rysmo/quota`.
 *  · Les photographies « à faire » : les emplacements restent des aplats, sans légende de
 *    chantier ; le portrait est la photographie réelle de `lib/author`.
 *
 * Aucune note ni aucun nombre d'inscrits (`interdits-preuve-sociale.test.ts`).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const SKILLS = ['niche', 'offer', 'google', 'publish', 'whatsapp', 'measure'] as const;

/** Les leçons libres d'une formation, COMPTÉES dans ses modules. */
function freeLessons(f: Formation): number {
  return (f.modules ?? []).reduce((n, m) => n + (m.lessons ?? []).filter((l) => l.isFree).length, 0);
}
function lessonCount(f: Formation): number {
  return (f.modules ?? []).reduce((n, m) => n + (m.lessons ?? []).length, 0);
}

export default function Apprendre() {
  const { t } = useTranslation('apprendre');
  const { t: tf } = useTranslation('formations');
  const { t: tShared } = useTranslation('shared');
  const { language } = useLanguage();
  const k = (s: string, o?: Record<string, unknown>) => t(`v3.${s}`, o);

  const { data: formations = [], isLoading } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: () => getPublishedFormations(),
  });

  /* Les onglets sont les catégories RÉELLES du catalogue, dans l'ordre d'apparition. */
  const categories = useMemo(() => [...new Set(formations.map((f) => f.category).filter(Boolean))], [formations]);
  const [category, setCategory] = useState('');
  const shown = useMemo(
    () => formations.filter((f) => !category || f.category === category).slice(0, 3),
    [formations, category],
  );
  const asOf = new Date();
  const discount = Math.round(CLUB_MEMBER_FORMATION_DISCOUNT * 100);

  return (
    <div className="eg1">
      <SEOHead title={k('seoTitle')} description={k('seoDescription')} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: k('seoTitle'),
          description: k('seoDescription'),
          url: buildCanonical(language === 'en' ? '/en/learning' : '/apprendre'),
          isPartOf: { '@type': 'WebSite', url: SITE_URL },
        }}
      />

      {/* ── Héros ──────────────────────────────────────────────────────── */}
      <EduNightHero script={k('hero.script')} title={t('v3.hero.titleLines', { returnObjects: true }) as string[]} size="xl" lede={k('hero.lede')}>
        <div className="eg1-hero__ctas">
          <PillLink to="/formations">{k('hero.ctaCourses')}</PillLink>
          <LocalizedLink to="/apprendre/methode" className="eg1-hero__link">{k('hero.ctaMethod')}</LocalizedLink>
        </div>
        <div className="eg1-hero__foot">
          <LocalizedLink to="/a-propos" className="eg1-trainer">
            <img src={portrait.avatar} alt="" width={52} height={52} style={{ borderRadius: '14px', objectFit: 'cover' }} />
            <div>
              <b style={{ display: 'block', fontSize: '15px' }}>Max-Morrys</b>
              <span>{k('hero.trainer')}</span>
            </div>
          </LocalizedLink>
        </div>
        <div className="eg1-scroll" aria-hidden="true"><span>{k('hero.scroll')}</span></div>
      </EduNightHero>

      {/* ── Pourquoi ces formations ────────────────────────────────────── */}
      <section className="eg1-wrap">
        <div className="eg1-split">
          <div className="mm-photo is-edu" style={{ height: '440px' }} aria-hidden="true" />
          <div>
            <span className="mm-eyebrow">{k('why.eyebrow')}</span>
            <h2 className="mm-d eg1-h2">{k('why.title')}</h2>
            <p className="eg1-p" style={{ marginBottom: '26px' }}>{k('why.body')}</p>
            <PillLink to="/apprendre/methode">{k('why.cta')}</PillLink>
          </div>
        </div>
      </section>

      {/* ── Ton formateur ──────────────────────────────────────────────── */}
      <section className="eg1-wrap">
        <div className="eg1-split is-a">
          <div>
            <span className="mm-eyebrow">{k('trainer.eyebrow')}</span>
            <h2 className="mm-d eg1-h2">
              {k('trainer.title')} <span className="mm-hl">{k('trainer.titleHl')}</span>
            </h2>
            <p className="eg1-p">{k('trainer.body1')}</p>
            <p className="eg1-p" style={{ marginBottom: '26px' }}>{k('trainer.body2')}</p>
            <PillLink to="/a-propos">{k('trainer.cta')}</PillLink>
          </div>
          <img
            src={portrait.src}
            srcSet={portrait.srcSet}
            sizes="(max-width: 899px) 100vw, 560px"
            width={portrait.width}
            height={portrait.height}
            alt={tShared('portrait.alt')}
            loading="lazy"
            className="rounded-xl eg1-portrait"
            style={{ width: '100%', height: '480px', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
        </div>
      </section>

      {/* ── Ce que tu vas apprendre ────────────────────────────────────── */}
      <section className="eg1-wrap">
        <div className="eg1-orange">
          <div className="eg1-orange__head">
            <h2 className="mm-d">{k('skills.title')}</h2>
            <span>{k('skills.lede')}</span>
          </div>
          <div className="mm-learn">
            {SKILLS.map((s, i) => (
              <div key={s}>
                <b className="n">{`0${i + 1}.`}</b>
                <b className="t">{k(`skills.items.${s}.title`)}</b>
                <span>{k(`skills.items.${s}.body`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Les formations (lues en base) ──────────────────────────────── */}
      <section className="eg1-wrap">
        <div className="eg1-center">
          <h2 className="mm-d eg1-h2" style={{ margin: '0 0 12px' }}>{k('courses.title')}</h2>
          <p>{k('courses.lede')}</p>
          {categories.length > 1 && (
            <div className="mm-tabs" role="group" aria-label={k('courses.tabsLabel')}>
              <button type="button" aria-pressed={category === ''} onClick={() => setCategory('')}>{k('courses.all')}</button>
              {categories.map((c) => (
                <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
          )}
        </div>
        {isLoading ? null : shown.length === 0 ? (
          <div className="eg1-truth" style={{ marginTop: '28px', textAlign: 'center' }}>
            <b>{k('courses.emptyTitle')}</b>
            <span>{k('courses.emptyBody')}</span>
          </div>
        ) : (
          <div className="eg1-prods">
            {shown.map((f) => {
              const soon = estAVenir(f);
              const free = freeLessons(f);
              const lessons = lessonCount(f);
              const price = f.promoPrice ?? f.price;
              return (
                <article key={f.id} className="mm-prod">
                  <CourseCover
                    title={f.title}
                    category={f.category}
                    slug={f.slug}
                    id={f.id}
                    coverImage={f.coverImage}
                    showTitle={!f.coverImage}
                    kicker={f.category ? `Max-Morrys Edu · ${f.category}` : 'Max-Morrys Edu'}
                    tag={soon ? k('courses.soon') : free > 0 ? k('courses.free', { count: free }) : undefined}
                  />
                  <div className="eg1-prod__body">
                    <b>{f.title}</b>
                    <span>{f.description}</span>
                  </div>
                  <div className="mm-prod__stats">
                    <div><b>{tf(`level.${f.level}`)}</b><span>{k('courses.level')}</span></div>
                    {lessons > 0 && (
                      <div><b><Num value={lessons} source="db" asOf={asOf} showAsOf={false} /></b><span>{k('courses.lessons')}</span></div>
                    )}
                    {price > 0 && (
                      <div>
                        <b><Num value={price} unit="F" source="db" asOf={asOf} showAsOf={false} /></b>
                        <span>{soon ? k('courses.plannedPrice') : k('courses.once')} · <PriceApprox xof={price} /></span>
                      </div>
                    )}
                  </div>
                  <div className="mm-prod__cta">
                    {soon ? (
                      /* État « indisponible » : contour neutre, pas l'orange plein de l'achat. */
                      <LocalizedLink
                        to={`/formations/${f.slug}`}
                        className="mm-pill is-sm is-plain border border-[color:var(--quiet-brd)] !bg-transparent !text-ink-2 shadow-none"
                      >
                        {k('courses.notify')}
                      </LocalizedLink>
                    ) : (
                      <PillLink to={`/formations/${f.slug}`} small>{k('courses.see')}</PillLink>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <p style={{ textAlign: 'center', margin: '22px 0 0' }}>
          <LocalizedLink to="/formations" className="eg1-hero__link" style={{ color: 'var(--ink)' }}>{k('courses.all_cta')}</LocalizedLink>
        </p>
      </section>

      {/* ── Rysmo IA et le Club ────────────────────────────────────────── */}
      <section className="eg1-wrap is-last-m">
        <div className="eg1-duo">
          <div className="eg1-rysmo dk">
            <div className="mm-mesh m-club" aria-hidden="true"><b /><b /><b /></div>
            <div className="eg1-rysmo__head">
              <span className="eg1-rysmo__ico"><Icon name="sparkles" size={20} /></span>
              <div>
                <b>{k('rysmo.title')}</b>
                <span>{k('rysmo.sub')}</span>
              </div>
              <div className="mm-quota" style={{ marginLeft: 'auto' }} aria-hidden="true">
                {Array.from({ length: RYSMO_CLUB_DAILY }, (_, i) => <i key={i} className={i < RYSMO_BASE_DAILY ? 'on' : undefined} />)}
              </div>
            </div>
            <div className="eg1-chat__q">{k('rysmo.demoQ')}</div>
            <div className="eg1-chat__a">{k('rysmo.demoA')}</div>
            <span className="mm-tag is-demo" style={{ alignSelf: 'flex-start' }}>{k('rysmo.demoTag')}</span>
            <LocalizedLink to="/apprendre/assistant" className="eg1-hero__link" style={{ alignSelf: 'flex-start' }}>{k('rysmo.more')}</LocalizedLink>
          </div>
          <div className="eg1-col">
            <div className="eg1-club">
              <span className="mm-eyebrow">{k('club.eyebrow')}</span>
              <b>{k('club.title')}</b>
              <p>{k('club.body', { discount, bonus: RYSMO_CLUB_BONUS })}</p>
              <LocalizedLink to="/club-des-digitos" className="mm-btn is-club is-sm">{k('club.cta')}</LocalizedLink>
            </div>
            <div className="eg1-truth">
              <b>{k('truth.title')}</b>
              <span>{k('truth.body')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── La mission ─────────────────────────────────────────────────── */}
      <section className="eg1-wrap is-last eg1-only-wide">
        <div className="eg1-split is-a">
          <div>
            <span className="mm-eyebrow">{k('mission.eyebrow')}</span>
            <h2 className="mm-d eg1-h2">{k('mission.title')}</h2>
            <p className="eg1-p" style={{ marginBottom: '26px' }}>{k('mission.body')}</p>
            <PillLink to="/apprendre/methode">{k('mission.cta')}</PillLink>
          </div>
          <div className="eg1-photos" aria-hidden="true">
            <div className="mm-photo is-club" />
            <div className="mm-photo is-informe" />
          </div>
        </div>
      </section>

      <EduPreFooter source="edu-accueil" />
    </div>
  );
}
