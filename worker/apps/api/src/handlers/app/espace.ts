import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { asText, toNumber } from '../../lib/values';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appEspace` — LA REPRISE, qui est le premier objet de l'accueil.
 *
 * C'est la vue qui justifie à elle seule la décision B du port : ce que l'écran affiche —
 * « Tu t'es arrêtée il y a 8 jours », « Module 3 · Leçon 5 », 34 % — n'existe dans AUCUN
 * document. C'est une jointure `enrollments` × `formations`, plus deux calculs de dates.
 * Refaire ça côté client, c'était réimplémenter la logique métier dans un second endroit
 * sans test partagé.
 *
 * ⚠️ LECTURE PAR COMPTE DE SERVICE = PAS DE `firestore.rules`. Chaque requête est bornée
 * par l'uid du JETON. Une inscription se lit par `where userId == <jeton>`, jamais par un
 * identifiant transmis — c'est la seule barrière, et il n'y en a pas d'autre.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** « il y a 8 jours », « hier », « aujourd'hui ». Une durée brute ne dit rien à personne. */
function depuis(iso: string | undefined): string | null {
  if (!iso) return null;
  const alors = new Date(iso);
  if (Number.isNaN(alors.getTime())) return null;
  const jours = Math.floor((Date.now() - alors.getTime()) / 86_400_000);
  if (jours <= 0) return "Tu t'es arrêtée aujourd'hui";
  if (jours === 1) return "Tu t'es arrêtée hier";
  return `Tu t'es arrêtée il y a ${jours} jours`;
}

export async function appEspace(_data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const inscriptions: DocSnapshot[] = await context.db.query({
    collection: 'enrollments',
    where: [{ field: 'userId', op: '==', value: auth.uid }],
  });
  if (inscriptions.length === 0) return { vue: null, releveA };

  /*
   * LA REPRISE EST LA PLUS RÉCEMMENT TOUCHÉE, pas la plus récemment commencée. Quelqu'un
   * qui reprend une vieille formation doit la retrouver en tête — sinon l'accueil propose
   * de reprendre ce qu'on vient justement d'abandonner.
   */
  const derniere = inscriptions.slice().sort((a, b) => {
    const da = asText(a.data.lastAccessedAt) ?? asText(a.data.enrolledAt) ?? '';
    const db = asText(b.data.lastAccessedAt) ?? asText(b.data.enrolledAt) ?? '';
    return db.localeCompare(da);
  })[0];

  const formationId = asText(derniere.data.formationId);
  const formation = formationId ? await context.db.get(`formations/${formationId}`) : null;
  if (!formation) return { vue: null, releveA };

  const titre = asText(formation.data.title) ?? '';
  const modules = Array.isArray(formation.data.modules) ? formation.data.modules : [];
  const lecons = modules.reduce((n: number, m: unknown) => {
    const liste = (m as { lessons?: unknown[] })?.lessons;
    return n + (Array.isArray(liste) ? liste.length : 0);
  }, 0);
  const faites = Array.isArray(derniere.data.completedLessons)
    ? derniere.data.completedLessons.length
    : 0;

  return {
    vue: {
      slug: asText(formation.data.slug) ?? '',
      titre,
      /* Le titre court est le premier segment avant « pour », « : » ou un tiret cadratin.
         L'écran a deux lignes ; un titre complet y déborde et se fait couper au hasard. */
      titreCourt: titre.split(/\s+(?:pour|—|:)\s+/)[0] ?? titre,
      meta: [
        asText(formation.data.category),
        modules.length > 0 ? `${modules.length} modules` : null,
        lecons > 0 ? `${lecons} leçons` : null,
        asText(formation.data.level),
      ].filter(Boolean).join(' · '),
      lecons,
      leconsFaites: faites,
      progression: toNumber(derniere.data.progress, 0),
      arret: depuis(asText(derniere.data.lastAccessedAt) ?? asText(derniere.data.enrolledAt)),
      moduleEnCours: asText(derniere.data.currentModuleLabel),
      leconEnCours: asText(derniere.data.currentLessonLabel),
    },
    releveA,
  };
}
