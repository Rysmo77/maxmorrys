import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { db } from '../../config/firebase';
import Button from '../../components/ui/Button';
import { trackPurchase } from '../../lib/meta-pixel';
import type { Transaction } from '../../types';

type PaymentStatus = 'loading' | 'completed' | 'pending' | 'failed';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('transactionId');

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
        setTransaction(data);

        if (data.status === 'completed') {
          setStatus('completed');
          trackPurchase(
            {
              content_ids: [data.formationId],
              content_name: data.formationTitle ?? '',
              value: data.amount,
              content_type: 'formation',
            },
            data.metaEventId,
          );
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
  }, [transactionId]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">

        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-5" />
            <h1 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              Vérification du paiement...
            </h1>
            <p className="text-neutral-500 text-sm">Patiente quelques instants.</p>
          </>
        )}

        {status === 'completed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-success-500" />
            </div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">
              Paiement confirmé !
            </h1>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              Tu es maintenant inscrit à "{transaction?.formationTitle}". Tu peux commencer ton apprentissage dès maintenant.
            </p>
            <div className="flex flex-col gap-3">
              {transaction?.formationSlug && (
                <Link to={`/cours/${transaction.formationSlug}`}>
                  <Button className="w-full" icon={<ArrowRight className="w-5 h-5" />}>
                    Commencer le cours
                  </Button>
                </Link>
              )}
              <Link to="/mon-espace">
                <Button variant="outline" className="w-full">
                  Aller à mon espace
                </Button>
              </Link>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-5" />
            <h1 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              Paiement en cours de vérification
            </h1>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              Ton paiement est en cours de traitement. Tu recevras une confirmation dès qu'il sera validé. Tu peux fermer cette page.
            </p>
            <Link to="/mon-espace">
              <Button variant="outline" className="w-full">
                Aller à mon espace
              </Button>
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-error-500" />
            </div>
            <h1 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              Paiement échoué
            </h1>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              Le paiement n'a pas abouti. Tu peux réessayer ou nous contacter si le problème persiste.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/formations">
                <Button className="w-full">Retour aux formations</Button>
              </Link>
              <Link to="/contact" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
                Nous contacter
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
