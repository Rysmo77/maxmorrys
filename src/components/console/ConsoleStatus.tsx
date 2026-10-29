import type { CSSProperties, ReactNode } from 'react';
import type { TagTone } from '@ds';

/**
 * ── LA PASTILLE D'ÉTAT DE CONSOLE (kit v3, `mm-st`) ─────────────────────────────────
 *
 * Point + libellé, une seule sémantique par teinte (« une classe, un sens », audit v4.4) :
 * `ok` fait, `warn` attend, `stop` bloque, `mute` neutre, `info` Edu, `club` Club.
 *
 * Elle accepte les tons de `Tag` (`neutral` devient `mute`) pour que les écrans de console
 * passent de l'un à l'autre sans réécrire leurs tables de statuts.
 */
export type ConsoleStatusTone = TagTone | 'mute' | 'info' | 'club';

export interface ConsoleStatusProps {
  tone?: ConsoleStatusTone;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function ConsoleStatus({ tone = 'neutral', children, className, style }: ConsoleStatusProps) {
  const cls = tone === 'neutral' ? 'mute' : tone;
  return (
    <span className={className ? `mm-st ${cls} ${className}` : `mm-st ${cls}`} style={style}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}
