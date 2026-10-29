import EcranSquelette from '../../../components/states/EcranSquelette';

/**
 * Écran « edu.quiz » — squelette posé par la passe 2 (châssis), à remplir par le lot B.
 * Maquette et route : voir `ROUTES.md` (scratchpad de la refonte). État vide honnête :
 * aucune donnée d'exemple tant que le producteur n'existe pas.
 */
export default function QuizPage() {
  return (
    <EcranSquelette
      ecran="edu.quiz"
      variant="app"
      icon="help"
      links={[{ to: '/mon-espace/cours', labelKey: 'links.courses' }]}
    />
  );
}
