import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button, GlassPanel, Icon, LessonRow, Num, ProgressBar, Skeleton, StatTile, TerritoryCard,
  type IconName,
} from '@ds';
import { useLocalizedPath } from '../../../contexts/LanguageContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import TutorPanel from '../components/TutorPanel';
import SpaceSplit from '../components/SpaceSplit';
import { useAuth } from '../../../contexts/AuthContext';
import { tutorName } from '../../../lib/naming';
import { getGamificationProfile, updateStreak, addXP, syncBadges } from '../../../lib/gamification';
import { getLevelFromXP, getXPForNextLevel, XP_REWARDS } from '../../../types/gamification';
import type { GamificationProfile } from '../../../types/gamification';
import type { EnrolledFormation } from '../hooks/useStudentData';
import { estAVenir } from '../../../types/formationRelease';

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

/** Les entrées de « Dans ton espace ». Le glyphe vient du jeu unique du système. */
const SPACE_LINKS: { to: string; glyph: IconName; title: string; meta: string }[] = [
  { to: '/mon-espace/cours', glyph: 'book', title: 'linkCourses', meta: 'linkCoursesMeta' },
  { to: '/mon-espace/notes', glyph: 'comment', title: 'linkNotes', meta: 'linkNotesMeta' },
  { to: '/mon-espace/succes', glyph: 'star', title: 'linkAchievements', meta: 'linkAchievementsMeta' },
  { to: '/mon-espace/messages', glyph: 'send', title: 'linkMessages', meta: 'linkMessagesMeta' },
  /* « Mes paiements » — la première entrée que le kit met dans cette liste
     (`screens-space.jsx` § Espace). Elle manquait, et deux pieds d'écran la
     désignaient pourtant : « Le reçu est dans ton espace ». */
  { to: '/mon-espace/paiements', glyph: 'card', title: 'linkPayments', meta: 'linkPaymentsMeta' },
  /*
    « MON AVIS » — LA SEULE ENTRÉE DE L'ESPACE QUI N'AVAIT AUCUN CHEMIN DEPUIS ICI.
    Elle vit dans la barre latérale, donc au-delà de 700 px elle se voit ; en dessous, la
    barre devient un tiroir derrière le bouton de menu, et la barre basse ne porte que cinq
    onglets qui ne l'incluent pas. Sur téléphone, déposer un avis supposait d'ouvrir un
    tiroir qu'on n'ouvre pas pour chercher ce qu'on ne sait pas exister.

    Elle ferme la liste, et c'est délibéré : contrairement aux cours ou aux notes, un avis
    se dépose une fois. Le rang dit la fréquence.
  */
  { to: '/mon-espace/temoignages', glyph: 'quote', title: 'linkTestimonials', meta: 'linkTestimonialsMeta' },
];

