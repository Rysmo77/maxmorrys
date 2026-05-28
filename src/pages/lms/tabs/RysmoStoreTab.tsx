import { useState, useEffect, useCallback } from 'react';
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
  { id: 'discovery', label: 'Découverte', requests: 30, price: 500, description: 'Pour tester Rysmo sur un sujet précis', badge: null as string | null },
  { id: 'regular', label: 'Régulier', requests: 100, price: 1500, description: 'Le bon équilibre pour suivre tes révisions', badge: 'Populaire' },
  { id: 'intensive', label: 'Intensif', requests: 300, price: 3500, description: 'Pour les périodes d’examens ou de certifications', badge: 'Meilleure valeur' },
];

const PLANS = [
  { id: 'lite', label: 'Rysmo+ Lite', perDay: 20, price: 3000, description: 'Pour un usage régulier sans y penser', features: ['20 requêtes/jour', 'Renouvellement mensuel', 'Quota inutilisé non reporté'] },
  { id: 'pro', label: 'Rysmo+ Pro', perDay: 100, price: 7500, description: 'Pour les power users en certification ou apprentissage intensif', features: ['100 requêtes/jour', 'Priorité service', 'Renouvellement mensuel'] },
];

export default function RysmoStoreTab() {
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
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : "Erreur lors de la création du paiement.";
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
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : "Erreur lors de la création du paiement.";
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
            <span className="text-sm">Chargement de ton quota…</span>
          </div>
        ) : quota ? (
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Aujourd'hui</p>
              <p className="text-2xl font-black text-teal-700 dark:text-teal-400">
                {quota.dayRemaining}<span className="text-sm text-neutral-400 font-bold">/{quota.dailyLimit}</span>
              </p>
              <p className="text-xs text-neutral-500">requêtes restantes</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Pack</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{quota.packBalance}</p>
              <p className="text-xs text-neutral-500">requêtes en réserve</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">Statut</p>
              <p className="text-sm font-bold mt-1 flex items-center gap-1.5">
                {quota.hasActiveSubscription ? (
                  <><Crown className="w-4 h-4 text-amber-500" /><span>Rysmo+ {quota.plan === 'pro' ? 'Pro' : 'Lite'}</span></>
                ) : quota.hasClubBonus ? (
                  <><Star className="w-4 h-4 text-amber-500" /><span>Bonus Club Digitos</span></>
                ) : (
                  <span className="text-neutral-500">Gratuit</span>
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
          <h2 className="text-xl font-black text-neutral-900 dark:text-white">Packs à la demande</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-5">
          Achète un pack quand tu en as besoin. Pas d'abonnement, pas d'expiration. Les requêtes du pack sont consommées en priorité.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {PACKS.map((pack) => (
            <div key={pack.id} className={`relative rounded-2xl border bg-white dark:bg-neutral-900 p-5 flex flex-col ${pack.badge === 'Populaire' ? 'border-teal-400 dark:border-teal-600 shadow-md' : 'border-neutral-200 dark:border-neutral-700'}`}>
              {pack.badge && (
                <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-full bg-teal-600 text-white">{pack.badge}</span>
              )}
              <h3 className="text-lg font-black text-neutral-900 dark:text-white">{pack.label}</h3>
              <p className="text-3xl font-black text-teal-700 dark:text-teal-400 mt-2">{formatPrice(pack.price)}</p>
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-1">{pack.requests} requêtes</p>
              <p className="text-xs text-neutral-500 mt-2 flex-1">{pack.description}</p>
              <Button onClick={() => handleBuyPack(pack.id)} disabled={purchasing !== null} className="mt-4 w-full">
                {purchasing === `pack_${pack.id}` ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Acheter ce pack'}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Abonnements Rysmo+ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-black text-neutral-900 dark:text-white">Abonnement Rysmo+</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-5">
          Un quota élevé chaque jour, renouvelé chaque mois. Idéal pour les périodes d'apprentissage intensif.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`rounded-2xl border bg-white dark:bg-neutral-900 p-6 ${plan.id === 'pro' ? 'border-amber-400 dark:border-amber-600 shadow-md' : 'border-neutral-200 dark:border-neutral-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Crown className={`w-4 h-4 ${plan.id === 'pro' ? 'text-amber-500' : 'text-teal-500'}`} />
                <h3 className="text-lg font-black text-neutral-900 dark:text-white">{plan.label}</h3>
              </div>
              <p className="text-3xl font-black text-neutral-900 dark:text-white mt-2">
                {formatPrice(plan.price)}<span className="text-sm text-neutral-500 font-medium">/mois</span>
              </p>
              <p className="text-sm text-neutral-500 mt-2">{plan.description}</p>
              <ul className="space-y-1.5 mt-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-teal-500 flex-shrink-0" /><span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => handleBuySubscription(plan.id)} disabled={purchasing !== null || quota?.hasActiveSubscription} className="mt-5 w-full">
                {purchasing === `sub_${plan.id}` ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : quota?.hasActiveSubscription ? 'Abonnement déjà actif' : `S'abonner à ${plan.label}`}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-neutral-400 text-center pt-2">
        Paiement sécurisé par Bictorys · Wave, Orange Money, carte bancaire.
      </p>
    </div>
  );
}
