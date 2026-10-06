import { useEffect, type ReactNode } from 'react';
import { Animated, Easing, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useMouvement } from './mouvement';
import { useToken } from './theme';

/**
 * LE SQUELETTE — la forme du contenu avant le contenu. JAMAIS un rond qui tourne.
 *
 * La règle est celle du système, et elle a une raison mesurable : un squelette à la forme
 * EXACTE du contenu réel fait que **rien ne saute** à l'arrivée des données. Un rond qui
 * tourne ne dit ni ce qui arrive, ni combien, ni où — et il laisse la mise en page se
 * recomposer sous les yeux au moment où elle se remplit.
 *
 * ── UNE PULSATION, PARTAGÉE ───────────────────────────────────────────────────────────
 * Le bloc immobile se lisait comme un écran figé au bout de deux secondes. Il respire —
 * opacité ,55 ↔ 1 sur 1 200 ms — mais avec UNE SEULE valeur animée pour toute l'application :
 * un écran qui pose huit blocs ne paie pas huit animations, et les huit respirent ensemble,
 * ce qui se lit comme un tout et pas comme un scintillement. La boucle s'arrête quand le
 * dernier squelette disparaît, et ne démarre pas du tout sous « réduire les animations ».
 */
const pouls = new Animated.Value(1);
let boucle: Animated.CompositeAnimation | null = null;
let montes = 0;

function demarrer() {
  montes += 1;
  if (boucle) return;
  pouls.setValue(1);
  boucle = Animated.loop(Animated.sequence([
    Animated.timing(pouls, { toValue: 0.55, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    Animated.timing(pouls, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
  ]));
  boucle.start();
}

function arreter() {
  montes = Math.max(0, montes - 1);
  if (montes > 0 || !boucle) return;
  boucle.stop();
  boucle = null;
  pouls.setValue(1);
}

export function Skeleton({
  width = '100%', height = 16, radius = 12, label, style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  /** Nom accessible — seulement hors d'un `SqueletteGroupe`, qui annonce pour tout le monde. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const { reduit } = useMouvement();
  useEffect(() => {
    if (reduit) return undefined;
    demarrer();
    return arreter;
  }, [reduit]);

  return (
    <Animated.View
      accessible={label !== undefined}
      accessibilityRole={label !== undefined ? 'progressbar' : undefined}
      accessibilityLabel={label}
      style={[{ width, height, borderRadius: radius, backgroundColor: t('fill2'), opacity: reduit ? 1 : pouls }, style]}
    />
  );
}

/**
 * UNE ANNONCE PAR GROUPE. Huit blocs qui disent chacun « chargement » font huit arrêts du
 * lecteur d'écran sur rien. Le groupe parle une fois ; ses blocs se taisent.
 */
export function SqueletteGroupe({ label, children, style }: { label: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={style}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {children}
      </View>
    </View>
  );
}
