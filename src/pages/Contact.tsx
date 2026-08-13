import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, MessageSquare, Send, Calendar, X, Clock, Loader2, ChevronDown } from 'lucide-react';
import AnimatedIcon from '../components/shared/AnimatedIcon';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { saveAppointment, getAllFAQ } from '../lib/firestore';
import type { FAQ } from '../types';
import { captureError } from '../lib/sentry';
import { trackGenerateLead, trackContact } from '../lib/tracking';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import {
  SITE_URL, DEFAULT_OG_IMAGE, SOCIAL_URLS,
  CONTACT_EMAIL, CONTACT_PHONE_E164, CONTACT_PHONE_DISPLAY, WHATSAPP_BASE_URL,
} from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';

const viewportOnce = { once: true, amount: 0.2 } as const;

// Coordonnées : labelKey/valueKey traduits au rendu ; les valeurs « brutes »
// (email, numéro) restent en dur car ce sont des données, pas du texte.
const contactInfo = [
  { icon: Mail, labelKey: 'info.email', value: CONTACT_EMAIL, valueKey: '', link: `mailto:${CONTACT_EMAIL}` },
  { icon: Phone, labelKey: 'info.phone', value: CONTACT_PHONE_DISPLAY, valueKey: '', link: `tel:${CONTACT_PHONE_E164}` },
  { icon: MapPin, labelKey: 'info.location', value: '', valueKey: 'info.locationValue', link: '' },
  { icon: MessageSquare, labelKey: 'info.whatsapp', value: '', valueKey: 'info.whatsappValue', link: WHATSAPP_BASE_URL },
];

