import type { CSSProperties, ReactNode } from 'react';
import type { NumSource } from '../types';
import { Num } from './Num';

/**
 * La ligne de liste du produit : leçon, entrée d'espace personnel, réglage, tâche
 * d'administration. Toujours dans un `GlassPanel` niveau `flat` — ces listes DÉFILENT, donc
 * aucun flou nulle part sur ce chemin.
 *
 * CE QUI A CHANGÉ, ET POURQUOI ÇA NE POUVAIT PAS SE REPORTER. Le kit rendait une `<div>` avec
 * un `onClick` : rien n'était atteignable au clavier, rien n'était annoncé comme cliquable,
 * et l'anneau de focus n'avait aucun élément à entourer. AD-6 déclare ce défaut bloquant et
 * dit où il se corrige : « le port React est le moment où ces défauts se corrigent — ils ne
 * se reportent pas. » Une ligne qui NAVIGUE est un `<a href>` — elle doit s'ouvrir dans un
 * onglet et se copier ; une ligne qui AGIT est un `<button>` ; une ligne inerte reste une
 * `<div>`, et elle ne prend alors ni curseur ni enfoncement.
 *
 * ⚠️ `trailing` NE CONTIENT JAMAIS DE CONTRÔLE quand la ligne est elle-même cliquable : un
 * bouton dans un bouton est un document invalide, et le clavier n'atteint plus l'intérieur.
 * Un `Tag`, un chevron, un nombre — pas un bouton.
 */
export interface LessonRowProps {
  /** @default "todo" */
  state?: 'done' | 'current' | 'todo' | 'plain';
  /** Icône ou glyphe à gauche. Remplace la puce d'état. */
  icon?: ReactNode;
  iconBackground?: string;
  title?: ReactNode;
  /**
   * Durée de la leçon, telle qu'elle sort de la base : « 06:12 ».
   * Les trois champs vont ENSEMBLE, et c'est le type qui l'impose : un chiffre sans source ni
   * date de relevé ne se rend pas, et il ne doit donc pas pouvoir s'écrire.
   */
  duration?: { value: number | string; source: NumSource; asOf: Date };
  /** Le reste de la métadonnée, NON chiffré : « en cours », « nouveau ». */
  meta?: ReactNode;
  /** À droite : un Tag, un chevron, un nombre. Jamais un contrôle — voir plus haut. */
  trailing?: ReactNode;
  /** La ligne NAVIGUE : rendue en <a href>. */
  href?: string;
  /** La ligne AGIT : rendue en <button type="button">. */
  onClick?: () => void;
  last?: boolean;
  style?: CSSProperties;
}

export function LessonRow({
  state = 'todo', icon, iconBackground, title, duration, meta, trailing, href, onClick, last, style,
}: LessonRowProps) {
  const current = state === 'current';
  const interactive = Boolean(href || onClick);

  let left: ReactNode = null;
  if (icon !== undefined) {
    left = (
      <span aria-hidden="true" style={{ width: '34px', height: '34px', borderRadius: '11px', display: 'grid', placeItems: 'center', flex: '0 0 auto', background: iconBackground || 'var(--fill-1)' }}>
        {icon}
      </span>
    );
  } else if (state === 'done') {
    left = (
      // Le voile de la pastille suit `--ok` au lieu de le recopier en rgba : c'est le même
      // .16 que le kit, mais rattaché au jeton, donc corrigible en un seul endroit.
      <span aria-hidden="true" style={{ width: '25px', height: '25px', borderRadius: '50%', background: 'color-mix(in srgb, var(--ok) 16%, transparent)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 7" /></svg>
      </span>
    );
  } else if (state === 'todo') {
    // --fill-3 et non --ink-3 : l'anneau vide est un filet, pas du texte, et il s'inverse.
    left = <span aria-hidden="true" style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2.5px solid var(--fill-3)', flex: '0 0 auto' }} />;
  }

  const css: CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
    padding: current ? '13px 18px' : '13px 0',
    border: 0, background: 'none', color: 'inherit', font: 'inherit',
    cursor: interactive ? 'pointer' : undefined,
    textDecoration: 'none',
    borderBottom: last ? 0 : '1px solid var(--border-hair)',
    ...(current
      ? {
          // Le fond de la ligne en cours passe par les deux teintes de marque plutôt que par
          // leurs rgba figés : sous `.dk` elles prennent leur variante nuit, et le voile
          // reste visible. Un rgba(0,87,188,.1) sur fond #0B0E13 ne se voit pas.
          background: 'linear-gradient(135deg,color-mix(in srgb, var(--mm-bleu) 10%, transparent),color-mix(in srgb, var(--mm-violet) 10%, transparent))',
          margin: '0 -18px', borderRadius: '14px', borderBottom: 0,
        }
      : null),
    ...style,
  };

  // 13 px de rembourrage haut et bas plus une puce de 25 à 34 px : la ligne dépasse déjà les
  // 44 px exigés. `.mm-touch-extend` la borne quand même — une ligne sans puce ni méta
  // descend à 46 px, et un seul réglage de densité en aval la ferait passer dessous.
  const cls = interactive ? 'mm-press mm-touch-extend' : undefined;

  const inner = (
    <>
      {left}
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: '14px', fontWeight: 600, letterSpacing: '-.01em', color: 'var(--text-body)' }}>{title}</b>
        {/* --text-muted, jamais --text-faint : le kit posait la durée sur l'encre tertiaire,
            qui fait 2,61:1 sur blanc pur — aucun voile ne la sauve (AD-18). */}
        {(duration || meta) && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {duration && <Num value={duration.value} source={duration.source} asOf={duration.asOf} />}
            {duration && meta ? ' · ' : null}
            {meta}
          </span>
        )}
      </span>
      {trailing}
    </>
  );

  if (href) return <a href={href} className={cls} style={css}>{inner}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={cls} style={css}>{inner}</button>;
  return <div style={css}>{inner}</div>;
}
