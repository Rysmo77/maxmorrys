import { type CallContext, requireAuth } from '../context';
import { readQuotaUsage, resolveQuotaLimits } from '../lib/rysmo-quota';

/**
 * Port de `getRysmoQuota` — état du quota Rysmo, sans consommer de requête.
 * Utilisé par le widget et par la boutique Rysmo.
 */
export async function getRysmoQuota(_data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context);

  const [limits, usage] = await Promise.all([
    resolveQuotaLimits(context.db, uid),
    readQuotaUsage(context.db, uid),
  ]);

  return {
    dailyLimit: limits.dailyLimit,
    dayCount: usage.dayCount,
    dayRemaining: Math.max(0, limits.dailyLimit - usage.dayCount),
    packBalance: usage.packBalance,
    plan: limits.plan,
    hasActiveSubscription: limits.hasActiveSubscription,
    hasClubBonus: limits.hasClubBonus,
  };
}
