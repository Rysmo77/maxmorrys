import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@ds';
import { functions } from '../../config/firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { saveAppointment } from '../../lib/firestore';
import { captureError } from '../../lib/sentry';
import { trackGenerateLead } from '../../lib/tracking';
import { EMAIL_RE, SUBJECT_KEYS } from './useContactMessage';

/**
 * LA PRISE DE RENDEZ-VOUS — le second formulaire de `/contact`, isolé du premier.
 *
 * Les deux partagaient un composant, cinq `useState` chacun et le même dictionnaire de
 * messages de validation. Rien d'autre : ils n'écrivent pas dans la même collection, ne
 * valident pas les mêmes champs et ne se soumettent jamais ensemble. Les séparer ne
 * découpe donc rien — ça rend visible qu'ils n'étaient jamais liés.
 *
 * UN DÉFAUT CORRIGÉ AU PASSAGE. Le sujet était initialisé avec un libellé TRADUIT au
 * premier rendu (`t('subjects.coaching')`), figé dans l'état. Changer de langue ensuite
 * laissait un libellé français dans un formulaire anglais, et l'enregistrait tel quel.
 * L'état porte désormais la CLÉ ; la traduction se fait à l'envoi.
 */

/**
 * Accusé de réception de la demande.
 *
 * ⚠️ AVANT, RIEN NE PARTAIT. Une demande de rendez-vous ne produisait qu'un message à
 * l'écran : ni accusé, ni rappel, ni alerte interne. La personne ne savait pas si sa
 * demande était arrivée, sur la page dont c'est précisément le métier.
 *
 * L'adresse n'est PAS transmise : le serveur la relit sur le document. Sans cela,
 * l'endpoint serait un relais d'envoi anonyme signé Max-Morrys.
 *
 * Déclarée au niveau module — jamais dans le corps du composant (convention du dépôt).
 */
const acknowledgeAppointment = httpsCallable<
  { appointmentId: string; langue: string },
  { ok: boolean; sent: boolean; reason?: string }
>(functions, 'acknowledgeAppointment');

/** Les créneaux du soir, heure de Dakar. Valeurs du produit, pas du design system. */
export const TIME_SLOTS = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'] as const;

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  date: '',
  time: TIME_SLOTS[0] as string,
  subjectKey: SUBJECT_KEYS[0] as string,
  message: '',
};

export type AppointmentForm = typeof EMPTY;

export function useAppointment() {
  const { t } = useTranslation('contact');
  const { language } = useLanguage();
  const { addToast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AppointmentForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /** Aucune date passée dans le sélecteur natif : `min` fait le travail côté navigateur. */
  const today = new Date().toISOString().split('T')[0];

  const openDialog = () => {
    setSuccess(false);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setSuccess(false);
    setForm(EMPTY);
    setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t('validation.nameRequired');
    if (!form.email.trim()) errs.email = t('validation.emailRequired');
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = t('validation.emailInvalid');
    if (!form.date) errs.date = t('validation.dateRequired');
    if (!form.time) errs.time = t('validation.timeRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const update = (field: keyof AppointmentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const appointmentId = await saveAppointment({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        date: form.date,
        time: form.time,
        subject: t(`subjects.${form.subjectKey}`),
        message: form.message.trim() || undefined,
      });
      trackGenerateLead('appointment_booking');
      setSuccess(true);

      /*
        L'accusé part APRÈS le succès affiché, et son échec ne le remet pas en cause : le
        rendez-vous est enregistré, c'est le fait qui compte. On ne transforme pas une
        demande reçue en erreur parce qu'un serveur de messagerie a hoqueté — le marqueur
        `acknowledgedAt` n'étant alors pas posé, un rejeu pourra rattraper l'envoi.
      */
      try {
        await acknowledgeAppointment({ appointmentId, langue: language });
      } catch (error: unknown) {
        captureError(error, { context: 'Acknowledge appointment failed' });
      }
    } catch (error: unknown) {
      captureError(error, { context: 'Save appointment failed' });
      addToast('error', error instanceof Error ? error.message : t('toast.appointmentError'));
    } finally {
      setLoading(false);
    }
  };

  return { open, form, errors, loading, success, today, openDialog, close, update, handleSubmit };
}
