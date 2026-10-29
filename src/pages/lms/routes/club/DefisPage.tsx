import EcranSquelette from '../../../../components/states/EcranSquelette';

/**
 * Écran « club.defis » — squelette posé par la passe 2 (châssis), à remplir par le lot C.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function ClubDefisPage() {
  return (
    <EcranSquelette
      ecran="club.defis"
      variant="app"
      icon="target"
      links={[{ to: '/mon-espace/club/fil', labelKey: 'links.clubFeed' }]}
    />
  );
}
