import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Num, Skeleton, useToast } from '@ds';
import { ConsoleCard, ConsoleKpi, ConsoleStatus } from '../../components/console';
import { adminSpaceOf, type AdminSpace } from '../../lib/admin/consoleNav';
import { readConsoleCounts, type ConsoleCounts } from '../../lib/admin/consoleCounts';
import { agregerRevenu } from '../../lib/admin/revenue';
import {
  getAllAgencyLeads, getAllClubSubscriptions, getClubEvents, getClubSessions, getDmReports,
  getTransactionsSince, subscribeMessages,
} from '../../lib/firestore';
import { captureError } from '../../lib/sentry';
import type {
  AgencyLead, ClubDigitosEvent, ClubDigitosSession, ClubDigitosSubscription, ContactMessage, DmReport,
} from '../../types';
import {
  CBtn, CardLink, ConsoleGrid, ConsoleScreen, ConsoleSpaces, ConsoleStack, ConsoleToolbar, HonestEmpty,
} from './components/ConsoleParts';
import { SPACE_TONE, ageOf, spaceLabels, type SpaceFilterValue } from './components/consoleUtils';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUI BLOQUE AUJOURD'HUI — maquette `Console-Vue` (+ `-mobile`), passe 2, lot D.
 *
 * Ossature de la maquette : filtre d'espace · quatre relevés datés · la file « à traiter »
 * (élément, espace, âge, responsable, une action) · à droite les lives à 7 jours, le
 * journal d'audit et la santé de la production.
 *
 * Tout chiffre est LU : comptes d'agrégat (`getPlatformStats`, via le cache de la
 * navigation), transactions des 30 derniers jours, sessions et événements du Club,
 * signalements, abonnements en attente, messages. Une ligne de file n'existe que si
 * son compte est non nul. Le journal d'audit et la santé de la production n'ont pas de
 * producteur : leurs cartes le disent (état vide honnête) et renvoient à leur écran.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** L'engagement public du Club : deux sessions par mois (PRD rév. 6, relevé sur 90 jours). */
const CLUB_SESSIONS_PER_MONTH = 2;

interface QueueRow {
  key: string;
  count: number;
  title: string;
  meta: string;
  space: AdminSpace | undefined;
  oldest: string | null;
  owner: string;
  action: string;
  href: string;
}

interface Live {
  id: string;
  at: Date;
  kind: 'session' | 'event';
  title: string;
  hasTime: boolean;
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation('admin');
  const { addToast } = useToast();
  const k = (s: string, o?: Record<string, unknown>) => t(`p2.vue.${s}`, o);
  const lang = i18n.language;
  const labels = spaceLabels(t, 'console');

