import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button, ChipRow, EmptyState, GlassPanel, Icon, Num, ProgressBar, Skeleton, Tag, TerritoryCard,
} from '@ds';
import { useLocalizedPath } from '../../../contexts/LanguageContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import SpaceSplit from '../components/SpaceSplit';
import ResumePanel from '../components/ResumePanel';
import type { EnrolledFormation } from '../hooks/useStudentData';
import type { Certificate } from '../../../types';
import { estAVenir } from '../../../types/formationRelease';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN « COURS » — la pile des formations de la personne.
 *
 * Recomposé sur `ScreensCatalogue.js` (la carte territoire) et sur la carte de reprise de
 * `ScreensSpace.js` (la barre de progression et son compte de leçons), puis élargi sur
 * `handoff_tableaux_de_bord/dashboards-app.jsx` § CoursDesktop.
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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LA LARGEUR APPORTE — `CoursDesktop`, et rien de plus
 *
 * · UNE TROISIÈME COLONNE : la reprise, « pour qu'elle soit atteignable depuis n'importe
 *   quelle page de cours et pas seulement depuis l'accueil », et ce qui est gardé hors
 *   connexion avec son poids mesuré. Voir `ResumePanel`.
 *
 * · UN FILTRE PAR ÉTAT, pas par date. Le même principe que la console : on cherche « ce
 *   qui attend », pas « ce qui s'est passé mardi ». Les trois comptes sont RÉELS — ils se
 *   déduisent de `enrollment.progress`, aucun n'est écrit à la main.
 *
 * · LE COMPTE DE CERTIFICATS, DATÉ. La maquette écrit « 0 certificat » et c'est délibéré :
 *   « un zéro daté est une information ; un tiret n'en est pas une ». Le compte vient de
 *   `certificates`, la même lecture qui alimentait déjà l'étiquette par carte.
 *
 * · L'ENCART DE VÉRITÉ sur ce qui reste acquis. Il ne promet rien de neuf : il écrit ce que
 *   les CGV tiennent déjà — accès à vie, mises à jour comprises, certificats vérifiables
 *   après suppression du compte.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface CoursesTabProps {
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
  certificates?: Certificate[];
}

/** Les trois états d'une inscription. Ils se DÉDUISENT de la progression, ils ne sont pas stockés. */
type CourseFilter = 'all' | 'ongoing' | 'done';

