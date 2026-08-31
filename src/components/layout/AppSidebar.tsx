import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import LocalizedLink from '../shared/LocalizedLink';
import { Wordmark, type WordmarkProps } from '../../design-system';
import { Icon, type IconName } from '@ds';

/**
 * LA NAVIGATION LATÉRALE DE L'APPLICATION — 250 px, à partir de 700 px de large.
 *
 * ELLE N'A PAS DE FLOU, ET C'EST DÉLIBÉRÉ. Une colonne latérale n'est pas du chrome fixe :
 * dès qu'elle est plus haute que la fenêtre, elle défile — et `backdrop-filter` sur un
 * conteneur défilant force un recompositing PAR IMAGE de toute la pile derrière lui. C'est
 * `.glass-flat` : voile à 78 %, aucun flou, gratuit à faire défiler. La différence visuelle
 * sur un maillage est presque nulle.
 *
 * ELLE PORTE LE MOT-SYMBOLE, PLUS LE PNG. `logo-mm-icon.png` pèse 273 Ko en 1254 × 1254 pour
 * un rendu à 32 px, soit 30 % du budget de page. `Wordmark` rend la même marque en type pur
 * pour 0 octet — « Rysmo » dans l'espace apprenant, la signature dans la console.
 *
 * PLUS DE VARIANTE `dark:` DE COULEUR. `--nav-on-bg`, `--nav-brd`, `--fill-*` et `--text-muted`
 * basculent seuls sous `.dk` : en clair ce sont des teintes d'encre, en sombre des teintes de
 * lumière. Une valeur figée sous un glyphe #ECF0F5 donnait 1,4:1, dans douze écrans à la fois.
 *
 * PLUS D'EMOJI. Le cadenas de l'entrée verrouillée était un 🔒 : il se rend différemment sur
 * chaque plateforme, il n'a pas de trait, et il n'est annoncé par rien. C'est un glyphe.
 *
 * Ce n'est PAS la primitive `SideNav` : celle-ci rend une liste plate de territoires. La
 * console en a dix-neuf, réparties en cinq sections, avec des pastilles, des verrous et un
 * état replié. Le dessin — 250 px, `--nav-on-bg` sur l'entrée courante, `--ink-2` au repos —
 * est celui de la primitive ; la structure est celle du produit.
 */
export interface AppSidebarItem {
  to: string;
  label: string;
  /*
   * UN NOM DE GLYPHE, PAS UN COMPOSANT. L'entrée portait un `LucideIcon` — donc une SECONDE
   * famille d'icônes, importée écran par écran, avec son propre trait et sa propre boîte.
   * En portant le nom, elle passe forcément par `Icon`, qui impose la boîte de 24, les caps
   * rondes et la discipline de trait du système. C'est le type qui ferme la porte.
   */
  icon: IconName;
  end?: boolean;
  badge?: string | number | null;
  locked?: boolean;
  tone?: 'default' | 'club';
}

export interface AppSidebarSection {
  title?: string;
  items: AppSidebarItem[];
}

interface AppSidebarProps {
  sections: AppSidebarSection[];
  brand: { label: string; href: string };
  /** Le mot-symbole de la surface — `rysmo` pour l'application, `signature` pour la console. */
  wordmark?: WordmarkProps['brand'];
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onItemClick?: () => void;
  onOpenCommandPalette?: () => void;
  footer?: React.ReactNode;
  showCollapseButton?: boolean;
}

