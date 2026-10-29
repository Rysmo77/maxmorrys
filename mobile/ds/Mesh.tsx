import { useEffect, useRef } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useMouvement } from './mouvement';
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient } from 'react-native-svg';
import { useToken } from './theme';
import type { TokenName } from './tokens.generated';

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

/**
 * LA DÉRIVE — « Trois lobes en dérive désynchronisée sur 25 à 38 secondes, animés en transform
 * uniquement. C'est la seule animation en boucle du produit, et elle ne demande jamais
 * l'attention. » (planche du mouvement)
 *
 * Chaque lobe est une COUCHE à part, rastérisée une fois ; seul son `transform` bouge, sur le
 * pilote natif. Figée quand la personne réduit les animations, et sur un appareil modeste
 * (`APPAREIL_MODESTE`) — le profil du marché visé, où le maillage reste mais ne dérive pas.
 */
const DERIVE = [
  { periode: 26_000, dx: 22, dy: 14 },
  { periode: 33_000, dx: -18, dy: 20 },
  { periode: 38_000, dx: 16, dy: -16 },
] as const;

function Lobe({ l, i, fige }: { l: (typeof LOBES)[Territory][number]; i: number; fige: boolean }) {
  const t = useToken();
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (fige) { p.setValue(0); return; }
    const d = DERIVE[i % DERIVE.length];
    const boucle = Animated.loop(Animated.sequence([
      Animated.timing(p, { toValue: 1, duration: d.periode / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(p, { toValue: 0, duration: d.periode / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    boucle.start();
    return () => boucle.stop();
  }, [fige, i, p]);
  const d = DERIVE[i % DERIVE.length];
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${(l.cx - l.r) * 100}%`,
        top: `${(l.cy - l.r) * 100}%`,
        width: `${l.r * 200}%`,
        height: `${l.r * 200}%`,
        transform: [
          { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, d.dx] }) },
          { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, d.dy] }) },
        ],
      }}
    >
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={`lobe${i}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={t(l.hue)} stopOpacity={l.opacity} />
            <Stop offset="100%" stopColor={t(l.hue)} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#lobe${i})`} />
      </Svg>
    </Animated.View>
  );
}

/**
 * L'ÉCRAN EST-IL AU PREMIER PLAN ? La pile native garde les écrans précédents MONTÉS : leurs
 * maillages continuaient de dériver sous l'écran visible — trois, quatre boucles payées pour
 * rien sur un appareil à 2 Go. Hors d'un navigateur (l'écran verrouillé, posé avant la pile),
 * il n'y a pas de pile : on est au premier plan.
 *
 * L'appel est TOUJOURS fait, au même rang : s'il lève, il lève à chaque rendu de la même
 * instance, et l'ordre des hooks ne change pas.
 */
function useAuPremierPlan(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true;
  }
}

export function Mesh({ territory = 'forme', style }: { territory?: Territory; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  const { reduit, modeste } = useMouvement();
  const visible = useAuPremierPlan();
  const night = territory === 'nuit';
  /* Kit v4.5 (`mm-r-mesh`) : le maillage ne vit qu'en HAUT de l'écran et se fond dans le
     papier de la page (`bento2`) — tout ce qui défile dessous est posé sur un fond plein. */
  const veil = night ? t('night') : t('bento2');
  const fond = night ? t('night') : t('bento2');

  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', backgroundColor: fond }, style]}>
      {LOBES[territory].map((l, i) => <Lobe key={i} l={l} i={i} fige={reduit || modeste || !visible} />)}
      <Svg width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          {/*
            Le voile de lisibilité. Sans lui, le maillage remonte sous le texte.
            Valeurs d'AD-18 : 60 % en haut, 78 % à mi-hauteur, 90 % en bas — remontées après
            mesure, parce qu'à 42 % l'encre secondaire tombait à 3,93:1 sur le fond réel.
          */}
          <LinearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={veil} stopOpacity={night ? 0.62 : 0.6} />
            <Stop offset="30%" stopColor={veil} stopOpacity={night ? 0.86 : 0.8} />
            <Stop offset="55%" stopColor={veil} stopOpacity={1} />
            <Stop offset="100%" stopColor={veil} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#veil)" />
      </Svg>
    </View>
  );
}
