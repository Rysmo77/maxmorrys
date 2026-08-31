import { useEffect, useState } from 'react';

/**
 * L'état du réseau, tel que le navigateur le connaît.
 *
 * ⚠️ CE QUE `navigator.onLine` VAUT, EXACTEMENT. Il répond « oui » dès qu'une interface
 * réseau est active — un Wi-Fi de restaurant sur son portail captif, une 3G qui ne porte
 * plus rien, un partage de connexion sans forfait répondent tous « en ligne ». Il est donc
 * fiable dans UN SEUL SENS : quand il dit `false`, il n'y a effectivement pas de réseau.
 *
 * C'est pourquoi ce crochet ne sert qu'à AFFICHER UNE INTERRUPTION, jamais à décider qu'une
 * requête peut partir. Une requête part toujours ; c'est son échec qui fait foi.
 *
 * La valeur initiale est `true` et non `navigator.onLine` : au premier rendu, une lecture
 * qui se trompe fait clignoter un bandeau d'alerte sur une connexion parfaitement saine.
 * L'écouteur corrigera au premier événement réel, qui arrive immédiatement s'il y a coupure.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return online;
}
