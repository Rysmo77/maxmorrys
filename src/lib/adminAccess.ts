/**
 * Périmètre du rôle `support` dans l'espace d'administration — SOURCE UNIQUE DE VÉRITÉ.
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE
 * Le drapeau `adminOnly` vivait uniquement dans la table de navigation d'`AdminLayout`, où il
 * ne servait qu'à masquer des entrées de menu. `AdminRoute` autorisait `['admin', 'support']`
 * sur la totalité des routes sans distinction : un compte support qui tapait l'URL atteignait
 * `/admin/transactions`, `/admin/utilisateurs` et `/admin/parametres`. L'intention était
 * écrite, elle n'était pas appliquée.
 *
 * Le menu et le garde de route lisent désormais cette table. Ajouter un écran réservé aux
 * admins = une seule édition ici.
 *
 * ⚠️ CE N'EST PAS LA DERNIÈRE LIGNE DE DÉFENSE. Un garde de route est du code client :
 * il masque l'écran, il ne protège pas la donnée. Le confinement réel est dans
 * `firestore.rules`, qui distingue `isAdmin()` de `isAdminOrSupport()`. Toute écriture
 * sensible doit rester fermée côté règles, même si son écran est déjà filtré ici.
 */

/**
 * Chemins d'administration ouverts au rôle `support`. Tout le reste est réservé aux admins.
 *
 * Les libellés vivent ICI, avec les chemins. Le design system l'exige explicitement : la
 * liste est affichée à deux endroits — le menu de l'espace d'administration, et l'écran /403
 * qui dit à quelqu'un ce que son rôle atteint. Deux déclarations, c'est deux occasions de
 * mentir à la personne sur ce qu'elle a le droit de faire.
 *
 * ⚠️ TROIS DEPUIS L'APPLICATION NATIVE. `android/app/src/main/java/me/maxmorrys/rysmo/ecrans/
 * media/Console.kt` porte les cinq libellés et `.../ecrans/media/ConsoleEcran.kt` les cinq
 * chemins — un module Gradle ne peut pas importer ce fichier. ⭐ Ce troisième miroir est GARDÉ :
 * `tests/unit/natif-miroirs.test.ts` compare les libellés, les chemins et leur ORDRE.
 */
export const SUPPORT_SCOPE = [
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/temoignages', label: 'Témoignages' },
  { to: '/admin/rendez-vous', label: 'Rendez-vous' },
  { to: '/admin/prospects-agence', label: 'Prospects' },
  { to: '/admin/projets', label: 'Projets' },
] as const;

export const SUPPORT_ALLOWED_PATHS = SUPPORT_SCOPE.map((s) => s.to);

/**
 * Le chemin donné est-il accessible au rôle `support` ?
 *
 * Compare sur le chemin **dé-localisé** : l'arbre de routes est monté deux fois, et un
 * `/en/admin/...` doit être filtré exactement comme son équivalent français.
 */
export function isSupportAllowedPath(pathname: string): boolean {
  const path = pathname.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  return SUPPORT_ALLOWED_PATHS.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`),
  );
}
