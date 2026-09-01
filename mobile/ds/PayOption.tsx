import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken, px } from './theme';

/**
 * L'OPTION À CHOISIR — moyen de paiement, qualité, réponse d'un sélecteur.
 *
 * LA BORDURE ET LA PASTILLE BASCULENT ENSEMBLE. C'est écrit dans `brand/states.css` du kit et
 * ce n'est pas un détail de rendu : deux confirmations décalées font douter du clic. Ici, les
 * deux lisent le même booléen dans le même rendu, donc elles ne peuvent pas se désynchroniser.
 *
 * ⚠️ Le web anime `border-width` sur la pastille, ce que la règle 3 interdit — le dépôt le
 * neutralise par un override. On ne le reproduit donc pas : la pastille change d'épaisseur
 * sans transition.
 */
export function PayOption({
  logo, logoBackground, title, note, on, onPress, style,
}: {
  logo?: ReactNode;
  logoBackground?: string;
  title: string;
  note?: string;
  on?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: !!on }}
      accessibilityLabel={note ? `${title} — ${note}` : title}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [{
        flexDirection: 'row', alignItems: 'center', gap: 13,
        padding: 15, minHeight: 68,
        borderRadius: px(t('rM')),
        backgroundColor: t('ctlOffBg'),
        borderWidth: 1.5,
        borderColor: on ? t('ctlSelBrd') : t('ctlOffBrd'),
        transform: [{ scale: pressed ? Number.parseFloat(t('pressScale')) || 0.975 : 1 }],
      }, style]}
    >
      {logo !== undefined && (
        <View style={{
          width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
          backgroundColor: logoBackground ?? t('fill2'),
        }}>
          {logo}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'SchibstedGrotesk', fontWeight: '600', fontSize: 14.5, color: t('textBody') }}>
          {title}
        </Text>
        {note ? (
          <Text style={{ fontFamily: 'SchibstedGrotesk', fontSize: 12, color: t('textMuted') }}>{note}</Text>
        ) : null}
      </View>
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        borderWidth: on ? 7 : 2,
        borderColor: on ? t('ink') : t('ctlRadioBrd'),
      }} />
    </Pressable>
  );
}
