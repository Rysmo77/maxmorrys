import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SOCIAL_URLS } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { Eyebrow, KitButton, KitH2, KitSection, NightAccent, NightHero, Photo } from '../components/site/v3/kit';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { HOUSE_AUTHOR_FULL_NAME, portrait } from '../lib/author';
import { CHAPTERS, MILESTONE_PROOFS } from '../lib/about/milestones';
import { legalEntity, ventures } from '../lib/brand';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MON PARCOURS — LA MAQUETTE `Site-Parcours` (bureau) / `-mobile` (390 px), PASSE 2.
 *
 * ⚠️ DÉCISIONS LEVÉES (29/10/2026, « maquettes + DS + PRD rév. 6 font foi ») : l'ancienne
 * page « Je suis Max-Morrys » (deux pistes, décompte en base, arbre MY ONOMA, « Où me
 * trouver ») est remplacée par l'ordre de la planche — dalle, étapes, outils, projets
 * propres, convictions, appel.
 *
 * Ce qui diffère de la planche, et pourquoi :
 * - LA FRISE vient des jalons DÉCLARÉS (`about.json → milestones`, empreinte gardée par
 *   `proof:check`), pas des dates de la planche, qui portaient « dates à valider ». Les onze
 *   jalons sont rendus dans l'ordre de `CHAPTERS` ; « Vérifier » n'apparaît que sur un jalon
 *   qui a une preuve publique (`MILESTONE_PROOFS`).
 * - « plus de vingt personnes formées » n'a pas de source : non repris.
 * - « edu.maxmorrys.me » : il n'y a pas de sous-domaine — la ligne dit « la plateforme ».
 * - NAYO n'a pas de description validée : sa carte montre le nom et le domaine, rien d'autre.
 * - Le portrait est réel (`portrait`) ; la pastille flottante reprend un jalon déclaré.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const DOTS = ['var(--mm-bleu)', 'var(--mm-orange)', 'var(--mm-violet)', 'var(--mm-teal)'] as const;
const MILESTONE_KEYS = CHAPTERS.flatMap((c) => c.items as readonly string[]);

interface Milestone {
  year: string;
  lieu: string;
  title: string;
  desc: string;
}

