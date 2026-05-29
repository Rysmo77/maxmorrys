import { useEffect, useState } from 'react';
import { Plus, X, Save, Pencil, Trash2, Loader2, Trophy } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { formatDate } from '../../../lib/utils';
import { inputCls } from '../hooks/useAdminClub';
import { getClubChallenges, saveClubChallenge, deleteClubChallenge } from '../../../lib/firestore';
import { captureError } from '../../../lib/sentry';
import type { ClubDigitosChallenge } from '../../../types';

const EMPTY: Omit<ClubDigitosChallenge, 'id'> = {
  title: '', description: '', reward: '', startsAt: '', endsAt: '', active: true,
};

export default function ClubChallengesTab() {
  const { addToast } = useToast();
  const [challenges, setChallenges] = useState<ClubDigitosChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClubDigitosChallenge | null>(null);
  const [form, setForm] = useState<Omit<ClubDigitosChallenge, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getClubChallenges().then((data) => { setChallenges(data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openForm = (c?: ClubDigitosChallenge) => {
    if (c) {
      setEditing(c);
      setForm({ title: c.title, description: c.description, reward: c.reward ?? '', startsAt: c.startsAt?.slice(0, 10) ?? '', endsAt: c.endsAt?.slice(0, 10) ?? '', active: c.active });
    } else {
      setEditing(null);
      setForm(EMPTY);
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      await saveClubChallenge({ ...form, id: editing?.id, createdAt: editing?.createdAt ?? new Date().toISOString() });
      addToast('success', editing ? 'Défi mis à jour.' : 'Défi créé.');
      setShowForm(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save club challenge failed' });
      addToast('error', error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClubChallenge(id);
      setChallenges((prev) => prev.filter((c) => c.id !== id));
      addToast('success', 'Défi supprimé.');
    } catch {
      addToast('error', 'Erreur de suppression.');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openForm()} icon={<Plus className="w-4 h-4" />}>Nouveau défi</Button>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-900 dark:text-white">{editing ? 'Modifier le défi' : 'Nouveau défi'}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Titre *</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ex : Partage ton win de la semaine" className={inputCls} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Consigne du défi..." className={`${inputCls} resize-y`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Récompense (optionnel)</label>
              <input value={form.reward ?? ''} onChange={(e) => setForm((p) => ({ ...p, reward: e.target.value }))} placeholder="Ex : badge Ambassadeur" className={inputCls} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="ch-active" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="rounded" />
              <label htmlFor="ch-active" className="text-sm text-neutral-700 dark:text-neutral-300">Défi actif</label>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Début</label>
              <input type="date" value={form.startsAt} onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Fin</label>
              <input type="date" value={form.endsAt} onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.description.trim()} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </Card>
      )}

      {challenges.length === 0 && !showForm ? (
        <Card><p className="text-center text-neutral-400 py-8">Aucun défi créé.</p></Card>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <Card key={c.id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Trophy className="w-4 h-4 text-plum-500" />
                    <Badge variant={c.active ? 'success' : 'default'} size="sm">{c.active ? 'Actif' : 'Inactif'}</Badge>
                    {c.startsAt && c.endsAt && <span className="text-xs text-neutral-400">{formatDate(c.startsAt)} → {formatDate(c.endsAt)}</span>}
                  </div>
                  <p className="font-bold text-neutral-900 dark:text-white mb-1">{c.title}</p>
                  <p className="text-sm text-neutral-500 line-clamp-2">{c.description}</p>
                  {c.reward && <p className="text-xs text-plum-600 dark:text-plum-400 mt-1 font-semibold">🏆 {c.reward}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openForm(c)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
