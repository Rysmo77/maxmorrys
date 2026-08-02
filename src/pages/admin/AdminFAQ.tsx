import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, HelpCircle, Loader2, GripVertical } from 'lucide-react';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllFAQ, saveFAQItem, deleteFAQItem } from '../../lib/firestore';
import type { FAQ } from '../../types';
import { captureError } from '../../lib/sentry';

const EMPTY: Omit<FAQ, 'id'> = { question: '', answer: '', category: '', order: 0 };

export default function AdminFAQ() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [faq, setFaq] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState<Omit<FAQ, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAllFAQ().then((data) => { setFaq(data); setLoading(false); })
      .catch(() => { addToast('error', t('faq.toasts.loadError')); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const categories = ['all', ...Array.from(new Set(faq.map((f) => f.category).filter(Boolean)))];

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, order: faq.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (f: FAQ) => {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer, category: f.category, order: f.order });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      await saveFAQItem({ ...form, id: editing?.id });
      addToast('success', editing ? t('faq.toasts.updated') : t('faq.toasts.created'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save FAQ item failed' });
      addToast('error', error instanceof Error ? error.message : t('faq.toasts.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm.requestConfirm(t('faq.confirmDelete.message'), async () => {
      try {
        await deleteFAQItem(id);
        setFaq((prev) => prev.filter((f) => f.id !== id));
        addToast('success', t('faq.toasts.deleted'));
      } catch (error: unknown) {
        captureError(error, { context: 'Delete FAQ item failed' });
        addToast('error', error instanceof Error ? error.message : t('faq.toasts.deleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const filtered = faq.filter((f) => categoryFilter === 'all' || f.category === categoryFilter);

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{t('faq.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('faq.count', { count: faq.length })}</p>
        </div>
        <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>{t('faq.newQuestion')}</Button>
      </div>

      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${categoryFilter === cat ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400'}`}
            >
              {cat === 'all' ? t('faq.filterAll') : cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <HelpCircle className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">{t('faq.empty')}</p>
        </div>
      ) : (
        <>
        <div className="space-y-3">
          {paged.map((f) => (
            <div key={f.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <GripVertical className="w-4 h-4 text-neutral-300 dark:text-neutral-600 mt-0.5 flex-shrink-0 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {f.category && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400">{f.category}</span>}
                    <span className="text-xs text-neutral-400">#{f.order}</span>
                  </div>
                  <p className="font-semibold text-neutral-900 dark:text-white mb-1">{f.question}</p>
                  <p className="text-sm text-neutral-500 line-clamp-2">{f.answer}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="font-bold text-neutral-900 dark:text-white">{editing ? t('faq.modal.editTitle') : t('faq.modal.newTitle')}</h2>
              <button onClick={() => setModalOpen(false)} aria-label={t('faq.modal.close')} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('faq.form.questionLabel')}</label>
                <input value={form.question} onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))} placeholder={t('faq.form.questionPlaceholder')} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('faq.form.answerLabel')}</label>
                <textarea value={form.answer} onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))} rows={5} placeholder={t('faq.form.answerPlaceholder')} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('faq.form.categoryLabel')}</label>
                  <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder={t('faq.form.categoryPlaceholder')} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('faq.form.orderLabel')}</label>
                  <input type="number" min={0} value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))} className={inputCls} />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{t('faq.actions.cancel')}</Button>
              <Button onClick={handleSave} disabled={saving || !form.question.trim() || !form.answer.trim()} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {saving ? t('faq.actions.saving') : t('faq.actions.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('faq.confirmDelete.title')} message={confirm.message} confirmLabel={t('faq.confirmDelete.confirmLabel')} />
    </div>
  );
}
