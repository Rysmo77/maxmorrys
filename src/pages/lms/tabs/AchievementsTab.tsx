import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Num, Skeleton, type IconName } from '@ds';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import { useFormat } from '../../../hooks/useFormat';
import { useLocalizedPath } from '../../../contexts/LanguageContext';
import { issueCertificate, getUserCertificates } from '../../../lib/firestore';
import { getGamificationProfile } from '../../../lib/gamification';
import { shareLink, toAbsoluteUrl } from '../../../lib/share/links';
import { BADGES, XP_REWARDS, getLevelFromXP, getXPForNextLevel } from '../../../types/gamification';
import type { GamificationProfile } from '../../../types/gamification';
import type { Certificate } from '../../../types';
import type { EnrolledFormation } from '../hooks/useStudentData';
import { captureError } from '../../../lib/sentry';
import { CardEmpty, EduCard, EduGrid, EduHead, EduPage } from '../../../components/edu/g4/EduParts';

interface AchievementsTabProps {
  userId: string;
  certificates: Certificate[];
  setCertificates: React.Dispatch<React.SetStateAction<Certificate[]>>;
  loadingCerts: boolean;
  enrolledFormations: EnrolledFormation[];
  addToast: (type: 'success' | 'error', message: string) => void;
}

/** Un glyphe par badge du catalogue — le catalogue porte des émojis, le kit des tracés. */
const BADGE_GLYPH: Record<string, IconName> = {
  'premier-pas': 'check',
  studieux: 'book',
  expert: 'medal',
  regulier: 'flame',
  machine: 'zap',
  diplome: 'trophy',
  'multi-diplome': 'graduation',
  polyvalent: 'star',
  contributeur: 'chat',
  ambassadeur: 'handshake',
};

/** Les gains d'XP RÉELS du barème (`XP_REWARDS`), à la place des quêtes de la maquette. */
const XP_WAYS: { key: string; xp: number; icon: IconName; bg: string }[] = [
  { key: 'xpLesson', xp: XP_REWARDS.completeLesson, icon: 'check', bg: 'var(--mm-bleu-f)' },
  { key: 'xpModule', xp: XP_REWARDS.completeModule, icon: 'layers', bg: 'var(--mm-violet-f)' },
  { key: 'xpFormation', xp: XP_REWARDS.completeFormation, icon: 'graduation', bg: 'var(--mm-teal-f)' },
  { key: 'xpStreak', xp: XP_REWARDS.dailyStreak, icon: 'flame', bg: 'var(--mm-orange-f)' },
  { key: 'xpNote', xp: XP_REWARDS.createNote, icon: 'pencil', bg: 'var(--ink-fixed)' },
];
const XP_SOURCE = { cite: 'barème XP du produit (types/gamification)' };

const LEVEL_BG = 'linear-gradient(120deg, color-mix(in srgb, var(--mm-bleu-f) 45%, var(--night)), var(--mm-bleu-f) 60%, var(--mm-violet-f))';

/**
 * SUCCÈS — maquette `Edu-Succes` (+ `-mobile`), passe 2 lot B.
 *
 * Niveau et série en tête, badges, certificats ; dans le panneau, comment gagner de l'XP et
 * la cohorte. Tout chiffre vient du profil de jeu (`gamification`) ou des certificats émis ;
 * sans profil lu, les relevés restent vides plutôt que d'afficher zéro.
 *
 * Écarts assumés à la maquette : les « quêtes » (jour/semaine, à récupérer) n'ont pas de
 * producteur — le panneau montre à la place le barème RÉEL des gains d'XP ; la carte « Ta
 * cohorte cette semaine » dit qu'aucune cohorte n'est ouverte (pas de compte inventé).
 */
