import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/Toast';
import { captureError } from '../../lib/sentry';
import { trackEvent, trackGenerateLead } from '../../lib/tracking';
import { markSuppressed } from '../../lib/popups/rules';
import { isValidSlug } from '../../lib/redirects';
import { saveEngagementLead } from '../../lib/firestore';
import { practices } from '../../lib/brand';
import { agencyLeadConfig, routingTagFor } from '../../lib/agency/engagement';
import type { EngagementProjectType } from '../../types';

/**
 * LA DEMANDE DE MISSION — toute sa logique, sortie du rendu.
 *
 * `/agence` faisait 856 lignes, et l'état du formulaire y vivait au milieu de neuf sections
 * de mise en page. Deux choses en découlaient, qu'un déplacement suffit à réparer :
 *
 *   · `isGrowth`, le tableau de la FAQ et le bloc de données structurées étaient RECALCULÉS
 *     À CHAQUE FRAPPE, parce qu'ils partageaient le corps du composant avec `setForm` ;
 *   · recomposer la page revenait à réécrire la logique en même temps que la maquette, sans
 *     qu'aucun test ne le dise — les tests du dépôt portent sur `lib/` et sur les règles
 *     Firestore, aucun ne rend un composant.
 *
 * CE QUI EST DÉPLACÉ SANS ÊTRE TOUCHÉ : `saveEngagementLead`, le paramètre `via`, le pot de
 * miel, le repère de première frappe, la suppression de la pop-up de sortie, et le routage
 * vers Cléa (`isGrowthRequest` / `routingTagFor`).
 *
 * TROIS ÉCARTS ASSUMÉS, nommés là où ils se produisent :
 *   1. les trois listes déroulantes ne sont plus PRÉ-REMPLIES (voir `EMPTY`) ;
 *   2. `markSuppressed` est appelé à la première frappe, non à chaque événement de saisie ;
 *   3. la valeur des listes est REVALIDÉE contre `agencyLeadConfig` avant l'écriture.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Les bornes de `firestore.rules` (`engagement_leads`, `allow create`), pas des préférences :
 * un nom d'un caractère ou une description de trente signes ne produisait pas un message
 * d'erreur mais un refus de permission opaque, APRÈS l'envoi.
 */
const NAME_MIN = 2;
const COMPANY_MIN = 2;
const DESCRIPTION_MIN = agencyLeadConfig.minDescriptionLength;
/** Le plafond des règles. Exporté : le champ arrête la frappe au lieu de laisser l'écriture
 *  échouer après l'envoi — une limite qu'on découvre par un refus est une limite invisible. */
export const DESCRIPTION_MAX = 4000;

/**
 * AUCUNE LISTE N'EST PRÉ-REMPLIE. La version précédente ouvrait sur
 * `product` / `exploring` / `quarter` : quelqu'un qui ne touchait pas aux trois listes
 * envoyait donc trois réponses qu'il n'avait jamais données, et le tri qui suit reposait
 * dessus. Une chaîne vide affiche l'invite du champ et oblige à choisir.
 */
const EMPTY = {
  projectType: '',
  budget: '',
  timeline: '',
  description: '',
  name: '',
  company: '',
  email: '',
  _hp: '',
};

export type AgencyLeadForm = typeof EMPTY;
export type AgencyLeadErrors = Partial<Record<keyof AgencyLeadForm, string>>;

/** Ce que l'écran de confirmation a besoin de savoir, et rien de plus. */
export interface AgencyLeadReceipt {
  projectType: EngagementProjectType;
  /** La demande a été taguée pour Cléa. Le lead est enregistré quand même — jamais rejeté. */
  growth: boolean;
}

