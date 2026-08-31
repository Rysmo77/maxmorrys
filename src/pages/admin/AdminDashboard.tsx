import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Button, EmptyState, GlassPanel, Icon, LessonRow, Num, Skeleton, StatTile, Tag } from '@ds';
import { ConsolePage, ConsoleList, ConsoleScope } from '../../components/console';
import { SiteEyebrow } from '../../components/site';
import { useToast } from '../../components/ui/Toast';
import { getPlatformStats, subscribeMessages, getAllAgencyLeads, getAgencyStats } from '../../lib/firestore';
import type { AgencyStats } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { ContactMessage, AgencyLead } from '../../types';

/**
 * L'ÉCRAN `DashboardOps` DU KIT — `ui_kits/console/ScreensMotif.js`.
 *
 * C'est le seul des dix-neuf écrans SANS filtre de statut, et c'est voulu : « la console
 * n'est pas un tableau de bord d'analyse, c'est une liste de choses à faire aujourd'hui.
 * Elle s'ouvre sur ce qui bloque, pas sur ce qui va bien. » L'ordre du kit est suivi tel
 * quel : l'alerte, le relevé daté, la file à traiter, le pied qui nomme les angles morts.
 *
 * DEUX NOMBRES DE L'ALERTE VIENNENT DE LA BASE, PAS DU KIT. Le kit écrit « 2 formations en
 * base, 0 publiée » — et il se contredit lui-même sur ce compte d'un fichier à l'autre :
 * 1 sur l'accueil, 2 au catalogue, 2 sur « à propos », 0 dans son readme, les quatre en
 * `.mm-num`, donc présentés comme vérifiés. Aucun n'est repris. Les deux valeurs sortent de
 * `getPlatformStats()`, passent par <Num source="db">, et l'alerte ne s'affiche QUE si la
 * condition est vraie dans les données : au moins une formation en base, aucune publiée.
 *
 * CE QUI A ÉTÉ RETIRÉ, ET POURQUOI. Les trois vitrines de l'ancien écran — cinq messages
 * récents, quatre formations, cinq articles — montraient « ce qui va bien », que le motif
 * exclut, et la vitrine des formations affichait « N étudiants » : un nombre d'inscrits par
 * formation, que la règle 6 interdit sans réserve. `getAllPosts()` et `getAllFormations()`
 * ne servaient plus qu'à ça : deux lectures de collection entière par visite, supprimées.
 * Les comptes correspondants restent, agrégés côté serveur, dans les cases de relevé.
 */

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

/** Puits d'icône d'une ligne de file : la teinte est un jeton, jamais une valeur (AD-2). */
const chip = (token: string) => `color-mix(in srgb, var(${token}) 22%, transparent)`;

