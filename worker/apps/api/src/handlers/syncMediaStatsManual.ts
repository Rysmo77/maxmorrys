import { type CallContext, requireAdmin } from '../context';
import { runSyncMediaStats } from '../lib/media-sync';

/**
 * Port de `syncMediaStatsManual` — déclencheur d'admin de la synchronisation des vues
 * YouTube et de la popularité Spotify.
 *
 * Même partage que l'import : le cron de 03:00 appelle la même fonction.
 */
export async function syncMediaStatsManual(
  _data: unknown,
  context: CallContext,
): Promise<unknown> {
  await requireAdmin(context);
  return runSyncMediaStats(context.db, context.env);
}