export function useAgencyEngagement() {
  const { t } = useTranslation('agency');
  const { language } = useLanguage();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState<AgencyLeadForm>(EMPTY);
  const [errors, setErrors] = useState<AgencyLeadErrors>({});
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<AgencyLeadReceipt | null>(null);
  const [started, setStarted] = useState(false);

  /**
   * Slug du site client par lequel le visiteur est arrivé, posé par la redirection
   * `/via/<slug>` servie au bord. Revalidé ici : le paramètre est lisible et modifiable dans
   * la barre d'adresse, il n'entre en base que s'il a la forme d'un slug. Il identifie le
   * site émetteur, jamais la personne.
   */
  const via = useMemo(() => {
    const raw = searchParams.get('via');
    return raw && isValidSlug(raw) ? raw : null;
  }, [searchParams]);

  /** Vue de page — une seule fois, pas à chaque frappe. */
  useEffect(() => {
    trackEvent('agency_view', { practice: practices.build.pillar });
  }, []);

  /*
   * LES TROIS VALEURS DE LISTE, REVALIDÉES CONTRE LEUR SOURCE.
   *
   * `find` sur la liste d'origine remplace une conversion de type : ce qui sort est un
   * `EngagementProjectType` vérifié à l'exécution, pas un `string` promu par une assertion.
   * Une valeur trafiquée dans le DOM ressort `undefined` et bute sur la validation, au lieu
   * d'arriver en base sous un type qu'elle n'a pas.
   */
  const projectType = useMemo(
    () => agencyLeadConfig.projectTypes.find((key) => key === form.projectType),
    [form.projectType],
  );
  const budget = useMemo(
    () => agencyLeadConfig.budgets.find((key) => key === form.budget),
    [form.budget],
  );
  const timeline = useMemo(
    () => agencyLeadConfig.timelines.find((key) => key === form.timeline),
    [form.timeline],
  );

  /*
   * LE ROUTAGE VERS CLÉA NE SE CALCULE PLUS À CHAQUE FRAPPE.
   *
   * La page en portait un `useMemo` sur `(projectType, description)` pour afficher un encart
   * « ce besoin relève de Cléa » PENDANT la saisie. Deux raisons de le retirer, et une seule
   * suffirait : sur cette page, Cléa n'apparaît qu'APRÈS l'envoi, dans la carte de
   * réorientation — annoncer la practice sœur avant que la demande soit partie, c'est offrir
   * une porte de sortie à quelqu'un qu'on n'a pas encore lu ; et le calcul balayait douze
   * mots-clés sur toute la description à chaque caractère tapé, pour un encart que la
   * maquette ne dessine pas.
   *
   * Le routage lui-même est intact : `routingTagFor` le pose sur le lead à l'écriture, et
   * `receipt.growth` le rend à la confirmation. Il est simplement calculé UNE FOIS.
   */

  /**
   * PREMIÈRE FRAPPE.
   *
   * Quelqu'un qui commence à qualifier sa demande est déjà dans le bon tunnel : l'aiguilleur
   * de sortie n'a plus rien à lui apprendre et deviendrait une interruption.
   *
   * ⚠️ Une FRAPPE, pas un focus. Le focus était trop large : une tabulation qui traverse le
   * formulaire, ou un clic pour lire une étiquette, désactivait la pop-up. Et une seule fois
   * plutôt qu'à chaque événement de saisie — `markSuppressed` écrit dans le stockage local,
   * et le refaire à chaque caractère n'ajoute rien à ce qui est déjà supprimé.
   */
  const update = (field: keyof AgencyLeadForm, value: string) => {
    if (!started) {
      setStarted(true);
      trackEvent('agency_form_start');
      markSuppressed('agencyExit');
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    if (!errors[field]) return;
    // L'adresse garde son erreur tant qu'elle reste invalide : la faire disparaître à la
    // première frappe annoncerait une correction qui n'a pas eu lieu.
    if (field === 'email' && value && !EMAIL_RE.test(value)) return;
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: AgencyLeadErrors = {};
    if (!projectType) errs.projectType = t('panel.errors.projectType');
    if (!budget) errs.budget = t('panel.errors.budget');
    if (!timeline) errs.timeline = t('panel.errors.timeline');

    if (!form.description.trim()) errs.description = t('panel.errors.description');
    else if (form.description.trim().length < DESCRIPTION_MIN) {
      // Le plancher est NOMMÉ dans le message, et lu à sa source : une borne qu'on
      // découvre par un refus est une borne invisible.
      errs.description = t('panel.errors.descriptionShort', { min: DESCRIPTION_MIN });
    }

    if (form.name.trim().length < NAME_MIN) errs.name = t('panel.errors.name');
    if (form.company.trim().length < COMPANY_MIN) errs.company = t('panel.errors.company');
    if (!form.email.trim()) errs.email = t('panel.errors.email');
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = t('panel.errors.emailInvalid');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Piège à robots : rempli, on abandonne en silence. Un message d'erreur apprendrait au
    // script ce qu'il doit éviter la prochaine fois.
    if (form._hp) return;
    if (!validate()) return;
    // Les trois valeurs sont vérifiées par `validate`, mais le compilateur ne le sait pas.
    if (!projectType || !budget || !timeline) return;

    setLoading(true);
    try {
      const routedTo = routingTagFor(projectType, form.description);
      await saveEngagementLead({
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        projectType,
        budget,
        timeline,
        description: form.description.trim(),
        ...(routedTo ? { routedTo } : {}),
        ...(via ? { via } : {}),
        locale: language,
      });

      trackGenerateLead('agency_engagement');
      trackEvent('agency_form_submit', {
        project_type: projectType,
        budget,
        timeline,
        routed_to: routedTo ?? 'build',
        ...(via ? { via } : {}),
      });

      setReceipt({ projectType, growth: routedTo !== null });
      setForm(EMPTY);
      setErrors({});
    } catch (error: unknown) {
      captureError(error, { context: 'Agency engagement form submit failed' });
      addToast('error', t('panel.errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  /** Retour au formulaire depuis la confirmation. La demande envoyée reste envoyée. */
  const reset = () => setReceipt(null);

  return { form, errors, loading, receipt, via, update, handleSubmit, reset };
}
