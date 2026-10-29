import EcranSquelette from '../../components/states/EcranSquelette';

/**
 * Écran « console.quotas » — squelette posé par la passe 2 (châssis), à remplir par le lot D.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function AdminQuotas() {
  return (
    <EcranSquelette
      ecran="console.quotas"
      variant="app"
      icon="sparkles"
      links={[{ to: '/admin/utilisateurs', labelKey: 'links.accounts' }]}
    />
  );
}
