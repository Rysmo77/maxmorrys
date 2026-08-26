import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LocalizedLink from '../../components/shared/LocalizedLink';
import { doc, onSnapshot } from 'firebase/firestore';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { db } from '../../config/firebase';
import Button from '../../components/ui/Button';
import { trackPurchase } from '../../lib/tracking';
import { clearCartPending } from '../../lib/popups/cart';
import { useAuth } from '../../contexts/AuthContext';
import type { Transaction } from '../../types';

type PaymentStatus = 'loading' | 'completed' | 'pending' | 'failed';

export default function PaymentReturn() {
  const { t } = useTranslation('lms');
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const { user } = useAuth();

  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setStatus('failed');
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'transactions', transactionId),
      (snap) => {
        if (!snap.exists()) {
          setStatus('failed');
          return;
        }

        const data = { id: snap.id, ...snap.data() } as Transaction;

        if (user && data.userId && data.userId !== user.uid) {
          setStatus('failed');
          return;
        }

        setTransaction(data);

        if (data.status === 'completed') {
          setStatus('completed');
          clearCartPending(); // l'achat est fait : plus rien à rappeler
          trackPurchase({
            transactionId: data.metaEventId || data.id,
            item: {
              id: data.formationId,
              name: data.formationTitle ?? '',
              category: 'formation',
              price: data.amount,
              currency: data.currency || 'XOF',
            },
          });
        } else if (data.status === 'failed') {
          setStatus('failed');
        } else {
          setStatus('pending');
        }
      },
      () => {
        setStatus('failed');
      }
    );

    // Timeout: after 60s of pending, stop listening
    const timeout = setTimeout(() => {
      setStatus((prev) => (prev === 'loading' || prev === 'pending' ? 'pending' : prev));
    }, 60_000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [transactionId, user]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4 overflow-x-clip">
      <motion.div
        className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >

        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-5" />
            <h1 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              {t('paymentReturn.verifyingTitle')}
            </h1>
            <p className="text-neutral-500 text-sm">{t('paymentReturn.verifyingText')}</p>
          </>
        )}

        {status === 'completed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-success-500" />
            </div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">
              {t('paymentReturn.confirmedTitle')}
            </h1>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              {t('paymentReturn.confirmedText', { title: transaction?.formationTitle })}
            </p>
            <div className="flex flex-col gap-3">
              {transaction?.formationSlug && (
                <LocalizedLink to={`/cours/${transaction.formationSlug}`}>
                  <Button className="w-full" icon={<ArrowRight className="w-5 h-5" />}>
                    {t('paymentReturn.startCourse')}
                  </Button>
                </LocalizedLink>
              )}
              <LocalizedLink to="/mon-espace">
                <Button variant="outline" className="w-full">
                  {t('paymentReturn.goToSpace')}
                </Button>
              </LocalizedLink>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-5" />
            <h1 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              {t('paymentReturn.pendingTitle')}
            </h1>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              {t('paymentReturn.pendingText')}
            </p>
            <LocalizedLink to="/mon-espace">
              <Button variant="outline" className="w-full">
                {t('paymentReturn.goToSpace')}
              </Button>
            </LocalizedLink>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-error-500" />
            </div>
            <h1 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              {t('paymentReturn.failedTitle')}
            </h1>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              {t('paymentReturn.failedText')}
            </p>
            <div className="flex flex-col gap-3">
              <LocalizedLink to="/formations">
                <Button className="w-full">{t('paymentReturn.backToFormations')}</Button>
              </LocalizedLink>
              <LocalizedLink to="/contact" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
                {t('paymentReturn.contactUs')}
              </LocalizedLink>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
