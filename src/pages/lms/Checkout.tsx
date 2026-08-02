import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LocalizedLink from '../../components/shared/LocalizedLink';
import { ArrowLeft, CheckCircle, Shield, Clock, BookOpen, Award, Loader2, ShoppingBag } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { writeBatch, doc, collection } from 'firebase/firestore';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { getFormationBySlug } from '../../lib/firestore';
import { db, functions } from '../../config/firebase';
import { formatPrice } from '../../lib/utils';
import type { Formation } from '../../types';
import { generateEventId } from '../../lib/meta-pixel';
import { trackBeginCheckout, trackPurchase } from '../../lib/tracking';

const createBictorysCharge = httpsCallable<
  { formationId: string; formationSlug: string; metaEventId?: string; couponCode?: string },
  { checkoutUrl: string; transactionId: string }
>(functions, 'createBictorysCharge');

export default function Checkout() {
  const { t } = useTranslation('lms');
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formation, setFormation] = useState<Formation | null | undefined>(undefined);
  const [couponCode, setCouponCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getFormationBySlug(slug).then((data) => {
      setFormation(data);
      if (data) {
        trackBeginCheckout({
          id: data.id,
          name: data.title,
          category: data.category,
          price: data.promoPrice ?? data.price,
          currency: 'XOF',
        });
      }
    }).catch(() => setFormation(null));
  }, [slug]);

  useEffect(() => {
    if (!user) {
      navigate('/connexion', { state: { from: { pathname: `/checkout/${slug}` } } });
    }
  }, [user, navigate, slug]);

  if (formation === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" aria-label={t('certificate.loadingAria')} />
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">{t('checkout.notFoundTitle')}</h1>
        <LocalizedLink to="/formations" className="text-brand-600 dark:text-brand-400 hover:underline">{t('checkout.backToFormations')}</LocalizedLink>
      </div>
    );
  }

  const finalPrice = formation.promoPrice ?? formation.price;
  const isFree = finalPrice === 0;

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      if (isFree) {
        // Free courses: create transaction + enrollment atomically via batch
        const batch = writeBatch(db);
        const now = new Date().toISOString();

        // Transaction document (auto-ID)
        const txRef = doc(collection(db, 'transactions'));
        batch.set(txRef, {
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || user.email,
          formationId: formation.id,
          formationSlug: formation.slug,
          formationTitle: formation.title,
          amount: 0,
          currency: 'XOF',
          status: 'completed',
          paymentMethod: 'free',
          couponCode: couponCode.trim() || undefined,
          createdAt: now,
        });

        // Enrollment document (deterministic ID: uid_formationId)
        const enrollRef = doc(db, 'enrollments', `${user.uid}_${formation.id}`);
        batch.set(enrollRef, {
          userId: user.uid,
          formationId: formation.id,
          progress: 0,
          completedLessons: [],
          enrolledAt: now,
          certificateIssued: false,
        });

        await batch.commit();

        trackPurchase({
          transactionId: txRef.id,
          item: {
            id: formation.id,
            name: formation.title,
            category: formation.category,
            price: 0,
            currency: 'XOF',
          },
          coupon: couponCode.trim() || undefined,
        });

        setSuccess(true);
      } else {
        // Paid courses: call Cloud Function -> redirect to Bictorys
        const eventId = generateEventId();
        const result = await createBictorysCharge({
          formationId: formation.id,
          formationSlug: formation.slug,
          metaEventId: eventId,
          ...(couponCode.trim() && { couponCode: couponCode.trim() }),
        });

        // Redirect to Bictorys hosted checkout
        window.location.href = result.data.checkoutUrl;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t('checkout.errorPayment');
      addToast('error', msg);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">
            {t('checkout.successTitle')}
          </h1>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
            {t('checkout.successText', { title: formation.title })}
          </p>
          <div className="flex flex-col gap-3">
            <LocalizedLink to={`/cours/${formation.slug}`}>
              <Button className="w-full">{t('checkout.startCourse')}</Button>
            </LocalizedLink>
            <LocalizedLink to="/formations" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
              {t('checkout.seeOtherFormations')}
            </LocalizedLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 overflow-x-clip">
      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 lg:pt-36 pb-20"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* Back link */}
        <LocalizedLink to={`/formations/${formation.slug}`} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('checkout.backToFormation')}
        </LocalizedLink>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">

          {/* Left: Payment */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">
                {t('checkout.finalizeTitle')}
              </h1>
              <p className="text-neutral-500 text-sm">
                {isFree
                  ? t('checkout.freeSubtitle')
                  : t('checkout.paidSubtitle')}
              </p>
            </div>

            {!isFree && (
              <>
                {/* Payment info */}
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-neutral-900 dark:text-white text-sm">{t('checkout.securePayment')}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {t('checkout.securePaymentText')}
                  </p>
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-3">
                    <p className="text-xs text-neutral-400 mb-0.5">{t('checkout.amountToPay')}</p>
                    <p className="font-black text-xl text-brand-600 dark:text-brand-400">{formatPrice(finalPrice)}</p>
                  </div>
                </div>

                {/* Coupon */}
                <div className="space-y-1">
                  <label htmlFor="coupon" className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    {t('checkout.couponLabel')}
                  </label>
                  <input
                    id="coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="MAXMORRYS2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder-neutral-400"
                  />
                </div>
              </>
            )}

            {/* Submit */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
              icon={submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : isFree ? <CheckCircle className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
            >
              {submitting
                ? t('checkout.processing')
                : isFree
                  ? t('checkout.confirmFree')
                  : t('checkout.payAmount', { amount: formatPrice(finalPrice) })
              }
            </Button>

            <p className="text-xs text-neutral-400 text-center flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              {t('checkout.secureGuarantee')}
            </p>
          </div>

          {/* Right: Order summary */}
          <div className="lg:sticky lg:top-28 h-fit">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
              <h2 className="font-bold text-neutral-900 dark:text-white mb-4 text-sm">{t('checkout.summary')}</h2>

              {formation.coverImage && (
                <img src={formation.coverImage} alt={formation.title} className="w-full h-32 object-cover rounded-xl mb-4" />
              )}

              <h3 className="font-black text-neutral-900 dark:text-white text-base mb-3">{formation.title}</h3>

              <div className="space-y-2 text-sm text-neutral-500 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>{formation.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>{t('checkout.lessonsCount', { count: (formation.modules ?? []).reduce((a, m) => a + m.lessons.length, 0) })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>{t('checkout.certificateIncluded')}</span>
                </div>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-2">
                {formation.promoPrice ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">{t('checkout.originalPrice')}</span>
                      <span className="text-neutral-400 line-through">{formatPrice(formation.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-success-600 dark:text-success-400 font-medium">{t('checkout.discount')}</span>
                      <span className="text-success-600 dark:text-success-400 font-medium">-{formatPrice(formation.price - (formation.promoPrice ?? 0))}</span>
                    </div>
                  </>
                ) : null}
                <div className="flex justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="font-bold text-neutral-900 dark:text-white">{t('checkout.total')}</span>
                  <span className="font-black text-xl text-brand-600 dark:text-brand-400">
                    {isFree ? t('checkout.free') : formatPrice(finalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
