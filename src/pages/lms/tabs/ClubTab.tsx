import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Icon, IconButton, Skeleton, Tag, Ticker } from '@ds';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import ClubAgendaPanel from './club/ClubAgendaPanel';
import { clubUpcoming } from './club/upcoming';
import { useFormat } from '../../../hooks/useFormat';
import { slideUp } from '../../../lib/animations';
import { cn } from '../../../lib/utils';
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
import { CLUB_NAV, clubTabPath } from './club/clubNav';

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
 * LA COQUILLE À TROIS COLONNES (≥ 1080 px) : rail d'icônes · contenu · « À venir »
 *
 * · LE RAIL (`mm-dash__rail`) porte les huit onglets, et chacun est un LIEN : l'onglet vit dans
 *   l'adresse (`/mon-espace/club/<onglet>`, FR-031). Sous 1080 px, les mêmes huit liens passent
 *   en rangée de pastilles qui défile au geste — la barre d'onglets basse de l'espace
 *   apprenant est déjà là, une seconde barre basse se superposerait à elle.
 * · LA COLONNE DROITE porte l'agenda, pas les « cercles » de la maquette : les cercles
 *   thématiques n'existent ni en base ni dans les règles. Un rail de sigles qui ne filtre rien
 *   serait un décor qui ment sur le produit.
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

  const nav = CLUB_NAV.map((it) => ({ ...it, label: t(`tab.nav.${it.id}`), href: clubTabPath(it.id) }));

  return (
    <motion.div variants={slideUp} initial="hidden" animate="visible">
      <div className="wide:grid wide:grid-cols-[72px_minmax(0,1fr)_290px] wide:items-start wide:gap-5">
        {/* ── Le rail des huit onglets (bureau) ─────────────────────────────── */}
        <nav aria-label={t('tab.navLabel')} className="mm-dash__rail hidden wide:flex">
          {nav.map((it) => (
            <LocalizedLink
              key={it.id}
              to={it.href}
              aria-label={it.label}
              title={it.label}
              aria-current={clubTab === it.id ? 'page' : undefined}
            >
              <Icon name={it.icon} size={20} />
            </LocalizedLink>
          ))}
        </nav>

        <div className="min-w-0 space-y-5">
          {/* ── La salutation, puis l'échéance — toujours sous les yeux ──────── */}
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="m-0 font-display text-[30px] font-black leading-none tracking-[-.03em] text-ink wide:text-[40px]">
                {t(greetingKey(new Date().getHours()), { name: firstName })}
              </h1>
              <p className="m-0 mt-2 text-meta text-ink-2">
                {t('tab.memberActive')} ·{' '}
                {t('tab.expiresOn', {
                  date: expiresAt.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
                })}
                {clubSubscription!.autoRenew ? t('tab.autoRenew') : t('tab.manual')}
              </p>
            </div>
            <div className="flex flex-none items-center gap-2">
              <Tag tone="ok">{t('tab.statusActive')}</Tag>
              <IconButton label={t('tab.refresh')} onClick={handleRefresh}>
                <Icon name="repeat" size={17} />
              </IconButton>
            </div>
          </header>

          {/* ── Les huit onglets (mobile et tablette) — liens, défilement au geste ── */}
          <nav aria-label={t('tab.navLabel')} className="-mx-1 overflow-x-auto px-1 wide:hidden">
            <ul className="m-0 flex w-max list-none gap-2 p-0">
              {nav.map((it) => {
                const on = clubTab === it.id;
                return (
                  <li key={it.id}>
                    <LocalizedLink
                      to={it.href}
                      aria-current={on ? 'page' : undefined}
                      className={cn(
                        'mm-chipd h-9 whitespace-nowrap',
                        on && 'border-[color:var(--ink)] bg-ink text-[color:var(--paper)]',
                      )}
                    >
                      <Icon name={it.icon} size={15} />
                      {it.label}
                    </LocalizedLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ── La bande « en direct » : uniquement des données chargées ─────── */}
          <Ticker items={ticker} label={t('tab.tickerLabel')} badge={t('tab.tickerBadge')} />

          {/* ── Le contenu de l'onglet ─────────────────────────────────────── */}
          {clubTab === 'feed' && <ClubFeed data={data} />}
          {clubTab === 'members' && <ClubMembers data={data} />}
          {clubTab === 'discussions' && <ClubDiscussions data={data} />}
          {clubTab === 'agenda' && (
            <div className="space-y-8">
              <div>
                <ClubSectionHeader icon="calendar" title={t('tab.upcomingEvents')} />
                <ClubEvents data={data} />
              </div>
              <div>
                <ClubSectionHeader icon="video" title={t('tab.liveSessions')} />
                <ClubSessions data={data} />
              </div>
            </div>
          )}
          {clubTab === 'leaderboard' && <ClubLeaderboard data={data} />}
          {clubTab === 'opportunities' && <ClubOpportunities data={data} />}
          {clubTab === 'infos' && <ClubInfos data={data} />}
          {clubTab === 'referral' && <ClubReferral data={data} />}
        </div>

        {/* ── « À venir » : la seule chose du Club qui a une échéance ──────────── */}
        <aside aria-label={t('panel.upcomingEyebrow')} className="mt-6 wide:sticky wide:top-2 wide:mt-0">
          <ClubAgendaPanel data={data} />
        </aside>
      </div>
    </motion.div>
  );
}
