import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { Button, EmptyState, Field, GlassPanel, Icon, LessonRow, Mesh, Num, Skeleton, StepDots, useToast } from '@ds';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, useLocalizedPath } from '../../contexts/LanguageContext';
import { localizedPath } from '../../i18n/routing';
import { SiteDisplay, SiteEyebrow, useReveal } from '../../components/site';
import DsNavHost from '../../components/layout/DsNavHost';
import { getFormationBySlug } from '../../lib/firestore';
import { functions } from '../../config/firebase';
import { db } from '../../config/db';
import type { Formation } from '../../types';
import { generateEventId } from '../../lib/meta-pixel';
import { trackBeginCheckout, trackPurchase } from '../../lib/tracking';
import { markCartPending } from '../../lib/popups/cart';

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
const quoteCheckout = httpsCallable<
  { formationId: string; couponCode?: string },
  { basePrice: number; couponDiscount: number; finalPrice: number; couponApplied: boolean }
>(functions, 'quoteCheckout');

const createBictorysCharge = httpsCallable<
  { formationId: string; formationSlug: string; metaEventId?: string; couponCode?: string },
  { checkoutUrl: string; transactionId: string }
>(functions, 'createBictorysCharge');

/** Les trois moyens que la page hébergée accepte. Aucun logo de marque : pas de dégradé
 *  tiers à faire entrer par l'échappatoire d'AD-2 pour une ligne qui ne se clique pas. */
const METHODS = [
  { key: 'Wave', glyph: 'send' as const },
  { key: 'Om', glyph: 'card' as const },
  { key: 'Card', glyph: 'card' as const },
];