export default function CoursesTab({ enrolledFormations, loadingEnrollments, certificates = [] }: CoursesTabProps) {
  const { t } = useTranslation('lmsTabs');
  const navigate = useNavigate();
  const path = useLocalizedPath();
  const certByFormation = new Map(certificates.map((c) => [c.formationId, c]));

  const [filter, setFilter] = useState<CourseFilter>('all');

  /*
    ── POURQUOI UN CROCHET ET PAS UNE CLASSE ────────────────────────────────────
    `ResumePanel` ouvre le cache hors connexion à son montage. Une classe `hidden`
    le monterait quand même sur téléphone — le travail partirait, invisible. 1080 px
    est la rupture que le système déclare, et celle que `SpaceSplit` utilise : deux
    valeurs différentes ouvriraient une bande où la colonne existe sans son panneau.
  */
  const isWide = useMediaQuery('(min-width: 1080px)');

  /* La date du relevé : l'instant de la lecture Firestore qui a produit ces inscriptions. */
  const asOf = new Date();

  /*
   * ⚠️ UNE PRÉCOMMANDE N'EST PAS UNE FORMATION « EN COURS ».
   *
   * L'inscription existe dès le paiement — c'est ce qui fait qu'on possède la formation — et
   * sa progression vaut 0, donc « < 100 ». Sans cette exclusion, une précommande gonflerait
   * le compte « en cours » d'un cours qu'il est impossible de commencer, et qu'on ne peut
   * donc jamais faire redescendre.
   */
  const counts = useMemo(() => ({
    all: enrolledFormations.length,
    ongoing: enrolledFormations.filter((ef) => !estAVenir(ef.formation) && ef.enrollment.progress < 100).length,
    done: enrolledFormations.filter((ef) => ef.enrollment.progress === 100).length,
  }), [enrolledFormations]);

  /* La formation à reprendre : celle qui est entamée, sinon la première non terminée.
     Même règle que le tableau de bord — un seul objet de reprise, jamais deux. */
  const resume = useMemo(() => {
    // On ne reprend pas ce qui n'a pas commencé : une formation à venir n'a rien à ouvrir.
    const ouvrables = enrolledFormations.filter((ef) => !estAVenir(ef.formation));
    return ouvrables.find((ef) => ef.enrollment.progress > 0 && ef.enrollment.progress < 100)
      ?? ouvrables.find((ef) => ef.enrollment.progress < 100)
      ?? null;
  }, [enrolledFormations]);

  const shown = useMemo(() => enrolledFormations.filter((ef) => (
    filter === 'all' ? true
      : filter === 'done' ? ef.enrollment.progress === 100
        : ef.enrollment.progress < 100
  )), [enrolledFormations, filter]);

  const OPTIONS: { key: CourseFilter; label: string }[] = [
    { key: 'all', label: `${t('courses.filterAll')} · ${counts.all}` },
    { key: 'ongoing', label: `${t('courses.filterOngoing')} · ${counts.ongoing}` },
    { key: 'done', label: `${t('courses.filterDone')} · ${counts.done}` },
  ];

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
    <div className="mx-auto max-w-4xl px-[18px] py-6 wide:max-w-none wide:px-pane">
      <SpaceSplit
        asideLabel={t('courses.resumeEyebrow')}
        aside={isWide ? <ResumePanel resume={resume} asOf={asOf} /> : null}
      >
        <p className="mm-eyebrow m-0">{t('courses.countEyebrow')}</p>

        <ChipRow
          className="rv mt-[14px]"
          style={{ ['--i' as string]: 1 }}
          label={t('courses.filterLabel')}
          options={OPTIONS.map((o) => o.label)}
          value={OPTIONS.find((o) => o.key === filter)?.label}
          onChange={(label) => {
            const hit = OPTIONS.find((o) => o.label === label);
            if (hit) setFilter(hit.key);
          }}
        />

        {shown.length === 0 ? (
          <GlassPanel level="flat" padding={20} className="rv mt-[14px]" style={{ ['--i' as string]: 2 }}>
            <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('courses.filterEmpty')}</p>
          </GlassPanel>
        ) : (
          <div className="mt-[14px] grid gap-4 stack:grid-cols-2">
            {shown.map(({ enrollment, formation }, i) => {
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
                    {/* Ni barre ni compteur sur une précommande : ils diraient « 0 / 0 leçon,
                        0 % », trois nombres exacts qui décrivent une panne plutôt qu'un état. */}
                    {estAVenir(formation) ? (
                      <div className="mt-[15px] flex flex-wrap items-center gap-2">
                        <Tag tone="warn">{t('courses.comingSoonTag')}</Tag>
                        <span className="text-meta-2" style={{ color: 'var(--card-ink-2)' }}>
                          {t('courses.comingSoonNote')}
                        </span>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </TerritoryCard>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Le compte de certificats, DATÉ ────────────────────────────────────
            « Un zéro daté est une information ; un tiret n'en est pas une. » Le bloc
            reste à l'écran même à zéro, et il dit ce qui déclenche le premier. */}
        <p className="mm-eyebrow m-0 mt-[26px]">{t('courses.certificatesEyebrow')}</p>
        <GlassPanel level="flat" padding={20} className="rv mt-2.5" style={{ ['--i' as string]: 4 }}>
          <div className="flex items-center gap-[14px]">
            <span
              aria-hidden="true"
              className="grid h-[44px] w-[44px] flex-none place-items-center rounded-[14px]"
              style={{ background: 'var(--fill-1)' }}
            >
              <Icon name="doc" size={20} style={{ color: 'var(--text-faint)' }} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[23px]">
                <Num value={certificates.length} source="db" asOf={asOf} />{' '}
                <span className="text-meta font-semibold">{t('courses.certificatesUnit', { count: certificates.length })}</span>
              </p>
              <p className="m-0 mt-0.5 text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
                {t('courses.certificatesNote')}
              </p>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel level="truth" className="rv mt-4" style={{ ['--i' as string]: 5 }}>
          <p className="mm-eyebrow m-0 mb-1.5">{t('courses.truthEyebrow')}</p>
          <p className="m-0 text-meta leading-[1.55]" style={{ color: 'var(--text-muted)' }}>
            {t('courses.truthBody')}
          </p>
        </GlassPanel>
      </SpaceSplit>
    </div>
  );
}
