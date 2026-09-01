import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button, GlassPanel, Icon, LessonRow, Num, ProgressBar, Skeleton, StatTile, TerritoryCard,
  type IconName,
} from '@ds';
import { useLocalizedPath } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { tutorName } from '../../../lib/naming';
import { getGamificationProfile, updateStreak, addXP } from '../../../lib/gamification';
import { getLevelFromXP, getXPForNextLevel, XP_REWARDS } from '../../../types/gamification';
import type { GamificationProfile } from '../../../types/gamification';
import type { EnrolledFormation } from '../hooks/useStudentData';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN « ESPACE » — le premier des cinq écrans qui portent la barre d'onglets.
 *
 * Il est recomposé sur `ui_kits/plateforme/ScreensSpace.js` § Espace : carte de reprise en
 * tête, deux cases de relevé, l'entrée vers le répétiteur, puis la liste « Dans ton espace ».
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A DISPARU, ET POURQUOI
 *
 * · LA CASE « CERTIFICATS ». Elle affichait `completedCount` — le nombre de formations
 *   TERMINÉES — sous le libellé « Certificats ». Ce n'est pas le même nombre : une formation
 *   finie ne devient un certificat que si la personne le réclame, et l'écran des
 *   accomplissements le montre bien. La case annonçait donc un chiffre faux à qui n'a rien
 *   réclamé. Le compte réel vit là où il se lit, sur l'écran des certificats.
 *
 * · `XPBar` ET `StreakWidget`. Deux composants de `components/lms/` qui rendent un feu en
 *   emoji, `lucide-react` et des nombres sans source. Ils sont remplacés ici par deux
 *   <StatTile> — mêmes données, sourcées et datées. Les composants restent en place : ils ne
 *   sont pas de mon lot.
 *
 * · LE COMPTEUR DE QUOTA DU KIT. Le kit pose un <QuotaMeter> sous l'entrée du répétiteur.
 *   Le quota n'est lisible que par l'appel `getRysmoQuota`, et cet écran ne le fait pas :
 *   l'ajouter serait un second aller-retour serveur au chargement du tableau de bord. La
 *   carte mène donc à l'écran du répétiteur, qui le relève et l'affiche — plutôt que
 *   d'inventer un compte ici.
 *
 * NAVIGATION. Les boutons naviguent par `useNavigate` et non par `href` : dans la coquille
 * applicative, un `<a href>` recharge la page entière et jette le cache de requêtes.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface DashboardTabProps {
  displayName: string;
  userId?: string;
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
  avgProgress: number;
  completedCount: number;
}

/** Les quatre entrées de « Dans ton espace ». Le glyphe vient du jeu unique du système. */
const SPACE_LINKS: { to: string; glyph: IconName; title: string; meta: string }[] = [
  { to: '/mon-espace/cours', glyph: 'book', title: 'linkCourses', meta: 'linkCoursesMeta' },
  { to: '/mon-espace/notes', glyph: 'comment', title: 'linkNotes', meta: 'linkNotesMeta' },
  { to: '/mon-espace/succes', glyph: 'star', title: 'linkAchievements', meta: 'linkAchievementsMeta' },
  { to: '/mon-espace/messages', glyph: 'send', title: 'linkMessages', meta: 'linkMessagesMeta' },
  /* « Mes paiements » — la première entrée que le kit met dans cette liste
     (`screens-space.jsx` § Espace). Elle manquait, et deux pieds d'écran la
     désignaient pourtant : « Le reçu est dans ton espace ». */
  { to: '/mon-espace/paiements', glyph: 'card', title: 'linkPayments', meta: 'linkPaymentsMeta' },
];

