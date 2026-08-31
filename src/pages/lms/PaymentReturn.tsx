import { useState, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button, GlassPanel, Icon, Mesh, Num, Tag, type TagTone } from '@ds';
import { db } from '../../config/firebase';
import { SiteDisplay, useReveal } from '../../components/site';
import DsNavHost from '../../components/layout/DsNavHost';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { trackPurchase } from '../../lib/tracking';
import { clearCartPending } from '../../lib/popups/cart';
import { useAuth } from '../../contexts/AuthContext';
import type { Transaction } from '../../types';

/**
 * L'ATTENTE DE PAIEMENT — LE PREMIER DES DEUX SEULS MOMENTS SCÉNARISÉS DU SYSTÈME.
 *
 * Le kit (`ScreensPay.js` · `Attente`, `ScreensPayEnd.js` · `IssueBloc`) accorde ici une
 * licence d'animation qu'il n'accorde nulle part ailleurs : `.pulse`, deux anneaux qui
 * partent du glyphe à 1,3 s d'intervalle. Ils ne décorent pas — ils DISENT QUE ÇA VIT
 * pendant qu'un `onSnapshot` écoute une transaction que personne d'autre ne peut voir bouger.
 * C'est la réponse du système au rond qui tourne, qu'il interdit partout : un rond dit
 * « ça charge » ; deux anneaux qui repartent disent « la page se met à jour toute seule »,
 * ce qui est exactement ce que fait cet écran.
 *
 * ILS NE SE TRANSPOSENT PAS. `.pulse` n'a droit qu'aux deux écrans d'issue de paiement et au
 * certificat (`.sheen`). Ailleurs, une entrée de scène est une entrée : `.rv` et rien d'autre.
 *
 * L'anneau vit sous un ancêtre `.play`, posé par `useReveal`. Sans lui, le glyphe est là mais
 * rien ne bouge — et si la personne a demandé moins de mouvement, `useReveal` pose `.play`
 * immédiatement et `brand/fallback.css` ramène les durées à 1 ms : le contenu reste, la
 * scène disparaît. C'est le bon sens de la règle, pas son contournement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CET ÉCRAN AFFICHE MAINTENANT ET QU'IL N'AFFICHAIT PAS : LE MONTANT DÉBITÉ.
 *
 * Il vient de `transaction.amount`, écrit CÔTÉ SERVEUR par `createBictorysCharge` au moment
 * où la charge est créée — donc `source="server"`. C'est le seul montant du parcours dont on
 * puisse dire qu'il est celui qui a été débité ; celui du récapitulatif de commande, lui,
 * est une lecture de catalogue faite par le navigateur (voir `Checkout.tsx`).
 * ─────────────────────────────────────────────────────────────────────────────
 */

type PaymentStatus = 'loading' | 'completed' | 'pending' | 'failed';

/** Les quatre issues et ce qui les distingue à l'écran. */
const ISSUE: Record<PaymentStatus, { glyph: 'check' | 'alert' | 'card'; tone: TagTone; pulse: boolean; bg: string }> = {
  // Le dégradé teal → bleu du kit EST `--action-digitalise`, au jeton près.
  completed: { glyph: 'check', tone: 'ok', pulse: false, bg: 'var(--action-digitalise)' },
  // Le kit peint l'attente aux couleurs de Wave. Le produit ne sait PAS quel opérateur la
  // personne a choisi — le choix se fait sur la page hébergée. On peint donc le territoire,
  // pas une marque qu'on devinerait.
  pending: { glyph: 'card', tone: 'warn', pulse: true, bg: 'var(--action-forme)' },
  loading: { glyph: 'card', tone: 'warn', pulse: true, bg: 'var(--action-forme)' },
  failed: { glyph: 'alert', tone: 'stop', pulse: false, bg: 'var(--stop)' },
};

