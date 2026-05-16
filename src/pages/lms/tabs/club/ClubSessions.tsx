import { motion } from 'framer-motion';
import {
  Video, Plus, CheckCircle, Loader2,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubSessionsProps {
  data: ClubData;
}

export default function ClubSessions({ data }: ClubSessionsProps) {
  const { clubSessions, registeredSessions, togglingReg, handleToggleSessionReg } = data;

  if (clubSessions.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
        <Video className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
        <p className="text-neutral-500">Aucune session live programmée pour le moment.</p>
      </div>
    );
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
            {session.imageUrl && <img src={session.imageUrl} alt={session.title} className="w-full h-44 object-cover" />}
            <div className="p-5">
              <span className={cn('inline-flex text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide mb-3', session.status === 'upcoming' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500')}>
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
                  <a href={session.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors">
                    <Video className="w-3.5 h-3.5" /> Rejoindre
                  </a>
                )}
                {session.status === 'upcoming' && (
                  <button onClick={() => handleToggleSessionReg(session.id)} disabled={togglingReg === session.id} className={cn('ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50', isReg ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-error-100 hover:text-error-700' : 'bg-brand-600 text-white hover:bg-brand-700')}>
                    {togglingReg === session.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isReg ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
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