export default function DashboardTab({
  displayName, userId, enrolledFormations, loadingEnrollments, avgProgress, completedCount,
}: DashboardTabProps) {
  const { t } = useTranslation('lmsTabs');
  const navigate = useNavigate();
  const path = useLocalizedPath();
  const { userData } = useAuth();
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);

  // La série est mise à jour à l'ouverture de l'écran, comme avant — cette logique ne bouge pas.
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { currentStreak, isNew } = await updateStreak(userId);
      if (isNew && currentStreak > 0) {
        await addXP(userId, XP_REWARDS.dailyStreak);
      }
      const profile = await getGamificationProfile(userId);
      setGamification(profile);
    })().catch(() => null);
  }, [userId]);

  /* Un relevé porte sa date. Celle-ci est l'instant du rendu, donc de la lecture Firestore. */
  const asOf = new Date();
  const tutor = tutorName(userData);
  const firstName = displayName.split(' ')[0];

  const inProgress = enrolledFormations.find((ef) => ef.enrollment.progress > 0 && ef.enrollment.progress < 100)
    ?? enrolledFormations.find((ef) => ef.enrollment.progress < 100);

  const level = gamification ? getLevelFromXP(gamification.xp) : null;
  const levelFloor = level ? getXPForNextLevel(level - 1) : 0;
  const levelCeil = level ? getXPForNextLevel(level) : 0;
  const levelPct = level && Number.isFinite(levelCeil)
    ? Math.min(100, Math.max(0, Math.round(((gamification!.xp - levelFloor) / (levelCeil - levelFloor)) * 100)))
    : 100;

  return (
    <div className="mx-auto max-w-4xl px-[18px] py-6">
      <p className="mm-eyebrow m-0">{t('dashboard.eyebrow')}</p>
      {/* La salutation n'est PAS le titre de la page — celui-ci est « Tableau de bord », rendu
          en <h1> par la barre haute de `AppShell`. Le kit la pose d'ailleurs dans la barre, pas
          dans le corps (`ScreensSpace.js:17`). Elle garde son dessin, elle perd son rang. */}
      <p className="m-0 mt-[6px] font-display text-dsp-xs text-ink">{t('dashboard.greeting', { name: firstName })}</p>

      {/* ── La carte de reprise ──────────────────────────────────────────────── */}
      {loadingEnrollments ? (
        <Skeleton height={168} radius="var(--r-l)" label={t('dashboard.loadingLabel')} style={{ marginTop: '18px' }} />
      ) : inProgress?.formation ? (
        <div className="mt-[18px]">
          <TerritoryCard
            first
            territory="forme"
            meta={inProgress.formation.duration}
            title={inProgress.formation.title}
            titleSize={21}
          >
            <ProgressBar
              value={inProgress.enrollment.progress}
              source="db"
              asOf={asOf}
              label={t('dashboard.progressLabel')}
              style={{ marginTop: '15px' }}
            />
            <div className="mt-[10px] flex items-center justify-between gap-3">
              <span className="text-meta-2" style={{ color: 'var(--card-ink-2)' }}>
                <Num value={inProgress.enrollment.completedLessons.length} source="db" asOf={asOf} />
                {' / '}
                <Num
                  value={inProgress.formation.modules.reduce((n, m) => n + m.lessons.length, 0) || null}
                  source="db"
                  asOf={asOf}
                />{' '}
                {t('dashboard.lessonsLabel')}
              </span>
              <Button
                tone="primary"
                size="sm"
                fullWidth={false}
                onClick={() => navigate(path(`/cours/${inProgress.formation!.slug}`))}
              >
                {t('dashboard.resume')}
              </Button>
            </div>
          </TerritoryCard>
        </div>
      ) : (
        <GlassPanel level="hero" padding={20} className="mt-[18px]">
          <p className="m-0 text-body text-ink-2">
            {enrolledFormations.length === 0 ? t('dashboard.startAdventure') : t('dashboard.continueLearningHint')}
          </p>
          {enrolledFormations.length === 0 && (
            <Button tone="forme" style={{ marginTop: '15px' }} onClick={() => navigate(path('/formations'))}>
              {t('dashboard.explore')}
            </Button>
          )}
        </GlassPanel>
      )}

      {/* ── Deux cases de relevé ─────────────────────────────────────────────── */}
      <div className="mt-[18px] grid grid-cols-2 gap-[10px]">
        <StatTile
          label={t('dashboard.statStreak')}
          value={gamification ? gamification.currentStreak : null}
          unit={t('dashboard.dayUnit')}
          source="db"
          asOf={asOf}
          showAsOf={false}
          foot={
            gamification ? (
              <>
                {t('dashboard.statStreakRecord')} : <Num value={gamification.longestStreak} source="db" asOf={asOf} />
              </>
            ) : undefined
          }
        />
        <StatTile
          label={t('dashboard.statLevel')}
          value={level}
          source="db"
          asOf={asOf}
          showAsOf={false}
          foot={
            level ? (
              <>
                <Num value={gamification!.xp} unit={t('dashboard.xpUnit')} source="db" asOf={asOf} />
                {Number.isFinite(levelCeil) && ` · ${t('dashboard.statLevelNext', { level: level + 1 })}`}
              </>
            ) : undefined
          }
        />
      </div>
      {level && Number.isFinite(levelCeil) && (
        <ProgressBar
          value={levelPct}
          source="db"
          asOf={asOf}
          height={6}
          label={t('dashboard.statLevelNext', { level: level + 1 })}
          style={{ marginTop: '10px' }}
        />
      )}

      {/* ── Trois relevés du parcours ────────────────────────────────────────── */}
      <div className="mt-[12px] grid grid-cols-2 gap-[10px] stack:grid-cols-3">
        <StatTile label={t('dashboard.statFormations')} value={enrolledFormations.length} source="db" asOf={asOf} showAsOf={false} />
        <StatTile label={t('dashboard.statCompleted')} value={completedCount} source="db" asOf={asOf} showAsOf={false} />
        <StatTile
          label={t('dashboard.statAvgProgress')}
          value={enrolledFormations.length > 0 ? avgProgress : null}
          unit="%"
          source="db"
          asOf={asOf}
          showAsOf={false}
        />
      </div>

      {/* ── L'entrée du répétiteur. Son nom vient du profil, jamais d'une constante. ── */}
      <GlassPanel level="flat" padding={18} className="mt-[12px]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-[14.5px] font-bold text-ink">{t('dashboard.tutorTitle', { tutor })}</p>
            <p className="m-0 mt-[2px] text-meta-2" style={{ color: 'var(--text-muted)' }}>{t('dashboard.tutorBody')}</p>
          </div>
          <Button
            tone="transforme"
            size="sm"
            fullWidth={false}
            onClick={() => navigate(path('/mon-espace/repetiteur'))}
            aria-label={t('dashboard.tutorTitle', { tutor })}
          >
            {t('dashboard.tutorCta')}
          </Button>
        </div>
      </GlassPanel>

      {/* ── Dans ton espace ──────────────────────────────────────────────────── */}
      <p className="mm-eyebrow mt-[22px]">{t('dashboard.spaceEyebrow')}</p>
      <GlassPanel level="flat" padding="4px 18px" className="mt-[10px]">
        {SPACE_LINKS.map((link, i) => (
          <LessonRow
            key={link.to}
            state="plain"
            icon={<Icon name={link.glyph} size={14} />}
            title={t(`dashboard.${link.title}`)}
            meta={t(`dashboard.${link.meta}`)}
            trailing={<Icon name="forward" size={16} strokeWidth={2.4} style={{ color: 'var(--ink-3)' }} />}
            onClick={() => navigate(path(link.to))}
            last={i === SPACE_LINKS.length - 1}
          />
        ))}
      </GlassPanel>
    </div>
  );
}
