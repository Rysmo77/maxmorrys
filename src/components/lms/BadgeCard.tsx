import { Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Badge } from '../../types/gamification';

interface BadgeCardProps {
  badge: Badge;
  unlocked: boolean;
}

export default function BadgeCard({ badge, unlocked }: BadgeCardProps) {
  return (
    <div className={cn(
      'relative flex flex-col items-center text-center p-4 rounded-2xl border transition-colors',
      unlocked
        ? 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
        : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 opacity-60',
    )}>
      <div className={cn(
        'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3',
        unlocked
          ? 'bg-gradient-to-br from-warning-100 to-warning-50 dark:from-warning-900/40 dark:to-warning-900/20'
          : 'bg-neutral-100 dark:bg-neutral-700',
      )}>
        {unlocked ? badge.icon : <Lock className="w-5 h-5 text-neutral-400" />}
      </div>
      <p className="font-bold text-sm text-neutral-900 dark:text-white mb-0.5">{badge.name}</p>
      <p className="text-xs text-neutral-500 leading-relaxed">{badge.description}</p>
      {unlocked && (
        <span className="absolute top-2 right-2 text-xs bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 px-2 py-0.5 rounded-full font-semibold">
          Obtenu
        </span>
      )}
    </div>
  );
}
