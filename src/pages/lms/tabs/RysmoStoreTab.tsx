import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { Button, CheckLine, GlassPanel, Icon, Num, PriceBlock, QuotaMeter, Skeleton, StatTile, Tag } from '@ds';
import { functions } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { tutorName } from '../../../lib/naming';
import { useToast } from '../../../components/ui/Toast';
import { captureError } from '../../../lib/sentry';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE QUOTA DU RÉPÉTITEUR, ET CE QUI L'AUGMENTE.
 *
 * Recomposé sur `ScreensRysmo.js` et sur le panneau de quota de `ScreensSpace.js` § Rysmo.
 *
 * UN QUOTA EST UNE MESURE, DONC IL PORTE SA DATE DE RELEVÉ. `getRysmoQuota` recalcule le
 * compte du jour côté serveur : la source est `'server'`, et `asOf` est l'instant où la
 * réponse est arrivée — pas l'instant du rendu. Les deux diffèrent dès qu'on laisse l'écran
 * ouvert, et c'est exactement ce que la date sert à dire.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A DISPARU, ET POURQUOI
 *
 * · L'ÉCHEC SILENCIEUX. Quand `getRysmoQuota` échouait, le composant rendait `null` : un
 *   cadre vide, sans un mot. La personne ne pouvait pas distinguer « tu n'as plus de
 *   questions » de « je n'ai pas réussi à lire ton compte ». L'écran dit maintenant
 *   « quota non relevé », et l'erreur part chez Sentry au lieu de `console.error`.
 *
 * · LES PRIX EN CHAÎNES FORMATÉES. `formatPrice()` figeait le groupement des milliers ; les
 *   montants passent par <PriceBlock>, qui groupe selon la langue et exige leur source.
 *   Cette source est vérifiée : `RYSMO_PACKS` et `RYSMO_SUBSCRIPTIONS` dans
 *   `functions/src/payment.ts` portent les mêmes 500 / 1 500 / 3 500 et 3 000 / 7 500, et ce
 *   sont eux qui débitent. Le tableau ci-dessous est un MIROIR d'affichage, jamais l'autorité.
 *
 * · LES QUATRE GLYPHES `lucide-react` (Sparkles, Zap, Crown, Star) et l'ambre en dur
 *   (`text-amber-600 dark:text-amber-400`) — une couleur hors palette ET une classe `dark:`
 *   de couleur, que le thème par portée `.dk` rend inutile (AD-2, AD-3).
 *
 * NE PAS CONFONDRE LE QUOTA ET LE SOLDE. Le quota se réarme à minuit ; un pack acheté ne se
 * périme pas. Les afficher dans le même compteur ferait croire qu'on perd ce qu'on a payé —
 * d'où deux cases distinctes, et la phrase qui le dit sous la seconde.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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

/** Miroir d'affichage de `RYSMO_PACKS` (functions/src/payment.ts). Le débit vient de LÀ-BAS. */
const PACKS = [
  { id: 'discovery', requests: 30, price: 500, hasBadge: false },
  { id: 'regular', requests: 100, price: 1500, hasBadge: true },
  { id: 'intensive', requests: 300, price: 3500, hasBadge: true },
];

/** Miroir d'affichage de `RYSMO_SUBSCRIPTIONS` et de `SUBSCRIPTION_QUOTAS`. */
const PLANS = [
  { id: 'lite', perDay: 20, price: 3000 },
  { id: 'pro', perDay: 100, price: 7500 },
];

/** La grille tarifaire est du code serveur : elle se cite, elle ne se devine pas. */
const TARIFF_SOURCE = { cite: 'grille des packs et abonnements, côté serveur' } as const;

