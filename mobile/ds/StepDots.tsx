import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useToken } from './theme';

/**
 * OÙ TU EN ES DANS UN TUNNEL — trois traits, pas un compteur.
 *
 * « Étape 2 sur 3 » se lit ; trois traits dont deux pleins se VOIENT. Sur un écran de
 * paiement, la différence compte : c'est le moment où quelqu'un se demande combien il reste
 * avant de payer, et une réponse qui demande une lecture est une hésitation de plus.
 *
 * Le libellé textuel reste ailleurs, dans la barre haute — les deux ne se contredisent pas,
 * ils s'adressent à deux façons de lire.
 */
export function StepDots({
  total = 3, current = 1, style,
}: { total?: number; current?: number; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current }}
      style={[{ flexDirection: 'row', gap: 5 }, style]}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{
          flex: 1, height: 4, borderRadius: 3,
          backgroundColor: i < current ? t('ink') : t('fill3'),
        }} />
      ))}
    </View>
  );
}
