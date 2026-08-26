import { useEffect, useRef } from 'react';

/**
 * Mécanique d'accessibilité d'un dialogue modal : verrouillage du scroll, fermeture par Échap,
 * piège de focus, et restitution du focus à l'élément d'origine.
 *
 * ⚠️ Pourquoi ce hook existe alors que `ui/Modal` fait déjà tout cela : `ui/Modal` est une carte
 * claire à en-tête et gouttière fixe (`bg-white`, `p-6`). Les pop-ups contextuelles sont une
 * surface éditoriale sombre à fond perdu, en deux colonnes — elles ne peuvent pas vivre dans ce
 * conteneur. Plutôt que d'ouvrir `ui/Modal` à des variantes qui compliqueraient un composant
 * utilisé partout, la mécanique est extraite ici. `ui/Modal` pourra l'adopter plus tard.
 *
 * `modal` distingue deux comportements, et la distinction est PORTEUSE :
 * - `true` (dialogue centré) : scroll verrouillé et focus piégé, comme tout dialogue modal.
 * - `false` (bandeau bas) : ni l'un ni l'autre. Le bandeau ne recouvre pas le contenu — c'est
 *   toute sa raison d'être face à la pénalité « interstitiel intrusif ». Lui verrouiller le
 *   scroll rendrait la page impossible à parcourir derrière lui, et le piège de focus
 *   empêcherait le visiteur de simplement l'ignorer. Échap et la restitution du focus restent
 *   actifs dans les deux cas.
 *
 * Retourne la ref à poser sur le conteneur du dialogue.
 */
export function useDialogA11y(open: boolean, onClose: () => void, modal = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Verrouillage du scroll (modal seulement) + focus initial et final.
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    if (modal) document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => containerRef.current?.focus(), 50);

    return () => {
      window.clearTimeout(focusTimer);
      if (modal) document.body.style.overflow = previousOverflow;
      // `isConnected` : l'élément d'origine peut avoir disparu du DOM entre-temps.
      const previous = previousFocusRef.current;
      if (previous?.isConnected) previous.focus();
    };
  }, [open, modal]);

  // Échap (toujours) + piège de focus (modal seulement), dans un seul écouteur.
  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (!modal || event.key !== 'Tab' || !containerRef.current) return;

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, modal]);

  return containerRef;
}
