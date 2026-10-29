import EcranSquelette from '../../components/states/EcranSquelette';

/**
 * Écran « hub.compte » — squelette posé par la passe 2 (châssis), à remplir par le lot A.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function ComptePage() {
  return (
    <EcranSquelette
      ecran="hub.compte"
      variant="site"
      icon="user"
      links={[{ to: '/mon-espace/tableau-de-bord', labelKey: 'links.school' }, { to: '/mon-espace/club', labelKey: 'links.club' }, { to: '/mon-espace/paiements', labelKey: 'links.payments' }, { to: '/mon-espace/notifications', labelKey: 'links.notifications' }, { to: '/mon-espace/profil', labelKey: 'links.profile' }]}
    />
  );
}
