import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { categoryKey } from '../../lib/brand';
import { universeThemes } from '../../lib/sectionThemes';

const theme = universeThemes.agency;

interface WorkFiltersProps {
  /** Catégories réellement présentes dans le jeu de données. */
  categories: readonly string[];
  /** Catégorie active, ou `null` pour « Tous ». */
  active: string | null;
  onChange: (category: string | null) => void;
  /** Nombre de projets après filtrage — annoncé aux lecteurs d'écran. */
  resultCount: number;
}

/**
 * Barre de filtres par catégorie.
 *
 * ⚠️ Les cinq pages du site qui filtrent déjà (blog, formations, vidéos, podcasts, FAQ)
 * dupliquent leurs pilules à la main et n'exposent AUCUN état accessible : ni `aria-pressed`,
 * ni annonce du nombre de résultats — l'état actif n'y est signalé que par la couleur.
 *
 * Ce composant est donc volontairement générique : il n'a aucune dépendance à `/agence` hors
 * de sa palette, et devrait être repris par ces pages. Voir `docs/UX-AUDIT.md`.
 */
export default function WorkFilters({ categories, active, onChange, resultCount }: WorkFiltersProps) {
  const { t } = useTranslation('agency');

  // Une seule catégorie ne partitionne rien : la barre ne s'affiche pas.
  if (categories.length < 2) return null;

  const chip = (isActive: boolean) =>
    cn(
      'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
      'focus:outline-none',
      isActive
        ? theme.buttonSolid
        : 'bg-paper dark:bg-[color:var(--night-3)] border border-[color:var(--line)] text-ink-2 hover:border-[color:var(--fill-5)] dark:hover:border-[color:var(--border-hair)]',
    );

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2.5" role="group" aria-label={t('work.filterAria')}>
        <button type="button" onClick={() => onChange(null)} aria-pressed={active === null} className={chip(active === null)}>
          {t('work.filterAll')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            aria-pressed={active === cat}
            className={chip(active === cat)}
          >
            {t(`work.categories.${categoryKey(cat)}`)}
          </button>
        ))}
      </div>

      {/* Le comptage est annoncé : sans lui, un filtre est muet pour un lecteur d'écran. */}
      <p aria-live="polite" className="mt-3 text-sm text-ink-2">
        {t('work.resultCount', { count: resultCount })}
      </p>
    </div>
  );
}
