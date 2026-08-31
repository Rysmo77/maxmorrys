import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import { getFormationBySlug, getUserEnrollments, updateEnrollmentProgress, issueCertificate } from '../../../lib/firestore';
import { updateDocById } from '../../../lib/firestore/helpers';
import type { Formation, Lesson, Enrollment } from '../../../types';
import { captureError } from '../../../lib/sentry';
import { addXP } from '../../../lib/gamification';
import { XP_REWARDS } from '../../../types/gamification';
import { trackViewItem, trackLessonCompleted, trackCourseProgress } from '../../../lib/tracking';

/**
 * TOUT L'ÉTAT DE LECTURE DU LECTEUR DE LEÇON, SORTI DU RENDU.
 *
 * `CoursePlayer` portait 649 lignes dont sept états, deux effets, l'attribution d'XP, la
 * sauvegarde de progression et l'émission du certificat — mêlés à son JSX. Recomposer un
 * écran pareil sans l'extraire d'abord, c'est déplacer de la logique en même temps qu'on
 * déplace du dessin, et ne plus savoir lequel des deux a cassé.
 *
 * RIEN N'EST MODIFIÉ ICI. Les appels, leur ordre, leurs gardes et leurs `catch` sont ceux
 * d'avant, au caractère près — y compris le repère `maxProgress`, qui est la seule chose qui
 * empêche décocher-recocher une leçon de rapporter de l'XP en boucle.
 */

/**
 * Attribue l'XP d'apprentissage pour les paliers franchis depuis `previousMax`.
 *
 * Appelee uniquement quand la progression depasse son plus haut historique, ce qui rend
 * l'attribution non repetable : decocher puis recocher une lecon ne rapporte plus rien.
 * Le total d'un appel reste tres en dessous du plafond de 500 XP par ecriture impose par
 * la regle Firestore (au pire 10 + 50 + 200 sur la derniere lecon d'une formation).
 *
 * Les echecs sont avales : rater un gain d'XP ne doit jamais faire echouer l'enregistrement
 * de la progression, qui vient de reussir.
 */
async function awardLearningXP({
  userId, formation, completedLessons, totalLessons, previousMax, newProgress,
}: {
  userId: string;
  formation: Formation;
  completedLessons: string[];
  totalLessons: number;
  previousMax: number;
  newProgress: number;
}): Promise<void> {
  try {
    const lessonsAtPreviousMax = Math.round((previousMax / 100) * totalLessons);
    const newlyCompleted = completedLessons.length - lessonsAtPreviousMax;

    let amount = newlyCompleted > 0 ? newlyCompleted * XP_REWARDS.completeLesson : 0;

    // Modules entierement termines par ce franchissement.
    const done = new Set(completedLessons);
    const completedModules = (formation.modules ?? []).filter(
      (m) => m.lessons.length > 0 && m.lessons.every((l) => done.has(l.id)),
    ).length;
    const modulesAtPreviousMax = Math.floor((previousMax / 100) * (formation.modules?.length ?? 0));
    if (completedModules > modulesAtPreviousMax) {
      amount += (completedModules - modulesAtPreviousMax) * XP_REWARDS.completeModule;
    }

    if (newProgress === 100 && previousMax < 100) {
      amount += XP_REWARDS.completeFormation;
    }

    if (amount > 0) await addXP(userId, amount);
  } catch (error: unknown) {
    captureError(error, { context: 'Failed to award learning XP' });
  }
}

/** Où se trouve une leçon dans la formation — pour le sourcil « Module 3 · Leçon 5 ». */
export interface LessonPosition {
  moduleIndex: number;
  lessonIndex: number;
}

export interface CoursePlayerState {
  formation: Formation | null;
  enrollment: Enrollment | null;
  loading: boolean;
  saving: boolean;
  completedLessons: string[];
  activeLesson: Lesson | null;
  setActiveLesson: (lesson: Lesson) => void;
  expandedModules: string[];
  toggleModule: (id: string) => void;
  totalLessons: number;
  progress: number;
  /** L'instant de la lecture Firestore : la date de relevé de la progression affichée. */
  readAt: Date;
  positionOf: (lessonId: string) => LessonPosition | null;
  toggleComplete: (lessonId: string) => Promise<void>;
}

