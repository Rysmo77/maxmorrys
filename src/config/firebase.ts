import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

for (const key of requiredEnvVars) {
  if (!import.meta.env[key]) {
    throw new Error(`Variable d'environnement manquante : ${key}. Vérifiez votre fichier .env.local`);
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/* ⚠️ `db` N'EST PLUS ICI, ET NE DOIT PAS Y REVENIR. Ce module est sur le chemin de
   DÉMARRAGE — `AuthContext` l'importe pour savoir tout de suite si quelqu'un est
   connecté. Y importer `firebase/firestore` remettait 59,4 Ko gzip dans le
   `modulepreload` de toutes les pages, pour un visiteur anonyme qui n'interroge
   aucune collection. Firestore vit dans `config/db.ts`, qui explique le reste. */

// Le second argument accepte soit une région, soit un domaine personnalisé : le
// SDK appelle alors `${domaine}/${nomDeLaFonction}`. C'est le point de bascule
// des callables vers Cloudflare — les sites `httpsCallable` restent inchangés.
//
// ⚠️ LE REPLI NE PEUT PLUS ÊTRE UNE RÉGION. Il valait `'us-central1'`, c'est-à-dire
// Cloud Functions — un backend qui N'EXISTE PLUS : `functions/` a été supprimé le
// 03/09/2026, le projet est Cloudflare-only. Un build sans `VITE_FUNCTIONS_ORIGIN`
// envoyait donc les 33 `httpsCallable` — paiements, inscriptions, Rysmo, certificats —
// vers `us-central1-….cloudfunctions.net`, qui ne répond plus. La CSP l'autorisait
// encore, si bien que l'appel partait vraiment et échouait en 404 : une panne
// fonctionnelle sans la moindre violation visible en console.
// Le repli pointe désormais là où le backend vit réellement, et `*.cloudfunctions.net`
// a quitté `connect-src` dans `firebase.json` — voir `tests/unit/csp.test.ts`.
export const functions = getFunctions(
  app,
  import.meta.env.VITE_FUNCTIONS_ORIGIN || 'https://api.maxmorrys.me',
);

// En dev, on cible les fonctions de PROD par défaut. Mettre VITE_USE_FUNCTIONS_EMULATOR=true
// (avec `firebase emulators:start`) pour basculer sur l'émulateur local.
if (import.meta.env.DEV && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export default app;
