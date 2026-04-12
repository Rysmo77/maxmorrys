import { useMemo, useState } from 'react';
import {
  Target, CheckCircle2, AlertCircle, XCircle,
  Monitor, Smartphone, ChevronDown, ChevronUp,
  Globe, AlertTriangle,
} from 'lucide-react';
import Input from '../ui/Input';
import { cn } from '../../lib/utils';

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
  label: string;
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
        label: 'Keyphrase cible renseignée',
        pass: kw.length > 0,
        severity: 'red',
      },
      {
        label: 'Keyphrase dans le titre SEO',
        pass: kw.length > 0 && effectiveTitle.includes(kw),
        severity: 'orange',
      },
      {
        label: 'Keyphrase dans la meta description',
        pass: kw.length > 0 && effectiveDesc.includes(kw),
        severity: 'orange',
      },
      {
        label: 'Keyphrase dans le slug (URL)',
        pass: kw.length > 0 && slug.toLowerCase().includes(kw.replace(/\s+/g, '-')),
        severity: 'orange',
      },
      {
        label: 'Keyphrase dans les 100 premiers mots',
        pass: kw.length > 0 && first100Words.includes(kw),
        severity: 'orange',
      },
      {
        label: 'Titre SEO : 50 à 60 caractères',
        pass: metaTitleLen >= 50 && metaTitleLen <= 60,
        severity: 'orange',
      },
      {
        label: 'Meta description : 120 à 160 caractères',
        pass: metaDescLen >= 120 && metaDescLen <= 160,
        severity: 'orange',
      },
      {
        label: 'Contenu suffisant (≥ 300 mots)',
        pass: wordCount >= 300,
        severity: 'orange',
      },
      {
        label: 'Extrait / description renseigné',
        pass: (excerpt ?? '').trim().length > 0,
        severity: 'red',
      },
      {
        label: 'Meta description distincte du titre',
        pass: effectiveDesc.length > 0 && effectiveDesc !== effectiveTitle,
        severity: 'orange',
      },
    ];

    const points = [15, 10, 10, 10, 10, 10, 15, 10, 5, 5];
    const score = checks.reduce((total, check, i) => total + (check.pass ? points[i] : 0), 0);

    return { checks, score };
  }, [props]);
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 71 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
  const bg = score >= 71 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : score >= 40 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  const label = score >= 71 ? 'Bon' : score >= 40 ? 'Correct' : 'À améliorer';
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold', bg, color)}>
      <span className="text-base font-black">{score}</span>
      <span>/100</span>
      <span className="text-xs font-semibold opacity-80">— {label}</span>
    </div>
  );
}

