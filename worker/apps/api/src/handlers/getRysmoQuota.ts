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
    /*
     * L'ÉCHÉANCE ET LA REPRISE SORTENT D'ICI, ET L'ÉCRAN NE LES RECALCULE PAS.
     *
     * La boutique désactivait son bouton sur le seul `hasActiveSubscription`, ce qui fermait
     * la reprise jusqu'au dernier jour — donc envoyait le rappel d'échéance vers un bouton
     * mort. `canRenew` vient de `deciderRenouvellement`, la même fonction que le serveur
     * applique au moment de débiter : les deux ne peuvent pas diverger.
     */
    expiresAt: limits.expiresAt,
    canRenew: limits.canRenew,
  };
}
