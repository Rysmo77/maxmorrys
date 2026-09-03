import {
  doc, getDoc, where, orderBy, limit, startAfter,
  type DocumentData,
} from 'firebase/firestore';
import { getCollection, createDoc, setDocById, deleteDocById, db } from './helpers';
import type { Formation } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * MASQUAGE DU CURRICULUM D'UNE FORMATION EN COMING SOON.
 *
 * ⚠️ C'EST UNE DÉCISION D'AFFICHAGE, PAS UNE FRONTIÈRE DE SÉCURITÉ.
 *
 * `modules[].lessons` est imbriqué DANS le document formation — il n'y a pas de sous-collection.
 * Le document part au navigateur en entier ; qui ouvre l'onglet réseau voit tout. Ce filtre
 * existe pour qu'aucune surface, présente ou future, ne puisse rendre une leçon non ouverte par
 * inadvertance. Il n'empêche personne de la lire.
 *
 * La conséquence pratique, et elle est réelle : NE PAS SAISIR le contenu final des leçons avant
 * l'ouverture. Les titres de modules suffisent à publier en Coming Soon.
 *
 * ⚠️ Le nombre de leçons tombe donc à ZÉRO. Ne jamais l'afficher pour une formation en Coming
 * Soon — « 0 leçon » serait un chiffre faux, exactement le défaut que `publicCounts.ts` existe
 * pour corriger. C'est le nombre de MODULES qui se dit à la place.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
function masquerCurriculum(f: Formation): Formation {
  if (!f.comingSoon) return f;
  return { ...f, modules: (f.modules ?? []).map((m) => ({ ...m, lessons: [] })) };
}

export async function getPublishedFormations(): Promise<Formation[]> {
  const data = await getCollection<Formation>(
    'formations',
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
  );
  return data.map(masquerCurriculum);
}

export async function getPublishedFormationsPaginated(
  pageSize = 12,
  lastCreatedAt?: string,
): Promise<{ formations: Formation[]; hasMore: boolean }> {
  const constraints = [
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
    ...(lastCreatedAt ? [startAfter(lastCreatedAt)] : []),
    limit(pageSize + 1),
  ];
  const data = await getCollection<Formation>('formations', ...constraints);
  const hasMore = data.length > pageSize;
  return { formations: data.slice(0, pageSize).map(masquerCurriculum), hasMore };
}

export async function getFormationBySlug(slug: string, lang: 'fr' | 'en' = 'fr'): Promise<Formation | null> {
  // En anglais, tenter d'abord le slug EN (index single-field auto), repli sur le slug FR.
  if (lang === 'en') {
    // `status` doit figurer dans la requête : les règles n'autorisent la lecture
    // anonyme que des documents publiés, et un filtre absent fait échouer le `list`
    // entier en PERMISSION_DENIED — pas seulement les brouillons.
    const byEn = await getCollection<Formation>('formations', where('slug_en', '==', slug), where('status', '==', 'published'), limit(1));
    if (byEn[0]) return masquerCurriculum(byEn[0]);
  }
  const results = await getCollection<Formation>('formations', where('slug', '==', slug), where('status', '==', 'published'), limit(1));
  return results[0] ? masquerCurriculum(results[0]) : null;
}

/** Console d'administration. NE MASQUE PAS le curriculum : la console doit pouvoir l'éditer. */
export async function getAllFormations(): Promise<Formation[]> {
  return getCollection<Formation>('formations', orderBy('createdAt', 'desc'));
}

export async function saveFormation(data: Omit<Formation, 'id'>, id?: string): Promise<string> {
  if (id) {
    await setDocById('formations', id, data as DocumentData);
    return id;
  }
  return createDoc('formations', data as DocumentData);
}

export async function deleteFormation(id: string): Promise<void> {
  return deleteDocById('formations', id);
}

export async function getFormationsByIds(ids: string[]): Promise<Formation[]> {
  if (ids.length === 0) return [];

  /*
   * ═════════════════════════════════════════════════════════════════════════════════════
   * UNE LECTURE PAR FORMATION, ET NON UN `documentId() in [...]`. MESURÉ, PAS SUPPOSÉ.
   *
   * Ce chemin sert l'espace élève : il traduit les inscriptions de quelqu'un en formations.
   * Il partait en PERMISSION_DENIED pour tout compte non-admin, le `.catch()` de
   * `useStudentData` avalait l'échec, et CHAQUE inscription se retrouvait avec
   * `formation: null` — invisible pour un admin, dont la branche `isAdmin()` valide tout.
   *
   * ⚠️ La cause n'est PAS celle qu'on croit, et la correction évidente ne corrigeait rien.
   * Sondé contre l'émulateur, sur le vrai `firestore.rules` :
   *
   *   in['publiée','publiée']              sans `status`  → ACCEPTÉ
   *   in['publiée','brouillon']            sans `status`  → refusé  (false @ règle)
   *   in['publiée','brouillon']  AVEC `where status == published`  → refusé QUAND MÊME
   *   in['publiée','identifiant inexistant']              → refusé  (Null value error)
   *
   * Autrement dit : sur une requête par identifiants, Firestore évalue la règle document par
   * document, comme une rafale de `get`. Un seul document dépublié — ou simplement SUPPRIMÉ —
   * parmi les identifiants demandés refuse la requête ENTIÈRE. Et ajouter le filtre `status`
   * n'y change rien : il ne rend pas la requête « prouvable », il n'est tout simplement pas
   * consulté pour ce type de requête.
   *
   * Or c'est exactement la situation de production : on part des inscriptions, et une
   * formation achetée puis dépubliée ou supprimée est un cas normal, pas une anomalie.
   *
   * Lire document par document isole la panne : la formation devenue illisible disparaît de
   * la liste, les autres arrivent. Le coût de facturation est identique (une requête par
   * identifiants est facturée au document), on échange un aller-retour contre N — acceptable
   * ici, où N est le nombre d'inscriptions d'UNE personne.
   * ═════════════════════════════════════════════════════════════════════════════════════
   */
  const lectures = await Promise.all(
    ids.slice(0, 30).map(async (id) => {
      try {
        const snap = await getDoc(doc(db, 'formations', id));
        if (!snap.exists()) return null;
        return masquerCurriculum({ id: snap.id, ...snap.data() } as Formation);
      } catch {
        // Refus de lecture sur CE document : la formation a été dépubliée. Ce n'est pas une
        // panne — c'est la règle qui fait son travail. On l'omet, sans bruit ni Sentry.
        return null;
      }
    }),
  );
  return lectures.filter((f): f is Formation => f !== null);
}
