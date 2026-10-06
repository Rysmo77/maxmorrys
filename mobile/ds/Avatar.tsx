import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useScheme, useToken } from './theme';

/**
 * LES INITIALES SONT L'ÉTAT LIVRÉ, PAS UN FOND D'ATTENTE.
 *
 * Aucune photographie n'existe au dépôt, et le système l'écrit : les emplacements de
 * photographie sont déclarés, jamais remplis par une image générée. Une pastille d'initiales
 * n'attend donc pas mieux — elle EST la représentation d'une personne ici.
 *
 * `decoratif` : quand le nom est écrit juste à côté, lire « FD » avant « Fatou D. » est un
 * bruit. La pastille se tait.
 *
 * En sombre, les initiales prennent l'encre sombre fixe sur le violet nuit : le blanc y
 * tombait à 2,5:1.
 */
export function Avatar({
  initials = '', size = 42, background, decoratif, style,
}: { initials?: string; size?: number; background?: string; decoratif?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  const scheme = useScheme();
  const fond = background ?? t('mmViolet');
  const encre = background === undefined && scheme === 'dark' ? t('inkFixed') : t('paperFixed');
  return (
    <View
      accessible={!decoratif}
      accessibilityRole={decoratif ? undefined : 'image'}
      accessibilityLabel={decoratif ? undefined : initials || undefined}
      importantForAccessibility={decoratif ? 'no-hide-descendants' : 'auto'}
      accessibilityElementsHidden={decoratif}
      style={[{
        width: size, height: size, borderRadius: size / 2,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: fond,
        // `borderGlass` — le liseré blanc du système, qui descend à 13 % en nuit. Le
        // figer à 60 % ferait un anneau blanc franc sur fond sombre.
        borderWidth: 1.5, borderColor: t('borderGlass'),
      }, style]}
    >
      <Text
        maxFontSizeMultiplier={1.2}
        style={{
          fontFamily: 'Fraunces', fontWeight: '700',
          fontSize: Math.max(12, Math.round(size / 3)), color: encre,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
