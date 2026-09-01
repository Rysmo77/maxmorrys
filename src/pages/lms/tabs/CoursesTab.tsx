import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, GlassPanel, Icon, Num, ProgressBar, Skeleton, Tag, TerritoryCard } from '@ds';
import { useLocalizedPath } from '../../../contexts/LanguageContext';
import type { EnrolledFormation } from '../hooks/useStudentData';
import type { Certificate } from '../../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN « COURS » — la pile des formations de la personne.
 *
 * Recomposé sur `ScreensCatalogue.js` (la carte territoire) et sur la carte de reprise de
 * `ScreensSpace.js` (la barre de progression et son compte de leçons).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A DISPARU, ET POURQUOI
 *
 * · `FormationCard`. La carte du catalogue public rend une note en étoiles et un nombre
 *   d'inscrits (`formation.rating`, `formation.students`) — deux des interdits absolus du
 *   système — et importe `lucide-react`, ce qui poserait une seconde famille d'icônes sur cet
 *   écran. La carte reste en place pour les surfaces publiques ; elle n'entre plus ici.
 *   Ce que le kit demande — territoire, méta, progression, prix — est rendu par <TerritoryCard>.
 *
 * · LA PROMESSE « 3× PLUS VITE » de l'état vide. Un chiffre de conversion que rien ne mesure
 *   dans ce produit. Un état vide invite ; il n'argumente pas avec un chiffre inventé.
 *
 * LA CARTE EST LE LIEN. Le kit pose un bouton « Voir » dans la carte ; ici la carte entière
 * mène au lecteur. Un bouton interactif à l'intérieur d'un lien est du HTML invalide, et
 * deux cibles pour une seule destination font hésiter au doigt.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface CoursesTabProps {
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
  certificates?: Certificate[];
}

export default function CoursesTab({ enrolledFormations, loadingEnrollments, certificates = [] }: CoursesTabProps) {
  const { t } = useTranslation('lmsTabs');
  const navigate = useNavigate();
  const path = useLocalizedPath();
  const certByFormation = new Map(certificates.map((c) => [c.formationId, c]));

  /* La date du relevé : l'instant de la lecture Firestore qui a produit ces inscriptions. */
  const asOf = new Date();

  if (loadingEnrollments) {
    return (
      <div className="mx-auto grid max-w-4xl gap-4 px-[18px] py-6 stack:grid-cols-2">
        {[0, 1].map((i) => <Skeleton key={i} height={200} radius="var(--r-l)" label={t('courses.loadingLabel')} />)}
      </div>
    );
  }

  if (enrolledFormations.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-[18px] py-6">
        <GlassPanel level="hero" padding={22}>
          <EmptyState
            glyph={<Icon name="book" size={26} style={{ color: 'var(--mm-bleu)' }} />}
            glyphBackground="color-mix(in srgb, var(--mm-bleu) 14%, transparent)"
            title={t('courses.emptyTitle')}
            body={t('courses.emptyText')}
            action={<Button tone="forme" onClick={() => navigate(path('/formations'))}>{t('courses.explore')}</Button>}
          />
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-[18px] py-6">
      <p className="mm-eyebrow m-0">{t('courses.countEyebrow')}</p>

      <div className="mt-[14px] grid gap-4 stack:grid-cols-2">
        {enrolledFormations.map(({ enrollment, formation }, i) => {
          if (!formation) {
            return (
              <GlassPanel key={enrollment.id} level="flat" padding={18}>
                <p className="m-0 text-meta font-bold text-ink">{t('courses.unavailableTitle')}</p>
                <p className="m-0 mt-[4px] text-meta-2" style={{ color: 'var(--text-muted)' }}>
                  {t('courses.unavailableText')}
                </p>
              </GlassPanel>
            );
          }

          const cert = certByFormation.get(enrollment.formationId);
          const lessons = formation.modules.reduce((n, m) => n + m.lessons.length, 0);

          return (
            <button
              key={enrollment.id}
              type="button"
              onClick={() => navigate(path(`/cours/${formation.slug}`))}
              className="mm-press block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
            >
              <TerritoryCard
                first
                territory={i % 2 === 0 ? 'forme' : 'transforme'}
                meta={formation.duration}
                title={formation.title}
                titleSize={20}
              >
                <ProgressBar
                  value={enrollment.progress}
                  source="db"
                  asOf={asOf}
                  label={t('courses.progressLabel')}
                  readout
                  style={{ marginTop: '15px' }}
                />
                <div className="mt-[10px] flex flex-wrap items-center gap-2">
                  <span className="text-meta-2" style={{ color: 'var(--card-ink-2)' }}>
                    <Num value={enrollment.completedLessons.length} source="db" asOf={asOf} />
                    {' / '}
                    <Num value={lessons || null} source="db" asOf={asOf} />{' '}
                    {t('courses.lessonsLabel')}
                  </span>
                  {enrollment.progress === 100 && <Tag tone="ok">{t('courses.completedTag')}</Tag>}
                  {cert && <Tag>{t('courses.certificateTag')}</Tag>}
                </div>
              </TerritoryCard>
            </button>
          );
        })}
      </div>
    </div>
  );
}
