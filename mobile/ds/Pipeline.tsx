import { Pressable, ScrollView, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useToken, px } from './theme';

/**
 * LE FILTRE PAR STATUT DE LA CONSOLE — « tout 1 · à traiter 1 · clos 0 ».
 *
 * Chaque étape porte SON COMPTE, et un compte de zéro s'affiche : c'est la différence entre
 * « il n'y a rien à traiter » et « je ne sais pas ce qu'il y a à traiter ». Le libellé arrive
 * donc déjà composé par l'écran, qui seul connaît la date du relevé.
 *
 * Il DÉFILE. Le kit pose `overflow: hidden` sur sa rangée : à cinq étapes dans un cadre de
 * 390 px, les dernières sont rognées — et une étape rognée est une étape qu'on ne peut pas
 * choisir, sur l'écran dont c'est le seul filtre.
 */
export function Pipeline({
  stages, active, onSelect, style,
}: {
  stages: readonly string[];
  active?: string;
  onSelect?: (stage: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 5 }}
      style={style as StyleProp<ViewStyle>}
    >
      {stages.map((s) => {
        const on = s === active;
        return (
          <Pressable
            key={s}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={onSelect ? () => onSelect(s) : undefined}
            style={{
              paddingVertical: 6, paddingHorizontal: 11, borderRadius: px(t('rPill')),
              backgroundColor: on ? t('segOnBg') : t('fill2'),
            }}
          >
            <Text style={{
              fontFamily: 'SchibstedGrotesk', fontSize: 11, fontWeight: '600',
              color: on ? t('ink') : t('textMuted'),
            }}>
              {s}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
