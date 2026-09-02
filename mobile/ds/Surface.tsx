import { View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemeScope, useScheme, useToken, px } from './theme';
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
type Level = 'chrome' | 'hero' | 'flat' | 'night' | 'truth' | 'ink';

const VEIL: Record<Exclude<Level, 'chrome' | 'ink'>, 'glassAHero' | 'glassAFlat' | 'glassDA'> = {
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

  /*
   * ── LA CARTE D'ENCRE : OPAQUE, ET QUI OUVRE SA PROPRE PORTÉE ────────────────────────────
   *
   * C'est une surface SOMBRE posée sur une page CLAIRE — le bilan d'abonnement du Club. Deux
   * choses la distinguent d'un simple fond foncé, et le système consacre un paragraphe à
   * chacune :
   *
   *   · ELLE EST OPAQUE. Un voile composerait avec le fond clair et remonterait à
   *     rgb(80,81,86) : 2,61:1 sous un gris nuit. D'où `surfaceInk`, un jeton déclaré à
   *     l'IDENTIQUE dans les deux modes — s'il lisait `ink`, il basculerait avec les textes
   *     et peindrait la carte en blanc cassé.
   *   · ELLE OUVRE UNE PORTÉE NUIT. Sans elle, chaque texte à l'intérieur serait un gris
   *     écrit à la main — et c'est précisément l'erreur que ce niveau existe pour empêcher.
   */
  if (level === 'ink') {
    /* Le corps est un composant SÉPARÉ, et ce n'est pas de la coquetterie : un `useToken()`
       appelé dans le composant qui POSE le fournisseur ne le voit pas. Écrit ici, le liseré
       aurait pris l'encre du mode clair — un filet noir sur une carte nuit. */
    return (
      <ThemeScope scheme="dark">
        <CarteEncre base={base} style={style}>{children}</CarteEncre>
      </ThemeScope>
    );
  }

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

function CarteEncre({
  base, style, children,
}: { base: ViewStyle; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const t = useToken();
  return (
    <View style={[base, { backgroundColor: t('surfaceInk'), borderColor: t('borderHair') }, style]}>
      {children}
    </View>
  );
}
