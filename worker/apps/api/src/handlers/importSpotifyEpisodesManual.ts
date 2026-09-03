import { type CallContext, requireAdmin } from '../context';
import { runImportSpotify } from '../lib/media-sync';

/**
 * Port de `importSpotifyEpisodesManual` — déclencheur d'admin de l'import Spotify.
 *
 * Le handler ne fait que deux choses : vérifier le rôle, puis appeler la logique partagée
 * avec le cron de 04:00. Toute la substance vit dans `lib/media-sync.ts` précisément pour
 * que le bouton et l'automatisation ne puissent pas diverger.
 */
export async function importSpotifyEpisodesManual(
  _data: unknown,
  context: CallContext,
): Promise<unknown> {
  await requireAdmin(context);
  return runImportSpotify(context.db, context.env);
}
