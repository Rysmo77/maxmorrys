import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken } from './theme';

/**
 * LA LIGNE DE DOCUMENT — devis, certificat, fiche société.
 *
 * Filet pointillé, libellé à gauche, valeur en monospace à droite. Ce n'est pas une liste :
 * c'est un document, et un document se lit en diagonale par sa colonne de droite.
 *
 * ⚠️ Un devis émis est FIGÉ à l'émission. Une évolution de la grille tarifaire ne réécrit
 * jamais un devis déjà envoyé — si l'implémentation relit la grille courante, elle doit le
 * DIRE sur le document, pas le laisser découvrir à la signature.
 */
export function DocLine({
  label, value, last, style,
}: { label: ReactNode; value: ReactNode; last?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  return (
    <View
      style={[{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        paddingVertical: 8,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t('fill3'),
        // React Native n'a pas de `border-style: dashed` fiable sur toutes les plateformes ;
        // un filet plein très clair rend le même service et ne casse pas sur Android.
      }, style]}
    >
      {typeof label === 'string'
        ? <Text style={{ fontFamily: 'SchibstedGrotesk', fontSize: 13.5, color: t('textMuted'), flex: 1 }}>{label}</Text>
        : <View style={{ flex: 1 }}>{label}</View>}
      {typeof value === 'string'
        ? <Text style={{ fontFamily: 'JetBrainsMono', fontWeight: '700', fontSize: 13.5, color: t('textBody') }}>{value}</Text>
        : value}
    </View>
  );
}
