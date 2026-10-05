import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import { COURBE, useMouvement } from './mouvement';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * MOMENT SCÉNARISÉ Nº1 — L'ATTENTE DE RÈGLEMENT : DEUX ANNEAUX DISENT « C'EST VIVANT ».
 *
 * « Deux anneaux concentriques se propagent en boucle vers l'extérieur : scale de 1 à 1,85,
 * opacité de 0,5 à 0, sur 2,6 s, le second décalé de 1,3 s. Ce n'est pas un ornement. C'est
 * la seule chose qui dit "la transaction est vivante" à quelqu'un qui revient sans savoir si
 * ça a marché. » (planche des moments)
 *
 * ⛔ IL N'Y A PAS DE TROISIÈME MOMENT. Ce composant ne sert QU'à l'attente de `/acces`. Pas de
 * compte à rebours, pas de barre : il n'y a rien à mesurer. Sous « réduire les animations »,
 * les anneaux ne se dessinent pas — le texte dit déjà que l'écran se met à jour.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const PERIODE = 2_600;

function Anneau({ decalage, couleur, rayon }: { decalage: number; couleur: string; rayon: number }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    /* Le décalage ne joue qu'UNE fois, avant la boucle : rejoué à chaque tour, il ferait
       dériver le second anneau. Un tour = 80 % de propagation, 20 % éteint (`@keyframes ring`). */
    const boucle = Animated.sequence([
      Animated.delay(decalage),
      Animated.loop(Animated.sequence([
        Animated.timing(p, { toValue: 1, duration: PERIODE * 0.8, easing: COURBE.sortie, useNativeDriver: true }),
        Animated.delay(PERIODE * 0.2),
        Animated.timing(p, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])),
    ]);
    boucle.start();
    return () => boucle.stop();
  }, [decalage, p]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
        borderRadius: rayon, borderWidth: 2, borderColor: couleur,
        opacity: p.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 1.85] }) }],
      }}
    />
  );
}

export function Anneaux({ couleur, rayon = 22, style, children }: {
  couleur: string; rayon?: number; style?: StyleProp<ViewStyle>; children: ReactNode;
}) {
  const { reduit } = useMouvement();
  return (
    <View style={style}>
      {reduit ? null : (
        <>
          <Anneau decalage={0} couleur={couleur} rayon={rayon} />
          <Anneau decalage={PERIODE / 2} couleur={couleur} rayon={rayon} />
        </>
      )}
      {children}
    </View>
  );
}