export default function AppSidebar({
  sections, brand, wordmark = 'rysmo', collapsed, onToggleCollapsed, onItemClick,
  onOpenCommandPalette, footer, showCollapseButton = true,
}: AppSidebarProps) {
  const { t } = useTranslation('lms');
  const localize = useLocalizedPath();

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 px-3 flex items-center justify-between border-b border-[color:var(--nav-brd)]">
        <LocalizedLink to={brand.href} className="flex items-center gap-2 min-w-0">
          <Wordmark brand={wordmark} size={collapsed ? 17 : 20} short={collapsed} />
          {!collapsed && (
            <span className="mm-eyebrow truncate">{brand.label}</span>
          )}
        </LocalizedLink>
        {showCollapseButton && onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="mm-touch-extend hidden wide:flex p-1.5 rounded-s text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
            aria-label={collapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar')}
          >
            {collapsed
              ? <Icon name="chevron-right" size={16} strokeWidth={2.4} />
              : <Icon name="chevron-left" size={16} strokeWidth={2.4} />}
          </button>
        )}
      </div>

      {onOpenCommandPalette && (
        <div className="px-2 pt-3">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className={cn(
              'w-full flex items-center gap-2 rounded-m border border-[color:var(--line)] bg-[color:var(--ctl-off-bg)] px-2.5 py-2 text-meta text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui',
              collapsed && 'justify-center',
            )}
            title={t('shell.openCommandPalette')}
          >
            <Icon name="command" size={16} className="flex-shrink-0" strokeWidth={2.2} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{t('shell.searchAndActions')}</span>
                <kbd className="text-small font-bold tracking-wider text-ink-2 border border-[color:var(--line)] rounded-s px-1 py-0.5">⌘K</kbd>
              </>
            )}
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && !collapsed && (
              <p className="mm-eyebrow px-3 pb-1">{section.title}</p>
            )}
            <ul className="space-y-0.5 list-none m-0 p-0">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={localize(item.to)}
                    end={item.end}
                    onClick={onItemClick}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        // 14 px de rayon : la valeur du kit. Elle n'est sur aucun échelon de
                        // radius.css et ne s'arrondit pas pour autant — si le kit dit 14,
                        // c'est 14 (AD-1).
                        'mm-touch-extend flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-meta font-medium transition-colors duration-ui',
                        collapsed && 'justify-center',
                        // UNE SEULE classe de couleur par état. `cn()` n'a pas de fusion
                        // Tailwind dans ce dépôt : deux classes `text-*` sur le même élément
                        // se départagent par l'ordre de la FEUILLE, pas par celui de l'appel —
                        // et l'ordre de la feuille n'est écrit nulle part.
                        // AD-18 : au repos, `--ink-2`. Jamais l'encre tertiaire.
                        isActive
                          ? 'text-ink bg-[color:var(--nav-on-bg)] shadow-[var(--nav-on-sh)]'
                          : item.tone === 'club'
                            ? 'text-transforme hover:bg-[color:var(--fill-1)]'
                            : 'text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)]',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* La pastille redit la couleur du territoire que le libellé dit
                            déjà : rien n'y est porté seul, donc rien à annoncer. */}
                        {!collapsed && item.tone === 'club' && (
                          <span
                            aria-hidden="true"
                            className="w-2 h-2 rounded-s shrink-0 bg-[color:var(--mm-violet)]"
                          />
                        )}
                        <Icon
                          name={item.icon}
                          size={16}
                          className={cn('flex-shrink-0', isActive && 'text-forme')}
                          strokeWidth={2.2}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {item.badge != null && (
                              <span className="text-small font-bold bg-[color:var(--fill-tag)] text-ink-2 px-1.5 py-0.5 rounded-pill">
                                {item.badge}
                              </span>
                            )}
                            {item.locked && (
                              // Le verrou est un ÉTAT, pas une décoration : il se dit. Le
                              // glyphe est masqué et le mot vit à côté, pour les lecteurs
                              // d'écran seuls. `--ink-3` ne porte pas de texte (AD-18) — ici
                              // il ne porte qu'un filet, ce à quoi il est explicitement réservé.
                              <span className="shrink-0 inline-flex items-center">
                                <Icon name="lock" size={14} className="text-ink-3" strokeWidth={2.4} />
                                <span className="sr-only">{t('shell.locked')}</span>
                              </span>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {footer && (
        <div className="p-2 border-t border-[color:var(--nav-brd)]">{footer}</div>
      )}
    </div>
  );
}
