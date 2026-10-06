import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { haptique } from './haptique';

/**
 * LA CONFIRMATION SUR PLACE — « Copié », « Débloqué », « Place réservée ».
 *
 * Le kit interdit la notification flottante : « elle apparaît là où la personne ne regarde
 * pas ». La confirmation se pose donc LÀ OÙ EST LE DOIGT — le libellé du bouton touché
 * change, puis revient à 1,4 s. Le hook ne rend rien : il dit QUAND confirmer, le composant
 * qui l'utilise décide de la forme.
 *
 * Un lecteur d'écran ne voit pas un libellé changer sous un focus qui n'a pas bougé : la
 * confirmation est donc AUSSI annoncée.
 */
export function useConfirmation(ms = 1400): { confirme: boolean; confirmer: (annonce?: string) => void } {
  const [confirme, setConfirme] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (minuteur.current) clearTimeout(minuteur.current); }, []);

  const confirmer = useCallback((annonce?: string) => {
    if (minuteur.current) clearTimeout(minuteur.current);
    setConfirme(true);
    haptique.succes();
    if (annonce) AccessibilityInfo.announceForAccessibility(annonce);
    minuteur.current = setTimeout(() => setConfirme(false), ms);
  }, [ms]);

  return { confirme, confirmer };
}