export function useCoursePlayer(slug: string | undefined): CoursePlayerState {
  const { t } = useTranslation('lms');
  const { addToast } = useToast();
  const { user } = useAuth();

  const [formation, setFormation] = useState<Formation | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [readAt, setReadAt] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!slug || !user) return;
    setLoading(true);
    Promise.all([
      getFormationBySlug(slug),
      getUserEnrollments(user.uid),
    ]).then(([f, enrollments]) => {
      setFormation(f);
      setReadAt(new Date());
      if (f) {
        trackViewItem({ id: f.id, name: f.title, category: f.category, content_type: 'formation' });
        const e = enrollments.find((en) => en.formationId === f.id);
        if (e) {
          setEnrollment(e);
          setCompletedLessons(e.completedLessons ?? []);
        }
        // Auto-expand first module
        if (f.modules?.[0]) {
          setExpandedModules([f.modules[0].id]);
          setActiveLesson(f.modules[0].lessons?.[0] ?? null);
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug, user]);

  const totalLessons = formation?.modules?.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
  const progress = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

  /** Index module/leçon, calculé une fois par formation plutôt qu'à chaque rendu de sourcil. */
  const positions = useMemo(() => {
    const map = new Map<string, LessonPosition>();
    (formation?.modules ?? []).forEach((m, moduleIndex) => {
      m.lessons.forEach((l, lessonIndex) => map.set(l.id, { moduleIndex, lessonIndex }));
    });
    return map;
  }, [formation]);

  const positionOf = useCallback((lessonId: string) => positions.get(lessonId) ?? null, [positions]);

  const toggleModule = useCallback((id: string) => {
    setExpandedModules((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  }, []);

  const toggleComplete = useCallback(async (lessonId: string) => {
    if (!enrollment || !user) return;
    const updated = completedLessons.includes(lessonId)
      ? completedLessons.filter((l) => l !== lessonId)
      : [...completedLessons, lessonId];

    setCompletedLessons(updated);

    const isMarking = !completedLessons.includes(lessonId);
    const newProgress = totalLessons > 0 ? Math.round((updated.length / totalLessons) * 100) : 0;
    if (newProgress === 100 && isMarking) {
      addToast('success', t('player.toastFormationCompleted'));
    }

    if (isMarking && formation) {
      trackLessonCompleted(formation.id, lessonId);
      trackCourseProgress(formation.id, newProgress);
    }

    setSaving(true);
    try {
      const previousMax = enrollment.maxProgress ?? 0;
      await updateEnrollmentProgress(enrollment.id, updated, newProgress, previousMax);

      // XP d'apprentissage — accorde une seule fois par palier franchi.
      //
      // Le repere est un pourcentage : on le reconvertit en nombre de lecons pour ne
      // recompenser que les lecons reellement nouvelles. Sans ce garde-fou, decocher puis
      // recocher une lecon rapportait de l'XP en boucle, et cet XP alimente le classement
      // et les badges de parrainage.
      if (newProgress > previousMax && formation) {
        await awardLearningXP({
          userId: user.uid,
          formation,
          completedLessons: updated,
          totalLessons,
          previousMax,
          newProgress,
        });
      }

      if (newProgress > previousMax) {
        setEnrollment((prev) => (prev ? { ...prev, maxProgress: newProgress } : prev));
      }

      if (newProgress === 100 && !enrollment.certificateIssued && formation) {
        try {
          await issueCertificate(user.uid, formation.id, formation.title);
          await updateDocById('enrollments', enrollment.id, { certificateIssued: true });
          setEnrollment((prev) => (prev ? { ...prev, certificateIssued: true } : prev));
          addToast('success', t('player.toastCertificateIssued'));
        } catch (certError: unknown) {
          captureError(certError, { context: 'Failed to auto-issue certificate' });
        }
      }
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to save enrollment progress' });
      addToast('error', error instanceof Error ? error.message : t('player.errorSaveProgress'));
    } finally {
      setSaving(false);
    }
  }, [enrollment, user, completedLessons, totalLessons, formation, addToast, t]);

  return {
    formation, enrollment, loading, saving, completedLessons,
    activeLesson, setActiveLesson, expandedModules, toggleModule,
    totalLessons, progress, readAt, positionOf, toggleComplete,
  };
}
