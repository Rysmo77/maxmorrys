import { useEffect, useRef, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import { COURBE, DUREE, duree, useMouvement } from './mouvement';
import { veil, useToken } from './theme';

/**
 * LA BARRE DE PROGRESSION — et la seule exception du système à la règle 3.
 *
 * La règle 3 dit : « une animation ne porte que sur `transform` et `opacity` ». Le
 * remplissage d'une barre de progression est l'exception, déjà écrite dans `brand/motion.css`
 * du kit, et elle est motivée : `scaleX()` déformerait le contenu. Elle est bornée à un
 * élément de 3 à 8 px de haut, sans enfant. Il n'y en a pas d'autre.
 *
 * Ici, le remplissage est une LARGEUR EN POURCENTAGE sans transition : React Native n'anime
 * pas une largeur sans `Animated`, et faire tourner un pilote d'animation pour une barre de
 * 8 px sur le profil d'appareil visé — 2 Go, 4 cœurs — coûte plus que ça ne rapporte.
 *
 * LE DÉGRADÉ DES QUATRE TEINTES n'est pas porté : `linear-gradient` n'existe pas ici, et le
 * rendre demanderait une dépendance de plus. La barre prend la teinte du TERRITOIRE, ce qui
 * dit d'ailleurs quelque chose de vrai que le dégradé, lui, ne dit pas.
 */
export function ProgressBar({
  value, height = 8, territory = 'forme', surFond, style,
}: {
  /** Posée sur un dégradé (`mm-r-resume`) : rail blanc voilé, remplissage blanc. */
  surFond?: boolean;
  /** 0 à 100. Une valeur hors bornes est ramenée : une barre ne ment pas sur elle-même. */
  value: number;
  height?: number;
  territory?: 'forme' | 'informe' | 'transforme' | 'digitalise';
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const ink = {
    forme: t('mmBleu'), informe: t('mmOrange'),
    transforme: t('mmViolet'), digitalise: t('mmTeal'),
  }[territory];

  /*
   * LA BARRE REJOINT SA VALEUR — 700 ms à l'arrivée (« la page se met en place »), 380 ms
   * quand elle change (cocher une leçon : « la barre dit ce que ça change »).
   *
   * ⛔ PAS SA LARGEUR : le système interdit d'animer `width`. Le remplissage a la largeur
   * PLEINE et glisse depuis la gauche (`translateX`), sous le masque du rail — pilote natif,
   * et le rayon des extrémités n'est pas écrasé comme il le serait par un `scaleX`.
   */
  const { reduit } = useMouvement();
  const [largeur, setLargeur] = useState(0);
  const p = useRef(new Animated.Value(reduit ? pct : 0)).current;
  const premier = useRef(true);
  useEffect(() => {
    Animated.timing(p, {
      toValue: pct,
      duration: duree(premier.current ? DUREE.scene : DUREE.enter, reduit),
      easing: COURBE.sortie,
      useNativeDriver: true,
    }).start();
    premier.current = false;
  }, [pct, reduit, p]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
      style={[{ height, borderRadius: 5, backgroundColor: surFond ? veil(t('paperFixed'), 0.25) : t('fill2'), overflow: 'hidden' }, style]}
    >
      <Animated.View style={{
        height: '100%', width: '100%', borderRadius: 5, backgroundColor: surFond ? t('paperFixed') : ink,
        /* Invisible tant que le rail n'est pas mesuré : sans largeur, la translation vaut 0
           et la barre paraîtrait PLEINE le temps d'une image — une progression mensongère. */
        opacity: largeur > 0 ? 1 : 0,
        transform: [{ translateX: p.interpolate({ inputRange: [0, 100], outputRange: [-largeur, 0] }) }],
      }} />
    </View>
  );
}
