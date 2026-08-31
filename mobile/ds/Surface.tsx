import { View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useScheme, useToken, px } from './theme';
import type { ReactNode } from 'react';

/**
 * LES SURFACES DE VERRE, en équivalent natif (AD-10).
 *
 * La règle du web tient mot pour mot ici, et pour la même raison : **le flou n'a droit qu'à
 * une surface qui NE DÉFILE PAS avec le contenu.** Au web, `backdrop-filter` sur un conteneur
 * défilant force un recompositing par image de toute la pile derrière lui ; sur natif, un
 * `BlurView` fait exactement la même chose, et sur le même profil d'appareil — 2 Go de
 * mémoire, 4 cœurs.
 *
 * Donc : `level="chrome"` (barre haute, barre d'onglets) est le SEUL qui floute. Tout le
 * reste est du faux verre, un `View` opaque au voile du jeton, gratuit à faire défiler.
 *
 * Le voile de `flat` est à .78, celui de `hero` à .58 : ce sont les valeurs RECALCULÉES du
 * système après le retrait du flou, pas les valeurs d'origine. Le flou adoucissait le
 * maillage ; sans lui, il remonte, et il faut un voile plus couvrant pour le même contraste.
 */
type Level = 'chrome' | 'hero' | 'flat' | 'night' | 'truth';

const VEIL: Record<Exclude<Level, 'chrome'>, 'glassAHero' | 'glassAFlat' | 'glassDA'> = {
  hero: 'glassAHero',
  flat: 'glassAFlat',
  truth: 'glassAFlat',
  night: 'glassDA',
};

export function Surface({
  level = 'flat', children, style,
}: { level?: Level; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  const scheme = useScheme();

  const base: ViewStyle = {
    borderRadius: px(t(level === 'truth' ? 'rM' : level === 'hero' ? 'rXl' : 'rL')),
    borderWidth: 1,
    borderColor: t('borderGlass'),
  };

  if (level === 'chrome') {
    /* La seule surface floutée. `intensity` reprend les 24–26 px du système : expo-blur
       compte sur une échelle de 0 à 100, et 24 y correspond au même rendu perçu. */
    return (
      <BlurView intensity={24} tint={scheme === 'dark' ? 'dark' : 'light'} style={[base, style]}>
        {children}
      </BlurView>
    );
  }

  // Le voile du système, converti en couleur opaque : `--glass-a-flat` vaut .78, donc du
  // blanc à 78 % — ou, sous `.dk`, du blanc à 7 %, parce que sur fond sombre un voile léger
  // suffit à détacher une surface et qu'un voile épais la fait flotter comme un carton.
  const alpha = Number.parseFloat(t(VEIL[level])) || 0.78;
  const white = scheme === 'dark';
  const surface = white
    ? `rgba(255,255,255,${level === 'flat' ? 0.07 : 0.08})`
    : level === 'night'
      ? `rgba(14,17,22,${alpha})`
      : `rgba(255,255,255,${alpha})`;

  return <View style={[base, { backgroundColor: surface }, style]}>{children}</View>;
}
