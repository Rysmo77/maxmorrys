import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button, EmptyState, GlassPanel, Icon, LessonRow, Num, ProgressBar, Skeleton, StatTile, Tag,
  type IconName,
} from '@ds';
import { useLocalizedPath } from '../../../contexts/LanguageContext';
import { useFormat } from '../../../hooks/useFormat';
import { issueCertificate, getUserCertificates } from '../../../lib/firestore';
import { getGamificationProfile } from '../../../lib/gamification';
import { BADGES, getLevelFromXP, getXPForNextLevel } from '../../../types/gamification';
import type { GamificationProfile } from '../../../types/gamification';
import type { Certificate } from '../../../types';
import type { EnrolledFormation } from '../hooks/useStudentData';
import { captureError } from '../../../lib/sentry';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN « MES ACCOMPLISSEMENTS » — un écran de PILE.
 *
 * UN ACCOMPLISSEMENT EST UN NOMBRE : combien, depuis quand, sur quel total. Tous les comptes
 * de cet écran passent donc par <Num> ou <StatTile>, avec leur source et leur date de relevé.
 * Là où la donnée manque — le profil de jeu n'a pas encore été lu — la case affiche « non
 * relevé » et non un zéro décoratif : « c'est zéro » et « je ne sais pas » ne sont pas la
 * même information, et un badge à 0 quand la lecture a simplement échoué décourage pour rien.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A DISPARU, ET POURQUOI
 *
 * · LES DIX EMOJI DES BADGES. `BADGES` porte un emoji par badge (`icon: '🏆'`), et
 *   `BadgeCard` le rend tel quel. Ce sont des DONNÉES — elles restent en base et dans le type,
 *   personne ne les efface — mais elles ne se rendent plus : chaque badge est associé ici à un
 *   glyphe du jeu unique, par CATÉGORIE et par sens. La correspondance est écrite en toutes
 *   lettres dans `BADGE_GLYPH`, plus bas, pour qu'elle se relise et se conteste.
 *
 * · `canvas-confetti`. Quatre couleurs hexadécimales en dur au milieu d'un fichier de
 *   composant (AD-2), pour une décoration de deux secondes. Le certificat qui vient d'être
 *   émis apparaît dans la liste, daté et avec son code : c'est la récompense, et elle reste.
 *
 * · `XPBar`, `StreakWidget` ET `BadgeCard`. Les trois importent `lucide-react` ou rendent un
 *   emoji, et leurs nombres n'ont ni source ni date. Ils sont remplacés ici par <StatTile> et
 *   par des lignes de badge. Les composants restent en place — ils ne sont pas de mon lot.
 *
 * · LA NOTE « OBTENU LE » SANS DATE DE RELEVÉ. La date d'émission d'un certificat est une
 *   donnée de base : elle passe par <Num>, qui la date et cite sa provenance au survol.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface AchievementsTabProps {
  userId: string;
  certificates: Certificate[];
  setCertificates: React.Dispatch<React.SetStateAction<Certificate[]>>;
  loadingCerts: boolean;
  enrolledFormations: EnrolledFormation[];
  addToast: (type: 'success' | 'error', message: string) => void;
}

/**
 * DIX BADGES, DIX GLYPHES DU JEU UNIQUE — la correspondance des emoji, rendue explicite.
 *
 * Elle suit la CATÉGORIE du badge, pas l'emoji : un emoji est une image, une catégorie est du
 * sens. Apprentissage → la coche, le livre, la médaille (premier pas, dix leçons, cinquante) ;
 * série → le calendrier puis les barres (sept jours, trente) ; accomplissement → le trophée,
 * la couronne, l'étoile ; communauté → la bulle et la poignée de main.
 *
 * Un badge inconnu de cette table retombe sur `medal` plutôt que de disparaître — le jour où
 * un onzième badge est ajouté au type, il s'affiche, et c'est ce glyphe générique qui signale
 * qu'il faut revenir ici.
 */
