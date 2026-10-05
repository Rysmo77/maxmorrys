import { Animated, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useBascule } from './mouvement';
import { Pressoir } from './Pressoir';
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
          <Pilule key={o} libelle={o} on={on} height={height} onPress={onChange ? () => onChange(o) : undefined} />
        );
      })}
    </ScrollView>
  );
}

/**
 * UNE PILULE — 220 ms, « l'état a changé ». Le fond actif apparaît en fondu ; le libellé
 * bascule par DEUX couches superposées, parce qu'une couleur de texte ne s'anime pas sur le
 * pilote natif — et qu'un changement sec laisserait, le temps du fondu, un texte blanc sur un
 * fond encore clair. Enfoncement .94 : celui des pilules.
 */
function Pilule({ libelle, on, height, onPress }: { libelle: string; on: boolean; height: number; onPress?: () => void }) {
  const t = useToken();
  const b = useBascule(on);
  const texte = { fontFamily: 'SchibstedGrotesk', fontSize: 13 } as const;
  return (
    <Pressoir
      echelle="sm"
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        height, paddingHorizontal: 16, justifyContent: 'center', overflow: 'hidden',
        borderRadius: px(t('rPill')), borderWidth: 1,
        backgroundColor: t('ctlOffBg'),
        borderColor: on ? t('ink') : t('ctlOffBrd'),
      }}
    >
      <Animated.View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: t('ink'), opacity: b }} />
      <View>
        <Animated.Text style={[texte, { fontWeight: '500', color: t('textMuted'), opacity: b.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
          {libelle}
        </Animated.Text>
        <Animated.Text style={[texte, { position: 'absolute', left: 0, fontWeight: '600', color: t('textOnPrimary'), opacity: b }]}>
          {libelle}
        </Animated.Text>
      </View>
    </Pressoir>
  );
}

