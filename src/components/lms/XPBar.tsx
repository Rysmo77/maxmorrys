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
        <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--mm-bleu)_4%,transparent)] flex items-center justify-center text-sm font-black text-forme">
          {level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="font-semibold text-ink-2">{xp} XP</span>
            <span className="text-ink-2">{getLevelTitle(level)}</span>
          </div>
          <div className="h-1.5 bg-[color:var(--fill-3)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[image:var(--action-forme)] rounded-full prog-fill transition-[width] duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-[color:var(--line)] rounded-2xl p-5">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-xl bg-[image:var(--action-forme)] flex items-center justify-center text-xl font-black text-white shadow-lg">
          {level}
        </div>
        <div>
          <p className="font-bold text-ink">{getLevelTitle(level)}</p>
          <p className="text-sm text-ink-2">{xp} XP total · Niveau {level}</p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-ink-2">
          <span>Progression vers niveau {level + 1}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2.5 bg-[color:var(--fill-3)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[image:var(--action-forme)] rounded-full prog-fill transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        {nextThreshold !== Infinity && (
          <p className="text-xs text-ink-2">{nextThreshold - xp} XP restants</p>
        )}
      </div>
    </div>
  );
}
