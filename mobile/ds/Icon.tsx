import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { MM_ICONS, type IconName } from './icons.generated';
import { useToken } from './theme';

export type { IconName };

export interface IconProps {
  name: IconName;
  /** @default 22 */
  size?: number;
  /**
   * La couleur du trait, ou rien : par défaut le glyphe prend l'encre courante.
   *
   * `ColorValue` et non `string` : c'est le type que React Native passe à un `tabBarIcon`,
   * et il inclut `null` (« pas de teinte imposée ») ainsi que les couleurs opaques de
   * plateforme. Le refuser obligerait chaque appelant à le transtyper, c'est-à-dire à
   * affirmer quelque chose qu'il ne vérifie pas.
   */
  color?: ColorValue | null;
  /** Force l'épaisseur. Sinon celle du glyphe, sinon 2,2. */
  strokeWidth?: number;
}

/**
 * LE MÊME JEU D'ICÔNES QU'AU WEB, RENDU EN NATIF.
 *
 * Les tracés ne sont pas recopiés : ils viennent de `src/design-system/icons.ts`, le module
 * de données que le composant DOM lit aussi. Ajouter un glyphe le fait apparaître des deux
 * côtés ; en oublier un des deux côtés devient impossible.
 *
 * `fill: none`, `stroke: currentColor`, bouts et jointures ronds, boîte de 24 — les mêmes
 * constantes qu'au web, parce que ce sont elles qui font qu'un jeu d'icônes se tient. Deux
 * glyphes seulement sont pleins (`play` et `star`), et ils portent `solid`.
 */
export function Icon({ name, size = 22, color, strokeWidth }: IconProps) {
  const t = useToken();
  const g = MM_ICONS[name] ?? MM_ICONS.check;
  // `null` vaut « pas de teinte imposée », comme `undefined` : les deux retombent sur l'encre.
  const stroke = color ?? t('ink');
  const w = strokeWidth ?? g.w ?? 2.2;

  if (g.solid && g.fill) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={g.fill} fill={stroke} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {g.p?.map((d, i) => (
        <Path key={`p${i}`} d={d} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {g.c?.map(([cx, cy, r], i) => (
        <Circle key={`c${i}`} cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={w} />
      ))}
      {g.r?.map(([x, y, rw, rh, rx], i) => (
        <Rect key={`r${i}`} x={x} y={y} width={rw} height={rh} rx={rx} fill="none" stroke={stroke} strokeWidth={w} />
      ))}
    </Svg>
  );
}
