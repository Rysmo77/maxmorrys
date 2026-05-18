import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Formation } from '../../types';
import { formatPrice } from '../../lib/utils';

interface CourseLibraryCardProps {
  formation: Formation;
  /** Position dans la pile — pilote le numéro 01/02/03 et la couleur d'onglet. */
  index: number;
}

/** Rotation de couleurs de marque pour les onglets « dossier ». */
const VARIANTS = [
  {
    tab: 'bg-brand-600',
    accent: 'text-brand-600 dark:text-brand-400',
    ring: 'group-hover:border-brand-500 group-hover:bg-brand-500/10',
  },
  {
    tab: 'bg-plum-600',
    accent: 'text-plum-600 dark:text-plum-400',
    ring: 'group-hover:border-plum-500 group-hover:bg-plum-500/10',
  },
  {
    tab: 'bg-coral-600',
    accent: 'text-coral-600 dark:text-coral-400',
    ring: 'group-hover:border-coral-500 group-hover:bg-coral-500/10',
  },
] as const;

const LEVEL_LABEL: Record<Formation['level'], string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

/**
 * Carte « dossier à onglet » du catalogue de formations — reprend la grammaire
 * visuelle de la JK Course Library : onglet coloré, numéro d'ordre, titre serif.
 */
export default function CourseLibraryCard({ formation, index }: CourseLibraryCardProps) {
  const v = VARIANTS[index % VARIANTS.length];
  const number = String(index + 1).padStart(2, '0');

  return (
    <Link to={`/formations/${formation.slug}`} className="group block">
      {/* Onglet du dossier */}
      <div className={`${v.tab} w-fit max-w-full rounded-t-2xl px-5 py-2.5`}>
        <span className="block text-white text-[10px] font-bold tracking-[0.25em] uppercase whitespace-nowrap">
          Le catalogue de formations
        </span>
      </div>

      {/* Corps du dossier */}
      <div className="bg-white dark:bg-neutral-900 rounded-b-3xl rounded-tr-3xl border border-neutral-200 dark:border-white/10 p-7 lg:p-10 transition-shadow duration-300 group-hover:shadow-soft">
        <div className="flex items-baseline gap-4 mb-3">
          <span className={`text-2xl font-black ${v.accent}`}>{number}</span>
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-500">
            {LEVEL_LABEL[formation.level]} · {formation.category}
          </span>
        </div>

        <h3 className="text-2xl lg:text-3xl font-black tracking-tight leading-[1.15] text-neutral-900 dark:text-white mb-4">
          {formation.title}
        </h3>

        <p className="text-sm lg:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-7 max-w-xl">
          {formation.description}
        </p>

        <div className="flex items-center justify-between gap-4">
          <div>
            {formation.promoPrice ? (
              <>
                <span className="text-xs text-neutral-400 line-through mr-2">
                  {formatPrice(formation.price)}
                </span>
                <span className={`text-xl font-black ${v.accent}`}>
                  {formatPrice(formation.promoPrice)}
                </span>
              </>
            ) : (
              <span className={`text-xl font-black ${v.accent}`}>
                {formatPrice(formation.price)}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-neutral-700 dark:text-neutral-300">
            Plus d'infos
            <span
              className={`w-9 h-9 rounded-full border border-neutral-300 dark:border-white/15 flex items-center justify-center transition-all ${v.ring}`}
            >
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
