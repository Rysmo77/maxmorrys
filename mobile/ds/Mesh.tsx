import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient } from 'react-native-svg';
import { useToken } from './theme';
import type { TokenName } from '../../src/design-system/tokens.generated';

/**
 * LE MAILLAGE, en équivalent natif — FIGÉ, et c'est délibéré (AD-10).
 *
 * Au web, trois lobes de 340 px en `filter: blur(52px)` dérivent sur 25 à 38 secondes, animés
 * en `transform` uniquement, pour un poids réseau de ZÉRO OCTET. C'est ce qui remplace une
 * vidéo d'accueil de 2 à 6 Mo, sur un marché où le panier de données 2 Go coûte en médiane
 * 4,2 % du revenu national brut par habitant.
 *
 * React Native n'a pas de `filter`. Émuler le flou reviendrait à composer trois images floues
 * par image de rendu, sur un appareil à 2 Go de mémoire et 4 cœurs — qui EST le profil du
 * marché, pas le cas limite. Un `RadialGradient` SVG donne la même silhouette pour un coût
 * fixe, payé une fois.
 *
 * LA DÉRIVE N'EST DONC PAS PORTÉE. Ce n'est pas une régression à rattraper : c'est la
 * décision. Elle se rouvre si une mesure sur appareil réel montre que ça tient — pas avant.
 *
 * Les positions, les teintes et les opacités sont celles de `brand/mesh.css`, à l'arrêt.
 */
type Territory = 'forme' | 'informe' | 'transforme' | 'digitalise' | 'nuit';

/** Trois lobes par territoire : chaque teinte mêlée à deux voisines PRISES DANS LE LOGO. */
const LOBES: Record<Territory, Array<{ hue: TokenName; cx: number; cy: number; r: number; opacity: number }>> = {
  forme: [
    { hue: 'mmBleu', cx: 0.04, cy: 0.02, r: 0.62, opacity: 0.9 },
    { hue: 'mmViolet', cx: 0.94, cy: -0.04, r: 0.6, opacity: 0.65 },
    { hue: 'mmTeal', cx: 0.96, cy: 0.46, r: 0.58, opacity: 0.5 },
  ],
  informe: [
    { hue: 'mmOrange', cx: 0.06, cy: 0.0, r: 0.62, opacity: 0.9 },
    { hue: 'mmCorail', cx: 0.92, cy: -0.02, r: 0.6, opacity: 0.6 },
    { hue: 'mmBleu', cx: 0.98, cy: 0.52, r: 0.58, opacity: 0.34 },
  ],
  transforme: [
    { hue: 'mmViolet', cx: 0.02, cy: 0.02, r: 0.62, opacity: 0.9 },
    { hue: 'mmBleu', cx: 0.95, cy: -0.03, r: 0.6, opacity: 0.7 },
    { hue: 'mmOrange', cx: 0.99, cy: 0.5, r: 0.58, opacity: 0.42 },
  ],
  digitalise: [
    { hue: 'mmTeal', cx: 0.04, cy: 0.02, r: 0.62, opacity: 0.9 },
    { hue: 'mmBleu', cx: 0.94, cy: -0.04, r: 0.6, opacity: 0.6 },
    { hue: 'mmOrange', cx: 0.98, cy: 0.54, r: 0.58, opacity: 0.4 },
  ],
  nuit: [
    { hue: 'mmBleu', cx: 0.0, cy: 0.0, r: 0.64, opacity: 0.55 },
    { hue: 'mmViolet', cx: 0.96, cy: -0.05, r: 0.6, opacity: 0.45 },
    { hue: 'mmOrange', cx: 0.95, cy: 1.05, r: 0.58, opacity: 0.3 },
  ],
};

export function Mesh({ territory = 'forme', style }: { territory?: Territory; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  const night = territory === 'nuit';
  const veil = night ? t('night') : t('surfacePage');

  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, style]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          {LOBES[territory].map((l, i) => (
            <RadialGradient key={`g${i}`} id={`lobe${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={t(l.hue)} stopOpacity={l.opacity} />
              <Stop offset="100%" stopColor={t(l.hue)} stopOpacity={0} />
            </RadialGradient>
          ))}
          {/*
            Le voile de lisibilité. Sans lui, le maillage remonte sous le texte.
            Valeurs d'AD-18 : 60 % en haut, 78 % à mi-hauteur, 90 % en bas — remontées après
            mesure, parce qu'à 42 % l'encre secondaire tombait à 3,93:1 sur le fond réel.
          */}
          <LinearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={veil} stopOpacity={night ? 0.62 : 0.6} />
            <Stop offset="46%" stopColor={veil} stopOpacity={night ? 0.86 : 0.78} />
            <Stop offset="100%" stopColor={veil} stopOpacity={night ? 0.94 : 0.9} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill={night ? t('night') : t('paper')} />
        {LOBES[territory].map((l, i) => (
          <Rect
            key={`r${i}`}
            x={`${(l.cx - l.r) * 100}%`}
            y={`${(l.cy - l.r) * 100}%`}
            width={`${l.r * 200}%`}
            height={`${l.r * 200}%`}
            fill={`url(#lobe${i})`}
          />
        ))}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#veil)" />
      </Svg>
    </View>
  );
}
