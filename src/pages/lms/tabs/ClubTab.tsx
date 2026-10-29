import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Icon, IconButton, Skeleton, Tag, Ticker } from '@ds';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import ClubAgendaPanel from './club/ClubAgendaPanel';
import { clubUpcoming } from './club/upcoming';
import { useFormat } from '../../../hooks/useFormat';
import { slideUp } from '../../../lib/animations';
import { useClubData } from '../hooks/useClubData';
import type { EnrolledFormation } from '../hooks/useStudentData';
import ClubSubscriptionGate from './club/ClubSubscriptionGate';
import ClubFeed from './club/ClubFeed';
import ClubLeaderboard from './club/ClubLeaderboard';
import ClubMembers from './club/ClubMembers';
import ClubDiscussions from './club/ClubDiscussions';
import ClubOpportunities from './club/ClubOpportunities';
import ClubReferral from './club/ClubReferral';
import ClubEvents from './club/ClubEvents';
import ClubSessions from './club/ClubSessions';
import ClubInfos from './club/ClubInfos';
import { ClubSectionHeader } from './club/_shared';
import { CLUB_NAV } from './club/clubNav';
import { ClubScreen, CirclesCard } from './club/ClubScreen';

interface ClubTabProps {
  enrolledFormations: EnrolledFormation[];
}

/** Le moment de la journée, lu sur l'horloge de l'appareil : la seule donnée de la salutation. */
function greetingKey(hour: number): string {
  if (hour < 12) return 'tab.greetMorning';
  if (hour < 18) return 'tab.greetAfternoon';
  return 'tab.greetEvening';
}

/**
 * LE CLUB CONNECTÉ — kit v3 « Club en réseau social », EN CLAIR.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA COMPOSITION DES MAQUETTES (passe 2, lot C) : rail d'icônes · contenu · rail des cercles
 *
 * · LE RAIL D'ICÔNES appartient à la coquille (`StudentLayout`, `rail`) ; sous 1080 px, la
 *   barre d'onglets basse de la coquille prend le relais. L'onglet vit dans l'adresse
 *   (`/mon-espace/club/<onglet>`, FR-031).
 * · `ClubScreen` porte l'en-tête de l'écran et le RAIL DES CERCLES, à droite. Il est VIDE et le
 *   dit : les cercles thématiques n'existent ni en base ni dans les règles.
 * · Le fil : carte de la prochaine session réelle (`mm-feature`), puis le fil et sa colonne
 *   droite (« Tes cercles », vide ; « À venir », l'agenda réel).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LA MAQUETTE MONTRE ET QUE CET ÉCRAN NE MONTRE PAS — délibérément
 *
 * · LA RANGÉE DE RELEVÉS (« 5 jours de série », « 860 XP ce mois », « 3 missions », « 11
 *   retours »). Aucun de ces quatre nombres n'est compté par le produit : ni série du Club, ni
 *   XP mensuel, ni « mission » distincte d'une publication, ni retour reçu. Quatre zéros
 *   permanents diraient quelque chose de faux. La rangée reviendra quand la base comptera.
 * · L'HORLOGE, « AUJOURD'HUI » ET « POUR TOI » : pas de flux d'activité ni de recommandation
 *   expliquée côté serveur. Pas d'écran sans fonction.
 * · LE NOMBRE DE MEMBRES ACTIFS et la pastille de rang (retirés avant la refonte, et pour les
 *   mêmes raisons : `TruthPanel` interdit le premier, le second coûtait une lecture complète).
 *
 * La bande « en direct » (`Ticker`), elle, est reprise : elle ne lit que ce que `useClubData`
 * a déjà chargé — prochaines sessions et derniers ateliers, dernière info publiée. Vide, elle
 * ne s'affiche pas.
 *
 * L'ÉCHÉANCE reste en tête, toujours visible : « un abonnement annuel ne supprime pas le
 * renoncement, il le concentre sur un instant ». Aucun prélèvement automatique n'existe ; la
 * ligne dit seulement si le RAPPEL par e-mail est demandé.
 */
