import * as React from 'react';

/**
 * Étiquette d'état, 27 px. Quatre tons seulement, et ils veulent dire quelque chose :
 * ok = acquis, warn = en attente, stop = bloquant, neutral = information.
 */
export interface TagProps {
  /** @default "neutral" */
  tone?: 'ok' | 'warn' | 'stop' | 'neutral';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Tag(props: TagProps): JSX.Element;
