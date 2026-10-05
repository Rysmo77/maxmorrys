import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE CONTENU D'UNE LEÇON — ce que l'application lit, et garde pour le hors-connexion.
 *
 * ⛔ L'ÉCRAN DE LEÇON N'AVAIT AUCUN CONTENU. `appLecon` ne rend que le PROGRAMME du module ;
 * l'écran écrivait son titre en dur et dessinait un lecteur débranché. Cette vue rend UNE
 * leçon entière : son texte (Markdown, comme le site), son adresse vidéo, ses ressources.
 *
 * C'est aussi elle que le téléphone GARDE quand on télécharge une leçon : son texte se lit
 * sans réseau. La vidéo, non — c'est une intégration (`iframe` sur le site), pas un fichier.
 *
 * L'inscription est cherchée PAR L'UID DU JETON, croisée avec la formation demandée — comme
 * `marquerLecon`. Sans inscription : `vue: null` (`sansAcces`), jamais le contenu.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

interface Ressource { title?: string; type?: string; url?: string; size?: string }
interface Lecon {
  id?: string; title?: string; type?: string; duration?: string; content?: string;
  videoUrl?: string; resources?: Ressource[];
}
interface Module { title?: string; lessons?: Lecon[] }

const TYPES = new Set(['video', 'text', 'quiz', 'resource', 'mission']);

export async function appLeconContenu(data: unknown, context: CallContext): Promise<Reponse<'appLeconContenu'>> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const { formationId, leconId } = (data ?? {}) as { formationId?: unknown; leconId?: unknown };
  if (typeof formationId !== 'string' || formationId === '') {
    throw new HttpsError('invalid-argument', 'Formation non désignée.');
  }
  if (leconId !== undefined && typeof leconId !== 'string') {
    throw new HttpsError('invalid-argument', 'Leçon illisible.');
  }

  const inscriptions = await context.db.query({
    collection: 'enrollments',
    where: [
      { field: 'userId', op: '==', value: auth.uid },
      { field: 'formationId', op: '==', value: formationId },
    ],
  });
  const inscription = inscriptions[0];
  if (!inscription) return { vue: null, releveA };

  const formation = await context.db.get(`formations/${formationId}`);
  if (!formation) return { vue: null, releveA };

  const modules: Module[] = Array.isArray(formation.data.modules) ? (formation.data.modules as Module[]) : [];
  const toutes = modules.flatMap((m) => (m.lessons ?? []).map((l) => ({ lecon: l, module: m })));
  const faites = new Set(
    Array.isArray(inscription.data.completedLessons) ? (inscription.data.completedLessons as unknown[]).map(String) : [],
  );
  const enCours = asText(inscription.data.currentLessonId);

  const position = (id: string | undefined) => toutes.findIndex((x) => String(x.lecon.id) === id);
  let index: number;
  if (typeof leconId === 'string') {
    index = position(leconId);
  } else {
    /* La leçon en cours ; à défaut, la première qui reste à faire ; à défaut, la première. */
    index = position(enCours);
    if (index < 0) index = toutes.findIndex((x) => !faites.has(String(x.lecon.id)));
    if (index < 0) index = 0;
  }
  const choisie = toutes[index];
  if (!choisie) return { vue: null, releveA };

  const { lecon, module } = choisie;
  const id = String(lecon.id ?? '');
  return {
    vue: {
      formationId,
      id,
      titre: lecon.title ?? '',
      type: (TYPES.has(lecon.type ?? '') ? lecon.type : 'text') as 'video' | 'text' | 'quiz' | 'resource' | 'mission',
      moduleTitre: module.title ?? null,
      duree: lecon.duration ?? null,
      contenu: typeof lecon.content === 'string' && lecon.content.trim() !== '' ? lecon.content : null,
      video: typeof lecon.videoUrl === 'string' && lecon.videoUrl !== '' ? lecon.videoUrl : null,
      ressources: (lecon.resources ?? [])
        .filter((r) => typeof r.url === 'string' && r.url !== '')
        .map((r) => ({ titre: r.title ?? r.url as string, type: r.type ?? 'link', url: r.url as string, taille: r.size ?? null })),
      faite: faites.has(id),
      precedente: index > 0 ? String(toutes[index - 1].lecon.id ?? '') : null,
      suivante: index < toutes.length - 1 ? String(toutes[index + 1].lecon.id ?? '') : null,
    },
    releveA,
  };
}