const BADGE_GLYPH: Record<string, IconName> = {
  'premier-pas': 'check',
  studieux: 'book',
  expert: 'medal',
  regulier: 'calendar',
  machine: 'bars',
  diplome: 'trophy',
  'multi-diplome': 'crown',
  polyvalent: 'star',
  contributeur: 'chat',
  ambassadeur: 'handshake',
};

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
  const navigate = useNavigate();
  const path = useLocalizedPath();
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [issuing, setIssuing] = useState<string | null>(null);

  useEffect(() => {
    getGamificationProfile(userId).then(setGamification).catch(() => null);
  }, [userId]);

  /* La date du relevé : l'instant des lectures Firestore qui alimentent cet écran. */
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
  const levelPct = level && Number.isFinite(levelCeil)
    ? Math.min(100, Math.max(0, Math.round(((gamification!.xp - levelFloor) / (levelCeil - levelFloor)) * 100)))
    : 100;

  const claimable = enrolledFormations.filter(
    (ef) => ef.enrollment.progress === 100 && !certificates.some((c) => c.formationId === ef.enrollment.formationId),
  );

  return (
    <div className="mx-auto max-w-4xl px-[18px] py-6">
      <h1 className="m-0 font-display text-dsp-xs text-ink">{t('achievements.screenTitle')}</h1>

      {/* ── Quatre relevés. Sans profil de jeu lu, ils disent « non relevé ». ────── */}
      <p className="mm-eyebrow mt-[18px]">{t('achievements.gamificationEyebrow')}</p>
      <div className="mt-[10px] grid grid-cols-2 gap-[10px] sm:grid-cols-4">
        <StatTile
          label={t('achievements.xpLabel')}
          value={gamification ? gamification.xp : null}
          unit={t('achievements.xpUnit')}
          source="db"
          asOf={asOf}
          showAsOf={false}
        />
        <StatTile label={t('achievements.levelLabel')} value={level} source="db" asOf={asOf} showAsOf={false} />
        <StatTile
          label={t('achievements.streakLabel')}
          value={gamification ? gamification.currentStreak : null}
          unit={t('achievements.dayUnit')}
          source="db"
          asOf={asOf}
          showAsOf={false}
          foot={
            gamification ? (
              <>
                {t('achievements.streakRecord')} : <Num value={gamification.longestStreak} source="db" asOf={asOf} />
              </>
            ) : undefined
          }
        />
        <StatTile
          label={t('achievements.certsCountLabel')}
          value={loadingCerts ? null : certificates.length}
          source="db"
          asOf={asOf}
          showAsOf={false}
        />
      </div>
      {level && Number.isFinite(levelCeil) && (
        <ProgressBar
          value={levelPct}
          source="db"
          asOf={asOf}
          height={6}
          label={t('achievements.levelProgressLabel')}
          style={{ marginTop: '10px' }}
        />
      )}

      {/* ── Les badges. Combien sur combien, puis la liste. ──────────────────────── */}
      <div className="mt-[24px] flex flex-wrap items-end justify-between gap-3">
        <p className="mm-eyebrow m-0">{t('achievements.badgesTitle')}</p>
        <p className="m-0 text-meta-2" style={{ color: 'var(--text-muted)' }}>
          {t('achievements.badgesUnlockedLabel')} :{' '}
          <Num value={gamification ? gamification.badges.length : null} source="db" asOf={asOf} />
          {' / '}
          <Num value={BADGES.length} source={{ cite: 'catalogue des badges du produit' }} asOf={asOf} />
        </p>
      </div>
      <GlassPanel level="flat" padding="4px 18px" className="mt-[10px]">
        {BADGES.map((badge, i) => {
          const unlocked = gamification?.badges.includes(badge.id) ?? false;
          return (
            <LessonRow
              key={badge.id}
              state="plain"
              icon={
                <Icon
                  name={unlocked ? (BADGE_GLYPH[badge.id] ?? 'medal') : 'lock'}
                  size={15}
                  style={{ color: unlocked ? 'var(--mm-violet-t)' : 'var(--ink-3)' }}
                />
              }
              iconBackground={unlocked ? 'color-mix(in srgb, var(--mm-violet) 12%, transparent)' : 'var(--fill-1)'}
              title={badge.name}
              meta={badge.description}
              trailing={<Tag tone={unlocked ? 'ok' : 'neutral'}>{t(unlocked ? 'achievements.badgeUnlocked' : 'achievements.badgeLocked')}</Tag>}
              last={i === BADGES.length - 1}
            />
          );
        })}
      </GlassPanel>

      {/* ── Les certificats émis ─────────────────────────────────────────────────── */}
      <div className="mt-[24px]">
        <p className="mm-eyebrow m-0">{t('achievements.certsTitle')}</p>
        <p className="m-0 mt-[4px] text-meta-2" style={{ color: 'var(--text-muted)' }}>{t('achievements.certsSubtitle')}</p>
      </div>

      {loadingCerts ? (
        <div className="mt-[12px] grid gap-[8px]">
          {[0, 1].map((i) => <Skeleton key={i} height={70} radius="var(--r-m)" label={t('achievements.loadingLabel')} />)}
        </div>
      ) : certificates.length === 0 ? (
        <GlassPanel level="hero" padding={22} className="mt-[12px]">
          <EmptyState
            glyph={<Icon name="trophy" size={26} style={{ color: 'var(--mm-violet-t)' }} />}
            glyphBackground="color-mix(in srgb, var(--mm-violet) 14%, transparent)"
            title={t('achievements.emptyTitle')}
            body={t('achievements.emptyText')}
            action={
              enrolledFormations.length > 0 ? (
                <p className="m-0 text-meta-2" style={{ color: 'var(--text-muted)' }}>
                  {t('achievements.inProgressHint', { count: enrolledFormations.length })}
                </p>
              ) : (
                <Button tone="forme" onClick={() => navigate(path('/formations'))}>{t('achievements.startCourse')}</Button>
              )
            }
          />
        </GlassPanel>
      ) : (
        <GlassPanel level="flat" padding="4px 18px" className="mt-[12px]">
          {certificates.map((cert, i) => (
            <LessonRow
              key={cert.id}
              state="plain"
              icon={<Icon name="star" size={14} style={{ color: 'var(--mm-violet-t)' }} />}
              iconBackground="color-mix(in srgb, var(--mm-violet) 12%, transparent)"
              title={cert.formationTitle}
              meta={
                <>
                  {t('achievements.obtainedLabel')}{' '}
                  <Num value={formatDate(cert.issuedAt)} source="db" asOf={asOf} />
                  {' · '}
                  {t('achievements.certCodeLabel')} <Num value={cert.certificateCode} source="db" asOf={asOf} />
                </>
              }
              trailing={<Icon name="forward" size={16} strokeWidth={2.4} style={{ color: 'var(--ink-3)' }} />}
              onClick={() => navigate(path(`/certificat/${cert.certificateCode}`))}
              last={i === certificates.length - 1}
            />
          ))}
        </GlassPanel>
      )}

      {/* ── Ce qui est fini mais pas encore réclamé ──────────────────────────────── */}
      {claimable.length > 0 && (
        <>
          <p className="mm-eyebrow mt-[24px]">{t('achievements.toClaimTitle')}</p>
          <div className="mt-[10px] grid gap-[10px]">
            {claimable.map(({ enrollment, formation }) => (
              <GlassPanel key={enrollment.id} level="flat" padding={16}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 text-meta font-bold text-ink">
                      {formation?.title ?? t('achievements.formationFallback')}
                    </p>
                    <p className="m-0 mt-[2px] text-meta-2" style={{ color: 'var(--ok)' }}>
                      {t('achievements.completed100')}
                    </p>
                  </div>
                  <Button
                    tone="transforme"
                    size="sm"
                    fullWidth={false}
                    loading={issuing === enrollment.formationId}
                    disabled={issuing !== null || !formation}
                    onClick={() => {
                      if (formation) void handleIssueCertificate(enrollment.formationId, formation.title);
                    }}
                  >
                    {t('achievements.obtain')}
                  </Button>
                </div>
              </GlassPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
