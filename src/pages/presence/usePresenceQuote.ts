import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@ds';
import { saveAgencyLead } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import { captureError } from '../../lib/sentry';
import { trackGenerateLead } from '../../lib/tracking';
import { SITE_URL } from '../../components/seo/seo-config';
import {
  SECTOR_KEYS, findPack, findPlan, computeTotals, type Recommendation,
} from '../../lib/presence/offer';
import { buildWhatsAppMessage, buildQuickMessage } from '../../lib/presence/whatsapp';
import type { AgencyPack, AgencyPlan } from '../../types';

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Numéros AOF : indicatif optionnel, espaces/points/tirets tolérés, 8 chiffres minimum.
const PHONE_RE = /^\+?[\d\s.-]{8,20}$/;

export const EMPTY_FORM = {
  businessName: '', contactName: '', phone: '', email: '', city: '',
  sector: SECTOR_KEYS[0] as string,
  pack: 'undecided' as AgencyPack,
  plan: 'undecided' as AgencyPlan,
  message: '', referralCode: '', _hp: '',
};

export type PresenceForm = typeof EMPTY_FORM;

/**
 * TOUTE LA LOGIQUE DE LA DEMANDE DE DEVIS — sortie du rendu, et pour une raison précise.
 *
 * Cette page portait quatorze `useState`, la composition du message WhatsApp, la
 * validation, l'envoi Firestore et le signal de remise à zéro d'un composant enfant,
 * le tout entrelacé dans mille lignes de JSX. Recomposer le rendu sans l'en extraire
 * revenait à réécrire la logique en même temps que la mise en page — c'est-à-dire à
 * casser les deux à la fois, sans qu'aucun test ne le dise (les treize tests du dépôt
 * portent sur `lib/`, aucun ne rend un composant).
 *
 * Rien ici n'a été retouché sur le fond : c'est un déplacement, pas une réécriture.
 */