function CheckItem({ check }: { check: CheckResult }) {
  if (check.pass) {
    return (
      <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        {check.label}
      </li>
    );
  }
  if (check.severity === 'red') {
    return (
      <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        {check.label}
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      {check.label}
    </li>
  );
}

function CounterBadge({ value, min, max }: { value: number; min: number; max: number }) {
  const color =
    value >= min && value <= max
      ? 'text-green-600 dark:text-green-400'
      : value >= min - 10 && value <= max + 10
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';
  return (
    <span className={cn('text-xs font-medium tabular-nums', color)}>
      {value}/{max}
    </span>
  );
}

function MetaDescProgress({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    value >= 120 && value <= 160 ? 'bg-green-500' : value >= 100 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mt-1">
      <div className={cn('h-full rounded-full transition-all duration-200', color)} style={{ width: `${pct}%` }} />
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
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 mb-3">Keyphrase cible</p>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Mot-clé principal
          </label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={focusKeyword}
              onChange={(e) => onChange('focusKeyword', e.target.value)}
              placeholder="ex: marketing digital, SEO local…"
              className="w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-brand-400"
            />
          </div>
          <p className="text-xs text-neutral-400">Le mot-clé principal sur lequel vous ciblez ce contenu</p>
        </div>
      </div>

      {/* ── B — Score SEO ── */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400">Analyse SEO</p>
          <ScoreRing score={score} />
        </div>
        <ul className="space-y-2">
          {checks.map((check, i) => <CheckItem key={i} check={check} />)}
        </ul>
      </div>

      {/* ── C — Champs Meta ── */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 space-y-4">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400">Balises meta</p>

        {/* SEO Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Titre SEO
            </label>
            <CounterBadge value={(metaTitle.trim() || title).length} min={50} max={60} />
          </div>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => onChange('metaTitle', e.target.value)}
            placeholder={title || 'Titre affiché dans Google…'}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-brand-400"
          />
          {!metaTitle.trim() && (
            <p className="text-xs text-neutral-400 italic">Laissez vide pour utiliser le titre du contenu</p>
          )}
        </div>

        {/* Meta Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Meta description
            </label>
            <CounterBadge value={(metaDescription.trim() || excerpt || '').length} min={120} max={160} />
          </div>
          <textarea
            value={metaDescription}
            onChange={(e) => onChange('metaDescription', e.target.value)}
            placeholder={excerpt || 'Description affichée dans les résultats Google (120-160 car.)…'}
            rows={3}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors resize-y focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-brand-400"
          />
          <MetaDescProgress value={(metaDescription.trim() || excerpt || '').length} max={160} />
        </div>
      </div>

      {/* ── D — Aperçu SERP ── */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400">Aperçu Google</p>
          <div className="flex gap-1">
            {([['desktop', Monitor], ['mobile', Smartphone]] as const).map(([tab, Icon]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSerpTab(tab)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  serpTab === tab
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab === 'desktop' ? 'Bureau' : 'Mobile'}
              </button>
            ))}
          </div>
        </div>

        <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-700 p-4', serpTab === 'mobile' && 'max-w-[340px] mx-auto')}>
          {/* URL */}
          <div className="flex items-center gap-1.5 mb-1">
            <Globe className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            <p className="text-xs text-[#006621] dark:text-green-500 truncate">{displayUrl}</p>
          </div>
          {/* Title */}
          <p
            className="font-medium mb-1 leading-snug cursor-pointer hover:underline"
            style={{ color: '#1a0dab', fontSize: serpTab === 'desktop' ? '20px' : '16px' }}
          >
            {displayTitle || 'Titre de votre contenu'}
          </p>
          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: '#545454', fontSize: '14px' }}>
            {displayDesc || 'La meta description apparaîtra ici. Rédigez-en une pour améliorer votre taux de clic.'}
          </p>
        </div>
      </div>

      {/* ── E — Réseaux sociaux ── */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400">Réseaux sociaux</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSocialTab('facebook')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                socialTab === 'facebook'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
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
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
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
            <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
              {ogDisplayImage ? (
                <img src={ogDisplayImage} alt="OG preview" className="w-full aspect-[1.91/1] object-cover" />
              ) : (
                <div className="w-full aspect-[1.91/1] bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <p className="text-xs text-neutral-400">Aucune image — utilisez l'image de couverture</p>
                </div>
              )}
              <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
                  {siteUrl.replace('https://', '')}
                </p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2">
                  {ogDisplayTitle || 'Titre Open Graph'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  {ogDisplayDesc || 'Description Open Graph…'}
                </p>
              </div>
            </div>
            {/* Inputs OG */}
            <Input
              label="Titre Open Graph"
              value={ogTitle}
              onChange={(e) => onChange('ogTitle', e.target.value)}
              placeholder={metaTitle.trim() || title || 'Titre pour Facebook…'}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description Open Graph</label>
              <textarea
                value={ogDescription}
                onChange={(e) => onChange('ogDescription', e.target.value)}
                placeholder={excerpt || 'Description pour Facebook, LinkedIn…'}
                rows={2}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors resize-y focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-brand-400"
              />
            </div>
            <Input
              label="Image Open Graph (URL)"
              value={ogImage}
              onChange={(e) => onChange('ogImage', e.target.value)}
              placeholder={coverImage || 'https://… (laissez vide pour l\'image de couverture)'}
            />
          </div>
        )}

        {socialTab === 'twitter' && hasTwitter && (
          <div className="space-y-4">
            {/* Card Twitter summary_large_image */}
            <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
              {twDisplayImage ? (
                <img src={twDisplayImage} alt="Twitter preview" className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <p className="text-xs text-neutral-400">Aucune image</p>
                </div>
              )}
              <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-sm font-bold text-neutral-900 dark:text-white leading-snug line-clamp-1">
                  {twDisplayTitle || 'Titre Twitter'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                  {twDisplayDesc || 'Description Twitter…'}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">{siteUrl.replace('https://', '')}</p>
              </div>
            </div>
            {/* Inputs Twitter */}
            <Input
              label="Titre Twitter / X"
              value={twitterTitle ?? ''}
              onChange={(e) => onChange('twitterTitle', e.target.value)}
              placeholder={ogDisplayTitle || 'Titre pour Twitter…'}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description Twitter / X</label>
              <textarea
                value={twitterDescription ?? ''}
                onChange={(e) => onChange('twitterDescription', e.target.value)}
                placeholder={ogDisplayDesc || 'Description pour Twitter…'}
                rows={2}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors resize-y focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-brand-400"
              />
            </div>
            <Input
              label="Image Twitter / X (URL)"
              value={twitterImage ?? ''}
              onChange={(e) => onChange('twitterImage', e.target.value)}
              placeholder={ogDisplayImage || 'https://… (laissez vide pour l\'image OG)'}
            />
          </div>
        )}
      </div>

      {/* ── F — Avancé (collapsible) ── */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700/40 transition-colors"
        >
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400">Paramètres avancés</p>
          {advancedOpen
            ? <ChevronUp className="w-4 h-4 text-neutral-400" />
            : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>

        {advancedOpen && (
          <div className="px-5 pb-5 space-y-5 border-t border-neutral-100 dark:border-neutral-700 pt-4">
            {/* Canonical URL */}
            <Input
              label="URL canonique"
              value={canonicalUrl}
              onChange={(e) => onChange('canonicalUrl', e.target.value)}
              placeholder={`${siteUrl}/${basePath}/${slug || 'mon-article'}`}
            />
            <p className="text-xs text-neutral-400 -mt-3">
              Laissez vide pour utiliser l'URL de la page automatiquement.
            </p>

            {/* noIndex toggle */}
            <div>
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/30">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    Masquer aux moteurs de recherche (noindex)
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Les robots ne pourront pas indexer cette page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange('noIndex', !noIndex)}
                  className={cn(
                    'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                    noIndex ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-600'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200',
                      noIndex ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
              {noIndex && (
                <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">
                    Cette page ne sera pas indexée par Google. Activez cette option uniquement si vous ne souhaitez pas de trafic organique sur ce contenu.
                  </p>
                </div>
              )}
            </div>

            {/* Robots preview */}
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-1.5">Balise robots générée</p>
              <code className="block text-xs bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 px-3 py-2 rounded-lg font-mono">
                {`<meta name="robots" content="${noIndex ? 'noindex,nofollow' : 'index,follow'}">`}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
