import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import Badge from '../ui/Badge';
import { CLIENT_RELATION, categoryKey } from '../../lib/brand';
import type { ClientProject } from '../../lib/brand';

interface ClientWorkDetailProps {
  project: ClientProject;
}

/**
 * Détail d'un projet CLIENT — rendu sous l'aperçu, dans la colonne de droite en desktop
 * et dans l'accordéon en mobile.
 *
 * ⚠️ Ne rend PAS l'aperçu : c'est `ClientWorkIndex` qui le pilote, pour qu'une seule capture
 * externe soit montée à la fois.
 *
 * ⚠️ La mention « Client product » s'oppose à « A MY ONOMA Venture » et ne doit jamais
 * cohabiter avec elle dans un même conteneur. Un projet client appartient à son client :
 * on annonce un RÔLE tenu, jamais une propriété. Voir `docs/BRAND-ARCHITECTURE.md §6`.
 *
 * ⚠️ Les blocs rôle, stack et description sont conditionnels. Un dépôt qui ne documente pas
 * son rôle ne se voit pas attribuer de capabilities inventées — le bloc disparaît, point.
 * Voir la règle de déduction en tête de `src/lib/brand/clients.ts`.
 */
export default function ClientWorkDetail({ project }: ClientWorkDetailProps) {
  const { t } = useTranslation('agency');

  return (
    <div className="mt-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h4 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            {project.name}
          </h4>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t(`work.categories.${categoryKey(project.category)}`)}
          </p>
        </div>
        <Badge variant="neutralOutline" className="shrink-0">{CLIENT_RELATION}</Badge>
      </div>

      {project.descriptionKey && (
        <p className="mb-6 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {t(`work.projects.${project.descriptionKey}.description`)}
        </p>
      )}

      {project.capabilities && project.capabilities.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 dark:text-neutral-500 mb-3">
            {t('work.roleLabel')}
          </p>
          <ul className="flex flex-wrap gap-2">
            {project.capabilities.map((cap) => (
              <li
                key={cap}
                className="rounded-full bg-lagoon-50 dark:bg-lagoon-900/30 px-3 py-1 text-sm text-lagoon-800 dark:text-lagoon-200"
              >
                {t(`work.capabilities.${cap}`)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {project.stack && project.stack.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 dark:text-neutral-500 mb-3">
            {t('work.stackLabel')}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {project.stack.join(' · ')}
          </p>
        </div>
      )}

      <a
        href={project.website}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-lagoon-700 dark:text-lagoon-400 hover:gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-lagoon-600 rounded"
      >
        {project.domain}
        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">— {t('work.visitLabel')}</span>
      </a>
    </div>
  );
}
