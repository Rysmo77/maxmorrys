import type { CSSProperties } from 'react';

/**
 * Le M découpé en quatre teintes — le SEUL fichier de logo qui existe.
 *
 * Il n'existe ni SVG, ni version monochrome, ni logotype horizontal, ni version nuit. Rien
 * n'a été redessiné ni reconstruit de mémoire : si un SVG apparaît un jour, il remplace le
 * PNG sans autre changement.
 *
 * ⚠️ Le fichier pèse 273 Ko en 1254 × 1254 pour un rendu à 42–92 px — 30 % du budget de
 * première vue de 900 Ko. Partout où une signature horizontale est attendue, préférer
 * `Wordmark`, qui rend la même marque en type pur pour 0 octet. Le PNG ne survit que sur
 * pastille blanche, sur fond coloré, là où le type ne tient pas.
 *
 * La pastille est l'une des trois exceptions assumées à la règle « aucune couleur en dur » :
 * elle est blanche dans les deux modes, parce qu'elle porte une image à fond blanc.
 */
export interface LogoMarkProps {
  size?: number;
  src?: string;
  /** Pastille blanche arrondie — obligatoire sur fond coloré, le PNG n'ayant pas de transparence. */
  plate?: boolean;
  /** Le logo est décoratif quand un `Wordmark` le suit ; sinon il porte le nom. */
  alt?: string;
  style?: CSSProperties;
}

export function LogoMark({ size = 40, src = '/icone-mm.png', plate, alt, style }: LogoMarkProps) {
  const inner = plate ? Math.round(size * 0.86) : size;
  return (
    <span
      style={{
        width: `${size}px`, height: `${size}px`, display: 'grid', placeItems: 'center', flex: '0 0 auto',
        borderRadius: plate ? `${Math.round(size * 0.28)}px` : 0,
        background: plate ? 'var(--paper-fixed)' : 'transparent',
        boxShadow: plate ? '0 4px 14px rgba(14,17,22,.12)' : 'none',
        overflow: 'hidden',
        ...style,
      }}
    >
      <img
        src={src}
        alt={alt ?? ''}
        aria-hidden={alt ? undefined : true}
        width={inner}
        height={inner}
        loading="lazy"
        decoding="async"
        style={{ display: 'block' }}
      />
    </span>
  );
}
