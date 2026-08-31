import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import Input from '../ui/Input';
import { cn } from '../../lib/utils';
import { Icon } from '@ds';

interface SEOPanelProps {
  // Données de base pour l'analyse (lecture seule)
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  siteUrl: string;
  basePath: string;
  // Champs éditables
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex: boolean;
  canonicalUrl: string;
  onChange: (field: string, value: string | boolean) => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '');
}

type CheckResult = {
  labelKey: string;
  pass: boolean;
  severity: 'red' | 'orange';
};

function useChecks(props: SEOPanelProps): { checks: CheckResult[]; score: number } {
  return useMemo(() => {
    const {
      focusKeyword, metaTitle, metaDescription, slug, content, excerpt, title,
    } = props;

    const kw = focusKeyword.trim().toLowerCase();
    const effectiveTitle = (metaTitle.trim() || title).toLowerCase();
    const effectiveDesc = (metaDescription.trim() || excerpt || '').toLowerCase();
    const plainContent = stripMarkdown(content).toLowerCase();
    const first100Words = plainContent.split(/\s+/).slice(0, 100).join(' ');
    const wordCount = countWords(plainContent);
    const metaTitleLen = (metaTitle.trim() || title).length;
    const metaDescLen = (metaDescription.trim() || excerpt || '').length;

    const checks: CheckResult[] = [
      {
        labelKey: 'seo.checks.keyphraseSet',
        pass: kw.length > 0,
        severity: 'red',
      },
      {
        labelKey: 'seo.checks.keyphraseInTitle',
        pass: kw.length > 0 && effectiveTitle.includes(kw),
        severity: 'orange',
      },
      {
        labelKey: 'seo.checks.keyphraseInDesc',
        pass: kw.length > 0 && effectiveDesc.includes(kw),
        severity: 'orange',
      },
      {
        labelKey: 'seo.checks.keyphraseInSlug',
        pass: kw.length > 0 && slug.toLowerCase().includes(kw.replace(/\s+/g, '-')),
        severity: 'orange',
      },
      {
        labelKey: 'seo.checks.keyphraseInFirst100',
        pass: kw.length > 0 && first100Words.includes(kw),
        severity: 'orange',
      },
      {
        labelKey: 'seo.checks.titleLength',
        pass: metaTitleLen >= 50 && metaTitleLen <= 60,
        severity: 'orange',
      },
      {
        labelKey: 'seo.checks.descLength',
        pass: metaDescLen >= 120 && metaDescLen <= 160,
        severity: 'orange',
      },
      {
        labelKey: 'seo.checks.contentLength',
        pass: wordCount >= 300,
        severity: 'orange',
      },
      {
        labelKey: 'seo.checks.excerptSet',
        pass: (excerpt ?? '').trim().length > 0,
        severity: 'red',
      },
      {
        labelKey: 'seo.checks.descDistinct',
        pass: effectiveDesc.length > 0 && effectiveDesc !== effectiveTitle,
        severity: 'orange',
      },
    ];

    const points = [15, 10, 10, 10, 10, 10, 15, 10, 5, 5];
    const score = checks.reduce((total, check, i) => total + (check.pass ? points[i] : 0), 0);

    return { checks, score };
  }, [props]);
}

function ScoreRing({ score, t }: { score: number; t: TFunction }) {
  const color = score >= 71 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-stop';
  const bg = score >= 71 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : score >= 40 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-[color-mix(in_srgb,var(--stop)_4%,transparent)] border-[color-mix(in_srgb,var(--stop)_18%,transparent)]';
  const label = score >= 71 ? t('seo.scoreGood') : score >= 40 ? t('seo.scoreFair') : t('seo.scorePoor');
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold', bg, color)}>
      <span className="text-base font-black">{score}</span>
      <span>{t('seo.scoreSuffix')}</span>
      <span className="text-xs font-semibold opacity-80">— {label}</span>
    </div>
  );
}

