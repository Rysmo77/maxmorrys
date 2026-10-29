import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useBascule } from './mouvement';
import { haptique } from './haptique';
import { useToken } from './theme';
import { isIOS } from './platform';
import { useTeinte } from './espace';

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
 *
 * Le fond actif est le DÉGRADÉ de marque, comme au kit — un aplat bleu le faisait ressembler
 * à l'interrupteur du système. Le dessin fait 48 × 29 ; la zone de toucher, elle, atteint
 * 44 pt par `hitSlop`.
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
  /* `mm-r-sw` du kit v4.5 : la teinte de l'espace quand il est ouvert. iOS 51 × 31, curseur
     de 27 ; Android (Material 3) 52 × 32, piste contourée, curseur qui GRANDIT de 16 à 24 en
     s'ouvrant — par une échelle, pour rester sur le pilote natif. */
  const teinte = useTeinte();
  const bascule = useBascule(!!on);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: !!on, disabled: !!disabled }}
      onPress={disabled ? undefined : () => { haptique.selection(); onPress?.(); }}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={[{
        width: isIOS ? 51 : 52, height: isIOS ? 31 : 32, borderRadius: 16, justifyContent: 'center', overflow: 'hidden',
        backgroundColor: isIOS ? t('fill3') : t('surfaceQuiet'),
        opacity: disabled ? 0.4 : 1,
      }, style]}
    >
      {/* 220 ms — « l'état a changé ». La couleur ne passe pas par le pilote natif : le fond
          actif est une COUCHE qui apparaît en fondu, et le curseur glisse en `translateX`.
          Désactivé, rien ne bouge (planche des micro-interactions). */}
      {isIOS ? null : (
        <Animated.View style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 16,
          borderWidth: 2, borderColor: t('ink3'),
          opacity: bascule.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        }} />
      )}
      <Animated.View style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: teinte.rv, opacity: bascule,
      }} />
      {isIOS ? (
        <Animated.View style={{
          position: 'absolute', top: 2, left: 2,
          width: 27, height: 27, borderRadius: 14, backgroundColor: t('paperFixed'),
          shadowColor: t('inkFixed'), shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 3 },
          transform: [{ translateX: bascule.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }],
        }} />
      ) : (
        <>
          <Animated.View style={{
            position: 'absolute', top: 4, left: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: t('ink3'),
            opacity: bascule.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [
              { translateX: bascule.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
              { scale: bascule.interpolate({ inputRange: [0, 1], outputRange: [0.667, 1] }) },
            ],
          }} />
          <Animated.View style={{
            position: 'absolute', top: 4, left: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: t('paperFixed'),
            opacity: bascule,
            transform: [
              { translateX: bascule.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
              { scale: bascule.interpolate({ inputRange: [0, 1], outputRange: [0.667, 1] }) },
            ],
          }} />
        </>
      )}
    </Pressable>
  );
}
