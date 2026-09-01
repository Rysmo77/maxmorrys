import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import WorkFilters from './WorkFilters';
import ClientWorkDetail from './ClientWorkDetail';
import SitePreview from './SitePreview';
import { clientProjects, clientCategories, categoryKey } from '../../lib/brand';
import { staggerContainer, staggerItem } from '../../lib/animations';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { Icon } from '@ds';

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
   * ⚠️ Rendu conditionnel en JS, pas en CSS. Un `wide:hidden` monterait quand même le panneau
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

      <div className="mt-10 grid gap-10 wide:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] wide:gap-14">
        {/* ── Index ─────────────────────────────────────────────────────────── */}
        <motion.ul
          // `key` composite : rejoue le stagger à chaque changement de filtre.
          key={activeCategory ?? 'all'}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          aria-label={t('work.listAria')}
          /*
            `min-w-0` N'EST PAS DÉCORATIF ICI.

            Sous `wide`, la grille retombe à une colonne — et un élément de grille garde
            `min-width: auto`, donc il refuse de descendre sous la largeur minimale de son
            contenu. Le détail replié sous la ligne sélectionnée (l'aperçu du site et sa
            fiche) en réclame plus que l'écran : la liste s'élargissait à 491 px dans une
            fenêtre de 375, et toute la page défilait latéralement — mesuré à 509 px de
            largeur de document. Les pistes `minmax(0, …)` déclarées plus haut règlent le
            même problème au-dessus de 1080 px ; en dessous, il n'y a plus de piste, donc
            plus de `minmax`, et il faut le dire sur l'élément.
          */
          className="min-w-0 divide-y divide-[color:var(--fill-3)] dark:divide-[color:var(--line)] border-y border-[color:var(--line)]"
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
                    'focus:outline-none rounded',
                    isSelected
                      ? 'text-ink'
                      : 'text-ink-2 hover:text-ink dark:hover:text-white',
                  )}
                >
                  <span className="text-xs font-bold tabular-nums text-digitalise-txt shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-lg font-black tracking-tight truncate">{project.name}</span>
                    <span className="block text-sm text-ink-2">
                      {t(`work.categories.${categoryKey(project.category)}`)}
                    </span>
                  </span>
                  {/* Chevron : sur mobile il signale l'accordéon, sur desktop la sélection. */}
                  <Icon name="chevron" className={cn(
                      'w-4 h-4 shrink-0 transition-transform wide:hidden',
                      isSelected && 'rotate-180',
                    )} />
                  <span
                    className={cn(
                      'hidden wide:block w-6 h-px transition shrink-0',
                      isSelected ? 'bg-digitalise w-10' : 'bg-[color:var(--fill-4)] group-hover:w-10',
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
          <div className="min-w-0">
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
