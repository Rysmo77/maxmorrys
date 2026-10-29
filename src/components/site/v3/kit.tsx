import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '@ds';

/**
 * LES BRIQUES DES MAQUETTES DU HUB (passe 2, lot A) — `Main`, `Site-*`, `Hub-*`.
 *
 * Les maquettes du kit v3 sont écrites en classes `.mm-*` (générées dans
 * `kit-v3/components.css`) ; ces briques les recopient telles quelles pour que le rendu
 * reste celui de la planche. Elles ne portent aucune donnée : les pages leur passent des
 * textes i18n et des faits dérivés.
 *
 * Écarts volontaires à la planche :
 * - la barre haute n'est pas dans la dalle : c'est le `Header` fixe du châssis, opaque
 *   (AD-26). La dalle remonte SOUS lui (`NightHero`) pour que le noir commence en haut de
 *   la fenêtre comme sur la maquette ;
 * - les « photographie à faire » de la planche ne s'affichent jamais : une photo absente
 *   est le seul dégradé du kit (`Photo` sans `img`) ;
 * - aucun hexadécimal (AD-2) : l'accent violet clair de la dalle est `--mm-violet` sous
 *   `.dk`, qui vaut précisément le violet clair de la maquette.
 */

export type PhotoTone = 'hub' | 'club' | 'edu' | 'informe' | 'studio';

const BRACKETS = /\[([^\]]+)\]/;