function CheckItem({ check, t }: { check: CheckResult; t: TFunction }) {
  if (check.pass) {
    return (
      <li className="flex items-start gap-2 text-sm text-ink-2">
        <Icon name="check-circle" size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
        {t(check.labelKey)}
      </li>
    );
  }
  if (check.severity === 'red') {
    return (
      <li className="flex items-start gap-2 text-sm text-ink-2">
        <Icon name="x-circle" size={16} className="text-stop flex-shrink-0 mt-0.5" />
        {t(check.labelKey)}
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2 text-sm text-ink-2">
      <Icon name="alert-circle" size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
      {t(check.labelKey)}
    </li>
  );
}

function CounterBadge({ value, min, max }: { value: number; min: number; max: number }) {
  const color =
    value >= min && value <= max
      ? 'text-green-600 dark:text-green-400'
      : value >= min - 10 && value <= max + 10
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-stop';
  return (
    <span className={cn('text-xs font-medium tabular-nums', color)}>
      {value}/{max}
    </span>
  );
}

function MetaDescProgress({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    value >= 120 && value <= 160 ? 'bg-green-500' : value >= 100 ? 'bg-amber-500' : 'bg-[color:var(--stop)]';
  return (
    <div className="h-1 w-full rounded-full bg-[color:var(--fill-3)] overflow-hidden mt-1">
      <div className={cn('h-full rounded-full prog-fill transition-[width] duration-200', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

type SerpTab = 'desktop' | 'mobile';
type SocialTab = 'facebook' | 'twitter';

export default function SEOPanel(props: SEOPanelProps) {
  const {
    title, slug, excerpt, coverImage, siteUrl, basePath,
    focusKeyword, metaTitle, metaDescription,
    ogTitle, ogDescription, ogImage,
    twitterTitle, twitterDescription, twitterImage,
    noIndex, canonicalUrl,
    onChange,
  } = props;

  const { t } = useTranslation('shared');
  const [serpTab, setSerpTab] = useState<SerpTab>('desktop');
  const [socialTab, setSocialTab] = useState<SocialTab>('facebook');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { checks, score } = useChecks(props);

  // Valeurs effectives affichées dans les aperçus
  const displayTitle = truncate(metaTitle.trim() || title, 60);
  const displayDesc = truncate(metaDescription.trim() || excerpt || '', 160);
  const displayUrl = `${siteUrl}/${basePath}/${slug || 'mon-article'}`;

  const ogDisplayTitle = ogTitle.trim() || metaTitle.trim() || title;
  const ogDisplayDesc = ogDescription.trim() || excerpt || '';
  const ogDisplayImage = ogImage.trim() || coverImage || '';

  const twDisplayTitle = twitterTitle?.trim() || ogDisplayTitle;
  const twDisplayDesc = twitterDescription?.trim() || ogDisplayDesc;
  const twDisplayImage = twitterImage?.trim() || ogDisplayImage;

  const hasTwitter = twitterTitle !== undefined;

  return (
    <div className="space-y-5">

      {/* ── A — Keyphrase cible ── */}
      <div className="rounded-2xl border border-[color:var(--line)] bg-paper p-5">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-ink-2 mb-3">{t('seo.keyphraseSection')}</p>
        <div className="space-y-1.5">
          <label htmlFor="seo-focus-keyword" className="block text-sm font-medium text-ink-2">
            {t('seo.focusKeywordLabel')}
          </label>
          <div className="relative">
            <Icon name="target" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" />
            <input
              id="seo-focus-keyword"
              type="text"
              value={focusKeyword}
              onChange={(e) => onChange('focusKeyword', e.target.value)}
              placeholder={t('seo.focusKeywordPlaceholder')}
              className="w-full rounded-xl border border-[color:var(--line)] bg-paper pl-10 pr-4 py-2.5 text-sm text-ink transition-colors focus:border-forme focus:ring-2 focus:outline-none dark:focus:border-forme"
            />
          </div>
          <p className="text-xs text-ink-2">{t('seo.focusKeywordHelp')}</p>
        </div>
      </div>

      {/* ── B — Score SEO ── */}
      <div className="rounded-2xl border border-[color:var(--line)] bg-paper p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-ink-2">{t('seo.analysisSection')}</p>
          <ScoreRing score={score} t={t} />
        </div>
        <ul className="space-y-2">
          {checks.map((check, i) => <CheckItem key={i} check={check} t={t} />)}
        </ul>
      </div>

      {/* ── C — Champs Meta ── */}
      <div className="rounded-2xl border border-[color:var(--line)] bg-paper p-5 space-y-4">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-ink-2">{t('seo.metaSection')}</p>

        {/* SEO Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="seo-slug" className="block text-sm font-medium text-ink-2">
              {t('seo.seoTitleLabel')}
            </label>
            <CounterBadge value={(metaTitle.trim() || title).length} min={50} max={60} />
          </div>
          <input
            id="seo-slug"
            type="text"
            value={metaTitle}
            onChange={(e) => onChange('metaTitle', e.target.value)}
            placeholder={title || t('seo.seoTitlePlaceholder')}
            className="w-full rounded-xl border border-[color:var(--line)] bg-paper px-4 py-2.5 text-sm text-ink transition-colors focus:border-forme focus:ring-2 focus:outline-none dark:focus:border-forme"
          />
          {!metaTitle.trim() && (
            <p className="text-xs text-ink-2 italic">{t('seo.useTitleFallback')}</p>
          )}
        </div>

        {/* Meta Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="seo-meta-description" className="block text-sm font-medium text-ink-2">
              {t('seo.metaDescLabel')}
            </label>
            <CounterBadge value={(metaDescription.trim() || excerpt || '').length} min={120} max={160} />
          </div>
          <textarea
            id="seo-meta-description"
            value={metaDescription}
            onChange={(e) => onChange('metaDescription', e.target.value)}
            placeholder={excerpt || t('seo.metaDescPlaceholder')}
            rows={3}
            className="w-full rounded-xl border border-[color:var(--line)] bg-paper px-4 py-2.5 text-sm text-ink transition-colors resize-y focus:border-forme focus:ring-2 focus:outline-none dark:focus:border-forme"
          />
          <MetaDescProgress value={(metaDescription.trim() || excerpt || '').length} max={160} />
        </div>
      </div>

      {/* ── D — Aperçu SERP ── */}
      <div className="rounded-2xl border border-[color:var(--line)] bg-paper p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-ink-2">{t('seo.googlePreview')}</p>
          <div className="flex gap-1">
            {([['desktop', 'monitor'], ['mobile', 'smartphone']] as const).map(([tab, glyph]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSerpTab(tab)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  serpTab === tab
                    ? 'bg-[color:var(--night-3)] text-white'
                    : 'text-ink-2 hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)]'
                )}
              >
                <Icon name={glyph} size={14} />
                {tab === 'desktop' ? t('seo.desktop') : t('seo.mobile')}
              </button>
            ))}
          </div>
        </div>

        <div className={cn('bg-paper dark:bg-[color:var(--night-3)] rounded-xl border border-[color:var(--border-hair)] p-4', serpTab === 'mobile' && 'max-w-[340px] mx-auto')}>
          {/* URL */}
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="globe" size={14} className="text-ink-2 flex-shrink-0" />
            <p className="text-xs text-[#006621] dark:text-green-500 truncate">{displayUrl}</p>  // ok-ds — bleu et vert officiels d'un résultat Google — aperçu SERP
          </div>
          {/* Title */}
          <p
            className="font-medium mb-1 leading-snug cursor-pointer hover:underline"
            style={{ color: '#1a0dab', fontSize: serpTab === 'desktop' ? '20px' : '16px' }}  // ok-ds — bleu et vert officiels d'un résultat Google — aperçu SERP
          >
            {displayTitle || t('seo.previewTitleFallback')}
          </p>
          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: '#545454', fontSize: '14px' }}>  // ok-ds — bleu et vert officiels d'un résultat Google — aperçu SERP
            {displayDesc || t('seo.previewDescFallback')}
          </p>
        </div>
      </div>

      {/* ── E — Réseaux sociaux ── */}
      <div className="rounded-2xl border border-[color:var(--line)] bg-paper p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-ink-2">{t('seo.socialSection')}</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSocialTab('facebook')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                socialTab === 'facebook'
                  ? 'bg-[color:var(--night-3)] text-white'
                  : 'text-ink-2 hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)]'
              )}
            >
              Facebook / OG
            </button>
            {hasTwitter && (
              <button
                type="button"
                onClick={() => setSocialTab('twitter')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  socialTab === 'twitter'
                    ? 'bg-[color:var(--night-3)] text-white'
                    : 'text-ink-2 hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)]'
                )}
              >
                Twitter / X
              </button>
            )}
          </div>
        </div>

        {socialTab === 'facebook' && (
          <div className="space-y-4">
            {/* Card Facebook */}
            <div className="rounded-xl overflow-hidden border border-[color:var(--line)] bg-[color:var(--fill-1)] dark:bg-[color:var(--night-3)]">
              {ogDisplayImage ? (
                <img src={ogDisplayImage} alt="OG preview" className="w-full aspect-[1.91/1] object-cover" />
              ) : (
                <div className="w-full aspect-[1.91/1] bg-[color:var(--fill-3)] flex items-center justify-center">
                  <p className="text-xs text-ink-2">{t('seo.noImageUseCover')}</p>
                </div>
              )}
              <div className="p-3 border-t border-[color:var(--line)]">
                <p className="text-[10px] uppercase tracking-widest text-ink-2 mb-1">
                  {siteUrl.replace('https://', '')}
                </p>
                <p className="text-sm font-bold text-ink leading-snug line-clamp-2">
                  {ogDisplayTitle || t('seo.ogTitleFallback')}
                </p>
                <p className="text-xs text-ink-2 mt-1 line-clamp-2">
                  {ogDisplayDesc || t('seo.ogDescFallback')}
                </p>
              </div>
            </div>
            {/* Inputs OG */}
            <Input
              label={t('seo.ogTitleLabel')}
              value={ogTitle}
              onChange={(e) => onChange('ogTitle', e.target.value)}
              placeholder={metaTitle.trim() || title || t('seo.ogTitlePlaceholder')}
            />
            <div className="space-y-1.5">
              <label htmlFor="seo-og-description" className="block text-sm font-medium text-ink-2">{t('seo.ogDescriptionLabel')}</label>
              <textarea
                id="seo-og-description"
                value={ogDescription}
                onChange={(e) => onChange('ogDescription', e.target.value)}
                placeholder={excerpt || t('seo.ogDescPlaceholder')}
                rows={2}
                className="w-full rounded-xl border border-[color:var(--line)] bg-paper px-4 py-2.5 text-sm text-ink transition-colors resize-y focus:border-forme focus:ring-2 focus:outline-none dark:focus:border-forme"
              />
            </div>
            <Input
              label={t('seo.ogImageLabel')}
              value={ogImage}
              onChange={(e) => onChange('ogImage', e.target.value)}
              placeholder={coverImage || t('seo.ogImagePlaceholder')}
            />
          </div>
        )}

        {socialTab === 'twitter' && hasTwitter && (
          <div className="space-y-4">
            {/* Card Twitter summary_large_image */}
            <div className="rounded-xl overflow-hidden border border-[color:var(--line)] bg-[color:var(--fill-1)] dark:bg-[color:var(--night-3)]">
              {twDisplayImage ? (
                <img src={twDisplayImage} alt="Twitter preview" className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video bg-[color:var(--fill-3)] flex items-center justify-center">
                  <p className="text-xs text-ink-2">{t('seo.noImage')}</p>
                </div>
              )}
              <div className="p-3 border-t border-[color:var(--line)]">
                <p className="text-sm font-bold text-ink leading-snug line-clamp-1">
                  {twDisplayTitle || t('seo.twTitleFallback')}
                </p>
                <p className="text-xs text-ink-2 mt-0.5 line-clamp-2">
                  {twDisplayDesc || t('seo.twDescFallback')}
                </p>
                <p className="text-[10px] text-ink-2 mt-1">{siteUrl.replace('https://', '')}</p>
              </div>
            </div>
            {/* Inputs Twitter */}
            <Input
              label={t('seo.twitterTitleLabel')}
              value={twitterTitle ?? ''}
              onChange={(e) => onChange('twitterTitle', e.target.value)}
              placeholder={ogDisplayTitle || t('seo.twitterTitlePlaceholder')}
            />
            <div className="space-y-1.5">
              <label htmlFor="seo-twitter-description" className="block text-sm font-medium text-ink-2">{t('seo.twitterDescriptionLabel')}</label>
              <textarea
                id="seo-twitter-description"
                value={twitterDescription ?? ''}
                onChange={(e) => onChange('twitterDescription', e.target.value)}
                placeholder={ogDisplayDesc || t('seo.twitterDescPlaceholder')}
                rows={2}
                className="w-full rounded-xl border border-[color:var(--line)] bg-paper px-4 py-2.5 text-sm text-ink transition-colors resize-y focus:border-forme focus:ring-2 focus:outline-none dark:focus:border-forme"
              />
            </div>
            <Input
              label={t('seo.twitterImageLabel')}
              value={twitterImage ?? ''}
              onChange={(e) => onChange('twitterImage', e.target.value)}
              placeholder={ogDisplayImage || t('seo.twitterImagePlaceholder')}
            />
          </div>
        )}
      </div>

      {/* ── F — Avancé (collapsible) ── */}
      <div className="rounded-2xl border border-[color:var(--line)] bg-paper overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[color:var(--fill-1)] dark:hover:bg-[color-mix(in_srgb,var(--night-3)_40%,transparent)] transition-colors"
        >
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-ink-2">{t('seo.advancedSection')}</p>
          {advancedOpen
            ? <Icon name="chevron-up" size={16} className="text-ink-2" />
            : <Icon name="chevron" size={16} className="text-ink-2" />}
        </button>

        {advancedOpen && (
          <div className="px-5 pb-5 space-y-5 border-t border-[color:var(--border-hair)] pt-4">
            {/* Canonical URL */}
            <Input
              label={t('seo.canonicalLabel')}
              value={canonicalUrl}
              onChange={(e) => onChange('canonicalUrl', e.target.value)}
              placeholder={`${siteUrl}/${basePath}/${slug || 'mon-article'}`}
            />
            <p className="text-xs text-ink-2 -mt-3">
              {t('seo.canonicalHelp')}
            </p>

            {/* noIndex toggle */}
            <div>
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[color:var(--fill-1)]">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {t('seo.noindexTitle')}
                  </p>
                  <p className="text-xs text-ink-2 mt-0.5">
                    {t('seo.noindexDesc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange('noIndex', !noIndex)}
                  className={cn(
                    'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                    noIndex ? 'bg-[color:var(--stop)]' : 'bg-[color:var(--fill-4)]'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-paper shadow transform transition-transform duration-200',
                      noIndex ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
              {noIndex && (
                <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-[color-mix(in_srgb,var(--stop)_4%,transparent)] border border-[color-mix(in_srgb,var(--stop)_18%,transparent)]">
                  <Icon name="alert" size={16} className="text-stop flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-stop">
                    {t('seo.noindexWarning')}
                  </p>
                </div>
              )}
            </div>

            {/* Robots preview */}
            <div>
              <p className="text-xs font-medium text-ink-2 mb-1.5">{t('seo.robotsTagLabel')}</p>
              <code className="block text-xs bg-[color:var(--fill-2)] dark:bg-[color:var(--night-3)] text-ink-2 px-3 py-2 rounded-lg font-mono">
                {`<meta name="robots" content="${noIndex ? 'noindex,nofollow' : 'index,follow'}">`}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
