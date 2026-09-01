import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn, debounce } from '../../lib/utils';
import TranslatedText from './TranslatedText';
import { queryClient, queryKeys } from '../../lib/queryClient';
import { getPublishedPosts, getPublishedFormations, getPublishedPodcasts, getPublishedVideos, getAllFAQ } from '../../lib/firestore';
import type { BlogPost, Formation, Podcast, Video as VideoType, FAQ } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { localizedPath } from '../../i18n/routing';
import { contentPath, type ContentKind } from '../../lib/contentPath';
import { buildCommands, filterCommands, type AppCommand } from '../../lib/commands';
import { Icon, type IconName } from '@ds';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

type ResultType = 'blog' | 'formation' | 'podcast' | 'video' | 'faq';

interface SearchResult {
  type: ResultType;
  title: string;
  slug?: string;
  slug_en?: string;
  excerpt?: string;
}

// Mapping type de résultat → kind de contentPath (types ayant une page de détail propre).
const CONTENT_KIND: Partial<Record<ResultType, ContentKind>> = {
  blog: 'blog',
  formation: 'formations',
  podcast: 'podcasts',
  video: 'videos',
};

const typeConfig: Record<ResultType, { icon: IconName; labelKey: string; path: string; color: string }> = {
  blog:      { icon: 'doc',          labelKey: 'search.types.blog',      path: '/blog',       color: 'text-corail-txt' },
  formation: { icon: 'graduation',   labelKey: 'search.types.formation', path: '/formations', color: 'text-forme' },
  podcast:   { icon: 'mic',          labelKey: 'search.types.podcast',   path: '/podcasts',   color: 'text-transforme-txt' },
  video:     { icon: 'video',        labelKey: 'search.types.video',     path: '/videos',     color: 'text-stop' },
  faq:       { icon: 'help',         labelKey: 'search.types.faq',       path: '/contact',    color: 'text-ink-2' },
};

let cachedPosts: BlogPost[] | null = null;
let cachedFormations: Formation[] | null = null;
let cachedPodcasts: Podcast[] | null = null;
let cachedVideos: VideoType[] | null = null;
let cachedFAQ: FAQ[] | null = null;

