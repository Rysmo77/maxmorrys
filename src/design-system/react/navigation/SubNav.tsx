import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Territory } from '../types';
import { TERRITORY_INK } from '../types';

/**
 * LA SOUS-NAVIGATION D'UN TERRITOIRE — en tête de page, et elle existe pour une raison
 * commerciale précise.
 *
 * « Je te transforme » abrite du contenu GRATUIT ET OUVERT (podcast, vidéos) et du contenu
 * PAYANT ET FERMÉ (le Club). Sans cette séparation visible, un visiteur croit le podcast
 * derrière le mur et ne clique pas — et le haut de l'entonnoir perd sa fonction. L'ordre
 * n'est donc pas négociable : le gratuit d'abord, le Club ensuite.
 *
 * PLUS DE VERRE DU TOUT (AD-26). Elle n'a jamais eu de flou — elle défile avec la page — mais
 * ses puces étaient deux voiles de blanc, `--surface-card` (62 %) pour l'active et
 * `--ctl-off-bg` (55 %) pour les autres. Sur un maillage, deux voiles proches se distinguent
 * mal, et en nuit ils tombent à 7,5 % et 8 % : l'écart entre l'étage courant et les autres
 * devenait un jeu de contraste sur ce qu'il y avait DERRIÈRE. Les deux puces sont désormais
 * des couleurs pleines, `--menu-on-bg` et `--menu-off-bg`, dont l'écart ne dépend plus du fond.
 *
 * DE VRAIS LIENS. Le kit rendait des `<a>` sans `href` et un `onSelect` : deux étages d'un
 * même territoire sont deux ADRESSES, pas deux états d'un composant — elles se partagent,
 * s'indexent, et se rouvrent. C'est le point ouvert C du transfert (AD-6).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * ELLE N'AVAIT JAMAIS PORTÉ QUE DEUX PUCES.  (mesuré le 18/09/2026)
 *
 * La refonte en deux pistes l'emmène à TROIS (`/conception*`) et QUATRE (`/apprendre` et les
 * quatre territoires). Relevé au navigateur, métriques d'appareil émulées, `document.fonts.ready`
 * attendu — la rangée DEMANDE 375 px à trois puces et 440 px à quatre, dans un contenant qui
 * en OFFRE 284 à 320 px de large et 354 à 390 px :
 *
 *     /apprendre       390 px →  440 demandés dans 354 offerts  →  fenêtre gonflée à 458 px
 *     /conception      390 px →  375 demandés dans 354 offerts  →  fenêtre gonflée à 393 px
 *     /podcast-et-videos (2 puces, témoin)  →  tient à toutes les largeurs
 *
 * Le symptôme n'était PAS une barre de défilement : sans mécanisme de débordement, le
 * navigateur élargit la fenêtre visuelle pour absorber le dépassement, et c'est la PAGE
 * ENTIÈRE qui se dézoome. Sur un téléphone de 390 px, `/apprendre` s'affichait à 458 —
 * tout le contenu 15 % plus petit que dessiné, sur toutes les pages des deux pistes.
 *
 * Le remède est celui de `ChipRow`, qui l'avait déjà rencontré sur `/en/faq` : les trois
 * lignes de contrainte de largeur sur la rangée, `flex: 0 0 auto` sur chaque puce, et
 * `nowrap` sur le libellé. UN SEUL mécanisme — pas de `flex-wrap` en plus : le repli
 * pousserait le héros d'une cinquantaine de pixels sur huit pages et deux langues.
 * ─────────────────────────────────────────────────────────────────────────────────────────
 */

const ITEM: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '9px',
  /*
   * MESURÉ LE 18/09/2026, ET C'EST CETTE LIGNE QUI MANQUAIT LE PLUS.
   *
   * Sans `nowrap`, un libellé se replie dans une puce dont la hauteur est FIXÉE à 42 px :
   * le texte sort de sa pilule au lieu de la faire grandir. Et comme le `<li>` était
   * rétrécissable, la rangée n'a jamais débordé — elle a COMPRIMÉ ses puces jusqu'à ce
   * que le texte casse. À 320 px, les deux puces du pôle média passaient de 354 à 284 px
   * de large sans qu'aucune mesure de débordement ne s'en aperçoive.
   */
  whiteSpace: 'nowrap',
  /* 42 px de dessin, 44 px de cible par `.mm-touch-extend` : l'écart de 2 px du kit est
     assumé dans les maquettes et ne se reproduit pas en production. */
  height: '42px',
  padding: '0 16px',
  borderRadius: 'var(--r-pill)',
  fontFamily: 'var(--f-body)',
  fontSize: '13.5px',
  fontWeight: 600,
  textDecoration: 'none',
};

