import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useToken } from './theme';

/**
 * LE SQUELETTE — la forme du contenu avant le contenu. JAMAIS un rond qui tourne.
 *
 * La règle est celle du système, et elle a une raison mesurable : un squelette à la forme
 * EXACTE du contenu réel fait que **rien ne saute** à l'arrivée des données. Un rond qui
 * tourne ne dit ni ce qui arrive, ni combien, ni où — et il laisse la mise en page se
 * recomposer sous les yeux au moment où elle se remplit.
 *
 * Le miroitement du web (`shim`, un dégradé qui balaie) n'est pas repris : il demanderait un
 * pilote d'animation par bloc, sur un écran qui en pose parfois huit. Le bloc au repos porte
 * déjà l'information — la forme.
 */
export function Skeleton({
  width = '100%', height = 16, radius = 12, label, style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  /** Nom accessible : un lecteur d'écran doit savoir que ça charge, pas lire un vide. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={[{ width, height, borderRadius: radius, backgroundColor: t('fill2') }, style]}
    />
  );
}
