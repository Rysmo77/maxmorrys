import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Num, Skeleton } from '@ds';
import { ConsoleCard, ConsoleKpi, ConsoleStatus } from '../../components/console';
import { useAdminClub } from './hooks/useAdminClub';
import type { AdminClubTab } from './hooks/useAdminClub';
import ClubSubscriptionsTab from './components/ClubSubscriptionsTab';
import ClubPostsTab from './components/ClubPostsTab';
import ClubEventsTab from './components/ClubEventsTab';
import ClubSessionsTab from './components/ClubSessionsTab';
import ClubInfosTab from './components/ClubInfosTab';
import ClubChallengesTab from './components/ClubChallengesTab';
import ClubMembersAdminTab from './components/ClubMembersAdminTab';
import ClubOpportunitiesAdminTab from './components/ClubOpportunitiesAdminTab';
import ClubReportsAdminTab from './components/ClubReportsAdminTab';
import {
  CBtn, ConsoleScreen, ConsoleStack, ConsoleTabs, ConsoleToolbar, HonestEmpty,
} from './components/ConsoleParts';

/**
 * CLUB · COMMUNAUTÉ — maquette `Console-Club` (+ `-mobile`), passe 2, lot D.
 *
 * La maquette est une VUE D'ENSEMBLE : quatre relevés (sessions tenues contre l'engagement
 * de deux par mois, relevé 90 jours, adhésions actives, en attente), puis Sessions et
 * Abonnements à gauche, Défi · Réglages · En construction à droite. Elle est l'onglet par
 * défaut ; les neuf sections de gestion qui existaient restent derrière les onglets
 * `mm-ctabs` (aucun écran perdu, aucune logique changée).
 *
 * Tout chiffre est lu par `useAdminClub` (abonnements, sessions). Les coups de cœur des
 * défis, le classement facultatif et la récompense de parrainage n'ont pas de producteur :
 * leurs cartes le disent. « En construction » liste ce que le PRD garde désactivé.
 */
type View = 'overview' | AdminClubTab;

/** L'engagement public : deux sessions par mois, relevé sur 90 jours (soit six). */
const PER_MONTH = 2;

