import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, GraduationCap, Mic, Video, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, debounce } from '../../lib/utils';
import { getPublishedPosts, getPublishedFormations } from '../../lib/firestore';
import type { BlogPost, Formation } from '../../types';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

type ResultType = 'blog' | 'formation';

interface SearchResult {
  type: ResultType;
  title: string;
  slug: string;
  excerpt?: string;
}

const typeConfig: Record<ResultType, { icon: typeof FileText; label: string; path: string; color: string }> = {
  blog: { icon: FileText, label: 'Article', path: '/blog', color: 'text-brand-500' },
  formation: { icon: GraduationCap, label: 'Formation', path: '/formations', color: 'text-success-500' },
};

// Cache fetched data across opens
let cachedPosts: BlogPost[] | null = null;
let cachedFormations: Formation[] | null = null;

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Pre-fetch data when overlay opens
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 100);
    if (cachedPosts && cachedFormations) return;
    setLoading(true);
    Promise.all([
      cachedPosts ? Promise.resolve(cachedPosts) : getPublishedPosts(100),
      cachedFormations ? Promise.resolve(cachedFormations) : getPublishedFormations(),
    ]).then(([posts, formations]) => {
      cachedPosts = posts;
      cachedFormations = formations;
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  const search = useCallback(
    debounce((q: string) => {
      if (!q.trim()) { setResults([]); return; }
      const lower = q.toLowerCase();
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
      setResults(r.slice(0, 8));
    }, 200),
    [],
  );

  useEffect(() => { search(query); }, [query, search]);

  const goToResult = (result: SearchResult) => {
    navigate(`${typeConfig[result.type].path}/${result.slug}`);
    onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-center gap-3 px-5 border-b border-neutral-200 dark:border-neutral-700">
          {loading ? <Loader2 className="w-5 h-5 text-brand-500 animate-spin" /> : <Search className="w-5 h-5 text-neutral-400" />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans le blog, les formations..."
            className="flex-1 py-4 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 text-base focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {results.map((result, i) => {
              const cfg = typeConfig[result.type];
              const Icon = cfg.icon;
              return (
                <button
                  key={i}
                  onClick={() => goToResult(result)}
                  className="w-full flex items-start gap-3 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors text-left group"
                >
                  <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{result.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{cfg.label}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </button>
              );
            })}
          </div>
        )}

        {query && !loading && results.length === 0 && (
          <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
            <p className="text-sm">Aucun résultat pour "{query}"</p>
          </div>
        )}

        {!query && !loading && (
          <div className="py-8 text-center text-neutral-400 dark:text-neutral-500">
            <p className="text-sm">Commencez à taper pour rechercher...</p>
            <p className="text-xs mt-1">Articles et formations</p>
          </div>
        )}
      </div>
    </div>
  );
}
