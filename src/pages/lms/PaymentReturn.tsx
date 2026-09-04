import { useState, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button, GlassPanel, Icon, Mesh, Num, Tag, type TagTone } from '@ds';
import { db } from '../../config/db';
import { SiteDisplay, useReveal } from '../../components/site';
import DsNavHost from '../../components/layout/DsNavHost';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { trackPurchase } from '../../lib/tracking';
import { clearCartPending } from '../../lib/popups/cart';
import { useAuth } from '../../contexts/AuthContext';
import { getClubSubscription } from '../../lib/firestore';
import { estMembreActif } from '../../lib/club/membership';
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
    /*
      ── LE CHEMIN DE REPRISE, QUI AVAIT DISPARU DE L'ÉCRAN D'ÉCHEC ────────────────────────
      La maquette (`screens-pay-end.jsx` § Echec) donne comme action PRIMAIRE « Réessayer »,
      et en secondaire « Revenir à la formation ». Ici, le primaire renvoyait au CATALOGUE et
      le secondaire au formulaire de contact : quelqu'un dont le paiement vient d'échouer
      devait retrouver seul sa formation, puis refaire tout le tunnel. La clé
      `paymentReturn.retry` existait, et n'était appelée nulle part.

      Le pied de l'écran dit « ta commande reste ouverte 24 h » — encore faut-il une porte
      pour y revenir. Elle mène au tunnel de la formation concernée quand on la connaît ; à
      défaut seulement, au catalogue.
    */
    const retryHref = transaction?.formationSlug
      ? path(`/checkout/${transaction.formationSlug}`)
      : path('/formations');
    actions = (
      <>
        <Button tone="forme" href={retryHref} className="rv" style={{ ['--i' as string]: 6, marginTop: '20px' }}>
          {transaction?.formationSlug ? t('paymentReturn.retry') : t('paymentReturn.backToFormations')}
        </Button>
        {transaction?.formationSlug && (
          <Button tone="quiet" fullWidth href={path(`/formations/${transaction.formationSlug}`)} className="rv" style={{ ['--i' as string]: 7, marginTop: '10px' }}>
            {t('paymentReturn.backToFormation')}
          </Button>
        )}
        <Button tone="quiet" fullWidth href={path('/contact')} className="rv" style={{ ['--i' as string]: 8, marginTop: '10px' }}>
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

            ⚠️ L'ANNEAU N'EST PAS SUR LA TUILE — IL EN SORT. `.pulse::before` le dessine en
            `2px solid currentColor` et l'anime jusqu'à `scale(1.85)` : à mi-course il a déjà
            quitté les 70 px et se propage sur LE FOND DE PAGE. `color: var(--text-invert)`
            le peignait donc en blanc sur `--surface-page`, qui est blanc — le premier des
            deux moments scénarisés du produit ne se voyait pas en thème clair.

            Le kit pose `color:'#009FE3'` sur ce même conteneur (`ScreensPay.js:31`) : le bleu
            de l'opérateur, choisi précisément parce qu'il se lit HORS de la tuile. On prend
            `--mm-bleu`, la teinte du territoire de la tuile, et le seul bleu du système qui
            bascule seul — `#0057BC` en clair (5,7:1), `#6FB1FF` en nuit (8,66:1). Une valeur
            fixe échouerait dans l'un des deux modes, comme celle-ci échouait dans l'autre.

            Le glyphe, lui, garde son encre blanche : elle est portée par le `<Icon>`, sur la
            surface colorée qui ne bascule pas.
          */}
          <div
            className={`${issue.pulse ? 'pulse ' : ''}rv-s`}
            aria-hidden="true"
            style={{
              width: '70px', height: '70px', borderRadius: '22px', background: issue.bg,
              display: 'grid', placeItems: 'center', color: 'var(--mm-bleu)',
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

          {/*
            ── LA PASSERELLE VERS LE CLUB — du contenu d'écran, jamais une pop-up ────────────

            Deux raisons indépendantes, et chacune suffit : `/paiement/**` est dans
            `CHECKOUT_PATHS` du registre — « rien ne doit JAMAIS s'y afficher » — et surtout
            cet écran est monté sous `LmsLayout`, où `PopupManager` n'existe pas. La fenêtre
            ne pourrait pas s'ouvrir même si le registre l'autorisait.

            CE N'EST PAS UN TROISIÈME BOUTON. L'écran en porte déjà deux, et son objet tient
            en quatre mots : c'est payé, va apprendre. Le panneau se pose APRÈS les actions,
            en encre secondaire, et ne demande rien — il nomme une porte.

            ⚠️ IL NE S'AFFICHE QUE SUR UN FAIT. Tant que l'abonnement n'a pas été lu,
            `clubActif` vaut `null` et rien ne s'affiche : un panneau qui apparaît puis
            disparaît sur l'écran de succès d'un paiement serait pire que pas de panneau.

            ⚠️ AUCUN CHIFFRE ICI. `/club-des-digitos` affiche le prix trois fois ; le répéter
            sur l'écran de quelqu'un qui vient de payer transformerait une porte en relance.
          */}
          {status === 'completed' && clubActif === false && (
            <GlassPanel level="flat" padding={17} className="rv mt-3.5" style={{ ['--i' as string]: 8 }}>
              <p className="m-0 text-meta font-bold text-ink">{t('paymentReturn.clubTitle')}</p>
              <p className="m-0 mt-1.5 text-meta-2 leading-[1.55] text-ink-2">
                {t('paymentReturn.clubBody')}
              </p>
              <Button
                tone="quiet"
                size="sm"
                fullWidth={false}
                href={path('/club-des-digitos')}
                style={{ marginTop: '12px' }}
              >
                {t('paymentReturn.clubCta')}
              </Button>
            </GlassPanel>
          )}

          <p className="rv text-small text-ink-2 text-center mt-3.5" style={{ ['--i' as string]: 9 }}>{foot}</p>
        </div>
      </DsNavHost>
    </div>
  );
}
