import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Body } from './Type';
import { Icon, type IconName } from './Icon';
import { COURBE, DUREE, duree, useMouvement } from './mouvement';
import { haptique } from './haptique';
import { useToken, px, veil } from './theme';

/**
 * LE BANDEAU — ce qu'une boîte de dialogue système disait, posé DANS la page.
 *
 * `Alert.alert` interrompt : elle prend tout l'écran, exige un geste pour disparaître, et
 * se lit comme une panne même quand elle annonce un succès. Le kit le dit pour la
 * notification flottante, et ça vaut pour la boîte : « elle apparaît là où la personne ne
 * regarde pas ». Le bandeau, lui, entre à sa place dans le flux (fondu 220 ms), et ne
 * bloque rien.
 *
 * Il reste réservé à ce qui n'a pas de lieu évident — une erreur d'envoi, un export prêt.
 * Un succès qui a un bouton se confirme SUR le bouton (`useConfirmation`).
 *
 * ⚠️ RÉGION VIVANTE. Un bandeau qui apparaît sans être annoncé n'existe pas pour un lecteur
 * d'écran : il est annoncé à son arrivée, une fois.
 */
export type BandeauTon = 'info' | 'ok' | 'warn' | 'stop';

const GLYPHE: Record<BandeauTon, IconName> = {
  info: 'info', ok: 'check-circle', warn: 'alert', stop: 'alert-circle',
};

export function Bandeau({
  ton = 'info', titre, corps, action, onFermer, style,
}: {
  ton?: BandeauTon;
  titre: string;
  corps?: string;
  action?: ReactNode;
  onFermer?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const { reduit } = useMouvement();
  const p = useRef(new Animated.Value(reduit ? 1 : 0)).current;
  const encre = ton === 'info' ? t('ink2') : t(ton);

  useEffect(() => {
    Animated.timing(p, {
      toValue: 1, duration: duree(DUREE.ui, reduit), easing: COURBE.standard, useNativeDriver: true,
    }).start();
    AccessibilityInfo.announceForAccessibility(corps ? `${titre}. ${corps}` : titre);
    if (ton === 'stop') haptique.erreur();
    // Une seule fois, à l'arrivée : un bandeau qui se réannonce à chaque rendu devient un bruit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole={ton === 'stop' ? 'alert' : 'summary'}
      style={[{
        opacity: p,
        flexDirection: 'row', gap: 11, alignItems: 'flex-start',
        padding: 14, borderRadius: px(t('rM')),
        backgroundColor: veil(encre, 0.1), borderWidth: 1, borderColor: veil(encre, 0.28),
      }, style]}
    >
      <Icon name={GLYPHE[ton]} size={18} color={encre} strokeWidth={2.4} />
      <View style={{ flex: 1 }}>
        <Body style={{ fontSize: 14, fontWeight: '600' }}>{titre}</Body>
        {corps ? <Body muted style={{ fontSize: 13, lineHeight: 19, marginTop: 3 }}>{corps}</Body> : null}
        {action ? <View style={{ marginTop: 10 }}>{action}</View> : null}
      </View>
      {onFermer ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer ce message"
          onPress={onFermer}
          hitSlop={12}
          style={{ padding: 2 }}
        >
          <Icon name="close" size={16} color={t('ink2')} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
