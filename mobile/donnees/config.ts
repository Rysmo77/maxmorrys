/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA CONFIGURATION DU CLIENT — lue à la construction, jamais écrite dans le dépôt.
 *
 * Les six clés Firebase ne sont pas des secrets : le web les embarque déjà dans son paquet,
 * et n'importe qui peut les lire dans un navigateur. Ce qui protège la base, ce sont les
 * règles Firestore, pas l'obscurité de ces valeurs. Elles vivent donc en variables
 * `EXPO_PUBLIC_*`, inlinées par Metro à l'export — exactement le mécanisme de
 * `EXPO_PUBLIC_CONTENU_DEMO`, avec la même conséquence : une variable absente devient
 * littéralement `undefined` dans le paquet, pas une erreur de construction.
 *
 * ── POURQUOI ON NE JETTE PAS EN PRODUCTION ────────────────────────────────────────────
 * `src/config/firebase.ts` jette au démarrage quand une variable manque. C'est le bon
 * geste sur le web : la page blanche s'accompagne d'une erreur lisible dans la console du
 * développeur, et un déploiement raté se corrige en cinq minutes.
 *
 * Sur un téléphone, la même erreur donne un écran blanc SANS console, dans une application
 * qu'il faut repasser en revue pour corriger. Alors ici :
 *   • en développement, on jette — fort, tout de suite, avec le nom de la variable ;
 *   • en production, on retient le défaut et `appel()` répond une panne NOMMÉE, que
 *     `SansDonnees` sait afficher. L'application est inutile, mais elle le DIT.
 *
 * Et surtout : cette configuration ne doit jamais atteindre un magasin incomplète. Ce n'est
 * pas au runtime de l'attraper, c'est à la porte — `tests/unit/mobile-app-config.test.ts`
 * et le job `mobile` de la CI échouent si une des six manque à l'export.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/*
 * ⚠️ CHAQUE ACCÈS EST ÉCRIT EN TOUTES LETTRES. Metro remplace le texte
 * `process.env.EXPO_PUBLIC_X` par sa valeur ; il ne suit pas une variable, ne déroule pas
 * une boucle, et `process.env[nom]` ne serait JAMAIS remplacé. Une table de noms serait
 * plus courte à lire et vide à l'exécution.
 */
const BRUT = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
} as const;

/** L'origine des callables. Le Worker sert le protocole `onCall` sur son domaine propre. */
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://api.maxmorrys.me';

const MANQUANTES = (Object.keys(BRUT) as (keyof typeof BRUT)[]).filter((k) => !BRUT[k]);

/** `null` quand la construction est incomplète — et le dire vaut mieux que le taire. */
export const CONFIG_FIREBASE = MANQUANTES.length === 0
  ? (BRUT as { [K in keyof typeof BRUT]: string })
  : null;

/** Le motif, prêt à être affiché. Nomme les variables : un motif vague ne se corrige pas. */
export const MOTIF_CONFIG_MANQUANTE = MANQUANTES.length === 0
  ? null
  : `Configuration de construction incomplète : ${MANQUANTES
    .map((k) => `EXPO_PUBLIC_FIREBASE_${k.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`)
    .join(', ')}.`;

if (__DEV__ && MOTIF_CONFIG_MANQUANTE) {
  // En développement, on refuse de continuer : c'est le seul endroit où l'erreur est lue.
  throw new Error(
    `${MOTIF_CONFIG_MANQUANTE}\n` +
    'Crée `mobile/.env` (ignoré par git) avec les six clés du projet `max-morrys`, ' +
    'ou lance avec les variables dans l’environnement.',
  );
}
