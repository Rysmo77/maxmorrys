import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, DocLine, Field, GlassPanel, Icon } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import {
  SITE_URL, DEFAULT_OG_IMAGE, SOCIAL_URLS,
  CONTACT_EMAIL, CONTACT_PHONE_E164, CONTACT_PHONE_DISPLAY, WHATSAPP_BASE_URL,
} from '../components/seo/seo-config';
import { trackContact } from '../lib/tracking';
import { MESSAGE_MAX, SUBJECT_KEYS, useContactMessage } from './contact/useContactMessage';
import { useAppointment } from './contact/useAppointment';
import { BookingDialog } from './contact/BookingDialog';

/**
 * /contact — LE FORMULAIRE QUI TRIE AVANT DE LAISSER ÉCRIRE.
 *
 * Territoire `informe`, grille `.95fr 1.05fr`, alignée en haut. À gauche le tri : ce qui n'a
 * pas besoin d'un message, et ce qui n'a pas besoin de CE message. À droite le formulaire,
 * dans le seul panneau héros de la page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CETTE PAGE A CESSÉ DE FAIRE, ET POURQUOI
 *
 * 1. ELLE NE REDOUBLE PLUS LA FAQ. Elle chargeait les questions depuis Firestore et les
 *    dépliait dans un accordéon, alors que `/faq` est une page à part entière, indexée,
 *    avec ses filtres et ses données structurées. Deux index de la même chose se
 *    désynchronisent ; celui-ci coûtait en plus une lecture Firestore à chaque affichage
 *    de `/contact`, pour du contenu que personne ne vient chercher ici. Le tri de gauche
 *    RENVOIE vers la FAQ, ce qui est le geste que le kit prescrit.
 *
 * 2. ELLE NE PROMET PLUS D'E-MAIL. « Je te confirmerai le créneau par email » était écrit
 *    dans l'écran de succès du rendez-vous : le produit n'a aucun canal d'envoi (AD-17),
 *    et le seul canal sortant est le centre de notifications.
 *
 * 3. LE BANDEAU DE COMPTE EST UNE SPÉCIFICATION, PAS UN CONSTAT — et l'encart de vérité le
 *    dit à voix haute, juste en dessous. Un message envoyé depuis un compte connecté n'est
 *    pas rattaché à son auteur aujourd'hui. Tant que ce n'est pas vrai, la carte reste
 *    accompagnée de la phrase qui l'annule ; elle ne s'affiche pas seule.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const rv = (i: number): CSSProperties => ({ ['--i' as string]: i });

export default function Contact() {
  const { t } = useTranslation('contact');
  const path = useLocalizedPath();
  const message = useContactMessage();
  const booking = useAppointment();

  /* Le tri du kit : deux lignes, une pastille chacune, et une SORTIE — le mot en relief du
     kit est ici un vrai lien, parce que c'est exactement ce qu'il désignait. */
  const triage = [
    {
      key: 'payment',
      before: t('page.triage.paymentBefore'),
      label: t('page.triage.paymentLink'),
      after: t('page.triage.paymentAfter'),
      href: path('/mon-espace/cours'),
    },
    {
      key: 'faq',
      before: t('page.triage.faqBefore'),
      label: t('page.triage.faqLink'),
      after: t('page.triage.faqAfter'),
      href: path('/faq'),
    },
  ];

  /*
   * Les canaux directs. Ils ne sont pas au kit, et ils restent : ce sont les seules adresses
   * réellement joignables du produit, et le suivi `trackContact` y était accroché. Le kit
   * dessine une page où tout passe par le formulaire ; le produit, lui, vend aussi par
   * WhatsApp. Supprimer la ligne aurait supprimé le canal.
   */
  const channels = [
    { key: 'whatsapp', label: t('info.whatsapp'), value: t('info.whatsappValue'), href: WHATSAPP_BASE_URL, external: true },
    { key: 'email', label: t('info.email'), value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false },
    { key: 'phone', label: t('info.phone'), value: CONTACT_PHONE_DISPLAY, href: `tel:${CONTACT_PHONE_E164}`, external: false },
  ];

  /*
   * Les trois cases de la bande. AUCUNE N'EST EN MONOSPACE, et c'est une correction du kit :
   * il met « ≤ 48 h » en `.mm-num`, or la monospace est réservée aux nombres qui viennent de
   * la base ou d'une source citée (AD-5). Un délai de réponse est un ENGAGEMENT, pas un
   * relevé — il se tient en corps, comme les deux autres.
   */
  const facts = [
    { key: 'reply', label: t('page.facts.replyLabel'), value: t('page.facts.replyValue'), note: t('page.facts.replyNote') },
    { key: 'reader', label: t('page.facts.readerLabel'), value: t('page.facts.readerValue'), note: t('page.facts.readerNote') },
    { key: 'langs', label: t('page.facts.langsLabel'), value: t('page.facts.langsValue'), note: t('page.facts.langsNote') },
  ];

  return (
    <DsNavHost>
      <SEOHead title={t('seoTitle')} description={t('seoDescription')} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Max-Morrys',
        url: `${SITE_URL}/contact`,
        mainEntity: {
          '@type': 'Organization',
          name: 'Max-Morrys',
          telephone: CONTACT_PHONE_E164,
          email: CONTACT_EMAIL,
          address: { '@type': 'PostalAddress', addressLocality: 'Dakar', addressCountry: 'SN' },
        },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Max-Morrys',
        image: DEFAULT_OG_IMAGE,
        telephone: CONTACT_PHONE_E164,
        email: CONTACT_EMAIL,
        url: SITE_URL,
        address: { '@type': 'PostalAddress', addressLocality: 'Dakar', addressCountry: 'SN' },
        priceRange: '€€',
        sameAs: [WHATSAPP_BASE_URL, ...SOCIAL_URLS],
      }} />

      <PageSite>
        <div className="grid items-start gap-11 lg:grid-cols-[.95fr_1.05fr]">

          {/* ── LE TRI ─────────────────────────────────────────────────────── */}
          <div>
            <SiteDisplay lines={t('page.titleLines', { returnObjects: true }) as string[]} size={52} />

            {/* 40ch, valeur du kit : le chapô se lit d'un regard, il ne se parcourt pas. */}
            <p className="rv mt-[14px] max-w-[40ch] text-[16px] leading-[1.55] text-ink-2" style={rv(3)}>
              {t('page.lede')}
            </p>

            <GlassPanel level="flat" padding={22} className="rv mt-[22px]" style={rv(4)}>
              <SiteEyebrow style={{ margin: 0 }}>{t('page.triage.title')}</SiteEyebrow>
              {triage.map((row) => (
                <div key={row.key} className="mt-[11px] flex items-start gap-[11px] text-[14px] leading-[1.5]">
                  <span
                    aria-hidden="true"
                    className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full"
                    style={{ marginTop: '1px', background: 'color-mix(in srgb, var(--mm-orange) 18%, transparent)' }}
                  >
                    <Icon name="alert" size={11} color="var(--warn)" strokeWidth={3} />
                  </span>
                  <span className="text-ink-2">
                    {row.before}{' '}
                    <a href={row.href} className="font-bold text-forme">{row.label}</a>{' '}
                    {row.after}
                  </span>
                </div>
              ))}
            </GlassPanel>

            <GlassPanel level="flat" padding={22} className="rv mt-[14px]" style={rv(5)}>
              <SiteEyebrow style={{ margin: 0 }}>{t('page.agency.title')}</SiteEyebrow>
              <p className="mt-2 mb-0 text-[14px] leading-[1.55] text-ink-2">
                {t('page.agency.before')}{' '}
                <a href={path('/agence')} className="font-bold text-corail-txt">{t('page.agency.link')}</a>{' '}
                {t('page.agency.after')}
              </p>
            </GlassPanel>

            <GlassPanel level="flat" padding={22} className="rv mt-[14px]" style={rv(7)}>
              <SiteEyebrow style={{ margin: 0 }}>{t('page.channels.title')}</SiteEyebrow>
              <div className="mt-2">
                {channels.map((channel, i) => (
                  <DocLine
                    key={channel.key}
                    label={channel.label}
                    last={i === channels.length - 1}
                    value={
                      <a
                        href={channel.href}
                        target={channel.external ? '_blank' : undefined}
                        rel={channel.external ? 'noopener noreferrer' : undefined}
                        onClick={() => trackContact(channel.key)}
                        className="text-forme"
                      >
                        {channel.value}
                      </a>
                    }
                  />
                ))}
              </div>
              <p className="mt-3 mb-0 text-small leading-[1.5] text-ink-2">{t('page.channels.bookingBody')}</p>
              <Button
                tone="quiet"
                size="sm"
                fullWidth={false}
                className="mt-3"
                onClick={() => { trackContact('appointment_cta'); booking.openDialog(); }}
              >
                <Icon name="calendar" size={16} strokeWidth={2.4} />
                {t('booking.cardButton')}
              </Button>
            </GlassPanel>
          </div>

          {/* ── LE FORMULAIRE ──────────────────────────────────────────────── */}
          <GlassPanel level="hero" padding={28} className="rv" style={rv(6)}>
            {message.account && (
              /* Panneau plat IMBRIQUÉ dans le panneau héros — c'est la composition du kit, et
                 aucun des deux ne porte de flou : le héros est du faux verre à .58. */
              <GlassPanel level="flat" padding={14} className="mb-2 flex items-center gap-3">
                <Avatar initials={message.account.initials} size={36} />
                <div className="flex-1">
                  <p className="m-0 text-[13.5px] font-semibold text-ink">{t('page.account.title')}</p>
                  <p className="m-0 text-meta-2 text-ink-2">{t('page.account.body')}</p>
                </div>
                <Icon name="check" size={15} color="var(--ok)" strokeWidth={3.2} title={t('page.account.signedIn')} />
              </GlassPanel>
            )}

            <form onSubmit={message.handleSubmit} noValidate>
              {/* Piège à robots — invisible à l'œil, retiré de l'arbre d'accessibilité, et
                  exclu de la charge envoyée. Ce n'est pas un `Field` : un champ que personne
                  ne doit remplir n'a pas d'étiquette à annoncer. */}
              <div aria-hidden="true" className="hidden">
                <input
                  type="text"
                  name="_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={message.form._hp}
                  onChange={(e) => message.update('_hp', e.target.value)}
                />
              </div>

              <Field
                label={t('form.nameLabel')}
                value={message.form.name}
                onChange={(v) => message.update('name', v)}
                error={message.errors.name}
                placeholder={t('form.namePlaceholder')}
                autoComplete="name"
                required
                style={{ marginTop: 0 }}
              />

              <Field
                label={t('form.emailLabel')}
                type="email"
                value={message.form.email}
                onChange={(v) => message.update('email', v)}
                error={message.errors.email}
                placeholder={t('form.emailPlaceholder')}
                /* Sans `inputMode` ni `autoComplete`, aucun clavier adapté ne s'ouvre et rien
                   ne se pré-remplit — ce qui coûte cher au pouce sur le marché visé. */
                inputMode="email"
                autoComplete="email"
                required
              />

              <Field
                as="select"
                label={t('page.form.subjectLabel')}
                value={message.form.subjectKey}
                onChange={(v) => message.update('subjectKey', v)}
                error={message.errors.subjectKey}
                placeholder={t('page.form.subjectPlaceholder')}
                options={SUBJECT_KEYS.map((key) => ({ value: key, label: t(`subjects.${key}`) }))}
                required
              />

              <Field
                as="textarea"
                label={t('form.messageLabel')}
                value={message.form.message}
                onChange={(v) => message.update('message', v)}
                error={message.errors.message}
                placeholder={t('form.messagePlaceholder')}
                rows={5}
                /* Le plafond de `firestore.rules`. Le navigateur arrête la frappe au bon
                   endroit plutôt que de laisser l'écriture échouer après l'envoi. */
                maxLength={MESSAGE_MAX}
                required
              />

              <Button type="submit" tone="forme" loading={message.loading} style={{ marginTop: '18px' }}>
                {t('form.submit')}
              </Button>
            </form>

            {/* Sur `--ink-2`, jamais sur `--text-faint` : l'encre tertiaire ne porte pas de
                texte (AD-18), et c'est ici la phrase la plus honnête de la page. */}
            <p className="mt-[10px] mb-0 text-center text-small leading-[1.5] text-ink-2">
              {t('page.form.note')}
            </p>
          </GlassPanel>
        </div>

        <GlassPanel level="truth" className="mt-[22px] max-w-[76ch]">
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('page.truth.title')}</SiteEyebrow>
          <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('page.truth.body')}</p>
        </GlassPanel>
      </PageSite>

      <SiteBand>
        <div className="grid gap-4 sm:grid-cols-3">
          {facts.map((fact, i) => (
            <GlassPanel level="flat" key={fact.key} padding={22} className="rv" style={rv(i)}>
              <SiteEyebrow style={{ margin: 0 }}>{fact.label}</SiteEyebrow>
              <p className="m-0 mt-[5px] text-[20px] font-bold text-ink">{fact.value}</p>
              <p className="m-0 mt-1 text-[13px] text-ink-2">{fact.note}</p>
            </GlassPanel>
          ))}
        </div>
      </SiteBand>

      <BookingDialog booking={booking} />
    </DsNavHost>
  );
}
