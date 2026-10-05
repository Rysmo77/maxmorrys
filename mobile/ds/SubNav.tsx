import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useToken, px } from './theme';

/**
 * LA NAVIGATION SECONDAIRE — deux ou trois destinations SŒURS, pas un filtre.
 *
 * Elle sépare le pôle média du Club : deux endroits différents, pas deux vues d'une même
 * liste. C'est ce qui la distingue de `Segmented` (le même contenu, autrement) et de `ChipRow`
 * (moins de contenu). La pastille de couleur porte le territoire de la destination.
 *
 * Elle DÉFILE, pour la même raison que `ChipRow` : une entrée rognée est une entrée absente.
 */
export function SubNav({
  items, active, onSelect, style,
}: {
  items: readonly { label: string; color?: string }[];
  active?: string;
  onSelect?: (label: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 8 }}
      style={style as StyleProp<ViewStyle>}
    >
      {items.map((it, i) => {
        const on = active === undefined ? i === 0 : active === it.label;
        return (
          <Pressable
            key={it.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={onSelect ? () => onSelect(it.label) : undefined}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 9,
              height: 42, paddingHorizontal: 16, borderRadius: px(t('rPill')),
              backgroundColor: on ? t('surfaceCardFlat') : t('ctlOffBg'),
              borderWidth: 1, borderColor: on ? t('borderGlass') : t('ctlOffBrd'),
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: it.color ?? t('fill5') }} />
            <Text style={{
              fontFamily: 'SchibstedGrotesk', fontSize: 13.5, fontWeight: '600',
              color: on ? t('textBody') : t('textMuted'),
            }}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
