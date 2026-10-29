import { useEffect, useRef, useState } from 'react';
import { POLICE } from './police';
import { Animated, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COURBE, DUREE, duree, useMouvement } from './mouvement';
import { haptique } from './haptique';
import { useToken } from './theme';
import { isIOS } from './platform';
import { useTeinte } from './espace';

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
  /* `mm-r-seg` du kit v4.5. iOS : rail gris à 10 px, curseur blanc à 8 px, ombré.
     Android (Material 3) : boutons segmentés CONTOURÉS en pilule, l'actif sur le fond doux. */
  const teinte = useTeinte();
  const marge = isIOS ? 2 : 0;
  const ecart = isIOS ? 2 : 0;
  const { reduit } = useMouvement();
  const [largeur, setLargeur] = useState(0);
  const index = Math.max(0, value === undefined ? 0 : options.indexOf(value));
  const x = useRef(new Animated.Value(index)).current;
  const pas = largeur > 0 ? (largeur - (isIOS ? marge * 2 : 2) - ecart * (options.length - 1)) / options.length : 0;

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
        flexDirection: 'row', padding: marge, gap: ecart, overflow: 'hidden',
        borderRadius: isIOS ? 10 : 999,
        backgroundColor: isIOS ? t('fill2') : 'transparent',
        borderWidth: isIOS ? 0 : 1, borderColor: t('ink3'),
      }, style]}
    >
      {pas > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: marge, bottom: marge, left: marge, width: pas,
            borderRadius: isIOS ? 8 : 0,
            backgroundColor: isIOS ? t('segOnBg') : teinte.doux,
            ...(isIOS ? { shadowColor: t('inkFixed'), shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } } : null),
            transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, pas + ecart] }) }],
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
            style={{
              flex: 1, minHeight: isIOS ? 34 : 40, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center',
              borderLeftWidth: !isIOS && i > 0 ? 1 : 0, borderLeftColor: t('ink3'),
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              maxFontSizeMultiplier={1.5}
              style={{
                fontFamily: POLICE.corps, fontSize: isIOS ? 13 : 14, fontWeight: isIOS ? '600' : '500',
                color: on ? (isIOS ? t('ink') : teinte.surDoux) : isIOS ? t('textBody') : t('textMuted'),
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
