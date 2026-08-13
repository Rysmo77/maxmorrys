import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import WorkFilters from './WorkFilters';
import ClientWorkDetail from './ClientWorkDetail';
import SitePreview from './SitePreview';
import { clientProjects, clientCategories, categoryKey } from '../../lib/brand';
import { staggerContainer, staggerItem } from '../../lib/animations';
import { useIsDesktop } from '../../hooks/useMediaQuery';

/**
 * Index des projets clients : liste numérotée à gauche, aperçu ancré à droite.
 *
 * Pourquoi pas une grille — deux raisons, l'une de design, l'autre technique :
 *  1. à douze projets, une grille de cartes hautes devient illisible et interminable ;
 *  2. les aperçus sont des captures externes générées à la volée. Une grille en déclenchait
 *     douze en parallèle ; l'index n'en monte **qu'une seule à la fois**.
 *
 * Sous `lg`, la colonne de droite n'existe pas : chaque ligne devient un accordéon dont le
 * détail s'ouvre en dessous. Aucun panneau flottant sur mobile.
 */
export default function ClientWorkIndex() {
  const { t } = useTranslation('agency');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  /*
   * ⚠️ Rendu conditionnel en JS, pas en CSS. Un `lg:hidden` monterait quand même le panneau
   * mobile ET le panneau desktop : deux `SitePreview` pour un seul projet, donc deux captures
   * externes téléchargées au lieu d'une. `display: none` cache, il n'empêche pas de charger.
   */
  const isDesktop = useIsDesktop();

  const filtered = useMemo(
    () => (activeCategory ? clientProjects.filter((p) => p.category === activeCategory) : clientProjects),
    [activeCategory],
  );

  const [selectedSlug, setSelectedSlug] = useState(clientProjects[0].slug);

  // Le projet sélectionné peut sortir du filtre : on retombe sur le premier visible.
  useEffect(() => {
    if (!filtered.some((p) => p.slug === selectedSlug)) {
      setSelectedSlug(filtered[0]?.slug ?? '');
    }
  }, [filtered, selectedSlug]);

  const selected = filtered.find((p) => p.slug === selectedSlug) ?? filtered[0];

  return (
    <div className="mt-8">
      <WorkFilters
        categories={clientCategories}
        active={activeCategory}
        onChange={setActiveCategory}
        resultCount={filtered.length}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        {/* ── Index ─────────────────────────────────────────────────────────── */}
        <motion.ul
          // `key` composite : rejoue le stagger à chaque changement de filtre.
          key={activeCategory ?? 'all'}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          aria-label={t('work.listAria')}
          className="divide-y divide-neutral-200 dark:divide-neutral-800 border-y border-neutral-200 dark:border-neutral-800"
        >
          {filtered.map((project, index) => {
            const isSelected = project.slug === selected?.slug;
            return (
              <motion.li key={project.slug} variants={staggerItem}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(project.slug)}
                  onMouseEnter={() => setSelectedSlug(project.slug)}
                  onFocus={() => setSelectedSlug(project.slug)}
                  aria-current={isSelected ? 'true' : undefined}
                  aria-expanded={isSelected}
                  className={cn(
                    'w-full flex items-center gap-4 py-4 text-left transition-colors group',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-lagoon-600 focus-visible:ring-inset rounded',
                    isSelected
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
                  )}
                >
                  <span className="text-xs font-bold tabular-nums text-lagoon-700 dark:text-lagoon-400 shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-lg font-black tracking-tight truncate">{project.name}</span>
                    <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                      {t(`work.categories.${categoryKey(project.category)}`)}
                    </span>
                  </span>
                  {/* Chevron : sur mobile il signale l'accordéon, sur desktop la sélection. */}
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform lg:hidden',
                      isSelected && 'rotate-180',
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      'hidden lg:block w-6 h-px transition-all shrink-0',
                      isSelected ? 'bg-lagoon-600 w-10' : 'bg-neutral-300 dark:bg-neutral-700 group-hover:w-10',
                    )}
                    aria-hidden="true"
                  />
                </button>

                {/* Détail replié sous la ligne — mobile uniquement. */}
                {isSelected && selected && !isDesktop && (
                  <div className="pb-8">
                    <SitePreview key={selected.slug} url={selected.website} domain={selected.domain} name={selected.name} />
                    <ClientWorkDetail project={selected} />
                  </div>
                )}
              </motion.li>
            );
          })}
        </motion.ul>

        {/* ── Aperçu ancré — desktop uniquement ─────────────────────────────── */}
        {selected && isDesktop && (
          <div>
            <div className="sticky top-[calc(var(--header-h)+2rem)]">
              {/*
                `key={slug}` force le remontage : sans lui, `SitePreview` garderait ses états
                `loaded`/`failed` et afficherait l'aperçu précédent pendant le chargement.
              */}
              <SitePreview key={selected.slug} url={selected.website} domain={selected.domain} name={selected.name} />
              <ClientWorkDetail project={selected} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
