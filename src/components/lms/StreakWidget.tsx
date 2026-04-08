import { Flame } from 'lucide-react';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
}

export default function StreakWidget({ currentStreak, longestStreak, compact }: StreakWidgetProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Flame className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900 dark:text-white">{currentStreak} jour{currentStreak > 1 ? 's' : ''}</p>
          <p className="text-[10px] text-neutral-400">streak actuel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-neutral-900 dark:text-white">Streak de {currentStreak} jour{currentStreak > 1 ? 's' : ''}</p>
          <p className="text-xs text-neutral-500">Reviens chaque jour pour maintenir ta série</p>
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
        <span>Record : {longestStreak} jour{longestStreak > 1 ? 's' : ''}</span>
        {currentStreak > 0 && <span className="text-orange-500 font-semibold">+{5 * currentStreak} XP bonus</span>}
      </div>
    </div>
  );
}
