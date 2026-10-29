import type { CSSProperties, ReactNode } from 'react';
import { ConsoleSpaceFilter, Icon, type IconName } from '@ds';
import { ADMIN_SPACES } from '../../../lib/admin/consoleNav';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import { SPACE_DOT, type SpaceFilterValue, type SpaceLabels } from './consoleUtils';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES PIÈCES DES ÉCRANS DE CONSOLE — passe 2, lot D (maquettes `Console-*.dc.html`).
 *
 * Chaque maquette pose la même ossature sous la barre haute de la coquille :
 *   1. une rangée d'outils — filtre d'espace `mm-cspaces` à gauche, actions à droite ;
 *   2. parfois des onglets `mm-ctabs` (Modération, Edu, Club) ;
 *   3. une grille à deux colonnes — le contenu, puis une colonne fixe (340 à 440 px).
 *      Sous 1080 px tout s'empile, dans l'ordre de la maquette mobile.
 *
 * Ces pièces ne décident d'aucune donnée. Une carte sans producteur rend `HonestEmpty` :
 * ce qu'elle montrera et pourquoi elle ne montre rien — jamais une ligne d'exemple.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type { SpaceFilterValue } from './consoleUtils';

/** La page : une colonne, l'espacement du kit (`mm-con__main` 18 px, `mm-cm__body` 12 px). */
export function ConsoleScreen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="play flex min-w-0 flex-col gap-3 stack:gap-[18px]">
      {children}
    </section>
  );
}

/** La rangée d'outils : filtre d'espace (facultatif) et actions à droite. */
export function ConsoleToolbar({
  space, onSpace, labels, children, hideSpacesOnPhone = false,
}: {
  space?: SpaceFilterValue;
  onSpace?: (v: SpaceFilterValue) => void;
  labels?: SpaceLabels;
  children?: ReactNode;
  hideSpacesOnPhone?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {space !== undefined && onSpace && labels && (
        <ConsoleSpaces
          value={space}
          onChange={onSpace}
          labels={labels}
          className={hideSpacesOnPhone ? 'hidden stack:inline-flex' : undefined}
        />
      )}
      {children && <span className="ml-auto flex flex-wrap gap-2">{children}</span>}
    </div>
  );
}

/** Le filtre d'espace du kit. Les libellés viennent de la page (namespace de sa route). */
export function ConsoleSpaces({
  value, onChange, labels, className,
}: { value: SpaceFilterValue; onChange: (v: SpaceFilterValue) => void; labels: SpaceLabels; className?: string }) {
  return (
    <ConsoleSpaceFilter
      label={labels.group}
      className={['max-w-full overflow-x-auto', className].filter(Boolean).join(' ')}
      style={{ background: 'var(--bento)' }}
      value={value}
      onChange={(id) => onChange(id as SpaceFilterValue)}
      options={[
        { id: 'all', label: labels.all },
        ...ADMIN_SPACES.map((id) => ({ id, label: labels.spaces[id], dot: SPACE_DOT[id] })),
      ]}
    />
  );
}

/** Bouton de console du kit (`mm-cbtn`), en lien ou en bouton. */
export function CBtn({
  children, tone, href, onClick, disabled, icon, title, className, style, type = 'button',
}: {
  children: ReactNode;
  tone?: 'ink' | 'club' | 'stop';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: IconName;
  title?: string;
  className?: string;
  style?: CSSProperties;
  type?: 'button' | 'submit';
}) {
  const cls = ['mm-cbtn', tone ? `is-${tone}` : '', className].filter(Boolean).join(' ');
  const inner = <>{icon && <Icon name={icon} size={15} />}{children}</>;
  if (href && !disabled) {
    return <LocalizedLink className={cls} to={href} title={title} style={style}>{inner}</LocalizedLink>;
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} title={title} style={style}>
      {inner}
    </button>
  );
}

