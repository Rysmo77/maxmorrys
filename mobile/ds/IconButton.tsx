import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { ripple } from './platform';
import { useToken, px } from './theme';

/**
 * LE CHROME ROND — le bouton d'action de la barre haute.
 *
 * Sa surface est du VERRE de chrome (`--chrome-bg`), qui s'effondre en mode sombre : un
 * disque blanc à 60 % sous un glyphe presque blanc donne 1,4:1, et ce défaut-là rend une barre
 * haute illisible dans douze écrans à la fois. D'où aucune prop de thème — `useToken()` lit le
 * mode, comme partout.
 *
 * LA CIBLE FAIT 42 px DANS LE KIT, ET LE PLANCHER EST À 44. L'écart de 2 px est assumé par le
 * système (`--touch-min` contre `--touch-aa`) ; ici il est RATTRAPÉ par `hitSlop`, qui étend la
 * zone tactile sans changer le dessin. C'est la seule façon d'avoir les deux.
 */
export function IconButton({
  label, badge, onPress, children, style,
}: {
  /** Nom accessible. Un bouton qui ne porte qu'un glyphe DOIT le porter. */
  label: string;
  badge?: boolean;
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const taille = px(t('touchMin'));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      android_ripple={ripple(t('ink3'), true)}
      style={({ pressed }: { pressed: boolean }) => [{
        width: taille, height: taille, borderRadius: taille / 2,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: t('chromeBg'),
        borderWidth: 1, borderColor: t('chromeBrd'),
        transform: [{ scale: pressed ? Number.parseFloat(t('pressScaleSm')) || 0.94 : 1 }],
      }, style]}
    >
      {children}
      {badge ? (
        /* La pastille de notification : elle dit « il y a quelque chose », jamais combien.
           Un compteur sur un glyphe de 17 px ne se lit pas, et il vieillit mal. */
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{
            position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: 5,
            backgroundColor: t('mmOrange'),
            borderWidth: 1.5, borderColor: t('surfacePage'),
          }}
        />
      ) : null}
    </Pressable>
  );
}
