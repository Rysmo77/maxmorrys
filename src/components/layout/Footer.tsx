import { useTranslation } from 'react-i18next';
import { lazy, Suspense, type ComponentType } from 'react';
import LocalizedLink from '../shared/LocalizedLink';
import { FacebookIcon, InstagramIcon, LinkedInIcon, TikTokIcon, XIcon, YouTubeIcon } from '../shared/SocialIcons';
import { SOCIAL_LINKS } from '../seo/seo-config';
import { legalName } from '../../lib/brand';
import { useLanguage } from '../../contexts/LanguageContext';
import { MegaFooter } from '../../design-system';

/*
 * LE PIED DE PAGE DU SITE — gabarit `mm-footer` des maquettes (passe 2, `Main.dc.html`).
 *
 * Quatre colonnes, dans l'ordre des maquettes : La lettre · Moi · Services · Contenus ; le
 * filet quatre teintes ; le nom géant (« Max-Morrys », la personne) ; puis la ligne légale.
 * Les liens pointent vers les adresses EXISTANTES — aucune URL publique ne change.
 *
 * La ligne légale garde TOUS les liens obligatoires (mentions, CGV, CGU, confidentialité,
 * cookies) : la maquette n'en montre que deux, la loi en demande davantage.
 *
 * LE FORMULAIRE EST CHARGÉ PARESSEUSEMENT : il importe `firebase/firestore`, et le pied est
 * dans le graphe statique de la première vue (`tests/unit/first-view-graph.test.ts`).
 * Le consentement se recueille dans le formulaire (case explicite, jamais pré-cochée).
 */
const NewsletterForm = lazy(() => import('../shared/NewsletterForm'));

const socialIcons: Record<string, ComponentType<{ className?: string }>> = {
  LinkedIn: LinkedInIcon,
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  YouTube: YouTubeIcon,
  TikTok: TikTokIcon,
  X: XIcon,
};

type FooterLink = { labelKey: string; path: string };

const COLUMNS: { titleKey: string; links: FooterLink[] }[] = [
  {
    titleKey: 'v3.colMe',
    links: [
      { labelKey: 'v3.journey', path: '/a-propos' },
      { labelKey: 'v3.work', path: '/conception/realisations' },
      { labelKey: 'v3.contact', path: '/contact' },
    ],
  },
  {
    titleKey: 'v3.colServices',
    links: [
      { labelKey: 'v3.commerces', path: '/conception/commerces-et-tpe' },
      { labelKey: 'v3.custom', path: '/conception/projets-sur-mesure' },
      { labelKey: 'v3.courses', path: '/formations' },
      { labelKey: 'v3.club', path: '/club-des-digitos' },
    ],
  },
  {
    titleKey: 'v3.colContents',
    links: [
      { labelKey: 'v3.blog', path: '/blog' },
      { labelKey: 'v3.media', path: '/podcast-et-videos' },
      { labelKey: 'v3.faq', path: '/faq' },
    ],
  },
];

const LEGAL: FooterLink[] = [
  { labelKey: 'links.legalNotice', path: '/legal/mentions-legales' },
  { labelKey: 'links.cgv', path: '/legal/cgv' },
  { labelKey: 'links.cgu', path: '/legal/cgu' },
  { labelKey: 'links.privacy', path: '/legal/confidentialite' },
  { labelKey: 'links.cookies', path: '/legal/cookies' },
];

export default function Footer() {
  const { t } = useTranslation('footer');
  const { language, toggleLanguage } = useLanguage();

  const legal = (
    <div className="mm-footer__legal flex-col stack:flex-row">
      <span>
        © {new Date().getFullYear()} {legalName} · Dakar
        {LEGAL.map((l) => (
          <span key={l.labelKey}>
            {' · '}
            <LocalizedLink to={l.path} className="mm-touch-extend text-inherit no-underline hover:underline">
              {t(l.labelKey)}
            </LocalizedLink>
          </span>
        ))}
      </span>
      <button
        type="button"
        onClick={toggleLanguage}
        className="mm-lang mm-touch-extend text-inherit"
        aria-label={t('v3.switchLanguage')}
      >
        {language === 'fr' ? <><b>FR</b> · EN</> : <>FR · <b>EN</b></>}
      </button>
    </div>
  );

  return (
    <MegaFooter
      name="Max-Morrys"
      className="mm-footer relative z-[1] bg-night text-[color:var(--text-body)]"
      innerClassName="px-0 stack:px-0"
      innerStyle={{
        maxWidth: 'calc(var(--site-measure, 1200px) + 2 * var(--site-gutter, 40px))',
        marginInline: 'auto',
      }}
      legal={legal}
    >
      <div className="mm-footer__cols" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div>
          <h6>{t('v3.colLetter')}</h6>
          <p className="m-0 text-[15px] leading-[1.5] max-w-[34ch] text-[color:var(--ink)]">{t('v3.letterText')}</p>
          <Suspense fallback={<div aria-hidden className="h-[104px]" />}>
            <NewsletterForm source="footer" />
          </Suspense>
          <div className="flex flex-wrap gap-2 mt-[18px]">
            {SOCIAL_LINKS.map(({ name, url }) => {
              const SocialIcon = socialIcons[name];
              return (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="mm-touch-extend w-10 h-10 rounded-pill bg-[color:var(--fill-1)] hover:bg-[color:var(--fill-2)] border border-[color:var(--line)] flex items-center justify-center text-ink-2 hover:text-ink transition-colors duration-ui"
                >
                  {SocialIcon && <SocialIcon className="w-4 h-4" />}
                </a>
              );
            })}
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.titleKey}>
            <h6>{t(col.titleKey)}</h6>
            <ul>
              {col.links.map((l) => (
                <li key={l.labelKey}>
                  <LocalizedLink to={l.path}>{t(l.labelKey)}</LocalizedLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </MegaFooter>
  );
}
