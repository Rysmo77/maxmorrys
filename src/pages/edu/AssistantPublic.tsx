import { useTranslation } from 'react-i18next';
import { Icon, Num } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import { PillLink } from '../../components/edu/g1/EduPublic';
import EduPreFooter from '../../components/edu/g2/EduPreFooter';
import { RYSMO_BASE_DAILY, RYSMO_CLUB_BONUS, RYSMO_CLUB_DAILY } from '../../lib/rysmo/quota';

/**
 * /apprendre/assistant — RYSMO IA, PAGE PUBLIQUE.  Maquettes `Edu-RysmoInfo.dc.html` (+ mobile).
 *
 * ⚠️ LES QUOTAS NE SONT PAS CEUX DE LA MAQUETTE. Elle affichait 5 / 8 / « 50 questions pour
 * 2 000 F », étiquetés « à confirmer ». Les nombres rendus ici sont DÉRIVÉS de
 * `lib/rysmo/quota.ts`, miroir des constantes du Worker gardé par `rysmo-quota.test.ts` :
 * un compte sans abonnement, puis un membre du Club. La carte « recharge » ne cite ni volume
 * ni prix : la grille des packs vit côté serveur et s'affiche dans l'espace, avant paiement.
 *
 * La conversation du héros est une ILLUSTRATION de ce que fait l'assistant, étiquetée comme
 * telle ; elle ne cite aucune personne ni aucune leçon réelle.
 */

const LIMITS = ['missions', 'validate', 'lesson', 'memory'] as const;

export default function AssistantPublicPage() {
  const { t } = useTranslation('ecrans');
  const k = (s: string, o?: Record<string, unknown>) => t(`edu.assistant.${s}`, o);
  const asOf = new Date();

  return (
    <div className="eg1">
      <SEOHead title={k('seoTitle')} description={k('seoDescription')} />

      <section className="eg1-hero dk">
        <div className="mm-mesh" aria-hidden="true"><b /><b /><b /></div>
        <div className="eg1-hero__in">
          <div className="eg1-split is-hero">
            <div>
              <span className="mm-script">{k('script')}</span>
              <h1 className="mm-up">{k('heroTitle')}</h1>
              <p className="eg1-hero__lede">{k('lede')}</p>
              <PillLink to="/formations">{k('cta')}</PillLink>
            </div>
            <div className="eg1-chat" aria-label={k('demoLabel')}>
              <div className="eg1-rysmo__head">
                <span className="eg1-rysmo__ico" style={{ width: '40px', height: '40px', borderRadius: '12px' }}><Icon name="sparkles" size={18} /></span>
                <b style={{ fontSize: '15px', font: '700 15px/1.2 var(--f-body)', color: 'var(--paper-fixed)' }}>{k('demoHead')}</b>
                <div className="mm-quota" style={{ marginLeft: 'auto' }} aria-hidden="true">
                  {Array.from({ length: RYSMO_CLUB_DAILY }, (_, i) => <i key={i} className={i < RYSMO_BASE_DAILY ? 'on' : undefined} />)}
                </div>
              </div>
              <div className="eg1-chat__q">{k('demoQ')}</div>
              <div className="eg1-chat__a">{k('demoA')}</div>
              <span className="mm-tag is-demo" style={{ alignSelf: 'flex-start' }}>{k('demoTag')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Le quota ───────────────────────────────────────────────────── */}
      <section className="eg1-wrap">
        <span className="mm-eyebrow">{k('quota.eyebrow')}</span>
        <h2 className="mm-d eg1-h2">{k('quota.title')}</h2>
        <div className="eg1-quotas">
          <div className="eg1-quota">
            <span className="mm-eyebrow">{k('quota.base.label')}</span>
            <Num className="eg1-quota__v" value={RYSMO_BASE_DAILY} source="server" asOf={asOf} showAsOf={false} />
            <span style={{ fontSize: '14px', color: 'var(--ink-2)' }}>{k('quota.perDay')}</span>
            <p>{k('quota.base.body')}</p>
          </div>
          <div className="eg1-quota dk" style={{ background: 'var(--ink-fixed)', color: 'var(--paper-fixed)', borderColor: 'transparent' }}>
            <span className="mm-eyebrow" style={{ color: 'var(--mm-violet-c)' }}>{k('quota.club.label')}</span>
            <Num className="eg1-quota__v" value={RYSMO_CLUB_DAILY} source="server" asOf={asOf} showAsOf={false} />
            <span style={{ fontSize: '14px', color: 'var(--ink-2)' }}>{k('quota.perDay')}</span>
            <p>{k('quota.club.body', { base: RYSMO_BASE_DAILY, bonus: RYSMO_CLUB_BONUS })}</p>
          </div>
          <div className="eg1-quota">
            <span className="mm-eyebrow">{k('quota.pack.label')}</span>
            <span className="eg1-quota__v" aria-hidden="true"><Icon name="zap" size={52} strokeWidth={2} /></span>
            <span style={{ fontSize: '14px', color: 'var(--ink-2)' }}>{k('quota.pack.unit')}</span>
            <p>{k('quota.pack.body')}</p>
          </div>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: '13px', color: 'var(--ink-2)' }}>{k('quota.reset')}</p>
      </section>

      {/* ── Les limites ────────────────────────────────────────────────── */}
      <section className="eg1-wrap is-last">
        <div className="eg1-limits">
          <div>
            <span className="mm-eyebrow">{k('limits.eyebrow')}</span>
            <h2 className="mm-d eg1-h2" style={{ marginBottom: 0 }}>{k('limits.title')}</h2>
          </div>
          <div className="eg1-limits__grid">
            {LIMITS.map((l) => (
              <div key={l} className="mm-card">
                <b>{k(`limits.items.${l}.title`)}</b>
                <span>{k(`limits.items.${l}.body`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EduPreFooter source="edu-assistant" />
    </div>
  );
}
