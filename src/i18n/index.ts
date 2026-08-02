import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANG, LANGS } from './routing';

// Namespaces — chargés en statique (bundle).
import commonFr from './locales/fr/common.json';
import commonEn from './locales/en/common.json';
import navFr from './locales/fr/nav.json';
import navEn from './locales/en/nav.json';
import footerFr from './locales/fr/footer.json';
import footerEn from './locales/en/footer.json';
import sharedFr from './locales/fr/shared.json';
import sharedEn from './locales/en/shared.json';
import homeFr from './locales/fr/home.json';
import homeEn from './locales/en/home.json';
import aboutFr from './locales/fr/about.json';
import aboutEn from './locales/en/about.json';
import formationsFr from './locales/fr/formations.json';
import formationsEn from './locales/en/formations.json';
import blogFr from './locales/fr/blog.json';
import blogEn from './locales/en/blog.json';
import mediaFr from './locales/fr/media.json';
import mediaEn from './locales/en/media.json';
import faqFr from './locales/fr/faq.json';
import faqEn from './locales/en/faq.json';
import contactFr from './locales/fr/contact.json';
import contactEn from './locales/en/contact.json';
import errorsFr from './locales/fr/errors.json';
import errorsEn from './locales/en/errors.json';
import authFr from './locales/fr/auth.json';
import authEn from './locales/en/auth.json';
import legalFr from './locales/fr/legal.json';
import legalEn from './locales/en/legal.json';
import lmsFr from './locales/fr/lms.json';
import lmsEn from './locales/en/lms.json';
import lmsTabsFr from './locales/fr/lmsTabs.json';
import lmsTabsEn from './locales/en/lmsTabs.json';
import clubFr from './locales/fr/club.json';
import clubEn from './locales/en/club.json';
import adminFr from './locales/fr/admin.json';
import adminEn from './locales/en/admin.json';
import adminClubFr from './locales/fr/adminClub.json';
import adminClubEn from './locales/en/adminClub.json';
import uiFr from './locales/fr/ui.json';
import uiEn from './locales/en/ui.json';
import rysmoFr from './locales/fr/rysmo.json';
import rysmoEn from './locales/en/rysmo.json';

export const NAMESPACES = [
  'common',
  'nav',
  'footer',
  'shared',
  'home',
  'about',
  'formations',
  'blog',
  'media',
  'faq',
  'contact',
  'errors',
  'auth',
  'legal',
  'lms',
  'lmsTabs',
  'club',
  'admin',
  'adminClub',
  'ui',
  'rysmo',
] as const;

const resources = {
  fr: {
    common: commonFr,
    nav: navFr,
    footer: footerFr,
    shared: sharedFr,
    home: homeFr,
    about: aboutFr,
    formations: formationsFr,
    blog: blogFr,
    media: mediaFr,
    faq: faqFr,
    contact: contactFr,
    errors: errorsFr,
    auth: authFr,
    legal: legalFr,
    lms: lmsFr,
    lmsTabs: lmsTabsFr,
    club: clubFr,
    admin: adminFr,
    adminClub: adminClubFr,
    ui: uiFr,
    rysmo: rysmoFr,
  },
  en: {
    common: commonEn,
    nav: navEn,
    footer: footerEn,
    shared: sharedEn,
    home: homeEn,
    about: aboutEn,
    formations: formationsEn,
    blog: blogEn,
    media: mediaEn,
    faq: faqEn,
    contact: contactEn,
    errors: errorsEn,
    auth: authEn,
    legal: legalEn,
    lms: lmsEn,
    lmsTabs: lmsTabsEn,
    club: clubEn,
    admin: adminEn,
    adminClub: adminClubEn,
    ui: uiEn,
    rysmo: rysmoEn,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANG,
  fallbackLng: DEFAULT_LANG,
  supportedLngs: LANGS,
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
