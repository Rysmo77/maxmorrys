import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Field } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { Eyebrow, KitButton, KitSection, NightHero, NightAccent } from '../components/site/v3/kit';
import { useLanguage, useLocalizedPath } from '../contexts/LanguageContext';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import {
  SITE_URL, DEFAULT_OG_IMAGE, SOCIAL_URLS,
  CONTACT_EMAIL, CONTACT_PHONE_E164, WHATSAPP_BASE_URL,
} from '../components/seo/seo-config';
import { trackContact } from '../lib/tracking';
import { MESSAGE_MAX, SUBJECT_KEYS, useContactMessage } from './contact/useContactMessage';
import { TIME_SLOTS, useAppointment } from './contact/useAppointment';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONTACT — maquettes `Site-Contact` (bureau) / `Site-Contact-mobile` (390 px), passe 2.
 *
 * Dalle de nuit (titre, WhatsApp, e-mail), « Qu'est-ce qui t'amène ? » en trois cartes,
 * la prise de rendez-vous EN PAGE (`#rdv`, ouverte par `?rdv=1` — l'adresse des boutons
 * « Réserver un appel » de la barre et des pages), puis trois repères.
 *
 * LES ÉCRITURES SONT CELLES D'AVANT, inchangées : `useAppointment` (rendez-vous → Firestore
 * + accusé) et `useContactMessage` (message → `messages`). Le formulaire de message, absent
 * de la planche (« sans formulaire inutile »), reste servi en bas de page, replié : retirer
 * le seul chemin d'écriture d'un message ferait mentir le contrat de `vues:check`.
 *
 * Écarts volontaires à la planche :
 * - jours et heures : les jours sont les cinq prochains jours ouvrés, CALCULÉS ; les heures
 *   sont les créneaux réels de `TIME_SLOTS`. Aucun « [DATE] », aucun « [HH:MM] ».
 * - « Créneaux branchés sur l'agenda » et « confirmation sur WhatsApp » sont faux ici : le
 *   créneau est une DEMANDE, confirmée à la main. La phrase dit ça.
 * - l'e-mail est requis par l'écriture existante : le formulaire le demande, en plus de la
 *   planche. Le format (visio, téléphone, WhatsApp) part dans la note du rendez-vous.
 * - « edu.maxmorrys.me » : il n'y a pas de sous-domaine, la carte renvoie à `/formations`.
 * - « [N] h ouvrées » : le délai déjà affiché (≤ 48 h, jours ouvrés).
 * - la branche « direction marketing → MY ONOMA » de l'ancienne page n'est pas sur la
 *   planche ; elle disparaît de cet écran (la marque garde son renvoi dans le pied de page).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

type Format = 'visio' | 'phone' | 'whatsapp';
const FORMATS: Format[] = ['visio', 'phone', 'whatsapp'];

