import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';
import { Wordmark } from '../../../design-system';
import { useLocalizedPath } from '../../../contexts/LanguageContext';
import { accueilPublic, espaceCourant } from '../../../lib/hosts';
import SEOHead from '../../seo/SEOHead';
import DsNavHost from '../../layout/DsNavHost';
import LocalizedLink from '../../shared/LocalizedLink';
import FloatingCovers from './FloatingCovers';

/**
 * L'ÉCRAN D'ACCÈS EN DEUX MOITIÉS — maquette `Edu-Connexion` (connexion, inscription, mot
 * de passe oublié). À gauche le formulaire sur 420 px, l'encart bleu « un seul compte » et la
 * ligne légale ; à droite le panneau de nuit « Ce qui t'attend » : les couvertures des VRAIES
 * formations (rien si aucune) et trois faits du produit.
 *
 * Ni barre haute ni pied de page, comme la maquette : en tête, le mot-symbole de l'espace
 * (lien vers son accueil) et un « Retour » discret — la page précédente si l'historique en a
 * une, sinon l'accueil de l'hôte courant. Sous 1080 px, le panneau de nuit se réduit à un
 * bandeau au-dessus du titre (maquette mobile : mesh + script « Ta leçon t'attend »).
 *
 * Les faits du panneau sont ceux qui existent : la leçon en cours (progression enregistrée),
 * Rysmo IA et son quota, les certificats vérifiables. « Ta cohorte et son prochain live » de
 * la maquette n'a aucun producteur : remplacé.
 */
interface AuthSplitProps {
  title: string;
  subtitle?: string;
  seoTitle: string;
  noIndex?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthSplit({ title, subtitle, seoTitle, noIndex, children, footer }: AuthSplitProps) {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const localize = useLocalizedPath();
  const espace = espaceCourant();
  const accueil = localize(accueilPublic(espace));

  /* React Router numérote ses entrées d'historique (`state.idx`) : 0 veut dire qu'on est
     arrivé ici directement — un lien, un onglet neuf. Il n'y a alors rien « avant » à qui
     revenir, et l'accueil de l'espace est la sortie honnête. */
  const retour = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(accueil);
  };

  return (
    <DsNavHost
      className="mx-auto grid w-full max-w-[1440px] wide:min-h-[800px] wide:grid-cols-2"
    >
      <SEOHead title={seoTitle} noIndex={noIndex} />
      <main className="flex flex-col px-4 pb-8 stack:px-16">
        <div className="flex items-center justify-between gap-3 pt-5">
          <a href={accueil} aria-label={t('v3.home')} className="mm-touch-extend no-underline">
            <Wordmark brand="kit" size={19} badge={espace === 'edu' ? 'EDU' : undefined} />
          </a>
          <button
            type="button"
            onClick={retour}
            className="mm-touch-extend inline-flex items-center gap-1.5 h-9 px-3 rounded-pill text-meta font-semibold text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
          >
            <Icon name="chevron-left" size={16} strokeWidth={2.4} />
            {t('v3.back')}
          </button>
        </div>
        <div className="dk relative isolate mt-4 overflow-hidden rounded-xl px-5 py-6 wide:hidden" style={{ background: 'var(--night)' }}>
          <div className="mm-mesh m-edu" style={{ opacity: 0.6 }}><b /><b /><b /></div>
          <span className="mm-script relative text-[24px]">{t('v3.mobileKicker')}</span>
        </div>
        <div className="mx-auto my-auto w-full max-w-[420px] py-10">
          <h1 className="mm-d m-0 mb-2.5 text-[40px] wide:text-[52px]">{title}</h1>
          {subtitle ? <p className="m-0 mb-[26px] text-ink-2">{subtitle}</p> : null}
          <div className="flex flex-col gap-3">{children}</div>
          {footer}
          <div className="mt-[18px] flex items-center gap-2.5 rounded-[16px] px-3.5 py-3 text-[13px]" style={{ background: 'var(--mm-bleu-c)', color: 'var(--ink-fixed)' }}>
            <Icon name="user" size={16} />
            <span>{t('v3.oneAccount')}</span>
          </div>
        </div>
        <span className="text-[12px] text-ink-3">
          {t('v3.legalPrefix')}{' '}
          <LocalizedLink to="/legal/cgv" className="text-ink-3 underline">{t('v3.cgv')}</LocalizedLink>{' '}
          {t('v3.and')}{' '}
          <LocalizedLink to="/legal/confidentialite" className="text-ink-3 underline">{t('v3.privacy')}</LocalizedLink>.
        </span>
      </main>

      <div className="dk relative isolate m-3.5 hidden flex-col justify-between overflow-hidden rounded-[34px] p-12 wide:flex" style={{ background: 'var(--night)' }}>
        <div className="mm-mesh m-edu" style={{ opacity: 0.6 }}><b /><b /><b /></div>
        <span className="mm-script relative text-[30px]">{t('login.asideKicker')}</span>
        <div className="relative flex justify-center">
          <FloatingCovers />
        </div>
        <ul className="relative m-0 flex list-none flex-col gap-3 p-0 text-[15px] text-[color:color-mix(in_srgb,var(--paper-fixed)_80%,transparent)]">
          {(['aside1', 'aside2', 'aside3'] as const).map((k) => (
            <li key={k} className="flex items-start gap-2">
              <Icon name="check" size={16} style={{ marginTop: '3px', flex: 'none' }} />
              {t(`v3.${k}`)}
            </li>
          ))}
        </ul>
      </div>
    </DsNavHost>
  );
}
