import EcranSquelette from '../../components/states/EcranSquelette';

/**
 * Écran « club.sessions » — squelette posé par la passe 2 (châssis), à remplir par le lot C.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function ClubSessionsPage() {
  return (
    <EcranSquelette
      ecran="club.sessions"
      variant="site"
      icon="calendar"
      links={[{ to: '/club-des-digitos', labelKey: 'links.clubHome' }]}
    />
  );
}
