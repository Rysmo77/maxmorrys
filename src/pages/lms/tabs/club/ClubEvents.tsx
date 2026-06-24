import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  CalendarBlank, ArrowSquareOut, Plus, CheckCircle, CircleNotch,
} from '@phosphor-icons/react';
import { useFormat } from '../../../../hooks/useFormat';
import { cn } from '../../../../lib/utils';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';
import { ClubEmptyState } from './_shared';

type ClubData = ReturnType<typeof useClubData>;

interface ClubEventsProps {
  data: ClubData;
}

export default function ClubEvents({ data }: ClubEventsProps) {
  const { t } = useTranslation('club');
  const { locale } = useFormat();
  const { clubEvents, registeredEvents, togglingReg, handleToggleEventReg } = data;

  if (clubEvents.length === 0) {
    return <ClubEmptyState icon={CalendarBlank} title={t('events.emptyTitle')} subtitle={t('events.emptySubtitle')} />;
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
            {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full aspect-[16/9] object-cover" />}
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide', event.status === 'upcoming' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500')}>
                  {event.status === 'upcoming' ? t('events.upcoming') : t('events.past')}
                </span>
                <span className={cn('text-xs px-2 py-1 rounded-full', event.type === 'online' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400')}>
                  {event.type === 'online' ? t('events.online') : t('events.inPerson')}
                </span>
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{event.title}</h4>
              <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{event.description}</p>
              <div className="space-y-1 text-xs text-neutral-400 mb-4">
                <p>📅 {new Date(event.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{event.time && ` · ${event.time}`}</p>
                <p>📍 {event.location}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-plum-600 dark:text-plum-400 hover:underline"><ArrowSquareOut className="w-3.5 h-3.5" weight="bold" /> {t('events.viewEvent')}</a>}
                {event.status === 'upcoming' && (
                  <button onClick={() => handleToggleEventReg(event.id)} disabled={togglingReg === event.id} className={cn('ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50', isReg ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-error-100 hover:text-error-700' : 'bg-plum-600 text-white hover:bg-plum-700')}>
                    {togglingReg === event.id ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : isReg ? <CheckCircle className="w-3.5 h-3.5" weight="fill" /> : <Plus className="w-3.5 h-3.5" weight="bold" />}
                    {isReg ? t('events.registered') : t('events.register')}
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
