import type { ReactNode } from 'react';
import { Icon } from '@ds';
import LocalizedLink from '../../shared/LocalizedLink';
import './edu-g1.css';

/**
 * LES PIÈCES COMMUNES DES PAGES PUBLIQUES EDU — passe 2, lot B (maquettes `Edu-*.dc.html`).
 *
 * Héros de nuit et pilule fléchée. Le pré-pied de page (« Les nouvelles formations, en
 * premier ») est UNIQUE pour tout Edu : `components/edu/g2/EduPreFooter.tsx` — une phrase
 * servie à deux endroits ferait échouer `tests/unit/copie-doublons.test.ts`, et à raison.
 */

interface PillLinkProps {
  to: string;
  children: ReactNode;
  tone?: 'default' | 'ink';
  small?: boolean;
}

/** `mm-pill` du kit : libellé + pastille fléchée. */
export function PillLink({ to, children, tone = 'default', small = false }: PillLinkProps) {
  const cls = ['mm-pill', tone === 'ink' ? 'is-ink' : '', small ? 'is-sm' : ''].filter(Boolean).join(' ');
  return (
    <LocalizedLink to={to} className={cls}>
      {children}
      <i><Icon name="arrow-up-right" size={14} strokeWidth={2.2} /></i>
    </LocalizedLink>
  );
}

interface EduNightHeroProps {
  script: string;
  title: string[];
  size?: 'xl' | 'l' | 'm';
  lede?: string;
  center?: boolean;
  children?: ReactNode;
}

/** Le héros de nuit des pages Edu : il commence sous la barre fixe (`--header-h`). */
export function EduNightHero({ script, title, size = 'l', lede, center = false, children }: EduNightHeroProps) {
  return (
    <section className="eg1-hero dk">
      <div className="mm-mesh" aria-hidden="true"><b /><b /><b /></div>
      <div className={center ? 'eg1-hero__in is-center' : 'eg1-hero__in'}>
        <span className="mm-script">{script}</span>
        <h1 className={['mm-up', size === 'xl' ? 'is-xl' : size === 'm' ? 'is-m' : ''].filter(Boolean).join(' ')}>
          {title.map((line, i) => (
            <span key={line}>{i > 0 && <br />}{line}</span>
          ))}
        </h1>
        {lede && <p className="eg1-hero__lede">{lede}</p>}
        {children}
      </div>
    </section>
  );
}
