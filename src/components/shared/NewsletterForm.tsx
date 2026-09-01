import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, addDoc } from 'firebase/firestore';
import { Icon, useToast } from '@ds';
import { db } from '../../config/db';
import { trackSubscribeNewsletter } from '../../lib/tracking';
import LocalizedLink from './LocalizedLink';

interface NewsletterFormProps {
  variant?: 'inline' | 'card';
  source?: string;
}

/**
 * Inscription à la newsletter.
 *
 * ⚠️⚠️ **CE COMPOSANT N'EST MONTÉ NULLE PART, ET C'EST DÉLIBÉRÉ.**
 *
 * Il n'existe AUCUN expéditeur d'e-mail dans le produit — ni nodemailer, ni SendGrid, ni
 * Mailgun, ni MailChannels, ni Resend ; le seul e-mail qui parte est celui de
 * réinitialisation de Firebase Auth. Un formulaire qui recueille une adresse pour une lettre
 * qui ne peut pas partir demande un geste contre rien, et R-13 est explicite : « Ne jamais
 * promettre un e-mail. » La page blog l'écrit d'ailleurs elle-même — « Je ne te fais pas
 * remplir un champ qui ne sert à rien. »
 *
 * Il était servi par `BlogEndPopup`, à 90 % de lecture d'un article, sous l'étiquette
 * « 1 email / semaine ». Cette fenêtre propose désormais les deux canaux qui existent : le
 * flux RSS et l'alerte dans l'espace personnel.
 *
 * Le fichier et la collection Firestore `newsletter` sont CONSERVÉS : les adresses déjà
 * recueillies restent, et il suffira de remonter ce composant le jour où un canal d'envoi
 * existe. Les chaînes `newsletter.*` ont été réécrites pour ne plus rien promettre, afin
 * qu'un remontage par erreur ne remette pas la promesse en ligne.
 *
 * ⚠️ Le consentement est explicite et **jamais pré-coché** : `consent` démarre à `false`,
 * et la soumission est refusée tant qu'il n'est pas donné. Le champ `consentAt` horodate
 * le recueil.
 *
 * ⚠️ La règle Firestore de la collection `newsletter` borne le nombre de clés du document.
 * Ajouter un champ ici sans relever ce plafond ferait échouer **toutes** les inscriptions.
 * Les deux ont été modifiés ensemble — voir `firestore.rules` et `docs/LEGAL-TODO.md §7`.
 */
export default function NewsletterForm({ variant = 'inline', source = 'footer' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { t } = useTranslation('shared');
  const consentId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!consent) {
      addToast('error', t('newsletter.consentRequired'));
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'newsletter'), {
        email: email.trim(),
        subscribedAt: new Date().toISOString(),
        source,
        consent: true,
        consentAt: new Date().toISOString(),
      });
      trackSubscribeNewsletter(source || 'newsletter');
      addToast('success', t('newsletter.successToast'));
      setEmail('');
      setConsent(false);
    } catch {
      addToast('error', t('newsletter.errorToast'));
    }
    setLoading(false);
  };

  /** Case de consentement + renvoi vers la politique de confidentialité. */
  const consentField = (tone: 'light' | 'dark') => (
    /*
      `mm-on-color` sur le PARENT, et pas sur le champ : le kit écrit son anneau clair
      en `:where(.mm-on-color) :focus-visible` — un descendant — et ne vise l'élément
      lui-même que pour `button` et `a` (`brand/states.css`). Sur une case à cocher, la
      classe posée directement ne matcherait rien.
    */
    <div className={`flex items-start gap-2.5${tone === 'dark' ? ' mm-on-color' : ''}`}>
      <input
        id={consentId}
        type="checkbox"
        checked={consent}
        onChange={(e) => setConsent(e.target.checked)}
        className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${
          tone === 'dark'
            ? 'border-white/40 bg-[color-mix(in_srgb,var(--paper)_10%,transparent)] text-forme'
            : 'border-[color:var(--line)] text-forme'
        }`}
      />
      <label
        htmlFor={consentId}
        className={`text-xs leading-relaxed ${
          tone === 'dark' ? 'text-[color:var(--paper-fixed)]' : 'text-ink-2'
        }`}
      >
        {t('newsletter.consentLabel')}{' '}
        <LocalizedLink
          to="/legal/confidentialite"
          className={`underline underline-offset-2 ${
            tone === 'dark' ? 'text-white' : 'text-forme'
          }`}
        >
          {t('newsletter.consentPolicyLink')}
        </LocalizedLink>
      </label>
    </div>
  );

  if (variant === 'card') {
    return (
      <div className="bg-[image:var(--action-forme)] rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-[color-mix(in_srgb,var(--paper)_20%,transparent)] rounded-xl">
            <Icon name="mail" size={20} />
          </div>
          <h3 className="text-lg font-bold">{t('newsletter.cardTitle')}</h3>
        </div>
        <p className="text-[color:var(--paper-fixed)] text-sm mb-6 leading-relaxed">
          {t('newsletter.cardText')}
        </p>
        {/* Carte sombre : l'anneau bleu du système s'y perd. `mm-on-color` le passe en
            blanc doublé d'encre — c'est la variante que le kit prévoit pour ce cas. */}
        <form onSubmit={handleSubmit} className="space-y-3 mm-on-color">
          <div className="flex gap-2">
            <label htmlFor="newsletter-card-email" className="sr-only">{t('newsletter.emailLabel')}</label>
            <input
              id="newsletter-card-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('newsletter.emailPlaceholder')}
              required
              className="flex-1 px-4 py-2.5 rounded-xl bg-[color-mix(in_srgb,var(--paper)_10%,transparent)] border border-white/20 text-white text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label={loading ? t('newsletter.submittingAria') : t('newsletter.submitAria')}
              /* Papier FIXE : ce bouton est posé sur un dégradé coloré, il doit rester blanc dans
                 les deux modes. `--paper-fixed` existe exactement pour ça — la pastille du logo
                 et le curseur d'interrupteur le lisent déjà. */
              className="px-4 py-2.5 bg-[color:var(--paper-fixed)] text-forme rounded-xl font-semibold text-sm hover:bg-[color-mix(in_srgb,var(--mm-bleu)_8%,transparent)] transition-colors disabled:opacity-50"
            >
              {loading ? t('newsletter.loading') : t('newsletter.submit')}
            </button>
          </div>
          {consentField('dark')}
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" />
          <label htmlFor="newsletter-inline-email" className="sr-only">{t('newsletter.emailLabel')}</label>
          <input
            id="newsletter-inline-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.emailPlaceholder')}
            required
            /* `--field-bg` et non `bg-paper` : `--paper` ne bascule PAS sous `.dk` (c'est du
               blanc fixe, réservé aux pastilles), alors que `--ink` devient #ECF0F5. Dans le
               pied de page, qui porte la portée sombre, le couple donnait du blanc sur blanc.
               Le jeton de champ, lui, s'inverse — 72 % de blanc en clair, 7 % en nuit. */
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[color:var(--line)] bg-[color:var(--field-bg)] text-sm text-ink focus:outline-none focus:border-forme"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-label={loading ? t('newsletter.submittingAria') : t('newsletter.submitAria')}
          className="px-4 py-2.5 bg-forme text-white rounded-xl font-semibold text-sm hover:bg-forme transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <Icon name="forward" size={16} />
        </button>
      </div>
      {consentField('light')}
    </form>
  );
}
