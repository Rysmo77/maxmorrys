import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon, Skeleton } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import DsNavHost from '../components/layout/DsNavHost';
import { Eyebrow, KitButton, KitSection, NightHero } from '../components/site/v3/kit';
import TranslatedText from '../components/shared/TranslatedText';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useTranslatedText } from '../hooks/useTranslatedContent';
import { getAllFAQ } from '../lib/firestore';
import { faqSlug } from '../lib/faq/slug';
import { queryKeys } from '../lib/queryClient';
import type { FAQ as FAQItem } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA FAQ — maquettes `Site-FAQ` (bureau) / `Site-FAQ-mobile` (390 px), passe 2.
 *
 * Dalle de nuit (titre, chapô, recherche), puis deux colonnes : à gauche les filtres par
 * catégorie et la liste des questions, à droite l'aperçu de la page réponse de la première
 * question retenue. Au mobile, la liste puis l'aperçu dans une carte.
 *
 * Les questions viennent de la base (`getAllFAQ`), les catégories en sont DÉRIVÉES : aucune
 * des étiquettes de la planche (« Démarrer », « Paiement »…) n'est écrite ici.
 *
 * Écarts volontaires à la planche :
 * - « Cette réponse t'a aidé ? » n'est pas rendu : aucun vote n'est enregistré ni lu nulle
 *   part (voir `FAQQuestion.tsx`). Un bouton qui ne compte rien serait une fausse donnée.
 * - « Mis à jour le [DATE] » : le type `FAQ` ne porte aucune date de révision — absent.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Sur la dalle, le fragment entre crochets prend le bleu clair de la planche. */
function BlueAccent({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[([^\]]+)\]/).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-[color:var(--mm-bleu-n)]">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Preview({ item, framed }: { item: FAQItem; framed: boolean }) {
  const { t } = useTranslation('faq');
  const path = useLocalizedPath();
  const question = useTranslatedText(item.question);
  const answer = useTranslatedText(item.answer);
  const paragraphs = answer.split(/\n{2,}/).filter(Boolean);

  return (
    <article className={framed ? 'rounded-xl bg-[color:var(--paper-2)] p-5' : ''}>
      <Eyebrow>{framed ? t('index.previewEyebrow') : t('index.articleEyebrow', { category: item.category })}</Eyebrow>
      <h2 className={`mm-d mb-[18px] mt-[14px] ${framed ? 'text-[30px]' : 'text-[52px]'}`}>{question}</h2>
      {paragraphs.map((p, i) => (
        <p key={i} className={`m-0 mb-4 max-w-[62ch] whitespace-pre-line leading-[1.7] ${framed ? 'text-[16px]' : 'text-[18px]'}`}>
          {p}
        </p>
      ))}
      <div className={`mt-[22px] flex gap-[10px] ${framed ? 'flex-col' : 'flex-wrap'}`}>
        <KitButton href={path('/formations')} tone="edu">{t('index.ctaCourses')}</KitButton>
        <KitButton href={path('/conception')} tone="studio">{t('index.ctaServices')}</KitButton>
        <KitButton href={path('/contact?rdv=1')} tone="ghost">{t('index.ctaCall')}</KitButton>
      </div>
      <div className="mt-[34px] flex items-center gap-3 border-0 border-t border-solid border-[color:var(--line)] pt-5 text-[14px] text-ink-2">
        <a href={path(`/faq/${faqSlug(item)}`)} className="inline-flex items-center gap-2 font-semibold text-ink">
          {t('index.openPage')}
          <Icon name="forward" size={14} />
        </a>
      </div>
    </article>
  );
}

