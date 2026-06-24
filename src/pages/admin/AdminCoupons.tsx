import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Trash2, Edit2, Tag, Loader2, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllCoupons, saveCoupon, deleteCoupon } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { Coupon } from '../../types';
import { captureError } from '../../lib/sentry';

const EMPTY: Omit<Coupon, 'id'> = {
  code: '', type: 'percentage', value: 10, maxUses: 100,
  usedCount: 0, expiresAt: '', active: true,
};

export default function AdminCoupons() {
  const { t } = useTranslation('admin');
  const { formatDate, locale } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Omit<Coupon, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAllCoupons().then((data) => { setCoupons(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({ code: c.code, type: c.type, value: c.value, maxUses: c.maxUses, usedCount: c.usedCount, expiresAt: c.expiresAt?.split('T')[0] ?? '', active: c.active });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) return;
    setSaving(true);
    try {
      await saveCoupon({ ...form, code: form.code.toUpperCase().trim(), id: editing?.id });
      addToast('success', editing ? t('coupons.toasts.updated') : t('coupons.toasts.created'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save coupon failed' });
      addToast('error', error instanceof Error ? error.message : t('coupons.toasts.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm.requestConfirm(t('coupons.confirmDelete'), async () => {
      try {
        await deleteCoupon(id);
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        addToast('success', t('coupons.toasts.deleted'));
      } catch {
        addToast('error', t('coupons.toasts.deleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const handleToggleActive = async (c: Coupon) => {
    await saveCoupon({ ...c, active: !c.active }).catch(() => addToast('error', t('coupons.toasts.error')));
    setCoupons((prev) => prev.map((ec) => ec.id === c.id ? { ...ec, active: !c.active } : ec));
  };

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{t('coupons.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('coupons.count', { count: coupons.length })}</p>
        </div>
        <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>{t('coupons.new')}</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('coupons.searchPlaceholder')} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <Tag className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">{t('coupons.empty')}</p>
        </div>
      ) : (
        <>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t('coupons.table.code')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t('coupons.table.discount')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{t('coupons.table.uses')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">{t('coupons.table.expiration')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t('coupons.table.active')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {paged.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">{c.code}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand-600 dark:text-brand-400">
                    {c.type === 'percentage' ? `${c.value}%` : `${c.value.toLocaleString(locale)} FCFA`}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{c.usedCount} / {c.maxUses}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{c.expiresAt ? formatDate(c.expiresAt) : '∞'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(c)} className="transition-colors">
                      {c.active
                        ? <ToggleRight className="w-6 h-6 text-success-500" />
                        : <ToggleLeft className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <h2 className="font-bold text-neutral-900 dark:text-white">{editing ? t('coupons.modal.editTitle') : t('coupons.modal.newTitle')}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('coupons.form.code')}</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder={t('coupons.form.codePlaceholder')}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('coupons.form.type')}</label>
                  <div className="relative">
                    <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Coupon['type'] }))} className={`${inputCls} appearance-none pr-8`}>
                      <option value="percentage">{t('coupons.form.typePercentage')}</option>
                      <option value="fixed">{t('coupons.form.typeFixed')}</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('coupons.form.value', { unit: form.type === 'percentage' ? '%' : 'FCFA' })}</label>
                  <input type="number" min={0} value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: Number(e.target.value) }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('coupons.form.maxUses')}</label>
                  <input type="number" min={1} value={form.maxUses} onChange={(e) => setForm((p) => ({ ...p, maxUses: Number(e.target.value) }))} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('coupons.form.expiration')}</label>
                  <input type="date" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{t('coupons.form.activeLabel')}</p>
                  <p className="text-xs text-neutral-400">{t('coupons.form.activeHint')}</p>
                </div>
                <button onClick={() => setForm((p) => ({ ...p, active: !p.active }))} className="transition-colors">
                  {form.active
                    ? <ToggleRight className="w-7 h-7 text-success-500" />
                    : <ToggleLeft className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />}
                </button>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{t('coupons.actions.cancel')}</Button>
              <Button onClick={handleSave} disabled={saving || !form.code.trim()} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {saving ? t('coupons.actions.saving') : t('coupons.actions.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('coupons.confirmTitle')} message={confirm.message} confirmLabel={t('coupons.actions.delete')} />
    </div>
  );
}
