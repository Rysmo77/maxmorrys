import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from 'expo-network';

import type { EtatReseau } from './reseau';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA VEILLE DU RÉSEAU — POUR L'AFFICHAGE ET LE DÉPART DE LA FILE, JAMAIS POUR BLOQUER.
 *
 * Le kit : « EN NATIF, LE SYSTÈME ANNONCE LA COUPURE AVANT QU'UNE REQUÊTE SOIT TENTÉE. »
 * Cette veille sert à DEUX choses, et à rien d'autre :
 *   · le bandeau « hors connexion », juste dès la première image ;
 *   · le départ de la file d'envoi au RETOUR du réseau.
 *
 * ⛔ ELLE NE DÉCIDE D'AUCUN APPEL. `reseau.ts` explique pourquoi : l'état du système se trompe
 * (portail captif, VPN, validation qui tarde). Un appel part toujours ; c'est son échec qui
 * le met en file. Et c'est pour cela que cet abonnement vit ICI et pas dans `reseau.ts`,
 * que `mobile-reseau.test.ts` garde sans aucun état entre deux appels.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** La même règle que `etatDuReseau` : les deux champs facultatifs comparés à `false`. */
export function lireEtat(e: NetworkState): EtatReseau {
  if (e.isInternetReachable === false || e.isConnected === false) return 'absent';
  if (e.isInternetReachable === true || e.isConnected === true) return 'present';
  return 'indetermine';
}

export function useReseau(): EtatReseau {
  const [reseau, setReseau] = useState<EtatReseau>('indetermine');
  useEffect(() => {
    let vivant = true;
    getNetworkStateAsync().then((e) => { if (vivant) setReseau(lireEtat(e)); }).catch(() => {});
    const abonnement = addNetworkStateListener((e) => setReseau(lireEtat(e)));
    return () => { vivant = false; abonnement.remove(); };
  }, []);
  return reseau;
}

/**
 * Appelle `retour` quand le réseau REVIENT, et quand l'application revient au premier plan —
 * les deux moments où une file en attente a une chance de partir.
 */
export function useRetourDuReseau(retour: () => void): void {
  useEffect(() => {
    let precedent: EtatReseau = 'indetermine';
    const abonnement = addNetworkStateListener((e) => {
      const suivant = lireEtat(e);
      if (suivant === 'present' && precedent !== 'present') retour();
      precedent = suivant;
    });
    const premierPlan = AppState.addEventListener('change', (s) => { if (s === 'active') retour(); });
    return () => { abonnement.remove(); premierPlan.remove(); };
  }, [retour]);
}
