import EcranSquelette from '../../components/states/EcranSquelette';

/**
 * Écran « edu.assistant » — squelette posé par la passe 2 (châssis), à remplir par le lot B.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function AssistantPublicPage() {
  return (
    <EcranSquelette
      ecran="edu.assistant"
      variant="site"
      icon="sparkles"
      links={[{ to: '/mon-espace/assistant', labelKey: 'links.assistant' }]}
    />
  );
}
