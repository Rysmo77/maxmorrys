import { useState, useEffect } from 'react';
import { Users, TrendingUp, BookOpen, FileText, MessageSquare, Mail, Loader2, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { getPlatformStats, getAllPosts, getAllFormations, subscribeMessages } from '../../lib/firestore';
import { formatDate } from '../../lib/utils';
import type { BlogPost, Formation, ContactMessage } from '../../types';

interface Stats {
  users: number;
  formations: number;
  publishedFormations: number;
  articles: number;
  publishedPosts: number;
  messages: number;
  newMessages: number;
  enrollments: number;
  subscribers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, f] = await Promise.all([
        getPlatformStats(),
        getAllPosts(),
        getAllFormations(),
      ]);
      setStats(s);
      setPosts(p.slice(0, 5));
      setFormations(f.slice(0, 4));
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = subscribeMessages((msgs) => setRecentMessages(msgs.slice(0, 5)));
    return unsub;
  }, []);

  const metrics = stats ? [
    { icon: Users, label: 'Utilisateurs', value: stats.users.toLocaleString(), sub: `${stats.enrollments} inscriptions`, color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' },
    { icon: BookOpen, label: 'Formations', value: stats.formations.toLocaleString(), sub: `${stats.publishedFormations} publiées`, color: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400' },
    { icon: FileText, label: 'Articles', value: stats.articles.toLocaleString(), sub: `${stats.publishedPosts} publiés`, color: 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400' },
    { icon: MessageSquare, label: 'Messages', value: stats.messages.toLocaleString(), sub: `${stats.newMessages} nouveau${stats.newMessages !== 1 ? 'x' : ''}`, color: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400' },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Tableau de bord</h1>
          <p className="text-neutral-500">Vue d'ensemble de votre plateforme</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          title="Actualiser"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metrics.map((m, i) => (
              <Card key={i} hover>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${m.color}`}>
                    <m.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{m.value}</p>
                <p className="text-sm text-neutral-500 mt-0.5">{m.label}</p>
                <p className="text-xs text-neutral-400 mt-1">{m.sub}</p>
              </Card>
            ))}
          </div>

          {stats && (
            <div className="mb-8 p-4 bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800 rounded-2xl flex items-center gap-3">
              <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
              <p className="text-sm text-brand-700 dark:text-brand-300">
                <strong>{stats.subscribers}</strong> abonné{stats.subscribers !== 1 ? 's' : ''} à la newsletter
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Messages récents</h2>
              {recentMessages.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4 text-center">Aucun message reçu.</p>
              ) : (
                <div className="space-y-3">
                  {recentMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                          {msg.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{msg.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{msg.subject}</p>
                      </div>
                      <Badge variant={msg.status === 'new' ? 'error' : msg.status === 'read' ? 'warning' : 'success'} size="sm">
                        {msg.status === 'new' ? 'Nouveau' : msg.status === 'read' ? 'Lu' : 'Répondu'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Formations</h2>
              {formations.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4 text-center">Aucune formation créée.</p>
              ) : (
                <div className="space-y-4">
                  {formations.map((f) => (
                    <div key={f.id} className="flex items-center gap-4">
                      {f.coverImage && (
                        <img src={f.coverImage} alt={f.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{f.title}</p>
                        <p className="text-xs text-neutral-500">{f.students ?? 0} étudiant{(f.students ?? 0) !== 1 ? 's' : ''}</p>
                      </div>
                      <Badge variant={f.status === 'published' ? 'success' : 'warning'} size="sm">
                        {f.status === 'published' ? 'Publiée' : 'Brouillon'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Derniers articles</h2>
            {posts.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">Aucun article créé.</p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                    {post.coverImage && (
                      <img src={post.coverImage} alt={post.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{post.title}</p>
                      <p className="text-xs text-neutral-500">
                        {post.publishedAt ? formatDate(post.publishedAt) : '—'}
                        {post.readTime ? ` · ${post.readTime} min` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="brand" size="sm">{post.category}</Badge>
                      <Badge variant={post.status === 'published' ? 'success' : 'warning'} size="sm">
                        {post.status === 'published' ? 'Publié' : 'Brouillon'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {stats && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Articles publiés', value: stats.publishedPosts },
                { label: 'Formations publiées', value: stats.publishedFormations },
                { label: 'Newsletter', value: stats.subscribers },
                { label: 'Inscriptions', value: stats.enrollments },
              ].map((s, i) => (
                <div key={i} className="p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-2xl text-center">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
