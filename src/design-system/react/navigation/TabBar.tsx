import type { CSSProperties, ReactNode } from 'react';

/**
 * LA BARRE D'ONGLETS BASSE — 80 px, et l'UNE DES DEUX SEULES SURFACES FLOUTÉES DU PRODUIT.
 *
 * Elle y a droit pour une raison qui se vérifie à l'œil : elle ne défile pas, et le contenu
 * passe RÉELLEMENT dessous. C'est le seul endroit, avec la barre haute, où le flou porte du
 * sens plutôt que du décor. Partout ailleurs c'est du faux verre (`.glass-flat`), qui est
 * gratuit à faire défiler — `backdrop-filter` sur un conteneur défilant force un
 * recompositing PAR IMAGE de toute la pile derrière lui, et sur le profil d'appareil visé —
 * 2 Go de mémoire, 4 cœurs, qui EST le marché et non le cas limite — c'est le poste le plus
 * coûteux du produit.
 *
 * LE FLOU N'EST PAS ÉCRIT ICI, et la raison n'est PAS celle qu'on croit.
 *
 * Le kit pose bien un `backdropFilter` en style inline — mais il pose aussi `mm-chrome`, avec
 * ce commentaire : « la classe d'accroche des replis. Sans elle, le flou en ligne échappe à
 * `.lowfi`, à `prefers-reduced-transparency` et à `@supports not` ». Le kit avait donc déjà
 * traité la question, et il avait raison de le faire ainsi : un `!important` d'une feuille
 * d'auteur BAT un style en ligne non-important. Les replis atteignaient la barre.
 *
 * Le flou vient quand même de `.glass` ici, pour une raison plus simple : AD-4 veut qu'il
 * n'existe qu'à UN endroit du dépôt, pour que « combien de surfaces sont floutées » soit une
 * question à laquelle un grep répond. Un flou en ligne est correct et invérifiable ; c'est
 * l'invérifiable qui coûte, pas le flou. `mm-chrome` reste posée : c'est toujours par elle
 * que les trois replis attrapent le chrome.
 *
 * LES LIENS SONT DE VRAIS LIENS. Le kit rendait des `<a>` SANS `href` : rien n'était
 * atteignable au clavier, rien n'était annoncé comme un lien, et l'onglet courant n'était
 * marqué que par une couleur — donc invisible pour qui ne la distingue pas. C'est le point
 * ouvert C du transfert, et le port React est le moment où il se corrige (AD-6).
 */

/* Le chrome garde le flou de 26 px que le kit lui donnait, sans écrire un second
   `backdrop-filter` : on repointe la variable que `.glass` consomme déjà. `--glass-blur`
   vaut 24 px partout ailleurs ; le chrome, lui, est déclaré à 26 px dans tokens/glass.css. */
const BAR = {
  height: 'var(--tabbar-h)',
  display: 'flex',
  alignItems: 'flex-start',
  padding: '10px 8px 0',
  zIndex: 7,
  /* Aucune prop de thème : `--tabbar-bg` passe seul de 62 % de blanc à rgba(13,17,23,.72)
     sous `.dk`. Un fond clair figé sous des glyphes #ECF0F5 donnerait 1,4:1 — AD-3. */
  background: 'var(--tabbar-bg)',
  border: 0,
  borderTop: '1px solid var(--tabbar-brd)',
  borderRadius: 0,
  boxShadow: 'var(--tabbar-hl)',
  '--glass-blur': 'var(--glass-blur-chrome)',
} as CSSProperties;

const TAB: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3px',
  /* 48 px de haut sur 80 px de barre : la cible dépasse déjà le plancher de 44 px
     (`--touch-aa`), donc pas de `mm-touch-extend` ici — il n'y a rien à étendre. */
  minHeight: '48px',
  fontFamily: 'var(--f-body)',
  fontSize: '10px',
  fontWeight: 600,
  textDecoration: 'none',
};

export interface TabBarItem {
  /** Le libellé visible. Il EST le nom accessible : aucun onglet n'est un glyphe muet. */
  label: string;
  /** La destination. Un onglet est une adresse : il se copie, s'ouvre dans un onglet, se partage. */
  href: string;
  /** Glyphe à 21 px — passer `<Icon size={21} />`. Décoratif : le libellé dit déjà tout. */
  icon?: ReactNode;
}

export interface TabBarProps {
  items: TabBarItem[];
  /** Libellé de l'onglet courant. Il devient `aria-current="page"`, pas seulement une couleur. */
  active?: string;
  /**
   * Nom du point de repère. Obligatoire, et pas par excès de zèle : l'espace apprenant porte
   * jusqu'à quatre `<nav>` sur le même écran, et quatre repères anonymes obligent à tous les
   * ouvrir pour savoir lequel est lequel. Il se traduit — la chaîne vient de la surface.
   */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function TabBar({ items, active, label, className = '', style }: TabBarProps) {
  return (
    // `glass` et `fixed` sur la même ligne : c'est la forme que ds:check sait vérifier, et
    // c'est aussi la condition réelle du droit au flou — une surface qui ne défile pas.
    <nav aria-label={label} className={['glass mm-chrome', className].filter(Boolean).join(' ')} style={{ position: 'fixed', left: 0, right: 0, bottom: 0, ...BAR, ...style }}>
      {items.map((it) => {
        const on = it.label === active;
        return (
          <a
            key={it.label}
            href={it.href}
            aria-current={on ? 'page' : undefined}
            // AD-18 : un onglet au repos va sur `--ink-2`, jamais sur l'encre tertiaire —
            // elle fait 2,61:1 sur blanc pur, et aucun voile ne la sauve.
            style={{ ...TAB, color: on ? 'var(--text-body)' : 'var(--text-muted)' }}
          >
            {it.icon && (
              <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: '21px', height: '21px' }}>
                {it.icon}
              </span>
            )}
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
