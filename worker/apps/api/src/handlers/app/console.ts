import type { DocSnapshot } from '@mm/firestore-rest';

import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appConsole` — LA CONSOLE SUPPORT, ET LE SEUL ENDROIT OÙ UN RÔLE DÉCIDE.
 *
 * ⚠️ TOUTES LES AUTRES VUES SONT PERSONNELLES : elles lisent ce qui appartient à
 * l'appelant, donc l'uid du jeton suffit à les borner. Celle-ci lit ce qui appartient AUX
 * AUTRES — des messages écrits par des visiteurs, des prospects avec leur budget. Un uid ne
 * la borne pas ; seul un RÔLE l'autorise.
 *
 * Le rôle est relu dans `users/{uid}.role` à chaque appel. Pas de cache, pas de confiance
 * au client : `app/interdit.tsx` le dit déjà côté écran — « un garde de route cache, il
 * n'interdit pas ». Ici, on interdit.
 *
 * `permission-denied` plutôt qu'une vue vide, contrairement au Club : le Club est un accès
 * qu'on peut ne pas avoir souscrit, la console est une zone où l'on n'a rien à faire. La
 * distinction décide de ce que l'écran affiche — une invitation, ou une porte.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const ROLES_ADMIS = ['admin', 'support'];

export async function appConsole(_data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const profil = await context.db.get(`users/${auth.uid}`);
  const role = asText(profil?.data.role) ?? 'student';
  if (!auth.admin && !ROLES_ADMIS.includes(role)) {
    throw new HttpsError('permission-denied', 'Accès réservé au support.');
  }

  /*
   * LES COMPTES SONT COMPTÉS, jamais estimés. `count` fait une agrégation côté Firestore :
   * rapatrier les documents pour les compter coûterait des lectures facturées et un temps
   * qui grandit avec la file — sur l'écran qu'on ouvre justement pour savoir s'il y a du
   * travail, c'est la pire dépense possible.
   */
  const compter = (collection: string, ouvert: string) =>
    context.db.count({
      collection,
      where: [{ field: 'status', op: '==', value: ouvert }],
    }).catch(() => 0);

  const [messages, temoignages, rendezVous, prospects, projets, premier] = await Promise.all([
    compter('messages', 'new'),
    compter('testimonials', 'pending'),
    compter('appointments', 'pending'),
    compter('prospects', 'new'),
    compter('projects', 'active'),
    context.db.query({
      collection: 'prospects',
      where: [{ field: 'status', op: '==', value: 'new' }],
      orderBy: [{ field: 'createdAt', direction: 'asc' }],
      limit: 1,
    }).catch(() => [] as DocSnapshot[]),
  ]);

  const prospect = premier[0];

  return {
    vue: {
      comptes: {
        Messages: messages,
        Témoignages: temoignages,
        'Rendez-vous': rendezVous,
        Prospects: prospects,
        Projets: projets,
      },
      /* Le plus ancien non traité, pas le plus récent : une file de support se prend par
         le bout qui attend depuis le plus longtemps. */
      prospect: prospect && asText(prospect.data.name) ? {
        titre: asText(prospect.data.name) as string,
        meta: [asText(prospect.data.pack), asText(prospect.data.source)]
          .filter(Boolean).join(' · ') || null,
        statut: 'à traiter',
      } : null,
    },
    releveA,
  };
}
