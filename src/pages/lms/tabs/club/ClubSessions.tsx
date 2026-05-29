import { motion } from 'framer-motion';
import {
  VideoCamera, Plus, CheckCircle, CircleNotch,
} from '@phosphor-icons/react';
import { cn } from '../../../../lib/utils';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';
import { ClubEmptyState } from './_shared';

type ClubData = ReturnType<typeof useClubData>;

interface ClubSessionsProps {
  data: ClubData;
}

export default function ClubSessions({ data }: ClubSessionsProps) {
  const { clubSessions, registeredSessions, togglingReg, handleToggleSessionReg } = data;

  if (clubSessions.length === 0) {
    return <ClubEmptyState icon={VideoCamera} title="Aucune session live programmée" subtitle="Les prochaines sessions en direct avec Max-Morrys apparaîtront ici." />;
  }

  return (
    <motion.div
      className="grid sm:grid-cols-2 gap-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {clubSessions.map((session) => {
        const isReg = registeredSessions.has(session.id);
        return (
          <motion.div key={session.id} variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden relative hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            {session.imageUrl && <img src={session.imageUrl} alt={session.title} className="w-full aspect-[16/9] object-cover" />}
            <div className="p-5">
              <span className={cn('inline-flex text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide mb-3', session.status === 'upcoming' ? 'bg-plum-100 dark:bg-plum-900/30 text-plum-700 dark:text-plum-400' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500')}>
                {session.status === 'upcoming' ? 'Prochaine session' : 'Session passée'}
              </span>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{session.title}</h4>
              <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{session.description}</p>
              <div className="space-y-1 text-xs text-neutral-400 mb-4">
                <p>🕐 {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                {session.duration && <p>⏱ Durée : {session.duration}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {session.link && session.status === 'upcoming' && (
                  <a href={session.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-plum-600 hover:bg-plum-700 px-3 py-1.5 rounded-lg transition-colors">
                    <VideoCamera className="w-3.5 h-3.5" weight="fill" /> Rejoindre
                  </a>
                )}
                {session.status === 'upcoming' && (
                  <button onClick={() => handleToggleSessionReg(session.id)} disabled={togglingReg === session.id} className={cn('ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50', isReg ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-error-100 hover:text-error-700' : 'bg-plum-600 text-white hover:bg-plum-700')}>
                    {togglingReg === session.id ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : isReg ? <CheckCircle className="w-3.5 h-3.5" weight="fill" /> : <Plus className="w-3.5 h-3.5" weight="bold" />}
                    {isReg ? 'Inscrit(e)' : "S'inscrire"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
