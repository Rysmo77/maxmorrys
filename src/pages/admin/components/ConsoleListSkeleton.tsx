import Card from '../../../components/ui/Card';

/**
 * LE SQUELETTE DE LISTE DE LA CONSOLE — ce qui remplace le rond qui tournait.
 *
 * Sept onglets du Club rendaient exactement la même chose pendant leur chargement :
 * un rond centré, sans forme ni hauteur, à la place du contenu attendu.
 *
 * Le système l'interdit, et pas par goût : « Jamais de rond qui tourne — il ne dit ni ce qui
 * se passe, ni combien de temps. Liste : SQUELETTE À LA FORME EXACTE DU CONTENU, pour que
 * rien ne saute. » Un rond centré fait deux dégâts mesurables : il n'annonce pas ce qui
 * arrive, et il occupe une hauteur qui n'est pas celle du contenu — donc tout saute au
 * moment du remplacement, sur l'appareil qui a justement le plus de mal à repeindre.
 *
 * Ce squelette a la forme d'une liste de `Card` : c'est ce que rendent ces sept onglets.
 * Il n'est pas décoratif, il RÉSERVE LA PLACE.
 *
 * `animate-pulse` anime l'opacité, jamais une propriété de mise en page : la règle 3 tient.
 */
export default function ConsoleListSkeleton({ rows = 3, label }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label={label ?? 'Chargement'}>
      {Array.from({ length: rows }, (_, i) => (
        <Card key={i}>
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="h-4 w-1/3 rounded bg-[color:var(--fill-3)]" />
              <div className="h-6 w-20 rounded-pill bg-[color:var(--fill-2)]" />
            </div>
            <div className="h-3 w-full rounded bg-[color:var(--fill-2)]" />
            <div className="h-3 w-2/3 rounded bg-[color:var(--fill-2)]" />
          </div>
        </Card>
      ))}
    </div>
  );
}
