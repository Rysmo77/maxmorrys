import type { Persistence } from 'firebase/auth';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE PONT DE TYPES VERS L'ENTRÉE REACT NATIVE DE `firebase/auth`.
 *
 * `getReactNativePersistence` EXISTE à l'exécution — elle est dans le build livré
 * (`@firebase/auth/dist/rn/index.js`), et Metro la résout parce qu'il applique la condition
 * d'export `react-native`. Ce sont ses TYPES qui manquent, et pour une raison précise :
 *
 *   la table `exports` de `@firebase/auth` ordonne ses conditions ainsi —
 *   ['types', 'node', 'react-native', 'cordova', 'webworker', 'browser', 'default']
 *
 * `types` vient EN PREMIER. La résolution de TypeScript s'y arrête et sert
 * `dist/auth-public.d.ts`, qui est l'entrée générique, sans les ajouts React Native. Le
 * `customConditions: ["react-native"]` que pose `expo/tsconfig.base` n'y change rien : la
 * condition `react-native` n'est jamais atteinte. Ce n'est donc ni une erreur de
 * configuration de notre côté, ni une fonction absente — c'est un ordre de clés chez Firebase.
 *
 * Sans ce fichier, la seule échappatoire serait un `@ts-expect-error` sur l'import ou un
 * chemin profond `@firebase/auth/dist/rn/index.js`. Le premier éteint la vérification sans
 * rien expliquer ; le second se casse à la prochaine version mineure. Une déclaration
 * explicite dit ce qui existe, le prouve à l'appel, et laisse le reste du module vérifié.
 *
 * ⚠️ À REVOIR si `firebase` passe une version majeure, ou si `@react-native-async-storage`
 * passe en 3.x — la 3 remplace l'export par défaut par `createAsyncStorage('app')`, et la
 * forme attendue ici changerait.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
declare module 'firebase/auth' {
  /**
   * La forme est décrite ICI plutôt qu'importée : `ReactNativeAsyncStorage` est déclarée
   * dans `auth-public.d.ts` mais n'est pas ré-exportée par le paquet parapluie `firebase`.
   * Trois méthodes suffisent, et c'est exactement ce que le SDK appelle.
   */
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
