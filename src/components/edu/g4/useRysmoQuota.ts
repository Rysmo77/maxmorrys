import { useCallback, useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../config/firebase';
import { captureError } from '../../../lib/sentry';

/** Relevé du quota de l'assistant, tel que le renvoie `getRysmoQuota` (même forme que `TutorPanel`). */
export interface RysmoQuotaSnapshot {
  dailyLimit: number;
  dayCount: number;
  dayRemaining: number;
  packBalance: number;
  plan: 'lite' | 'pro' | null;
  hasActiveSubscription: boolean;
  hasClubBonus: boolean;
}

const getRysmoQuota = httpsCallable<Record<string, never>, RysmoQuotaSnapshot>(functions, 'getRysmoQuota');

/**
 * Lit le quota côté serveur au montage (et à la demande). Sans compte, ou en cas d'échec,
 * `quota` reste `null` : l'écran dit « non relevé » plutôt que d'afficher un chiffre.
 */
export function useRysmoQuota(uid: string | undefined) {
  const [quota, setQuota] = useState<RysmoQuotaSnapshot | null>(null);
  const [asOf, setAsOf] = useState<Date | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));

  const reload = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    try {
      const res = await getRysmoQuota({});
      setQuota(res.data);
      setAsOf(new Date());
    } catch (error: unknown) {
      captureError(error, { context: 'useRysmoQuota getRysmoQuota' });
      setQuota(null);
      setAsOf(null);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { void reload(); }, [reload]);

  return { quota, asOf, loading, reload };
}
