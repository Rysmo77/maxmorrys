import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appLecon` — LE PROGRAMME DU MODULE EN COURS, ET L'ÉTAT DE CHAQUE LEÇON.
 *
 * L'écran affiche trois états par ligne : faite, en cours, à faire. Aucun n'est stocké tel
 * quel — ils se déduisent de `completedLessons` sur l'inscription, croisé avec le module
 * courant. C'est encore une jointure, et c'est encore la raison pour laquelle elle vit ici.
 *
 * ⚠️ LE POIDS EN MÉGAOCTETS N'EST PAS DÉCORATIF. Sur ce marché, un forfait est compté :
 * `meta` porte la durée ET la taille quand on les connaît, parce que c'est ce qui décide de
 * charger maintenant ou d'attendre le Wi-Fi. Un poids inventé décide à la place de
 * quelqu'un — d'où l'absence pure et simple du champ quand la base ne l'a pas.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

interface Lecon { id?: string; title?: string; duration?: string; sizeMb?: number; isDocument?: boolean; }
interface Module { id?: string; title?: string; lessons?: Lecon[]; }

export async function appLecon(data: unknown, context: CallContext): Promise<Reponse<'appLecon'>> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const { formationId } = (data ?? {}) as { formationId?: unknown };

  /*
   * L'inscription est cherchée PAR L'UID DU JETON. Le `formationId` de l'appelant ne sert
   * qu'à choisir laquelle de SES inscriptions afficher — il ne peut donc pas servir à voir
   * celle de quelqu'un d'autre, quel qu'il soit.
   */
  const inscriptions = await context.db.query({
    collection: 'enrollments',
    where: [{ field: 'userId', op: '==', value: auth.uid }],
  });
  const inscription = typeof formationId === 'string'
    ? inscriptions.find((i) => asText(i.data.formationId) === formationId)
    : inscriptions.slice().sort((a, b) =>
      (asText(b.data.lastAccessedAt) ?? '').localeCompare(asText(a.data.lastAccessedAt) ?? ''))[0];
  if (!inscription) return { vue: null, releveA };

  const cible = asText(inscription.data.formationId);
  const formation = cible ? await context.db.get(`formations/${cible}`) : null;
  if (!formation) return { vue: null, releveA };

  const modules: Module[] = Array.isArray(formation.data.modules)
    ? (formation.data.modules as Module[]) : [];
  const faites = new Set(
    Array.isArray(inscription.data.completedLessons)
      ? (inscription.data.completedLessons as unknown[]).map(String) : [],
  );
  const enCours = asText(inscription.data.currentLessonId);

  /* Le module courant est celui de la leçon en cours ; à défaut, le premier qui a encore
     quelque chose à faire. Quelqu'un qui rouvre l'application doit retomber là où il s'est
     arrêté, pas au début. */
  const module = modules.find((m) => (m.lessons ?? []).some((l) => l.id === enCours))
    ?? modules.find((m) => (m.lessons ?? []).some((l) => !faites.has(String(l.id))))
    ?? modules[0];

  return {
    vue: {
      moduleTitre: module?.title ?? null,
      programme: (module?.lessons ?? []).map((l) => ({
        id: String(l.id ?? ''),
        titre: l.title ?? '',
        // Ni durée ni poids inventés : le champ manque quand la base ne l'a pas.
        meta: [l.duration, typeof l.sizeMb === 'number' ? `${l.sizeMb} Mo` : null]
          .filter(Boolean).join(' · ') || null,
        etat: l.id === enCours ? 'current' : faites.has(String(l.id)) ? 'done' : 'todo',
        doc: l.isDocument === true,
      })),
    },
    releveA,
  };
}