export default function Checkout() {
  const { t } = useTranslation('lms');
  const { slug } = useParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const path = useLocalizedPath();
  const reveal = useReveal<HTMLDivElement>();

  const [formation, setFormation] = useState<Formation | null | undefined>(undefined);
  const [couponCode, setCouponCode] = useState('');
  /** Le devis serveur. `null` tant qu'il n'a pas répondu — voir plus bas. */
  const [quote, setQuote] = useState<{ finalPrice: number; couponDiscount: number; couponApplied: boolean } | null>(null);
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

  if (formation === undefined) {
    return (
      <Frame>
        <GlassPanel level="flat" padding={18}>
          <Skeleton width="45%" height={19} label={t('certificate.loadingAria')} />
          <Skeleton width="80%" height={30} style={{ marginTop: '16px' }} />
          <Skeleton height={68} radius="var(--r-m)" style={{ marginTop: '20px' }} />
          <Skeleton height={68} radius="var(--r-m)" style={{ marginTop: '10px' }} />
        </GlassPanel>
      </Frame>
    );
  }

  if (!formation) {
    return (
      <Frame>
        <SiteDisplay lines={t('checkout.notFoundLines', { returnObjects: true }) as string[]} size={30} />
        <GlassPanel level="flat" padding={20} className="mt-[18px]">
          <EmptyState
            glyph={<Icon name="book" size={26} color="var(--text-muted)" />}
            title={t('checkout.notFoundTitle')}
            action={<Button tone="quiet" fullWidth href={path('/formations')}>{t('checkout.backToFormations')}</Button>}
            style={{ padding: 0 }}
          />
        </GlassPanel>
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
      setQuote({ finalPrice: data.finalPrice, couponDiscount: data.couponDiscount, couponApplied: data.couponApplied });
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
      <Frame>
        <SiteDisplay lines={t('checkout.successLines', { returnObjects: true }) as string[]} size={30} />
        <p className="text-lede text-ink-2 mt-3">{t('checkout.successText', { title: formation.title })}</p>
        <Button tone="digitalise" href={path(`/cours/${formation.slug}`)} className="mt-5">
          {t('checkout.startCourse')}
        </Button>
        <Button tone="quiet" fullWidth href={path('/formations')} className="mt-2.5">
          {t('checkout.seeOtherFormations')}
        </Button>
      </Frame>
    );
  }

  return (
    <Frame back={{ href: path(`/formations/${formation.slug}`), label: t('checkout.backToFormation') }}
      center={t('checkout.stepOf', { current: 2, total: 3 })}>
      <div ref={reveal}>
        <StepDots
          total={3}
          current={2}
          label={t('checkout.stepsLabel')}
          steps={[t('checkout.step1'), t('checkout.step2'), t('checkout.step3')]}
          style={{ marginBottom: '20px' }}
        />

        <SiteDisplay
          lines={t(isFree ? 'checkout.freeTitleLines' : 'checkout.titleLines', { returnObjects: true }) as string[]}
          size={30}
        />

        {/* ── Le récapitulatif chiffré ───────────────────────────────────────
            Chaque montant passe par <Num source="db"> : il vient du catalogue Firestore, et
            `readAt` est l'instant où le navigateur l'a lu. La date de relevé n'est pas une
            décoration — c'est ce qui distingue « le prix est 95 000 » de « le prix ÉTAIT
            95 000 quand j'ai ouvert la page ». */}
        <GlassPanel
          level="flat" padding={18} className="rv mt-4"
          style={{ ['--i' as string]: 2 }}
          role="group" aria-label={t('checkout.summaryLabel')}
        >
          <p className="font-black text-ink text-body m-0">{formation.title}</p>

          <div className="mt-3">
            <LessonRow state="plain" icon={<Icon name="clock" size={14} />} title={t('checkout.durationLabel')} meta={formation.duration} />
            <LessonRow
              state="plain" icon={<Icon name="book" size={14} />} title={t('checkout.lessonsLabel')}
              meta={<Num value={lessonCount} source="db" asOf={readAt} />}
            />
            <LessonRow state="plain" icon={<Icon name="medal" size={14} />} title={t('checkout.certificateIncluded')} last />
          </div>

          {formation.promoPrice !== undefined && formation.promoPrice < formation.price && (
            <>
              <div className="flex items-center justify-between gap-3 mt-4">
                <span className="text-meta text-ink-2">{t('checkout.originalPrice')}</span>
                <s className="text-ink-2"><Num value={formation.price} source="db" asOf={readAt} /></s>
              </div>
              <div className="flex items-center justify-between gap-3 mt-2">
                <span className="text-meta text-ok font-medium">{t('checkout.discount')}</span>
                <span className="text-ok"><Num value={-(formation.price - formation.promoPrice)} source="db" asOf={readAt} /></span>
              </div>
            </>
          )}

          <div className="h-px bg-[color:var(--border-hair)] my-[13px]" />

          <div className="flex items-baseline justify-between gap-3">
            <b className="text-body">{t('checkout.total')}</b>
            {isFree
              ? <b className="text-ttl text-ok">{t('checkout.free')}</b>
              : <b style={{ fontSize: '23px' }}><Num value={finalPrice} unit="FCFA" source="db" asOf={readAt} /></b>}
          </div>
          {/* La phrase du kit, et elle n'est pas cosmétique : c'est le serveur qui recalcule
              le montant et applique le coupon. Ce total-ci est une lecture, pas un engagement. */}
          <p className="text-small text-ink-2 m-0 mt-1.5">{t('checkout.serverComputed')}</p>
        </GlassPanel>

        {!isFree && (
          <>
            {/* ── Les moyens acceptés — annoncés, pas choisis. Voir l'en-tête du fichier. */}
            <SiteEyebrow style={{ marginTop: '22px' }}>{t('checkout.methodsTitle')}</SiteEyebrow>
            <GlassPanel level="flat" padding="4px 18px" className="rv" style={{ ['--i' as string]: 3 }}>
              {METHODS.map((m, i) => (
                <LessonRow
                  key={m.key}
                  state="plain"
                  icon={<Icon name={m.glyph} size={14} />}
                  title={t(`checkout.method${m.key}`)}
                  meta={t(`checkout.method${m.key}Note`)}
                  last={i === METHODS.length - 1}
                />
              ))}
            </GlassPanel>
            <p className="rv text-small text-ink-2 mt-1.5" style={{ ['--i' as string]: 3 }}>{t('checkout.methodsNote')}</p>

            <div className="rv" style={{ ['--i' as string]: 4 }}>
              <Field
                label={t('checkout.couponLabel')}
                value={couponCode}
                onChange={(v) => { setCouponCode(v); setCouponError(''); }}
                placeholder={t('checkout.couponPlaceholder')}
                hint={quoting ? t('checkout.couponChecking') : t('checkout.couponHint')}
                error={couponError || undefined}
                autoComplete="off"
              />
              {/*
                LE CODE SE VALIDE SUR DEMANDE, PAS À LA FRAPPE.
                Un devis par caractère saisi, c'est une requête pour chaque lettre d'un code
                à huit signes, et surtout une erreur « code invalide » affichée pendant qu'on
                le tape. La demande explicite laisse finir d'écrire.
              */}
              <Button
                tone="quiet"
                size="sm"
                fullWidth={false}
                loading={quoting}
                disabled={quoting || !couponCode.trim()}
                onClick={() => void applyCoupon()}
                style={{ marginTop: '10px' }}
              >
                {t('checkout.couponApply')}
              </Button>
              {quote?.couponApplied && (
                <p className="mt-2 mb-0 text-small text-ok">
                  {t('checkout.couponApplied')}{' '}
                  <Num value={quote.couponDiscount} unit="FCFA" source="server" asOf={readAt} showAsOf={false} />
                </p>
              )}
            </div>
          </>
        )}

        <Button
          tone={isFree ? 'digitalise' : 'forme'}
          onClick={() => void handleSubmit()}
          loading={submitting}
          className="rv mt-5"
          style={{ ['--i' as string]: 6 }}
        >
          {/* Le libellé et le montant sont deux morceaux, pas une phrase interpolée : le
              montant doit passer par <Num> pour porter sa provenance, et une chaîne
              « Payer {{amount}} » l'aurait rendu en corps, sans source. */}
          {isFree ? t('checkout.confirmFree') : t('checkout.payLabel')}
          {!isFree && <Num value={finalPrice} unit="FCFA" source="db" asOf={readAt} />}
        </Button>

        <p className="rv text-small text-ink-2 text-center mt-2.5" style={{ ['--i' as string]: 7 }}>
          {isFree ? t('checkout.secureGuarantee') : t('checkout.leaveNote')}
        </p>
      </div>
    </Frame>
  );
}

/**
 * La coquille d'un écran de PILE : maillage, gouttière de 18 px, barre haute à bouton retour.
 * Pas de barre d'onglets — le kit est formel, seuls `Espace`, `Lecteur`, `Rysmo`, `Club` et
 * `MesNotes` en portent une, et un tunnel de commande n'en est pas.
 */
function Frame({
  children, back, center,
}: {
  children: React.ReactNode;
  back?: { href: string; label: string };
  center?: string;
}) {
  return (
    <div className="relative min-h-screen isolate overflow-hidden px-[18px] pt-4 pb-16">
      <Mesh territory="forme" />
      <DsNavHost className="relative z-[3] w-full max-w-[520px] mx-auto">
        {back && (
          <div className="flex items-center gap-3 h-12 mb-2">
            <a href={back.href} aria-label={back.label} className="mm-touch-extend inline-grid place-items-center w-touch h-touch rounded-full text-ink-2">
              <Icon name="back" size={19} strokeWidth={2.4} />
            </a>
            {center && <span className="flex-1 text-center text-meta font-semibold text-ink-2">{center}</span>}
            <span className="w-touch" aria-hidden="true" />
          </div>
        )}
        {children}
      </DsNavHost>
    </div>
  );
}
