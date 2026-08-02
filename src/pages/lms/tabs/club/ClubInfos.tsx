import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Heart, BellRinging, ArrowSquareOut, ShareFat, Check,
} from '@phosphor-icons/react';
import { cn, markdownToHtml } from '../../../../lib/utils';
import { useFormat } from '../../../../hooks/useFormat';
import { ClubEmptyState } from './_shared';
import { SHARE_PLATFORMS } from '../../hooks/useClubData';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubInfosProps {
  data: ClubData;
}

export default function ClubInfos({ data }: ClubInfosProps) {
  const { t } = useTranslation('club');
  const { formatDate } = useFormat();
  const {
    user, clubInfos, copiedInfoId,
    infoShareMenuOpen, setInfoShareMenuOpen,
    handleLikeInfo, handleInfoShare,
  } = data;

  if (clubInfos.length === 0) {
    return <ClubEmptyState icon={BellRinging} title={t('infos.emptyTitle')} subtitle={t('infos.emptySubtitle')} />;
  }

  return (
    <motion.div
      className="grid lg:grid-cols-2 gap-4 items-start"
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
                {info.type === 'announcement' ? t('infos.typeAnnouncement') : info.type === 'resource' ? t('infos.typeResource') : t('infos.typeArticle')}
              </span>
              <p className="text-xs text-neutral-400 flex-shrink-0">{formatDate(info.publishedAt)}</p>
            </div>
            <h4 className="font-bold text-neutral-900 dark:text-white mb-2">{info.title}</h4>
            <div className="prose prose-sm dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3 prose-headings:text-neutral-900 dark:prose-headings:text-white prose-a:text-plum-600 dark:prose-a:text-plum-400" dangerouslySetInnerHTML={{ __html: markdownToHtml(info.content) }} />
            {info.link && <a href={info.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-plum-600 dark:text-plum-400 hover:underline mb-3"><ArrowSquareOut className="w-3.5 h-3.5" weight="bold" /> {t('infos.learnMore')}</a>}
            <div className="flex items-center gap-1 pt-3 border-t border-neutral-100 dark:border-neutral-700">
              <button onClick={() => handleLikeInfo(info.id, !infoLiked)} className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors', infoLiked ? 'text-coral-500 bg-coral-50 dark:bg-coral-900/20' : 'text-neutral-400 hover:text-coral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700')}>
                <Heart className="w-4 h-4" weight={infoLiked ? 'fill' : 'regular'} /> {(info.likes ?? []).length > 0 && (info.likes ?? []).length} {t('infos.like')}
              </button>
              <div className="relative ml-auto">
                <button onClick={() => setInfoShareMenuOpen(infoShareMenuOpen === info.id ? null : info.id)} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl text-neutral-400 hover:text-plum-600 dark:hover:text-plum-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                  {copiedInfoId === info.id ? <Check className="w-4 h-4 text-success-500" weight="bold" /> : <ShareFat className="w-4 h-4" />} {t('infos.share')}
                </button>
                {infoShareMenuOpen === info.id && (
                  <div className="absolute right-0 bottom-full mb-1 z-30 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 min-w-44 max-w-[calc(100vw-1.5rem)]">
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
