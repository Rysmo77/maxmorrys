import EcranSquelette from '../../components/states/EcranSquelette';

/**
 * Écran « console.infra » — squelette posé par la passe 2 (châssis), à remplir par le lot D.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function AdminInfra() {
  return (
    <EcranSquelette
      ecran="console.infra"
      variant="app"
      icon="monitor"
      links={[{ to: '/admin', labelKey: 'links.console' }]}
    />
  );
}
