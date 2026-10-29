import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Num, type NumSource } from '@ds';

/**
 * ── LA CASE DE RELEVÉ DE CONSOLE (kit v3, `mm-ckpi`) ────────────────────────────────
 *
 * Même contrat que `StatTile` — une valeur, sa source, sa date de relevé — dans le dessin
 * de la console : libellé, grand chiffre mono, puis la LIGNE DE SOURCE du kit
 * (`mm-ckpi__s`). Cette ligne n'est pas décorative : c'est la règle du monospace (« tout
 * nombre en mono vient de la base et porte sa ligne de source »). Elle est donc toujours
 * rendue, dérivée de `source` et `asOf` — jamais écrite à la main.
 *
 * « Pas de courbe sans historique » : il n'y a volontairement aucune prop d'évolution ici.
 * Aucun écran de console ne détient d'historique de relevés.
 */
export interface ConsoleKpiProps {
  label: string;
  value: number | string | null;
  source: NumSource;
  asOf: Date;
  unit?: string;
  /** Une ligne de contexte sous le chiffre (« 3 en base »), elle aussi dérivée. */
  foot?: ReactNode;
  /** Gardée pour la compatibilité d'appel avec `StatTile` ; la date vit dans la ligne de source. */
  showAsOf?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function ConsoleKpi({ label, value, source, asOf, unit, foot, className, style }: ConsoleKpiProps) {
  const { t, i18n } = useTranslation('admin');
  const date = asOf.toLocaleDateString(i18n.language.startsWith('en') ? 'en-GB' : 'fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const origin = source === 'db'
    ? t('console.kpiSourceDb')
    : source === 'server' ? t('console.kpiSourceServer') : source.cite;

  return (
    <div className={className ? `mm-ckpi ${className}` : 'mm-ckpi'} style={{ background: 'var(--bento)', ...style }}>
      <span className="mm-ckpi__l">{label}</span>
      <b className="mm-ckpi__v">
        <Num value={value} source={source} asOf={asOf} />
        {unit && <small>{unit}</small>}
      </b>
      {foot && <span className="text-help text-ink-2">{foot}</span>}
      <span className="mm-ckpi__s">{t('console.kpiSourceLine', { date, origin })}</span>
    </div>
  );
}
