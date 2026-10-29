import type { CSSProperties, ReactNode } from 'react';
import { Num } from './Num';
import type { NumSource } from '../types';

/**
 * LA TUILE DE RELEVÉ — kit v3 (AD-27), `mm-card mm-kpi`.
 *
 * Grand chiffre en monospace, ligne de SOURCE en pied (`mm-kpi__src`) : la règle du monospace
 * veut que tout nombre vienne de la base ou d'une source citée, et le dise. La valeur passe
 * donc par <Num>, qui exige `source` et `asOf` et rend un tiret quand la valeur manque —
 * jamais un zéro inventé. « Pas de courbe sans historique » : la tuile n'en dessine aucune.
 */
export interface KpiTileProps {
  label: string;
  value: number | string | null | undefined;
  source: NumSource;
  asOf: Date;
  unit?: string;
  /** La ligne de source, lisible (« Firestore · relevé du jour »). Obligatoire. */
  sourceLine: string;
  /** Évolution DÉJÀ calculée sur un historique réel ; sans historique, ne rien passer. */
  delta?: { text: string; trend: 'up' | 'down' | 'flat' };
  /** Élément à droite de l'en-tête (icône, menu). */
  aside?: ReactNode;
  locale?: 'fr' | 'en';
  className?: string;
  style?: CSSProperties;
}

export function KpiTile({ label, value, source, asOf, unit, sourceLine, delta, aside, locale, className = '', style }: KpiTileProps) {
  return (
    <div className={['mm-card mm-kpi', className].filter(Boolean).join(' ')} style={style}>
      <div className="mm-kpi__head">
        <span>{label}</span>
        {aside}
      </div>
      <div className="mm-kpi__v">
        <Num value={value} source={source} asOf={asOf} unit={unit} locale={locale} />
      </div>
      {delta && <span className={`mm-kpi__delta is-${delta.trend}`} style={{ alignSelf: 'flex-start' }}>{delta.text}</span>}
      <span className="mm-kpi__src">{sourceLine}</span>
    </div>
  );
}
