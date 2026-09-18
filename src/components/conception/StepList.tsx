import type { CSSProperties } from 'react';
import { GlassPanel } from '@ds';

/**
 * LA BANDE DE QUATRE ÉTAPES NUMÉROTÉES — une seule écriture pour les deux pistes qui en
 * portent une.
 *
 * `/conception` et `/conception/projets-sur-mesure` rendaient ce bloc en quinze lignes de JSX
 * IDENTIQUES — `diff` vide, au caractère près. Ce n'était pas seulement de la répétition :
 * les deux bandes disaient aussi la même chose, pendant que `method.lede` affirmait « la même
 * méthode aux deux niveaux d'engagement ». Le contenu a été séparé (la MÉTHODE de travail
 * d'un côté, le PARCOURS D'ENGAGEMENT de l'autre) ; le dessin, lui, doit rester commun —
 * c'est la même forme de liste, et deux copies divergent au premier ajustement.
 *
 * ⚠️ CE COMPOSANT NE LIT AUCUN NAMESPACE. Les étapes arrivent déjà traduites, comme pour
 * `SiteExit`. C'est ce qui lui permet d'être monté par deux routes sans qu'aucune n'ait à
 * déclarer un catalogue de plus — et ce que `tests/unit/route-namespaces.test.ts` vérifie
 * désormais en suivant les imports locaux d'un fichier de route.
 */

/** Une étape, déjà traduite par l'appelant. */
export interface Step {
  /** Le numéro, écrit dans le catalogue : « 01 », « 02 »… */
  n: string;
  title: string;
  body: string;
}

interface StepListProps {
  steps: Step[];
}

/** Décalage de la cascade d'entrée. */
const rv = (i: number): CSSProperties => ({ ['--i' as string]: i });

export default function StepList({ steps }: StepListProps) {
  return (
    /* Une liste ORDONNÉE : l'ordre est porté par le balisage, ce qui laisse le grand numéro
       être ce qu'il est — un ornement, retiré de l'arbre d'accessibilité. */
    <ol className="mt-[22px] grid list-none gap-4 p-0 stack:grid-cols-2 wide:grid-cols-4">
      {steps.map((step, i) => (
        <li key={step.n}>
          <GlassPanel level="flat" padding={24} className="rv h-full" style={rv(i + 1)}>
            <p className="mm-num m-0" style={{ fontSize: '30px', color: 'var(--fill-5)' }} aria-hidden="true">
              {step.n}
            </p>
            <p className="mt-2 mb-0 font-display text-[18px] font-black tracking-[-.03em] text-ink">
              {step.title}
            </p>
            <p className="mt-2 mb-0 text-[14px] leading-[1.55] text-ink-2">{step.body}</p>
          </GlassPanel>
        </li>
      ))}
    </ol>
  );
}