/** Les fragments entre crochets d'un titre i18n prennent le surlignage du kit (`mm-hl`). */
export function Hl({ text, tone = 'club' }: { text: string; tone?: 'club' | 'edu' }) {
  const parts = text.split(BRACKETS);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className={tone === 'club' ? 'mm-hl is-club' : 'mm-hl'}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Sur la dalle de nuit, le fragment entre crochets prend l'aplat violet clair de la planche. */
export function NightAccent({ text }: { text: string }) {
  const parts = text.split(BRACKETS);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-[color:var(--mm-violet)]">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Les lignes d'un titre (tableau i18n) séparées par `<br>`, crochets compris. `aplat` = la variante de la dalle de nuit (le thème reste la portée `.dk`). */
export function Lines({ lines, accent = 'hl', tone = 'club' }: { lines: string[]; accent?: 'hl' | 'aplat'; tone?: 'club' | 'edu' }) {
  return (
    <>
      {lines.map((l, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {i > 0 && <br />}
          {accent === 'aplat' ? <NightAccent text={l} /> : <Hl text={l} tone={tone} />}
        </span>
      ))}
    </>
  );
}

export function ArrowUpRight({ size = 16 }: { size?: number }) {
  return <Icon name="arrow-up-right" size={size} />;
}

export type KitTone = 'club' | 'edu' | 'studio' | 'highlight' | 'quiet' | 'ghost' | 'ink' | 'veil';

interface KitButtonProps {
  href?: string;
  children: ReactNode;
  tone?: KitTone;
  size?: 'sm' | 'md';
  arrow?: boolean;
  className?: string;
  style?: CSSProperties;
  target?: '_blank';
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Le bouton de la planche (`mm-btn`). `veil` = le bouton translucide de la dalle de nuit.
 * Sans `href`, un `<button>`.
 */
export function KitButton({ href, children, tone = 'club', size = 'md', arrow = false, className = '', style, target, type = 'button', onClick, disabled }: KitButtonProps) {
  const toneCls = tone === 'ink' || tone === 'veil' ? '' : `is-${tone}`;
  const cls = ['mm-btn', toneCls, size === 'sm' && 'is-sm', arrow && 'has-arrow', 'no-underline', className].filter(Boolean).join(' ');
  /* Le voile de la dalle : blanc à 10 %, filet à 20 %, encre claire — par les variables du kit. */
  if (tone === 'veil') {
    style = { ['--bg' as string]: 'rgb(255 255 255 / .1)', ['--fg' as string]: 'var(--ink)', border: '1px solid rgb(255 255 255 / .2)', ...style };
  }
  const inner = (
    <>
      {children}
      {arrow && (
        <span className="mm-btn__arrow" aria-hidden="true" style={tone === 'club' || tone === 'edu' || tone === 'studio' ? { background: 'var(--paper-fixed)', color: 'var(--ink-fixed)' } : undefined}>
          <ArrowUpRight />
        </span>
      )}
    </>
  );
  if (!href) {
    return (
      <button type={type} className={cls} style={style} onClick={onClick} disabled={disabled}>
        {inner}
      </button>
    );
  }
  return (
    <a href={href} target={target} rel={target ? 'noopener noreferrer' : undefined} className={cls} style={style}>
      {inner}
    </a>
  );
}

interface PhotoProps {
  tone?: PhotoTone;
  className?: string;
  style?: CSSProperties;
  /** Une vraie image. Absente : le dégradé du kit, sans libellé. */
  img?: { src: string; srcSet?: string; width?: number; height?: number; alt: string; sizes?: string; eager?: boolean };
  children?: ReactNode;
}

export function Photo({ tone = 'hub', className = '', style, img, children }: PhotoProps) {
  return (
    <div
      className={['mm-photo', tone !== 'hub' && `is-${tone}`, className].filter(Boolean).join(' ')}
      style={style}
      aria-hidden={img || children ? undefined : true}
    >
      {img && (
        <img
          src={img.src}
          srcSet={img.srcSet}
          sizes={img.sizes}
          width={img.width}
          height={img.height}
          alt={img.alt}
          loading={img.eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      {children}
    </div>
  );
}

/**
 * LA DALLE DE NUIT des maquettes : pleine largeur, coins bas arrondis, remontée sous la barre
 * fixe du châssis. `.dk` bascule l'encre en clair pour tout ce qu'elle contient.
 */
export function NightHero({
  children,
  className = '',
  style,
  backdrop,
  mesh = 'club',
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Un fond posé sous le contenu (photo, dégradé, voile). */
  backdrop?: ReactNode;
  mesh?: 'club' | 'edu' | 'hub' | 'nuit' | 'digitalise' | null;
}) {
  return (
    <section
      className={`dk relative isolate overflow-hidden rounded-b-xl bg-night text-ink ${className}`}
      style={{ marginTop: 'calc(-1 * var(--header-h))', paddingTop: 'var(--header-h)', ...style }}
    >
      {backdrop}
      {mesh && (
        <div aria-hidden="true" className={`mm-mesh m-${mesh} is-wide`} style={{ opacity: 0.7 }}>
          <b />
          <b />
          <b />
        </div>
      )}
      {children}
    </section>
  );
}

/** La colonne des maquettes : 1360 px, gouttière 24 px (18 px au mobile). */
export function KitSection({
  children,
  className = '',
  style,
  width = 1360,
  id,
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  width?: number;
  id?: string;
  as?: 'section' | 'div';
}) {
  return (
    <Tag id={id} className={`relative z-[3] mx-auto box-border w-full px-[18px] stack:px-6 ${className}`} style={{ maxWidth: `${width}px`, ...style }}>
      {children}
    </Tag>
  );
}

/** Le grand titre de section de la planche (`mm-d`, clamp 36→64). */
export function KitH2({ children, className = '', size = 'clamp(36px, 5vw, 64px)', id }: { children: ReactNode; className?: string; size?: string; id?: string }) {
  return (
    <h2 id={id} className={`mm-d ${className}`} style={{ fontSize: size }}>
      {children}
    </h2>
  );
}

/** Le sourcil à crochets du kit. */
export function Eyebrow({ children, tone, className = '' }: { children: ReactNode; tone?: 'edu' | 'club' | 'informe' | 'studio'; className?: string }) {
  return <span className={['mm-eyebrow', tone && `is-${tone}`, className].filter(Boolean).join(' ')}>{children}</span>;
}
