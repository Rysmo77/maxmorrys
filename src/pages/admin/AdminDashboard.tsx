import { useState, useEffect, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, ConsoleSpaceFilter, EmptyState, Icon, LessonRow, Num, Skeleton, useToast } from '@ds';
import {
  ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope, ConsoleSplit, ConsoleCard, ConsoleKpi, ConsoleStatus,
  type ConsoleStatusTone,
} from '../../components/console';
import { ADMIN_SPACES, adminSpaceOf, type AdminSpace } from '../../lib/admin/consoleNav';
import { SiteEyebrow } from '../../components/site';
import { getPlatformStats, subscribeMessages, getAllAgencyLeads, getAgencyStats, updateAgencyLeadStatus } from '../../lib/firestore';
import type { AgencyStats } from '../../lib/firestore';
import { invalidateConsoleCounts } from '../../lib/admin/consoleCounts';
import { PIPELINE_STAGES } from '../../lib/presence/offer';
import { useFormat } from '../../hooks/useFormat';
import LeadPanel from './components/LeadPanel';
import type { ContactMessage, AgencyLead, AgencyLeadStatus } from '../../types';

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
  comingSoonFormations: number;
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

/* La pastille de chaque espace dans le filtre : les teintes FIXES du kit (`--mm-*-f`). */
const SPACE_DOT: Record<AdminSpace, string> = {
  hub: 'var(--ink)',
  edu: 'var(--mm-bleu-f)',
  club: 'var(--mm-violet-f)',
  conception: 'var(--mm-teal-f)',
  rysmo: 'var(--mm-orange-f)',
};

/* « Une classe, un sens » (audit v4.4) : `info` = Edu, `club` = Club, le reste en neutre. */
const SPACE_TONE: Record<AdminSpace, ConsoleStatusTone> = {
  hub: 'mute', edu: 'info', club: 'club', conception: 'mute', rysmo: 'mute',
};

