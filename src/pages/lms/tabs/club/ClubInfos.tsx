import { motion } from 'framer-motion';
import {
  Heart, Bell, ExternalLink, Share2, Check,
} from 'lucide-react';
import { cn, formatDate } from '../../../../lib/utils';
import { SHARE_PLATFORMS } from '../../hooks/useClubData';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubInfosProps {
  data: ClubData;
}

export default function ClubInfos({ data }: ClubInfosProps) {
  const {
    user, clubInfos, copiedInfoId,
    infoShareMenuOpen, setInfoShareMenuOpen,
    handleLikeInfo, handleInfoShare,
  } = data;

  if (clubInfos.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
        <Bell className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
        <p className="text-neutral-500">Aucune information exclusive pour l'instant.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {clubInfos.map((info) => {
        const infoLiked = user ? (info.likes ?? []).includes(user.uid) : false;
        return (
          <motion.div key={info.id} variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 relative">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide', info.type === 'announcement' ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400' : info.type === 'resource' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' : 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400')}>
                {info.type === 'announcement' ? 'Annonce' : info.type === 'resource' ? 'Ressource' : 'Article'}
              </span>
              <p className="text-xs text-neutral-400 flex-shrink-0">{formatDate(info.publishedAt)}</p>
            </div>
            <h4 className="font-bold text-neutral-900 dark:text-white mb-2">{info.title}</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">{info.content}</p>
            {info.link && <a href={info.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline mb-3"><ExternalLink className="w-3.5 h-3.5" /> En savoir plus</a>}
            <div className="flex items-center gap-1 pt-3 border-t border-neutral-100 dark:border-neutral-700">
              <button onClick={() => handleLikeInfo(info.id, !infoLiked)} className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors', infoLiked ? 'text-error-500 bg-error-50 dark:bg-error-900/20' : 'text-neutral-400 hover:text-error-400 hover:bg-neutral-100 dark:hover:bg-neutral-700')}>
                <Heart className={cn('w-4 h-4', infoLiked && 'fill-current')} /> {(info.likes ?? []).length > 0 && (info.likes ?? []).length} J'aime
              </button>
              <div className="relative ml-auto">
                <button onClick={() => setInfoShareMenuOpen(infoShareMenuOpen === info.id ? null : info.id)} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                  {copiedInfoId === info.id ? <Check className="w-4 h-4 text-success-500" /> : <Share2 className="w-4 h-4" />} Partager
                </button>
                {infoShareMenuOpen === info.id && (
                  <div className="absolute right-0 bottom-full mb-1 z-30 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 min-w-44">
                    {SHARE_PLATFORMS.map((p) => (
                      <button key={p.id} onClick={() => handleInfoShare(p.id, info)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                        <span>{p.emoji}</span> {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
