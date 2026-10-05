import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import * as Device from 'expo-device';
import { tokens } from './tokens.generated';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE MOUVEMENT — « Quatre durées, deux courbes, et rien d'autre. »
 *
 * Porté de `DS_Final/brand/motion.css` et des cinq planches `guidelines/planche-*.html`.
 * Chaque durée DIT quelque chose, et c'est elle qui décide où elle s'applique :
 *
 *   tap   120 ms  « j'ai senti ton doigt »       enfoncement .975 (.94 sur les ronds)
 *   ui    220 ms  « l'état a changé »            interrupteur, pilule, pastille, erreur
 *   enter 380 ms  « ceci vient d'arriver »       +16 px et opacité, 70 ms entre voisins
 *   scene 700 ms  « la page se met en place »    titre sous masque (90 ms/ligne), barre
 *
 * ⛔ CE QUE LE SYSTÈME S'INTERDIT, ET QUE CE MODULE REND DIFFICILE :
 *   · animer autre chose que `transform` et `opacity` — tout passe par le pilote NATIF
 *     (`useNativeDriver: true`), qui REFUSE une largeur ou une couleur ;
 *   · les confettis, la secousse, le compteur qui défile, la notification flottante ;
 *   · un troisième moment scénarisé (il y en a deux : l'attente de règlement, le certificat).
 *
 * ⛔ RÉDUIRE LES ANIMATIONS : « toutes les durées passent à 1 ms, dérive du maillage comprise.
 * Câblé une fois, globalement, jamais réintroduit localement. » C'est `useMouvement()`.
 *
 * ⚠️ APPAREIL MODESTE : « c'est le profil d'appareil du marché visé, pas un cas limite ». Le
 * web y pose `.lowfi` (deviceMemory ≤ 2) ; ici, 2 Go de mémoire vive ou moins. La dérive du
 * maillage y est figée ; les entrées, courtes et natives, restent.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const ms = (v: string) => Number.parseFloat(v) || 0;

/** Les durées du système, lues dans les jetons (générés depuis le CSS, AD-8). */
export const DUREE = {
  tap: ms(tokens.light.tTap),
  ui: ms(tokens.light.tUi),
  enter: ms(tokens.light.tEnter),
  scene: ms(tokens.light.tScene),
  decalage: ms(tokens.light.stagger),
  decalageLigne: ms(tokens.light.staggerLine),
} as const;

function bezier(css: string) {
  const m = /cubic-bezier\(([^)]+)\)/.exec(css);
  const [a, b, c, d] = (m?.[1] ?? '.2,.7,.2,1').split(',').map((x) => Number.parseFloat(x));
  return Easing.bezier(a, b, c, d);
}

/** `--ease` pour ce qui bascule, `--ease-out` pour ce qui arrive. */
export const COURBE = {
  standard: bezier(tokens.light.ease),
  sortie: bezier(tokens.light.easeOut),
} as const;

export const ENFONCEMENT = {
  md: Number.parseFloat(tokens.light.pressScale) || 0.975,
  sm: Number.parseFloat(tokens.light.pressScaleSm) || 0.94,
} as const;

/* ── Réduire les animations : UNE souscription pour toute l'application ─────────────── */

let reduit = false;
const abonnes = new Set<() => void>();
let premiereLecture: Promise<boolean> | null = null;

function brancher(): Promise<boolean> {
  if (premiereLecture) return premiereLecture;
  premiereLecture = AccessibilityInfo.isReduceMotionEnabled()
    .then((v) => { reduit = v; abonnes.forEach((f) => f()); return v; })
    .catch(() => false);
  AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => { reduit = v; abonnes.forEach((f) => f()); });
  return premiereLecture;
}

/**
 * La préférence, une fois RÉELLEMENT lue. Pour un moment qui ne doit jamais partir à tort (la
 * brillance du certificat ne se rejoue pas) : on attend la réponse au lieu de supposer.
 */
export async function mouvementReduit(): Promise<boolean> {
  await brancher();
  return reduit;
}

/** 2 Go de mémoire vive ou moins : le profil d'appareil du marché visé. Lu une fois. */
export const APPAREIL_MODESTE = typeof Device.totalMemory === 'number' && Device.totalMemory > 0
  && Device.totalMemory <= 2 * 1024 * 1024 * 1024;

export function useMouvement(): { reduit: boolean; modeste: boolean } {
  void brancher();
  const r = useSyncExternalStore(
    (f) => { abonnes.add(f); return () => { abonnes.delete(f); }; },
    () => reduit,
  );
  return { reduit: r, modeste: APPAREIL_MODESTE };
}

/** Une durée du système, ou 0 quand la personne a demandé moins de mouvement. */
export const duree = (d: number, estReduit: boolean) => (estReduit ? 0 : d);

/* ── 220 ms — « l'état a changé » ───────────────────────────────────────────────────── */

/**
 * Une valeur qui suit un état booléen en 220 ms (0 → 1). Sert à l'interrupteur, aux
 * pilules, à l'apparition d'un message d'erreur — tout ce qui BASCULE.
 */
export function useBascule(actif: boolean): Animated.Value {
  const { reduit: r } = useMouvement();
  const v = useRef(new Animated.Value(actif ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: actif ? 1 : 0, duration: duree(DUREE.ui, r), easing: COURBE.standard, useNativeDriver: true,
    }).start();
  }, [actif, r, v]);
  return v;
}
