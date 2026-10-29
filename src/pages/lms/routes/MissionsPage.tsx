import EcranSquelette from '../../../components/states/EcranSquelette';

/**
 * Écran « edu.missions » — squelette posé par la passe 2 (châssis), à remplir par le lot B.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function MissionsPage() {
  return (
    <EcranSquelette
      ecran="edu.missions"
      variant="app"
      icon="pencil"
      links={[{ to: '/mon-espace/cours', labelKey: 'links.courses' }]}
    />
  );
}
