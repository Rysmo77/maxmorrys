import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Users, BookOpen, FileText, MessageSquare, Mail, Loader2, RefreshCw, Briefcase, ExternalLink } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { getPlatformStats, getAllPosts, getAllFormations, subscribeMessages, getAllAgencyLeads, getAgencyStats } from '../../lib/firestore';
import type { AgencyStats } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { BlogPost, Formation, ContactMessage, AgencyLead } from '../../types';

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
  agencyLeads: number;
  newAgencyLeads: number;
}

export default function AdminDashboard() {
  const { t } = useTranslation('admin');
  const { formatDate, formatPrice, locale } = useFormat();
  const { addToast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
  const [agencyLeads, setAgencyLeads] = useState<AgencyLead[]>([]);
  const [agencyStats, setAgencyStats] = useState<AgencyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, f, leads] = await Promise.all([
        getPlatformStats(),
        getAllPosts(),
        getAllFormations(),
        getAllAgencyLeads(),
      ]);
      setStats(s);
      setPosts(p.slice(0, 5));
      setFormations(f.slice(0, 4));
      setAgencyLeads(leads.slice(0, 5));
      // Les agrégats sont calculés sur la liste déjà chargée : pas de seconde lecture.
      setAgencyStats(await getAgencyStats(leads));
    } catch {
      addToast('error', t('dashboard.toastLoadError'));
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
    { icon: Users, label: t('dashboard.metricUsers'), value: stats.users.toLocaleString(locale), sub: t('dashboard.subEnrollments', { count: stats.enrollments }), color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' },
    { icon: BookOpen, label: t('dashboard.metricFormations'), value: stats.formations.toLocaleString(locale), sub: t('dashboard.subPublishedFormations', { count: stats.publishedFormations }), color: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400' },
    { icon: FileText, label: t('dashboard.metricArticles'), value: stats.articles.toLocaleString(locale), sub: t('dashboard.subPublishedPosts', { count: stats.publishedPosts }), color: 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400' },
    { icon: MessageSquare, label: t('dashboard.metricMessages'), value: stats.messages.toLocaleString(locale), sub: t('dashboard.subNewMessages', { count: stats.newMessages }), color: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400' },
    { icon: Briefcase, label: t('dashboard.metricAgency'), value: stats.agencyLeads.toLocaleString(locale), sub: t('dashboard.subNewAgencyLeads', { count: stats.newAgencyLeads }), color: 'bg-lagoon-50 dark:bg-lagoon-900/20 text-lagoon-700 dark:text-lagoon-400' },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">{t('dashboard.title')}</h1>
          <p className="text-neutral-500">{t('dashboard.subtitle')}</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          title={t('dashboard.refresh')}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
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
                <Trans
                  t={t}
                  i18nKey="dashboard.subscribersBanner"
                  count={stats.subscribers}
                  values={{ count: stats.subscribers }}
                  components={{ strong: <strong /> }}
                />
              </p>
            </div>
          )}

          {/* ── Pipeline agence ── */}
          {agencyStats && agencyStats.total > 0 && (
            <Card className="mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-lagoon-700 dark:text-lagoon-400" aria-hidden="true" />
                  {t('dashboard.agencyPipeline')}
                </h2>
                <a
                  href="/admin/prospects-agence"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-lagoon-700 dark:text-lagoon-400 hover:underline"
                >
                  {t('dashboard.agencySeeAll')}
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    {t('dashboard.agencyPipelineValue')}
                  </p>
                  <p className="text-xl font-black text-neutral-900 dark:text-white tabular-nums">
                    {formatPrice(agencyStats.pipelineWeighted)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5 tabular-nums">
                    {t('dashboard.agencyPipelineGross', { value: formatPrice(agencyStats.pipelineGross) })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    {t('dashboard.agencySigned')}
                  </p>
                  <p className="text-xl font-black text-neutral-900 dark:text-white tabular-nums">
                    {formatPrice(agencyStats.signedValue)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5 tabular-nums">
                    {t('dashboard.agencySignedCount', { count: agencyStats.byStatus.signed })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    {t('dashboard.agencyMonthly')}
                  </p>
                  <p className="text-xl font-black text-neutral-900 dark:text-white tabular-nums">
                    {formatPrice(agencyStats.signedMonthly)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">{t('dashboard.agencyMonthlyHint')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    {t('dashboard.agencyConversion')}
                  </p>
                  <p className="text-xl font-black text-neutral-900 dark:text-white tabular-nums">
                    {(agencyStats.conversionRate * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">{t('dashboard.agencyConversionHint')}</p>
                </div>
              </div>

              {agencyLeads.length > 0 && (
                <div className="space-y-2 pt-5 border-t border-neutral-200 dark:border-neutral-700">
                  {agencyLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-lagoon-100 dark:bg-lagoon-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-lagoon-800 dark:text-lagoon-300">
                          {lead.businessName.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {lead.businessName}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {lead.city} · {formatDate(lead.createdAt)}
                        </p>
                      </div>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('dashboard.agencyReply')}
                        className="p-1.5 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors flex-shrink-0"
                      >
                        <MessageSquare className="w-4 h-4" aria-hidden="true" />
                      </a>
                      <Badge variant={lead.status === 'new' ? 'error' : lead.status === 'signed' ? 'success' : 'warning'} size="sm">
                        {t(`agencyLeads.status.${lead.status}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">{t('dashboard.recentMessages')}</h2>
              {recentMessages.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4 text-center">{t('dashboard.noMessages')}</p>
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
                        {msg.status === 'new' ? t('dashboard.statusNew') : msg.status === 'read' ? t('dashboard.statusRead') : t('dashboard.statusReplied')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">{t('dashboard.formationsTitle')}</h2>
              {formations.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4 text-center">{t('dashboard.noFormations')}</p>
              ) : (
                <div className="space-y-4">
                  {formations.map((f) => (
                    <div key={f.id} className="flex items-center gap-4">
                      {f.coverImage && (
                        <img src={f.coverImage} alt={f.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{f.title}</p>
                        <p className="text-xs text-neutral-500">{t('dashboard.studentsCount', { count: f.students ?? 0 })}</p>
                      </div>
                      <Badge variant={f.status === 'published' ? 'success' : 'warning'} size="sm">
                        {f.status === 'published' ? t('dashboard.statusPublishedF') : t('dashboard.statusDraft')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">{t('dashboard.latestArticles')}</h2>
            {posts.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">{t('dashboard.noArticles')}</p>
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
                        {post.status === 'published' ? t('dashboard.statusPublishedM') : t('dashboard.statusDraft')}
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
                { label: t('dashboard.statPublishedArticles'), value: stats.publishedPosts },
                { label: t('dashboard.statPublishedFormations'), value: stats.publishedFormations },
                { label: t('dashboard.statNewsletter'), value: stats.subscribers },
                { label: t('dashboard.statEnrollments'), value: stats.enrollments },
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
