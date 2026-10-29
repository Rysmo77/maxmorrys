import EcranSquelette from '../../../components/states/EcranSquelette';

/**
 * Écran « edu.cohorte » — squelette posé par la passe 2 (châssis), à remplir par le lot B.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function CohortePage() {
  return (
    <EcranSquelette
      ecran="edu.cohorte"
      variant="app"
      icon="users"
      links={[{ to: '/mon-espace/cours', labelKey: 'links.courses' }]}
    />
  );
}
