import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appNotes` — CE QUE QUELQU'UN A ÉCRIT, ET QUI N'EST NULLE PART AILLEURS.
 *
 * Les notes vivent en SOUS-COLLECTION : `users/{uid}/notes`. C'est le seul endroit du
 * produit où une lecture au mauvais chemin ne fuiterait pas des métadonnées mais des
 * PHRASES ÉCRITES PAR QUELQU'UN — l'écran de suppression de compte le dit d'ailleurs :
 * « elles ne sont nulle part ailleurs ».
 *
 * Le chemin est donc construit à partir de l'uid du JETON, jamais d'un paramètre. Ce n'est
 * pas une précaution de style : c'est la seule barrière, puisque le compte de service ne
 * passe pas par `firestore.rules`.
 *
 * ── LE COMPTE EST DEUX CHOSES, ET L'ÉCRAN LES DISTINGUE ──────────────────────────────
 * « 14 notes · 6 leçons » ne dit pas la même chose que « 14 notes ». Le second nombre est
 * le nombre de leçons DISTINCTES annotées : c'est lui qui dit si quelqu'un prend des notes
 * partout ou s'acharne sur un seul chapitre.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** « 2026-09-04T21:14:00Z » → « 04/09 · 21:14 ». L'année n'apprend rien sur cet écran. */
function quand(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${deux(d.getUTCDate())}/${deux(d.getUTCMonth() + 1)} · ${deux(d.getUTCHours())}:${deux(d.getUTCMinutes())}`;
}

export async function appNotes(_data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const notes: DocSnapshot[] = await context.db.query({
    collection: `users/${auth.uid}/notes`,
    orderBy: [{ field: 'createdAt', direction: 'desc' }],
    limit: 200,
  });

  const lecons = new Set(
    notes.map((n) => asText(n.data.lessonId)).filter((v): v is string => Boolean(v)),
  );

  return {
    vue: {
      total: { notes: notes.length, lecons: lecons.size },
      notes: notes.map((n) => {
        const heure = quand(asText(n.data.createdAt));
        const lecon = asText(n.data.lessonLabel);
        return {
          id: n.id,
          texte: asText(n.data.text) ?? '',
          // La date affichée porte la leçon quand on la connaît : une note sans son
          // contexte oblige à ouvrir chaque leçon pour retrouver de quoi elle parle.
          date: [heure, lecon].filter(Boolean).join(' · ') || null,
        };
      }),
    },
    releveA,
  };
}
