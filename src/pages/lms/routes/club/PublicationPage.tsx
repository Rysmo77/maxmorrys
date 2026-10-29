import EcranSquelette from '../../../../components/states/EcranSquelette';

/**
 * Écran « club.publication » — squelette posé par la passe 2 (châssis), à remplir par le lot C.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function ClubPublicationPage() {
  return (
    <EcranSquelette
      ecran="club.publication"
      variant="app"
      icon="comment"
      links={[{ to: '/mon-espace/club/fil', labelKey: 'links.clubFeed' }]}
    />
  );
}
