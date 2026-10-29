import EcranSquelette from '../../../../components/states/EcranSquelette';

/**
 * Écran « club.profil » — squelette posé par la passe 2 (châssis), à remplir par le lot C.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function ClubMembreProfilPage() {
  return (
    <EcranSquelette
      ecran="club.profil"
      variant="app"
      icon="user"
      links={[{ to: '/mon-espace/club/membres', labelKey: 'links.clubMembers' }]}
    />
  );
}
