import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

import { CONFIG_FIREBASE } from './config';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * L'AUTHENTIFICATION, ET RIEN D'AUTRE.
 *
 * ⚠️ `firebase/firestore` N'EST PAS ICI, ET NE DOIT PAS Y VENIR. Toutes les lectures
 * passent par `api.maxmorrys.me` (voir `appel.ts`), pour trois raisons qui ne sont pas des
 * préférences :
 *
 *   1. Ce que les écrans consomment est un MODÈLE DE VUE, pas un document. `FORMATION.arret`
 *      (« Tu t'es arrêtée il y a 8 jours »), `CLASSEMENT`, `CLUB.bilan` sont des jointures
 *      sur `enrollments` × `formations` × `gamification`. Les refaire ici réimplémenterait
 *      la logique métier dans un second endroit, sans test partagé — exactement ce que le
 *      README du port interdit.
 *   2. Les règles font PAYER la jointure : `hasActiveClubSub()` fait un `get()` par lecture,
 *      et le tableau de bord du Club coûterait cinq à sept allers-retours en série.
 *   3. Le serveur ESTAMPILLE ce qu'il renvoie (`releveA`). C'est ce dont `<Num asOf>` a
 *      besoin, et ce que les écrans n'ont pas aujourd'hui — ils citent une date en dur.
 *
 * Et le coût est mesurable : `firebase/firestore` pèse environ 250 Ko par-dessus les 90 Ko
 * d'app+auth, pour un cache hors-ligne qui, sur React Native, ne vit qu'en mémoire.
 *
 * ── LA PERSISTANCE, ET POURQUOI CE N'EST PAS `getAuth()` ──────────────────────────────
 * `getAuth(app)` sur React Native donne une persistance EN MÉMOIRE : la session ne survit
 * pas à la fermeture de l'application, et chaque lancement redemande le mot de passe. Le
 * symptôme se lit comme un bug d'authentification alors que c'est un défaut d'initialisation.
 *
 * Et ce n'est pas `expo-secure-store` non plus : le blob que le SDK y stocke (jeton d'accès,
 * jeton de rafraîchissement, données du fournisseur) dépasse régulièrement la limite Android
 * d'environ 2 048 octets. L'échec est alors INTERMITTENT ET PAR COMPTE — la pire forme de
 * panne, celle qui se reproduit chez une personne sur dix et jamais chez soi. SecureStore
 * garde son usage propre : le drapeau du déverrouillage biométrique, qui tient en un octet.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/*
 * Initialisation PARESSEUSE. Ce module est sur le chemin de démarrage, et une construction
 * incomplète (six clés manquantes) ne doit pas faire tomber l'application avant le premier
 * rendu : `config.ts` explique pourquoi on préfère une panne nommée à un écran blanc.
 */
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/** L'authentification, ou `null` si la construction n'a pas reçu sa configuration. */
export function getAuthNatif(): Auth | null {
  if (CONFIG_FIREBASE === null) return null;
  if (auth === null) {
    app = app ?? initializeApp(CONFIG_FIREBASE);
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  }
  return auth;
}

/**
 * Le jeton d'identité du moment, ou `null` si personne n'est connecté.
 *
 * On ne le met JAMAIS en cache : le SDK le renouvelle tout seul avant expiration, et une
 * copie gardée ici serait périmée une heure plus tard sans que rien ne le signale.
 */
export async function jetonCourant(): Promise<string | null> {
  const a = getAuthNatif();
  if (!a?.currentUser) return null;
  return a.currentUser.getIdToken();
}
