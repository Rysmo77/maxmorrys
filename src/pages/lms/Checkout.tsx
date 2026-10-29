import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { Button, EmptyState, Field, Icon, Num, Skeleton, Wordmark, useToast } from '@ds';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, useLocalizedPath } from '../../contexts/LanguageContext';
import { localizedPath } from '../../i18n/routing';
import { useReveal } from '../../components/site';
import DsNavHost from '../../components/layout/DsNavHost';
import { PriceApprox, PriceFootnote } from '../../components/shared/PriceApprox';
import { getFormationBySlug } from '../../lib/firestore';
import EduCover from '../../components/edu/g2/EduCover';
import PayStepper from '../../components/edu/g2/PayStepper';
import { functions } from '../../config/firebase';
import { db } from '../../config/db';
import type { Formation } from '../../types';
import { generateEventId } from '../../lib/meta-pixel';
import { trackBeginCheckout, trackPurchase } from '../../lib/tracking';
import { markCartPending } from '../../lib/popups/cart';
import { accepteAchat, ouverture } from '../../types/formationRelease';
import { useFormat } from '../../hooks/useFormat';

import Bento from '../../components/formations/Bento';
/**
 * LE TUNNEL DE COMMANDE — étape 2 sur 3 (`ScreensPay.js` · `Paiement`).
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * POURQUOI IL N'Y A PAS DE `PayOption` SUR CET ÉCRAN, ALORS QUE LE KIT EN MET TROIS
 *
 * `PayOption` rend un vrai `<input type="radio">` partageant un `name` : c'est le navigateur
 * qui porte l'exclusivité du choix, et c'est exactement ce qu'il faut QUAND IL Y A UN CHOIX
 * À FAIRE. Ici, il n'y en a pas.
 *
 * `createBictorysCharge` (`functions/src/payment.ts`) omet `payment_type` DÉLIBÉRÉMENT — son
 * commentaire le dit : « payment_type is intentionally omitted so the hosted page lets the
 * user pick Wave / Orange Money / card ». Le moyen de paiement se choisit sur la page hébergée
 * de l'opérateur, après la redirection. Trois boutons radio ici demanderaient une décision
 * que rien ne transporte : la personne cocherait « Wave », arriverait sur une page qui lui
 * redemande, et découvrirait que son choix n'a servi à rien. Sur un écran de paiement, c'est
 * le pire endroit du produit pour faire semblant.
 *
 * Les trois moyens sont donc ANNONCÉS — ils sont vrais, l'opérateur les accepte — sans être
 * présentés comme un contrôle. C'est la même décision que l'interrupteur grisé de `Switch` :
 * dire ce que le produit fait plutôt que laisser croire.
 *
 * ✅ L'ÉCART DU TOTAL EST FERMÉ — LE MONTANT AFFICHÉ EST CELUI QUI SERA DÉBITÉ.
 *
 * `finalPrice` était lu ICI, dans le navigateur, sur la copie de catalogue (`promoPrice ??
 * price`), tandis que le serveur validait le coupon et débitait `finalPrice - couponDiscount`.
 * Quelqu'un qui saisissait un code voyait donc « Payer 95 000 » et se faisait débiter moins.
 *
 * La correction n'a pas été « afficher le bon nombre » — ç'aurait été remettre deux calculs
 * en présence, qui auraient divergé au premier coupon d'un type nouveau. C'est `quoteCheckout`
 * (Worker) qui rend le total, et il appelle `resolveCheckoutTotal`, LA MÊME fonction que
 * `createBictorysCharge`. Les deux montants sortent de la même source : ils ne peuvent plus
 * se contredire, par construction.
 *
 * Le prix catalogue reste affiché tant que le devis n'a pas répondu — il est juste en
 * l'absence de coupon, qui est le cas courant, et il évite un écran vide au premier rendu.
 * ═════════════════════════════════════════════════════════════════════════════
 */

/**
 * LE DEVIS. Il ne crée rien, ne consomme aucun usage de coupon, et peut être rejoué à chaque
 * validation du champ de code. C'est lui qui rend le montant que l'écran affiche.
 */
