import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import { EduNightHero, PillLink } from '../../components/edu/g1/EduPublic';
import EduPreFooter from '../../components/edu/g2/EduPreFooter';

/**
 * /apprendre/methode — LA MÉTHODE.  Maquettes `Edu-Methode.dc.html` (+ `-mobile`), passe 2.
 *
 * Quatre temps, une leçon type, la cohorte, ce qui fait la différence, puis le pré-pied Edu.
 *
 * ⚠️ LE PANNEAU « COHORTE » DE LA MAQUETTE PORTE DES CHIFFRES D'EXEMPLE (« une cohorte de 12
 * personnes », 3 · 5 · 2 · 1 · 0 · 1 par module). Ils ne sont PAS rendus : les barres restent
 * une ILLUSTRATION sans compte, étiquetée comme telle, et la légende ne cite aucun effectif.
 * L'avancement réel d'une cohorte vit dans l'espace connecté (`/mon-espace/cohorte`).
 * Même règle pour l'étiquette « 9 min · 14 Mo » de la vidéo : aucune leçon réelle n'est citée.
 */

const STEPS: { key: string; color: string; icon: IconName }[] = [
  { key: 'read', color: 'var(--mm-bleu-f)', icon: 'book' },
  { key: 'practice', color: 'var(--mm-violet-f)', icon: 'sparkles' },
  { key: 'cohort', color: 'var(--mm-corail-f)', icon: 'users' },
  { key: 'cert', color: 'var(--mm-teal-f)', icon: 'award' },
];

const LESSON_PARTS = ['text', 'mission', 'rysmo', 'review'] as const;
const TICKS = ['review', 'live', 'progress'] as const;
const DIFF = ['mission', 'review', 'live', 'rysmo', 'offline', 'cert'] as const;
/* Illustration seulement : des longueurs de barre, aucune mesure. */
const BARS: { scale: number; mine?: boolean }[] = [
  { scale: 0.5 }, { scale: 0.83, mine: true }, { scale: 0.33 }, { scale: 0.17 }, { scale: 0.06 }, { scale: 0.17 },
];

export default function MethodePage() {
  const { t } = useTranslation('ecrans');
  const k = (s: string) => t(`edu.methode.${s}`);

  return (
    <div className="eg1">
      <SEOHead title={k('seoTitle')} description={k('seoDescription')} />

      <EduNightHero script={k('script')} title={t('edu.methode.titleLines', { returnObjects: true }) as string[]} lede={k('lede')}>
        <PillLink to="/formations">{k('ctaCourses')}</PillLink>
      </EduNightHero>

      {/* ── Quatre temps ───────────────────────────────────────────────── */}
      <section className="eg1-wrap">
        <span className="mm-eyebrow">{k('steps.eyebrow')}</span>
        <h2 className="mm-d eg1-h2" style={{ marginBottom: '30px' }}>{k('steps.title')}</h2>
        <div className="eg1-steps">
          {STEPS.map((s, i) => (
            <div key={s.key} className="eg1-step">
              <div className="eg1-step__top">
                <b className="eg1-step__n" style={{ color: s.color }}>{`0${i + 1}`}</b>
                <span className="eg1-step__ico" style={{ background: s.color }}><Icon name={s.icon} size={20} strokeWidth={2.2} /></span>
              </div>
              <b className="t">{k(`steps.${s.key}.title`)}</b>
              <span className="d">{k(`steps.${s.key}.body`)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Une leçon type ─────────────────────────────────────────────── */}
      <section className="eg1-wrap">
        <div className="eg1-split is-b">
          <div className="eg1-lesson" aria-hidden="true">
            <div className="eg1-lesson__video">
              <span className="eg1-lesson__play"><Icon name="play" size={22} /></span>
            </div>
            <div className="eg1-lesson__grid">
              {LESSON_PARTS.map((p) => (
                <div key={p} className={p === 'mission' ? 'mm-card is-on' : 'mm-card'}>
                  <b>{k(`lesson.parts.${p}.title`)}</b>
                  <span>{k(`lesson.parts.${p}.body`)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="mm-eyebrow">{k('lesson.eyebrow')}</span>
            <h2 className="mm-d eg1-h2">{k('lesson.title')}</h2>
            <p className="eg1-p">{k('lesson.body1')}</p>
            <p className="eg1-p">{k('lesson.body2')}</p>
          </div>
        </div>
      </section>

      {/* ── La cohorte ─────────────────────────────────────────────────── */}
      <section className="eg1-wrap">
        <div className="eg1-dark dk">
          <div>
            <span className="mm-eyebrow">{k('cohort.eyebrow')}</span>
            <h2 className="mm-d">{k('cohort.title')}</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, margin: '0 0 14px' }}>{k('cohort.body')}</p>
            <ul className="eg1-ticks">
              {TICKS.map((x) => (
                <li key={x}><Icon name="check" size={16} strokeWidth={3} />{k(`cohort.ticks.${x}`)}</li>
              ))}
            </ul>
          </div>
          <div className="eg1-bars" aria-hidden="true">
            {BARS.map((b, i) => (
              <div key={i} className="eg1-bar">
                <span>{t('edu.methode.cohort.module', { n: i + 1 })}</span>
                <div><i style={{ background: b.mine ? 'var(--mm-orange-f)' : 'var(--mm-violet-f)', transform: `scaleX(${b.scale})` } as CSSProperties} /></div>
              </div>
            ))}
            <span className="eg1-note">{k('cohort.legend')}</span>
            <span className="mm-tag is-demo" style={{ alignSelf: 'flex-start' }}>{k('cohort.illustration')}</span>
          </div>
        </div>
      </section>

      {/* ── Ce qui fait la différence ──────────────────────────────────── */}
      <section className="eg1-wrap is-last">
        <div className="eg1-orange eg1-only-wide">
          <div className="eg1-orange__head">
            <h2 className="mm-d">{k('diff.title')}</h2>
          </div>
          <div className="mm-learn">
            {DIFF.map((d, i) => (
              <div key={d}>
                <b className="n">{`0${i + 1}.`}</b>
                <b className="t">{k(`diff.items.${d}.title`)}</b>
                <span>{k(`diff.items.${d}.body`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EduPreFooter source="edu-methode" />
    </div>
  );
}
