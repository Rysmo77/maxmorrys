import { useTranslation } from 'react-i18next';
import { Crown, Users, Rss, Calendar, Video, Bell, Trophy, Briefcase, Flag, Loader2, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { useFormat } from '../../hooks/useFormat';
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

export default function AdminClubDigitos() {
  const { t } = useTranslation('adminClub');
  const { locale } = useFormat();
  const club = useAdminClub();

  const tabs = [
    { id: 'subscriptions' as AdminClubTab, icon: Users, label: t('page.tabs.subscriptions'), count: club.subscriptions.length },
    { id: 'posts' as AdminClubTab, icon: Rss, label: t('page.tabs.posts'), count: club.posts.length },
    { id: 'events' as AdminClubTab, icon: Calendar, label: t('page.tabs.events'), count: club.events.length },
    { id: 'sessions' as AdminClubTab, icon: Video, label: t('page.tabs.sessions'), count: club.sessions.length },
    { id: 'infos' as AdminClubTab, icon: Bell, label: t('page.tabs.infos'), count: club.infos.length },
    { id: 'challenges' as AdminClubTab, icon: Trophy, label: t('page.tabs.challenges'), count: 0 },
    { id: 'members' as AdminClubTab, icon: Users, label: t('page.tabs.members'), count: 0 },
    { id: 'opportunities' as AdminClubTab, icon: Briefcase, label: t('page.tabs.opportunities'), count: 0 },
    { id: 'reports' as AdminClubTab, icon: Flag, label: t('page.tabs.reports'), count: 0 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-plum-100 dark:bg-plum-900/30 flex items-center justify-center">
            <Crown className="w-5 h-5 text-plum-600 dark:text-plum-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('page.title')}</h1>
            <p className="text-sm text-neutral-500">{t('page.subtitle')}</p>
          </div>
        </div>
        <button onClick={club.load} disabled={club.loading} className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors" title={t('page.refresh')}>
          <RefreshCw className={`w-5 h-5 ${club.loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: t('page.stats.activeMembers'), value: club.activeCount, color: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400' },
          { label: t('page.stats.pendingPayment'), value: club.pendingCount, color: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400' },
          { label: t('page.stats.revenue'), value: club.revenue.toLocaleString(locale), color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' },
        ].map((s) => (
          <Card key={s.label} hover>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-neutral-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-700 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => club.setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors',
              club.tab === t.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className="text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {club.loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>}

      {!club.loading && club.tab === 'subscriptions' && (
        <ClubSubscriptionsTab subscriptions={club.subscriptions} handleSubStatus={club.handleSubStatus} />
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
          eventRegs={club.eventRegs} openEventRegs={club.openEventRegs} loadingRegs={club.loadingRegs}
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
          sessionRegs={club.sessionRegs} openSessionRegs={club.openSessionRegs} loadingRegs={club.loadingRegs}
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
        />
      )}

      {!club.loading && club.tab === 'challenges' && <ClubChallengesTab />}
      {!club.loading && club.tab === 'members' && <ClubMembersAdminTab />}
      {!club.loading && club.tab === 'opportunities' && <ClubOpportunitiesAdminTab />}
      {!club.loading && club.tab === 'reports' && <ClubReportsAdminTab />}
    </div>
  );
}
