import { useEffect, useRef, useState } from 'react';
import { POLICE } from './police';
import { Animated, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COURBE, DUREE, duree, useMouvement } from './mouvement';
import { haptique } from './haptique';
import { useToken, px } from './theme';

/**
 * LE SÉLECTEUR À DEUX OU TROIS VUES — pas un onglet, pas un filtre.
 *
 * Il change le POINT DE VUE sur une même liste (« À venir » / « Mes inscriptions » /
 * « Passées »), là où `ChipRow` filtre un ensemble. La distinction n'est pas cosmétique :
 * un segment dit « la même chose, autrement », une puce dit « moins de choses ».
 *
 * ── LA PASTILLE GLISSE, 220 ms ────────────────────────────────────────────────────────
 * Elle sautait d'un segment à l'autre : l'œil devait chercher où était passé le choix. Les
 * segments ont tous la même largeur, donc la pastille n'a qu'à se TRANSLATER — `translateX`,
 * pilote natif, sans redimensionnement qui déformerait ses arrondis.
 *
 * 44 pt de hauteur : le plancher de cible tactile. Le libellé tient sur une ligne et rétrécit
 * plutôt que de se couper à 320 dp.
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
  const { reduit } = useMouvement();
  const [largeur, setLargeur] = useState(0);
  const index = Math.max(0, value === undefined ? 0 : options.indexOf(value));
  const x = useRef(new Animated.Value(index)).current;
  const pas = largeur > 0 ? (largeur - 8 - 4 * (options.length - 1)) / options.length : 0;

  useEffect(() => {
    Animated.timing(x, {
      toValue: index, duration: duree(DUREE.ui, reduit), easing: COURBE.standard, useNativeDriver: true,
    }).start();
  }, [index, reduit, x]);

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
      style={[{
        flexDirection: 'row', padding: 4, gap: 4,
        borderRadius: px(t('rPill')), backgroundColor: t('surfaceQuiet'),
      }, style]}
    >
      {pas > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: 4, bottom: 4, left: 4, width: pas,
            borderRadius: px(t('rPill')), backgroundColor: t('segOnBg'),
            transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, pas + 4] }) }],
          }}
        />
      ) : null}
      {options.map((o, i) => {
        const on = i === index;
        return (
          <Pressable
            key={o}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={onChange ? () => { if (!on) haptique.selection(); onChange(o); } : undefined}
            style={{ flex: 1, minHeight: 36, paddingHorizontal: 6, borderRadius: px(t('rPill')), alignItems: 'center', justifyContent: 'center' }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              maxFontSizeMultiplier={1.5}
              style={{
                fontFamily: POLICE.corps, fontSize: 13, fontWeight: '600',
                color: on ? t('ink') : t('textMuted'),
              }}
            >
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
