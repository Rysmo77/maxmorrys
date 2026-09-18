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
 *
 * ── CE QUI A CHANGÉ AVEC LA QUESTION D'AIGUILLAGE (CDC § 4.5) ────────────────────────────
 * Le hook prend désormais la BRANCHE choisie, et elle n'est pas décorative : elle décide du
 * catalogue de sujets, elle part en base à côté du libellé traduit, et `null` signifie « rien
 * n'est encore choisi » — état dans lequel la page ne monte pas le formulaire du tout.
 */

export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Clés de sujet STABLES. Le libellé affiché est traduit au rendu, et c'est le libellé qui
 * part en base — l'administration lit `subject` comme du texte depuis toujours.
 *
 * ⚠️ `strategy` (« Conseil en stratégie marketing ») A ÉTÉ RETIRÉ, et ce n'est pas un
 * nettoyage. La direction marketing n'est pas portée par cette marque : elle est contractée
 * par MY ONOMA, et le CDC § 4.5 tranche que cette demande-là SORT du site au lieu d'être
 * collectée ici puis transférée à la main. La branche `grow` de la première question la
 * reçoit et renvoie ; aucun sujet du formulaire ne la nomme plus.
 */
export const SUBJECT_KEYS = [
  'formationInfo', 'club', 'coaching', 'partnership', 'shopSite', 'customProject', 'other',
] as const;

/**
 * ── LES TROIS BRANCHES DE LA PREMIÈRE QUESTION (CDC § 4.5) ──────────────────────────────
 *
 * `/contact` recevait TOUT dans un seul formulaire, puis expliquait en trois encarts ce qui
 * n'aurait pas dû y entrer — un paiement en attente, une question de FAQ, un projet d'agence.
 * Trois avertissements à lire avant d'écrire, et rien n'empêchait d'écrire quand même.
 *
 * La question d'aiguillage inverse l'ordre : on choisit d'abord, et le reste de la page
 * découle du choix. Deux branches écrivent ici ; la troisième n'écrit RIEN.
 */
export const BRANCHES = ['learn', 'build', 'grow'] as const;
export type Branch = (typeof BRANCHES)[number];

/** Les deux branches qui déposent un message. `grow` n'en fait pas partie, par construction. */
export type WritingBranch = Exclude<Branch, 'grow'>;

/**
 * Le sujet dépend de la branche : un catalogue unique reposait la question déjà tranchée, et
 * laissait choisir « Informations sur une formation » à quelqu'un venu pour un site.
 */
export const SUBJECTS_BY_BRANCH: Record<WritingBranch, readonly string[]> = {
  learn: ['formationInfo', 'club', 'coaching', 'partnership', 'other'],
  build: ['shopSite', 'customProject', 'other'],
};

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

export function useContactMessage(branch: WritingBranch | null) {
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

  /**
   * CHANGER DE BRANCHE VIDE LE SUJET, ET LUI SEUL.
   *
   * Les deux catalogues de sujets sont disjoints : une clé choisie dans `learn` n'existe pas
   * dans `build`. La garder ferait rendre au `<select>` une valeur absente de ses options —
   * il retomberait silencieusement sur le premier libellé, et la personne enverrait un sujet
   * qu'elle n'a pas choisi. Le nom, l'adresse et le message, eux, restent : on ne fait pas
   * retaper un message parce qu'on s'est trompé de porte.
   */
  useEffect(() => {
    setForm((prev) => (prev.subjectKey ? { ...prev, subjectKey: '' } : prev));
    setErrors((prev) => (prev.subjectKey ? { ...prev, subjectKey: '' } : prev));
  }, [branch]);

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
        /*
         * ⚠️ L'IDENTIFIANT MANQUAIT, ET IL FAISAIT DISPARAÎTRE LE MESSAGE POUR SON AUTEUR.
         *
         * `getUserMessages()` (`lib/firestore/certificates.ts:42`) interroge
         * `where('userId','==',uid)` : sans ce champ, un message écrit ici n'apparaissait
         * JAMAIS dans « Mes messages » — pas même celui d'une personne connectée dont le
         * formulaire venait d'être pré-rempli avec son propre nom et sa propre adresse,
         * deux lignes plus haut. Le seul formulaire qui écrivait l'identifiant était celui
         * de l'espace apprenant, si bien que la même demande était suivie ou perdue selon
         * la page d'où elle partait.
         *
         * `null` et non `undefined` pour un visiteur déconnecté : Firestore refuse
         * `undefined`, et le champ doit exister pour que la requête d'administration
         * puisse distinguer « écrit sans compte » de « champ jamais posé ».
         */
        userId: user?.uid ?? null,
        /*
         * LA BRANCHE D'AIGUILLAGE, telle que la personne l'a choisie — pas déduite du sujet.
         *
         * `subject` part en toutes lettres et TRADUIT : c'est ce que l'administration lit
         * depuis toujours, et c'est aussi ce qui le rend impropre au tri (« Informations sur
         * une formation » et « Information about a course » sont la même demande). La branche
         * est une clé stable, la même dans les deux langues.
         *
         * ⚠️ `firestore.rules` ne borne QUE le nombre de clés (≤ 12) et les champs `status` et
         * `userId`. Celui-ci porte le compte à huit : il passe. Un neuvième champ se vérifie
         * au même endroit avant d'être ajouté — l'écriture échouerait en silence.
         */
        branch,
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
