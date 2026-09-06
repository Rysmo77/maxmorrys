import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { asText, toNumber } from '../lib/values';
import type { Sortie } from '../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `marquerLecon` — cocher une leçon, et tout ce que la règle Firestore interdit.
 *
 * ⚠️ CE HANDLER DOIT REFAIRE UNE RÈGLE ENTIÈRE À LA MAIN. `firestore.rules` autorise la
 * mise à jour d'une inscription sous SEPT conditions, et le compte de service n'en subit
 * aucune. Elles sont reproduites ici, une par une :
 *
 *   1 · on ne touche que SON inscription            → filtre sur l'uid du jeton
 *   2 · `userId` ne change pas                      → jamais réécrit
 *   3 · `formationId` ne change pas                 → jamais réécrit
 *   4 · seuls cinq champs bougent                   → le masque n'en porte que quatre
 *   5 · `progress` reste entre 0 et 100             → borné avant écriture
 *   6 · `maxProgress` NE DÉCROÎT JAMAIS             → voir ci-dessous, c'est le point dur
 *   7 · `maxProgress` reste ≤ 100                   → borné aussi
 *
 * ── POURQUOI `maxProgress` NE PEUT PAS REDESCENDRE ──────────────────────────────────
 * Ce n'est pas un plafond décoratif : il sert à n'accorder l'XP d'un palier QU'UNE FOIS.
 * Sans lui, décocher puis recocher une leçon rapporterait de l'XP en boucle — et cet XP
 * alimente le classement du Club et les badges de parrainage. Le laisser décroître ici
 * rouvrirait la faille exactement là où la règle la ferme.
 *
 * ── ET LE CALCUL RESTE CÔTÉ SERVEUR ─────────────────────────────────────────────────
 * Le pourcentage est DÉDUIT du nombre de leçons de la formation, jamais transmis par le
 * client. Un `progress` envoyé par l'appelant serait un curseur qu'on lui tend : il n'a
 * qu'à écrire 100 pour obtenir son certificat.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

interface Lecon { id?: string }
interface Module { lessons?: Lecon[] }

export async function marquerLecon(data: unknown, context: CallContext): Promise<Sortie<'marquerLecon'>> {
  const auth = requireAuth(context);

  const { formationId, leconId, faite } = (data ?? {}) as {
    formationId?: unknown; leconId?: unknown; faite?: unknown;
  };
  if (typeof formationId !== 'string' || typeof leconId !== 'string'
    || formationId === '' || leconId === '') {
    throw new HttpsError('invalid-argument', 'Formation ou leçon non désignée.');
  }
  if (typeof faite !== 'boolean') {
    throw new HttpsError('invalid-argument', 'État de la leçon illisible.');
  }

  /* (1) L'inscription est cherchée PAR L'UID DU JETON, croisée avec la formation demandée.
     Un identifiant d'inscription transmis par l'appelant permettrait de cocher chez autrui. */
  const inscriptions = await context.db.query({
    collection: 'enrollments',
    where: [
      { field: 'userId', op: '==', value: auth.uid },
      { field: 'formationId', op: '==', value: formationId },
    ],
  });
  const inscription = inscriptions[0];
  if (!inscription) throw new HttpsError('not-found', 'Tu n’es pas inscrite à cette formation.');

  const formation = await context.db.get(`formations/${formationId}`);
  if (!formation) throw new HttpsError('not-found', 'Formation introuvable.');

  const modules: Module[] = Array.isArray(formation.data.modules)
    ? (formation.data.modules as Module[]) : [];
  const toutes = modules.flatMap((m) => (m.lessons ?? []).map((l) => String(l.id ?? '')));
  if (!toutes.includes(leconId)) {
    throw new HttpsError('invalid-argument', 'Cette leçon n’appartient pas à cette formation.');
  }

  const avant = new Set(
    Array.isArray(inscription.data.completedLessons)
      ? (inscription.data.completedLessons as unknown[]).map(String) : [],
  );
  if (faite) avant.add(leconId); else avant.delete(leconId);

  /* (5) Le pourcentage est DÉDUIT, jamais reçu — et borné des deux côtés. */
  const progression = toutes.length === 0
    ? 0
    : Math.min(100, Math.max(0, Math.round((avant.size / toutes.length) * 100)));

  /* (6) Le maximum ne redescend pas. C'est la ligne qui empêche la boucle à XP. */
  const maxAvant = toNumber(inscription.data.maxProgress, 0);
  const maxApres = Math.min(100, Math.max(maxAvant, progression));

  /* (2)(3)(4) Le masque ne porte QUE les champs que la règle autorise. `userId` et
     `formationId` n'y figurent pas : ils ne peuvent donc pas bouger, même par erreur. */
  await context.db.commit([
    context.db.buildWrite(inscription.path, {
      completedLessons: [...avant],
      progress: progression,
      maxProgress: maxApres,
      lastActivityAt: new Date().toISOString(),
    }, { mask: true }),
  ]);

  return {
    progression,
    leconsFaites: avant.size,
    lecons: toutes.length,
    // L'écran a besoin de savoir si le certificat est atteignable, pas de le décider.
    complete: progression >= 100,
    titre: asText(formation.data.title) ?? null,
  };
}