export default function AdminDashboard() {
  const { t } = useTranslation('admin');
  const { formatDate, formatPrice } = useFormat();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
  /* La file COMPLÈTE, pas les cinq premiers : le filtre par statut et le panneau de
     détail travaillent dessus. L'affichage, lui, continue de n'en montrer que cinq. */
  const [agencyLeads, setAgencyLeads] = useState<AgencyLead[]>([]);
  const [leadFilter, setLeadFilter] = useState<AgencyLeadStatus | 'all'>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [updatingLead, setUpdatingLead] = useState(false);
  const [agencyStats, setAgencyStats] = useState<AgencyStats | null>(null);
  const [spaceFilter, setSpaceFilter] = useState<AdminSpace | 'all'>('all');
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
      setAgencyLeads(leads);
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

  /* ── Le prospect en cours de traitement ────────────────────────────────────
     Le handoff veut que « la file reste visible pendant qu'on traite ». Ça suppose
     une sélection, et une sélection suppose un défaut : sans lui, le panneau s'ouvre
     vide et la largeur ne sert à rien tant qu'on n'a pas cliqué.

     LE DÉFAUT EST LE PREMIER PROSPECT QUI ATTEND, pas le plus récent. C'est la même
     règle que le tableau de bord entier : il « s'ouvre sur ce qui bloque ». */
  const filteredLeads = useMemo(
    () => (leadFilter === 'all' ? agencyLeads : agencyLeads.filter((l) => l.status === leadFilter)),
    [agencyLeads, leadFilter],
  );

  const selectedLead = useMemo(() => {
    const byId = selectedLeadId ? filteredLeads.find((l) => l.id === selectedLeadId) : undefined;
    return byId ?? filteredLeads.find((l) => l.status === 'new') ?? filteredLeads[0] ?? null;
  }, [filteredLeads, selectedLeadId]);

  /* Faire avancer un statut change DEUX choses relevées : la liste locale et les
     compteurs de la navigation. Recharger tout serait onze requêtes d'agrégat pour
     un champ ; on corrige la liste sur place et on invalide le cache des compteurs,
     qui se relèvera à la prochaine lecture. */
  const handleAdvance = async (id: string, status: AgencyLeadStatus) => {
    setUpdatingLead(true);
    try {
      await updateAgencyLeadStatus(id, status);
      setAgencyLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      invalidateConsoleCounts();
      addToast('success', t('agencyLeads.toastUpdated'));
    } catch {
      addToast('error', t('agencyLeads.toastUpdateError'));
    } finally {
      setUpdatingLead(false);
    }
  };

  /* Les étapes du filtre, libellées AVEC leur compte — c'est ce que le handoff dessine
     (« tout 12 · à traiter 3 »). `Pipeline` s'identifie par la chaîne affichée, d'où le
     couple {key, label} : la clé pilote le filtre, le libellé pilote le composant. */
  const leadStages: { key: AgencyLeadStatus | 'all'; label: string }[] = agencyStats
    ? [
        { key: 'all', label: `${t('agencyLeads.stageAll')} ${agencyStats.total}` },
        ...PIPELINE_STAGES.map((st) => ({
          key: st,
          label: `${t(`agencyLeads.status.${st}`)} ${agencyStats.byStatus[st] ?? 0}`,
        })),
      ]
    : [];

  /* ── L'alerte du kit, sous condition de données ────────────────────────────
     « Ta boutique est fermée » n'a de sens que si elle est vraie : des formations en base,
     aucune publiée. Sinon elle ne s'affiche pas — une alerte permanente n'alerte plus. */
  /* ⚠️ OUVERTE, PAS PUBLIÉE. Une formation en « bientôt » est publiée : elle a une fiche, un
     tarif et une liste d'attente, et rien à vendre. La compter comme ouverte aurait éteint
     cette alerte au moment précis où elle devient utile — un catalogue tout entier en
     annonce, qui a l'air plein et ne l'est pas. */
  const openFormations = stats ? stats.publishedFormations - stats.comingSoonFormations : 0;
  const shopClosed = Boolean(stats && stats.formations > 0 && openFormations === 0);

  /* ── Zone 2 · la file, une ligne par chose qui attend ──────────────────────
     Une ligne n'existe que si son compte est non nul, et UNE action par ligne. */
  const drafts = stats ? stats.articles - stats.publishedPosts : 0;
  const unpublished = stats ? stats.formations - openFormations : 0;
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

  const shownQueue = queue
    .map((row) => ({ ...row, space: adminSpaceOf(row.href) }))
    .filter((row) => spaceFilter === 'all' || row.space === spaceFilter);

  const tiles = stats ? [
    { key: 'accounts', label: t('dashboard.tileAccounts'), value: stats.users, foot: null },
    { key: 'enrollments', label: t('dashboard.tileEnrollments'), value: stats.enrollments, foot: t('dashboard.footNoUnit') },
    {
      key: 'formations', label: t('dashboard.tilePublishedFormations'), value: openFormations,
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
        {/*
          LA TROISIÈME COLONNE. Le motif — 1080 px, panneau collant, pas de colonne sans
          contenu — vit dans `ConsoleSplit`, écrit une fois pour les dix-neuf écrans.
        */}
        <ConsoleSplit
          detailLabel={t('dashboard.panelEyebrow')}
          detail={
            <LeadPanel
              lead={selectedLead}
              loading={loading}
              onAdvance={handleAdvance}
              onOpenFull={() => navigate('/admin/prospects-agence')}
              updating={updatingLead}
              asOf={asOf}
            />
          }
        >
        {shopClosed && stats && (
          <ConsoleCard
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
                      published: <Num value={openFormations} source="db" asOf={asOf} />,
                    }}
                  />
                </p>
              </div>
            </div>
            <Button href="/admin/formations" tone="informe" style={{ marginTop: '15px' }}>
              {t('dashboard.shopClosedAction')}
            </Button>
          </ConsoleCard>
        )}

        <div className="mt-[22px] flex items-baseline justify-between gap-3">
          <SiteEyebrow style={{ marginBottom: 0 }}>{t('dashboard.readingEyebrow')}</SiteEyebrow>
          <Button size="sm" tone="quiet" onClick={load} disabled={loading}>
            {t('dashboard.refresh')}
          </Button>
        </div>

        {loading ? (
          <div className="mt-2.5 grid gap-2.5 stack:grid-cols-2 wide:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={92} radius="var(--r-l)" label={t('users.loading')} />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-2.5 grid gap-2.5 stack:grid-cols-2 wide:grid-cols-3">
              {tiles.map((tile) => (
                <ConsoleKpi
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

            {/*
              ── LE FILTRE D'ESPACE (kit v3, `mm-cspaces`) ──────────────────────────────
              Il porte sur la file « à traiter », la seule liste de cet écran qui mélange
              les espaces. L'espace d'une ligne n'est pas écrit ici : il est lu dans la
              table de navigation (`adminSpaceOf`) depuis l'écran où la ligne mène.
              Un espace sans rien à traiter affiche un état vide qui le dit — jamais une
              ligne d'exemple.
            */}
            <div className="mt-[22px] mb-2.5 flex flex-wrap items-center gap-2.5">
              <ConsoleSpaceFilter
                label={t('console.spacesLabel')}
                className="max-w-full overflow-x-auto"
                style={{ background: 'var(--bento)' }}
                value={spaceFilter}
                onChange={(id) => setSpaceFilter(id as AdminSpace | 'all')}
                options={[
                  { id: 'all', label: t('console.spaces.all') },
                  ...ADMIN_SPACES.map((id) => ({ id, label: t(`console.spaces.${id}`), dot: SPACE_DOT[id] })),
                ]}
              />
            </div>
            <ConsoleCard
              className="rv"
              title={t('dashboard.queueEyebrow')}
              aside={spaceFilter === 'all' ? t('dashboard.queueAsideAll') : t(`console.spaces.${spaceFilter}`)}
            >
              {shownQueue.length === 0 ? (
                <EmptyState
                  glyph={<Icon name="check" size={26} color="var(--ok)" strokeWidth={3.4} />}
                  glyphBackground={chip('--ok')}
                  title={t(spaceFilter === 'all' ? 'dashboard.queueEmptyTitle' : 'dashboard.queueEmptySpaceTitle')}
                  body={t(spaceFilter === 'all' ? 'dashboard.queueEmptyBody' : 'dashboard.queueEmptySpaceBody')}
                />
              ) : (
                <>
                  {/* Bureau : la table du kit (`mm-ctable`) — élément, espace, une action. */}
                  <div className="hidden overflow-x-auto stack:block">
                    <table className="mm-ctable" aria-label={t('dashboard.queueLabel')}>
                      <thead>
                        <tr>
                          <th scope="col">{t('dashboard.colItem')}</th>
                          <th scope="col">{t('dashboard.colSpace')}</th>
                          <th scope="col"><span className="sr-only">{t('dashboard.colAction')}</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownQueue.map((row) => (
                          <tr key={row.key}>
                            <td>
                              <b><Num value={row.count} source="db" asOf={asOf} /> {row.noun}</b>
                              <small>{row.meta}</small>
                            </td>
                            <td>
                              {row.space
                                ? <ConsoleStatus tone={SPACE_TONE[row.space]}>{t(`console.spaces.${row.space}`)}</ConsoleStatus>
                                : null}
                            </td>
                            <td className="text-right">
                              <Button size="sm" tone="quiet" href={row.href}>{row.action}</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile : les lignes du kit (`mm-mrow`), une action par ligne. */}
                  <ul className="m-0 list-none p-0 stack:hidden" aria-label={t('dashboard.queueLabel')}>
                    {shownQueue.map((row, i) => (
                      <li key={row.key}>
                        <LessonRow
                          icon={<Icon name={row.icon} size={14} color={`var(${row.tint})`} />}
                          iconBackground={chip(row.tint)}
                          title={<><Num value={row.count} source="db" asOf={asOf} /> {row.noun}</>}
                          meta={row.meta}
                          trailing={<Button size="sm" tone="quiet" href={row.href}>{row.action}</Button>}
                          last={i === shownQueue.length - 1}
                        />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </ConsoleCard>

            {agencyStats && agencyStats.total > 0 && (
              <>
                <div className="mt-[22px] mb-2.5 flex items-baseline justify-between gap-3">
                  <SiteEyebrow style={{ marginBottom: 0 }}>{t('dashboard.agencyEyebrow')}</SiteEyebrow>
                  <Button size="sm" tone="quiet" href="/admin/prospects-agence">
                    {t('dashboard.agencySeeAll')}
                  </Button>
                </div>
                <div className="grid gap-2.5 stack:grid-cols-2 wide:grid-cols-4">
                  <ConsoleKpi
                    label={t('dashboard.agencyPipelineValue')}
                    value={formatPrice(agencyStats.pipelineWeighted)}
                    source="db"
                    asOf={asOf}
                    foot={t('dashboard.agencyPipelineGross', { value: formatPrice(agencyStats.pipelineGross) })}
                  />
                  <ConsoleKpi
                    label={t('dashboard.agencySigned')}
                    value={formatPrice(agencyStats.signedValue)}
                    source="db"
                    asOf={asOf}
                    foot={t('dashboard.agencySignedCount', { count: agencyStats.byStatus.signed })}
                  />
                  <ConsoleKpi
                    label={t('dashboard.agencyMonthly')}
                    value={formatPrice(agencyStats.signedMonthly)}
                    source="db"
                    asOf={asOf}
                    foot={t('dashboard.agencyMonthlyHint')}
                  />
                  <ConsoleKpi
                    label={t('dashboard.agencyConversion')}
                    value={Math.round(agencyStats.conversionRate * 100)}
                    unit="%"
                    source="db"
                    asOf={asOf}
                    foot={t('dashboard.agencyConversionHint')}
                  />
                </div>

                {/*
                  ── ZONE 1 DU MOTIF : LE FILTRE PAR STATUT ──────────────────────────
                  Le handoff en pose un sur le tableau de bord, alors que cet écran était
                  jusqu'ici le seul des dix-neuf à s'en passer. Il porte sur les prospects,
                  seule collection de cet écran qui ait de vrais statuts — filtrer la file
                  « à traiter », qui mélange brouillons, messages et formations, aurait été
                  un filtre sur rien.

                  Les comptes viennent de `agencyStats.byStatus`, agrégé sur la liste déjà
                  chargée : aucune lecture supplémentaire.
                */}
                <ConsoleFilter
                  label={t('agencyLeads.pipelineLabel')}
                  stages={leadStages.map((s) => s.label)}
                  active={leadStages.find((s) => s.key === leadFilter)?.label}
                  onSelect={(label) => {
                    const stage = leadStages.find((s) => s.label === label);
                    if (!stage) return;
                    setLeadFilter(stage.key);
                    /* La sélection retombe sur le défaut du nouveau filtre : garder un
                       prospect que le filtre vient d'exclure ferait mentir le panneau. */
                    setSelectedLeadId(null);
                  }}
                  className="rv"
                  style={{ marginTop: '10px' }}
                />

                {filteredLeads.length > 0 && (
                  <ConsoleList label={t('dashboard.agencyRecentLabel')} className="rv" style={{ marginTop: '10px' }}>
                    {filteredLeads.slice(0, 5).map((lead, i, shown) => (
                      <li key={lead.id}>
                        <LessonRow
                          icon={<Icon name="case" size={14} color="var(--mm-teal)" />}
                          iconBackground={chip('--mm-teal')}
                          title={lead.businessName}
                          meta={`${lead.city} · ${formatDate(lead.createdAt)}`}
                          /*
                            UNE ACTION PAR LIGNE, ET C'EST DÉSORMAIS « MONTRER ». Le bouton
                            WhatsApp vivait ici ; il est parti dans le panneau de détail.

                            Ce n'est pas un choix de goût : `LessonRow` rend un `<button>`
                            dès qu'on lui passe `onClick`, et son contrat dit que `trailing`
                            n'accepte « jamais un contrôle ». Garder les deux aurait imbriqué
                            un bouton dans un bouton — invalide, et inatteignable au clavier
                            pour celui de l'intérieur. Le `Tag` reste : il porte un état, pas
                            une action.

                            Le canal de réponse est mieux placé dans le panneau de toute
                            façon : on écrit à quelqu'un après avoir lu sa fiche.
                          */
                          onClick={() => setSelectedLeadId(lead.id)}
                          trailing={
                            <ConsoleStatus tone={lead.status === 'signed' ? 'ok' : lead.status === 'new' ? 'warn' : 'neutral'}>
                              {t(`agencyLeads.status.${lead.status}`)}
                            </ConsoleStatus>
                          }
                          last={i === shown.length - 1}
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
        </ConsoleSplit>
      </ConsolePage>
    </div>
  );
}
