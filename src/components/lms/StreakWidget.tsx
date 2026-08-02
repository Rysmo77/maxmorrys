import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
}

export default function StreakWidget({ currentStreak, longestStreak, compact }: StreakWidgetProps) {
  const { t } = useTranslation('lms');
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
          <Flame className="w-4 h-4 text-accent-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900 dark:text-white">{t('streak.days', { count: currentStreak })}</p>
          <p className="text-[10px] text-neutral-400">{t('streak.currentStreak')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-neutral-900 dark:text-white">{t('streak.streakOfDays', { count: currentStreak })}</p>
          <p className="text-xs text-neutral-500">{t('streak.subtitle')}</p>
        </div>
      </div>

      {/* Week dots */}
      <div className="flex items-center justify-between gap-1">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => {
          const isActive = i < Math.min(currentStreak, 7);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400'
              }`}>
                {isActive ? '🔥' : day}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-700 text-xs text-neutral-500">
        <span>{t('streak.record', { count: longestStreak })}</span>
        {currentStreak > 0 && <span className="text-orange-500 font-semibold">{t('streak.xpBonus', { xp: 5 * currentStreak })}</span>}
      </div>
    </div>
  );
}