const TIME_SLOTS = [
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

// Clés de sujet stables ; le libellé affiché est traduit au rendu.
const SUBJECT_KEYS = ['coaching', 'formationInfo', 'partnership', 'strategy', 'other'];

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Contact() {
  const { t } = useTranslation('contact');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', _hp: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  useEffect(() => {
    getAllFAQ().then(setFaqs).catch(() => {});
  }, []);

  // Booking modal
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '', email: '', phone: '',
    date: '', time: TIME_SLOTS[0],
    subject: t(`subjects.${SUBJECT_KEYS[0]}`), message: '',
  });
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t('validation.nameRequired');
    if (!form.email.trim()) errs.email = t('validation.emailRequired');
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = t('validation.emailInvalid');
    if (!form.subject.trim()) errs.subject = t('validation.subjectRequired');
    if (!form.message.trim()) errs.message = t('validation.messageRequired');
    else if (form.message.trim().length < 10) errs.message = t('validation.messageTooShort');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form._hp) return; // honeypot — silently drop bot submissions
    if (!validate()) return;
    setLoading(true);
    try {
      const { _hp: _honeypot, ...payload } = form;
      void _honeypot; // honeypot — exclu de l'envoi
      await addDoc(collection(db, 'messages'), {
        ...payload,
        sentAt: new Date().toISOString(),
        status: 'new',
      });
      trackGenerateLead('contact_form');
      addToast('success', t('toast.messageSuccess'));
      setForm({ name: '', email: '', subject: '', message: '', _hp: '' });
    } catch (error: unknown) {
      captureError(error, { context: 'Send contact message failed' });
      addToast('error', error instanceof Error ? error.message : t('toast.messageError'));
    }
    setLoading(false);
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      if (field === 'email' && value && !EMAIL_RE.test(value)) return; // keep error while still invalid
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateBooking = () => {
    const errs: Record<string, string> = {};
    if (!bookingForm.name.trim()) errs.name = t('validation.nameRequired');
    if (!bookingForm.email.trim()) errs.email = t('validation.emailRequired');
    else if (!EMAIL_RE.test(bookingForm.email.trim())) errs.email = t('validation.emailInvalid');
    if (!bookingForm.date) errs.date = t('validation.dateRequired');
    if (!bookingForm.time) errs.time = t('validation.timeRequired');
    setBookingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBooking()) return;
    setBookingLoading(true);
    try {
      await saveAppointment({
        name: bookingForm.name.trim(),
        email: bookingForm.email.trim(),
        phone: bookingForm.phone.trim() || undefined,
        date: bookingForm.date,
        time: bookingForm.time,
        subject: bookingForm.subject,
        message: bookingForm.message.trim() || undefined,
      });
      trackGenerateLead('appointment_booking');
      setBookingSuccess(true);
    } catch (error: unknown) {
      captureError(error, { context: 'Save appointment failed' });
      addToast('error', error instanceof Error ? error.message : t('toast.appointmentError'));
    } finally {
      setBookingLoading(false);
    }
  };

  const closeBooking = () => {
    setBookingOpen(false);
    setBookingSuccess(false);
    setBookingForm({ name: '', email: '', phone: '', date: '', time: TIME_SLOTS[0], subject: t(`subjects.${SUBJECT_KEYS[0]}`), message: '' });
    setBookingErrors({});
  };

  const today = new Date().toISOString().split('T')[0];

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder-neutral-400';

  return (
    <div>
      <SEOHead
        title={t('seoTitle')}
        description={t('seoDescription')}
      />
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
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Dakar',
          addressCountry: 'SN',
        },
        priceRange: '€€',
        sameAs: [WHATSAPP_BASE_URL, ...SOCIAL_URLS],
      }} />

      {/* ── HERO ── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-20 bg-neutral-50 dark:bg-neutral-900">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem} className="flex items-center gap-3 mb-5">
            <AnimatedIcon
              icon={Mail}
              animation="float"
              className="w-11 h-11 rounded-2xl bg-brand-100 dark:bg-brand-900/30 shrink-0"
              iconClassName="w-5 h-5 text-brand-600 dark:text-brand-400"
            />
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400">
              {t('eyebrow')}
            </p>
          </motion.div>
          <div className="grid lg:grid-cols-2 gap-8 items-end">
            <motion.h1 variants={staggerItem} className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95]">
              {t('heroTitle1')}<br />{t('heroTitle2')}
            </motion.h1>
            <motion.p variants={staggerItem} className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed lg:pb-2">
              {t('heroSubtitle')}
            </motion.p>
          </div>
        </motion.div>
      </section>

      <div className="bg-white dark:bg-neutral-950 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">

            {/* Formulaire */}
            <motion.div
              className="lg:col-span-2"
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-8 lg:p-10 border border-neutral-100 dark:border-neutral-800">
                <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-8">
                  {t('form.title')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Honeypot — hidden from users, filled only by bots */}
                  <div aria-hidden="true" className="hidden">
                    <input
                      type="text"
                      name="_hp"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form._hp}
                      onChange={(e) => setForm((p) => ({ ...p, _hp: e.target.value }))}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Input
                      label={t('form.nameLabel')}
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      error={errors.name}
                      placeholder={t('form.namePlaceholder')}
                    />
                    <Input
                      label={t('form.emailLabel')}
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      error={errors.email}
                      placeholder={t('form.emailPlaceholder')}
                    />
                  </div>
                  <Input
                    label={t('form.subjectLabel')}
                    value={form.subject}
                    onChange={(e) => update('subject', e.target.value)}
                    error={errors.subject}
                    placeholder={t('form.subjectPlaceholder')}
                  />
                  <Textarea
                    label={t('form.messageLabel')}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    error={errors.message}
                    placeholder={t('form.messagePlaceholder')}
                    rows={5}
                  />
                  <Button type="submit" loading={loading} icon={<Send className="w-4 h-4" />}>
                    {t('form.submit')}
                  </Button>
                </form>
              </div>
            </motion.div>

            {/* Infos contact */}
            <motion.div
              className="space-y-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {contactInfo.map((info) => {
                const label = t(info.labelKey);
                const value = info.valueKey ? t(info.valueKey) : info.value;
                return (
                <motion.div key={info.labelKey} variants={staggerItem}>
                  {info.link ? (
                    <a
                      href={info.link}
                      target={info.link.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      onClick={() => trackContact('appointment_cta')}
                      className="group flex items-center gap-4 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                        <info.icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-0.5">{label}</p>
                        <p className="font-semibold text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors text-sm">{value}</p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                      <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                        <info.icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-0.5">{label}</p>
                        <p className="font-semibold text-neutral-900 dark:text-white text-sm">{value}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
                );
              })}

              {/* Rendez-vous */}
              <motion.div variants={staggerItem} className="p-6 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white">
                <Calendar className="w-8 h-8 text-brand-200 mb-4" />
                <h3 className="font-black text-lg mb-2">{t('booking.cardTitle')}</h3>
                <p className="text-brand-100 text-sm mb-5 leading-relaxed">
                  {t('booking.cardText')}
                </p>
                <button
                  onClick={() => setBookingOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-bold rounded-full hover:bg-brand-50 transition-colors text-sm"
                >
                  <Clock className="w-4 h-4" />
                  {t('booking.cardButton')}
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      {faqs.length > 0 && (
        <motion.section
          className="bg-neutral-50 dark:bg-neutral-900 py-24 border-t border-neutral-100 dark:border-neutral-800"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4 text-center">
              {t('faqEyebrow')}
            </p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white text-center mb-14">
              {t('faqTitle')}
            </h2>
            <motion.div
              className="divide-y divide-neutral-200 dark:divide-neutral-700"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {faqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <motion.div key={faq.id} variants={staggerItem}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                    >
                      <span className="font-semibold text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors text-sm sm:text-base">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-500' : ''}`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pb-5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ── BOOKING MODAL ── */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeBooking} />
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-500" />
                <h2 className="font-bold text-neutral-900 dark:text-white">{t('booking.modalTitle')}</h2>
              </div>
              <button onClick={closeBooking} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-success-500" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">{t('booking.successTitle')}</h3>
                <p className="text-neutral-500 text-sm mb-6">
                  {t('booking.successTextLine1')}<br />
                  {t('booking.successTextLine2')}
                </p>
                <Button onClick={closeBooking}>{t('booking.close')}</Button>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">{t('booking.dateLabel')}</label>
                    <input
                      type="date"
                      min={today}
                      value={bookingForm.date}
                      onChange={(e) => { setBookingForm((p) => ({ ...p, date: e.target.value })); if (bookingErrors.date) setBookingErrors((p) => ({ ...p, date: '' })); }}
                      className={`${inputCls} ${bookingErrors.date ? 'border-error-500' : ''}`}
                    />
                    {bookingErrors.date && <p className="text-xs text-error-500">{bookingErrors.date}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">{t('booking.timeLabel')}</label>
                    <select
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm((p) => ({ ...p, time: e.target.value }))}
                      className={inputCls}
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('booking.subjectLabel')}</label>
                  <select
                    value={bookingForm.subject}
                    onChange={(e) => setBookingForm((p) => ({ ...p, subject: e.target.value }))}
                    className={inputCls}
                  >
                    {SUBJECT_KEYS.map((key) => {
                      const label = t(`subjects.${key}`);
                      return <option key={key} value={label}>{label}</option>;
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">{t('booking.nameLabel')}</label>
                    <input
                      value={bookingForm.name}
                      onChange={(e) => { setBookingForm((p) => ({ ...p, name: e.target.value })); if (bookingErrors.name) setBookingErrors((p) => ({ ...p, name: '' })); }}
                      placeholder={t('booking.namePlaceholder')}
                      className={`${inputCls} ${bookingErrors.name ? 'border-error-500' : ''}`}
                    />
                    {bookingErrors.name && <p className="text-xs text-error-500">{bookingErrors.name}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">{t('booking.phoneLabel')}</label>
                    <input
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder={t('booking.phonePlaceholder')}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('booking.emailLabel')}</label>
                  <input
                    type="email"
                    value={bookingForm.email}
                    onChange={(e) => { setBookingForm((p) => ({ ...p, email: e.target.value })); if (bookingErrors.email) setBookingErrors((p) => ({ ...p, email: '' })); }}
                    placeholder={t('booking.emailPlaceholder')}
                    className={`${inputCls} ${bookingErrors.email ? 'border-error-500' : ''}`}
                  />
                  {bookingErrors.email && <p className="text-xs text-error-500">{bookingErrors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('booking.notesLabel')}</label>
                  <textarea
                    value={bookingForm.message}
                    onChange={(e) => setBookingForm((p) => ({ ...p, message: e.target.value }))}
                    rows={3}
                    placeholder={t('booking.notesPlaceholder')}
                    className={inputCls}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeBooking}>{t('booking.cancel')}</Button>
                  <Button
                    type="submit"
                    disabled={bookingLoading}
                    icon={bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  >
                    {bookingLoading ? t('booking.submitting') : t('booking.submit')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