const RECENT_KEY = 'mm-recent-searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}
function addRecentSearch(q: string) {
  const recent = getRecentSearches().filter((s) => s !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation('shared');
  const navigate = useNavigate();
  const { user, userData, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();

  // Navigation localisée (préfixe /en + segments traduits selon la langue active).
  const localizedNavigate = useCallback(
    (to: string) => navigate(localizedPath(to, language)),
    [navigate, language],
  );

  // Build command palette (memoised; cheap)
  const allCommands = useMemo<AppCommand[]>(
    () => buildCommands({ user, userData, navigate: localizedNavigate, theme, setTheme, signOut }),
    [user, userData, localizedNavigate, theme, setTheme, signOut],
  );

  const commandsMode = query.trim().startsWith('>');
  const filteredCommands = useMemo(
    () => filterCommands(allCommands, query).slice(0, commandsMode ? 12 : 5),
    [allCommands, query, commandsMode],
  );

  // Pre-fetch content when opening (only if not in commands-only mode)
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setHighlightedIndex(0);
      return;
    }
    setRecentSearches(getRecentSearches());
    setTimeout(() => inputRef.current?.focus(), 100);
    const allCached = cachedPosts && cachedFormations && cachedPodcasts && cachedVideos && cachedFAQ;
    if (allCached) return;
    setLoading(true);
    Promise.all([
      cachedPosts     ? Promise.resolve(cachedPosts)     : getPublishedPosts(100),
      /*
        `fetchQuery` sur les trois listes dont les arguments sont identiques à
        ceux des pages catalogue : la recherche réutilise alors leur cache au
        lieu de relire les collections. Les articles gardent un appel direct —
        la recherche en demande 100, la page blog 50.
      */
      cachedFormations? Promise.resolve(cachedFormations): queryClient.fetchQuery({ queryKey: queryKeys.publishedFormations, queryFn: () => getPublishedFormations() }),
      cachedPodcasts  ? Promise.resolve(cachedPodcasts)  : queryClient.fetchQuery({ queryKey: queryKeys.publishedPodcasts, queryFn: () => getPublishedPodcasts() }),
      cachedVideos    ? Promise.resolve(cachedVideos)    : queryClient.fetchQuery({ queryKey: queryKeys.publishedVideos, queryFn: () => getPublishedVideos() }),
      cachedFAQ       ? Promise.resolve(cachedFAQ)       : getAllFAQ(),
    ]).then(([posts, formations, podcasts, videos, faq]) => {
      cachedPosts = posts;
      cachedFormations = formations;
      cachedPodcasts = podcasts;
      cachedVideos = videos;
      cachedFAQ = faq;
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  const search = useCallback(
    debounce((q: string) => {
      const cleaned = q.trim();
      if (!cleaned || cleaned.startsWith('>')) { setResults([]); return; }
      const lower = cleaned.toLowerCase();
      const r: SearchResult[] = [];

      (cachedPosts ?? []).forEach((p) => {
        if (p.title.toLowerCase().includes(lower) || p.excerpt?.toLowerCase().includes(lower)) {
          r.push({ type: 'blog', title: p.title, slug: p.slug, slug_en: p.slug_en, excerpt: p.excerpt });
        }
      });
      (cachedFormations ?? []).forEach((f) => {
        if (f.title.toLowerCase().includes(lower) || f.description?.toLowerCase().includes(lower)) {
          r.push({ type: 'formation', title: f.title, slug: f.slug, slug_en: f.slug_en, excerpt: f.description });
        }
      });
      (cachedPodcasts ?? []).forEach((p) => {
        if (p.title.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower)) {
          r.push({ type: 'podcast', title: p.title, slug: p.slug, slug_en: p.slug_en, excerpt: p.description });
        }
      });
      (cachedVideos ?? []).forEach((v) => {
        if (v.title.toLowerCase().includes(lower) || v.description?.toLowerCase().includes(lower)) {
          r.push({ type: 'video', title: v.title, slug: v.slug, slug_en: v.slug_en, excerpt: v.description });
        }
      });
      (cachedFAQ ?? []).forEach((f) => {
        if (f.question.toLowerCase().includes(lower) || f.answer?.toLowerCase().includes(lower)) {
          r.push({ type: 'faq', title: f.question, excerpt: f.answer });
        }
      });

      setResults(r.slice(0, 10));
    }, 200),
    [],
  );

  useEffect(() => { search(query); }, [query, search]);

  const goToResult = (result: SearchResult) => {
    if (query.trim()) addRecentSearch(query.trim());
    const kind = CONTENT_KIND[result.type];
    if (kind && result.slug) {
      // Contenu avec page de détail → chemin localisé final (slug_en en EN).
      navigate(contentPath(kind, { slug: result.slug, slug_en: result.slug_en }, language));
    } else {
      // Types sans page de détail propre (ex: faq) : comportement actuel localisé.
      const path = localizedPath(typeConfig[result.type].path, language);
      navigate(result.slug ? `${path}/${result.slug}` : path);
    }
    onClose();
  };

  const runCommand = (cmd: AppCommand) => {
    onClose();
    // Defer so the overlay can unmount before navigation/state changes
    setTimeout(() => cmd.run(), 0);
  };

  // Flattened list for keyboard nav: commands first, then content results.
  const flatItems = useMemo(() => {
    const arr: Array<{ kind: 'cmd'; cmd: AppCommand } | { kind: 'result'; result: SearchResult }> = [];
    filteredCommands.forEach((c) => arr.push({ kind: 'cmd', cmd: c }));
    if (!commandsMode) results.forEach((r) => arr.push({ kind: 'result', result: r }));
    return arr;
  }, [filteredCommands, results, commandsMode]);

  useEffect(() => { setHighlightedIndex(0); }, [query, flatItems.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((p) => Math.min(p + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((p) => Math.max(p - 1, 0));
      } else if (e.key === 'Enter') {
        const item = flatItems[highlightedIndex];
        if (!item) return;
        e.preventDefault();
        if (item.kind === 'cmd') runCommand(item.cmd);
        else goToResult(item.result);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flatItems, highlightedIndex]);

  if (!open) return null;

  const grouped = (Object.keys(typeConfig) as ResultType[]).reduce<Record<ResultType, SearchResult[]>>(
    (acc, type) => ({ ...acc, [type]: results.filter((r) => r.type === type) }),
    {} as Record<ResultType, SearchResult[]>,
  );

  // Index of first content result inside flatItems (commands precede it)
  const cmdCount = filteredCommands.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Voile décoratif : Échap ferme aussi, et le champ garde le focus. */}
      <div aria-hidden="true" className="fixed inset-0 bg-black/50 backdrop-blur-sm mm-drop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('search.quickSearch')}
        className="relative w-full max-w-2xl mx-4 bg-surface-sheet rounded-2xl shadow-2xl mm-drop overflow-hidden"
      >

        {/* Pendant la recherche, la LIGNE porte le liseré `.mm-loading` ; la loupe reste une
            loupe. Un rond à sa place effaçait le seul repère de l'écran. */}
        <div
          className={cn('flex items-center gap-3 px-5 border-b border-[color:var(--line)]', loading && 'mm-loading')}
          aria-busy={loading || undefined}
        >
          <Icon name="search" size={20} className="text-ink-2 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 py-4 bg-transparent text-ink text-base focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-ink-2 hover:text-ink-2 dark:hover:text-ink-2 flex-shrink-0">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {/* Actions / commands */}
          {filteredCommands.length > 0 && (
            <div>
              <p className="px-5 pt-3 pb-1 text-[0.625rem] font-bold tracking-[0.2em] uppercase text-forme">
                {commandsMode ? t('search.actions') : t('search.suggestions')}
              </p>
              {filteredCommands.map((cmd, i) => {
                const glyph = cmd.icon;
                const isActive = highlightedIndex === i;
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onClick={() => runCommand(cmd)}
                    className={cn(
                      'w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors',
                      isActive ? 'bg-[color-mix(in_srgb,var(--mm-bleu)_4%,transparent)]' : 'hover:bg-[color:var(--fill-1)] dark:hover:bg-[color-mix(in_srgb,var(--night-3)_60%,transparent)]',
                    )}
                  >
                    <Icon name={glyph} size={16} className="text-ink-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{cmd.label}</p>
                      {cmd.hint && <p className="text-xs text-ink-2 truncate">{cmd.hint}</p>}
                    </div>
                    {isActive && <Icon name="enter" size={14} className="text-forme flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Content results (grouped) */}
          {!commandsMode && results.length > 0 && (
            <div>
              {(Object.keys(typeConfig) as ResultType[]).map((type) => {
                const group = grouped[type];
                if (!group.length) return null;
                const cfg = typeConfig[type];
                const glyph = cfg.icon;
                return (
                  <div key={type}>
                    <p className={cn('px-5 pt-3 pb-1 text-[0.625rem] font-bold tracking-[0.2em] uppercase', cfg.color)}>
                      {t(cfg.labelKey)}s
                    </p>
                    {group.map((result) => {
                      const globalIdx = cmdCount + results.indexOf(result);
                      const isActive = highlightedIndex === globalIdx;
                      return (
                        <button
                          key={`${type}-${result.title}`}
                          onMouseEnter={() => setHighlightedIndex(globalIdx)}
                          onClick={() => goToResult(result)}
                          className={cn(
                            'w-full flex items-start gap-3 px-5 py-3 text-left transition-colors group',
                            isActive ? 'bg-[color-mix(in_srgb,var(--mm-bleu)_4%,transparent)]' : 'hover:bg-[color:var(--fill-1)] dark:hover:bg-[color-mix(in_srgb,var(--night-3)_60%,transparent)]',
                          )}
                        >
                          <Icon name={glyph} size={16} className={cn('mt-0.5 flex-shrink-0', cfg.color)} />
                          <div className="flex-1 min-w-0">
                            <TranslatedText text={result.title} as="p" className="text-sm font-semibold text-ink truncate" />
                            {result.excerpt && (
                              <TranslatedText text={result.excerpt} as="p" className="text-xs text-ink-2 mt-0.5 line-clamp-1" />
                            )}
                          </div>
                          <Icon name="forward" size={16} className="text-ink-2 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state for query */}
          {query && !loading && filteredCommands.length === 0 && results.length === 0 && (
            <div className="py-12 text-center text-ink-2">
              <p className="text-sm">{t('search.noResults', { query: query.replace(/^>/, '').trim() })}</p>
            </div>
          )}

          {/* Idle state */}
          {!query && !loading && (
            <div className="py-6 px-5">
              {recentSearches.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink-2 mb-2">{t('search.recentSearches')}</p>
                  <div className="space-y-0.5">
                    {recentSearches.map((recent) => (
                      <button
                        key={recent}
                        onClick={() => setQuery(recent)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-ink-2 hover:bg-[color:var(--fill-1)] dark:hover:bg-[color:var(--night-3)] transition-colors text-left"
                      >
                        <Icon name="search" size={14} className="text-ink-2 flex-shrink-0" />
                        {recent}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-center text-ink-2">
                <p className="text-sm mb-3">{t('search.quickSearch')}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {(Object.values(typeConfig)).map((cfg) => (
                    <span key={cfg.labelKey} className={cn('text-xs font-semibold px-2.5 py-1 rounded-full bg-[color:var(--fill-2)]', cfg.color)}>
                      {t(cfg.labelKey)}s
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="border-t border-[color:var(--line)] px-4 py-2 flex items-center justify-between text-[11px] text-ink-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 border border-[color:var(--line)] rounded">↑↓</kbd>{t('search.navigate')}</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 border border-[color:var(--line)] rounded">↵</kbd>{t('search.open')}</span>
            <span className="hidden stack:flex items-center gap-1"><kbd className="px-1.5 py-0.5 border border-[color:var(--line)] rounded">esc</kbd>{t('search.close')}</span>
          </div>
          <span className="hidden stack:flex items-center gap-1">
            <Icon name="command" size={12} /> {t('search.typeForActions')} <kbd className="px-1 border border-[color:var(--line)] rounded">&gt;</kbd> {t('search.forActions')}
          </span>
        </div>
      </div>
    </div>
  );
}
