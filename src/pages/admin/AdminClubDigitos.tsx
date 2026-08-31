import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, GlassPanel, Icon, Skeleton, StatTile } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleScope } from '../../components/console';
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

/**
 * ── CLUB DES DIGITOS — motif de console ─────────────────────────────────────────────
 *
 * LE KIT NE DESSINE PAS CET ÉCRAN ET NE LUI DONNE PAS DE PIPELINE. Les quatorze pipelines
 * de `PipelinesRestants` couvrent les écrans du catalogue, pas ce concentrateur ; celui qui
 * s'en approche — `Défis : tout · en cours · clos` — ne décrit qu'UN de ses neuf onglets,
 * celui des défis, qui vit dans son propre composant.
 *
 * LA ZONE 1 REÇOIT DONC LES NEUF SECTIONS, comme sur l'écran des réglages, et pour la même
 * raison : le filtre répond à « où est ce que je cherche », et ici la réponse est une
 * section. Les files par statut de chaque section (un abonnement en attente, un défi clos)
 * vivent dans la section qui les tient — c'est écrit dans le pied.
 *
 * LES COMPTEURS NE S'INVENTENT PAS. Cinq sections sont chargées par `useAdminClub` et
 * portent leur nombre ; les quatre autres chargent à l'ouverture de leur onglet et n'en
 * portent AUCUN. Écrire « défis 0 » sur une collection jamais lue serait un zéro fabriqué —
 * exactement ce que la règle 6 interdit.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
export default function AdminClubDigitos() {
  const { t } = useTranslation('adminClub');
  const club = useAdminClub();

  /*
    La date de relevé des trois cases. Elle n'est pas décorative : tant qu'aucun chargement
    n'a abouti, il n'y a pas de relevé — les cases affichent « non relevé » plutôt qu'un zéro
    qui se ferait passer pour une mesure.
  */
  const [asOf, setAsOf] = useState<Date | null>(null);
  const loading = club.loading;
  useEffect(() => {
    if (!loading) setAsOf(new Date());
  }, [loading]);

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
  const bar = sections.map((s) => ({
    ...s,
    text: s.count === undefined ? s.label : `${s.label} ${s.count}`,
  }));

  return (
    <ConsolePage title={t('page.title')} sub={t('page.sub')}>
      <ConsoleFilter
        stages={bar.map((s) => s.text)}
        active={bar.find((s) => s.id === club.tab)?.text}
        onSelect={(text) => {
          const hit = bar.find((s) => s.text === text);
          if (hit) club.setTab(hit.id);
        }}
        label={t('page.sectionLabel')}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatTile
          label={t('page.stats.activeMembers')}
          value={asOf ? club.activeCount : null}
          source="db"
          asOf={asOf ?? new Date()}
        />
        <StatTile
          label={t('page.stats.pendingPayment')}
          value={asOf ? club.pendingCount : null}
          source="db"
          asOf={asOf ?? new Date()}
          foot={t('page.stats.pendingFoot')}
        />
        <StatTile
          label={t('page.stats.revenue')}
          value={asOf ? club.revenue : null}
          unit="FCFA"
          source={{ cite: t('page.stats.revenueCite') }}
          asOf={asOf ?? new Date()}
          foot={t('page.stats.revenueFoot')}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="sm" tone="quiet" onClick={() => { void club.load(); }} loading={club.loading}>
          <Icon name="repeat" size={15} /> {t('page.refresh')}
        </Button>
      </div>

      {club.loading && (
        <GlassPanel level="night" padding="14px 18px" className="mt-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={44} label={i === 0 ? t('page.title') : undefined} style={{ marginBottom: '8px' }} />
          ))}
        </GlassPanel>
      )}

      <div className="mt-4">
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

      <ConsoleScope>{t('page.scope')}</ConsoleScope>
    </ConsolePage>
  );
}
