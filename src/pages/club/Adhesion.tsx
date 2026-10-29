import EcranSquelette from '../../components/states/EcranSquelette';

/**
 * Écran « club.adhesion » — squelette posé par la passe 2 (châssis), à remplir par le lot C.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function ClubAdhesionPage() {
  return (
    <EcranSquelette
      ecran="club.adhesion"
      variant="site"
      icon="crown"
      links={[{ to: '/club-des-digitos', labelKey: 'links.clubHome' }, { to: '/mon-espace/club', labelKey: 'links.club' }]}
    />
  );
}
