import EcranSquelette from '../../components/states/EcranSquelette';

/**
 * Écran « edu.methode » — squelette posé par la passe 2 (châssis), à remplir par le lot B.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function MethodePage() {
  return (
    <EcranSquelette
      ecran="edu.methode"
      variant="site"
      icon="compass"
      links={[{ to: '/formations', labelKey: 'links.courses' }]}
    />
  );
}