export default function ClubTab({ enrolledFormations }: ClubTabProps) {
  const { t } = useTranslation('club');
  const { locale } = useFormat();
  const data = useClubData();
  const { loadingClub, isClubActive, clubSubscription, clubTab, handleRefresh, displayName, clubInfos } = data;

  const ticker = useMemo(() => {
    const items = clubUpcoming(data, t, locale)
      .slice(0, 3)
      .map((u) => t('tab.tickerUpcoming', { title: u.title, when: u.meta }));
    const lastInfo = clubInfos[0];
    if (lastInfo) items.push(t('tab.tickerInfo', { title: lastInfo.title }));
    return items;
    // `data` change à chaque rendu ; les listes qu'on lit, non.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.clubEvents, data.clubSessions, data.registeredEvents, data.registeredSessions, clubInfos, t, locale]);

  if (loadingClub) {
    return (
      <div className="space-y-5">
        <Skeleton height={64} radius="var(--r-l)" label={t('tab.memberActive')} />
        <Skeleton height={40} radius="var(--r-pill)" label={t('tab.navLabel')} />
        <Skeleton height={260} radius="var(--r-l)" label={t('tab.memberActive')} />
      </div>
    );
  }

  if (!isClubActive) {
    return <ClubSubscriptionGate data={data} enrolledFormations={enrolledFormations} />;
  }

  const expiresAt = new Date(clubSubscription!.expiresAt);
  const firstName = displayName.split(' ')[0] || displayName;

  const next = clubUpcoming(data, t, locale)[0];
  const memberLine = (
    <>
      {t('tab.memberActive')} ·{' '}
      {t('tab.expiresOn', {
        date: expiresAt.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
      })}
      {clubSubscription!.autoRenew ? t('tab.autoRenew') : t('tab.manual')}
    </>
  );
  const title = clubTab === 'feed'
    ? t(greetingKey(new Date().getHours()), { name: firstName })
    : t(`tab.nav.${CLUB_NAV.some((n) => n.id === clubTab) ? clubTab : 'feed'}`);
  const screenSub = clubTab === 'feed' ? '' : t(`v3.screens.${clubTab}`, { defaultValue: '' });

  return (
    <motion.div variants={slideUp} initial="hidden" animate="visible">
      <ClubScreen
        title={title}
        subtitle={screenSub || memberLine}
        circlesLabel={t('v3.preview.circles')}
        circlesEmpty={t('v3.circles.empty')}
        actions={(
          <>
            <Tag tone="ok">{t('tab.statusActive')}</Tag>
            <IconButton label={t('tab.refresh')} onClick={handleRefresh}>
              <Icon name="repeat" size={17} />
            </IconButton>
          </>
        )}
      >
        {/* ── La bande « en direct » : uniquement des données chargées ─────── */}
        <Ticker items={ticker} label={t('tab.tickerLabel')} badge={t('tab.tickerBadge')} />

        {clubTab === 'feed' && (
          <>
            {/* La carte de session de la maquette (`mm-feature`) : la PROCHAINE session ou le
                prochain atelier réellement programmé. Rien de programmé → pas de carte. */}
            {next && (
              <LocalizedLink
                to="/mon-espace/club/live"
                className="mm-feature !min-h-[240px]"
                style={{ background: 'radial-gradient(90% 90% at 30% 30%, var(--mm-orange), var(--mm-corail) 45%, var(--mm-violet) 100%)' }}
              >
                <span className="mb-2.5 text-[11px] font-semibold uppercase tracking-[.14em]">{t('v3.feed.nextKick')} · {next.meta}</span>
                <b className="!text-[26px] wide:!text-[34px]">{next.title}</b>
                <span className="mt-3.5 flex items-center gap-2 text-[13px] opacity-90">
                  <Icon name={next.glyph} size={15} />
                  {next.registered ? t('v3.feed.registered') : t('v3.feed.openAgenda')}
                </span>
              </LocalizedLink>
            )}
            <div className="grid items-start gap-4 wide:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0"><ClubFeed data={data} /></div>
              <aside className="space-y-4" aria-label={t('panel.upcomingEyebrow')}>
                <CirclesCard title={t('v3.circles.title')} body={t('v3.circles.body')} />
                <ClubAgendaPanel data={data} />
              </aside>
            </div>
          </>
        )}
        {clubTab === 'members' && <ClubMembers data={data} />}
        {clubTab === 'discussions' && <ClubDiscussions data={data} />}
        {clubTab === 'agenda' && (
          <div className="grid items-start gap-4 wide:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-8">
              <div>
                <ClubSectionHeader icon="calendar" title={t('tab.upcomingEvents')} />
                <ClubEvents data={data} />
              </div>
              <div>
                <ClubSectionHeader icon="video" title={t('tab.liveSessions')} />
                <ClubSessions data={data} />
              </div>
            </div>
            <aside className="space-y-4">
              <section className="mm-card !p-5">
                <h3 className="!text-[18px] text-ink">{t('v3.agenda.replaysTitle')}</h3>
                <p className="m-0 mt-2 text-[13px] leading-[1.5] text-ink-2">{t('v3.agenda.replaysBody')}</p>
              </section>
              <ClubAgendaPanel data={data} />
            </aside>
          </div>
        )}
        {clubTab === 'leaderboard' && <ClubLeaderboard data={data} />}
        {clubTab === 'opportunities' && <ClubOpportunities data={data} />}
        {clubTab === 'infos' && <ClubInfos data={data} />}
        {clubTab === 'referral' && <ClubReferral data={data} />}
      </ClubScreen>
    </motion.div>
  );
}
