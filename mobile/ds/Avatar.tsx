import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useToken } from './theme';

/**
 * LES INITIALES SONT L'ÉTAT LIVRÉ, PAS UN FOND D'ATTENTE.
 *
 * Aucune photographie n'existe au dépôt, et le système l'écrit : les emplacements de
 * photographie sont déclarés, jamais remplis par une image générée. Une pastille d'initiales
 * n'attend donc pas mieux — elle EST la représentation d'une personne ici.
 */
export function Avatar({
  initials = '', size = 42, background, style,
}: { initials?: string; size?: number; background?: string; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={initials || undefined}
      style={[{
        width: size, height: size, borderRadius: size / 2,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: background ?? t('mmViolet'),
        // `borderGlass` — le liseré blanc du système, qui descend à 13 % en nuit. Le
        // figer à 60 % ferait un anneau blanc franc sur fond sombre.
        borderWidth: 1.5, borderColor: t('borderGlass'),
      }, style]}
    >
      <Text style={{
        fontFamily: 'Fraunces', fontWeight: '700',
        fontSize: Math.round(size / 3), color: t('paperFixed'),
      }}>
        {initials}
      </Text>
    </View>
  );
}
