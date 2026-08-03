import { type CallContext, requireAdmin } from '../context';
import { buildWeeklyDigest } from '../lib/digest';

/**
 * Port de `weeklyClubDigestManual` — déclenchement admin du digest hebdomadaire.
 *
 * La logique vit dans `lib/digest.ts`, partagée avec le cron du lundi 9 h qui
 * rejoindra le Worker `jobs`.
 */
export async function weeklyClubDigestManual(
  _data: unknown,
  context: CallContext,
): Promise<unknown> {
  await requireAdmin(context);
  const notified = await buildWeeklyDigest(context.db, context.env);
  return { success: true, notified };
}
