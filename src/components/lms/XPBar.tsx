import { getLevelFromXP, getXPForNextLevel, getLevelTitle } from '../../types/gamification';

interface XPBarProps {
  xp: number;
  compact?: boolean;
}

export default function XPBar({ xp, compact }: XPBarProps) {
  const level = getLevelFromXP(xp);
  const currentThreshold = getXPForNextLevel(level - 1);
  const nextThreshold = getXPForNextLevel(level);
  const progress = nextThreshold === Infinity
    ? 100
    : Math.min(100, Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100));

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-sm font-black text-brand-600 dark:text-brand-400">
          {level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{xp} XP</span>
            <span className="text-neutral-400">{getLevelTitle(level)}</span>
          </div>
          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xl font-black text-white shadow-lg">
          {level}
        </div>
        <div>
          <p className="font-bold text-neutral-900 dark:text-white">{getLevelTitle(level)}</p>
          <p className="text-sm text-neutral-500">{xp} XP total · Niveau {level}</p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-neutral-500">
          <span>Progression vers niveau {level + 1}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        {nextThreshold !== Infinity && (
          <p className="text-xs text-neutral-400">{nextThreshold - xp} XP restants</p>
        )}
      </div>
    </div>
  );
}
