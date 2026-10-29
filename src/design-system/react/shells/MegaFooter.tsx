import type { CSSProperties, ReactNode } from 'react';

/**
 * LE PIED DE PAGE GÉANT — kit v3 (AD-27), `mm-footer__rule` + `mm-footer__mega`.
 *
 * Une dalle nuit (portée `.dk`, comme le pied de page l'était déjà), le contenu de la surface
 * (colonnes, lettre — le SEUL point de capture, FR-006), puis le filet des quatre teintes et
 * le nom en Fraunces qui déborde, puis les mentions.
 *
 * Le nom est DÉCORATIF (`aria-hidden`) : la marque est déjà dite par le mot-symbole des
 * colonnes. Il est découpé en lettres pour que le kit puisse les faire monter une à une ;
 * hors de la portée `.mm`, il est simplement posé — rien ne dépend du script pour se voir.
 */
export interface MegaFooterProps {
  /** Le nom géant. La surface le fournit (aucune marque n'est écrite dans le système). */
  name: string;
  children: ReactNode;
  /** Les mentions, sous le nom. */
  legal?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Gouttière et mesure du contenu — celles du corps de page, fournies par la surface. */
  innerClassName?: string;
  innerStyle?: CSSProperties;
}

export function MegaFooter({ name, children, legal, className = '', style, innerClassName, innerStyle }: MegaFooterProps) {
  return (
    <footer className={['dk mm-megafooter', className].filter(Boolean).join(' ')} style={style}>
      <div className={innerClassName} style={innerStyle}>
        {children}
        <div className="mm-footer__rule" aria-hidden="true" />
        <div className="mm-footer__mega" aria-hidden="true">
          {Array.from(name).map((c, i) => (
            <span key={i} style={{ ['--i' as string]: i } as CSSProperties}>{c}</span>
          ))}
        </div>
        {legal}
      </div>
    </footer>
  );
}
