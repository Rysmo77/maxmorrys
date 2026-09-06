import { type CallContext, requireAuth } from '../context';
import type { Sortie } from '../vues/contrat';

/**
 * Port de `clearRysmoMemory` — efface la mémoire Rysmo d'un utilisateur
 * (profil résumé, logs de conversation, sous-collection d'engagement).
 *
 * Déclenché depuis « Ce que Rysmo sait de moi » (RGPD).
 */
export async function clearRysmoMemory(_data: unknown, context: CallContext): Promise<Sortie<'clearRysmoMemory'>> {
  const { uid } = requireAuth(context);

  // La sous-collection d'engagement est supprimée par pages, pour rester borné
  // quel que soit son volume.
  const pages = context.db.queryPaged({ collection: `users/${uid}/engagement` }, 300);
  for await (const page of pages) {
    await context.db.commit(page.map((document) => ({ delete: context.db.fullName(document.path) })));
  }

  await Promise.all([
    context.db.delete(`rysmoProfiles/${uid}`),
    context.db.delete(`rysmoConversations/${uid}`),
  ]);

  return { success: true };
}
