import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, FileText, CheckCircle, Award, ChevronDown, ChevronUp, Download, Check, Loader2, Lock, ArrowRight, List } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Sheet from '../../components/ui/Sheet';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { getFormationBySlug, getUserEnrollments, updateEnrollmentProgress } from '../../lib/firestore';
import { markdownToHtml } from '../../lib/utils';
import type { Formation, Lesson, Enrollment } from '../../types';

function CourseOutline({
  formation, totalLessons, expandedModules, toggleModule,
  completedLessons, activeLesson, setActiveLesson, lessonIcons,
}: {
  formation: Formation;
  totalLessons: number;
  expandedModules: string[];
  toggleModule: (id: string) => void;
  completedLessons: string[];
  activeLesson: Lesson | null;
  setActiveLesson: (lesson: Lesson) => void;
  lessonIcons: Record<string, typeof Play>;
}) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden lg:sticky lg:top-20">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 hidden lg:block">
        <h3 className="font-bold text-neutral-900 dark:text-white">Contenu du cours</h3>
        <p className="text-xs text-neutral-500 mt-0.5">{formation.modules?.length ?? 0} modules · {totalLessons} leçons</p>
      </div>
      <div className="max-h-[65vh] overflow-y-auto">
        {(formation.modules ?? []).map((module) => {
          const isExpanded = expandedModules.includes(module.id);
          const moduleCompleted = module.lessons.length > 0 && module.lessons.every((l) => completedLessons.includes(l.id));
          return (
            <div key={module.id}>
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors border-b border-neutral-100 dark:border-neutral-700"
              >
                <div className="flex items-center gap-2 text-left">
                  {moduleCompleted && <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />}
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{module.title}</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />}
              </button>
              {isExpanded && module.lessons.map((lesson) => {
                const Icon = lessonIcons[lesson.type] ?? FileText;
                const isComplete = completedLessons.includes(lesson.id);
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isActive ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-brand-500' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/30'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${isActive ? 'text-brand-600 dark:text-brand-400 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}>
                      {lesson.title}
                    </span>
                    <span className="text-xs text-neutral-400 flex-shrink-0">{lesson.duration}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CoursePlayer() {
  const { slug } = useParams();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [formation, setFormation] = useState<Formation | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);

  useEffect(() => {
    if (!slug || !user) return;
    setLoading(true);
    Promise.all([
      getFormationBySlug(slug),
      getUserEnrollments(user.uid),
    ]).then(([f, enrollments]) => {
      setFormation(f);
      if (f) {
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

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const toggleComplete = async (lessonId: string) => {
    if (!enrollment || !user) return;
    const updated = completedLessons.includes(lessonId)
      ? completedLessons.filter((l) => l !== lessonId)
      : [...completedLessons, lessonId];

    setCompletedLessons(updated);

    const newProgress = totalLessons > 0 ? Math.round((updated.length / totalLessons) * 100) : 0;
    if (newProgress === 100 && !completedLessons.includes(lessonId)) {
      addToast('success', 'Félicitations ! Tu as terminé cette formation !');
    }

    setSaving(true);
    try {
      await updateEnrollmentProgress(enrollment.id, updated, newProgress);
    } catch (error: unknown) {
      console.error('Failed to save enrollment progress:', error);
      addToast('error', error instanceof Error ? error.message : 'Erreur lors de la sauvegarde de la progression.');
    } finally {
      setSaving(false);
    }
  };

  const lessonIcons: Record<string, typeof Play> = {
    video: Play, text: FileText, quiz: CheckCircle, resource: Download, mission: Award,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Cours introuvable</h1>
        <Link to="/mon-espace" className="text-brand-600 dark:text-brand-400 hover:underline">Retour à mon espace</Link>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="pt-24 pb-20 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-900/20 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-8 h-8 text-brand-500" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Cette formation requiert une inscription</h1>
        <p className="text-neutral-500 mb-2 text-sm">
          Tu n'es pas encore inscrit à <strong className="text-neutral-700 dark:text-neutral-300">{formation.title}</strong>.
        </p>
        <p className="text-neutral-400 text-sm mb-6">
          Inscris-toi pour accéder à tous les modules, leçons et obtenir ton certificat à la fin.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/formations/${formation.slug}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-full transition-colors text-sm"
          >
            Voir la formation <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/formations"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-semibold rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
          >
            Toutes les formations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-0 pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 h-14 flex items-center gap-4">
        <Breadcrumbs items={[
          { label: 'Mon espace', href: '/mon-espace' },
          { label: formation.title },
        ]} />
        <div className="flex-1" />
        {saving && <Loader2 className="w-4 h-4 animate-spin text-brand-500 flex-shrink-0" />}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Progress bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{progress}% terminé</span>
              <span className="text-xs text-neutral-400">({completedLessons.length}/{totalLessons} leçons)</span>
            </div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {progress === 100 && (
            <Badge variant="success" size="md">Terminé !</Badge>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lesson content */}
          <div className="lg:col-span-2">
            {activeLesson ? (
              <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                {activeLesson.type === 'video' ? (
                  <div className="aspect-video bg-neutral-900 flex items-center justify-center">
                    {activeLesson.videoUrl ? (
                      <iframe
                        src={activeLesson.videoUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                        <p className="text-white/60 text-sm">Vidéo à venir</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 min-h-[300px]">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">{activeLesson.title}</h2>
                    {activeLesson.content ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(activeLesson.content) }}
                      />
                    ) : (
                      <p className="text-neutral-500 italic">Contenu de la leçon à venir...</p>
                    )}
                  </div>
                )}
                <div className="p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{activeLesson.title}</h3>
                      <p className="text-sm text-neutral-500">{activeLesson.duration}</p>
                    </div>
                    <Button
                      variant={completedLessons.includes(activeLesson.id) ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => toggleComplete(activeLesson.id)}
                      disabled={saving}
                      icon={completedLessons.includes(activeLesson.id) ? <Check className="w-4 h-4" /> : undefined}
                    >
                      {completedLessons.includes(activeLesson.id) ? 'Terminée' : 'Marquer comme terminée'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
                <Play className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Sélectionnez une leçon</h2>
                <p className="text-neutral-500">Choisissez une leçon dans le menu pour commencer.</p>
              </div>
            )}
          </div>

          {/* Sidebar — course outline (desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            <CourseOutline
              formation={formation}
              totalLessons={totalLessons}
              expandedModules={expandedModules}
              toggleModule={toggleModule}
              completedLessons={completedLessons}
              activeLesson={activeLesson}
              setActiveLesson={setActiveLesson}
              lessonIcons={lessonIcons}
            />
          </div>
        </div>
      </div>

      {/* Mobile floating button for course outline */}
      <button
        onClick={() => setMobileOutlineOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-full shadow-lg transition-colors"
      >
        <List className="w-4 h-4" />
        Plan du cours
      </button>

      {/* Mobile bottom sheet for course outline */}
      <Sheet
        open={mobileOutlineOpen}
        onClose={() => setMobileOutlineOpen(false)}
        title="Plan du cours"
      >
        <CourseOutline
          formation={formation}
          totalLessons={totalLessons}
          expandedModules={expandedModules}
          toggleModule={toggleModule}
          completedLessons={completedLessons}
          activeLesson={activeLesson}
          setActiveLesson={(lesson) => { setActiveLesson(lesson); setMobileOutlineOpen(false); }}
          lessonIcons={lessonIcons}
        />
      </Sheet>
    </div>
  );
}
