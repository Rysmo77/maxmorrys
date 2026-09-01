import { useTranslation } from 'react-i18next';
import { Button, GlassPanel } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import DsNavHost from '../components/layout/DsNavHost';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { SiteDisplay, SiteEyebrow } from '../components/site';

/**
 * /404 — même motif que le /403, dans le thème ambiant.
 *
 * Le kit ne rend en nuit que le 403, et la distinction tient : le 403 parle de RÈGLES, il
 * interrompt ; le 404 parle de CONTENU, et il oriente. Le second reste donc dans le thème que
 * la personne a choisi.
 *
 * Un message d'erreur ne s'excuse pas : motif réel, conséquence, sortie — dans cet ordre.
 * D'où l'absence de « oups », et la présence d'un encart qui dit ce qui a pu se passer plutôt
 * que de laisser deviner.
 */
export default function NotFound() {
  const { t } = useTranslation('errors');
  const path = useLocalizedPath();

  return (
    <div className="min-h-screen flex items-center justify-center px-[18px] py-16">
      <SEOHead title={t('notFound.seoTitle')} noIndex />

      <DsNavHost className="play w-full max-w-[520px]">
        {/* Le code, écrit. Quelqu'un qui cherche « erreur 404 » doit le trouver. */}
        <p
          className="mm-num rv-s m-0 leading-none tracking-[-.04em] text-[96px]"
          style={{ color: 'color-mix(in srgb, var(--ink) 12%, transparent)' }}
          aria-hidden="true"
        >
          404
        </p>

        <SiteDisplay
          lines={t('notFound.titleLines', { returnObjects: true }) as string[]}
          size={30}
          style={{ marginTop: '6px' }}
        />

        <p className="rv mt-3 text-lede text-ink-2" style={{ ['--i' as string]: 4 }}>
          {t('notFound.text')}
        </p>

        {/* Faux verre : cet encart défile avec la page. */}
        <GlassPanel level="truth" className="rv mt-5" style={{ ['--i' as string]: 5 }}>
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('notFound.truthTitle')}</SiteEyebrow>
          <p className="m-0 text-meta-2 text-ink-2 leading-[1.55]">{t('notFound.truthBody')}</p>
        </GlassPanel>

        <div className="mt-5 flex flex-col stack:flex-row gap-3">
          <Button href={path('/blog')} tone="informe" size="sm" fullWidth={false}>
            {t('notFound.blog')}
          </Button>
          <Button href={path('/')} tone="quiet" size="sm" fullWidth={false}>
            {t('notFound.home')}
          </Button>
        </div>
      </DsNavHost>
    </div>
  );
}