export default function AchievementsTab({
  userId,
  certificates,
  setCertificates,
  loadingCerts,
  enrolledFormations,
  addToast,
}: AchievementsTabProps) {
  const { t } = useTranslation('lmsTabs');
  const { formatDate } = useFormat();
  const path = useLocalizedPath();
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [issuing, setIssuing] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getGamificationProfile(userId).then(setGamification).catch(() => null);
  }, [userId]);

  const asOf = new Date();

  const handleIssueCertificate = async (formationId: string, formationTitle: string) => {
    setIssuing(formationId);
    try {
      await issueCertificate(userId, formationId, formationTitle);
      const updated = await getUserCertificates(userId);
      setCertificates(updated);
      addToast('success', t('achievements.certToastSuccess'));
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to issue certificate' });
      addToast('error', error instanceof Error ? error.message : t('achievements.certToastError'));
    } finally {
      setIssuing(null);
    }
  };

  const level = gamification ? getLevelFromXP(gamification.xp) : null;
  const levelFloor = level ? getXPForNextLevel(level - 1) : 0;
  const levelCeil = level ? getXPForNextLevel(level) : 0;
  const hasNext = level !== null && Number.isFinite(levelCeil);
  const levelPct = gamification && hasNext
    ? Math.min(1, Math.max(0, (gamification.xp - levelFloor) / (levelCeil - levelFloor)))
    : 1;
  const unlockedCount = gamification ? gamification.badges.length : null;

  const claimable = enrolledFormations.filter(
    (ef) => ef.enrollment.progress === 100 && !certificates.some((c) => c.formationId === ef.enrollment.formationId),
  );

  const aside = (
    <>
      <EduCard title={t('achievements.xpWaysTitle')}>
        {XP_WAYS.map((w) => (
          <div key={w.key} className="mm-quest">
            <div className="row">
              <span className="gem" style={{ background: w.bg }}><Icon name={w.icon} size={18} /></span>
              <span className="min-w-0 flex-1">
                <b>{t(`achievements.${w.key}`)}</b>
              </span>
              <span className="xp">
                +<Num value={w.xp} source={XP_SOURCE} asOf={asOf} unit="XP" />
              </span>
            </div>
          </div>
        ))}
      </EduCard>
      <EduCard title={t('achievements.cohortTitle')}>
        <CardEmpty
          icon="users"
          title={t('achievements.cohortEmpty')}
          body={t('achievements.cohortBody')}
          action={
            <LocalizedLink to="/mon-espace/cohorte" className="mm-pill is-sm">
              {t('achievements.cohortLink')}
              <i><Icon name="arrow-up-right" size={15} /></i>
            </LocalizedLink>
          }
        />
      </EduCard>
    </>
  );

  return (
    <EduPage>
      <EduHead eyebrow={t('achievements.eyebrow')} title={t('achievements.screenTitle')} />
      <EduGrid aside={aside}>
        {/* ── Niveau et série ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 stack:[grid-template-columns:1.3fr_1fr]">
          <section className="mm-card dk" style={{ background: LEVEL_BG, color: 'var(--paper-fixed)', border: 0 }}>
            <span className="mm-eyebrow" style={{ color: 'color-mix(in srgb, var(--paper-fixed) 80%, transparent)' }}>
              {t('achievements.levelEyebrow')}
            </span>
            <div className="mt-3 flex items-baseline gap-[14px]">
              {level !== null ? (
                <b className="font-display text-[64px] font-black leading-none">
                  <Num value={level} source="db" asOf={asOf} style={{ font: 'inherit' }} />
                </b>
              ) : (
                <Num value={null} source="db" asOf={asOf} style={{ fontSize: 15 }} />
              )}
              <span className="text-[15px]" style={{ opacity: 0.85 }}>{t('achievements.levelLabel')}</span>
            </div>
            <div className="mt-[18px] h-[10px] overflow-hidden rounded-pill" style={{ background: 'color-mix(in srgb, var(--paper-fixed) 20%, transparent)' }}>
              <i className="block h-full w-full" style={{ background: 'var(--mm-orange-f)', transform: `scaleX(${levelPct})`, transformOrigin: 'left' }} />
            </div>
            <div className="mt-[10px] flex flex-wrap justify-between gap-2 text-[13px] font-semibold">
              <span><Num value={gamification ? gamification.xp : null} source="db" asOf={asOf} unit="XP" /></span>
              {gamification && hasNext && (
                <span>
                  {t('achievements.levelNext', { level: (level ?? 0) + 1 })} · <Num value={levelCeil} source={XP_SOURCE} asOf={asOf} unit="XP" />
                </span>
              )}
            </div>
          </section>
          <section className="mm-card">
            <span className="mm-eyebrow">{t('achievements.streakEyebrow')}</span>
            <div className="mb-4 mt-3 flex items-baseline gap-[10px]">
              <Num
                value={gamification ? gamification.currentStreak : null}
                source="db"
                asOf={asOf}
                style={gamification ? { fontSize: 52, fontWeight: 600, letterSpacing: '-.05em' } : { fontSize: 15 }}
              />
              <span className="text-ink-2">
                {t('achievements.streakDays')}
                {gamification && (
                  <> · {t('achievements.streakRecord')} <Num value={gamification.longestStreak} source="db" asOf={asOf} /></>
                )}
              </span>
            </div>
            <span className="mm-streak" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <i key={i} className={gamification && i < Math.min(7, gamification.currentStreak) ? 'on' : undefined} style={{ ['--i' as string]: i }} />
              ))}
            </span>
            <p className="m-0 mt-3 text-[12.5px] text-ink-2">{t('achievements.streakHint')}</p>
          </section>
        </div>

        {/* ── Badges ──────────────────────────────────────────────────────── */}
        <EduCard
          title={t('achievements.badgesTitle')}
          meta={
            <>
              <Num value={unlockedCount} source="db" asOf={asOf} /> / <Num value={BADGES.length} source={{ cite: 'catalogue des badges du produit' }} asOf={asOf} />
            </>
          }
        >
          <ul className="m-0 grid list-none grid-cols-4 gap-3 p-0 stack:grid-cols-5">
            {BADGES.map((badge) => {
              const unlocked = gamification?.badges.includes(badge.id) ?? false;
              return (
                <li key={badge.id} className="flex flex-col items-center gap-2 text-center" title={badge.description}>
                  <span
                    aria-hidden="true"
                    className="grid h-14 w-14 place-items-center rounded-card"
                    style={{
                      background: unlocked ? 'var(--action-transforme)' : 'var(--fill-1)',
                      color: unlocked ? 'var(--paper-fixed)' : 'var(--ink-3)',
                    }}
                  >
                    <Icon name={unlocked ? (BADGE_GLYPH[badge.id] ?? 'medal') : 'lock'} size={22} />
                  </span>
                  <span className="text-[12px] leading-[1.3]" style={{ color: unlocked ? 'var(--ink)' : 'var(--ink-2)' }}>
                    {badge.name}
                    <span className="sr-only"> · {t(unlocked ? 'achievements.badgeUnlocked' : 'achievements.badgeLocked')}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </EduCard>

        {/* ── Certificats à réclamer (formations terminées) ────────────────── */}
        {claimable.length > 0 && (
          <EduCard title={t('achievements.toClaimTitle')}>
            {claimable.map((ef) => (
              <div key={ef.enrollment.formationId} className="flex flex-wrap items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <b className="block text-[15px]">{ef.formation?.title ?? t('achievements.formationFallback')}</b>
                  <span className="text-[13px] text-ink-2">{t('achievements.completed100')}</span>
                </span>
                <Button
                  tone="forme"
                  size="sm"
                  fullWidth={false}
                  loading={issuing === ef.enrollment.formationId}
                  disabled={issuing !== null}
                  onClick={() => void handleIssueCertificate(ef.enrollment.formationId, ef.formation?.title ?? t('achievements.formationFallback'))}
                >
                  {t('achievements.obtain')}
                </Button>
              </div>
            ))}
          </EduCard>
        )}

        {/* ── Mes certificats ─────────────────────────────────────────────── */}
        <div>
          <h3 className="m-0 mb-3 text-[21px] font-semibold leading-[1.1] tracking-[-.01em]">{t('achievements.certsTitle')}</h3>
          {loadingCerts ? (
            <Skeleton height={110} radius="var(--r-card)" label={t('achievements.loadingLabel')} />
          ) : certificates.length === 0 ? (
            <EduCard as="div">
              <CardEmpty
                icon="trophy"
                title={t('achievements.emptyTitle')}
                body={enrolledFormations.length > 0
                  ? t('achievements.inProgressHint', { count: enrolledFormations.length })
                  : t('achievements.emptyText')}
                action={enrolledFormations.length === 0 ? (
                  <LocalizedLink to="/formations" className="mm-pill is-sm">
                    {t('achievements.startCourse')}
                    <i><Icon name="arrow-up-right" size={15} /></i>
                  </LocalizedLink>
                ) : undefined}
              />
            </EduCard>
          ) : (
            <div className="flex flex-col gap-3">
              {certificates.map((cert) => {
                const verify = toAbsoluteUrl(path(`/certificat/${cert.certificateCode}`));
                return (
                  <section key={cert.id} className="mm-card grid grid-cols-1 items-center gap-5 stack:[grid-template-columns:1fr_auto]">
                    <div className="min-w-0">
                      <span className="mm-eyebrow">{t('achievements.certEyebrow')}</span>
                      <b className="mb-1 mt-2 block font-display text-[24px] font-black leading-[1.1]">{cert.formationTitle}</b>
                      <span className="text-[13px] text-ink-2">
                        <Num value={cert.certificateCode} source="db" asOf={asOf} /> · <Num value={formatDate(cert.issuedAt)} source="db" asOf={asOf} />
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 stack:flex-col stack:items-end">
                      <a className="mm-pill is-sm" href={shareLink('linkedin', verify, cert.formationTitle)} target="_blank" rel="noopener noreferrer">
                        {t('achievements.shareLinkedin')}
                        <i><Icon name="arrow-up-right" size={15} /></i>
                      </a>
                      <LocalizedLink to={`/certificat/${cert.certificateCode}`} className="text-[13px] font-semibold text-ink">
                        {t('achievements.verifyPage')}
                      </LocalizedLink>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </EduGrid>
    </EduPage>
  );
}
