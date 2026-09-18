import type { CSSProperties, ReactNode } from 'react';

export type CheckLineTone = 'violet' | 'ok' | 'neutre' | 'alerte';

/**
 * Ce qui est dû, listé un engagement par ligne. Motif central de la page publique du Club,
 * où il porte les cinq choses qui ne dépendent que d'une personne.
 *
 * `dash` REMPLACE LA COCHE PAR UN TIRET, JAMAIS PAR UNE CROIX. C'est la forme du renvoi —
 * « autre chose, si… » — et la nuance est le fond du sujet : on n'écarte pas quelqu'un, on
 * l'oriente. Une croix dit « pas pour toi » ; un tiret dit « par ici ».
 *
 * N'Y METTRE QUE DU VÉRIFIABLE. Sur le Club la règle est stricte : une ligne à coche ne
 * décrit jamais l'ambiance, seulement ce qu'une personne peut garantir seule.
 *
 * Les voiles des pastilles passaient par des rgba figés dans le kit. Ils passent maintenant
 * par leurs jetons, au même pourcentage : sous `.dk` le violet et le vert prennent leur
 * variante nuit et la pastille reste une pastille, au lieu de devenir une tache sombre sur
 * fond sombre.
 */
const TONE: Record<CheckLineTone, { bg: string; stroke: string }> = {
  violet: { bg: 'color-mix(in srgb, var(--mm-violet) 15%, transparent)', stroke: 'var(--mm-violet-t)' },
  ok: { bg: 'color-mix(in srgb, var(--ok) 15%, transparent)', stroke: 'var(--ok)' },
  // --ink-2 en TRAIT, pas en texte : l'encre secondaire tient 4,51:1 sur le fond réel, et un
  // trait de 3 px n'est de toute façon pas soumis au seuil du texte (AD-18).
  neutre: { bg: 'var(--fill-2)', stroke: 'var(--ink-2)' },
  /*
   * AJOUTÉ LE 18/09/2026, parce que son absence se payait en géométrie recopiée.
   *
   * `/contact` redessinait à la main la pastille de 22 px, son `color-mix` et son glyphe —
   * onze lignes — pour la seule raison qu'aucun ton ne portait une alerte. La copie avait
   * déjà dérivé : fond à 18 % au lieu de 15, corps à 14 px au lieu de 14,5, marge à 11 au
   * lieu de 10. C'est le mode de dérive habituel d'une primitive qu'on contourne.
   */
  alerte: { bg: 'color-mix(in srgb, var(--warn) 15%, transparent)', stroke: 'var(--warn)' },
};

export interface CheckLineProps {
  /** violet = engagement du Club · ok = critère rempli · neutre = renvoi · alerte = ce à quoi
   *  il faut faire attention avant d'agir. @default "violet" */
  tone?: CheckLineTone;
  /** Tiret au lieu de la coche. */
  dash?: boolean;
  /**
   * Le glyphe, quand ce n'est ni une coche ni un tiret.
   *
   * `dash` reste pour les appelants qui l'emploient déjà — `mark` le recouvre et gagne quand
   * les deux sont posés. Une prop booléenne par glyphe ne tient pas au troisième.
   */
  mark?: 'check' | 'dash' | 'alert';
  /** @default 12 */
  size?: number;
  /**
   * Ce que le glyphe dit, quand le texte de la ligne ne le dit pas déjà. Le plus souvent il
   * le dit — une ligne à tiret finit toujours par une orientation — et le glyphe reste alors
   * muet plutôt que de faire entendre « coche » vingt fois d'affilée.
   */
  glyphLabel?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export function CheckLine({ tone = 'violet', dash, mark, size = 12, glyphLabel, children, style }: CheckLineProps) {
  const t = TONE[tone];
  const glyphe = mark ?? (dash ? 'dash' : 'check');
  return (
    <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start', marginTop: '10px', fontSize: '14.5px', lineHeight: 1.5, ...style }}>
      <span
        {...(glyphLabel ? { role: 'img', 'aria-label': glyphLabel } : { 'aria-hidden': true })}
        style={{ width: '22px', height: '22px', borderRadius: '50%', flex: '0 0 auto', marginTop: '1px', background: t.bg, display: 'grid', placeItems: 'center' }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.stroke} strokeWidth={glyphe === 'check' ? 3.4 : 3} strokeLinecap="round" strokeLinejoin="round">
          {glyphe === 'dash' && <path d="M6 12h12" />}
          {glyphe === 'check' && <path d="M4 12.5l5.5 5.5L20 7" />}
          {glyphe === 'alert' && <><path d="M12 7v6" /><path d="M12 17h.01" /></>}
        </svg>
      </span>
      <span>{children}</span>
    </div>
  );
}
