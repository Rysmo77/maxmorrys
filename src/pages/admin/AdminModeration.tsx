import EcranSquelette from '../../components/states/EcranSquelette';

/**
 * Écran « console.moderation » — squelette posé par la passe 2 (châssis), à remplir par le lot D.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function AdminModeration() {
  return (
    <EcranSquelette
      ecran="console.moderation"
      variant="app"
      icon="flag"
      links={[{ to: '/admin/club-digitos', labelKey: 'links.clubAdmin' }]}
    />
  );
}
