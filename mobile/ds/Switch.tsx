import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
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
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: !!on, disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={[{
        width: 48, height: 29, borderRadius: 16, justifyContent: 'center',
        backgroundColor: on ? t('mmBleu') : t('fill4'),
        opacity: disabled ? 0.4 : 1,
      }, style]}
    >
      <View style={{
        position: 'absolute', top: 3, left: on ? 22 : 3,
        width: 23, height: 23, borderRadius: 12, backgroundColor: t('paperFixed'),
      }} />
    </Pressable>
  );
}
