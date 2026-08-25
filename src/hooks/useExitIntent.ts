import { useEffect, useRef } from 'react';
import { useIsDesktop } from './useMediaQuery';

/**
 * Délai d'armement. Un visiteur dont la souris frôle le haut de l'écran dans les premières
 * secondes n'a pas « décidé de partir » : il cherche encore la barre de navigation.
 */
const ARM_DELAY_MS = 8000;

/**
 * Détecte l'intention de sortie : le pointeur quitte le document par le HAUT, c'est-à-dire vers
 * la barre d'onglets, la barre d'adresse ou le bouton de fermeture.
 *
 * ⚠️ **C'est un substitut, pas une détection de fermeture.** Aucun navigateur n'autorise une
 * fenêtre applicative à s'ouvrir à la fermeture d'un onglet : seul le dialogue natif
 * `beforeunload` existe, son texte n'est pas modifiable et Chrome l'ignore souvent. L'exit-intent
 * souris est la seule approximation possible — et elle n'existe qu'au DESKTOP : sans pointeur, il
 * n'y a rien à observer. Le hook se désactive donc de lui-même sous `lg`. Sur mobile, la sortie
 * se rattrape par l'interception de navigation (`useBlocker`), pas ici.
 *
 * Ne se déclenche qu'une fois par montage.
 */
export function useExitIntent(enabled: boolean, onTrigger: () => void): void {
  const isDesktop = useIsDesktop();
  const handlerRef = useRef(onTrigger);

  useEffect(() => {
    handlerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    if (!enabled || !isDesktop) return;

    let armed = false;
    let fired = false;
    const armTimer = window.setTimeout(() => { armed = true; }, ARM_DELAY_MS);

    /**
     * `mouseout` sur le document plutôt que `mouseleave` : c'est la forme qui se comporte
     * identiquement partout. `relatedTarget` nul signifie que le pointeur a quitté le document
     * et n'est pas simplement passé d'un élément à un autre.
     */
    const handleMouseOut = (event: MouseEvent) => {
      if (!armed || fired) return;
      if (event.relatedTarget !== null) return;
      if (event.clientY > 0) return;
      fired = true;
      handlerRef.current();
    };

    document.addEventListener('mouseout', handleMouseOut);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [enabled, isDesktop]);
}
