import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Rss, UsersThree, ChatsCircle, CalendarBlank, VideoCamera, Trophy, Briefcase,
  Info, Gift, ArrowsClockwise, CircleNotch, DotsThree, type Icon,
} from '@phosphor-icons/react';
import { cn } from '../../../lib/utils';
import { slideUp } from '../../../lib/animations';
import { useClubData } from '../hooks/useClubData';
import type { ClubSubTab } from '../hooks/useClubData';
import type { EnrolledFormation } from '../hooks/useStudentData';
import { getClubActiveMemberCount, getClubLeaderboard } from '../../../lib/gamification';
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

interface ClubTabProps {
  enrolledFormations: EnrolledFormation[];
}

interface NavItem { id: ClubSubTab; icon: Icon; label: string }

const PRIMARY: NavItem[] = [
  { id: 'feed', icon: Rss, label: 'Fil' },
  { id: 'members', icon: UsersThree, label: 'Membres' },
  { id: 'discussions', icon: ChatsCircle, label: 'Messages' },
  { id: 'agenda', icon: CalendarBlank, label: 'Agenda' },
];
const MORE: NavItem[] = [
  { id: 'leaderboard', icon: Trophy, label: 'Classement' },
  { id: 'opportunities', icon: Briefcase, label: 'Opportunités' },
  { id: 'infos', icon: Info, label: 'Infos exclusives' },
  { id: 'referral', icon: Gift, label: 'Parrainer' },
];

export default function ClubTab({ enrolledFormations }: ClubTabProps) {
  const data = useClubData();
  const { loadingClub, isClubActive, clubSubscription, clubTab, setClubTab, handleRefresh, user } = data;

  const [moreOpen, setMoreOpen] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [myRank, setMyRank] = useState<number | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isClubActive) return;
    getClubActiveMemberCount().then(setMemberCount).catch(() => null);
    getClubLeaderboard().then((entries) => {
      const me = user ? entries.find((e) => e.userId === user.uid) : undefined;
      setMyRank(me?.rank ?? null);
    }).catch(() => null);
  }, [isClubActive, user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (loadingClub) {
    return <div className="flex justify-center py-16"><CircleNotch className="w-8 h-8 animate-spin text-plum-500" /></div>;
  }
  if (!isClubActive) {
    return <ClubSubscriptionGate data={data} enrolledFormations={enrolledFormations} />;
  }

  const moreActive = MORE.find((m) => m.id === clubTab);
  const navBtn = (item: NavItem, active: boolean) => (
    <button
      key={item.id}
      onClick={() => { setClubTab(item.id); setMoreOpen(false); }}
      className={cn(
        'flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap',
        active ? 'bg-plum-50 dark:bg-plum-900/25 text-plum-700 dark:text-plum-300' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
      )}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" weight={active ? 'fill' : 'regular'} />
      {item.label}
    </button>
  );

  return (
    <motion.div className="space-y-5" variants={slideUp} initial="hidden" animate="visible">
      {/* En-tête compact */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plum-500 to-plum-700 flex items-center justify-center shadow-soft flex-shrink-0">
              <Crown className="w-5 h-5 text-white" weight="fill" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-neutral-900 dark:text-white truncate">Club des Digitos · Membre actif</p>
              <p className="text-xs text-neutral-400 truncate">
                Expire le {new Date(clubSubscription!.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {clubSubscription!.autoRenew ? ' · Renouvellement auto' : ' · Manuel'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {memberCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300">
                <UsersThree className="w-3.5 h-3.5 text-plum-500" weight="fill" /> {memberCount}
              </span>
            )}
            {myRank && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-plum-50 dark:bg-plum-900/25 text-plum-700 dark:text-plum-300">
                <Trophy className="w-3.5 h-3.5" weight="fill" /> #{myRank}
              </span>
            )}
            <button onClick={handleRefresh} aria-label="Actualiser" className="p-2 rounded-xl text-neutral-400 hover:text-plum-600 dark:hover:text-plum-400 hover:bg-plum-50 dark:hover:bg-plum-900/20 transition-colors">
              <ArrowsClockwise className="w-4 h-4" weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation réduite + Plus */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRIMARY.map((it) => navBtn(it, clubTab === it.id))}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap',
              moreActive ? 'bg-plum-50 dark:bg-plum-900/25 text-plum-700 dark:text-plum-300' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
            )}
          >
            {moreActive ? <moreActive.icon className="w-4 h-4" weight="fill" /> : <DotsThree className="w-4 h-4" weight="bold" />}
            {moreActive ? moreActive.label : 'Plus'}
          </button>
          {moreOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 min-w-52">
              {MORE.map((it) => (
                <button
                  key={it.id}
                  onClick={() => { setClubTab(it.id); setMoreOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    clubTab === it.id ? 'bg-plum-50 dark:bg-plum-900/25 text-plum-700 dark:text-plum-300' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700',
                  )}
                >
                  <it.icon className="w-4 h-4" weight={clubTab === it.id ? 'fill' : 'duotone'} /> {it.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      {clubTab === 'feed' && <ClubFeed data={data} />}
      {clubTab === 'members' && <ClubMembers data={data} />}
      {clubTab === 'discussions' && <ClubDiscussions data={data} />}
      {clubTab === 'agenda' && (
        <div className="space-y-8">
          <div>
            <ClubSectionHeader icon={CalendarBlank} title="Événements à venir" />
            <ClubEvents data={data} />
          </div>
          <div>
            <ClubSectionHeader icon={VideoCamera} title="Sessions live" />
            <ClubSessions data={data} />
          </div>
        </div>
      )}
      {clubTab === 'leaderboard' && <ClubLeaderboard data={data} />}
      {clubTab === 'opportunities' && <ClubOpportunities data={data} />}
      {clubTab === 'infos' && <ClubInfos data={data} />}
      {clubTab === 'referral' && <ClubReferral data={data} />}
    </motion.div>
  );
}
