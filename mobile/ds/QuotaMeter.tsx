import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useToken } from './theme';

/**
 * LE QUOTA DU RÉPÉTITEUR — des segments, pas un pourcentage.
 *
 * Cinq traits qu'on compte d'un coup d'œil disent « il t'en reste deux » ; « 60 % » demande
 * une division. Sur un réglage qui se consomme question par question, c'est la différence
 * entre savoir et calculer.
 *
 * LE SEGMENT S'ALLUME À L'ENVOI, pas à la réponse : c'est le geste qui consomme le quota, et
 * l'attribuer à la réponse laisserait croire qu'une question sans réponse est gratuite.
 */
export function QuotaMeter({
  used, total, label, style,
}: { used: number; total: number; label?: string; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  const n = Math.max(0, Math.min(total, used));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: n }}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 9 }, style]}
    >
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={{
            width: 15, height: 5, borderRadius: 3,
            backgroundColor: i < n ? t('mmViolet') : t('fill3'),
          }} />
        ))}
      </View>
      <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 11.5, color: t('textMuted') }}>
        {label ?? `${n} / ${total}`}
      </Text>
    </View>
  );
}
