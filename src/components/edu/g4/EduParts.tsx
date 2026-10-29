import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '@ds';

/**
 * LES PIÈCES COMMUNES DES ÉCRANS « MON ÉCOLE » — passe 2, lot B (kit v3, 29/10/2026).
 *
 * Cohorte, Live, Agenda, Succès, Notes et Rysmo IA partagent la même grammaire dans les
 * maquettes : un en-tête (sourcil + titre d'affichage), des cartes `.mm-card` titrées en
 * `h3`, et une grille « colonne de travail + panneau ». Quand une carte n'a pas de
 * producteur côté serveur, elle garde SA place dans la grille et dit pourquoi elle est
 * vide (`CardEmpty`) — jamais une donnée d'exemple (D-09).
 */

interface EduPageProps {
  children: ReactNode;
}

/** Gouttière de la colonne principale de la coquille Edu. */
export function EduPage({ children }: EduPageProps) {
  return <div className="px-[18px] pb-10 pt-4 wide:px-pane wide:pt-6">{children}</div>;
}

interface EduHeadProps {
  eyebrow: ReactNode;
  title: ReactNode;
  /** Actions ou étiquettes alignées à droite (bureau). */
  aside?: ReactNode;
}

/**
 * Sourcil + titre de 44 px (bureau). Sous 700 px, la barre haute de la coquille porte déjà
 * le titre (maquettes `-mobile`) : seul le sourcil reste, en ligne de contexte.
 */
export function EduHead({ eyebrow, title, aside }: EduHeadProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-4 stack:mb-5 stack:mt-1">
      <div className="min-w-0">
        <span className="mm-eyebrow">{eyebrow}</span>
        <h1 className="mm-d sr-only stack:not-sr-only stack:mt-[10px]" style={{ fontSize: 44 }}>{title}</h1>
      </div>
      {aside && <div className="flex flex-wrap items-center gap-[10px]">{aside}</div>}
    </div>
  );
}

interface EduCardProps {
  title?: ReactNode;
  /** Texte d'appoint à droite du titre (compte, période). */
  meta?: ReactNode;
  /** Élément en bout de titre (lien, onglets). */
  end?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: 'section' | 'div' | 'article';
}

export function EduCard({ title, meta, end, children, className, style, as: Tag = 'section' }: EduCardProps) {
  return (
    <Tag className={`mm-card${className ? ` ${className}` : ''}`} style={style}>
      {(title || meta || end) && (
        <div className="mb-[14px] flex flex-wrap items-center gap-[10px]">
          {title && <h3>{title}</h3>}
          {meta && <span className="text-[13px] text-ink-2">{meta}</span>}
          {end && <span className="ml-auto flex items-center gap-2">{end}</span>}
        </div>
      )}
      {children}
    </Tag>
  );
}

interface CardEmptyProps {
  icon: IconName;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  /** Sur une carte sombre (`.dk`), le pastille passe en voile clair. */
  onDark?: boolean;
}

/** L'état vide d'UNE carte : glyphe, phrase, explication, éventuelle sortie. */
export function CardEmpty({ icon, title, body, action, onDark }: CardEmptyProps) {
  return (
    <div className="flex items-start gap-[14px]">
      <span
        aria-hidden="true"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-m"
        style={{
          background: onDark ? 'color-mix(in srgb, var(--paper-fixed) 16%, transparent)' : 'var(--fill-1)',
          color: onDark ? 'var(--paper-fixed)' : 'var(--ink-2)',
        }}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <b className="block text-[15px] leading-[1.3]">{title}</b>
        {body && (
          <p className="m-0 mt-1 text-[13.5px] leading-[1.5]" style={{ color: onDark ? 'color-mix(in srgb, var(--paper-fixed) 80%, transparent)' : 'var(--ink-2)' }}>
            {body}
          </p>
        )}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

/** Grille « colonne de travail + panneau » des maquettes ; empilée sous 1080 px. */
export function EduGrid({ aside, children, asideWidth = 360 }: { aside: ReactNode; children: ReactNode; asideWidth?: number }) {
  return (
    <div
      className="grid grid-cols-1 items-start gap-5 wide:gap-[22px] wide:[grid-template-columns:minmax(0,1fr)_var(--aside-w)]"
      style={{ ['--aside-w' as string]: `${asideWidth}px` }}
    >
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
      <div className="flex min-w-0 flex-col gap-5">{aside}</div>
    </div>
  );
}
