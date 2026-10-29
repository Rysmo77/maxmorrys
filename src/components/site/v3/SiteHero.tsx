import type { ReactNode } from 'react';
import { PageSite } from '../PageSite';
import { SiteDisplay, SiteEyebrow } from '../SiteType';

/**
 * LE HÉROS DU SITE, kit v3 (maquettes `Site-*` et `Main`, refonte du 29/10/2026).
 *
 * Une dalle de nuit à maillage lent, un titre géant, un chapô, une ou deux actions et, à
 * droite, ce que la page a de concret (un portrait, un encart, une recherche). Toutes les
 * pages du site public et du hub ouvrent sur ce même dessin : c'est ce qui les fait lire
 * comme un seul site.
 *
 * ── CE QUI EST GARDÉ DU DÉPÔT, ET POURQUOI ─────────────────────────────────────────
 * • Le titre reste `SiteDisplay` : la taille fluide (display-fit), les coupures écrites et
 *   les CROCHETS PORTEURS des titres i18n. Le fragment entre crochets prend ici l'orange du
 *   surlignage — la maquette colore son dernier mot, le dépôt sait déjà lequel.
 * • Le sombre est une PORTÉE `.dk` sur la dalle, jamais une prop (AD-3) : tout ce qui est
 *   posé dedans (sourcil, panneaux, boutons, sous-navigation) lit les jetons de nuit.
 * • La dalle est encartée sous la barre haute au lieu de passer dessous : la barre est la
 *   primitive partagée du lot 0, et elle garde sa géométrie (`--header-h`).
 * • Aucun flou : le maillage est opaque, le seul flou du site reste le chrome fixe.
 */
export type SiteHeroMesh = 'hub' | 'club' | 'edu' | 'nuit' | 'digitalise';

export interface SiteHeroProps {
  /** Le sourcil, au-dessus du titre. */
  eyebrow?: ReactNode;
  /** Une classe de COULEUR pour le sourcil (ex. `text-corail-txt` sur la piste Conception). */
  eyebrowClassName?: string;
  /** Les lignes du titre, crochets compris — passées telles quelles à `SiteDisplay`. */
  titleLines: string[];
  /** Taille de référence du titre (px à 1080 et plus) ; le plancher mobile en découle. */
  size?: number;
  /** Titre venu des DONNÉES (nom de projet, titre d'article) : il se replie. AD-13 ne
      protège que les coupures ÉCRITES. */
  wrap?: boolean;
  /** `h1` par défaut ; une page dont le h1 vit ailleurs passe `h2`. */
  as?: 'h1' | 'h2';
  lede?: ReactNode;
  /** Les actions, sous le chapô. */
  actions?: ReactNode;
  /** Ce qui suit les actions dans la colonne de texte (encart de vérité, recherche…). */
  children?: ReactNode;
  /** La colonne de droite (portrait, panneau). Absente : le texte prend la largeur. */
  aside?: ReactNode;
  /** Au-dessus de tout, dans la dalle : la sous-navigation de piste. */
  top?: ReactNode;
  mesh?: SiteHeroMesh;
  /** Gabarit de la colonne de droite : moitié, portrait fixe (380 px) ou panneau étroit. */
  asideCols?: 'half' | 'portrait' | 'panel';
  id?: string;
}

/* Écrits en toutes lettres : Tailwind ne génère que les classes qu'il lit dans le source. */
const COLS = {
  half: 'wide:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]',
  portrait: 'wide:grid-cols-[minmax(0,1fr)_380px]',
  panel: 'wide:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]',
} as const;

export function SiteHero({
  eyebrow,
  eyebrowClassName,
  titleLines,
  size = 56,
  wrap = false,
  as = 'h1',
  lede,
  actions,
  children,
  aside,
  top,
  mesh = 'hub',
  asideCols = 'half',
  id,
}: SiteHeroProps) {
  return (
    <div className="stack:px-4" id={id}>
      <section className="dk relative isolate overflow-hidden rounded-b-xl bg-night stack:rounded-xl text-ink [&_.mm-arc]:text-highlight">
        <div aria-hidden="true" className={`mm-mesh m-${mesh} is-wide`}>
          <b />
          <b />
          <b />
        </div>
        <PageSite style={{ paddingBottom: 'clamp(36px, 6vw, 64px)' }}>
          {top}
          <div
            className={[
              'grid items-center gap-9',
              aside ? COLS[asideCols] : '',
              top ? 'mt-[22px]' : 'mt-2',
            ].join(' ')}
          >
            <div className="min-w-0">
              {eyebrow ? <SiteEyebrow className={eyebrowClassName}>{eyebrow}</SiteEyebrow> : null}
              <SiteDisplay
                arc={!wrap}
                wrap={wrap}
                as={as}
                lines={titleLines}
                size={size}
                from={1}
                style={{ marginTop: '12px', ...(wrap ? { maxWidth: '20ch' } : null) }}
              />
              {lede ? (
                <p
                  className="rv mt-5 mb-0 max-w-[52ch] text-lede leading-[1.5] text-ink-2"
                  style={{ ['--i' as string]: 5 }}
                >
                  {lede}
                </p>
              ) : null}
              {actions ? (
                <div className="rv mt-7 flex flex-wrap items-center gap-3" style={{ ['--i' as string]: 6 }}>
                  {actions}
                </div>
              ) : null}
              {children}
            </div>
            {aside ? <div className="min-w-0">{aside}</div> : null}
          </div>
        </PageSite>
      </section>
    </div>
  );
}
