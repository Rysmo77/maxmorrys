import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Star, Loader2, CheckCircle, XCircle, Clock, Eye, Download, Mic, Video } from 'lucide-react';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ImageInput from '../../components/ui/ImageInput';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllTestimonials, saveTestimonial, deleteTestimonial } from '../../lib/firestore';
import type { Testimonial } from '../../types';
import { captureError } from '../../lib/sentry';
import { testimonials as seedTestimonials } from '../../data/testimonials';

const EMPTY: Omit<Testimonial, 'id'> = {
  name: '', role: '', company: '', content: '', avatar: '', rating: 5, featured: false, status: 'approved',
};

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminTestimonials() {
  const { t: tr } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const TARGET_LABELS: Record<NonNullable<Testimonial['targetType']>, string> = {
    platform: tr('testimonials.targetPlatform'),
    mentor: 'Max-Morrys',
    formation: tr('testimonials.targetFormation'),
    podcast: 'Podcast',
    video: tr('testimonials.targetVideo'),
  };
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<Omit<Testimonial, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = () => {
    setLoading(true);
    getAllTestimonials().then((data) => { setTestimonials(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      name: t.name, role: t.role, company: t.company ?? '', content: t.content,
      avatar: t.avatar, rating: t.rating, featured: t.featured,
      status: t.status || 'approved', userId: t.userId, createdAt: t.createdAt,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await saveTestimonial({ ...form, id: editing?.id });
      addToast('success', editing ? tr('testimonials.toastUpdated') : tr('testimonials.toastCreated'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save testimonial failed' });
      addToast('error', error instanceof Error ? error.message : tr('testimonials.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (t: Testimonial) => {
    try {
      await saveTestimonial({ ...t, status: 'approved', featured: true, id: t.id });
      addToast('success', tr('testimonials.toastApproved'));
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Approve testimonial failed' });
      addToast('error', error instanceof Error ? error.message : tr('testimonials.toastApproveError'));
    }
  };

  const handleReject = async (t: Testimonial) => {
    try {
      await saveTestimonial({ ...t, status: 'rejected', featured: false, id: t.id });
      addToast('success', tr('testimonials.toastRejected'));
      load();
    } catch {
      addToast('error', tr('testimonials.toastRejectError'));
    }
  };

  const handleDelete = (id: string) => {
    confirm.requestConfirm(tr('testimonials.confirmDeleteMessage'), async () => {
      try {
        await deleteTestimonial(id).catch(() => addToast('error', tr('testimonials.toastDeleteError')));
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
        addToast('success', tr('testimonials.toastDeleted'));
      } catch (error: unknown) {
        captureError(error, { context: 'Delete testimonial failed' });
        addToast('error', tr('testimonials.toastDeleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const existing = new Set(testimonials.map((t) => `${t.name}|${t.content}`.toLowerCase()));
      const toImport = seedTestimonials.filter((s) => !existing.has(`${s.name}|${s.quote}`.toLowerCase()));
      if (toImport.length === 0) {
        addToast('success', tr('testimonials.toastSeedAlready'));
        return;
      }
      await Promise.all(toImport.map((s) => saveTestimonial({
        name: s.name,
        role: s.role,
        company: '',
        content: s.quote,
        avatar: '',
        rating: 5,
        mediaType: 'text',
        targetType: 'platform',
        targetLabel: 'La plateforme',
        featured: true,
        status: 'approved',
        createdAt: new Date().toISOString(),
      })));
      addToast('success', tr('testimonials.toastSeedImported', { count: toImport.length }));
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Seed testimonials failed' });
      addToast('error', error instanceof Error ? error.message : tr('testimonials.toastSeedError'));
    } finally {
      setSeeding(false);
    }
  };

  const set = (field: keyof Omit<Testimonial, 'id'>, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const filtered = testimonials.filter((t) => {
    if (filter === 'all') return true;
    return (t.status || 'approved') === filter;
  });

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const pendingCount = testimonials.filter((t) => t.status === 'pending').length;

  const statusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="sm"><Clock className="w-3 h-3 mr-1" />{tr('testimonials.statusPending')}</Badge>;
      case 'rejected':
        return <Badge variant="error" size="sm"><XCircle className="w-3 h-3 mr-1" />{tr('testimonials.statusRejected')}</Badge>;
      default:
        return <Badge variant="default" size="sm"><CheckCircle className="w-3 h-3 mr-1" />{tr('testimonials.statusApproved')}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{tr('testimonials.title')}</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            {tr('testimonials.count', { count: testimonials.length })}
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 text-xs font-bold">
                {tr('testimonials.pendingBadge', { count: pendingCount })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSeed} size="sm" variant="outline" disabled={seeding}>
            {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {tr('testimonials.importDemo')}
          </Button>
          <Button onClick={openNew} size="sm">
            <Plus className="w-4 h-4 mr-2" /> {tr('testimonials.new')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { key: 'all' as Filter, label: tr('testimonials.filterAll'), count: testimonials.length },
          { key: 'pending' as Filter, label: tr('testimonials.filterPending'), count: testimonials.filter((t) => t.status === 'pending').length },
          { key: 'approved' as Filter, label: tr('testimonials.filterApproved'), count: testimonials.filter((t) => !t.status || t.status === 'approved').length },
          { key: 'rejected' as Filter, label: tr('testimonials.filterRejected'), count: testimonials.filter((t) => t.status === 'rejected').length },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              filter === f.key
                ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <Star className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">
            {filter === 'all'
              ? tr('testimonials.emptyAll')
              : filter === 'pending'
              ? tr('testimonials.emptyPending')
              : filter === 'approved'
              ? tr('testimonials.emptyApproved')
              : tr('testimonials.emptyRejected')}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paged.map((t) => (
            <div key={t.id} className={`bg-white dark:bg-neutral-900 rounded-2xl border ${t.status === 'pending' ? 'border-warning-300 dark:border-warning-700' : 'border-neutral-200 dark:border-neutral-800'} p-6 flex flex-col gap-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-neutral-500">{t.role}{t.company ? ` · ${t.company}` : ''}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors" aria-label={tr('testimonials.edit')}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-error-600 dark:hover:text-error-400 transition-colors" aria-label={tr('testimonials.delete')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'text-accent-500' : 'text-neutral-300 dark:text-neutral-700'}`} fill="currentColor" />
                ))}
              </div>
              {t.mediaType === 'video' && t.mediaUrl && (
                <video src={t.mediaUrl} controls playsInline className="w-full max-h-48 rounded-lg bg-black" />
              )}
              {t.mediaType === 'audio' && t.mediaUrl && (
                <audio src={t.mediaUrl} controls className="w-full" />
              )}
              {t.content && <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">"{t.content}"</p>}

              <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
                {statusBadge(t.status)}
                {t.mediaType && t.mediaType !== 'text' && (
                  <span className="px-2 py-0.5 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-xs font-bold rounded-full flex items-center gap-1">
                    {t.mediaType === 'video' ? <Video className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    {t.mediaType === 'video' ? tr('testimonials.mediaVideo') : tr('testimonials.mediaAudio')}
                  </span>
                )}
                {t.targetType && (
                  <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold rounded-full">
                    {t.targetLabel || TARGET_LABELS[t.targetType]}
                  </span>
                )}
                {t.featured && (
                  <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-full flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {tr('testimonials.featured')}
                  </span>
                )}
              </div>

              {/* Quick actions for pending */}
              {t.status === 'pending' && (
                <div className="flex gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800 mt-1">
                  <Button size="sm" className="flex-1" onClick={() => handleApprove(t)} icon={<CheckCircle className="w-3.5 h-3.5" />}>
                    {tr('testimonials.approve')}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReject(t)} icon={<XCircle className="w-3.5 h-3.5" />}>
                    {tr('testimonials.reject')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-6">
              {editing ? tr('testimonials.modalEditTitle') : tr('testimonials.modalNewTitle')}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">{tr('testimonials.fieldName')}</label>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder={tr('testimonials.placeholderName')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">{tr('testimonials.fieldRole')}</label>
                  <input value={form.role} onChange={(e) => set('role', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder={tr('testimonials.placeholderRole')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">{tr('testimonials.fieldCompany')}</label>
                <input value={form.company ?? ''} onChange={(e) => set('company', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder={tr('testimonials.placeholderCompany')} />
              </div>
              <ImageInput label={tr('testimonials.fieldAvatar')} value={form.avatar} onChange={(url) => set('avatar', url)} folder="testimonials" />
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">{tr('testimonials.fieldRating')}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => set('rating', n)} className="focus:outline-none">
                      <Star className={`w-6 h-6 ${n <= form.rating ? 'text-accent-500' : 'text-neutral-300 dark:text-neutral-700'}`} fill="currentColor" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">{tr('testimonials.fieldContent')}</label>
                <textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none" placeholder={tr('testimonials.placeholderContent')} />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">{tr('testimonials.fieldStatus')}</label>
                <select
                  value={form.status || 'approved'}
                  onChange={(e) => set('status', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="pending">{tr('testimonials.statusPending')}</option>
                  <option value="approved">{tr('testimonials.statusApproved')}</option>
                  <option value="rejected">{tr('testimonials.statusRejected')}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="rounded" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{tr('testimonials.setFeatured')}</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>{tr('testimonials.cancel')}</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editing ? tr('testimonials.save') : tr('testimonials.create')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={tr('testimonials.confirmDeleteTitle')} message={confirm.message} confirmLabel={tr('testimonials.confirmDeleteLabel')} />
    </div>
  );
}
