import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useToken } from './theme';

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
  value, height = 8, territory = 'forme', style,
}: {
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

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[{ height, borderRadius: 5, backgroundColor: t('fill2'), overflow: 'hidden' }, style]}
    >
      <View style={{ height: '100%', width: `${pct}%`, borderRadius: 5, backgroundColor: ink }} />
    </View>
  );
}