export default function RysmoStoreTab() {
  const { t } = useTranslation('lmsTabs');
  const { user, userData } = useAuth();
  /* AD-12 — le nom du répétiteur est un réglage lu dans le profil, jamais une constante :
     la description du pack d'essai écrivait « Rysmo », qui est le nom de l'APPLICATION. */
  const tutor = tutorName(userData);
  const { addToast } = useToast();
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);
  /* La date du relevé du quota : l'instant de la RÉPONSE, pas celui du rendu. */
  const [quotaAsOf, setQuotaAsOf] = useState<Date | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  /* La grille tarifaire est du code, pas un relevé : sa date est celle du rendu. */
  const tariffAsOf = new Date();

  const loadQuota = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getRysmoQuota({});
      setQuota(res.data);
      setQuotaAsOf(new Date());
    } catch (error: unknown) {
      // Un relevé qui échoue se DIT. Le cadre vide d'avant laissait croire à un quota nul.
      captureError(error, { context: 'Failed to load Rysmo quota' });
      setQuota(null);
      setQuotaAsOf(null);
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
    <div className="space-y-[16px]">
      {/* ── Le relevé du quota ───────────────────────────────────────────────── */}
      <section>
        <p className="mm-eyebrow m-0">{t('rysmoStore.quotaEyebrow')}</p>

        {loadingQuota ? (
          <Skeleton height={96} radius="var(--r-l)" label={t('rysmoStore.loadingQuota')} style={{ marginTop: '10px' }} />
        ) : !quota || !quotaAsOf ? (
          <GlassPanel level="flat" padding={18} className="mt-[10px]">
            {/* Une valeur absente se DIT : <Num> rend « non relevé », jamais un tiret. */}
            <p className="m-0 text-meta font-semibold text-ink">
              {t('rysmoStore.dailyQuotaLabel')} : <Num value={null} source="server" asOf={tariffAsOf} />
            </p>
            <p className="m-0 mt-[4px] text-meta-2" style={{ color: 'var(--text-muted)' }}>
              {t('rysmoStore.quotaUnavailable')}
            </p>
          </GlassPanel>
        ) : (
          <>
            <GlassPanel level="flat" padding={18} className="mt-[10px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 text-meta font-semibold text-ink">{t('rysmoStore.dailyQuotaLabel')}</p>
                  <QuotaMeter
                    used={quota.dayCount}
                    total={quota.dailyLimit}
                    source="server"
                    asOf={quotaAsOf}
                    suffix={t('rysmoStore.quotaSuffix')}
                    style={{ marginTop: '9px' }}
                  />
                </div>
                {quota.hasActiveSubscription ? (
                  <Tag tone="ok">{t(`rysmoStore.plans.${quota.plan === 'pro' ? 'pro' : 'lite'}.label`)}</Tag>
                ) : quota.hasClubBonus ? (
                  <Tag tone="ok">{t('rysmoStore.clubBonus')}</Tag>
                ) : (
                  <Tag>{t('rysmoStore.free')}</Tag>
                )}
              </div>
              <p className="m-0 mt-[12px] text-small" style={{ color: 'var(--text-muted)' }}>
                {t('rysmoStore.resetNote')}
              </p>
            </GlassPanel>

            <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
              <StatTile
                label={t('rysmoStore.requestsRemaining')}
                value={quota.dayRemaining}
                unit={t('rysmoStore.requestsLabel')}
                source="server"
                asOf={quotaAsOf}
              />
              <StatTile
                label={t('rysmoStore.packBalanceLabel')}
                value={quota.packBalance}
                unit={t('rysmoStore.requestsLabel')}
                source="server"
                asOf={quotaAsOf}
                foot={t('rysmoStore.packBalanceFoot')}
              />
            </div>
          </>
        )}
      </section>

      {/* ── Les packs ────────────────────────────────────────────────────────── */}
      <section>
        <p className="mm-eyebrow m-0">{t('rysmoStore.packsTitle')}</p>
        <p className="m-0 mt-[4px] text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
          {t('rysmoStore.packsSubtitle')}
        </p>
        <div className="mt-[12px] grid gap-[10px] stack:grid-cols-3">
          {PACKS.map((pack) => (
            <GlassPanel key={pack.id} level="flat" padding={18} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <p className="m-0 text-meta font-bold text-ink">{t(`rysmoStore.packs.${pack.id}.label`)}</p>
                {pack.hasBadge && <Tag>{t(`rysmoStore.packs.${pack.id}.badge`)}</Tag>}
              </div>
              <PriceBlock
                size={25}
                amount={{ value: pack.price, source: TARIFF_SOURCE, asOf: tariffAsOf }}
                currency="FCFA"
                note={
                  <>
                    <Num value={pack.requests} source={TARIFF_SOURCE} asOf={tariffAsOf} /> {t('rysmoStore.requestsLabel')}
                  </>
                }
                style={{ marginTop: '12px' }}
              />
              <p className="m-0 mt-[8px] flex-1 text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
                {t(`rysmoStore.packs.${pack.id}.description`, { tutor: tutor.toLowerCase() })}
              </p>
              <Button
                tone="transforme"
                size="sm"
                style={{ marginTop: '14px' }}
                onClick={() => void handleBuyPack(pack.id)}
                disabled={purchasing !== null}
                loading={purchasing === `pack_${pack.id}`}
              >
                {t('rysmoStore.buyPack')}
              </Button>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* ── Les abonnements. « Rysmo+ » est un nom d'ABONNEMENT À L'APPLICATION,
             pas le nom du répétiteur : il ne suit donc pas le renommage. ────── */}
      <section>
        <p className="mm-eyebrow m-0">{t('rysmoStore.subscriptionTitle')}</p>
        <p className="m-0 mt-[4px] text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
          {t('rysmoStore.subscriptionSubtitle')}
        </p>
        <div className="mt-[12px] grid gap-[10px] stack:grid-cols-2">
          {PLANS.map((plan) => {
            const planLabel = t(`rysmoStore.plans.${plan.id}.label`);
            const current = quota?.hasActiveSubscription && quota.plan === plan.id;
            return (
              <GlassPanel key={plan.id} level={plan.id === 'pro' ? 'hero' : 'flat'} padding={20}>
                <div className="flex items-start justify-between gap-2">
                  <p className="m-0 text-meta font-bold text-ink">{planLabel}</p>
                  {current && <Tag tone="ok">{t('rysmoStore.alreadySubscribed')}</Tag>}
                </div>
                <PriceBlock
                  size={27}
                  amount={{ value: plan.price, source: TARIFF_SOURCE, asOf: tariffAsOf }}
                  currency="FCFA"
                  note={t('rysmoStore.perMonth')}
                  style={{ marginTop: '12px' }}
                />
                <p className="m-0 mt-[8px] text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
                  {t(`rysmoStore.plans.${plan.id}.description`)}
                </p>
                <div className="mt-[12px]">
                  {/* Le nombre de requêtes vient de la donnée, pas d'une chaîne traduite :
                      c'est le même chiffre que `SUBSCRIPTION_QUOTAS` côté serveur. */}
                  <CheckLine>
                    <Num value={plan.perDay} source={TARIFF_SOURCE} asOf={tariffAsOf} /> {t('rysmoStore.perDayLabel')}
                  </CheckLine>
                  <CheckLine>{t(`rysmoStore.plans.${plan.id}.feature2`)}</CheckLine>
                  <CheckLine>{t(`rysmoStore.plans.${plan.id}.feature3`)}</CheckLine>
                </div>
                <Button
                  tone={plan.id === 'pro' ? 'transforme' : 'quiet'}
                  style={{ marginTop: '15px' }}
                  onClick={() => void handleBuySubscription(plan.id)}
                  disabled={purchasing !== null || quota?.hasActiveSubscription}
                  loading={purchasing === `sub_${plan.id}`}
                >
                  {quota?.hasActiveSubscription
                    ? t('rysmoStore.alreadySubscribed')
                    : t('rysmoStore.subscribeTo', { plan: planLabel })}
                </Button>
              </GlassPanel>
            );
          })}
        </div>
      </section>

      <p className="m-0 flex items-center justify-center gap-[7px] text-small" style={{ color: 'var(--text-muted)' }}>
        <Icon name="lock" size={13} strokeWidth={2.4} />
        {t('rysmoStore.paymentNote')}
      </p>
    </div>
  );
}
