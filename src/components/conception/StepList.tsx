import type { CSSProperties } from 'react';
import { Icon } from '@ds';

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

/**
 * KIT V3 — `ProcessAccordion` des maquettes (« Notre méthode, simplifiée. »).
 * Une étape ouverte à la fois n'est PAS imposée : ce sont des `<details>` natifs, lisibles
 * sans script, au clavier, et dont le contenu reste dans la page pour les moteurs. La
 * première est ouverte au chargement pour que le dessin se comprenne d'un coup d'œil.
 * Le numéro est un ornement d'ordre, retiré de l'arbre : l'ordre est porté par `<ol>`.
 */
export default function StepList({ steps }: StepListProps) {
  return (
    <ol className="mm-acc mt-[22px] list-none p-0">
      {steps.map((step, i) => (
        <li key={step.n} className="rv" style={rv(i + 1)}>
          <details className="mm-acc__item" open={i === 0}>
            <summary>
              <span className="mm-acc__n" aria-hidden="true">
                {step.n}
              </span>
              {step.title}
              <span className="mm-acc__plus" aria-hidden="true">
                <Icon name="plus" size={16} />
              </span>
            </summary>
            <div className="mm-acc__body">{step.body}</div>
          </details>
        </li>
      ))}
    </ol>
  );
}
