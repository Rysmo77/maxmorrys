import { Pressable, ScrollView, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useToken, px } from './theme';

/**
 * LES PUCES DE FILTRE — et pourquoi elles DÉFILENT ici alors qu'elles sont coupées au web.
 *
 * Le kit pose `overflow: hidden` sur sa rangée : à cinq puces dans un cadre de 390 px, les
 * dernières sont rognées. C'est supportable sur une maquette, pas dans la main de quelqu'un —
 * une puce rognée est une puce absente, et c'est le même défaut que celui relevé sur le
 * `Pipeline` de la console.
 *
 * `ScrollView` horizontal, sans barre : on garde la coupe visuelle qui indique qu'il y a une
 * suite, et on rend cette suite atteignable.
 */
export function ChipRow({
  options, value, onChange, height = 40, style,
}: {
  options: readonly string[];
  value?: string;
  onChange?: (option: string) => void;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}
      style={style as StyleProp<ViewStyle>}
    >
      {options.map((o, i) => {
        const on = value === undefined ? i === 0 : value === o;
        return (
          <Pressable
            key={o}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={onChange ? () => onChange(o) : undefined}
            style={{
              height, paddingHorizontal: 16, justifyContent: 'center',
              borderRadius: px(t('rPill')), borderWidth: 1,
              backgroundColor: on ? t('ink') : t('ctlOffBg'),
              borderColor: on ? t('ink') : t('ctlOffBrd'),
            }}
          >
            <Text style={{
              fontFamily: 'SchibstedGrotesk', fontSize: 13,
              fontWeight: on ? '600' : '500',
              color: on ? t('textOnPrimary') : t('textMuted'),
            }}>
              {o}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
