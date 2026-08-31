import type { CSSProperties } from 'react';

/**
 * Avancement d'un tunnel court — trois barres pleine largeur, jamais un numéro seul.
 *
 * Le kit rendait trois `<i>` dans un `<div>` : pour un lecteur d'écran, rien. Pas une liste,
 * pas un ordre, pas d'étape courante — l'information la plus simple de l'écran de paiement
 * n'existait que pour l'œil. Ici c'est un `<ol>` avec `aria-current="step"` sur l'étape en
 * cours : la structure dit qu'il y a un ordre, l'attribut dit où on en est.
 *
 * `current` est le NOMBRE D'ÉTAPES FRANCHIES, comme dans le kit — les barres pleines sont
 * celles d'indice inférieur, l'étape courante est la dernière d'entre elles.
 *
 * Le libellé « Étape 2 sur 3 » vit dans la barre haute, pas ici — d'où `steps`, facultatif,
 * qui donne à chaque barre son nom pour qui ne la voit pas SANS l'imprimer à l'écran. Aucune
 * chaîne n'est fabriquée dans le composant : la plateforme est bilingue, et un « Étape » écrit
 * ici serait un mot français figé dans une primitive.
 *
 * Les barres éteintes lisent `--fill-3`, une valeur de REMPLISSAGE. AD-18 laisse l'encre
 * tertiaire aux filets et aux points d'étape — c'est exactement cet usage : elle ne porte
 * aucun texte.
 */
export interface StepDotsProps {
  /** @default 3 */
  total?: number;
  /** Nombre d'étapes franchies. @default 1 */
  current?: number;
  /** Nom du tunnel, pour la liste elle-même. */
  label?: string;
  /** Nom de chaque étape, rendu hors écran. Facultatif, jamais inventé. */
  steps?: readonly string[];
  className?: string;
  style?: CSSProperties;
}

export function StepDots({ total = 3, current = 1, label, steps, className, style }: StepDotsProps) {
  return (
    <ol
      aria-label={label}
      className={className}
      style={{
        display: 'flex',
        gap: '5px',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        ...style,
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <li
          key={i}
          aria-current={i === current - 1 ? 'step' : undefined}
          style={{
            flex: 1,
            height: '4px',
            borderRadius: '3px',
            background: i < current ? 'var(--ink)' : 'var(--fill-3)',
          }}
        >
          {steps?.[i] && <span className="sr-only">{steps[i]}</span>}
        </li>
      ))}
    </ol>
  );
}
