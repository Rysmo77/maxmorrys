import * as React from 'react';

/**
 * Bandeau obligatoire en tête de tout contenu éditorial traduit. Il existe parce que la
 * traduction est générée au pré-rendu **et mise en cache** : une correction du français
 * n'atteint la page anglaise qu'à l'expiration du cache, et il n'y a pas d'invalidation
 * manuelle. Le dire coûte moins cher que de faire semblant.
 *
 * Toujours en anglais — c'est un lecteur anglophone qui le lit — et toujours au-dessus du
 * corps, jamais en pied de page : après l'article, l'avertissement n'avertit plus.
 */
export interface TranslationNoticeProps {
  /** Date de génération, telle qu'elle sort du pré-rendu. Rendue en monospace. */
  date: string;
  /** URL de la version française. */
  href?: string;
  /** @default "Read the original" */
  originalLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export function TranslationNotice(props: TranslationNoticeProps): JSX.Element;
