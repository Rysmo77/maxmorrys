import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, FileText, GraduationCap, Mic, Video, ArrowRight, Loader2, HelpCircle, Command, CornerDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, debounce } from '../../lib/utils';
import { getPublishedPosts, getPublishedFormations, getPublishedPodcasts, getPublishedVideos, getAllFAQ } from '../../lib/firestore';
import type { BlogPost, Formation, Podcast, Video as VideoType, FAQ } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { buildCommands, filterCommands, type AppCommand } from '../../lib/commands';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

type ResultType = 'blog' | 'formation' | 'podcast' | 'video' | 'faq';

interface SearchResult {
  type: ResultType;
  title: string;
  slug?: string;
  excerpt?: string;
}

const typeConfig: Record<ResultType, { icon: typeof FileText; label: string; path: string; color: string }> = {
  blog:      { icon: FileText,     label: 'Article',    path: '/blog',       color: 'text-coral-500' },
  formation: { icon: GraduationCap,label: 'Formation',  path: '/formations', color: 'text-brand-500' },
  podcast:   { icon: Mic,          label: 'Podcast',    path: '/podcasts',   color: 'text-green-500' },
  video:     { icon: Video,        label: 'Vidéo',      path: '/videos',     color: 'text-red-500' },
  faq:       { icon: HelpCircle,   label: 'FAQ',        path: '/contact',    color: 'text-neutral-500' },
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
  const navigate = useNavigate();
  const { user, userData, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  // Build command palette (memoised; cheap)
  const allCommands = useMemo<AppCommand[]>(
    () => buildCommands({ user, userData, navigate, theme, setTheme, signOut }),
    [user, userData, navigate, theme, setTheme, signOut],
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
      cachedFormations? Promise.resolve(cachedFormations): getPublishedFormations(),
      cachedPodcasts  ? Promise.resolve(cachedPodcasts)  : getPublishedPodcasts(),
      cachedVideos    ? Promise.resolve(cachedVideos)    : getPublishedVideos(),
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
          r.push({ type: 'blog', title: p.title, slug: p.slug, excerpt: p.excerpt });
        }
      });
      (cachedFormations ?? []).forEach((f) => {
        if (f.title.toLowerCase().includes(lower) || f.description?.toLowerCase().includes(lower)) {
          r.push({ type: 'formation', title: f.title, slug: f.slug, excerpt: f.description });
        }
      });
      (cachedPodcasts ?? []).forEach((p) => {
        if (p.title.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower)) {
          r.push({ type: 'podcast', title: p.title, slug: p.slug, excerpt: p.description });
        }
      });
      (cachedVideos ?? []).forEach((v) => {
        if (v.title.toLowerCase().includes(lower) || v.description?.toLowerCase().includes(lower)) {
          r.push({ type: 'video', title: v.title, slug: v.slug, excerpt: v.description });
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
    const path = typeConfig[result.type].path;
    navigate(result.slug ? `${path}/${result.slug}` : path);
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">

        <div className="flex items-center gap-3 px-5 border-b border-neutral-200 dark:border-neutral-800">
          {loading ? <Loader2 className="w-5 h-5 text-brand-500 animate-spin flex-shrink-0" /> : <Search className="w-5 h-5 text-neutral-400 flex-shrink-0" />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tape &gt; pour les actions, ou cherche article, formation, podcast…"
            className="flex-1 py-4 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 text-base focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {/* Actions / commands */}
          {filteredCommands.length > 0 && (
            <div>
              <p className="px-5 pt-3 pb-1 text-[0.625rem] font-bold tracking-[0.2em] uppercase text-brand-500">
                {commandsMode ? 'Actions' : 'Suggestions'}
              </p>
              {filteredCommands.map((cmd, i) => {
                const Icon = cmd.icon;
                const isActive = highlightedIndex === i;
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onClick={() => runCommand(cmd)}
                    className={cn(
                      'w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors',
                      isActive ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                    )}
                  >
                    <Icon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{cmd.label}</p>
                      {cmd.hint && <p className="text-xs text-neutral-500 truncate">{cmd.hint}</p>}
                    </div>
                    {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />}
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
                const Icon = cfg.icon;
                return (
                  <div key={type}>
                    <p className={cn('px-5 pt-3 pb-1 text-[0.625rem] font-bold tracking-[0.2em] uppercase', cfg.color)}>
                      {cfg.label}s
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
                            isActive ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                          )}
                        >
                          <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', cfg.color)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{result.title}</p>
                            {result.excerpt && (
                              <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{result.excerpt}</p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
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
            <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
              <p className="text-sm">Aucun résultat pour «&nbsp;{query.replace(/^>/, '').trim()}&nbsp;»</p>
            </div>
          )}

          {/* Idle state */}
          {!query && !loading && (
            <div className="py-6 px-5">
              {recentSearches.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-2">Recherches récentes</p>
                  <div className="space-y-0.5">
                    {recentSearches.map((recent) => (
                      <button
                        key={recent}
                        onClick={() => setQuery(recent)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
                      >
                        <Search className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
                        {recent}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-center text-neutral-400 dark:text-neutral-500">
                <p className="text-sm mb-3">Recherche & actions rapides</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {(Object.values(typeConfig)).map((cfg) => (
                    <span key={cfg.label} className={cn('text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800', cfg.color)}>
                      {cfg.label}s
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-2 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-700 rounded">↑↓</kbd>naviguer</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-700 rounded">↵</kbd>ouvrir</span>
            <span className="hidden sm:flex items-center gap-1"><kbd className="px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-700 rounded">esc</kbd>fermer</span>
          </div>
          <span className="hidden sm:flex items-center gap-1">
            <Command className="w-3 h-3" /> tapez <kbd className="px-1 border border-neutral-200 dark:border-neutral-700 rounded">&gt;</kbd> pour actions
          </span>
        </div>
      </div>
    </div>
  );
}
