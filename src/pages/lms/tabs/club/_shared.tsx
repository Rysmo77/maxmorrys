import type { Icon } from '@phosphor-icons/react';

/** Empty state cohérent pour le Club : pastille plum + icône duotone + titre + sous-titre + CTA optionnel. */
export function ClubEmptyState({
  icon: IconCmp, title, subtitle, action,
}: {
  icon: Icon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
      <div className="w-14 h-14 rounded-2xl bg-plum-50 dark:bg-plum-900/20 flex items-center justify-center mx-auto mb-3">
        <IconCmp className="w-7 h-7 text-plum-500" weight="duotone" />
      </div>
      <p className="font-bold text-neutral-900 dark:text-white">{title}</p>
      {subtitle && <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">{subtitle}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** En-tête de section uniforme : icône plum + titre, action optionnelle à droite. */
export function ClubSectionHeader({
  icon: IconCmp, title, action,
}: {
  icon: Icon;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        <IconCmp className="w-5 h-5 text-plum-500" weight="duotone" />
        <h3 className="font-bold text-neutral-900 dark:text-white">{title}</h3>
      </div>
      {action}
    </div>
  );
}