export default function About() {
  const { t } = useTranslation('about');
  const { t: tShared } = useTranslation('shared');
  const path = useLocalizedPath();

  const milestones = t('milestones', { returnObjects: true }) as Record<string, Milestone>;
  const badge = milestones.m2023Master;
  // Garde de type : tant que le namespace n'est pas enregistré dans la langue active,
  // `returnObjects` rend la CLÉ (une chaîne) — un `.map` dessus faisait planter `/en/about`.
  const asList = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
  const skills = asList(t('skills.items', { returnObjects: true }));

  return (
    <DsNavHost>
      <SEOHead title={t('seo.title')} description={t('seo.description')} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: HOUSE_AUTHOR_FULL_NAME,
        url: `${SITE_URL}/a-propos`,
        image: `${SITE_URL}${portrait.src}`,
        jobTitle: 'Marketing & Growth Manager',
        worksFor: { '@type': 'Organization', name: 'Eyone Medical' },
        address: { '@type': 'PostalAddress', addressLocality: legalEntity.city, addressCountry: legalEntity.countryCode },
        sameAs: [...SOCIAL_URLS],
      }} />

      {/* ── 1 · LA DALLE ─────────────────────────────────────────────────────── */}
      <NightHero mesh="club">
        <div className="relative z-[1] mx-auto box-border grid w-full max-w-[1360px] items-end gap-10 px-5 pb-10 pt-6 wide:grid-cols-2 wide:px-10 wide:pb-16 wide:pt-[72px]">
          <div>
            <Eyebrow className="text-[color:var(--mm-violet-c)]">{t('hero.eyebrow')}</Eyebrow>
            <h1 className="mm-d m-0 mb-[22px] mt-5 text-[56px] leading-[.86] tracking-[-.05em] wide:text-[clamp(60px,8vw,120px)]">
              {asList(t('hero.titleLines', { returnObjects: true })).map((line, i) => (
                <span key={line}>
                  {i > 0 && ' '}
                  {i > 0 && <br />}
                  <NightAccent text={line} />
                </span>
              ))}
            </h1>
            <p className="m-0 max-w-[48ch] text-[15.5px] leading-[1.55] text-ink-2 stack:hidden">{t('hero.ledeShort')}</p>
            <p className="m-0 hidden max-w-[48ch] text-[18px] leading-[1.55] text-ink-2 stack:block">{t('hero.lede')}</p>
          </div>
          <div className="relative h-[300px] stack:h-[460px]">
            <Photo
              tone="club"
              className="!absolute inset-0 !rounded-xl"
              img={{ src: portrait.src, srcSet: portrait.srcSet, sizes: '(min-width: 1080px) 640px, 100vw', width: portrait.width, height: portrait.height, alt: tShared('portrait.alt'), eager: true }}
            />
            {badge && (
              <div className="mm-float bottom-[50px] left-[-30px] hidden text-ink wide:flex">
                <span className="mm-avatar sm bg-[image:var(--action-forme)] text-[color:var(--paper-fixed)]">
                  <Icon name="graduation" size={14} />
                </span>
                <span>
                  <b>{badge.title}</b>
                  {badge.year}
                </span>
              </div>
            )}
          </div>
        </div>
      </NightHero>

      {/* ── 2 · LES ÉTAPES (jalons déclarés) ─────────────────────────────────── */}
      <KitSection width={1100} className="pt-14 wide:pt-24">
        <Eyebrow>{t('steps.eyebrow')}</Eyebrow>
        <KitH2 className="mb-6 mt-3 wide:mb-8 wide:mt-[14px]">{t('steps.title')}</KitH2>
        <ol className="m-0 list-none p-0">
          {MILESTONE_KEYS.map((key, i) => {
            const m = milestones[key];
            if (!m) return null;
            const proof = MILESTONE_PROOFS[key];
            return (
              <li key={key} className="grid grid-cols-[14px_1fr] gap-x-4 pb-6 stack:grid-cols-[140px_28px_1fr] stack:gap-x-[18px] stack:pb-[30px]">
                <span className="mm-n col-start-2 row-start-1 text-[13px] font-semibold text-ink-2 stack:col-start-1 stack:text-right stack:text-[14px]">{m.year}</span>
                <span
                  aria-hidden="true"
                  className="col-start-1 row-span-2 row-start-1 mt-1 h-[14px] w-[14px] rounded-pill stack:col-start-2 stack:mx-auto"
                  style={{ background: DOTS[i % DOTS.length], boxShadow: `0 0 0 5px color-mix(in srgb, ${DOTS[i % DOTS.length]} 18%, transparent)` }}
                />
                <div className="col-start-2 stack:col-start-3 stack:row-start-1">
                  <b className="block font-display text-[20px] font-black leading-[1.05] stack:text-[24px]">{m.title}</b>
                  <p className="m-0 mt-[6px] text-ink-2">
                    <span className="hidden stack:inline">{m.desc} </span>
                    <span className="text-ink-2">{m.lieu}</span>
                    {proof && (
                      <>
                        {' · '}
                        <a href={proof} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline">{t('steps.verify')} ↗</a>
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
          <li className="grid grid-cols-[14px_1fr] gap-x-4 stack:grid-cols-[140px_28px_1fr] stack:gap-x-[18px]">
            <span className="mm-n col-start-2 row-start-1 text-[13px] font-semibold text-[color:var(--mm-violet)] stack:col-start-1 stack:text-right stack:text-[14px]">{t('steps.todayLabel')}</span>
            <span aria-hidden="true" className="col-start-1 row-span-2 row-start-1 mt-1 h-[14px] w-[14px] rounded-pill bg-ink stack:col-start-2 stack:mx-auto" style={{ boxShadow: '0 0 0 5px var(--fill-2)' }} />
            <div className="col-start-2 stack:col-start-3 stack:row-start-1">
              <b className="block font-display text-[20px] font-black leading-[1.05] stack:text-[24px]">{t('steps.todayTitle')}</b>
              <p className="m-0 mt-[6px] text-ink-2">{t('steps.todayBody')}</p>
            </div>
          </li>
        </ol>
      </KitSection>

      {/* ── 3 · MES OUTILS ───────────────────────────────────────────────────── */}
      <KitSection className="grid items-start gap-6 pt-14 wide:grid-cols-2 wide:pt-24">
        <div>
          <Eyebrow className="stack:hidden">{t('skills.eyebrowShort')}</Eyebrow>
          <Eyebrow className="hidden stack:inline-flex">{t('skills.eyebrow')}</Eyebrow>
          <KitH2 className="mb-[18px] mt-[14px] hidden stack:block" size="clamp(40px, 5vw, 60px)">{t('skills.title')}</KitH2>
          <p className="m-0 hidden max-w-[46ch] text-ink-2 stack:block">{t('skills.lede')}</p>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {skills.map((s) => (
            <li key={s} className="mm-chip cursor-default">{s}</li>
          ))}
          <li className="mm-chip cursor-default" aria-current="true" data-pressed="true" style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
            {t('skills.highlight')}
          </li>
        </ul>
      </KitSection>

      {/* ── 4 · MES PROPRES PROJETS (ventures MY ONOMA) ──────────────────────── */}
      {/* Audit 29/10/2026 : le texte secondaire était en `--ink-3` à 11–12,5 px sur le pastel
          `--paper-2` — l'encre tertiaire ne porte pas de texte (AD-18). Passé en `--ink-2`, 13–14,5 px. */}
      <KitSection className="pt-14 wide:pt-24">
        <div className="rounded-xl stack:bg-[color:var(--paper-2)] stack:p-10">
          <Eyebrow className="stack:hidden">{t('ventures.eyebrowShort')}</Eyebrow>
          <Eyebrow className="hidden stack:inline-flex">{t('ventures.eyebrow')}</Eyebrow>
          <KitH2 className="mb-[26px] mt-[14px] hidden stack:block" size="clamp(40px, 5vw, 60px)">{t('ventures.title')}</KitH2>
          <div className="mt-4 grid gap-[10px] stack:mt-0 stack:grid-cols-3 stack:gap-[14px]">
            {ventures.map((v) => {
              const desc = t(`ventures.items.${v.slug}`, { defaultValue: '' });
              return (
                <a key={v.slug} href={v.website} target="_blank" rel="noopener noreferrer" className="mm-bento flex flex-col gap-[10px] text-ink no-underline stack:min-h-[220px]">
                  <span className="mm-n hidden text-[13px] text-ink-2 stack:block">{v.domain}</span>
                  <b className="font-display text-[22px] font-black leading-none stack:text-[30px]">{t(`ventures.names.${v.slug}`, { defaultValue: v.name })}</b>
                  {desc ? <p className="m-0 text-[15px] leading-[1.5] text-ink-2">{desc}</p> : <span className="mm-n text-[13px] text-ink-2 stack:hidden">{v.domain}</span>}
                </a>
              );
            })}
          </div>
          <p className="m-0 mt-4 hidden text-[14.5px] leading-[1.55] text-ink-2 stack:block">{t('ventures.note')}</p>
        </div>
      </KitSection>

      {/* ── 5 · CE QUE JE CROIS ──────────────────────────────────────────────── */}
      <KitSection className="pt-14 wide:pt-24">
        <Eyebrow>{t('beliefs.eyebrow')}</Eyebrow>
        <div className="mt-5 grid gap-[10px] stack:grid-cols-3 stack:gap-[14px]">
          {[1, 2, 3].map((n) => {
            const accent = n === 1;
            return (
              <div
                key={n}
                className={[
                  'flex flex-col gap-3 rounded-xl p-[22px] stack:min-h-[220px] stack:p-7',
                  accent ? 'bg-[color:var(--mm-violet)] text-[color:var(--paper-fixed)]' : 'mm-bento',
                ].join(' ')}
              >
                <span className={`mm-n hidden text-[13px] stack:block ${accent ? 'opacity-80' : 'text-ink-2'}`}>{String(n).padStart(2, '0')}</span>
                <b className="font-display text-[24px] font-black leading-[1.02] stack:text-[30px]">{t(`beliefs.b${n}Title`)}</b>
                <p className={`m-0 hidden stack:block ${accent ? 'opacity-[.88]' : 'text-ink-2'}`}>{t(`beliefs.b${n}Body`)}</p>
              </div>
            );
          })}
        </div>
        <KitButton href={path('/contact?rdv=1')} tone="club" className="mt-6 stack:hidden">{t('cta.buttonShort')}</KitButton>
      </KitSection>

      {/* ── 6 · L'APPEL ──────────────────────────────────────────────────────── */}
      <KitSection className="hidden pt-24 stack:block">
        <div className="dk relative isolate flex min-h-[380px] items-end overflow-hidden rounded-xl">
          <Photo tone="edu" className="!absolute inset-0 !rounded-none" />
          <span aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(10,13,17,.8),rgba(10,13,17,0) 70%)' }} />
          <div className="relative z-[1] p-11">
            <KitH2 className="mb-[22px] text-ink" size="clamp(44px, 5vw, 72px)">{t('cta.title')}</KitH2>
            <KitButton href={path('/contact?rdv=1')} tone="highlight" arrow>{t('cta.button')}</KitButton>
          </div>
        </div>
      </KitSection>
    </DsNavHost>
  );
}
