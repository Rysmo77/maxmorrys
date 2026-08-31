import { cn } from '../../lib/utils';
import type { Badge } from '../../types/gamification';
import { Icon } from '@ds';

interface BadgeCardProps {
  badge: Badge;
  unlocked: boolean;
}

const gradientByCategory: Record<Badge['category'], string> = {
  learning: 'bg-[color-mix(in_srgb,var(--mm-bleu)_12%,transparent)]',
  streak: 'bg-[color-mix(in_srgb,var(--warn)_12%,transparent)]',
  community: 'bg-[color-mix(in_srgb,var(--mm-bleu)_12%,transparent)]',
  achievement: 'bg-[color-mix(in_srgb,var(--mm-orange)_12%,transparent)]',
};

export default function BadgeCard({ badge, unlocked }: BadgeCardProps) {
  return (
    <div className={cn(
      'relative flex flex-col items-center text-center p-4 rounded-2xl border transition-colors',
      unlocked
        ? 'bg-paper border-[color:var(--line)]'
        : 'bg-[color:var(--fill-1)] border-[color:var(--line)] opacity-60',
    )}>
      <div className={cn(
        'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3',
        unlocked
          ? `bg-gradient-to-br ${gradientByCategory[badge.category]}`
          : 'bg-[color:var(--fill-2)]',
      )}>
        {unlocked ? badge.icon : <Icon name="lock" size={20} className="text-ink-2" />}
      </div>
      <p className="font-bold text-sm text-ink mb-0.5">{badge.name}</p>
      <p className="text-xs text-ink-2 leading-relaxed">{badge.description}</p>
      {unlocked && (
        <span className="absolute top-2 right-2 text-xs bg-[color-mix(in_srgb,var(--ok)_4%,transparent)] text-ok px-2 py-0.5 rounded-full font-semibold">
          Obtenu
        </span>
      )}
    </div>
  );
}
