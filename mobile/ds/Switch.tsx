import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useBascule } from './mouvement';
import { useToken } from './theme';

/**
 * L'INTERRUPTEUR — et la règle qui le distingue d'un bouton.
 *
 * « Un interrupteur DÉSACTIVÉ n'a AUCUN retour au toucher. » C'est écrit dans
 * `brand/states.css` du système, et c'est plus fort qu'une opacité : un retour tactile sur un
 * réglage qui ne fait rien est un mensonge de plus. D'où `onPress` retiré ET l'enfoncement
 * neutralisé quand `disabled`.
 *
 * `cursor: not-allowed` n'a pas d'équivalent ici, et c'est aussi bien : le système le refuse
 * au web — « le curseur barré lit comme une erreur, alors que rien n'est en erreur ».
 */
export function Switch({
  on, disabled, onPress, label, style,
}: {
  on?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /** Nom accessible. Un interrupteur sans texte à côté DOIT le porter. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const bascule = useBascule(!!on);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: !!on, disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={[{
        width: 48, height: 29, borderRadius: 16, justifyContent: 'center', overflow: 'hidden',
        backgroundColor: t('fill4'),
        opacity: disabled ? 0.4 : 1,
      }, style]}
    >
      {/* 220 ms — « l'état a changé ». La couleur ne passe pas par le pilote natif : le fond
          actif est une COUCHE qui apparaît en fondu, et le curseur glisse en `translateX`.
          Désactivé, rien ne bouge (planche des micro-interactions). */}
      <Animated.View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: t('mmBleu'), opacity: bascule }} />
      <Animated.View style={{
        position: 'absolute', top: 3, left: 3,
        width: 23, height: 23, borderRadius: 12, backgroundColor: t('paperFixed'),
        transform: [{ translateX: bascule.interpolate({ inputRange: [0, 1], outputRange: [0, 19] }) }],
      }} />
    </Pressable>
  );
}
