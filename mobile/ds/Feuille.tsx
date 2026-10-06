import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo, Animated, KeyboardAvoidingView, Modal, PanResponder, Pressable, ScrollView,
  View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body } from './Type';
import { COURBE, DUREE, duree, useMouvement } from './mouvement';
import { isIOS } from './platform';
import { useToken, px, veil } from './theme';
import { elevation } from './elevation';

/**
 * ══ LA FEUILLE DU BAS ══ — l'action secondaire qui ne quitte pas la page.
 *
 * Publier un message, signaler quelqu'un, choisir un filtre : ce sont des gestes QUI
 * REVIENNENT à la page d'où ils partent. Les envoyer sur un écran entier, c'est faire
 * perdre la place ; les mettre dans une boîte système, c'est les rendre étrangers.
 *
 *   ouvrir   300 ms, `translateY 100 % → 0`, courbe de sortie ; voile 0 → 30 %
 *   fermer   220 ms, courbe standard — on sort plus vite qu'on n'entre
 *   geste    la poignée se tire vers le bas ; au-delà d'un quart, ou d'un lancer, elle part
 *
 * La page derrière NE BOUGE PAS : c'est elle, le repère. Le voile la fait reculer, il ne la
 * cache pas.
 *
 * ⚠️ `onFermer` est appelé APRÈS la sortie animée : le parent garde `visible` vrai le temps
 * de la course, sans quoi la feuille disparaîtrait d'un coup au lieu de descendre.
 */
const OUVRIR = 300;

export function Feuille({
  visible, onFermer, titre, children,
}: {
  visible: boolean;
  onFermer: () => void;
  titre?: string;
  children: ReactNode;
}) {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { reduit } = useMouvement();
  const [monte, setMonte] = useState(visible);
  const y = useRef(new Animated.Value(height)).current;
  const voile = useRef(new Animated.Value(0)).current;

  function sortir(apres?: () => void) {
    Animated.parallel([
      Animated.timing(y, { toValue: height, duration: duree(DUREE.ui, reduit), easing: COURBE.standard, useNativeDriver: true }),
      Animated.timing(voile, { toValue: 0, duration: duree(DUREE.ui, reduit), easing: COURBE.standard, useNativeDriver: true }),
    ]).start(() => { setMonte(false); apres?.(); });
  }

  useEffect(() => {
    if (visible) {
      setMonte(true);
      y.setValue(height);
      Animated.parallel([
        Animated.timing(y, { toValue: 0, duration: duree(OUVRIR, reduit), easing: COURBE.sortie, useNativeDriver: true }),
        Animated.timing(voile, { toValue: 1, duration: duree(OUVRIR, reduit), easing: COURBE.sortie, useNativeDriver: true }),
      ]).start();
      if (titre) AccessibilityInfo.announceForAccessibility(titre);
    } else if (monte) {
      sortir();
    }
    // La course suit `visible`, et seulement lui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const geste = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_e, g) => { if (g.dy > 0) y.setValue(g.dy); },
    onPanResponderRelease: (_e, g) => {
      if (g.dy > height * 0.25 || g.vy > 1.1) sortir(onFermer);
      else Animated.timing(y, { toValue: 0, duration: DUREE.ui, easing: COURBE.sortie, useNativeDriver: true }).start();
    },
  })).current;

  if (!monte) return null;

  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent onRequestClose={() => sortir(onFermer)}>
      <Animated.View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: voile }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={() => sortir(onFermer)}
          style={{ flex: 1, backgroundColor: veil(t('inkFixed'), 0.3) }}
        />
      </Animated.View>
      <KeyboardAvoidingView behavior={isIOS ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={{
            transform: [{ translateY: y }],
            maxHeight: height * 0.9,
            backgroundColor: t('surfacePage'),
            borderTopLeftRadius: px(t('rL')), borderTopRightRadius: px(t('rL')),
            paddingBottom: insets.bottom + 16,
            ...elevation(3, t('inkFixed')),
          }}
        >
          <View {...geste.panHandlers} style={{ paddingTop: 10, paddingBottom: titre ? 4 : 10, alignItems: 'center' }}>
            <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: t('fill4') }} />
            {titre ? (
              <Body
                accessibilityRole="header"
                style={{ alignSelf: 'stretch', paddingHorizontal: 20, marginTop: 14, fontSize: 17, fontWeight: '700' }}
              >
                {titre}
              </Body>
            ) : null}
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