export default function PaymentReturn() {
  const { t } = useTranslation('lms');
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const { user } = useAuth();
  const path = useLocalizedPath();
  const reveal = useReveal<HTMLDivElement>();

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

  const issue = ISSUE[status];
  const asOf = transaction?.createdAt ? new Date(transaction.createdAt) : new Date();

  const statusLabel = {
    loading: t('paymentReturn.statusChecking'),
    pending: t('paymentReturn.statusPending'),
    completed: t('paymentReturn.statusPaid'),
    failed: t('paymentReturn.statusFailed'),
  }[status];

  const titleLines = {
    loading: t('paymentReturn.verifyingTitleLines', { returnObjects: true }),
    pending: t('paymentReturn.pendingTitleLines', { returnObjects: true }),
    completed: t('paymentReturn.confirmedTitleLines', { returnObjects: true }),
    failed: t('paymentReturn.failedTitleLines', { returnObjects: true }),
  }[status] as string[];

  const lede = {
    loading: t('paymentReturn.verifyingText'),
    pending: t('paymentReturn.pendingText'),
    completed: t('paymentReturn.confirmedText', { title: transaction?.formationTitle ?? '' }),
    failed: t('paymentReturn.failedText'),
  }[status];

  const foot = {
    loading: t('paymentReturn.pendingFoot'),
    pending: t('paymentReturn.pendingFoot'),
    completed: t('paymentReturn.confirmedFoot'),
    failed: t('paymentReturn.failedFoot'),
  }[status];

  let actions: ReactNode = null;
  if (status === 'completed') {
    actions = (
      <>
        {transaction?.formationSlug && (
          <Button tone="digitalise" href={path(`/cours/${transaction.formationSlug}`)} className="rv" style={{ ['--i' as string]: 6, marginTop: '20px' }}>
            {t('paymentReturn.startCourse')}
          </Button>
        )}
        <Button tone="quiet" fullWidth href={path('/mon-espace')} className="rv" style={{ ['--i' as string]: 7, marginTop: '10px' }}>
          {t('paymentReturn.goToSpace')}
        </Button>
      </>
    );
  } else if (status === 'failed') {
    actions = (
      <>
        <Button tone="forme" href={path('/formations')} className="rv" style={{ ['--i' as string]: 6, marginTop: '20px' }}>
          {t('paymentReturn.backToFormations')}
        </Button>
        <Button tone="quiet" fullWidth href={path('/contact')} className="rv" style={{ ['--i' as string]: 7, marginTop: '10px' }}>
          {t('paymentReturn.contactUs')}
        </Button>
      </>
    );
  } else {
    actions = (
      <Button tone="quiet" fullWidth href={path('/mon-espace')} className="rv" style={{ ['--i' as string]: 6, marginTop: '20px' }}>
        {t('paymentReturn.goToSpace')}
      </Button>
    );
  }

  return (
    <div className="relative min-h-screen isolate overflow-hidden flex items-center justify-center px-[18px] py-16">
      <Mesh territory="forme" />

      <DsNavHost className="relative z-[3] w-full max-w-[440px]">
        <div ref={reveal}>
          {/*
            Le glyphe du kit : 70 px, rayon 22, et les deux anneaux quand on attend.
            `currentColor` porte l'anneau — `.pulse::before` le dessine en `2px solid
            currentColor` —, d'où l'encre blanche fixe sur une surface colorée qui, elle, ne
            bascule pas de thème.
          */}
          <div
            className={`${issue.pulse ? 'pulse ' : ''}rv-s`}
            aria-hidden="true"
            style={{
              width: '70px', height: '70px', borderRadius: '22px', background: issue.bg,
              display: 'grid', placeItems: 'center', color: 'var(--text-invert)',
              boxShadow: 'var(--sh-bleu)',
            }}
          >
            <Icon name={issue.glyph} size={30} color="var(--text-invert)" strokeWidth={issue.glyph === 'check' ? 3.4 : 2.4} />
          </div>

          {/* L'attente doit s'ANNONCER, pas seulement pulser : un anneau n'est rien pour qui
              ne le voit pas. */}
          {issue.pulse && <span className="sr-only" role="status" aria-live="polite">{t('paymentReturn.waitingAria')}</span>}

          <SiteDisplay lines={titleLines} size={30} as="h1" style={{ marginTop: '24px' }} />

          <p className="rv text-lede text-ink-2 mt-3" style={{ ['--i' as string]: 4 }}>{lede}</p>

          <GlassPanel level="flat" padding={17} className="rv mt-[22px]" style={{ ['--i' as string]: 5 }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-meta text-ink-2">{t('paymentReturn.reference')}</span>
              {/* Une référence de transaction est une donnée de base : elle passe par <Num>,
                  qui est le seul chemin du dépôt vers la monospace. */}
              <Num value={transaction?.id ?? transactionId} source="db" asOf={asOf} style={{ fontSize: '13px' }} />
            </div>
            <div className="flex items-center justify-between gap-3 mt-2.5">
              <span className="text-meta text-ink-2">{t('paymentReturn.statusLabel')}</span>
              <Tag tone={issue.tone}>{statusLabel}</Tag>
            </div>
            {/* Le montant RÉELLEMENT débité, écrit par la fonction serveur au moment de la
                charge. Il n'apparaît que quand il existe : un zéro inventé serait pire. */}
            {typeof transaction?.amount === 'number' && (
              <div className="flex items-center justify-between gap-3 mt-2.5">
                <span className="text-meta text-ink-2">{t('paymentReturn.amountDebited')}</span>
                <Num value={transaction.amount} unit={transaction.currency || 'XOF'} source="server" asOf={asOf} style={{ fontSize: '13px' }} />
              </div>
            )}
          </GlassPanel>

          {actions}

          <p className="rv text-small text-ink-2 text-center mt-3.5" style={{ ['--i' as string]: 8 }}>{foot}</p>
        </div>
      </DsNavHost>
    </div>
  );
}