export function usePresenceQuote() {
  const { t } = useTranslation('presence');
  const { formatPrice, language } = useFormat();
  const { addToast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  /**
   * Le SÉLECTEUR, qui n'avait aucune ancre et n'était donc atteignable par aucun lien.
   * Le bouton du héros s'appelle « Trouve ton pack en 3 questions » et menait au formulaire
   * de devis — neuf champs. La maquette écrit, dans la section que ce bouton devrait ouvrir :
   * « Pas de formulaire de dix champs. Trois questions sur ton commerce. » Le libellé tenu
   * par la traduction et l'action tenue par le code disaient deux choses différentes.
   */
  const selectorRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quoteRef, setQuoteRef] = useState('');
  const [copied, setCopied] = useState(false);
  /** Recommandation du sélecteur — badge « conseillé », distinct de la sélection. */
  const [reco, setReco] = useState<Recommendation | null>(null);
  /** Copie figée à l'envoi : le formulaire est vidé juste après, le message WhatsApp non. */
  const [submittedData, setSubmittedData] = useState<PresenceForm | null>(null);
  /** Incrémenté après envoi pour réinitialiser le sélecteur depuis le parent. */
  const [resetSignal, setResetSignal] = useState(0);

  /** Fait défiler jusqu'au formulaire en pré-sélectionnant l'offre cliquée. */
  const jumpToForm = useCallback((patch: Partial<PresenceForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSubmitted(false);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /** Fait défiler jusqu'aux TROIS QUESTIONS. Ne touche pas au formulaire : on n'a encore
   *  rien choisi, et la maquette insiste — aucune donnée personnelle n'est demandée avant
   *  d'avoir vu la recommandation. */
  const jumpToSelector = useCallback(() => {
    selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /**
   * Le sélecteur écrit dans le formulaire à CHAQUE réponse, pas seulement au clic
   * sur « Demander ce devis ». C'est ce qui garantit que modifier une réponse déjà
   * donnée met bien à jour la sélection — sinon le formulaire garde l'ancien pack
   * pendant que la carte surlignée, elle, a changé.
   */
  const handleRecommend = useCallback((r: Recommendation) => {
    setReco(r);
    setForm((prev) => ({ ...prev, pack: r.pack, plan: r.plan }));
  }, []);

  /** « Demander ce devis » ne fait plus que défiler : la synchro a déjà eu lieu. */
  const acceptReco = useCallback((r: Recommendation) => {
    jumpToForm({ pack: r.pack, plan: r.plan });
  }, [jumpToForm]);

  /** « Recommencer » efface aussi la sélection du formulaire, pas seulement les réponses. */
  const resetSelection = useCallback(() => {
    setReco(null);
    setForm((prev) => ({ ...prev, pack: 'undecided', plan: 'undecided' }));
  }, []);

  const quoteUrl = quoteRef
    ? `${SITE_URL}${language === 'en' ? '/en/local-presence/quote/' : '/presence-digitale/devis/'}${quoteRef}`
    : '';

  /** Libellés du message WhatsApp, traduits et formatés ici, assemblés par le module dédié. */
  const messageLabels = useMemo(() => ({
    greeting: t('whatsapp.greeting'),
    intro: t('whatsapp.intro'),
    packName: findPack(form.pack) ? t(`packs.${form.pack}.name`) : undefined,
    planName: findPlan(form.plan) ? t(`plans.${form.plan}.name`) : undefined,
    sectorLabel: t(`form.sectors.${form.sector}`),
    monthlySuffix: findPlan(form.plan)
      ? t('plans.monthlyLabel', { price: formatPrice(findPlan(form.plan)!.monthlyPrice) })
      : undefined,
    upfrontLabel: t('quote.upfrontTotal'),
    depositLabel: t('quote.deposit'),
    quoteLabel: t('whatsapp.quoteLabel'),
  }), [t, form.pack, form.plan, form.sector, formatPrice]);

  /**
   * Message complet de passage de main, reconstruit à la volée.
   * `submittedData` fige l'état au moment de l'envoi : le formulaire est vidé juste
   * après, sans quoi l'écran de succès afficherait un message vide.
   */
  const handoffMessage = useMemo(() => {
    const data = submittedData ?? form;
    return buildWhatsAppMessage({
      businessName: data.businessName,
      city: data.city,
      pack: data.pack,
      plan: data.plan,
      message: data.message,
      quoteUrl: quoteUrl || undefined,
      formatPrice,
      labels: {
        ...messageLabels,
        packName: findPack(data.pack) ? t(`packs.${data.pack}.name`) : undefined,
        planName: findPlan(data.plan) ? t(`plans.${data.plan}.name`) : undefined,
        sectorLabel: t(`form.sectors.${data.sector}`),
        monthlySuffix: findPlan(data.plan)
          ? t('plans.monthlyLabel', { price: formatPrice(findPlan(data.plan)!.monthlyPrice) })
          : undefined,
      },
    });
  }, [submittedData, form, quoteUrl, formatPrice, messageLabels, t]);

  /** Message court des CTA contextuels (héros, bouton collant, cartes). */
  const quickMessage = useMemo(() => {
    const pack = findPack(form.pack);
    return pack
      ? buildQuickMessage(t('whatsapp.quickIntro'), t(`packs.${form.pack}.name`), formatPrice(pack.price))
      : t('whatsapp.quickIntro');
  }, [form.pack, t, formatPrice]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.businessName.trim()) errs.businessName = t('validation.businessNameRequired');
    if (!form.contactName.trim()) errs.contactName = t('validation.contactNameRequired');
    if (!form.phone.trim()) errs.phone = t('validation.phoneRequired');
    else if (!PHONE_RE.test(form.phone.trim())) errs.phone = t('validation.phoneInvalid');
    if (!form.city.trim()) errs.city = t('validation.cityRequired');
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errs.email = t('validation.emailInvalid');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const update = (field: keyof PresenceForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form._hp) return; // honeypot — abandon silencieux des soumissions robot
    if (!validate()) return;
    setLoading(true);
    try {
      const { quoteRef: ref } = await saveAgencyLead({
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        sector: form.sector,
        pack: form.pack,
        plan: form.plan,
        locale: language,
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.message.trim() ? { message: form.message.trim() } : {}),
        ...(form.referralCode.trim() ? { referralCode: form.referralCode.trim().toUpperCase() } : {}),
      });
      // La valeur du lead alimente les conversions GA4 et Meta : sans elle, toutes les
      // demandes pèsent pareil, qu'il s'agisse d'un pack d'entrée ou d'un Commerce 360.
      const totals = computeTotals(form.pack, form.plan);
      trackGenerateLead('agency_quote_form', totals.pipelineValue || undefined);

      setQuoteRef(ref ?? '');
      setSubmittedData(form);
      setSubmitted(true);
      setForm(EMPTY_FORM);
      setReco(null);
      setResetSignal((n) => n + 1);
      addToast('success', t('toast.success'));
    } catch (error: unknown) {
      captureError(error, { context: 'Save agency lead failed' });
      addToast('error', t('toast.error'));
    } finally {
      setLoading(false);
    }
  };

  const copyQuoteLink = async () => {
    try {
      await navigator.clipboard.writeText(quoteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permission refusée) :
      // le lien reste visible et cliquable juste au-dessus.
    }
  };

  return {
    form, errors, loading, submitted, quoteRef, quoteUrl, copied, reco, resetSignal, formRef, selectorRef,
    handoffMessage, quickMessage,
    update, handleSubmit, copyQuoteLink, jumpToForm, jumpToSelector, handleRecommend, acceptReco, resetSelection,
  };
}
