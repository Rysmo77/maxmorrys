import { useEffect, useState } from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { captureError } from '../../lib/sentry';
import ErrorScreen from './ErrorScreen';
import NotFound from '../../pages/NotFound';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE FILET D'ERREUR DE CHAQUE ROUTE.
 *
 * Le dépôt n'avait qu'UNE frontière d'erreur, posée autour des fournisseurs, pour
 * soixante-dix routes. Conséquence : le plantage d'un seul écran emportait l'en-tête,
 * la navigation et le pied de page avec lui — la personne se retrouvait devant une
 * page vide sans aucune sortie que le rechargement.
 *
 * Posé en `errorElement` sur chaque route, celui-ci s'affiche DANS l'`<Outlet>` du
 * gabarit : la coquille reste debout et la navigation reste utilisable. React Router
 * fait remonter l'erreur jusqu'à la frontière la plus proche, donc annoter les feuilles
 * suffit — et `ErrorBoundary` reste le dernier recours pour ce qui tombe au-dessus du
 * routeur.
 *
 * ── UN 404 N'EST PAS UN 500 ───────────────────────────────────────────────────
 * `errorElement` attrape AUSSI les réponses d'erreur du routeur. Rendre l'écran de
 * plantage sur un 404 dirait « le code a échoué » là où la vérité est « cette adresse
 * n'existe pas » — deux motifs différents, deux sorties différentes. D'où l'aiguillage.
 *
 * ── LA TÉLÉMÉTRIE PART UNE FOIS, ET SEULEMENT POUR UN VRAI PLANTAGE ───────────
 * Dans un effet, pas pendant le rendu : `captureError` pendant le rendu se rejouerait
 * à chaque nouveau rendu, et en mode strict deux fois d'affilée. Un 404 n'est pas
 * remonté — ce n'est pas un incident, c'est une adresse.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export default function RouteError() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  const [incident, setIncident] = useState<string | undefined>();

  useEffect(() => {
    if (isNotFound) return;
    setIncident(captureError(error, { context: 'RouteError' }));
  }, [error, isNotFound]);

  if (isNotFound) return <NotFound />;
  return <ErrorScreen incident={incident} />;
}