/*
 * ⚠️ `clubApplied` N'EST PAS `clubMember`. On peut être membre ET voir le coupon l'emporter :
 * les deux remises ne se cumulent pas, le serveur retient la meilleure. L'écran doit dire
 * LAQUELLE a joué, sinon un code promo valide passerait pour non reconnu.
 */
const quoteCheckout = httpsCallable<
  { formationId: string; couponCode?: string },
  {
    basePrice: number;
    couponDiscount: number;
    clubDiscount: number;
    clubMember: boolean;
    finalPrice: number;
    couponApplied: boolean;
    clubApplied: boolean;
  }
>(functions, 'quoteCheckout');

const createBictorysCharge = httpsCallable<
  { formationId: string; formationSlug: string; metaEventId?: string; couponCode?: string },
  { checkoutUrl: string; transactionId: string }
>(functions, 'createBictorysCharge');

/** Les trois moyens que la page hébergée accepte. Aucun logo de marque : pas de dégradé
 *  tiers à faire entrer par l'échappatoire d'AD-2 pour une ligne qui ne se clique pas. */
/* Les pastilles des opérateurs : leurs initiales sur un aplat du système (aucune couleur de
   marque tierce en dur — AD-2). */
const METHODS = [
  { key: 'Wave', mark: 'W', bg: 'var(--mm-bleu-f)' },
  { key: 'Om', mark: 'OM', bg: 'var(--mm-orange-f)' },
  { key: 'Card', mark: 'CB', bg: 'var(--ink-fixed)' },
];