export default function DashboardTab({
  displayName, userId, enrolledFormations, loadingEnrollments, avgProgress, completedCount,
}: DashboardTabProps) {
  const { t } = useTranslation('lmsTabs');
  const navigate = useNavigate();
  const path = useLocalizedPath();
  const { userData } = useAuth();
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);

  /*
    ── POURQUOI UN CROCHET ET PAS UNE CLASSE, POUR LE SEUL PANNEAU ─────────────────
    `TutorPanel` relève le quota par un appel serveur à son montage. Une classe
    `hidden` le monterait quand même sur téléphone — l'appel partirait, invisible.
    `useMediaQuery` le laisse DÉMONTÉ sous 1080 px : le chargement du téléphone est
    exactement celui d'avant.

    La carte du répétiteur, elle, ne coûte rien : elle se cache en CSS (`wide:hidden`).
    Mélanger les deux mécanismes est délibéré — le CSS évite le clignotement au premier
    rendu, où le crochet vaut encore `false`, et le crochet évite l'appel réseau.

    1080 px et non `useIsDesktop()` (1024) : `wide` est la rupture que le système
    déclare, et c'est celle que la grille ci-dessous utilise. Deux valeurs différentes
    ouvriraient une bande de 56 px où la colonne existe sans son panneau.
  */
  const isWide = useMediaQuery('(min-width: 1080px)');

  // La série est mise à jour à l'ouverture de l'écran, comme avant — cette logique ne bouge pas.
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { currentStreak, isNew } = await updateStreak(userId);
      if (isNew && currentStreak > 0) {
        await addXP(userId, XP_REWARDS.dailyStreak);
      }

      /*
        LES BADGES SE DÉCROCHENT ICI, et c'est le seul endroit qui le permette.

        Huit des dix n'avaient aucun attributeur : ils s'affichaient verrouillés à vie sur
        `/mon-espace/succes`. Leurs conditions portent sur quatre compteurs — leçons achevées,
        série, certificats, formations suivies — et cet écran est le seul à les connaître tous
        en même temps, puisqu'il reçoit les inscriptions complètes.

        Conséquence assumée : un badge se décroche à la PROCHAINE ouverture du tableau de bord,
        pas à l'instant de l'acte. C'est déjà le fonctionnement de la série, juste au-dessus.
        Attribuer à la source supposerait quatre points d'écriture au lieu d'un, et c'est
        précisément la dispersion qui a laissé huit badges sans attributeur.
      */
      const stats = enrolledFormations.reduce(
        (acc, { enrollment }) => ({
          lessons: acc.lessons + (enrollment.completedLessons?.length ?? 0),
          certificates: acc.certificates + (enrollment.certificateIssued ? 1 : 0),
          formations: acc.formations + 1,
          streak: acc.streak,
        }),
        { lessons: 0, certificates: 0, formations: 0, streak: currentStreak },
      );
      await syncBadges(userId, stats);

      const profile = await getGamificationProfile(userId);
      setGamification(profile);
    })().catch(() => null);
  }, [userId, enrolledFormations]);

  /* Un relevé porte sa date. Celle-ci est l'instant du rendu, donc de la lecture Firestore. */
  const asOf = new Date();
  const tutor = tutorName(userData);
  const firstName = displayName.split(' ')[0];

  /* Une précommande n'est pas « en cours » : son inscription existe et sa progression vaut 0,
     mais il n'y a aucune leçon à ouvrir. La proposer ici mènerait au mur du lecteur. */
  const ouvrables = enrolledFormations.filter((ef) => !estAVenir(ef.formation));
  const inProgress = ouvrables.find((ef) => ef.enrollment.progress > 0 && ef.enrollment.progress < 100)
    ?? ouvrables.find((ef) => ef.enrollment.progress < 100);

  /* ── « Le programme » — les modules de la formation en cours ────────────────
     Le handoff en fait un objet du tableau de bord desktop, et il n'y était pas :
     l'écran listait les ENTRÉES de l'espace, jamais le contenu du parcours. Rien
     n'est relevé en plus — `enrolledFormations` porte déjà les modules et les leçons
     terminées. C'est de la mise en forme, pas une lecture. */
  const done = new Set(inProgress?.enrollment.completedLessons ?? []);
  const modules = (inProgress?.formation?.modules ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((m) => {
      const total = m.lessons.length;
      const finished = m.lessons.filter((l) => done.has(l.id)).length;
      return { id: m.id, title: m.title, total, finished };
    });
  /* Le module « en cours » est le premier non terminé — et il n'y en a qu'un. Marquer
     tous les modules entamés comme « en cours » ferait trois puces actives sur cinq. */
  const currentModuleId = modules.find((m) => m.finished < m.total)?.id ?? null;

  const level = gamification ? getLevelFromXP(gamification.xp) : null;
  const levelFloor = level ? getXPForNextLevel(level - 1) : 0;
  const levelCeil = level ? getXPForNextLevel(level) : 0;
  const levelPct = level && Number.isFinite(levelCeil)
    ? Math.min(100, Math.max(0, Math.round(((gamification!.xp - levelFloor) / (levelCeil - levelFloor)) * 100)))
    : 100;

  return (
    /*
      ── TROIS COLONNES EN 1440, UNE SEULE EN 390 ────────────────────────────────
      `handoff_tableaux_de_bord` compose l'espace en navigation 250 · travail fluide ·
      répétiteur 340. `AppShell` pose déjà la première et décale de 250 px ; cet écran
      ajoute la troisième.

      LA COLONNE DE TRAVAIL NE S'ÉTIRE PAS. La règle d'élargissement du système est
      explicite : « l'espace gagné va à la marge et à la navigation, jamais à la
      longueur de ligne ». `max-w-4xl` saute en desktop pour laisser la grille prendre
      la largeur, mais la colonne de travail garde sa propre borne — sans quoi les
      lignes de leçon deviendraient illisibles à 1440.
    */
    <div className="mx-auto max-w-4xl px-[18px] py-6 wide:max-w-none wide:px-pane">
      {/* ── Le répétiteur en panneau permanent — le seul gain réel du desktop ──
          Monté seulement au-delà de 1080 px : il relève le quota au montage, et une
          classe `hidden` aurait laissé partir l'appel sur téléphone. La mise en page,
          elle, vit dans `SpaceSplit`, écrit une fois pour les cinq écrans. */}
      <SpaceSplit asideLabel={tutor} aside={isWide ? <TutorPanel /> : null}>
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

      {/* ── L'entrée du répétiteur. Son nom vient du profil, jamais d'une constante. ──
          Elle disparaît en desktop : le panneau permanent de la troisième colonne la
          remplace, et garder les deux donnerait deux entrées vers le même endroit sur
          le même écran. Le masquage est en CSS, pas par le crochet — voir `isWide`. */}
      <GlassPanel level="flat" padding={18} className="mt-[12px] wide:hidden">
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

      {/* ── Le programme ─────────────────────────────────────────────────────── */}
      {modules.length > 0 && (
        <>
          <p className="mm-eyebrow mt-[22px]">{t('dashboard.programEyebrow')}</p>
          <GlassPanel level="flat" padding="4px 18px" className="mt-[10px]">
            {modules.map((m, i) => (
              <LessonRow
                key={m.id}
                state={m.finished === m.total ? 'done' : m.id === currentModuleId ? 'current' : 'todo'}
                title={m.title}
                /* Le compte des leçons est un relevé, donc il passe par <Num>. La phrase
                   est coupée autour du chiffre plutôt qu'interpolée : une chaîne traduite
                   ne peut pas porter la provenance. */
                meta={
                  <>
                    <Num value={m.finished} source="db" asOf={asOf} />
                    {' / '}
                    <Num value={m.total} source="db" asOf={asOf} />{' '}
                    {t('dashboard.lessonsLabel')}
                  </>
                }
                onClick={
                  inProgress?.formation
                    ? () => navigate(path(`/cours/${inProgress.formation!.slug}`))
                    : undefined
                }
                last={i === modules.length - 1}
              />
            ))}
          </GlassPanel>
        </>
      )}

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
      </SpaceSplit>
    </div>
  );
}
