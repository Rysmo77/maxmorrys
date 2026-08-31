import { slugify } from '../utils';
import type { FAQ } from '../../types';

/**
 * L'ADRESSE D'UNE QUESTION.
 *
 * Le design system fait de la page par question une correction nommée : « aujourd'hui la FAQ
 * n'a qu'un index : aucune question n'a d'URL partageable ni de position propre en recherche »
 * (kit, `ScreensEditorial.js` § FaqQuestion). Une page par question suppose une adresse par
 * question — et le type `FAQ` n'en portait aucune.
 *
 * DEUX SOURCES, DANS CET ORDRE, ET LA DIFFÉRENCE COMPTE :
 *
 *   1. `slug` renseigné à l'administration — l'adresse est FIGÉE. Reformuler la question ne
 *      casse pas les liens déjà partagés ni la position acquise en recherche.
 *   2. sinon, dérivé du texte de la question — l'adresse existe immédiatement, y compris pour
 *      les questions déjà en base, mais elle SUIT le texte. Corriger une faute de frappe dans
 *      une question déplace sa page, silencieusement.
 *
 * Le second cas n'est pas un défaut : c'est ce qui permet à la fonctionnalité d'exister sans
 * migration de données. Mais c'est une dette, et l'écran d'administration la compte — voir
 * l'étape « slug dérivé » de `AdminFAQ`.
 */
export function faqSlug(item: Pick<FAQ, 'question' | 'slug'>): string {
  const authored = item.slug?.trim();
  return authored ? slugify(authored) : slugify(item.question);
}

/** Vrai quand l'adresse est figée par l'administration, et ne suivra pas le texte. */
export function hasAuthoredSlug(item: Pick<FAQ, 'slug'>): boolean {
  return Boolean(item.slug?.trim());
}

/**
 * Retrouve la question désignée par un segment d'URL.
 *
 * Deux questions peuvent produire le même slug dérivé — « Puis-je payer en plusieurs fois ? »
 * posée dans deux catégories, par exemple. La première de la liste gagne, et c'est l'ordre
 * d'affichage : la collision ne rend donc AUCUNE des deux inatteignable, elle en cache une.
 * C'est exactement ce qu'un slug renseigné à la main répare.
 */
export function findFaqBySlug(items: readonly FAQ[], slug: string): FAQ | undefined {
  const wanted = slugify(slug);
  return items.find((item) => faqSlug(item) === wanted);
}
