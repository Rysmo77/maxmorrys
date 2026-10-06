import { useEffect, useRef } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { COURBE, DUREE, duree, useMouvement } from './mouvement';
import { useScheme, useToken } from './theme';

/**
 * ══ L'ONDE DE RÉFLEXION ══ — la signature du répétiteur, et le seul signe qu'il travaille.
 *
 * Entre l'envoi d'une question et la réponse, rien ne bougeait pendant jusqu'à vingt
 * secondes. Trois barres disent « ça réfléchit » sans dire « ça charge ».
 *
 * TROIS CONDITIONS, ET CHACUNE A SA RAISON :
 *   · ELLE NE BOUGE QUE PENDANT LA GÉNÉRATION. Au repos, c'est un glyphe immobile : une onde
 *     animée en permanence serait une boucle sans attente derrière, et elle perdrait son sens.
 *   · ELLE EST VIOLETTE, JAMAIS BLEUE. Une onde bleue évoque Wave, le portefeuille mobile de
 *     Dakar — donc un paiement. Le violet est la teinte du territoire du répétiteur.
 *   · TROIS BARRES, PAS SEIZE. Seize, c'est la forme d'onde de `MediaCard` : « ça s'écoute ».
 *
 * UNE SEULE valeur animée (0 → 1, 1 250 ms, linéaire, pilote natif) ; chaque barre en lit
 * une phase décalée de 180 ms. À l'arrêt, les barres reviennent à la pose de repos en 220 ms.
 * Sous « réduire les animations », la pose ACTIVE reste figée (1 / 1 / 1) — l'état se lit
 * sans mouvement.
 */
const PERIODE = 1250;
const DEPHASAGE = 180 / PERIODE;
const REPOS = [0.5, 1, 0.67] as const;

export function Onde({
  actif = false, taille = 14, style,
}: { actif?: boolean; taille?: number; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  const scheme = useScheme();
  const { reduit } = useMouvement();
  const phase = useRef(new Animated.Value(0)).current;
  const presence = useRef(new Animated.Value(actif ? 1 : 0)).current;

  useEffect(() => {
    let boucle: Animated.CompositeAnimation | null = null;
    if (actif && !reduit) {
      phase.setValue(0);
      boucle = Animated.loop(Animated.timing(phase, {
        toValue: 1, duration: PERIODE, easing: Easing.linear, useNativeDriver: true,
      }));
      boucle.start();
    }
    Animated.timing(presence, {
      toValue: actif ? 1 : 0, duration: duree(DUREE.ui, reduit), easing: COURBE.standard, useNativeDriver: true,
    }).start();
    return () => { boucle?.stop(); };
  }, [actif, reduit, phase, presence]);

  /* En sombre, le pastel nuit de `mmViolet` manque de contraste sur le verre : l'encre de
     texte violette tient mieux. */
  const couleur = scheme === 'dark' ? t('mmVioletT') : t('mmViolet');
  const barre = taille * (12 / 14);
  const epaisseur = Math.max(2, taille * (3 / 14));

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[{ width: taille, height: taille, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}
    >
      {REPOS.map((repos, k) => {
        /* La phase de la barre k : la boucle décalée de k × 180 ms, repliée en aller-retour. */
        const decale = Animated.modulo(Animated.add(phase, k * DEPHASAGE), 1);
        const vague = decale.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] });
        const anime = reduit ? 1 : vague;
        const echelle = Animated.add(
          Animated.multiply(presence, Animated.subtract(anime, repos)),
          repos,
        );
        return (
          <Animated.View
            key={k}
            style={{
              width: epaisseur, height: barre, borderRadius: epaisseur / 2, backgroundColor: couleur,
              transform: [{ scaleY: echelle }],
            }}
          />
        );
      })}
    </View>
  );
}
