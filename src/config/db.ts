import { getFirestore } from 'firebase/firestore';
import app from './firebase';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FIRESTORE VIT DANS SON PROPRE MODULE, ET C'EST UNE DÉCISION DE POIDS.
 *
 * `db` était exporté par `config/firebase.ts`. Comme `AuthContext` importe ce
 * fichier au démarrage — il doit savoir tout de suite si quelqu'un est connecté —
 * le SDK Firestore entrait dans le graphe STATIQUE de l'entrée, et Vite lui émettait
 * un `<link rel="modulepreload">` sur toutes les pages.
 *
 * Mesuré : **59,4 Ko gzip**, soit 17 % des 356,6 Ko de la première vue, téléchargés
 * par un visiteur anonyme qui lit l'accueil et n'interrogera aucune collection.
 * Sur un marché où le panier de 2 Go coûte 4,2 % du revenu national brut par
 * habitant, c'est le plus gros poste évitable du chargement.
 *
 * Isoler `db` ici ne suffit PAS à lui seul : il faut aussi qu'aucun module du chemin
 * de démarrage ne l'importe statiquement. C'est pourquoi `AuthContext` le charge en
 * `await import()` dans ses quatre fonctions asynchrones. Tout le reste — les quatorze
 * modules de `lib/firestore`, les pages, les hooks — n'est atteint que par des routes
 * déjà paresseuses : leur import statique d'ici est donc sans effet sur la première vue.
 *
 * ⚠️ NE PAS RÉ-EXPORTER `db` DEPUIS `config/firebase.ts`. Une seule ligne suffit à
 * remettre Firestore dans le préchargement, et rien ne le signalerait : la build passe,
 * les tests passent, l'écran est identique. `tests/unit/first-view-weight.test.ts`
 * échoue si le chunk Firestore réapparaît dans les `modulepreload` de `dist/index.html`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export const db = getFirestore(app);
