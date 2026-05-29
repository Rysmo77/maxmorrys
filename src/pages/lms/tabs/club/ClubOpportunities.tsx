import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Plus, X, CircleNotch, Trash, PaperPlaneTilt } from '@phosphor-icons/react';
import { cn, formatDate } from '../../../../lib/utils';
import { getClubOpportunities, createClubOpportunity, deleteClubOpportunity } from '../../../../lib/firestore';
import type { ClubOpportunity } from '../../../../types';
import { staggerContainer, staggerItem } from '../../../../lib/animations';
import { ClubEmptyState } from './_shared';

type ClubData = ReturnType<typeof import('../../hooks/useClubData').useClubData>;

const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500';
const initialsOf = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

const TYPE_LABELS: Record<ClubOpportunity['type'], string> = {
  mission: 'Mission', emploi: 'Emploi', partenariat: 'Partenariat', autre: 'Autre',
};

export default function ClubOpportunities({ data }: { data: ClubData }) {
  const { user, displayName, photoURL, addToast } = data;
  const [items, setItems] = useState<ClubOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'mission' as ClubOpportunity['type'], budget: '', contact: '' });

  useEffect(() => {
    getClubOpportunities().then(setItems).then(() => setLoading(false)).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!user || !form.title.trim() || !form.description.trim() || !form.contact.trim()) return;
    setSubmitting(true);
    try {
      const id = await createClubOpportunity({
        userId: user.uid, userName: displayName, userPhoto: photoURL || undefined,
        title: form.title.trim(), description: form.description.trim(), type: form.type,
        budget: form.budget.trim() || undefined, contact: form.contact.trim(),
      });
      setItems((prev) => [{ id, userId: user.uid, userName: displayName, userPhoto: photoURL || undefined, title: form.title.trim(), description: form.description.trim(), type: form.type, budget: form.budget.trim() || undefined, contact: form.contact.trim(), createdAt: new Date().toISOString() }, ...prev]);
      setForm({ title: '', description: '', type: 'mission', budget: '', contact: '' });
      setShowForm(false);
      addToast('success', 'Opportunité publiée.');
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : 'Erreur lors de la publication.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ClubOpportunity) => {
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    try {
      await deleteClubOpportunity(item.id);
      addToast('success', 'Opportunité supprimée.');
    } catch {
      setItems((prev) => [item, ...prev]);
      addToast('error', 'Erreur lors de la suppression.');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><CircleNotch className="w-8 h-8 animate-spin text-plum-500" /></div>;

  return (
    <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="visible">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-plum-500" weight="duotone" />
          <h3 className="font-bold text-neutral-900 dark:text-white">Opportunités</h3>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-plum-600 hover:bg-plum-700 text-white text-xs font-semibold transition-colors">
          {showForm ? <X className="w-4 h-4" weight="bold" /> : <Plus className="w-4 h-4" weight="bold" />} {showForm ? 'Fermer' : 'Publier'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 space-y-3">
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Titre (ex : Recherche CM pour e-commerce)" className={inputCls} />
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Décris la mission/offre…" className={cn(inputCls, 'resize-y')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ClubOpportunity['type'] }))} className={inputCls}>
              <option value="mission">Mission</option>
              <option value="emploi">Emploi</option>
              <option value="partenariat">Partenariat</option>
              <option value="autre">Autre</option>
            </select>
            <input value={form.budget} onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))} placeholder="Budget (optionnel)" className={inputCls} />
          </div>
          <input value={form.contact} onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))} placeholder="Contact (email, WhatsApp, lien…)" className={inputCls} />
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={submitting || !form.title.trim() || !form.description.trim() || !form.contact.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-sm font-semibold disabled:opacity-50">
              {submitting ? <CircleNotch className="w-4 h-4 animate-spin" /> : <PaperPlaneTilt className="w-4 h-4" weight="fill" />} Publier
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <ClubEmptyState icon={Briefcase} title="Aucune opportunité" subtitle="Partage une mission, une offre d'emploi ou un partenariat avec la communauté." action={(
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" weight="bold" /> Publier une opportunité
          </button>
        )} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <motion.div key={item.id} variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-plum-100 dark:bg-plum-900/30 text-plum-700 dark:text-plum-300">{TYPE_LABELS[item.type]}</span>
                  {item.budget && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400">{item.budget}</span>}
                </div>
                {user?.uid === item.userId && (
                  <button onClick={() => handleDelete(item)} className="p-1 rounded-lg text-neutral-300 hover:text-error-500 transition-colors"><Trash className="w-4 h-4" weight="duotone" /></button>
                )}
              </div>
              <p className="font-bold text-neutral-900 dark:text-white mt-2">{item.title}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 whitespace-pre-wrap break-words">{item.description}</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center text-[10px] font-bold text-plum-600 dark:text-plum-400 flex-shrink-0 overflow-hidden">
                    {item.userPhoto ? <img src={item.userPhoto} alt="" className="w-full h-full object-cover" /> : initialsOf(item.userName)}
                  </span>
                  <span className="text-xs text-neutral-500 truncate">{item.userName} · {formatDate(item.createdAt)}</span>
                </div>
                <span className="text-xs font-semibold text-plum-600 dark:text-plum-400 truncate sm:max-w-[45%]">{item.contact}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
