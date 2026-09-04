import type { CSSProperties, ReactNode } from 'react';

/**
 * LA BARRE D'ONGLETS BASSE — 80 px, et la seconde surface qui A PERDU SON VERRE (AD-26).
 *
 * Elle avait droit au flou pour une raison qui se vérifiait à l'œil : elle ne défile pas, et
 * le contenu passe RÉELLEMENT dessous. Cet argument justifiait le FLOU ; il n'a jamais rien
 * dit en faveur du VOILE. Or c'est le voile qui posait le problème — `--tabbar-bg` vaut
 * rgba(13,17,23,.72) en nuit, et sans flou une barre à 72 % laisse lire ce qui passe dessous.
 *
 * Le calcul est net : `backdrop-filter` force un recompositing PAR IMAGE de toute la pile
 * derrière la surface, et sur le profil d'appareil visé — 2 Go de mémoire, 4 cœurs, qui EST le
 * marché et non le cas limite — c'était le poste le plus coûteux du produit. Une barre opaque
 * ne compose rien du tout : elle est plus lisible ET moins chère.
 *
 * CE QUI DISPARAÎT AVEC LE VERRE. `mm-chrome` — l'accroche des trois replis de `fallback.css`
 * — n'a plus rien à raccrocher, puisqu'il n'y a plus de flou à retirer ni de voile à densifier.
 * `--tabbar-hl`, un liseré de lumière INTERNE, ne veut plus rien dire sur une couleur pleine :
 * il imitait la réfraction d'un bord de verre. Le fond en ligne passe sur `--menu-bg`, qui
 * bascule seul comme `--tabbar-bg` le faisait (AD-3 : jamais de prop de thème).
 *
 * LES LIENS SONT DE VRAIS LIENS. Le kit rendait des `<a>` SANS `href` : rien n'était
 * atteignable au clavier, rien n'était annoncé comme un lien, et l'onglet courant n'était
 * marqué que par une couleur — donc invisible pour qui ne la distingue pas. C'est le point
 * ouvert C du transfert, et le port React est le moment où il se corrige (AD-6).
 */

/* Le fond est écrit ICI, en ligne, et il doit l'être : un style en ligne bat la déclaration
   de `.mm-menu`, donc laisser `--tabbar-bg` aurait silencieusement rendu le voile à la barre.
   `--menu-bg` bascule seul sous `.dk`, comme `--tabbar-bg` le faisait — AD-3, jamais de prop
   de thème : un fond clair figé sous des glyphes #ECF0F5 donnerait 1,4:1. */
const BAR = {
  height: 'var(--tabbar-h)',
  display: 'flex',
  alignItems: 'flex-start',
  padding: '10px 8px 0',
  zIndex: 7,
  background: 'var(--menu-bg)',
  border: 0,
  borderTop: '1px solid var(--menu-brd)',
  borderRadius: 0,
  /* La barre est collée au bas de l'écran : son ombre porte VERS LE HAUT, sinon elle tombe
     hors de l'écran et la barre se colle au contenu. `--menu-sh` descend, d'où l'inversion. */
  boxShadow: '0 -6px 18px rgba(14, 17, 22, .07)',
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
    // AD-26 : `mm-menu` REMPLACE `glass mm-chrome`, elle ne s'y ajoute pas. Les trois replis
    // de `fallback.css` sont en `!important` : une surface qui garderait l'ancienne classe se
    // verrait réimposer son voile de verre, et en mode sombre un fond blanc à 90 %.
    <nav aria-label={label} className={['mm-menu', className].filter(Boolean).join(' ')} style={{ position: 'fixed', left: 0, right: 0, bottom: 0, ...BAR, ...style }}>
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
