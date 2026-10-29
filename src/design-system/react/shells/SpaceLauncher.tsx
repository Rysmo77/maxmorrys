import type { CSSProperties, ReactNode } from 'react';

/**
 * LE LANCEUR D'ESPACE — kit v3 (AD-27), `mm-launch is-edu | is-club`.
 *
 * Une grande tuile dégradée qui mène d'un espace à l'autre (tableau de bord du compte, et en
 * croisé Apprendre ↔ Club). Elle ne porte que des FAITS RÉELS (`meta`) : leçon en cours,
 * prochaine session, messages non lus — servis par la surface depuis la base. Aucune valeur
 * par défaut : sans fait, la ligne disparaît (règle 6). Un non-membre ne voit jamais un
 * nombre de membres (fiche SpaceSwitcher du kit).
 */
export interface SpaceLauncherProps {
  space: 'edu' | 'club';
  href: string;
  title: string;
  text?: string;
  /** Petite ligne en capitales au-dessus du titre (ex. le nom de l'espace). */
  kicker?: string;
  /** Faits réels, déjà formatés. Rien n'est inventé ici. */
  meta?: ReactNode[];
  className?: string;
  style?: CSSProperties;
}

export function SpaceLauncher({ space, href, title, text, kicker, meta, className = '', style }: SpaceLauncherProps) {
  return (
    <a href={href} className={['mm-launch', `is-${space}`, className].filter(Boolean).join(' ')} style={style}>
      <div className="mm-launch__top">
        <span className="mm-launch__domain">{kicker}</span>
        <span className="mm-launch__go" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
      <div>
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {meta && meta.length > 0 && (
          <div className="mm-launch__meta">{meta.map((m, i) => <span key={i}>{m}</span>)}</div>
        )}
      </div>
    </a>
  );
}
