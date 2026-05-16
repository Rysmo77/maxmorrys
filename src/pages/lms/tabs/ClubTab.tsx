import { motion } from 'framer-motion';
import { Crown, Rss, Calendar, Video, Info, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { slideUp } from '../../../lib/animations';
import { useClubData } from '../hooks/useClubData';
import type { ClubSubTab } from '../hooks/useClubData';
import type { EnrolledFormation } from '../hooks/useStudentData';
import ClubSubscriptionGate from './club/ClubSubscriptionGate';
import ClubFeed from './club/ClubFeed';
import ClubEvents from './club/ClubEvents';
import ClubSessions from './club/ClubSessions';
import ClubInfos from './club/ClubInfos';

interface ClubTabProps {
  enrolledFormations: EnrolledFormation[];
}

export default function ClubTab({ enrolledFormations }: ClubTabProps) {
  const data = useClubData();
  const {
    loadingClub, isClubActive, clubSubscription,
    clubTab, setClubTab, handleRefresh,
  } = data;

  if (loadingClub) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }

  if (!isClubActive) {
    return <ClubSubscriptionGate data={data} enrolledFormations={enrolledFormations} />;
  }

  return (
    <motion.div
      className="space-y-5"
      variants={slideUp}
      initial="hidden"
      animate="visible"
    >
      {/* Statut */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-plum-100 dark:bg-plum-900/30 flex items-center justify-center">
            <Crown className="w-5 h-5 text-plum-600 dark:text-plum-400" />
          </div>
          <div>
            <p className="font-bold text-neutral-900 dark:text-white">Club des Digitos · Membre actif</p>
            <p className="text-xs text-neutral-400">
              Expire le {new Date(clubSubscription!.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {clubSubscription!.autoRenew ? ' · Renouvellement auto' : ' · Manuel'}
            </p>
          </div>
        </div>
        <button onClick={handleRefresh} className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 sm:gap-2 overflow-x-auto sm:flex-wrap border-b border-neutral-200 dark:border-neutral-700 pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
        {([
          { id: 'feed' as ClubSubTab, icon: Rss, label: 'Fil', fullLabel: "Fil d'actualité" },
          { id: 'events' as ClubSubTab, icon: Calendar, label: 'Events', fullLabel: 'Événements' },
          { id: 'sessions' as ClubSubTab, icon: Video, label: 'Live', fullLabel: 'Sessions Live' },
          { id: 'infos' as ClubSubTab, icon: Info, label: 'Infos', fullLabel: 'Infos exclusives' },
        ] as const).map((tab) => (
          <button key={tab.id} onClick={() => setClubTab(tab.id)} className={cn(
            'flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap',
            clubTab === tab.id ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
          )}>
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            <span className="sm:hidden">{tab.label}</span>
            <span className="hidden sm:inline">{tab.fullLabel}</span>
          </button>
        ))}
      </div>

      {clubTab === 'feed' && <ClubFeed data={data} />}
      {clubTab === 'events' && <ClubEvents data={data} />}
      {clubTab === 'sessions' && <ClubSessions data={data} />}
      {clubTab === 'infos' && <ClubInfos data={data} />}
    </motion.div>
  );
}
