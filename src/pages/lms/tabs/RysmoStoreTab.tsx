import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { Sparkles, Zap, Crown, Check, Loader2, Star } from 'lucide-react';
import { functions } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import Button from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils';

interface QuotaSnapshot {
  dailyLimit: number;
  dayCount: number;
  dayRemaining: number;
  packBalance: number;
  plan: 'lite' | 'pro' | null;
  hasActiveSubscription: boolean;
  hasClubBonus: boolean;
}

const getRysmoQuota = httpsCallable<Record<string, never>, QuotaSnapshot>(functions, 'getRysmoQuota');
const createRysmoPackCharge = httpsCallable<{ pack: string }, { checkoutUrl: string; transactionId: string }>(functions, 'createRysmoPackCharge');
const createRysmoSubscriptionCharge = httpsCallable<{ plan: string }, { checkoutUrl: string; transactionId: string }>(functions, 'createRysmoSubscriptionCharge');

const PACKS = [
  { id: 'discovery', requests: 30, price: 500, hasBadge: false },
  { id: 'regular', requests: 100, price: 1500, hasBadge: true },
  { id: 'intensive', requests: 300, price: 3500, hasBadge: true },
];

const PLANS = [
  { id: 'lite', perDay: 20, price: 3000 },
  { id: 'pro', perDay: 100, price: 7500 },
];

export default function RysmoStoreTab() {
  const { t } = useTranslation('lmsTabs');
  const { user } = useAuth();
  const { addToast } = useToast();
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const loadQuota = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getRysmoQuota({});
      setQuota(res.data);
    } catch (err) {
      console.error('Failed to load Rysmo quota', err);
    } finally {
      setLoadingQuota(false);
    }
  }, [user]);

  useEffect(() => { loadQuota(); }, [loadQuota]);

  const handleBuyPack = async (packId: string) => {
    if (!user) return;
    setPurchasing(`pack_${packId}`);
    try {
      const res = await createRysmoPackCharge({ pack: packId });
      window.location.href = res.data.checkoutUrl;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : t('rysmoStore.toastPaymentError');
      addToast('error', msg);
      setPurchasing(null);
    }
  };

  const handleBuySubscription = async (plan: string) => {
    if (!user) return;
    setPurchasing(`sub_${plan}`);
    try {
      const res = await createRysmoSubscriptionCharge({ plan });
      window.location.href = res.data.checkoutUrl;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : t('rysmoStore.toastPaymentError');
      addToast('error', msg);
      setPurchasing(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* État du quota actuel */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-teal-50 to-white dark:from-neutral-800 dark:to-neutral-900 p-5">
        {loadingQuota ? (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{t('rysmoStore.loadingQuota')}</span>
          </div>
        ) : quota ? (
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">{t('rysmoStore.today')}</p>
              <p className="text-2xl font-black text-teal-700 dark:text-teal-400">
                {quota.dayRemaining}<span className="text-sm text-neutral-400 font-bold">/{quota.dailyLimit}</span>
              </p>
              <p className="text-xs text-neutral-500">{t('rysmoStore.requestsRemaining')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">{t('rysmoStore.pack')}</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{quota.packBalance}</p>
              <p className="text-xs text-neutral-500">{t('rysmoStore.requestsReserve')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">{t('rysmoStore.status')}</p>
              <p className="text-sm font-bold mt-1 flex items-center gap-1.5">
                {quota.hasActiveSubscription ? (
                  <><Crown className="w-4 h-4 text-amber-500" /><span>Rysmo+ {quota.plan === 'pro' ? 'Pro' : 'Lite'}</span></>
                ) : quota.hasClubBonus ? (
                  <><Star className="w-4 h-4 text-amber-500" /><span>{t('rysmoStore.clubBonus')}</span></>
                ) : (
                  <span className="text-neutral-500">{t('rysmoStore.free')}</span>
                )}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Packs à usage */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-teal-600" />
          <h2 className="text-xl font-black text-neutral-900 dark:text-white">{t('rysmoStore.packsTitle')}</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-5">
          {t('rysmoStore.packsSubtitle')}
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {PACKS.map((pack) => {
            const isPopular = pack.id === 'regular';
            return (
            <div key={pack.id} className={`relative rounded-2xl border bg-white dark:bg-neutral-900 p-5 flex flex-col ${isPopular ? 'border-teal-400 dark:border-teal-600 shadow-md' : 'border-neutral-200 dark:border-neutral-700'}`}>
              {pack.hasBadge && (
                <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-full bg-teal-600 text-white">{t(`rysmoStore.packs.${pack.id}.badge`)}</span>
              )}
              <h3 className="text-lg font-black text-neutral-900 dark:text-white">{t(`rysmoStore.packs.${pack.id}.label`)}</h3>
              <p className="text-3xl font-black text-teal-700 dark:text-teal-400 mt-2">{formatPrice(pack.price)}</p>
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-1">{t('rysmoStore.requests', { count: pack.requests })}</p>
              <p className="text-xs text-neutral-500 mt-2 flex-1">{t(`rysmoStore.packs.${pack.id}.description`)}</p>
              <Button onClick={() => handleBuyPack(pack.id)} disabled={purchasing !== null} className="mt-4 w-full">
                {purchasing === `pack_${pack.id}` ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('rysmoStore.buyPack')}
              </Button>
            </div>
            );
          })}
        </div>
      </section>

      {/* Abonnements Rysmo+ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-black text-neutral-900 dark:text-white">{t('rysmoStore.subscriptionTitle')}</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-5">
          {t('rysmoStore.subscriptionSubtitle')}
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => {
            const planLabel = t(`rysmoStore.plans.${plan.id}.label`);
            return (
            <div key={plan.id} className={`rounded-2xl border bg-white dark:bg-neutral-900 p-6 ${plan.id === 'pro' ? 'border-amber-400 dark:border-amber-600 shadow-md' : 'border-neutral-200 dark:border-neutral-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Crown className={`w-4 h-4 ${plan.id === 'pro' ? 'text-amber-500' : 'text-teal-500'}`} />
                <h3 className="text-lg font-black text-neutral-900 dark:text-white">{planLabel}</h3>
              </div>
              <p className="text-3xl font-black text-neutral-900 dark:text-white mt-2">
                {formatPrice(plan.price)}<span className="text-sm text-neutral-500 font-medium">{t('rysmoStore.perMonth')}</span>
              </p>
              <p className="text-sm text-neutral-500 mt-2">{t(`rysmoStore.plans.${plan.id}.description`)}</p>
              <ul className="space-y-1.5 mt-4">
                {['feature1', 'feature2', 'feature3'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-teal-500 flex-shrink-0" /><span>{t(`rysmoStore.plans.${plan.id}.${f}`)}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => handleBuySubscription(plan.id)} disabled={purchasing !== null || quota?.hasActiveSubscription} className="mt-5 w-full">
                {purchasing === `sub_${plan.id}` ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : quota?.hasActiveSubscription ? t('rysmoStore.alreadySubscribed') : t('rysmoStore.subscribeTo', { plan: planLabel })}
              </Button>
            </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-neutral-400 text-center pt-2">
        {t('rysmoStore.paymentNote')}
      </p>
    </div>
  );
}
