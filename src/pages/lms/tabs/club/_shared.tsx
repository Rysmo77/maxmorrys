import type { CSSProperties, ReactNode } from 'react';
import { EmptyState, Icon, type IconName } from '@ds';

/**
 * LES DEUX PIÈCES QUE LES ONZE ONGLETS DU CLUB SE PARTAGENT.
 *
 * Elles portaient l'entrée de `@phosphor-icons/react` dans ce dépôt : leur prop `icon` avait
 * pour type le COMPOSANT d'icône de Phosphor, ce qui obligeait chacun des dix appelants à
 * importer cette seconde famille rien que pour lui passer un glyphe. Un type peut propager une
 * dépendance aussi sûrement qu'un import, et c'est ce qui s'était passé ici.
 *
 * La prop prend désormais un NOM de glyphe (`IconName`), une chaîne. Le jeu unique du système
 * est le seul chemin, et il n'y a plus rien à importer pour appeler ces deux composants.
 */

/** L'état vide du Club — le glyphe du système sur la pastille plum, puis l'action. */
export function ClubEmptyState({
  icon, title, subtitle, action,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <EmptyState
      glyph={<Icon name={icon} size={26} color="var(--mm-violet)" />}
      glyphBackground="color-mix(in srgb, var(--mm-violet) 10%, transparent)"
      title={title}
      body={subtitle}
      action={action ? <div className="flex justify-center">{action}</div> : undefined}
    />
  );
}

/** En-tête de section : glyphe plum + titre, action facultative à droite. */
export function ClubSectionHeader({
  icon, title, action,
}: {
  icon: IconName;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-transforme" aria-hidden="true"><Icon name={icon} size={19} /></span>
        <h3 className="font-bold text-ink">{title}</h3>
      </div>
      {action}
    </div>
  );
}

/**
 * LA CARTE DU CLUB — kit v3 : une tuile bento OPAQUE (blanche en clair, `#121821` sous `.dk`),
 * filet et ombre douce. Elle remplace le faux verre (`GlassPanel level="flat"`) des onglets :
 * « tout ce qui défile est opaque », et le seul flou de l'écran reste le chrome fixe.
 */
export function ClubCard({
  children, padding = 18, className = '', style, as: Tag = 'section', ...aria
}: {
  children?: ReactNode;
  padding?: number | string;
  className?: string;
  style?: CSSProperties;
  as?: 'section' | 'div' | 'article' | 'li' | 'ul' | 'ol';
  'aria-label'?: string;
  'aria-labelledby'?: string;
}) {
  return (
    <Tag
      {...aria}
      className={`rounded-card border border-[color:var(--line)] bg-bento shadow-v3-soft ${className}`}
      style={{ padding: typeof padding === 'number' ? `${padding}px` : padding, ...style }}
    >
      {children}
    </Tag>
  );
}