  const [loading, setLoading] = useState(true);
  const [asOf, setAsOf] = useState(() => new Date());
  const [counts, setCounts] = useState<ConsoleCounts | null>(null);
  const [cashed, setCashed] = useState<number | null>(null);
  const [leads, setLeads] = useState<AgencyLead[]>([]);
  const [reports, setReports] = useState<DmReport[] | null>(null);
  const [subs, setSubs] = useState<ClubDigitosSubscription[] | null>(null);
  const [sessions, setSessions] = useState<ClubDigitosSession[] | null>(null);
  const [events, setEvents] = useState<ClubDigitosEvent[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [space, setSpace] = useState<SpaceFilterValue>('all');

  useEffect(() => {
    let alive = true;
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    /* Chaque lecture échoue seule : un relevé manquant masque SA tuile ou SA ligne,
       il n'éteint pas l'écran. */
    const soft = <T,>(p: Promise<T>): Promise<T | null> => p.catch((e: unknown) => { captureError(e); return null; });
    Promise.all([
      soft(readConsoleCounts()),
      soft(getTransactionsSince(since)),
      soft(getAllAgencyLeads()),
      soft(getDmReports()),
      soft(getAllClubSubscriptions()),
      soft(getClubSessions()),
      soft(getClubEvents()),
    ]).then(([c, txs, l, r, s, ses, ev]) => {
      if (!alive) return;
      if (!c) addToast('error', t('p2.vue.loadError'));
      setCounts(c);
      setCashed(txs ? agregerRevenu(txs, since).brut : null);
      setLeads(l ?? []);
      setReports(r);
      setSubs(s);
      setSessions(ses);
      setEvents(ev ?? []);
      setAsOf(new Date());
      setLoading(false);
    });
    const unsub = subscribeMessages((msgs) => setMessages(msgs));
    return () => { alive = false; unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = asOf;

  /* ── Les relevés ── */
  const openFormations = counts ? counts.publishedFormations - counts.comingSoonFormations : null;
  const heldThisMonth = useMemo(() => {
    if (!sessions) return null;
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return sessions.filter((s) => {
      const at = new Date(s.scheduledAt).getTime();
      return at >= start && at <= now.getTime();
    }).length;
  }, [sessions, now]);

  /* ── La file : une ligne par compte non nul, les plus anciens d'abord ── */
  const queue = useMemo<QueueRow[]>(() => {
    const oldest = (dates: (string | undefined)[]) =>
      dates.filter((d): d is string => Boolean(d)).sort()[0] ?? null;
    const rows: QueueRow[] = [];
    const newLeads = leads.filter((l) => l.status === 'new');
    if (newLeads.length > 0) rows.push({
      key: 'leads', count: newLeads.length, title: k('qLeads', { count: newLeads.length }), meta: k('qLeadsMeta'),
      space: adminSpaceOf('/admin/prospects-agence'), oldest: oldest(newLeads.map((l) => l.createdAt)),
      owner: k('ownerConception'), action: k('aQualify'), href: '/admin/prospects-agence',
    });
    const openReports = (reports ?? []).filter((r) => r.status === 'open');
    if (openReports.length > 0) rows.push({
      key: 'reports', count: openReports.length, title: k('qReports', { count: openReports.length }), meta: k('qReportsMeta'),
      space: 'club', oldest: oldest(openReports.map((r) => r.createdAt)),
      owner: k('ownerModeration'), action: k('aTreat'), href: '/admin/moderation',
    });
    const pendingSubs = (subs ?? []).filter((s) => s.status === 'pending');
    if (pendingSubs.length > 0) rows.push({
      key: 'subs', count: pendingSubs.length, title: k('qPendingSubs', { count: pendingSubs.length }), meta: k('qPendingSubsMeta'),
      space: 'club', oldest: oldest(pendingSubs.map((s) => s.startedAt)),
      owner: k('ownerSuper'), action: k('aRelease'), href: '/admin/club-digitos',
    });
    const unread = messages.filter((m) => m.status === 'new');
    if (unread.length > 0) rows.push({
      key: 'messages', count: unread.length, title: k('qMessages', { count: unread.length }), meta: k('qMessagesMeta'),
      space: 'hub', oldest: oldest(unread.map((m) => m.sentAt)),
      owner: k('ownerSupport'), action: k('aReply'), href: '/admin/messages',
    });
    if (counts) {
      const unpublished = counts.formations - (openFormations ?? 0);
      if (unpublished > 0) rows.push({
        key: 'formations', count: unpublished, title: k('qUnpublished', { count: unpublished }), meta: k('qUnpublishedMeta'),
        space: 'edu', oldest: null, owner: k('ownerEdu'), action: k('aPublish'), href: '/admin/formations',
      });
      const drafts = counts.articles - counts.publishedPosts;
      if (drafts > 0) rows.push({
        key: 'drafts', count: drafts, title: k('qDrafts', { count: drafts }), meta: k('qDraftsMeta'),
        space: 'hub', oldest: null, owner: k('ownerConception'), action: k('aOpen'), href: '/admin/articles',
      });
    }
    return rows.sort((a, b) => (a.oldest ?? '9').localeCompare(b.oldest ?? '9'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, reports, subs, messages, counts, openFormations, lang]);

  const shownQueue = queue.filter((r) => space === 'all' || r.space === space);

  /* ── Les lives des sept prochains jours (sessions et événements du Club) ── */
  const lives = useMemo<Live[]>(() => {
    const end = now.getTime() + 7 * 86_400_000;
    const list: Live[] = [
      ...(sessions ?? []).map((s) => ({ id: `s-${s.id}`, at: new Date(s.scheduledAt), kind: 'session' as const, title: s.title, hasTime: true })),
      ...events.map((e) => ({ id: `e-${e.id}`, at: new Date(e.time ? `${e.date}T${e.time}` : e.date), kind: 'event' as const, title: e.title, hasTime: Boolean(e.time) })),
    ];
    return list
      .filter((l) => Number.isFinite(l.at.getTime()) && l.at.getTime() >= now.getTime() && l.at.getTime() <= end)
      .sort((a, b) => a.at.getTime() - b.at.getTime());
  }, [sessions, events, now]);

  const loc = lang.startsWith('en') ? 'en-GB' : 'fr-FR';
  const dayLabel = (d: Date) =>
    `${d.toLocaleDateString(loc, { weekday: 'short' }).replace('.', '').toUpperCase()} ${d.getDate()}`;
  const timeLabel = (d: Date) => d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });

  const spaceTag = (s: AdminSpace | undefined) =>
    s ? <ConsoleStatus tone={SPACE_TONE[s]}>{t(`console.spaces.${s}`)}</ConsoleStatus> : null;

  return (
    <ConsoleScreen label={k('title')}>
      <ConsoleToolbar space={space} onSpace={setSpace} labels={labels} hideSpacesOnPhone />

      {/* ── Les quatre relevés datés ── */}
      <div className="grid grid-cols-2 gap-2.5 wide:grid-cols-4 wide:gap-3">
        {loading ? [0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={128} radius="20px" label={i === 0 ? k('loading') : undefined} />
        )) : (
          <>
            <ConsoleKpi
              icon="card" label={k('kpiCashed')} value={cashed} unit="XOF" source="db" asOf={asOf}
              sourceLine={k('kpiCashedSrc')}
            />
            <ConsoleKpi
              icon="user" label={k('kpiAccounts')} value={counts?.users ?? null} source="db" asOf={asOf}
              sourceLine={k('kpiAccountsSrc')}
            />
            <ConsoleKpi
              icon="book" label={k('kpiFormations')} value={openFormations} source="db" asOf={asOf}
              unit={counts ? `/ ${counts.formations}` : undefined}
              foot={counts && counts.comingSoonFormations > 0
                ? <span className="text-warn">{k('kpiFormationsSoon', { count: counts.comingSoonFormations })}</span>
                : undefined}
              sourceLine={k('kpiDaily')}
            />
            <ConsoleKpi
              icon="video" label={k('kpiSessions')} value={heldThisMonth} source="db" asOf={asOf}
              unit={k('kpiSessionsUnit', { count: CLUB_SESSIONS_PER_MONTH })}
              sourceLine={k('kpiSessionsSrc', { count: CLUB_SESSIONS_PER_MONTH })}
            />
          </>
        )}
      </div>

      {/* Mobile : le filtre vient sous les relevés (maquette `Console-Vue-mobile`). */}
      <ConsoleSpaces value={space} onChange={setSpace} labels={labels} className="stack:hidden" />

      <ConsoleGrid side={360}>
        <ConsoleCard
          as="section"
          title={k('queueTitle')}
          aside={<>
            <span className="hidden stack:inline">{space === 'all' ? k('queueAsideAll') : t(`console.spaces.${space}`)}</span>
            <span className="stack:hidden"><Num value={shownQueue.length} source="db" asOf={asOf} /></span>
          </>}
        >
          {loading ? (
            <Skeleton height={160} label={k('loading')} />
          ) : shownQueue.length === 0 ? (
            <HonestEmpty icon="check" title={k(space === 'all' ? 'queueEmpty' : 'queueEmptySpace')} body={k('queueEmptyBody')} />
          ) : (
            <>
              <div className="hidden overflow-x-auto stack:block">
                <table className="mm-ctable" aria-label={k('queueTitle')}>
                  <thead>
                    <tr>
                      <th scope="col">{k('colItem')}</th>
                      <th scope="col">{k('colSpace')}</th>
                      <th scope="col">{k('colAge')}</th>
                      <th scope="col">{k('colOwner')}</th>
                      <th scope="col"><span className="sr-only">{k('colAction')}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shownQueue.map((r) => (
                      <tr key={r.key}>
                        <td><b>{r.title}</b><small>{r.meta}</small></td>
                        <td>{spaceTag(r.space)}</td>
                        <td><Num value={ageOf(r.oldest, now, lang)} source="db" asOf={asOf} fallback="—" /></td>
                        <td className="text-ink-2">{r.owner}</td>
                        <td className="text-right"><CBtn href={r.href}>{r.action}</CBtn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="stack:hidden">
                {shownQueue.map((r) => (
                  <div key={r.key} className="mm-mrow" style={{ alignItems: 'flex-start' }}>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-1.5">
                        {spaceTag(r.space)}
                        <Num value={ageOf(r.oldest, now, lang)} source="db" asOf={asOf} fallback="" className="text-[11px] text-ink-3" />
                      </div>
                      <b className="block text-[14px]">{r.title}</b>
                      <span className="text-[12px] text-ink-3">{r.meta}</span>
                    </div>
                    <CBtn href={r.href}>{r.action}</CBtn>
                  </div>
                ))}
              </div>
            </>
          )}
        </ConsoleCard>

        <ConsoleStack>
          <ConsoleCard as="section" title={k('livesTitle')} aside={<span className="hidden stack:inline">{k('livesAside')}</span>}>
            {loading ? <Skeleton height={80} /> : lives.length === 0 ? (
              <HonestEmpty icon="calendar" title={k('livesEmpty')} body={k('livesEmptyBody')} />
            ) : lives.map((l) => (
              <div key={l.id} className="mm-mrow">
                <div
                  className="w-14 flex-none rounded-[12px] py-2 text-center"
                  style={{ background: `color-mix(in srgb, var(${l.kind === 'session' ? '--mm-violet' : '--mm-bleu'}) 14%, transparent)` }}
                >
                  <Num value={dayLabel(l.at)} source="db" asOf={asOf} className="block text-[12px]" />
                  {l.hasTime && <Num value={timeLabel(l.at)} source="db" asOf={asOf} className="text-[11px] text-ink-2" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11.5px] text-ink-3">{k(l.kind === 'session' ? 'liveSession' : 'liveEvent')}</span>
                  <b className="block text-[13.5px]">{l.title}</b>
                </div>
              </div>
            ))}
          </ConsoleCard>

          <ConsoleCard as="section" title={k('auditTitle')} className="hidden stack:block">
            <HonestEmpty icon="shield" title={k('auditEmpty')} body={k('auditEmptyBody')} />
            <CardLink to="/admin/journal">{k('auditAll')}</CardLink>
          </ConsoleCard>

          <ConsoleCard as="section" title={k('healthTitle')} className="hidden stack:block">
            <HonestEmpty icon="monitor" title={k('healthEmpty')} body={k('healthEmptyBody')} />
            <CardLink to="/admin/infrastructure">{k('healthAll')}</CardLink>
          </ConsoleCard>
        </ConsoleStack>
      </ConsoleGrid>
    </ConsoleScreen>
  );
}