const DOT: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '3px',
  display: 'block',
  flex: '0 0 auto',
};

export interface SubNavItem {
  label: string;
  href: string;
  /** Pastille à l'encre du territoire ; sans territoire, pastille grise (`--fill-5`). */
  territory?: Territory;
}

export interface SubNavProps {
  items: SubNavItem[];
  /** Libellé de l'entrée courante. Sans valeur, c'est la première — le gratuit. */
  active?: string;
  /**
   * Ce que l'entrée allumée EST par rapport à l'adresse affichée.
   *
   * `page` — cette adresse exactement. `section` — on est SOUS elle : une fiche d'épisode,
   * de vidéo ou de réalisation. La distinction n'est pas cosmétique : `aria-current="page"`
   * sur une fiche annonce au lecteur d'écran qu'il est sur l'index alors qu'il ne l'est pas.
   * `'true'` est la valeur HTML pour « élément courant d'un ensemble » sans être la page.
   */
  activeKind?: 'page' | 'section';
  /** Nom du point de repère. Il se traduit : la chaîne vient de la surface. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function SubNav({ items, active, activeKind = 'page', label, className = '', style }: SubNavProps) {
  const rangee = useRef<HTMLUListElement>(null);

  /*
   * AMENER L'ÉTAGE COURANT DANS LE CHAMP — ce qu'un filtre n'exige pas, mais une navigation si.
   *
   * Une barre de repérage qui cache l'entrée où l'on se trouve ne repère plus rien. Sur
   * `/club-des-digitos` à 360 px, la quatrième puce est hors champ à l'arrivée.
   *
   * ⚠️ Par arithmétique sur `scrollLeft`, JAMAIS par `scrollIntoView()` : ce dernier fait
   * défiler tous les ancêtres défilables, donc la page elle-même — on ouvrirait la page à
   * quelques centaines de pixels du haut, sans que rien ne l'explique au lecteur.
   */
  useEffect(() => {
    const ul = rangee.current;
    if (!ul) return;
    const puce = ul.querySelector<HTMLElement>('[aria-current]');
    if (!puce) return;
    const debord = puce.offsetLeft + puce.offsetWidth - (ul.scrollLeft + ul.clientWidth);
    if (debord > 0) ul.scrollLeft += debord + 18;
    else if (puce.offsetLeft < ul.scrollLeft) ul.scrollLeft = Math.max(0, puce.offsetLeft - 18);
  }, [active, items]);

  return (
    <nav aria-label={label} className={className || undefined} style={style}>
      <ul
        ref={rangee}
        style={{
          display: 'flex',
          gap: '8px',
          listStyle: 'none',
          margin: 0,
          padding: '2px 0',
          /* Les trois lignes que `ChipRow` documente : `overflow-x` seul ne promet rien,
             un élément de flex ou de grille garde `min-width: auto` et s'élargit à son
             contenu au lieu de déborder de lui-même. */
          overflowX: 'auto',
          minWidth: 0,
          maxWidth: '100%',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((it, i) => {
          const on = active === undefined ? i === 0 : active === it.label;
          return (
            <li key={it.label} style={{ display: 'flex', flex: '0 0 auto' }}>
              <a
                href={it.href}
                aria-current={on ? (activeKind === 'section' ? 'true' : 'page') : undefined}
                className="mm-press-sm mm-touch-extend"
                style={{
                  ...ITEM,
                  background: on ? 'var(--menu-on-bg)' : 'var(--menu-off-bg)',
                  border: '1px solid var(--menu-brd)',
                  // AD-18 : l'étage au repos reste sur `--ink-2`, jamais sur l'encre tertiaire.
                  color: on ? 'var(--text-body)' : 'var(--text-muted)',
                  // `--glass-hl` était un liseré de lumière INTERNE : il imitait la réfraction
                  // d'un bord de verre, et sur une couleur pleine il ne dit plus rien.
                  boxShadow: on ? '0 4px 14px rgba(14,17,22,.07)' : 'none',
                }}
              >
                <span aria-hidden="true" style={{ ...DOT, background: it.territory ? TERRITORY_INK[it.territory] : 'var(--fill-5)' }} />
                {it.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
