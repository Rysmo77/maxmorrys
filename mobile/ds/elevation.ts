import type { ViewStyle } from 'react-native';

/**
 * ══ LES QUATRE ÉLÉVATIONS ══ — au lieu d'une ombre recopiée par écran.
 *
 *   e0  cartes de verre            aucune ombre : le voile suffit
 *   e1  chrome (barres)            un filet sur iOS, élévation 3 sur Android
 *   e2  flottant (FAB, lecteur)    y 8, rayon 12, 20 %, teinte du territoire
 *   e3  feuille du bas             y −6, rayon 24, 20 %, élévation 12
 *
 * Le rayon React Native est la MOITIÉ du flou CSS (`--sh-*` du kit écrit 24 px de flou).
 */
export function elevation(niveau: 0 | 1 | 2 | 3, teinte: string): ViewStyle {
  switch (niveau) {
    case 0: return {};
    case 1: return { shadowColor: teinte, shadowOpacity: 0.08, shadowRadius: 1, shadowOffset: { width: 0, height: 1 }, elevation: 3 };
    case 2: return { shadowColor: teinte, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 6 };
    default: return { shadowColor: teinte, shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: -6 }, elevation: 12 };
  }
}
