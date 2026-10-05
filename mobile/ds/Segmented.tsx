import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useToken, px } from './theme';

/**
 * LE SÉLECTEUR À DEUX OU TROIS VUES — pas un onglet, pas un filtre.
 *
 * Il change le POINT DE VUE sur une même liste (« À venir » / « Mes inscriptions » /
 * « Passées »), là où `ChipRow` filtre un ensemble. La distinction n'est pas cosmétique :
 * un segment dit « la même chose, autrement », une puce dit « moins de choses ».
 *
 * Le basculement dure 220 ms au web — « l'état a changé ». Ici il est instantané : React
 * Native n'anime pas une couleur de fond sans pilote, et faire tourner un pilote pour un
 * sélecteur à trois entrées coûte plus que le fondu ne rapporte.
 */
export function Segmented({
  options, value, onChange, style,
}: {
  options: readonly string[];
  value?: string;
  onChange?: (option: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  return (
    <View style={[{
      flexDirection: 'row', padding: 4, gap: 4,
      borderRadius: px(t('rPill')), backgroundColor: t('surfaceQuiet'),
    }, style]}>
      {options.map((o, i) => {
        const on = value === undefined ? i === 0 : value === o;
        return (
          <Pressable
            key={o}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={onChange ? () => onChange(o) : undefined}
            style={{
              flex: 1, paddingVertical: 9, borderRadius: px(t('rPill')), alignItems: 'center',
              backgroundColor: on ? t('segOnBg') : 'transparent',
            }}
          >
            <Text style={{
              fontFamily: 'SchibstedGrotesk', fontSize: 13, fontWeight: '600',
              color: on ? t('ink') : t('textMuted'),
            }}>
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