/** La grille à deux colonnes du kit. Sous 1080 px, la colonne fixe passe dessous. */
export function ConsoleGrid({
  side = 360, children, className,
}: { side?: number; children: ReactNode; className?: string }) {
  return (
    <div
      className={['grid min-w-0 items-start gap-3 wide:gap-3.5 wide:[grid-template-columns:minmax(0,1fr)_var(--cside)]', className].filter(Boolean).join(' ')}
      style={{ ['--cside' as string]: `${side}px` }}
    >
      {children}
    </div>
  );
}

/** Une pile de cartes (la colonne de droite des maquettes). */
export function ConsoleStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={['flex min-w-0 flex-col gap-3 wide:gap-3.5', className].filter(Boolean).join(' ')}>{children}</div>;
}

/** Les puces de filtre d'une carte (« Tous · 6 », « Admins · 2 »…), en `mm-cbtn` de 30 px. */
export function ConsoleChips<K extends string>({
  items, value, onChange, label,
}: {
  items: { id: K; label: string; count?: ReactNode }[];
  value: K;
  onChange: (id: K) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="mb-3 flex flex-wrap gap-2">
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(it.id)}
            className="mm-cbtn h-[30px]"
            style={on ? { background: 'var(--ink-fixed)', color: 'var(--paper-fixed)', borderColor: 'var(--ink-fixed)' } : undefined}
          >
            {it.label}{it.count !== undefined && <> · {it.count}</>}
          </button>
        );
      })}
    </div>
  );
}

/** Les onglets de console du kit (`mm-ctabs`). Un onglet sans écran derrière est désactivé, jamais caché. */
export function ConsoleTabs<K extends string>({
  items, value, onChange, label,
}: {
  items: { id: K; label: string; count?: ReactNode; disabled?: boolean; href?: string }[];
  value: K;
  onChange: (id: K) => void;
  label: string;
}) {
  return (
    <nav aria-label={label} className="mm-ctabs overflow-x-auto">
      {items.map((it) => it.href && !it.disabled ? (
        <LocalizedLink key={it.id} to={it.href} className="whitespace-nowrap">
          {it.label}
          {it.count !== undefined && <b>{it.count}</b>}
        </LocalizedLink>
      ) : (
        <a
          key={it.id}
          href={`#${it.id}`}
          aria-current={it.id === value ? 'page' : undefined}
          aria-disabled={it.disabled || undefined}
          onClick={(e) => {
            e.preventDefault();
            if (!it.disabled) onChange(it.id);
          }}
          className="whitespace-nowrap"
          style={it.disabled ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
        >
          {it.label}
          {it.count !== undefined && <b>{it.count}</b>}
        </a>
      ))}
    </nav>
  );
}

/** L'état vide honnête d'une carte : ce qu'elle montrera, et pourquoi elle ne montre rien. */
export function HonestEmpty({
  title, body, icon = 'construction', action,
}: { title: string; body?: string; icon?: IconName; action?: ReactNode }) {
  return (
    <div className="flex gap-3 px-1 py-3">
      <span
        aria-hidden="true"
        className="grid h-9 w-9 flex-none place-items-center rounded-m"
        style={{ background: 'var(--paper-2)', color: 'var(--ink-3)' }}
      >
        <Icon name={icon} size={17} />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-meta-2 font-semibold text-ink">{title}</p>
        {body && <p className="m-0 mt-1 text-[12.5px] leading-[1.5] text-ink-2">{body}</p>}
        {action && <div className="mt-2.5 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

/** Une table vide qui garde les en-têtes de la maquette, avec l'état vide en une ligne. */
export function EmptyTable({ cols, children }: { cols: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="mm-ctable">
        <thead>
          <tr>{cols.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr>
        </thead>
        <tbody>
          <tr><td colSpan={cols.length}>{children}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

/** Lien interne de carte (« Tout le journal »). */
export function CardLink({ to, children }: { to: string; children: ReactNode }) {
  return <LocalizedLink to={to} className="mt-2.5 block text-[13px] font-semibold">{children}</LocalizedLink>;
}

/** La note de bas d'écran de la maquette. */
export function ConsoleNote({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[12.5px] leading-[1.5] text-ink-3">{children}</p>;
}
