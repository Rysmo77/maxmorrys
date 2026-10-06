import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { APPAREIL_MODESTE, COURBE, DUREE, ENFONCEMENT, duree, useMouvement } from './mouvement';

/*
 * Les deux COMPOSANTS du mouvement — l'enfoncement et l'entrée. Les durées, les courbes et
 * la préférence « réduire les animations » vivent dans `mouvement.ts` : un module qui exporte
 * des composants ET des constantes casse le rechargement à chaud.
 */

/* ── 120 ms — « j'ai senti ton doigt » ──────────────────────────────────────────────── */

const PressableAnime = Animated.createAnimatedComponent(Pressable);

/**
 * L'enfoncement du système, EN 120 MS. Il sautait d'un coup (`pressed ? .975 : 1`) : le geste
 * était senti, pas vu. « Ni un rebond, ni un agrandissement, ni un changement de couleur. Un
 * enfoncement de 2,5 % — assez pour être senti, trop peu pour être remarqué. »
 *
 * Un contrôle DÉSACTIVÉ ne s'enfonce pas : un retour tactile sur ce qui ne fait rien est un
 * mensonge de plus (planche des micro-interactions, l'interrupteur désactivé).
 */
export function Pressoir({
  echelle = 'md', desactive, style, onPressIn, onPressOut, children, ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  echelle?: keyof typeof ENFONCEMENT;
  desactive?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const { reduit: r } = useMouvement();
  const valeur = useRef(new Animated.Value(1)).current;
  const vers = (cible: number) => Animated.timing(valeur, {
    toValue: cible, duration: duree(DUREE.tap, r), easing: COURBE.standard, useNativeDriver: true,
  }).start();

  return (
    <PressableAnime
      {...props}
      onPressIn={(e) => { if (!desactive) vers(ENFONCEMENT[echelle]); onPressIn?.(e); }}
      onPressOut={(e) => { vers(1); onPressOut?.(e); }}
      style={[style, { transform: [{ scale: valeur }] }]}
    >
      {children}
    </PressableAnime>
  );
}

/* ── 380 ms — « ceci vient d'arriver » ─────────────────────────────────────────────── */

/**
 * L'ENTRÉE `.rv` : +16 px et opacité, `--t-enter`, 70 ms entre voisins. Une seule fois, à
 * l'arrivée — « la scène se joue quand l'écran entre dans le champ, une seule fois ».
 * `echelle` donne la variante `.rv-s` (scale .94), réservée aux glyphes et aux cartes-objets.
 */
export function Revele({
  i = 0, echelle = false, style, children,
}: { i?: number; echelle?: boolean; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const { reduit: r } = useMouvement();
  const p = useRef(new Animated.Value(r ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(p, {
      toValue: 1,
      duration: duree(DUREE.enter, r),
      /* Six voisins décalés, pas huit : au-delà, l'écran met près d'une seconde à se poser,
         et le dernier bloc arrive quand on a déjà commencé à lire. */
      delay: r ? 0 : Math.min(i, PLAFOND_CASCADE) * DUREE.decalage,
      easing: COURBE.sortie,
      useNativeDriver: true,
    }).start();
    // Une seule fois, à l'arrivée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Sur un appareil modeste, l'entrée n'est plus qu'un fondu : la translation de chaque bloc
     se paie en recomposition, l'opacité presque pas. L'information « ceci arrive » reste. */
  const transform = APPAREIL_MODESTE
    ? []
    : echelle
      ? [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }]
      : [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }];
  return <Animated.View style={[style, { opacity: p, transform }]}>{children}</Animated.View>;
}

const PLAFOND_CASCADE = 6;

/**
 * UN OBJET-HÉROS — la tuile d'icône, le cadenas, la coche d'un succès. Il n'entre pas en
 * montant comme un paragraphe : il APPARAÎT, `scale .94 → 1` (`.rv-s` du kit). Le châssis le
 * reconnaît dans sa cascade ; ailleurs, c'est un simple conteneur.
 */
export function Heros({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}


/* ── 180 ms — « la liste a changé, pas la page » ───────────────────────────────────── */

/**
 * LE CONTENU QUI CHANGE SUR PLACE — une liste filtrée, une vue basculée. Il ne glisse pas
 * (on n'a pas changé de page) : il se fond, 180 ms, à chaque nouvelle `cle`. Sans lui, la
 * liste se remplaçait d'un coup sous le doigt qui venait de toucher le filtre.
 */
export function Fondu({ cle, style, children }: { cle: string; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const { reduit: r } = useMouvement();
  const p = useRef(new Animated.Value(1)).current;
  const premier = useRef(true);
  useEffect(() => {
    if (premier.current) { premier.current = false; return; }
    p.setValue(0);
    Animated.timing(p, { toValue: 1, duration: duree(180, r), easing: COURBE.standard, useNativeDriver: true }).start();
  }, [cle, p, r]);
  return <Animated.View style={[style, { opacity: p }]}>{children}</Animated.View>;
}
