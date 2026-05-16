import { motion } from 'framer-motion';
import {
  Calendar, ExternalLink, Plus, CheckCircle, Loader2,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubEventsProps {
  data: ClubData;
}

export default function ClubEvents({ data }: ClubEventsProps) {
  const { clubEvents, registeredEvents, togglingReg, handleToggleEventReg } = data;

  if (clubEvents.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
        <Calendar className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
        <p className="text-neutral-500">Aucun événement prévu pour le moment.</p>
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
      {clubEvents.map((event) => {
        const isReg = registeredEvents.has(event.id);
        return (
          <motion.div key={event.id} variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden relative hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-44 object-cover" />}
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide', event.status === 'upcoming' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500')}>
                  {event.status === 'upcoming' ? 'À venir' : 'Passé'}
                </span>
                <span className={cn('text-xs px-2 py-1 rounded-full', event.type === 'online' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400')}>
                  {event.type === 'online' ? 'En ligne' : 'Présentiel'}
                </span>
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{event.title}</h4>
              <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{event.description}</p>
              <div className="space-y-1 text-xs text-neutral-400 mb-4">
                <p>📅 {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{event.time && ` à ${event.time}`}</p>
                <p>📍 {event.location}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"><ExternalLink className="w-3.5 h-3.5" /> Voir l'événement</a>}
                {event.status === 'upcoming' && (
                  <button onClick={() => handleToggleEventReg(event.id)} disabled={togglingReg === event.id} className={cn('ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50', isReg ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-error-100 hover:text-error-700' : 'bg-brand-600 text-white hover:bg-brand-700')}>
                    {togglingReg === event.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isReg ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
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
