import EcranSquelette from '../../components/states/EcranSquelette';

/**
 * Écran « console.journal » — squelette posé par la passe 2 (châssis), à remplir par le lot D.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function AdminJournal() {
  return (
    <EcranSquelette
      ecran="console.journal"
      variant="app"
      icon="shield"
      links={[{ to: '/admin', labelKey: 'links.console' }]}
    />
  );
}