export default function AdminDashboard() {
  const { t } = useTranslation('admin');
  const { formatDate, formatPrice } = useFormat();
  const { addToast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
  const [agencyLeads, setAgencyLeads] = useState<AgencyLead[]>([]);
  const [agencyStats, setAgencyStats] = useState<AgencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  /** La date du relevé. Elle est posée QUAND la lecture revient, pas au rendu : une case
   *  de console porte la date de sa mesure, pas celle de son affichage. */
  const [asOf, setAsOf] = useState(() => new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [s, leads] = await Promise.all([
        getPlatformStats(),
        getAllAgencyLeads(),
      ]);
      setStats(s);
      setAgencyLeads(leads.slice(0, 5));
      // Les agrégats sont calculés sur la liste déjà chargée : pas de seconde lecture.
      setAgencyStats(await getAgencyStats(leads));
      setAsOf(new Date());
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

  /* ── L'alerte du kit, sous condition de données ────────────────────────────
     « Ta boutique est fermée » n'a de sens que si elle est vraie : des formations en base,
     aucune publiée. Sinon elle ne s'affiche pas — une alerte permanente n'alerte plus. */
  const shopClosed = Boolean(stats && stats.formations > 0 && stats.publishedFormations === 0);

  /* ── Zone 2 · la file, une ligne par chose qui attend ──────────────────────
     Une ligne n'existe que si son compte est non nul, et UNE action par ligne. */
  const drafts = stats ? stats.articles - stats.publishedPosts : 0;
  const unpublished = stats ? stats.formations - stats.publishedFormations : 0;
  const unreadMessages = recentMessages.filter((m) => m.status === 'new').length;

  const queue = stats ? [
    stats.newAgencyLeads > 0 && {
      key: 'leads',
      icon: 'user' as const, tint: '--mm-teal',
      count: stats.newAgencyLeads,
      noun: t('dashboard.queueLeads', { count: stats.newAgencyLeads }),
      meta: t('dashboard.queueLeadsMeta'),
      action: t('dashboard.queueQualify'),
      href: '/admin/prospects-agence',
    },
    unreadMessages > 0 && {
      key: 'messages',
      icon: 'chat' as const, tint: '--mm-bleu',
      count: unreadMessages,
      noun: t('dashboard.queueMessages', { count: unreadMessages }),
      meta: t('dashboard.queueMessagesMeta'),
      action: t('dashboard.queueOpen'),
      href: '/admin/messages',
    },
    drafts > 0 && {
      key: 'drafts',
      icon: 'doc' as const, tint: '--mm-bleu',
      count: drafts,
      noun: t('dashboard.queueDrafts', { count: drafts }),
      meta: t('dashboard.queueDraftsMeta'),
      action: t('dashboard.queueOpen'),
      href: '/admin/articles',
    },
    unpublished > 0 && {
      key: 'formations',
      icon: 'book' as const, tint: '--mm-orange',
      count: unpublished,
      noun: t('dashboard.queueUnpublished', { count: unpublished }),
      meta: t('dashboard.queueUnpublishedMeta'),
      action: t('dashboard.queuePublish'),
      href: '/admin/formations',
    },
  ].filter(Boolean) as {
    key: string; icon: 'user' | 'chat' | 'doc' | 'book'; tint: string;
    count: number; noun: string; meta: string; action: string; href: string;
  }[] : [];

  const tiles = stats ? [
    { key: 'accounts', label: t('dashboard.tileAccounts'), value: stats.users, foot: null },
    { key: 'enrollments', label: t('dashboard.tileEnrollments'), value: stats.enrollments, foot: t('dashboard.footNoUnit') },
    {
      key: 'formations', label: t('dashboard.tilePublishedFormations'), value: stats.publishedFormations,
      foot: <><Num value={stats.formations} source="db" asOf={asOf} /> {t('dashboard.footInBase')}</>,
    },
    {
      key: 'posts', label: t('dashboard.tilePublishedPosts'), value: stats.publishedPosts,
      foot: <><Num value={stats.articles} source="db" asOf={asOf} /> {t('dashboard.footInBase')}</>,
    },
    {
      key: 'leads', label: t('dashboard.tileLeads'), value: stats.agencyLeads,
      foot: <><Num value={stats.newAgencyLeads} source="db" asOf={asOf} /> {t('dashboard.footToQualify')}</>,
    },
    { key: 'subscribers', label: t('dashboard.tileSubscribers'), value: stats.subscribers, foot: null },
  ] : [];

  return (
    // `.play` déclenche la cascade `.rv` du système. Elle est posée en dur et non par
    // `useReveal` : le seuil de 12 % de l'observateur n'est jamais atteint sur une page
    // d'administration haute de plusieurs écrans, et le pied — qui est OBLIGATOIRE —
    // resterait alors à `opacity: 0`, c'est-à-dire absent.
    <div className="play">
      <ConsolePage title={t('dashboard.title')} sub={t('dashboard.sub')}>
        {shopClosed && stats && (
          <GlassPanel
            level="night"
            padding={20}
            className="rv"
            style={{ borderColor: 'color-mix(in srgb, var(--mm-orange) 40%, transparent)' }}
          >
            <div className="flex gap-3">
              <span
                aria-hidden="true"
                className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px]"
                style={{ background: chip('--mm-orange') }}
              >
                <Icon name="alert" size={18} color="var(--warn)" strokeWidth={2.6} />
              </span>
              <div>
                <p className="m-0 text-[15px] font-bold text-warn">{t('dashboard.shopClosedTitle')}</p>
                <p className="m-0 mt-1 text-meta-2 leading-[1.5] text-ink-2">
                  <Trans
                    t={t}
                    i18nKey="dashboard.shopClosedBody"
                    count={stats.formations}
                    components={{
                      total: <Num value={stats.formations} source="db" asOf={asOf} />,
                      published: <Num value={stats.publishedFormations} source="db" asOf={asOf} />,
                    }}
                  />
                </p>
              </div>
            </div>
            <Button href="/admin/formations" tone="informe" style={{ marginTop: '15px' }}>
              {t('dashboard.shopClosedAction')}
            </Button>
          </GlassPanel>
        )}

        <div className="mt-[22px] flex items-baseline justify-between gap-3">
          <SiteEyebrow style={{ marginBottom: 0 }}>{t('dashboard.readingEyebrow')}</SiteEyebrow>
          <Button size="sm" tone="quiet" onClick={load} disabled={loading}>
            {t('dashboard.refresh')}
          </Button>
        </div>

        {loading ? (
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={92} radius="var(--r-l)" label={t('users.loading')} />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {tiles.map((tile) => (
                <StatTile
                  key={tile.key}
                  label={tile.label}
                  value={tile.value}
                  source="db"
                  asOf={asOf}
                  foot={tile.foot}
                />
              ))}
            </div>
            <p className="rv mt-3 text-small leading-[1.5] text-ink-2">{t('dashboard.datedNote')}</p>

            <SiteEyebrow style={{ marginTop: '22px', marginBottom: '10px' }}>
              {t('dashboard.queueEyebrow')}
            </SiteEyebrow>
            {queue.length === 0 ? (
              <GlassPanel level="night" className="rv">
                <EmptyState
                  glyph={<Icon name="check" size={26} color="var(--ok)" strokeWidth={3.4} />}
                  glyphBackground={chip('--ok')}
                  title={t('dashboard.queueEmptyTitle')}
                  body={t('dashboard.queueEmptyBody')}
                />
              </GlassPanel>
            ) : (
              <ConsoleList label={t('dashboard.queueLabel')} className="rv">
                {queue.map((row, i) => (
                  <li key={row.key}>
                    <LessonRow
                      icon={<Icon name={row.icon} size={14} color={`var(${row.tint})`} />}
                      iconBackground={chip(row.tint)}
                      title={<><Num value={row.count} source="db" asOf={asOf} /> {row.noun}</>}
                      meta={row.meta}
                      trailing={<Button size="sm" tone="quiet" href={row.href}>{row.action}</Button>}
                      last={i === queue.length - 1}
                    />
                  </li>
                ))}
              </ConsoleList>
            )}

            {agencyStats && agencyStats.total > 0 && (
              <>
                <div className="mt-[22px] mb-2.5 flex items-baseline justify-between gap-3">
                  <SiteEyebrow style={{ marginBottom: 0 }}>{t('dashboard.agencyEyebrow')}</SiteEyebrow>
                  <Button size="sm" tone="quiet" href="/admin/prospects-agence">
                    {t('dashboard.agencySeeAll')}
                  </Button>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                  <StatTile
                    label={t('dashboard.agencyPipelineValue')}
                    value={formatPrice(agencyStats.pipelineWeighted)}
                    source="db"
                    asOf={asOf}
                    foot={t('dashboard.agencyPipelineGross', { value: formatPrice(agencyStats.pipelineGross) })}
                  />
                  <StatTile
                    label={t('dashboard.agencySigned')}
                    value={formatPrice(agencyStats.signedValue)}
                    source="db"
                    asOf={asOf}
                    foot={t('dashboard.agencySignedCount', { count: agencyStats.byStatus.signed })}
                  />
                  <StatTile
                    label={t('dashboard.agencyMonthly')}
                    value={formatPrice(agencyStats.signedMonthly)}
                    source="db"
                    asOf={asOf}
                    foot={t('dashboard.agencyMonthlyHint')}
                  />
                  <StatTile
                    label={t('dashboard.agencyConversion')}
                    value={Math.round(agencyStats.conversionRate * 100)}
                    unit="%"
                    source="db"
                    asOf={asOf}
                    foot={t('dashboard.agencyConversionHint')}
                  />
                </div>

                {agencyLeads.length > 0 && (
                  <ConsoleList label={t('dashboard.agencyRecentLabel')} className="rv" style={{ marginTop: '10px' }}>
                    {agencyLeads.map((lead, i) => (
                      <li key={lead.id}>
                        <LessonRow
                          icon={<Icon name="case" size={14} color="var(--mm-teal)" />}
                          iconBackground={chip('--mm-teal')}
                          title={lead.businessName}
                          meta={`${lead.city} · ${formatDate(lead.createdAt)}`}
                          trailing={
                            <span className="flex items-center gap-2">
                              <Tag tone={lead.status === 'signed' ? 'ok' : lead.status === 'new' ? 'warn' : 'neutral'}>
                                {t(`agencyLeads.status.${lead.status}`)}
                              </Tag>
                              {/* UNE action par ligne, et c'est la seule qui soit propre à
                                  CE prospect : le canal de réponse qu'il attend. */}
                              <Button
                                size="sm"
                                tone="quiet"
                                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                target="_blank"
                              >
                                {t('dashboard.agencyReply')}
                              </Button>
                            </span>
                          }
                          last={i === agencyLeads.length - 1}
                        />
                      </li>
                    ))}
                  </ConsoleList>
                )}
              </>
            )}
          </>
        )}

        <ConsoleScope>{t('dashboard.scope')}</ConsoleScope>
      </ConsolePage>
    </div>
  );
}
