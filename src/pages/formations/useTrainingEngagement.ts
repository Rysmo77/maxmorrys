import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@ds';
import { useLanguage } from '../../contexts/LanguageContext';
import { captureError } from '../../lib/sentry';
import { trackEvent, trackGenerateLead } from '../../lib/tracking';
import { isValidSlug } from '../../lib/redirects';
import { saveEngagementLead } from '../../lib/firestore';
import { agencyLeadConfig, TRAINING_PROJECT_TYPE } from '../../lib/agency/engagement';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA DEMANDE DE FORMATION D'ÉQUIPE — décalque de `useAgencyEngagement`, et ses écarts.
 *
 * L'offre entreprises existait en toutes lettres dans `formations.json`, en français ET en
 * anglais, et n'était lue par AUCUN composant : une prestation écrite, traduite, maintenue,
 * et invisible. C'est aussi la seule ligne du catalogue qui se vende pendant que la boutique
 * est fermée — un atelier daté se commande à l'avance, là où un cours au détail exige que le
 * cours existe.
 *
 * ── CE QUI EST REPRIS TEL QUEL ────────────────────────────────────────────────────────
 *
 * Le pot de miel `_hp` (abandon SILENCIEUX : un message d'erreur apprendrait au script ce
 * qu'il doit éviter), les bornes lues à leur source, la revalidation des listes par `find`
 * plutôt que par une assertion de type, et l'écran de confirmation par `receipt`.
 *
 * ── QUATRE ÉCARTS, CHACUN POUR UNE RAISON ─────────────────────────────────────────────
 *
 * 1. AUCUNE LISTE DE TYPE DE PROJET. Il n'y a qu'un besoin, et la section le nomme.
 *    `projectType` est figé à `TRAINING_PROJECT_TYPE`.
 *
 * 2. AUCUN ROUTAGE VERS CLÉA, et c'est un vrai piège évité. `isGrowthRequest` cherche douze
 *    mots-clés en SOUS-CHAÎNE dans la description, dont « acquisition ». Une organisation
 *    qui écrit « structurer l'acquisition de compétences » — c'est-à-dire la phrase la plus
 *    naturelle du monde sur ce formulaire — partirait chez Cléa Growth Office. Une demande
 *    de formation n'est ni BUILD ni GROW : elle ne se route pas, elle se traite.
 *
 * 3. AUCUN `markSuppressed`. Sur `/formations`, aucune pop-up n'est éligible :
 *    `formationsEntry` exclut la page (`FORMATIONS_ENTRY_EXCLUDED`) et `formationExit` exige
 *    `path !== '/formations'`. Supprimer une fenêtre qui ne peut pas s'ouvrir serait du
 *    bruit — et le premier à lire ce fichier l'ajouterait par symétrie s'il n'était pas dit.
 *
 * 4. `via` EST CONSERVÉ, et il porte ici une mesure qui n'existait pas. Un commerçant livré
 *    par l'agence arrive par le pied de son propre site (`/via/<slug>`) ; s'il demande une
 *    formation d'équipe, ce champ est la seule trace que la ligne agence a nourri la ligne
 *    formation. C'est la synergie L6 → L1, mesurée plutôt que supposée.
 *
 * ⚠️ ONZE CLÉS AU MAXIMUM, POUR UN PLAFOND DE TREIZE (`firestore.rules`). Il reste deux
 * places, et elles ne sont pas à prendre à la légère : le plafond existe pour empêcher le
 * bourrage de document, et le franchir ferait échouer 100 % des envois, en silence.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Les bornes de `firestore.rules` (`engagement_leads`, `allow create`), relues à leur source
 * — pas des préférences. En dessous, la demande ne produit pas un message d'erreur mais un
 * refus de permission opaque, APRÈS l'envoi.
 */
const NAME_MIN = 2;
const COMPANY_MIN = 2;
const DESCRIPTION_MIN = agencyLeadConfig.minDescriptionLength;
export const DESCRIPTION_MAX = 4000;

/** Aucune liste n'est pré-remplie : une chaîne vide affiche l'invite et oblige à choisir. */
const EMPTY = {
  budget: '',
  timeline: '',
  description: '',
  name: '',
  company: '',
  email: '',
  _hp: '',
};

export type TrainingLeadForm = typeof EMPTY;
export type TrainingLeadErrors = Partial<Record<keyof TrainingLeadForm, string>>;

/** Ce que l'écran de confirmation a besoin de savoir, et rien de plus. */
export interface TrainingLeadReceipt {
  company: string;
}

export function useTrainingEngagement() {
  const { t } = useTranslation('formations');
  const { language } = useLanguage();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState<TrainingLeadForm>(EMPTY);
  const [errors, setErrors] = useState<TrainingLeadErrors>({});
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<TrainingLeadReceipt | null>(null);
  const [started, setStarted] = useState(false);

  /* Revalidé : le paramètre est modifiable dans la barre d'adresse. Il identifie le site
     émetteur, jamais la personne. */
  const via = useMemo(() => {
    const raw = searchParams.get('via');
    return raw && isValidSlug(raw) ? raw : null;
  }, [searchParams]);

  /* Les deux listes, revalidées contre leur source : ce qui sort est un type vérifié à
     l'exécution, pas une chaîne promue par une assertion. */
  const budget = useMemo(
    () => agencyLeadConfig.budgets.find((key) => key === form.budget),
    [form.budget],
  );
  const timeline = useMemo(
    () => agencyLeadConfig.timelines.find((key) => key === form.timeline),
    [form.timeline],
  );

  const update = (field: keyof TrainingLeadForm, value: string) => {
    if (!started) {
      setStarted(true);
      trackEvent('training_form_start');
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    if (!errors[field]) return;
    /* L'adresse garde son erreur tant qu'elle reste invalide : la faire disparaître à la
       première frappe annoncerait une correction qui n'a pas eu lieu. */
    if (field === 'email' && value && !EMAIL_RE.test(value)) return;
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: TrainingLeadErrors = {};
    if (!budget) errs.budget = t('business.form.errors.budget');
    if (!timeline) errs.timeline = t('business.form.errors.timeline');

    if (!form.description.trim()) errs.description = t('business.form.errors.description');
    else if (form.description.trim().length < DESCRIPTION_MIN) {
      // Le plancher est NOMMÉ, et lu à sa source : une borne qu'on découvre par un refus est
      // une borne invisible.
      errs.description = t('business.form.errors.descriptionShort', { min: DESCRIPTION_MIN });
    }

    if (form.name.trim().length < NAME_MIN) errs.name = t('business.form.errors.name');
    if (form.company.trim().length < COMPANY_MIN) errs.company = t('business.form.errors.company');
    if (!form.email.trim()) errs.email = t('business.form.errors.email');
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = t('business.form.errors.emailInvalid');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Piège à robots : rempli, on abandonne en silence.
    if (form._hp) return;
    if (!validate()) return;
    // Vérifiés par `validate`, mais le compilateur ne le sait pas.
    if (!budget || !timeline) return;

    setLoading(true);
    try {
      const company = form.company.trim();
      await saveEngagementLead({
        name: form.name.trim(),
        company,
        email: form.email.trim(),
        projectType: TRAINING_PROJECT_TYPE,
        budget,
        timeline,
        description: form.description.trim(),
        ...(via ? { via } : {}),
        locale: language,
      });

      trackGenerateLead('training_engagement');
      trackEvent('training_form_submit', { budget, timeline, ...(via ? { via } : {}) });

      setReceipt({ company });
      setForm(EMPTY);
      setErrors({});
    } catch (error: unknown) {
      captureError(error, { context: 'Training engagement form submit failed' });
      addToast('error', t('business.form.errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  /** Retour au formulaire depuis la confirmation. La demande envoyée reste envoyée. */
  const reset = () => setReceipt(null);

  return { form, errors, loading, receipt, update, handleSubmit, reset };
}
