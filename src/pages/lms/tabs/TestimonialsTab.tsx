import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquareQuote, Type, Mic, Video, Star, Send, Loader2, Trash2,
  Sparkles, GraduationCap, User as UserIcon,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import MediaRecorderInput from '../../../components/lms/MediaRecorderInput';
import { cn, formatDate } from '../../../lib/utils';
import { submitTestimonial, deleteMyTestimonial } from '../../../lib/firestore';
import { staggerContainer, staggerItem } from '../../../lib/animations';
import type { Testimonial } from '../../../types';
import type { EnrolledFormation } from '../hooks/useStudentData';

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

type Format = 'text' | 'audio' | 'video';
type TargetKind = 'platform' | 'mentor' | 'formation';

interface TestimonialsTabProps {
  userId?: string;
  displayName: string;
  photoURL?: string | null;
  enrolledFormations: EnrolledFormation[];
  myTestimonials: Testimonial[];
  setMyTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  loadingTestimonials: boolean;
  addToast: (type: 'success' | 'error', message: string) => void;
}

const FORMATS: { id: Format; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'text', label: 'Texte', icon: Type },
  { id: 'audio', label: 'Audio', icon: Mic },
  { id: 'video', label: 'Vidéo', icon: Video },
];

const TARGETS: { id: TargetKind; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'platform', label: 'La plateforme', icon: Sparkles },
  { id: 'mentor', label: 'Max-Morrys', icon: UserIcon },
  { id: 'formation', label: 'Une formation', icon: GraduationCap },
];

const statusStyle = (status?: string) =>
  status === 'approved'
    ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
    : status === 'rejected'
      ? 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400'
      : 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400';

const statusLabel = (status?: string) =>
  status === 'approved' ? 'Approuvé et publié' : status === 'rejected' ? 'Non retenu' : 'En attente de validation';

