import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, BookOpen, FileText, MessageSquare, Mail, Award, Loader2, RefreshCw, Smartphone, Monitor, Globe } from 'lucide-react';
import Card from '../../components/ui/Card';
import { getPlatformStats } from '../../lib/firestore';

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

const devices = [
  { icon: Smartphone, nameKey: 'deviceMobile', pct: 62 },
  { icon: Monitor, nameKey: 'deviceDesktop', pct: 31 },
  { icon: Globe, nameKey: 'deviceTablet', pct: 7 },
];

export default function AdminAnalytics() {
  const { t } = useTranslation('admin');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getPlatformStats().then((s) => {
      setStats(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const platformStats = stats ? [
    { icon: Users, label: t('analytics.statUsers'), value: stats.users, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20' },
    { icon: BookOpen, label: t('analytics.statFormations'), value: `${stats.publishedFormations} / ${stats.formations}`, color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20' },
    { icon: FileText, label: t('analytics.statArticles'), value: `${stats.publishedPosts} / ${stats.articles}`, color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-900/20' },
    { icon: MessageSquare, label: t('analytics.statMessages'), value: stats.messages, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20' },
    { icon: Mail, label: t('analytics.statSubscribers'), value: stats.subscribers, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20' },
    { icon: Award, label: t('analytics.statEnrollments'), value: stats.enrollments, color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20' },
  ] : [];

  const conversionRate = stats && stats.users > 0
    ? ((stats.enrollments / stats.users) * 100).toFixed(1)
    : '0.0';

  const publishRate = stats && stats.articles > 0
    ? Math.round((stats.publishedPosts / stats.articles) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">{t('analytics.title')}</h1>
          <p className="text-sm text-neutral-500">{t('analytics.subtitle')}</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          title={t('analytics.refresh')}
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
          {/* Platform KPIs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {platformStats.map((s, i) => (
              <Card key={i} hover>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl ${s.bg}`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-sm text-neutral-500">{s.label}</p>
                </div>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Key ratios */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">{t('analytics.keyIndicators')}</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('analytics.enrollmentRate')}</span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">{conversionRate}%</span>
                  </div>
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('analytics.articlePublishRate')}</span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">{publishRate}%</span>
                  </div>
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-500 rounded-full transition-all" style={{ width: `${publishRate}%` }} />
                  </div>
                </div>
                {stats && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('analytics.formationPublishRate')}</span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {stats.formations > 0 ? Math.round((stats.publishedFormations / stats.formations) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div className="h-full bg-success-500 rounded-full transition-all" style={{ width: `${stats.formations > 0 ? Math.round((stats.publishedFormations / stats.formations) * 100) : 0}%` }} />
                    </div>
                  </div>
                )}
                {stats && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('analytics.unhandledMessages')}</span>
                      <span className={`text-sm font-bold ${stats.newMessages > 0 ? 'text-error-600 dark:text-error-400' : 'text-success-600 dark:text-success-400'}`}>
                        {stats.newMessages} / {stats.messages}
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${stats.newMessages > 0 ? 'bg-error-500' : 'bg-success-500'}`}
                        style={{ width: `${stats.messages > 0 ? Math.round((stats.newMessages / stats.messages) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Devices (illustrative) */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{t('analytics.devices')}</h2>
                <span className="text-xs text-neutral-400 italic">{t('analytics.estimatedData')}</span>
              </div>
              <div className="space-y-6">
                {devices.map((d, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-xl">
                      <d.icon className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(`analytics.${d.nameKey}`)}</span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">{d.pct}%</span>
                      </div>
                      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Summary table */}
          {stats && (
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">{t('analytics.fullSummary')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 uppercase">{t('analytics.colMetric')}</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 uppercase">{t('analytics.colTotal')}</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 uppercase">{t('analytics.colActive')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {[
                      { label: t('analytics.rowUsers'), total: stats.users, active: stats.users },
                      { label: t('analytics.rowFormations'), total: stats.formations, active: stats.publishedFormations },
                      { label: t('analytics.rowArticles'), total: stats.articles, active: stats.publishedPosts },
                      { label: t('analytics.rowEnrollments'), total: stats.enrollments, active: stats.enrollments },
                      { label: t('analytics.rowMessages'), total: stats.messages, active: stats.messages - stats.newMessages },
                      { label: t('analytics.rowSubscribers'), total: stats.subscribers, active: stats.subscribers },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300">{row.label}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-900 dark:text-white">{row.total}</td>
                        <td className="py-2.5 px-3 text-right text-success-600 dark:text-success-400 font-medium">{row.active}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-neutral-400 mt-4 italic">
                {t('analytics.advancedNote')}
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
