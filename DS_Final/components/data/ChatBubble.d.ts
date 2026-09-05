import * as React from 'react';

/**
 * Bulle de conversation Rysmo. `me` : dégradé violet→bleu, coin bas droit resserré.
 * `ai` : verre clair, coin bas gauche resserré. `typing` : trois points qui clignotent.
 */
export interface ChatBubbleProps {
  /** @default "ai" */
  from?: 'me' | 'ai';
  typing?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function ChatBubble(props: ChatBubbleProps): JSX.Element;
