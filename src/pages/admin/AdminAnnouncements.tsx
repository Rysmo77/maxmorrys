import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Megaphone, Loader2, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllAnnouncements, saveAnnouncement, deleteAnnouncement } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { Announcement } from '../../types';
import { captureError } from '../../lib/sentry';

const EMPTY: Omit<Announcement, 'id'> = {
  title: '', content: '', type: 'info', active: true,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '', link: '',
};

const TYPE_COLORS: Record<Announcement['type'], string> = {
  info: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
  promo: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
  update: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
};

export default function AdminAnnouncements() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const TYPE_LABELS: Record<Announcement['type'], string> = {
    info: t('announcements.typeInfo'),
    promo: t('announcements.typePromo'),
    update: t('announcements.typeUpdate'),
  };
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<Omit<Announcement, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAllAnnouncements().then((data) => { setAnnouncements(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, startDate: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, type: a.type, active: a.active, startDate: a.startDate?.split('T')[0] ?? '', endDate: a.endDate?.split('T')[0] ?? '', link: a.link ?? '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await saveAnnouncement({ ...form, id: editing?.id });
      addToast('success', editing ? t('announcements.toastUpdated') : t('announcements.toastCreated'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save announcement failed' });
      addToast('error', error instanceof Error ? error.message : t('announcements.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm.requestConfirm(t('announcements.confirmDeleteMessage'), async () => {
      try {
        await deleteAnnouncement(id).catch(() => addToast('error', t('announcements.toastDeleteError')));
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        addToast('success', t('announcements.toastDeleted'));
      } catch (error: unknown) {
        captureError(error, { context: 'Delete announcement failed' });
        addToast('error', t('announcements.toastDeleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const handleToggleActive = async (a: Announcement) => {
    await saveAnnouncement({ ...a, active: !a.active }).catch(() => addToast('error', t('announcements.toastToggleError')));
    setAnnouncements((prev) => prev.map((ea) => ea.id === a.id ? { ...ea, active: !a.active } : ea));
  };

  const filtered = announcements;
  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{t('announcements.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('announcements.activeCount', { count: announcements.filter((a) => a.active).length, total: announcements.length })}</p>
        </div>
        <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>{t('announcements.newAnnouncement')}</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <Megaphone className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">{t('announcements.empty')}</p>
        </div>
      ) : (
        <>
        <div className="space-y-3">
          {paged.map((a) => (
            <div key={a.id} className={`bg-white dark:bg-neutral-800 border rounded-2xl p-5 transition-colors ${a.active ? 'border-neutral-200 dark:border-neutral-700' : 'border-dashed border-neutral-200 dark:border-neutral-700 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[a.type]}`}>{TYPE_LABELS[a.type]}</span>
                    {a.active && <span className="text-xs text-success-600 dark:text-success-400 font-medium">{t('announcements.badgeActive')}</span>}
                  </div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{a.title}</p>
                  <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{a.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                    <span>{t('announcements.dateFrom', { date: formatDate(a.startDate) })}</span>
                    {a.endDate && <span>{t('announcements.dateTo', { date: formatDate(a.endDate) })}</span>}
                    {a.link && <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline truncate max-w-[150px]">{a.link}</a>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleToggleActive(a)} className="transition-colors" aria-label={a.active ? t('announcements.ariaDeactivate') : t('announcements.ariaActivate')}>
                    {a.active ? <ToggleRight className="w-6 h-6 text-success-500" /> : <ToggleLeft className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />}
                  </button>
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" aria-label={t('announcements.ariaEdit')}><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors" aria-label={t('announcements.ariaDelete')}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-neutral-900 dark:text-white">{editing ? t('announcements.modalEditTitle') : t('announcements.modalNewTitle')}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors" aria-label={t('announcements.ariaClose')}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('announcements.labelTitle')}</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder={t('announcements.placeholderTitle')} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('announcements.labelType')}</label>
                  <div className="relative">
                    <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Announcement['type'] }))} className={`${inputCls} appearance-none pr-8`}>
                      <option value="info">{t('announcements.typeInfo')}</option>
                      <option value="promo">{t('announcements.typePromo')}</option>
                      <option value="update">{t('announcements.typeUpdate')}</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1 flex items-center gap-3 pt-4">
                  <button onClick={() => setForm((p) => ({ ...p, active: !p.active }))} className="transition-colors" aria-label={form.active ? t('announcements.ariaDeactivate') : t('announcements.ariaActivate')}>
                    {form.active ? <ToggleRight className="w-7 h-7 text-success-500" /> : <ToggleLeft className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />}
                  </button>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{form.active ? t('announcements.statusActive') : t('announcements.statusInactive')}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('announcements.labelContent')}</label>
                <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} rows={3} placeholder={t('announcements.placeholderContent')} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('announcements.labelStartDate')}</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('announcements.labelEndDate')}</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('announcements.labelLink')}</label>
                <input value={form.link} onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." className={inputCls} />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{t('announcements.cancel')}</Button>
              <Button onClick={handleSave} disabled={saving || !form.title.trim()} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {saving ? t('announcements.saving') : t('announcements.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('announcements.confirmDeleteTitle')} message={confirm.message} confirmLabel={t('announcements.confirmDeleteLabel')} />
    </div>
  );
}
