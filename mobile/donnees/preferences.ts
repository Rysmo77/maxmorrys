import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * LES PRÉFÉRENCES DE CET APPAREIL — ce qui se règle ici et ne regarde que ce téléphone.
 *
 * Les trois interrupteurs de notification étaient des `useState(true)` : ils revenaient
 * allumés à chaque ouverture, sous une phrase qui les disait « enregistrés ». Ils sont
 * maintenant gardés, et la phrase dit le reste — aucun canal d'envoi n'existe encore.
 *
 * Ce n'est PAS le profil : le nom du tuteur et la mémoire du répétiteur vivent dans
 * `users/{uid}` (`reglerLeRepetiteur`), parce qu'ils doivent suivre la personne d'un appareil
 * à l'autre. Une préférence de notification, elle, appartient au téléphone qui sonne.
 */
const PREFIXE = 'rysmo:pref:';

export function usePreference(cle: string, defaut: boolean): [boolean, (v: boolean) => void] {
  const [valeur, setValeur] = useState(defaut);
  useEffect(() => {
    let vivant = true;
    AsyncStorage.getItem(PREFIXE + cle)
      .then((v) => { if (vivant && v !== null) setValeur(v === '1'); })
      .catch(() => undefined);
    return () => { vivant = false; };
  }, [cle]);
  const changer = useCallback((v: boolean) => {
    setValeur(v);
    AsyncStorage.setItem(PREFIXE + cle, v ? '1' : '0').catch(() => undefined);
  }, [cle]);
  return [valeur, changer];
}
