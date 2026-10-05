import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * « L'ACCUEIL A ÉTÉ VU » — le seul drapeau qui décide de la première ouverture.
 *
 * ⛔ LE PORT D'ORIGINE N'ATTEIGNAIT JAMAIS CETTE CHAÎNE. Sans `app/index.tsx`, `expo-router`
 * servait `/` depuis l'onglet Espace : `lancement → onboarding → permissions` était écrite et
 * jamais exécutée. Puis, une fois atteinte, elle rejouait l'onboarding à CHAQUE démarrage
 * sans session. Ce drapeau tranche : vu une fois, l'accueil ne revient plus.
 *
 * ⚠️ « Passer » compte autant que « Commencer » : dans les deux cas l'accueil a été VU, et le
 * reproposer punirait d'avoir passé. (Repris de la réécriture Kotlin, abandonnée.)
 *
 * Un booléen, en clair, rien d'identifiant — il ne part sur aucun réseau.
 */
const CLE = 'rysmo.accueil.vu';

/** `false` si le disque ne répond pas : revoir l'accueil coûte moins que le perdre. */
export async function accueilVu(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLE)) === '1';
  } catch {
    return false;
  }
}

export async function marquerAccueilVu(): Promise<void> {
  try {
    await AsyncStorage.setItem(CLE, '1');
  } catch {
    /* Au pire, l'accueil se reverra au prochain démarrage. */
  }
}
