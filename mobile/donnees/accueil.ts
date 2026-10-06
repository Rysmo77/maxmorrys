import AsyncStorage from '@react-native-async-storage/async-storage';
import { capaciteDuVerrou, chargerDrapeau } from './verrou';

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

/* ── Après la première connexion ─────────────────────────────────────────────────────── */

const CLE_BIOMETRIE = 'rysmo.biometrie.proposee';

/**
 * OÙ ALLER APRÈS UNE CONNEXION. La proposition d'entrer sans mot de passe arrive ICI, une
 * seule fois — pas à la première ouverture, où elle demandait une empreinte à quelqu'un qui
 * n'avait encore aucun compte à protéger. Elle ne revient pas si l'appareil ne peut pas, si
 * le verrou est déjà posé, ou si elle a déjà été faite.
 */
export async function apresConnexion(): Promise<'/biometrie' | '/espace'> {
  try {
    if ((await AsyncStorage.getItem(CLE_BIOMETRIE)) === '1') return '/espace';
    const [capacite, actif] = await Promise.all([capaciteDuVerrou(), chargerDrapeau()]);
    if (capacite.etat !== 'pret' || actif) return '/espace';
    await AsyncStorage.setItem(CLE_BIOMETRIE, '1');
    return '/biometrie';
  } catch {
    return '/espace';
  }
}
