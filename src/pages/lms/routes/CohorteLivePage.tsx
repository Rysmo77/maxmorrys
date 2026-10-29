import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';
import SEOHead from '../../../components/seo/SEOHead';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import { CardEmpty, EduCard, EduHead, EduPage } from '../../../components/edu/g4/EduParts';

/**
 * LIVE DE COHORTE — maquette `Edu-Live` (+ `-mobile`), passe 2 lot B.
 *
 * La scène vidéo, le programme, la carte « relue en direct » et la colonne de questions
 * sont posés à leur place. Il n'existe ni salle de diffusion ni file de questions côté
 * serveur : la scène dit qu'aucun live n'est en cours, le programme qu'il est publié avec
 * le live, et le champ de question reste fermé tant qu'aucun live n'est programmé. Aucun
 * compteur de connectés, aucun nom, aucune question d'exemple (D-09). Les réglages de flux
 * de la maquette (qualité, poids par minute, sous-titres) ne sont pas affichés : ils
 * décriraient un lecteur qui n'existe pas.
 */
type Pane = 'questions' | 'chat';

const STAGE_BG =
  'linear-gradient(150deg, color-mix(in srgb, var(--mm-violet-f) 18%, var(--night)), color-mix(in srgb, var(--mm-corail-f) 22%, var(--night)) 50%, var(--night))';
const ON_DARK_2 = 'color-mix(in srgb, var(--paper-fixed) 62%, transparent)';

export default function CohorteLivePage() {
  const { t } = useTranslation('ecrans');
  const [pane, setPane] = useState<Pane>('questions');

  return (
    <EduPage>
      <SEOHead title={t('edu.live.title')} description={t('edu.live.empty')} noIndex />
      <EduHead eyebrow={t('edu.live.eyebrow')} title={t('edu.live.title')} />

      <div className="grid grid-cols-1 items-start gap-5 wide:gap-[22px] wide:[grid-template-columns:minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          {/* ── La scène ─────────────────────────────────────────────────────── */}
          <div
            className="dk relative grid place-items-center overflow-hidden rounded-xl px-6 text-center"
            style={{ height: 'clamp(260px, 42vw, 520px)', background: STAGE_BG, color: 'var(--paper-fixed)' }}
          >
            <div className="max-w-[46ch]">
              <span
                aria-hidden="true"
                className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-m"
                style={{ background: 'color-mix(in srgb, var(--paper-fixed) 12%, transparent)' }}
              >
                <Icon name="video" size={24} />
              </span>
              <b className="block font-display text-[24px] font-black leading-[1.1] stack:text-[30px]">{t('edu.live.empty')}</b>
              <p className="m-0 mt-2 text-[14px] leading-[1.55]" style={{ color: 'color-mix(in srgb, var(--paper-fixed) 80%, transparent)' }}>
                {t('edu.live.body')}
              </p>
              <LocalizedLink to="/mon-espace/agenda" className="mm-pill is-sm mt-5">
                {t('edu.live.agenda')}
                <i><Icon name="arrow-up-right" size={15} /></i>
              </LocalizedLink>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[18px] stack:grid-cols-2">
            <EduCard title={t('edu.live.programTitle')}>
              <CardEmpty icon="list" title={t('edu.live.programEmpty')} body={t('edu.live.programBody')} />
            </EduCard>
            <section className="mm-card" style={{ background: 'var(--mm-orange-f)', border: 0, color: 'var(--ink-fixed)' }}>
              <span className="mm-eyebrow" style={{ color: 'var(--ink-fixed)' }}>{t('edu.live.reviewEyebrow')}</span>
              <b className="mb-2 mt-[10px] block font-display text-[22px] font-black leading-[1.15]">{t('edu.live.reviewTitle')}</b>
              <p className="m-0 text-[14px]">{t('edu.live.reviewBody')}</p>
            </section>
          </div>
        </div>

        {/* ── Les questions ──────────────────────────────────────────────────── */}
        <section
          className="dk flex flex-col gap-3 rounded-xl"
          style={{ background: 'var(--ink-fixed)', padding: 18, color: 'color-mix(in srgb, var(--paper-fixed) 80%, transparent)' }}
          aria-label={t('edu.live.questionsTab')}
        >
          <div className="mm-tabs flex" style={{ background: 'color-mix(in srgb, var(--paper-fixed) 6%, transparent)' }} role="group">
            {(['questions', 'chat'] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={pane === p}
                onClick={() => setPane(p)}
                style={pane === p
                  ? { flex: 1, background: 'var(--paper-fixed)', color: 'var(--ink-fixed)' }
                  : { flex: 1, color: 'color-mix(in srgb, var(--paper-fixed) 80%, transparent)' }}
              >
                {t(p === 'questions' ? 'edu.live.questionsTab' : 'edu.live.chatTab')}
              </button>
            ))}
          </div>
          <div className="rounded-m p-4" style={{ background: 'color-mix(in srgb, var(--paper-fixed) 5%, transparent)' }}>
            <CardEmpty
              onDark
              icon={pane === 'questions' ? 'help' : 'chat'}
              title={t(pane === 'questions' ? 'edu.live.questionsEmpty' : 'edu.live.chatEmpty')}
              body={t('edu.live.questionsBody')}
            />
          </div>
          <div
            className="flex h-[50px] items-center gap-2 rounded-pill pl-4 pr-[6px] text-[14px]"
            style={{ border: '1px solid color-mix(in srgb, var(--paper-fixed) 14%, transparent)', color: ON_DARK_2 }}
            aria-disabled="true"
          >
            {t('edu.live.askPlaceholder')}
            <span
              aria-hidden="true"
              className="ml-auto grid h-10 w-10 place-items-center rounded-pill"
              style={{ background: 'color-mix(in srgb, var(--mm-orange-f) 40%, transparent)', color: 'var(--ink-fixed)' }}
            >
              <Icon name="send" size={16} />
            </span>
          </div>
          <span className="text-[12px]" style={{ color: ON_DARK_2 }}>{t('edu.live.askNote')}</span>
        </section>
      </div>
    </EduPage>
  );
}