export default function AdminClubDigitos() {
  const { t } = useTranslation('adminClub');
  const { t: te } = useTranslation('admin');
  const k = (s: string, o?: Record<string, unknown>) => te(`p2.clubScreen.${s}`, o);
  const club = useAdminClub();
  const [view, setView] = useState<View>('overview');
  const asOf = club.loadedAt ?? new Date();

  const go = (v: View) => {
    setView(v);
    if (v !== 'overview') club.setTab(v);
  };

  const now = asOf.getTime();
  const stats = useMemo(() => {
    const monthStart = new Date(asOf.getFullYear(), asOf.getMonth(), 1).getTime();
    const d90 = now - 90 * 86_400_000;
    const at = (iso: string) => new Date(iso).getTime();
    const held = club.sessions.filter((s) => at(s.scheduledAt) <= now);
    const in15 = now + 15 * 86_400_000;
    return {
      heldMonth: held.filter((s) => at(s.scheduledAt) >= monthStart).length,
      held90: held.filter((s) => at(s.scheduledAt) >= d90).length,
      expiringSoon: club.subscriptions.filter((s) => s.status === 'active' && at(s.expiresAt) >= now && at(s.expiresAt) <= in15).length,
    };
  }, [club.sessions, club.subscriptions, asOf, now]);

  const sessionsShown = useMemo(
    () => [...club.sessions].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)).slice(0, 6),
    [club.sessions],
  );
  const loaded = Boolean(club.loadedAt);
  const monthName = asOf.toLocaleDateString(te('p2.clubScreen.locale'), { month: 'long' });

  const sections: { id: AdminClubTab; label: string; count?: number }[] = [
    { id: 'subscriptions', label: t('page.tabs.subscriptions'), count: club.subscriptions.length },
    { id: 'posts', label: t('page.tabs.posts'), count: club.posts.length },
    { id: 'events', label: t('page.tabs.events'), count: club.events.length },
    { id: 'sessions', label: t('page.tabs.sessions'), count: club.sessions.length },
    { id: 'infos', label: t('page.tabs.infos'), count: club.infos.length },
    { id: 'challenges', label: t('page.tabs.challenges') },
    { id: 'members', label: t('page.tabs.members') },
    { id: 'opportunities', label: t('page.tabs.opportunities') },
    { id: 'reports', label: t('page.tabs.reports') },
  ];

  const tile = (label: string, value: number | null) => (
    <div className="rounded-m p-3" style={{ background: 'var(--paper-2)' }}>
      <span className="text-[11.5px] text-ink-3">{label}</span>
      <b className="mt-1 block text-[22px]"><Num value={value} source="db" asOf={asOf} /></b>
    </div>
  );

  return (
    <ConsoleScreen label={t('page.title')}>
      <ConsoleToolbar>
        <CBtn icon="repeat" onClick={() => { void club.load(); }} disabled={club.loading}>{t('page.refresh')}</CBtn>
      </ConsoleToolbar>

      <div className="grid grid-cols-2 gap-2.5 wide:grid-cols-4 wide:gap-3">
        <ConsoleKpi icon="video" label={k('kpiHeld')} value={loaded ? stats.heldMonth : null} unit={`/ ${PER_MONTH}`} source="db" asOf={asOf}
          sourceLine={k('kpiHeldSrc', { month: monthName, count: PER_MONTH })} />
        <ConsoleKpi icon="calendar" label={k('kpi90')} value={loaded ? stats.held90 : null} unit={`/ ${PER_MONTH * 3}`} source="db" asOf={asOf}
          sourceLine={k('kpi90Src')} />
        <ConsoleKpi icon="crown" label={k('kpiActive')} value={loaded ? club.activeCount : null} source="db" asOf={asOf}
          sourceLine={k('kpiActiveSrc')} />
        <ConsoleKpi icon="clock" label={k('kpiPending')} value={loaded ? club.pendingCount : null} source="db" asOf={asOf}
          sourceLine={t('page.stats.pendingFoot')} />
      </div>

      <ConsoleTabs<View>
        label={t('page.sectionLabel')}
        value={view}
        onChange={go}
        items={[
          { id: 'overview', label: k('overview') },
          ...sections.map((s) => ({
            id: s.id as View,
            label: s.label,
            count: s.count === undefined || !loaded ? undefined : <Num value={s.count} source="db" asOf={asOf} />,
          })),
        ]}
      />

      {view === 'overview' && (
        <div className="grid min-w-0 items-start gap-3 wide:grid-cols-2 wide:gap-3.5">
          <ConsoleStack>
            <ConsoleCard as="section" title={k('sessionsTitle')} aside={<CBtn tone="club" icon="plus" onClick={() => { go('sessions'); club.openSessionForm(); }}>{k('planSession')}</CBtn>}>
              {club.loading ? <Skeleton height={100} /> : sessionsShown.length === 0 ? (
                <HonestEmpty icon="video" title={k('sessionsEmpty')} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="mm-ctable">
                    <thead>
                      <tr>
                        <th scope="col">{k('colDate')}</th>
                        <th scope="col">{k('colSession')}</th>
                        <th scope="col">{k('colStatus')}</th>
                        <th scope="col"><span className="sr-only">{k('colAction')}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionsShown.map((s) => {
                        const past = new Date(s.scheduledAt).getTime() <= now;
                        return (
                          <tr key={s.id}>
                            <td className="whitespace-nowrap"><Num value={new Date(s.scheduledAt).toLocaleDateString(te('p2.clubScreen.locale'), { day: '2-digit', month: '2-digit' })} source="db" asOf={asOf} /></td>
                            <td><b>{s.title}</b></td>
                            <td><ConsoleStatus tone={past ? 'ok' : 'info'}>{k(past ? 'held' : 'upcoming')}</ConsoleStatus></td>
                            <td className="text-right"><CBtn onClick={() => { go('sessions'); club.openSessionForm(s); }}>{k('open')}</CBtn></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ConsoleCard>

            <ConsoleCard as="section" title={k('subsTitle')}>
              <div className="grid grid-cols-3 gap-2">
                {tile(k('subsActive'), loaded ? club.activeCount : null)}
                {tile(k('subsSoon'), loaded ? stats.expiringSoon : null)}
                {tile(k('subsPending'), loaded ? club.pendingCount : null)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <CBtn onClick={() => go('subscriptions')}>{k('subsManage')}</CBtn>
              </div>
            </ConsoleCard>
          </ConsoleStack>

          <ConsoleStack>
            <ConsoleCard as="section" title={k('challengeTitle')}>
              <HonestEmpty icon="trophy" title={k('challengeEmpty')} body={k('challengeBody')} action={<CBtn onClick={() => go('challenges')}>{k('challengeOpen')}</CBtn>} />
            </ConsoleCard>

            <ConsoleCard as="section" title={k('settingsTitle')}>
              <div className="mm-mrow">
                <span className="flex-1 text-[13.5px]">{k('ranking')}</span>
                <ConsoleStatus tone="mute">{k('notMeasured')}</ConsoleStatus>
              </div>
              <div className="mm-mrow">
                <span className="flex-1 text-[13.5px]">{k('referralReward')}</span>
                <ConsoleStatus tone="warn">{k('toDefine')}</ConsoleStatus>
              </div>
              <div className="mm-mrow">
                <span className="flex-1 text-[13.5px]">{k('infos')}</span>
                <CBtn onClick={() => { go('infos'); club.openInfoForm(); }}>{k('publishInfo')}</CBtn>
              </div>
            </ConsoleCard>

            <ConsoleCard as="section" title={k('buildTitle')} aside={<span className="hidden stack:inline">{k('buildAside')}</span>}>
              {(['digest', 'replays', 'circles'] as const).map((id) => (
                <div key={id} className="mm-mrow">
                  <span className="flex-1 text-[13.5px]">{k(`build.${id}`)}</span>
                  <ConsoleStatus tone="mute">{k('building')}</ConsoleStatus>
                  <CBtn disabled>{k(`buildCta.${id}`)}</CBtn>
                </div>
              ))}
            </ConsoleCard>
          </ConsoleStack>
        </div>
      )}

      {view !== 'overview' && (
      <>
      {club.loading && (
        <ConsoleCard padding="14px 18px" className="mt-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={44} label={i === 0 ? t('page.title') : undefined} style={{ marginBottom: '8px' }} />
          ))}
        </ConsoleCard>
      )}

      <div className="mt-4">
      {!club.loading && club.tab === 'subscriptions' && (
        <ClubSubscriptionsTab
          subscriptions={club.subscriptions}
          handleSubStatus={club.handleSubStatus}
          loadedAt={club.loadedAt}
        />
      )}

      {!club.loading && club.tab === 'posts' && (
        <ClubPostsTab
          posts={club.posts}
          showPostForm={club.showPostForm} setShowPostForm={club.setShowPostForm}
          adminPostContent={club.adminPostContent} setAdminPostContent={club.setAdminPostContent}
          publishingPost={club.publishingPost}
          handleAdminPost={club.handleAdminPost} handleDeletePost={club.handleDeletePost}
          editingPostId={club.editingPostId} editPostContent={club.editPostContent} setEditPostContent={club.setEditPostContent}
          savingPostEdit={club.savingPostEdit} openEditPost={club.openEditPost} handleSavePostEdit={club.handleSavePostEdit}
          openComments={club.openComments} postComments={club.postComments} loadingComments={club.loadingComments}
          handleToggleComments={club.handleToggleComments} handleDeleteComment={club.handleDeleteComment}
          loadedAt={club.loadedAt}
        />
      )}

      {!club.loading && club.tab === 'events' && (
        <ClubEventsTab
          events={club.events}
          showEventForm={club.showEventForm} setShowEventForm={club.setShowEventForm}
          editEvent={club.editEvent} eventForm={club.eventForm} setEventForm={club.setEventForm}
          savingEvent={club.savingEvent} uploadingEventImage={club.uploadingEventImage}
          eventImagePreview={club.eventImagePreview} setEventImagePreview={club.setEventImagePreview}
          setEventImageFile={club.setEventImageFile} eventImageInputRef={club.eventImageInputRef}
          openEventForm={club.openEventForm} handleEventImageSelect={club.handleEventImageSelect}
          handleSaveEvent={club.handleSaveEvent} handleDeleteEvent={club.handleDeleteEvent}
          eventRegs={club.eventRegs} eventRegsAt={club.eventRegsAt}
          openEventRegs={club.openEventRegs} loadingRegs={club.loadingRegs}
          handleLoadEventRegs={club.handleLoadEventRegs}
        />
      )}

      {!club.loading && club.tab === 'sessions' && (
        <ClubSessionsTab
          sessions={club.sessions}
          showSessionForm={club.showSessionForm} setShowSessionForm={club.setShowSessionForm}
          editSession={club.editSession} sessionForm={club.sessionForm} setSessionForm={club.setSessionForm}
          savingSession={club.savingSession} uploadingSessionImage={club.uploadingSessionImage}
          sessionImagePreview={club.sessionImagePreview} setSessionImagePreview={club.setSessionImagePreview}
          setSessionImageFile={club.setSessionImageFile} sessionImageInputRef={club.sessionImageInputRef}
          openSessionForm={club.openSessionForm} handleSessionImageSelect={club.handleSessionImageSelect}
          handleSaveSession={club.handleSaveSession} handleDeleteSession={club.handleDeleteSession}
          sessionRegs={club.sessionRegs} sessionRegsAt={club.sessionRegsAt}
          openSessionRegs={club.openSessionRegs} loadingRegs={club.loadingRegs}
          handleLoadSessionRegs={club.handleLoadSessionRegs}
        />
      )}

      {!club.loading && club.tab === 'infos' && (
        <ClubInfosTab
          infos={club.infos}
          showInfoForm={club.showInfoForm} setShowInfoForm={club.setShowInfoForm}
          editInfo={club.editInfo} infoForm={club.infoForm} setInfoForm={club.setInfoForm}
          savingInfo={club.savingInfo}
          openInfoForm={club.openInfoForm} handleSaveInfo={club.handleSaveInfo} handleDeleteInfo={club.handleDeleteInfo}
          loadedAt={club.loadedAt}
        />
      )}

      {!club.loading && club.tab === 'challenges' && <ClubChallengesTab />}
      {!club.loading && club.tab === 'members' && <ClubMembersAdminTab />}
      {!club.loading && club.tab === 'opportunities' && <ClubOpportunitiesAdminTab />}
      {!club.loading && club.tab === 'reports' && <ClubReportsAdminTab />}
      </div>
      </>
      )}
    </ConsoleScreen>
  );
}