export default function TestimonialsTab({
  userId, displayName, photoURL, enrolledFormations,
  myTestimonials, setMyTestimonials, loadingTestimonials, addToast,
}: TestimonialsTabProps) {
  const [format, setFormat] = useState<Format>('text');
  const [targetKind, setTargetKind] = useState<TargetKind>('platform');
  const [formationId, setFormationId] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const enrolledWithFormation = enrolledFormations.filter((ef) => ef.formation);
  const needsFormation = targetKind === 'formation';
  const mediaReady = format === 'text' || !!mediaUrl;
  const formationReady = !needsFormation || !!formationId;
  const canSubmit = !!userId && content.trim().length > 0 && mediaReady && formationReady && !submitting;

  const resetForm = () => {
    setFormat('text'); setTargetKind('platform'); setFormationId('');
    setRating(5); setContent(''); setMediaUrl('');
  };

  const handleSubmit = async () => {
    if (!userId || !content.trim()) return;
    setSubmitting(true);
    try {
      let targetType: NonNullable<Testimonial['targetType']> = 'platform';
      let targetId: string | undefined;
      let targetLabel: string | undefined;
      if (targetKind === 'mentor') {
        targetType = 'mentor';
        targetLabel = 'Max-Morrys';
      } else if (targetKind === 'formation') {
        const ef = enrolledWithFormation.find((e) => e.formation?.id === formationId);
        targetType = 'formation';
        targetId = formationId;
        targetLabel = ef?.formation?.title;
      } else {
        targetLabel = 'La plateforme';
      }

      const id = await submitTestimonial({
        userId,
        name: displayName,
        avatar: photoURL || '',
        role: 'Étudiant',
        content: content.trim(),
        rating,
        mediaType: format,
        mediaUrl: mediaUrl || undefined,
        targetType,
        targetId,
        targetLabel,
      });

      const optimistic: Testimonial = {
        id,
        name: displayName,
        role: 'Étudiant',
        company: '',
        content: content.trim(),
        avatar: photoURL || '',
        rating,
        mediaType: format,
        mediaUrl: mediaUrl || undefined,
        targetType,
        targetId,
        targetLabel,
        featured: false,
        userId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setMyTestimonials((prev) => [optimistic, ...prev]);
      resetForm();
      addToast('success', 'Merci ! Ton témoignage sera visible après validation.');
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (t: Testimonial) => {
    setMyTestimonials((prev) => prev.filter((x) => x.id !== t.id));
    try {
      await deleteMyTestimonial(t.id);
      addToast('success', 'Témoignage supprimé.');
    } catch {
      setMyTestimonials((prev) => [t, ...prev]);
      addToast('error', 'Erreur lors de la suppression.');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Submission form */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-5 h-5 text-brand-500" />
          <h3 className="font-bold text-neutral-900 dark:text-white">Partager un avis</h3>
        </div>

        {/* Format */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500">Format</label>
          <div className="flex gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => { setFormat(f.id); setMediaUrl(''); }}
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors',
                  format === f.id
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700/50',
                )}
              >
                <f.icon className="w-4 h-4" /> {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500">Ton avis porte sur</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TARGETS.map((t) => {
              const disabled = t.id === 'formation' && enrolledWithFormation.length === 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setTargetKind(t.id)}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors',
                    targetKind === t.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700/50',
                    disabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <t.icon className="w-4 h-4 flex-shrink-0" /> {t.label}
                </button>
              );
            })}
          </div>
          {needsFormation && (
            <select
              value={formationId}
              onChange={(e) => setFormationId(e.target.value)}
              className={cn(inputCls, 'mt-2')}
            >
              <option value="">Choisis une formation…</option>
              {enrolledWithFormation.map((ef) => (
                <option key={ef.formation!.id} value={ef.formation!.id}>{ef.formation!.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* Rating */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500">Ta note</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className="focus:outline-none transition-transform hover:scale-110">
                <Star className={cn('w-7 h-7', n <= rating ? 'text-accent-500' : 'text-neutral-300 dark:text-neutral-700')} fill="currentColor" />
              </button>
            ))}
          </div>
        </div>

        {/* Media recorder (audio/video) */}
        {format !== 'text' && userId && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-500">
              {format === 'video' ? 'Ta vidéo' : 'Ton audio'}
            </label>
            <MediaRecorderInput mode={format} userId={userId} value={mediaUrl} onChange={setMediaUrl} />
          </div>
        )}

        {/* Content / caption */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500">
            {format === 'text' ? 'Ton message' : 'Légende / transcription'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={format === 'text' ? 'Décris ton expérience…' : 'Résume ton message en quelques mots…'}
            rows={4}
            maxLength={1000}
            className={cn(inputCls, 'resize-y')}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          >
            {submitting ? 'Envoi…' : 'Envoyer mon avis'}
          </Button>
        </div>
      </div>

      {/* My testimonials */}
      <div>
        <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Mes avis</h3>
        {loadingTestimonials ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        ) : myTestimonials.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
            <MessageSquareQuote className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">Tu n'as pas encore partagé d'avis.</p>
          </div>
        ) : (
          <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="visible">
            {myTestimonials.map((t) => (
              <motion.div key={t.id} variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={cn('w-3.5 h-3.5', n <= t.rating ? 'text-accent-500' : 'text-neutral-300 dark:text-neutral-700')} fill="currentColor" />
                    ))}
                  </div>
                  {t.status === 'pending' && (
                    <button onClick={() => handleDelete(t)} className="p-1 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors" aria-label="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {t.mediaType === 'video' && t.mediaUrl && (
                  <video src={t.mediaUrl} controls playsInline className="w-full max-h-56 rounded-lg bg-black" />
                )}
                {t.mediaType === 'audio' && t.mediaUrl && (
                  <audio src={t.mediaUrl} controls className="w-full" />
                )}
                {t.content && <p className="text-sm text-neutral-700 dark:text-neutral-300 italic">"{t.content}"</p>}

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold', statusStyle(t.status))}>
                    {statusLabel(t.status)}
                  </span>
                  {t.targetLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500">
                      {t.targetLabel}
                    </span>
                  )}
                  {t.createdAt && <span className="text-xs text-neutral-400">{formatDate(t.createdAt)}</span>}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
