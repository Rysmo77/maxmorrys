import { useTranslation } from 'react-i18next';
import { Mail, MapPin, Phone, Linkedin, Facebook, Instagram, Youtube, ArrowUpRight } from 'lucide-react';
import type { ComponentType } from 'react';
import LocalizedLink from '../shared/LocalizedLink';
import NewsletterForm from '../shared/NewsletterForm';
import { XIcon, TikTokIcon } from '../shared/SocialIcons';
import { SOCIAL_LINKS } from '../seo/seo-config';

const socialIcons: Record<string, ComponentType<{ className?: string }>> = {
  LinkedIn: Linkedin,
  Facebook,
  Instagram,
  YouTube: Youtube,
  TikTok: TikTokIcon,
  X: XIcon,
};

const footerLinks = {
  plateforme: [
    { labelKey: 'links.formations', path: '/formations' },
    { labelKey: 'links.blog', path: '/blog' },
    { labelKey: 'links.podcasts', path: '/podcasts' },
    { labelKey: 'links.videos', path: '/videos' },
    { labelKey: 'links.faq', path: '/faq' },
  ],
  apropos: [
    { labelKey: 'links.about', path: '/a-propos' },
    { labelKey: 'links.contact', path: '/contact' },
    { labelKey: 'links.booking', path: '/contact' },
  ],
  legal: [
    { labelKey: 'links.legalNotice', path: '/legal/mentions-legales' },
    { labelKey: 'links.privacy', path: '/legal/confidentialite' },
    { labelKey: 'links.cgu', path: '/legal/cgu' },
    { labelKey: 'links.cgv', path: '/legal/cgv' },
    { labelKey: 'links.cookies', path: '/legal/cookies' },
  ],
};

export default function Footer() {
  const { t } = useTranslation('footer');
  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-neutral-400">

      {/* Newsletter — style "Become an Insider" MF */}
      <div className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-400 mb-4">
              {t('newsletterEyebrow')}
            </p>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 tracking-tight">
              {t('newsletterTitle')}
            </h2>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              {t('newsletterText')}
            </p>
            <div className="max-w-md mx-auto">
              <NewsletterForm source="footer" />
            </div>
          </div>
        </div>
      </div>

      {/* Colonnes de liens */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div>
            <LocalizedLink to="/" className="block mb-5">
              <span className="font-black text-xl tracking-tight text-white">MAX-MORRYS</span>
            </LocalizedLink>
            <p className="text-sm leading-relaxed mb-6">
              {t('brandTagline')}
            </p>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map(({ name, url }) => {
                const Icon = socialIcons[name];
                return (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}
                    className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Plateforme */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-[0.25em] mb-5">{t('columns.platform')}</h3>
            <ul className="space-y-3">
              {footerLinks.plateforme.map((link) => (
                <li key={link.path}>
                  <LocalizedLink to={link.path} className="text-sm hover:text-white transition-colors inline-flex items-center gap-1 group">
                    {t(link.labelKey)}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </div>

          {/* À propos */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-[0.25em] mb-5">{t('columns.about')}</h3>
            <ul className="space-y-3">
              {footerLinks.apropos.map((link) => (
                <li key={link.labelKey}>
                  <LocalizedLink to={link.path} className="text-sm hover:text-white transition-colors inline-flex items-center gap-1 group">
                    {t(link.labelKey)}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </LocalizedLink>
                </li>
              ))}
            </ul>
            <h3 className="text-white font-bold text-xs uppercase tracking-[0.25em] mb-5 mt-8">{t('columns.legal')}</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <LocalizedLink to={link.path} className="text-sm hover:text-white transition-colors inline-flex items-center gap-1 group">
                    {t(link.labelKey)}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-[0.25em] mb-5">{t('columns.contact')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <span>hello@maxmorrys.me</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                <span>+221 77 604 19 85</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Dakar, Sénégal</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs">{t('copyright', { year: new Date().getFullYear() })}</p>
          <p className="text-xs">
            {t('operatedByPrefix')}{' '}
            <a
              href="https://myonoma.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white font-medium underline-offset-2 hover:underline transition-colors"
            >
              My Onoma SARL
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