export default function Checkout() {
  const { t } = useTranslation('lms');
  const { slug } = useParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { addToast } = useToast();
  const { formatDate } = useFormat();
  const navigate = useNavigate();
  const path = useLocalizedPath();
  const reveal = useReveal<HTMLDivElement>();

  const [formation, setFormation] = useState<Formation | null | undefined>(undefined);
  const [couponCode, setCouponCode] = useState('');
  /** Le devis serveur. `null` tant qu'il n'a pas répondu — voir plus bas. */
  const [quote, setQuote] = useState<{
    finalPrice: number;
    couponDiscount: number;
    couponApplied: boolean;
    clubDiscount: number;
    clubApplied: boolean;
  } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  /** L'instant de la lecture du catalogue : c'est la date de relevé du prix affiché. */
  const [readAt, setReadAt] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!slug) return;
    getFormationBySlug(slug).then((data) => {
      setFormation(data);
      setReadAt(new Date());
      if (data) {
        // Rappel de panier abandonné : levé au paiement abouti, expire seul à sept jours.
        markCartPending(data.slug);
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
      // ⚠️ `from` doit etre localise : Login le rejoue tel quel apres connexion.
      navigate(localizedPath('/connexion', language), {
        state: { from: { pathname: localizedPath(`/checkout/${slug}`, language) } },
      });
    }
  }, [user, navigate, slug, language]);

  /*
   * ── LE DEVIS D'OUVERTURE, SANS COUPON ────────────────────────────────────────────────
   *
   * Il n'y en avait pas : le serveur n'était interrogé qu'au moment où quelqu'un tapait un
   * code. C'était sans conséquence tant que la seule remise venait d'un coupon — le prix
   * catalogue était alors le bon.
   *
   * La remise membre du Club change ça. Elle ne se demande pas, elle se CONSTATE : sans cet
   * appel, un membre verrait le prix plein à l'écran et se ferait débiter moins. L'écart
   * jouerait en sa faveur, il serait invisible, et ce serait exactement le défaut que
   * `resolveCheckoutTotal` a été écrit pour fermer — repassé par la porte de l'affichage.
   *
   * ⚠️ IL EST ICI, AVANT LES RETOURS ANTICIPÉS, ET PAS PLUS BAS. Posé après le premier
   * `return`, il n'était appelé que sur certains rendus — `react-hooks/rules-of-hooks` l'a
   * refusé, et il avait raison : l'ordre des hooks aurait changé d'un rendu à l'autre.
   * Le prix catalogue est donc recalculé ici plutôt que lu dans une variable définie plus
   * bas ; c'est le prix de l'emplacement correct.
   *
   * ⚠️ Un échec laisse `quote` à `null`, donc le prix catalogue : le prix SANS remise, donc
   * jamais un montant inférieur à ce qui sera débité. C'est le bon côté pour se tromper.
   */
  useEffect(() => {
    if (!formation) return;
    if ((formation.promoPrice ?? formation.price) === 0) return;
    let annule = false;
    quoteCheckout({ formationId: formation.id })
      .then(({ data }) => {
        if (annule) return;
        setQuote({
          finalPrice: data.finalPrice,
          couponDiscount: data.couponDiscount,
          couponApplied: data.couponApplied,
          clubDiscount: data.clubDiscount,
          clubApplied: data.clubApplied,
        });
      })
      .catch(() => { /* Prix catalogue conservé : voir ci-dessus. */ });
    return () => { annule = true; };
  }, [formation]);

  if (formation === undefined) {
    return (
      <Frame>
        <Bento padding={18}>
          <Skeleton width="45%" height={19} label={t('certificate.loadingAria')} />
          <Skeleton width="80%" height={30} style={{ marginTop: '16px' }} />
          <Skeleton height={68} radius="var(--r-m)" style={{ marginTop: '20px' }} />
          <Skeleton height={68} radius="var(--r-m)" style={{ marginTop: '10px' }} />
        </Bento>
      </Frame>
    );
  }

  if (!formation) {
    return (
      <Frame>
        <h1 className="mm-d m-0 text-[34px]">{t('checkout.notFoundTitle')}</h1>
        <Bento padding={20} className="mt-[18px]">
          <EmptyState
            glyph={<Icon name="book" size={26} color="var(--text-muted)" />}
            title={t('checkout.notFoundTitle')}
            action={<Button tone="quiet" fullWidth href={path('/formations')}>{t('checkout.backToFormations')}</Button>}
            style={{ padding: 0 }}
          />
        </Bento>
      </Frame>
    );
  }

  /*
   * ══════════════════════════════════════════════════════════════════════════════════════
   * UNE FORMATION À VENIR N'A PAS DE TUNNEL — SAUF SI LA PRÉCOMMANDE EST OUVERTE.
   *
   * `getFormationBySlug` la rend, puisqu'elle est publiée : sans cet écran, on entrerait
   * dans le tunnel, `markCartPending` poserait un marqueur de panier, et le devis reviendrait
   * en erreur serveur — la personne resterait devant un formulaire de paiement cassé.
   *
   * ⚠️ Cet écran est un REFLET, pas un garde-fou. L'autorité est `resolveCheckoutTotal`
   * (Worker), qui refuse le devis ET le débit ; et pour une formation gratuite, la règle
   * `isFreeFormation` de `firestore.rules`, qui refuse l'auto-inscription. Les deux tiennent
   * même si quelqu'un ouvre `/checkout/<slug>` à la main.
   * ══════════════════════════════════════════════════════════════════════════════════════
   */
  if (!accepteAchat(formation)) {
    const quand = ouverture(formation);
    return (
      <Frame>
        <h1 className="mm-d m-0 text-[34px]">{formation ? formation.title : t('checkout.notFoundTitle')}</h1>
        <Bento padding={20} className="mt-[18px]">
          <EmptyState
            glyph={<Icon name="lock" size={26} color="var(--warn)" />}
            title={t('checkout.comingSoonTitle')}
            body={quand
              ? t('checkout.comingSoonBodyDated', {
                date: quand.kind === 'date' ? formatDate(quand.value) : quand.value,
              })
              : t('checkout.comingSoonBody')}
            action={(
              <Button tone="quiet" fullWidth href={path(`/formations/${formation.slug}`)}>
                {t('checkout.comingSoonAction')}
              </Button>
            )}
            style={{ padding: 0 }}
          />
        </Bento>
      </Frame>
    );
  }

  /*
   * ── LE MONTANT AFFICHÉ VIENT DU SERVEUR DÈS QU'IL A RÉPONDU ────────────────────────────
   *
   * `quote` est `null` tant que le devis n'est pas revenu. On retombe alors sur le prix
   * catalogue, qui est JUSTE en l'absence de coupon — le cas courant — et qui évite un
   * écran de paiement vide au premier rendu. Dès qu'un code est validé, c'est le montant
   * du serveur qui s'affiche, et c'est exactement celui qui sera débité.
   */
  const catalogPrice = formation.promoPrice ?? formation.price;
  const finalPrice = quote?.finalPrice ?? catalogPrice;
  const isFree = catalogPrice === 0;
  const lessonCount = (formation.modules ?? []).reduce((a, m) => a + m.lessons.length, 0);

  /**
   * Demande au serveur ce que coûterait cette commande avec ce code.
   *
   * ⚠️ ON N'AFFICHE JAMAIS UN TOTAL QU'ON A CALCULÉ SOI-MÊME. En cas d'échec — code refusé,
   * réseau coupé — `quote` retombe à `null` et l'écran réaffiche le prix catalogue, qui est
   * le prix sans coupon, donc vrai. Le contraire — garder un total remisé après un refus —
   * afficherait un montant que le paiement démentirait trente secondes plus tard.
   */
  const applyCoupon = async () => {
    if (!formation || !couponCode.trim()) return;
    setQuoting(true);
    setCouponError('');
    try {
      const { data } = await quoteCheckout({ formationId: formation.id, couponCode: couponCode.trim() });
      setQuote({
        finalPrice: data.finalPrice,
        couponDiscount: data.couponDiscount,
        couponApplied: data.couponApplied,
        clubDiscount: data.clubDiscount,
        clubApplied: data.clubApplied,
      });
      setReadAt(new Date());
    } catch (error: unknown) {
      setQuote(null);
      // Le serveur renvoie déjà une phrase lisible ; on ne la remplace que si elle manque.
      const message = (error as { message?: string })?.message;
      setCouponError(message || t('checkout.couponInvalid'));
    }
    setQuoting(false);
  };

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
          /*
           * ⚠️ LE CINQUIÈME ÉCRIVAIN DE TRANSACTION, ET LE SEUL QUI NE SOIT PAS DANS LE WORKER.
           *
           * L'inscription gratuite s'écrit depuis le navigateur — les règles Firestore
           * l'autorisent, bornée à `amount == 0` sur une formation réellement gratuite. Sans
           * cette ligne, toute inscription gratuite tomberait en « non réparti » dans le
           * relevé de revenu, alors que c'est exactement le début du parcours qu'on veut
           * mesurer : combien de gens entrent par le module gratuit.
           *
           * La valeur est FIGÉE à `'formation'` et les règles l'exigent : ce chemin ne sert
           * qu'aux formations, et il ne doit pas pouvoir se déclarer Club.
           */
          ligne: 'formation',
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
      <Frame step={3}>
        <section className="mm-card mx-auto max-w-[620px]" style={{ padding: '34px' }}>
          <h1 className="mm-d m-0 mb-1.5 text-[36px] wide:text-[44px]">{t('checkout.successLines.0')}</h1>
          <p className="m-0 text-ink-2">{t('checkout.successText', { title: formation.title })}</p>
          <div className="mt-6 flex flex-col gap-2.5">
            <a className="mm-pill" href={path(`/cours/${formation.slug}`)} style={{ justifyContent: 'space-between' }}>
              {t('checkout.startCourse')}
              <i aria-hidden="true"><Icon name="arrow-up-right" size={15} /></i>
            </a>
            <a className="mm-pill is-plain" href={path('/formations')} style={{ justifyContent: 'center' }}>{t('checkout.seeOtherFormations')}</a>
          </div>
        </section>
      </Frame>
    );
  }

  return (
    <Frame step={2} back={{ href: path(`/formations/${formation.slug}`), label: t('checkout.backToFormation') }}>
      <div ref={reveal} className="grid items-start gap-7 wide:grid-cols-[1.2fr_.8fr]">
        <section className="mm-card min-w-0" style={{ padding: '34px' }}>
          <h1 className="mm-d m-0 mb-1.5 text-[34px] wide:text-[44px]">
            {isFree ? t('checkout.freeTitleLines.0') : t('checkoutV3.title')}
          </h1>
          <p className="m-0 mb-6 text-ink-2">{isFree ? t('checkout.freeSubtitle') : t('checkoutV3.subtitle')}</p>

          <div className="flex flex-col gap-3">
            {!isFree && (
              <>
                {/*
                  ── LES MOYENS DE PAIEMENT : ANNONCÉS, PAS CHOISIS ─────────────────────────
                  La maquette dessine trois boutons radio et un champ « Numéro Wave ». Aucun des
                  deux ne transporterait rien : `createBictorysCharge` omet `payment_type`, et
                  c'est la page hébergée de l'opérateur qui fait choisir (voir l'en-tête). Les
                  trois lignes gardent le dessin de la maquette, SANS pastille de sélection et
                  sans champ de numéro.
                */}
                <ul className="m-0 flex list-none flex-col gap-3 p-0" aria-label={t('checkout.methodsTitle')}>
                  {METHODS.map((m) => (
                    <li key={m.key} className="flex items-center gap-3.5 rounded-[18px] border border-[color:var(--line)] bg-bento p-4">
                      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xs text-[14px] font-black" style={{ background: m.bg, color: 'var(--paper-fixed)' }}>
                        {m.mark}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block text-ink">{t(`checkout.method${m.key}`)}</b>
                        <span className="block text-[13px] text-ink-2">{t(`checkout.method${m.key}Note`)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="m-0 text-[13px] text-ink-2">{t('checkout.methodsNote')}</p>

                <div className="flex flex-wrap items-end gap-2.5">
                  <div className="min-w-[200px] flex-1">
                    <Field
                      label={t('checkout.couponLabel')}
                      value={couponCode}
                      onChange={(v) => { setCouponCode(v); setCouponError(''); }}
                      placeholder={t('checkout.couponPlaceholder')}
                      hint={quoting ? t('checkout.couponChecking') : t('checkout.couponHint')}
                      error={couponError || undefined}
                      autoComplete="off"
                      style={{ marginTop: 0 }}
                    />
                  </div>
                  {/* Le code se valide sur demande, pas à la frappe : un devis par lettre saisie,
                      et une erreur affichée pendant qu'on tape. */}
                  <Button
                    tone="quiet"
                    size="sm"
                    fullWidth={false}
                    loading={quoting}
                    disabled={quoting || !couponCode.trim()}
                    onClick={() => void applyCoupon()}
                  >
                    {t('checkout.couponApply')}
                  </Button>
                </div>
                {quote?.couponApplied && (
                  <p className="m-0 text-small text-ok">
                    {t('checkout.couponApplied')}{' '}
                    <Num value={quote.couponDiscount} unit="FCFA" source="server" asOf={readAt} showAsOf={false} />
                  </p>
                )}
                {/* « Le coupon n'a pas joué » n'est pas « le coupon est refusé » : la remise
                    membre, plus généreuse, l'emporte. */}
                {quote?.clubApplied && quote.couponDiscount > 0 && (
                  <p className="m-0 text-small text-ink-2">{t('checkout.couponBeatenByClub')}</p>
                )}
              </>
            )}

            <button
              type="button"
              className="mm-pill"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              aria-busy={submitting || undefined}
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              {/* Le libellé et le montant sont deux morceaux : le montant passe par <Num>. */}
              <span>
                {isFree ? t('checkout.confirmFree') : <>{t('checkout.payLabel')} <Num value={finalPrice} unit="F" source="db" asOf={readAt} showAsOf={false} /></>}
              </span>
              <i aria-hidden="true"><Icon name="arrow-up-right" size={15} /></i>
            </button>
            <span className="text-[12px] text-ink-3">
              {isFree ? t('checkout.secureGuarantee') : t('checkoutV3.legal')}
            </span>
          </div>
        </section>

        {/* Le récapitulatif passe en tête sur téléphone : on voit ce qu'on paie avant comment. */}
        <aside className="order-first min-w-0 wide:sticky wide:top-6 wide:order-none">
          <div className="mm-card flex flex-col gap-3.5" role="group" aria-label={t('checkout.summaryLabel')}>
            <EduCover
              title={formation.title}
              category={formation.category}
              slug={formation.slug}
              id={formation.id}
              kicker={`Max-Morrys Edu · ${formation.category}`}
              titleSize={40}
              titleWidth={300}
              style={{ height: '170px' }}
            />
            <b className="text-[19px] leading-[1.2]">{formation.title}</b>
            <span className="text-[13px] text-ink-2">
              {t('checkoutV3.facts', { count: lessonCount })}
              {formation.certificateEnabled ? ` · ${t('checkoutV3.factCert')}` : ''}
              {` · ${t('checkoutV3.factLifetime')}`}
            </span>

            <div className="grid grid-cols-[1fr_auto] gap-x-0 gap-y-2 border-t border-[color:var(--line)] pt-3 text-[14px]">
              <span>{t('checkoutV3.price')}</span>
              <b><Num value={formation.price} unit="F" source="db" asOf={readAt} showAsOf={false} /></b>
              {formation.promoPrice !== undefined && formation.promoPrice < formation.price && (
                <>
                  <span>{t('checkout.discount')}</span>
                  <b className="text-[color:var(--mm-teal-t)]"><Num value={-(formation.price - formation.promoPrice)} unit="F" source="db" asOf={readAt} showAsOf={false} /></b>
                </>
              )}
              {quote?.couponApplied && !quote.clubApplied && (
                <>
                  <span>{t('checkoutV3.couponLine')}</span>
                  <b className="text-[color:var(--mm-teal-t)]">− <Num value={quote.couponDiscount} unit="F" source="server" asOf={readAt} showAsOf={false} /></b>
                </>
              )}
              {/* La remise membre est CONSTATÉE par le serveur, jamais demandée ; elle se pose
                  au-dessus du total, qu'elle explique. `source="server"` : calculée, pas lue. */}
              {quote?.clubApplied && (
                <>
                  <span>{t('checkoutV3.clubLine')}</span>
                  <b className="text-[color:var(--mm-teal-t)]">− <Num value={quote.clubDiscount} unit="F" source="server" asOf={readAt} showAsOf={false} /></b>
                </>
              )}
              <span className="border-t border-[color:var(--line)] pt-2 font-bold">{t('checkoutV3.total')}</span>
              <b className="border-t border-[color:var(--line)] pt-2 text-right text-[20px]">
                {isFree ? t('checkout.free') : <Num value={finalPrice} unit="F" source="db" asOf={readAt} showAsOf={false} />}
              </b>
            </div>
            {/* La contrevaleur porte sur le montant QUI SERA DÉBITÉ, coupon déduit. */}
            {!isFree && <span className="text-right text-[12.5px] font-semibold text-ink-2"><PriceApprox xof={finalPrice} /></span>}
            {quote?.clubApplied && <span className="text-[12.5px] text-ink-2">{t('checkoutV3.clubAuto')}</span>}
            <span className="text-[12.5px] text-ink-2">{t('checkout.serverComputed')}</span>
            {!isFree && <PriceFootnote className="m-0" />}
          </div>
        </aside>
      </div>
    </Frame>
  );
}

/**
 * Le cadre plein écran de la maquette `Edu-Paiement` : fond `--paper-2`, une rangée haute
 * (marque · étapes 1-2-3 · « Paiement sécurisé »), le contenu sur 1180 px.
 */
function Frame({
  children, back, step = 2,
}: {
  children: React.ReactNode;
  back?: { href: string; label: string };
  step?: 1 | 2 | 3;
}) {
  const { t } = useTranslation('lms');
  return (
    <div className="min-h-screen" style={{ background: 'var(--paper-2)' }}>
      <DsNavHost className="mx-auto w-full max-w-[1180px] px-4 stack:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 py-[26px]">
          <a href={back?.href ?? '/'} aria-label={back?.label} className="flex items-center gap-2.5 text-ink no-underline">
            <Wordmark brand="kit" badge="EDU" />
          </a>
          <PayStepper
            current={step}
            labels={[t('checkoutV3.step1'), t('checkoutV3.step2'), t('checkoutV3.step3')]}
            className="order-last w-full justify-center stack:order-none stack:w-auto"
          />
          <span className="flex items-center gap-1.5 text-[13px] text-ink-2">
            <Icon name="lock" size={14} />
            {t('checkout.securePayment')}
          </span>
        </div>
        <div className="pb-[60px] pt-5">{children}</div>
      </DsNavHost>
    </div>
  );
}
