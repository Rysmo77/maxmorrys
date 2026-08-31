import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';

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
        <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--mm-orange)_4%,transparent)] flex items-center justify-center">
          <Icon name="flame" size={16} className="text-informe-txt" />
        </div>
        <div>
          <p className="text-sm font-bold text-ink">{t('streak.days', { count: currentStreak })}</p>
          <p className="text-[10px] text-ink-2">{t('streak.currentStreak')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-[color:var(--line)] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[image:var(--action-informe)] flex items-center justify-center">
          <Icon name="flame" size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-ink">{t('streak.streakOfDays', { count: currentStreak })}</p>
          <p className="text-xs text-ink-2">{t('streak.subtitle')}</p>
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
                  : 'bg-[color:var(--fill-2)] text-ink-2'
              }`}>
                {isActive ? '🔥' : day}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[color:var(--border-hair)] text-xs text-ink-2">
        <span>{t('streak.record', { count: longestStreak })}</span>
        {currentStreak > 0 && <span className="text-orange-500 font-semibold">{t('streak.xpBonus', { xp: 5 * currentStreak })}</span>}
      </div>
    </div>
  );
}
