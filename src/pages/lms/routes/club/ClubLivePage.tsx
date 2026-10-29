import EcranSquelette from '../../../../components/states/EcranSquelette';

/**
 * Écran « club.live » — squelette posé par la passe 2 (châssis), à remplir par le lot C.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function ClubLivePage() {
  return (
    <EcranSquelette
      ecran="club.live"
      variant="app"
      icon="video"
      links={[{ to: '/mon-espace/club/agenda', labelKey: 'links.clubAgenda' }]}
    />
  );
}