export default function FAQPage() {
  const { t } = useTranslation('faq');
  const path = useLocalizedPath();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const { data: faqs = null } = useQuery({
    queryKey: queryKeys.faq,
    queryFn: () => getAllFAQ(),
  });

  const categories = useMemo(() => [...new Set((faqs ?? []).map((f) => f.category).filter(Boolean))], [faqs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (faqs ?? []).filter((item) => {
      const matchesCategory = !category || item.category === category;
      const matchesSearch = !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [faqs, category, search]);

  const featured = filtered[0];
  const titleLines = t('index.titleLines', { returnObjects: true }) as string[];

  const chips = (
    <div className="mm-chips mb-2 flex-nowrap overflow-x-auto wide:flex-wrap" role="group" aria-label={t('index.filtersLabel')}>
      {['', ...categories].map((c) => (
        <button key={c || 'all'} type="button" className="mm-chip flex-none" aria-pressed={category === c} onClick={() => setCategory(c)}>
          {c || t('index.filterAll')}
        </button>
      ))}
    </div>
  );

  return (
    <DsNavHost>
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

      <NightHero mesh="edu">
        <div className="relative z-[1] mx-auto box-border max-w-[1360px] px-5 pb-[30px] pt-9 wide:px-10 wide:pb-16 wide:pt-[110px]">
          <span className="mm-eyebrow text-[color:var(--mm-bleu-c)]">{t('index.eyebrow')}</span>
          <h1 className="mm-d mb-[14px] mt-[14px] text-[52px] leading-[.9] wide:mb-[22px] wide:mt-5 wide:text-[clamp(56px,7.4vw,112px)] wide:leading-[.88] wide:tracking-[-.05em]">
            {titleLines.map((l, i) => (
              <span key={i}>
                {i > 0 && <br className="hidden wide:inline" />}
                {i > 0 && <span className="wide:hidden"> </span>}
                <BlueAccent text={l} />
              </span>
            ))}
          </h1>
          <p className="m-0 mb-[22px] max-w-[52ch] text-[15.5px] leading-[1.55] text-ink-2 wide:mb-[26px] wide:text-[18px]">{t('index.lede')}</p>
          <div className="mm-field max-w-[560px]">
            <div className="mm-field__box">
              <input
                id="faq-search"
                type="search"
                placeholder=" "
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="!border-transparent !bg-[color:rgb(255_255_255/.95)] !text-[color:var(--ink-fixed)]"
              />
              <label htmlFor="faq-search" className="!text-[color:var(--ink-fixed)] opacity-70">{t('index.searchLabel')}</label>
            </div>
          </div>
        </div>
      </NightHero>

      <KitSection className="pt-11 wide:pt-[72px]">
        {faqs === null ? (
          <div className="grid gap-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={50} radius="var(--r-m)" />)}
          </div>
        ) : (
          <div className="grid items-start gap-10 wide:grid-cols-[380px_minmax(0,1fr)]">
            <nav aria-label={t('index.listLabel')} className="flex flex-col gap-2 wide:sticky wide:top-[calc(var(--header-h)+24px)]">
              {chips}
              {filtered.length === 0 ? (
                <p className="m-0 text-[15px] text-ink-2">{t('index.empty')}</p>
              ) : (
                filtered.map((item) => {
                  const current = item.id === featured?.id;
                  return (
                    <a
                      key={item.id}
                      href={path(`/faq/${faqSlug(item)}`)}
                      aria-current={current ? 'page' : undefined}
                      className={[
                        'flex items-center justify-between gap-[10px] rounded-card px-4 py-[14px] text-[15px] font-semibold no-underline',
                        current
                          ? 'wide:bg-[color:var(--surface-ink)] wide:text-[color:var(--paper-fixed)] border border-solid border-[color:var(--line)] bg-bento text-ink wide:border-transparent'
                          : 'border border-solid border-[color:var(--line)] bg-bento text-ink',
                      ].join(' ')}
                    >
                      <TranslatedText text={item.question} />
                    </a>
                  );
                })
              )}
              <a href={path('/contact')} className="mt-3 text-[14px] font-semibold text-ink-2">
                {t('index.contactLink')}
              </a>
            </nav>
            {featured && (
              <>
                <div className="hidden wide:block">
                  <Preview item={featured} framed={false} />
                </div>
                <div className="wide:hidden">
                  <Preview item={featured} framed />
                </div>
              </>
            )}
          </div>
        )}
      </KitSection>
    </DsNavHost>
  );
}
