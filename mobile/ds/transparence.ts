import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * « RÉDUIRE LA TRANSPARENCE » (iOS) — une seule souscription, comme le mouvement.
 *
 * Le verre du système (voiles à 62–78 %, flou de la barre) laisse transparaître le maillage :
 * pour quelqu'un qui a demandé moins de transparence, c'est précisément le défaut qu'il a
 * demandé de retirer. Les surfaces deviennent alors OPAQUES. Android n'a pas ce réglage : la
 * lecture y répond `false`.
 */
let dense = false;
const abonnes = new Set<() => void>();

void AccessibilityInfo.isReduceTransparencyEnabled()
  .then((v) => { dense = v; abonnes.forEach((f) => f()); })
  .catch(() => undefined);
AccessibilityInfo.addEventListener('reduceTransparencyChanged', (v) => { dense = v; abonnes.forEach((f) => f()); });

export function useTransparenceReduite(): boolean {
  return useSyncExternalStore(
    (f) => { abonnes.add(f); return () => { abonnes.delete(f); }; },
    () => dense,
  );
}
