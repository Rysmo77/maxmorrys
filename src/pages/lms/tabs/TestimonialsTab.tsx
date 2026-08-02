import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  MessageSquareQuote, Type, Mic, Video, Star, Send, Loader2, Trash2,
  Sparkles, GraduationCap, User as UserIcon,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import MediaRecorderInput from '../../../components/lms/MediaRecorderInput';
import { cn } from '../../../lib/utils';
import { useFormat } from '../../../hooks/useFormat';
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

const FORMATS: { id: Format; labelKey: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'text', labelKey: 'testimonials.formatText', icon: Type },
  { id: 'audio', labelKey: 'testimonials.formatAudio', icon: Mic },
  { id: 'video', labelKey: 'testimonials.formatVideo', icon: Video },
];

const TARGETS: { id: TargetKind; labelKey: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'platform', labelKey: 'testimonials.targetPlatform', icon: Sparkles },
  { id: 'mentor', labelKey: 'testimonials.targetMentor', icon: UserIcon },
  { id: 'formation', labelKey: 'testimonials.targetFormation', icon: GraduationCap },
];

const statusStyle = (status?: string) =>
  status === 'approved'
    ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
    : status === 'rejected'
      ? 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400'
      : 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400';

const statusLabelKey = (status?: string) =>
  status === 'approved' ? 'testimonials.statusApproved' : status === 'rejected' ? 'testimonials.statusRejected' : 'testimonials.statusPending';

export default function TestimonialsTab({
  userId, displayName, photoURL, enrolledFormations,
  myTestimonials, setMyTestimonials, loadingTestimonials, addToast,
}: TestimonialsTabProps) {
  const { t } = useTranslation('lmsTabs');
  const { formatDate } = useFormat();
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
        targetLabel = t('testimonials.targetPlatform');
      }

      const id = await submitTestimonial({
        userId,
        name: displayName,
        avatar: photoURL || '',
        role: t('testimonials.roleStudent'),
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
        role: t('testimonials.roleStudent'),
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
      addToast('success', t('testimonials.toastSubmitSuccess'));
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : t('testimonials.toastSubmitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (testimonial: Testimonial) => {
    setMyTestimonials((prev) => prev.filter((x) => x.id !== testimonial.id));
    try {
      await deleteMyTestimonial(testimonial.id);
      addToast('success', t('testimonials.toastDeleted'));
    } catch {
      setMyTestimonials((prev) => [testimonial, ...prev]);
      addToast('error', t('testimonials.toastDeleteError'));
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Submission form */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-5 h-5 text-brand-500" />
          <h3 className="font-bold text-neutral-900 dark:text-white">{t('testimonials.shareTitle')}</h3>
        </div>

        {/* Format */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500">{t('testimonials.format')}</label>
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
                <f.icon className="w-4 h-4" /> {t(f.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Target */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500">{t('testimonials.aboutLabel')}</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TARGETS.map((target) => {
              const disabled = target.id === 'formation' && enrolledWithFormation.length === 0;
              return (
                <button
                  key={target.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setTargetKind(target.id)}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors',
                    targetKind === target.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700/50',
                    disabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <target.icon className="w-4 h-4 flex-shrink-0" /> {t(target.labelKey)}
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
              <option value="">{t('testimonials.chooseFormation')}</option>
              {enrolledWithFormation.map((ef) => (
                <option key={ef.formation!.id} value={ef.formation!.id}>{ef.formation!.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* Rating */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500">{t('testimonials.yourRating')}</label>
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
              {format === 'video' ? t('testimonials.yourVideo') : t('testimonials.yourAudio')}
            </label>
            <MediaRecorderInput mode={format} userId={userId} value={mediaUrl} onChange={setMediaUrl} />
          </div>
        )}

        {/* Content / caption */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-500">
            {format === 'text' ? t('testimonials.yourMessage') : t('testimonials.captionTranscript')}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={format === 'text' ? t('testimonials.messagePlaceholder') : t('testimonials.captionPlaceholder')}
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
            {submitting ? t('testimonials.sending') : t('testimonials.submit')}
          </Button>
        </div>
      </div>

      {/* My testimonials */}
      <div>
        <h3 className="font-bold text-neutral-900 dark:text-white mb-3">{t('testimonials.myReviews')}</h3>
        {loadingTestimonials ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        ) : myTestimonials.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
            <MessageSquareQuote className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">{t('testimonials.emptyText')}</p>
          </div>
        ) : (
          <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="visible">
            {myTestimonials.map((item) => (
              <motion.div key={item.id} variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={cn('w-3.5 h-3.5', n <= item.rating ? 'text-accent-500' : 'text-neutral-300 dark:text-neutral-700')} fill="currentColor" />
                    ))}
                  </div>
                  {item.status === 'pending' && (
                    <button onClick={() => handleDelete(item)} className="p-1 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors" aria-label={t('testimonials.deleteAria')}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {item.mediaType === 'video' && item.mediaUrl && (
                  <video src={item.mediaUrl} controls playsInline className="w-full max-h-56 rounded-lg bg-black" />
                )}
                {item.mediaType === 'audio' && item.mediaUrl && (
                  <audio src={item.mediaUrl} controls className="w-full" />
                )}
                {item.content && <p className="text-sm text-neutral-700 dark:text-neutral-300 italic">"{item.content}"</p>}

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold', statusStyle(item.status))}>
                    {t(statusLabelKey(item.status))}
                  </span>
                  {item.targetLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500">
                      {item.targetLabel}
                    </span>
                  )}
                  {item.createdAt && <span className="text-xs text-neutral-400">{formatDate(item.createdAt)}</span>}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
