import { useState, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot } from 'firebase/firestore';
import { Icon, Num, Tag, type TagTone } from '@ds';
import { db } from '../../config/db';
import { useReveal } from '../../components/site';
import DsNavHost from '../../components/layout/DsNavHost';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { trackPurchase } from '../../lib/tracking';
import { clearCartPending } from '../../lib/popups/cart';
import { useAuth } from '../../contexts/AuthContext';
import { getClubSubscription } from '../../lib/firestore';
import { estMembreActif } from '../../lib/club/membership';
import type { Transaction } from '../../types';

import PayStepper from '../../components/edu/g2/PayStepper';
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
  const { user, userData } = useAuth();
  const path = useLocalizedPath();
  const reveal = useReveal<HTMLDivElement>();

  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  /**
   * Membre du Club ? `null` tant qu'on n'a pas lu — et c'est une TROISIÈME valeur, pas un
   * `false` par défaut. La passerelle ne s'affiche que sur un `false` avéré : sur l'écran de
   * succès d'un paiement, un panneau qui apparaît une seconde après coup se lit comme une
   * relance déclenchée par l'achat.
   */
  const [clubActif, setClubActif] = useState<boolean | null>(null);

  /*
   * L'appartenance au Club, lue une fois. Un échec de lecture laisse `null` : la passerelle
   * ne s'affiche pas, ce qui est le côté sûr — proposer le Club à un membre serait la seule
   * erreur que cette section puisse commettre, et elle est vexante.
   */
  useEffect(() => {
    if (!user) return;
    let annule = false;
    getClubSubscription(user.uid)
      .then((sub) => { if (!annule) setClubActif(estMembreActif(sub)); })
      .catch(() => { /* Lecture indisponible : on ne propose rien plutôt que de se tromper. */ });
    return () => { annule = true; };
  }, [user]);

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
  const prenom = (userData?.displayName || user?.displayName || '').trim().split(/\s+/)[0] ?? '';

  const statusLabel = {
    loading: t('paymentReturn.statusChecking'),
    pending: t('paymentReturn.statusPending'),
    completed: t('paymentReturn.statusPaid'),
    failed: t('paymentReturn.statusFailed'),
  }[status];

  /* Le titre en capitales de la maquette : « C'est parti, Aïssatou. » avec le prénom RÉEL
     du compte, et sans prénom quand on ne le connaît pas — jamais un prénom d'exemple. */
  const title = {
    loading: (t('paymentReturn.verifyingTitleLines', { returnObjects: true }) as string[]).join(' '),
    pending: (t('paymentReturn.pendingTitleLines', { returnObjects: true }) as string[]).join(' '),
    completed: prenom ? t('welcomeV3.titleNamed', { name: prenom }) : t('welcomeV3.title'),
    failed: (t('paymentReturn.failedTitleLines', { returnObjects: true }) as string[]).join(' '),
  }[status];

  const lede = {
    loading: t('paymentReturn.verifyingText'),
    pending: t('paymentReturn.pendingText'),
    completed: transaction?.formationTitle
      ? t('welcomeV3.lede', { title: transaction.formationTitle })
      : t('welcomeV3.ledeNoTitle'),
    failed: t('paymentReturn.failedText'),
  }[status];

  const foot = {
    loading: t('paymentReturn.pendingFoot'),
    pending: t('paymentReturn.pendingFoot'),
    completed: t('paymentReturn.confirmedFoot'),
    failed: t('paymentReturn.failedFoot'),
  }[status];

  /* L'application native : un lien profond, seulement sur téléphone et hors échec. */
  const surTelephone = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const lienApp = transactionId && surTelephone && status !== 'failed'
    ? `rysmo://acces?transactionId=${encodeURIComponent(transactionId)}`
    : null;

  let actions: ReactNode;
  if (status === 'completed') {
    actions = (
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <a href={path('/mon-espace')} className="text-[14px] font-semibold">{t('welcomeV3.later')}</a>
        {transaction?.formationSlug && (
          <a className="mm-pill" href={path(`/cours/${transaction.formationSlug}`)}>
            {t('paymentReturn.startCourse')}
            <i aria-hidden="true"><Icon name="arrow-up-right" size={15} /></i>
          </a>
        )}
      </div>
    );
  } else if (status === 'failed') {
    /* Le chemin de reprise : le tunnel de la formation concernée quand on la connaît. */
    const retryHref = transaction?.formationSlug ? path(`/checkout/${transaction.formationSlug}`) : path('/formations');
    actions = (
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <a href={path('/contact')} className="text-[14px] font-semibold">{t('paymentReturn.contactUs')}</a>
        <div className="flex flex-wrap gap-2.5">
          {transaction?.formationSlug && (
            <a className="mm-pill is-plain" href={path(`/formations/${transaction.formationSlug}`)}>{t('paymentReturn.backToFormation')}</a>
          )}
          <a className="mm-pill" href={retryHref}>
            {transaction?.formationSlug ? t('paymentReturn.retry') : t('paymentReturn.backToFormations')}
            <i aria-hidden="true"><Icon name="arrow-up-right" size={15} /></i>
          </a>
        </div>
      </div>
    );
  } else {
    actions = (
      <div className="mt-5 flex justify-end">
        <a className="mm-pill is-plain" href={path('/mon-espace')}>{t('paymentReturn.goToSpace')}</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-[60px]" style={{ background: 'var(--paper-2)' }}>
      <DsNavHost>
        <div ref={reveal}>
          {/* ── LA BANDE DE NUIT ─────────────────────────────────────────────── */}
          <section
            className="dk relative isolate overflow-hidden px-6 pb-16 pt-7 text-center"
            style={{ background: 'var(--night)', borderRadius: '0 0 36px 36px' }}
          >
            <div className="mm-mesh m-edu" style={{ opacity: 0.6 }}><b /><b /><b /></div>
            <div className="relative flex justify-center">
              <PayStepper
                current={status === 'completed' ? 3 : 2}
                labels={[t('checkoutV3.step1'), t('checkoutV3.step2'), t('checkoutV3.step3')]}
                tone="night"
              />
            </div>
            <div className="relative pt-14">
              {/* L'attente garde le moment signature du kit (`mm-payring`) : deux anneaux qui
                  sortent de la pastille tant que le paiement n'est pas confirmé. */}
              <span
                className={issue.pulse ? 'mm-payring mm-tag' : 'mm-tag'}
                style={{
                  background: `color-mix(in srgb, ${status === 'failed' ? 'var(--stop)' : 'var(--mm-teal-f)'} 20%, transparent)`,
                  color: status === 'failed' ? 'var(--stop)' : 'var(--mm-teal-n)',
                }}
              >
                <Icon name={issue.glyph} size={13} />
                {statusLabel}
                {status === 'completed' && typeof transaction?.amount === 'number' && (
                  <> · <Num value={transaction.amount} unit={transaction.currency === 'XOF' || !transaction.currency ? 'F' : transaction.currency} source="server" asOf={asOf} showAsOf={false} /></>
                )}
              </span>
              {issue.pulse && <span className="sr-only" role="status" aria-live="polite">{t('paymentReturn.waitingAria')}</span>}
              {status === 'completed' && (
                <span className="mm-script mt-[22px] block text-[28px] wide:text-[34px]">{t('welcomeV3.script')}</span>
              )}
              <h1 className="mm-up mx-auto my-3.5 max-w-[14ch] text-[color:var(--paper-fixed)]" style={{ fontSize: 'clamp(48px, 8vw, 110px)' }}>
                {title}
              </h1>
              <p className="mx-auto my-0 max-w-[46ch] text-[17px] text-[color:color-mix(in_srgb,var(--paper-fixed)_80%,transparent)]">{lede}</p>
            </div>
          </section>

          <div className="relative mx-auto -mt-[30px] max-w-[760px] px-4 stack:px-6">
            {status === 'completed' ? (
              /*
                ── LES TROIS RÉGLAGES DE LA MAQUETTE, SANS FAUX INTERRUPTEUR ──────────────
                Rythme, cohorte, rappels WhatsApp : aucun des trois n'a de producteur. Pas de
                champ de rythme sur le compte, aucune cohorte en base, aucun envoi WhatsApp.
                Les cartes gardent leur place et leur ordre, mais disent ce qui est vrai
                aujourd'hui au lieu d'offrir des commandes qui ne retiendraient rien.
              */
              <div className="flex flex-col gap-3.5">
                {(['rhythm', 'cohort', 'reminders'] as const).map((k, i) => (
                  <div key={k} className="mm-card" style={{ padding: '24px' }}>
                    <span className="text-[12px] text-ink-3">{t('welcomeV3.stepOf', { n: i + 1 })}</span>
                    <div className="flex items-start justify-between gap-3.5">
                      <div>
                        <b className="mb-1 mt-1.5 block text-[19px] leading-[1.2]">{t(`welcomeV3.${k}Title`)}</b>
                        <p className="m-0 text-[14px] text-ink-2">{t(`welcomeV3.${k}Body`)}</p>
                      </div>
                      <span className="mm-tag shrink-0">{t('welcomeV3.notYet')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mm-card" style={{ padding: '24px' }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-meta text-ink-2">{t('paymentReturn.reference')}</span>
                  <Num value={transaction?.id ?? transactionId} source="db" asOf={asOf} style={{ fontSize: '13px' }} />
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <span className="text-meta text-ink-2">{t('paymentReturn.statusLabel')}</span>
                  <Tag tone={issue.tone}>{statusLabel}</Tag>
                </div>
                {typeof transaction?.amount === 'number' && (
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <span className="text-meta text-ink-2">{t('paymentReturn.amountDebited')}</span>
                    <Num value={transaction.amount} unit={transaction.currency || 'XOF'} source="server" asOf={asOf} style={{ fontSize: '13px' }} />
                  </div>
                )}
              </div>
            )}

            {actions}

            {lienApp && (
              <div className="mt-3 text-right">
                <a className="mm-pill is-plain" href={lienApp}>{t('paymentReturn.openApp')}</a>
                <p className="m-0 mt-2 text-meta-2 text-ink-3">{t('paymentReturn.openAppHint')}</p>
              </div>
            )}

            {/* La passerelle vers le Club : du contenu d'écran, jamais une pop-up, et seulement
                sur un FAIT (abonnement lu et inactif). Aucun chiffre. */}
            {status === 'completed' && clubActif === false && (
              <div className="mm-card mt-3.5" style={{ padding: '20px' }}>
                <p className="m-0 text-meta font-bold text-ink">{t('paymentReturn.clubTitle')}</p>
                <p className="m-0 mt-1.5 text-meta-2 leading-[1.55] text-ink-2">{t('paymentReturn.clubBody')}</p>
                <a className="mm-pill is-plain is-sm mt-3" href={path('/club-des-digitos')}>{t('paymentReturn.clubCta')}</a>
              </div>
            )}

            <p className="m-0 mt-3.5 text-[12.5px] text-ink-2">{foot}</p>
          </div>
        </div>
      </DsNavHost>
    </div>
  );
}
