import type { CSSProperties } from 'react';

/**
 * LE FIL D'ARIANE — pages éditoriales et de catalogue. Il manque aujourd'hui sur quatre
 * pages publiques : c'est une dette relevée, pas une option de conception.
 *
 * UNE VRAIE LISTE ORDONNÉE, ET DE VRAIS LIENS. Le kit rendait des `<b>` dans un `<div>` :
 * aucun niveau n'était atteignable, l'ordre n'était pas annoncé, et la page courante ne se
 * distinguait que par une nuance de gris — donc pas du tout pour qui ne la distingue pas.
 * `<nav aria-label>` + `<ol>` + `<a href>`, le dernier élément en `aria-current="page"` et
 * non cliquable : on ne propose pas d'aller là où on est déjà (AD-6).
 *
 * LE MONOSPACE VIENT DE LA CLASSE, PAS D'UN STYLE EN LIGNE. `ds:check` réserve `--f-mono`
 * au composant `<Num>` — un chiffre en monospace vient de la base ou d'une source citée, et
 * la façon la plus simple de tenir cette règle est de garder un seul chemin vers la fonte
 * dans les fichiers de composants. Un fil d'Ariane n'est pas un nombre : il emprunte la
 * fonte du sourcil, qui est la même, et redéfinit les trois déclarations qui diffèrent.
 *
 * AD-18 : tout remonte d'un cran. Le kit posait la page courante sur `--ink-2` et les
 * ancêtres sur `--ink-3` ; l'encre tertiaire fait 2,61:1 sur blanc pur et aucun voile ne la
 * sauve. La courante passe donc sur l'encre pleine, les ancêtres sur `--ink-2` — la même
 * hiérarchie, deux crans plus haut.
 */

const LIST: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  /* Trois niveaux ne tiennent pas sur 390 px : sans repli de ligne, le dernier — celui qui
     dit où l'on est — sort de l'écran. */
  flexWrap: 'wrap',
  gap: '7px',
  listStyle: 'none',
  margin: 0,
  padding: 0,
  fontSize: '11.5px',
  letterSpacing: 'normal',
  textTransform: 'none',
};

const CRUMB: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  /* La cible s'étend en HAUTEUR seulement. Horizontalement, deux fils voisins séparés de
     7 px verraient leurs cibles de 44 px se chevaucher, ce qui est pire que le défaut qu'on
     corrige — et un lien en ligne dans un fil de texte est exempté du plancher de taille. */
  minHeight: 'var(--touch-aa)',
  fontWeight: 400,
  textDecoration: 'none',
};

export interface BreadcrumbItem {
  label: string;
  /** Absent sur le dernier niveau : la page courante n'est pas un lien vers elle-même. */
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Nom du point de repère. Il se traduit : la chaîne vient de la surface. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function Breadcrumb({ items, label, className = '', style }: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={className || undefined} style={style}>
      <ol className="mm-eyebrow" style={LIST}>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              {/* Le séparateur est un filet dessiné avec une barre oblique : décoratif, donc
                  masqué au lecteur d'écran — et c'est le seul emploi que l'AD-18 laisse à
                  l'encre tertiaire, celui où elle ne porte pas de texte. */}
              {i > 0 && <span aria-hidden="true" style={{ color: 'var(--text-faint)' }}>/</span>}
              {last || !it.href ? (
                <span aria-current={last ? 'page' : undefined} style={{ ...CRUMB, color: 'var(--text-body)' }}>
                  {it.label}
                </span>
              ) : (
                <a href={it.href} style={{ ...CRUMB, color: 'var(--text-muted)' }}>{it.label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
