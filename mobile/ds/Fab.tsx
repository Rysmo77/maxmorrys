import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { isIOS, ripple } from './platform';
import { useToken, px } from './theme';
import { Gradient, useActionGradient } from './Gradient';

/**
 * LE BOUTON FLOTTANT — et la SEULE divergence de forme du portage.
 *
 * Le kit l'écrit en une ligne : « rond sur iOS, arrondi carré sur Android ». Ce n'est pas une
 * coquetterie de plateforme — le FAB est une forme MATERIAL, que Material 3 dessine en carré
 * à grands rayons ; iOS n'a pas de FAB du tout, et quand une application en pose un, il est
 * rond. Garder un seul dessin ferait paraître l'application étrangère d'un côté ou de l'autre,
 * sur le seul bouton qui flotte au-dessus du contenu.
 *
 * IL SE POSE AU-DESSUS DE LA BARRE D'ONGLETS, zone de geste comprise. Sous elle, il serait
 * touché par la barre ; dans la zone de geste, c'est l'OS qui intercepterait le doigt.
 */
export function Fab({
  label, onPress, tabbar = true, territory = 'forme', children,
}: {
  label: string;
  onPress?: () => void;
  tabbar?: boolean;
  territory?: 'forme' | 'informe' | 'transforme' | 'digitalise';
  children: ReactNode;
}) {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const g = useActionGradient();
  const bas = (tabbar ? px(t('tabbarH')) : 0) + insets.bottom + 18;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={ripple(t('paperFixed'), true)}
      style={({ pressed }: { pressed: boolean }) => ({
        position: 'absolute', right: 18, bottom: bas,
        width: 56, height: 56,
        transform: [{ scale: pressed ? Number.parseFloat(t('pressScaleSm')) || 0.94 : 1 }],
        // L'ombre portée du kit, convertie : React Native compte le flou en rayon.
        shadowColor: t(territory === 'forme' ? 'mmBleu' : territory === 'transforme' ? 'mmViolet' : territory === 'digitalise' ? 'mmTeal' : 'mmOrange'),
        shadowOpacity: 0.38, shadowRadius: 13, shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      })}
    >
      <Gradient
        colors={g[territory]}
        radius={isIOS ? 28 : 18}
        style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </Gradient>
    </Pressable>
  );
}
