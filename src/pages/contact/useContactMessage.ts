import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/db';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@ds';
import { captureError } from '../../lib/sentry';
import { trackGenerateLead } from '../../lib/tracking';

/**
 * LE MESSAGE DE CONTACT — toute sa logique, sortie du rendu.
 *
 * `/contact` portait onze `useState` et deux formulaires indépendants entrelacés dans un
 * seul composant de 549 lignes. Recomposer la page autour de cet état revenait à réécrire
 * la logique en même temps que la mise en page, sans qu'aucun test ne le dise — les tests
 * du dépôt portent sur `lib/` et sur les règles Firestore, aucun ne rend un composant.
 *
 * Rien n'est retouché sur le fond : c'est un déplacement. Les deux seuls écarts assumés
 * sont nommés là où ils se produisent — le plancher de deux caractères sur le nom, et le
 * pré-remplissage depuis le compte.
 */

export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Clés de sujet STABLES. Le libellé affiché est traduit au rendu, et c'est le libellé qui
 * part en base — l'administration lit `subject` comme du texte depuis toujours.
 */
export const SUBJECT_KEYS = ['coaching', 'formationInfo', 'partnership', 'strategy', 'other'] as const;

/**
 * Ces trois bornes ne sont pas des préférences : ce sont les CONDITIONS DE `firestore.rules`
 * (`messages`, `allow create`). Un nom d'un caractère ou un message de 6 000 signes ne
 * produisait pas un message d'erreur mais un refus de permission opaque, après l'envoi.
 * Les valider ici, c'est dire à la personne ce qui cloche avant de tenter l'écriture.
 */
const NAME_MIN = 2;
const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 5000;

/**
 * `subjectKey` porte la CLÉ, pas le libellé. Le libellé traduit est composé à l'envoi : c'est
 * lui qui part en base, comme avant, mais il n'est plus figé au premier rendu — changer de
 * langue en cours de saisie ne laisse plus un intitulé français dans un message anglais.
 */
const EMPTY = { name: '', email: '', subjectKey: '', message: '', _hp: '' };

export type ContactForm = typeof EMPTY;

/** Ce que le bandeau « Tu écris depuis ton compte » a besoin de savoir, et rien de plus. */
export interface ContactAccount {
  name: string;
  email: string;
  initials: string;
}

function initialsOf(name: string, email: string): string {
  const source = name.trim() || email.trim();
  if (!source) return '?';
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
}

export function useContactMessage() {
  const { t } = useTranslation('contact');
  const { userData, user } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const name = userData?.displayName ?? user?.displayName ?? '';
  const email = userData?.email ?? user?.email ?? '';
  const account: ContactAccount | null = user
    ? { name, email, initials: initialsOf(name, email) }
    : null;

  /**
   * PRÉ-REMPLISSAGE, UNE SEULE FOIS.
   *
   * Le compte connaît déjà le nom et l'adresse : les redemander, c'est deux champs de plus
   * à taper au pouce sur le marché visé. Une seule fois, parce que `userData` arrive après
   * le premier rendu et qu'un effet qui réécrit à chaque passage écraserait une correction
   * faite entre-temps.
   */
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !user) return;
    if (!name && !email) return;
    prefilled.current = true;
    setForm((prev) => ({
      ...prev,
      name: prev.name || name,
      email: prev.email || email,
    }));
  }, [user, name, email]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t('validation.nameRequired');
    else if (form.name.trim().length < NAME_MIN) errs.name = t('validation.nameTooShort');
    if (!form.email.trim()) errs.email = t('validation.emailRequired');
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = t('validation.emailInvalid');
    if (!form.subjectKey) errs.subjectKey = t('validation.subjectRequired');
    if (!form.message.trim()) errs.message = t('validation.messageRequired');
    else if (form.message.trim().length < MESSAGE_MIN) errs.message = t('validation.messageTooShort');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * L'erreur s'efface dès que le champ est corrigé — sauf pour l'adresse, qui garde la
   * sienne tant qu'elle reste invalide : la faire disparaître à la première frappe
   * annoncerait une correction qui n'a pas eu lieu.
   */
  const update = (field: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (!errors[field]) return;
    if (field === 'email' && value && !EMAIL_RE.test(value)) return;
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Piège à robots : rempli, on abandonne en silence. Un message d'erreur apprendrait au
    // script ce qu'il doit éviter la prochaine fois.
    if (form._hp) return;
    if (!validate()) return;
    setLoading(true);
    try {
      // La charge est écrite champ par champ : `_hp` ne peut pas s'y glisser par un spread,
      // et `subject` part en toutes lettres, comme l'administration l'a toujours lu.
      await addDoc(collection(db, 'messages'), {
        name: form.name,
        email: form.email,
        subject: t(`subjects.${form.subjectKey}`),
        message: form.message,
        sentAt: new Date().toISOString(),
        status: 'new',
      });
      trackGenerateLead('contact_form');
      addToast('success', t('toast.messageSuccess'));
      // On revide le formulaire, mais pas l'identité : quelqu'un qui écrit deux fois depuis
      // son compte ne retape pas son nom.
      setForm({ ...EMPTY, name: account?.name ?? '', email: account?.email ?? '' });
    } catch (error: unknown) {
      captureError(error, { context: 'Send contact message failed' });
      addToast('error', error instanceof Error ? error.message : t('toast.messageError'));
    }
    setLoading(false);
  };

  return { form, errors, loading, account, update, handleSubmit };
}
