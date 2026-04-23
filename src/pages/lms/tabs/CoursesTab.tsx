import { Link } from 'react-router-dom';
import { Play, CheckCircle, Award, Loader2, GraduationCap, ArrowRight } from 'lucide-react';
import Button from '../../../components/ui/Button';
import type { EnrolledFormation } from '../hooks/useStudentData';
import type { Certificate } from '../../../types';

interface CoursesTabProps {
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
  certificates?: Certificate[];
}

export default function CoursesTab({ enrolledFormations, loadingEnrollments, certificates = [] }: CoursesTabProps) {
  const certByFormation = new Map(certificates.map((c) => [c.formationId, c]));
  return (
    <div className="space-y-4">
      {loadingEnrollments ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : enrolledFormations.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-900/20 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-brand-500" />
          </div>
          <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Aucune formation pour l'instant</h4>
          <p className="text-sm text-neutral-500 mb-4 max-w-sm mx-auto">
            Inscris-toi à ta première formation pour commencer ton parcours. Les étudiants qui suivent un plan structuré progressent 3x plus vite.
          </p>
          <Link to="/formations"><Button icon={<ArrowRight className="w-4 h-4" />}>Explorer les formations</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolledFormations.map(({ enrollment, formation }) => (
            <div key={enrollment.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
              {formation?.coverImage && (
                <img src={formation.coverImage} alt="" className="w-full h-32 object-cover" loading="lazy" />
              )}
              <div className="p-4">
                <p className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-2 mb-2">{formation?.title ?? 'Formation'}</p>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Progression</span>
                    <span>{enrollment.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${enrollment.progress}%` }} />
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mb-3">{enrollment.completedLessons.length} leçon{enrollment.completedLessons.length !== 1 ? 's' : ''} complétée{enrollment.completedLessons.length !== 1 ? 's' : ''}</p>
                <div className="flex gap-2">
                  {formation && (
                    <Link to={`/cours/${formation.slug}`} className="flex-1">
                      <Button size="sm" className="w-full" icon={enrollment.progress === 100 ? <CheckCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}>
                        {enrollment.progress === 100 ? 'Revoir' : 'Continuer'}
                      </Button>
                    </Link>
                  )}
                  {enrollment.progress === 100 && enrollment.certificateIssued && certByFormation.get(enrollment.formationId) && (
                    <Link to={`/certificat/${certByFormation.get(enrollment.formationId)!.certificateCode}`}>
                      <Button size="sm" variant="outline" icon={<Award className="w-3.5 h-3.5" />}>Certificat</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
