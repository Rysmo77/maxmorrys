import type { CSSProperties, ReactNode } from 'react';

export type CheckLineTone = 'violet' | 'ok' | 'neutre';

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
};

export interface CheckLineProps {
  /** violet = engagement du Club · ok = critère rempli · neutre = renvoi. @default "violet" */
  tone?: CheckLineTone;
  /** Tiret au lieu de la coche. */
  dash?: boolean;
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

export function CheckLine({ tone = 'violet', dash, size = 12, glyphLabel, children, style }: CheckLineProps) {
  const t = TONE[tone];
  return (
    <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start', marginTop: '10px', fontSize: '14.5px', lineHeight: 1.5, ...style }}>
      <span
        {...(glyphLabel ? { role: 'img', 'aria-label': glyphLabel } : { 'aria-hidden': true })}
        style={{ width: '22px', height: '22px', borderRadius: '50%', flex: '0 0 auto', marginTop: '1px', background: t.bg, display: 'grid', placeItems: 'center' }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.stroke} strokeWidth={dash ? 3 : 3.4} strokeLinecap="round" strokeLinejoin="round">
          {dash ? <path d="M6 12h12" /> : <path d="M4 12.5l5.5 5.5L20 7" />}
        </svg>
      </span>
      <span>{children}</span>
    </div>
  );
}