/** Les cinq prochains jours ouvrés, aujourd'hui compris, en date locale `AAAA-MM-JJ`. */
function nextWorkdays(count: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (out.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface KitInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  autoComplete?: string;
  inputMode?: 'email' | 'tel' | 'text';
  required?: boolean;
}

/** Le champ à étiquette flottante de la planche (`mm-field`). */
function KitInput({ id, label, value, onChange, type = 'text', error, autoComplete, inputMode, required }: KitInputProps) {
  return (
    <div className={`mm-field ${error ? 'is-error' : ''}`}>
      <div className="mm-field__box">
        <input
          id={id}
          type={type}
          placeholder=" "
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <label htmlFor={id}>{label}</label>
      </div>
      {error && <span id={`${id}-err`} className="mm-field__help">{error}</span>}
    </div>
  );
}

export default function Contact() {
  const { t } = useTranslation('contact');
  const path = useLocalizedPath();
  const { language } = useLanguage();
  const locale = language === 'en' ? 'en-GB' : 'fr-FR';

  const [params] = useSearchParams();
  const rdv = params.get('rdv') === '1';
  const rdvRef = useRef<HTMLElement>(null);

  const booking = useAppointment();
  const message = useContactMessage('learn');
  const [format, setFormat] = useState<Format>('visio');
  const [topic, setTopic] = useState('');

  const days = useMemo(() => nextWorkdays(5), []);

  /* `?rdv=1` amène directement au bloc de réservation. */
  useEffect(() => {
    if (rdv) rdvRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [rdv]);

  /* Le format et l'objet partent dans la note du rendez-vous — le seul champ libre de
     l'écriture existante. */
  const { update } = booking;
  useEffect(() => {
    update('message', topic.trim() ? `${t(`site.booking.format.${format}`)} — ${topic.trim()}` : t(`site.booking.format.${format}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, topic]);

  const goBook = () => {
    trackContact('appointment_cta');
    rdvRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const titleLines = t('site.hero.titleLines', { returnObjects: true }) as string[];

  const cards = [
    { key: 'learn', dot: 'bg-[color:var(--mm-bleu)]', tone: 'edu' as const, href: path('/formations') },
    { key: 'build', dot: 'bg-[color:var(--mm-teal)]', tone: 'studio' as const, href: path('/conception') },
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

      {/* ── LA DALLE ─────────────────────────────────────────────────────────── */}
      <NightHero mesh="club">
        <div className="relative z-[1] mx-auto box-border max-w-[1360px] px-5 pb-[30px] pt-9 wide:px-10 wide:pb-16 wide:pt-[110px]">
          <span className="mm-eyebrow text-[color:var(--mm-violet-c)]">{t('site.hero.eyebrow')}</span>
          <h1 className="mm-d mb-[14px] mt-[14px] text-[52px] leading-[.9] wide:mb-[22px] wide:mt-5 wide:text-[clamp(56px,7.4vw,112px)] wide:leading-[.88] wide:tracking-[-.05em]">
            {titleLines.map((l, i) => (
              <span key={i}>
                {i > 0 && <br className="hidden wide:inline" />}
                {i > 0 && <span className="wide:hidden"> </span>}
                <NightAccent text={l} />
              </span>
            ))}
          </h1>
          <p className="m-0 mb-[22px] max-w-[52ch] text-[15.5px] leading-[1.55] text-ink-2 wide:mb-[26px] wide:text-[18px]">
            <span className="wide:hidden">{t('site.hero.ledeShort')}</span>
            <span className="hidden wide:inline">{t('site.hero.lede')}</span>
          </p>
          <div className="flex flex-wrap gap-[10px]">
            <a
              href={WHATSAPP_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContact('whatsapp')}
              className="mm-btn mm-tint-wa no-underline"
              style={{ ['--fg' as string]: 'var(--paper-fixed)' }}
            >
              {t('site.hero.whatsapp')}
            </a>
            <KitButton href={`mailto:${CONTACT_EMAIL}`} tone="veil">
              {CONTACT_EMAIL}
            </KitButton>
          </div>
        </div>
      </NightHero>

      {/* ── QU'EST-CE QUI T'AMÈNE ? ──────────────────────────────────────────── */}
      <KitSection className="pt-11 wide:pt-[72px]">
        <Eyebrow>{t('site.route.eyebrow')}</Eyebrow>
        <div className="mt-[14px] grid gap-3 wide:mt-4 wide:grid-cols-3 wide:gap-4">
          {cards.map((c) => (
            <article key={c.key} className="flex flex-col gap-[10px] rounded-xl border border-solid border-[color:var(--line)] bg-bento p-6">
              <span aria-hidden="true" className={`h-[14px] w-[14px] rounded-pill ${c.dot}`} />
              <span className="mm-eyebrow text-ink-2">{t(`site.route.${c.key}Eyebrow`)}</span>
              <h2 className="m-0 font-display text-[26px] font-black leading-[1.02] wide:text-[30px]">{t(`site.route.${c.key}Title`)}</h2>
              <span className="text-[14.5px] text-ink-2">{t(`site.route.${c.key}Body`)}</span>
              <KitButton href={c.href} tone={c.tone} size="sm" className="mt-auto self-start">{t(`site.route.${c.key}Cta`)}</KitButton>
            </article>
          ))}
          <article className="flex flex-col gap-[10px] rounded-xl bg-[color:var(--surface-ink)] p-6 text-[color:var(--paper-fixed)] outline outline-[3px] outline-offset-[3px] outline-[color:var(--mm-violet)]">
            <span aria-hidden="true" className="h-[14px] w-[14px] rounded-pill bg-[color:var(--mm-violet)]" />
            <span className="mm-eyebrow opacity-80">{t('site.route.talkEyebrow')}</span>
            <h2 className="m-0 font-display text-[26px] font-black leading-[1.02] wide:text-[30px]">{t('site.route.talkTitle')}</h2>
            <span className="text-[14.5px] opacity-80">{t('site.route.talkBody')}</span>
            <KitButton tone="club" size="sm" className="mt-auto self-start" onClick={goBook}>{t('site.route.talkCta')}</KitButton>
          </article>
        </div>
      </KitSection>

      {/* ── RÉSERVER ─────────────────────────────────────────────────────────── */}
      <KitSection className="scroll-mt-[calc(var(--header-h)+16px)] pt-11 wide:pt-10" id="rdv">
        <section ref={rdvRef} aria-labelledby="rdv-title" className="grid gap-6 rounded-xl bg-[color:var(--paper-2)] p-5 wide:grid-cols-[1.1fr_1fr] wide:p-[34px]">
          {booking.success ? (
            <div className="wide:col-span-2">
              <Eyebrow tone="club">{t('site.booking.eyebrow')}</Eyebrow>
              <h2 id="rdv-title" className="mb-[14px] mt-[10px] font-display text-[28px] font-black leading-[1.02] wide:text-[36px]">{t('booking.successTitle')}</h2>
              <p className="m-0 max-w-[60ch] text-[15px] leading-[1.55] text-ink-2">{t('booking.successBody')}</p>
            </div>
          ) : (
            <>
              <div>
                <Eyebrow tone="club">{t('site.booking.eyebrow')}</Eyebrow>
                <h2 id="rdv-title" className="mb-[14px] mt-[10px] font-display text-[28px] font-black leading-[1.02] wide:text-[36px]">{t('site.booking.title')}</h2>
                <div className="flex gap-2 overflow-x-auto pb-[6px]" role="group" aria-label={t('booking.dateLabel')}>
                  {days.map((d) => {
                    const value = iso(d);
                    const label = d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' });
                    return (
                      <button key={value} type="button" className="mm-chip flex-none" aria-pressed={booking.form.date === value} onClick={() => booking.update('date', value)}>
                        <span className="mm-n">{label}</span>
                      </button>
                    );
                  })}
                </div>
                {booking.errors.date && <p className="m-0 mt-1 text-[12.5px] text-[color:var(--stop)]">{booking.errors.date}</p>}
                <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label={t('booking.timeLabel')}>
                  {TIME_SLOTS.map((slot) => (
                    <button key={slot} type="button" className="mm-chip justify-center" aria-pressed={booking.form.time === slot} onClick={() => booking.update('time', slot)}>
                      <span className="mm-n">{slot}</span>
                    </button>
                  ))}
                </div>
                <p className="m-0 mt-3 text-[13px] text-ink-2">{t('site.booking.tz')}</p>
              </div>
              <form className="flex flex-col gap-[10px]" onSubmit={booking.handleSubmit} noValidate>
                <KitInput id="rdv-name" label={t('site.booking.name')} value={booking.form.name} onChange={(v) => booking.update('name', v)} error={booking.errors.name} autoComplete="name" required />
                <KitInput id="rdv-phone" label={t('site.booking.phone')} type="tel" inputMode="tel" value={booking.form.phone} onChange={(v) => booking.update('phone', v)} autoComplete="tel" />
                <KitInput id="rdv-email" label={t('site.booking.email')} type="email" inputMode="email" value={booking.form.email} onChange={(v) => booking.update('email', v)} error={booking.errors.email} autoComplete="email" required />
                <KitInput id="rdv-topic" label={t('site.booking.topic')} value={topic} onChange={setTopic} />
                <div className="mm-seg self-start" role="group" aria-label={t('site.booking.formatLabel')}>
                  {FORMATS.map((f) => (
                    <button key={f} type="button" aria-pressed={format === f} onClick={() => setFormat(f)} className={format === f ? 'bg-bento text-ink shadow-[var(--sh-soft)]' : ''}>
                      {t(`site.booking.format.${f}`)}
                    </button>
                  ))}
                </div>
                <KitButton type="submit" tone="club" disabled={booking.loading}>
                  {booking.loading ? t('booking.submitting') : t('site.booking.submit')}
                </KitButton>
                <span className="text-[13px] text-ink-2">{t('site.booking.note')}</span>
              </form>
            </>
          )}
        </section>
      </KitSection>

      {/* ── LES REPÈRES ──────────────────────────────────────────────────────── */}
      <KitSection className="pt-11 wide:pt-10">
        <div className="grid gap-4 wide:grid-cols-3">
          <div className="mm-bento hidden p-[22px] wide:block">
            <Eyebrow>{t('site.facts.basedLabel')}</Eyebrow>
            <b className="mt-2 block font-display text-[26px] font-black leading-none">{t('site.facts.basedValue')}</b>
          </div>
          <div className="mm-bento hidden p-[22px] wide:block">
            <Eyebrow>{t('site.facts.replyLabel')}</Eyebrow>
            <b className="mt-2 block font-display text-[26px] font-black leading-none">{t('site.facts.replyValue')}</b>
          </div>
          <a href={path('/faq')} className="mm-bento block p-[18px] text-ink no-underline wide:p-[22px]">
            <Eyebrow>{t('site.facts.faqLabel')}</Eyebrow>
            <b className="mt-[6px] block font-display text-[22px] font-black leading-none wide:mt-2 wide:text-[26px]">{t('site.facts.faqValue')}</b>
          </a>
        </div>
      </KitSection>

      {/* ── ÉCRIRE PLUTÔT (l'écriture `messages`, repliée) ───────────────────── */}
      <KitSection className="pt-6">
        <details className="mm-bento p-[22px]">
          <summary className="cursor-pointer font-display text-[20px] font-black">{t('site.write.title')}</summary>
          <form onSubmit={message.handleSubmit} noValidate className="mt-4 grid max-w-[640px] gap-1">
            <div aria-hidden="true" className="hidden">
              <input type="text" name="_hp" tabIndex={-1} autoComplete="off" value={message.form._hp} onChange={(e) => message.update('_hp', e.target.value)} />
            </div>
            <Field label={t('form.nameLabel')} value={message.form.name} onChange={(v) => message.update('name', v)} error={message.errors.name} autoComplete="name" required style={{ marginTop: 0 }} />
            <Field label={t('form.emailLabel')} type="email" value={message.form.email} onChange={(v) => message.update('email', v)} error={message.errors.email} inputMode="email" autoComplete="email" required />
            <Field
              as="select"
              label={t('form.subjectLabel')}
              value={message.form.subjectKey}
              onChange={(v) => message.update('subjectKey', v)}
              error={message.errors.subjectKey}
              placeholder={t('form.subjectPlaceholder')}
              options={SUBJECT_KEYS.map((key) => ({ value: key, label: t(`subjects.${key}`) }))}
              required
            />
            <Field as="textarea" label={t('form.messageLabel')} value={message.form.message} onChange={(v) => message.update('message', v)} error={message.errors.message} placeholder={t('form.messagePlaceholder')} rows={5} maxLength={MESSAGE_MAX} required />
            <div className="mt-3">
              <KitButton type="submit" tone="ink" disabled={message.loading}>{t('form.submit')}</KitButton>
            </div>
            <p className="m-0 mt-2 text-[13px] text-ink-2">{t('site.write.note')}</p>
          </form>
        </details>
      </KitSection>
    </DsNavHost>
  );
}
