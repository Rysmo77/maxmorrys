import EcranSquelette from '../../../components/states/EcranSquelette';

/**
 * Écran « edu.live » — squelette posé par la passe 2 (châssis), à remplir par le lot B.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function CohorteLivePage() {
  return (
    <EcranSquelette
      ecran="edu.live"
      variant="app"
      icon="video"
      links={[{ to: '/mon-espace/cohorte', labelKey: 'links.cohort' }]}
    />
  );
}
