import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { useFormat } from '../../../hooks/useFormat';
import { getClubChallenges, saveClubChallenge, deleteClubChallenge } from '../../../lib/firestore';
import { captureError } from '../../../lib/sentry';
import type { ClubDigitosChallenge } from '../../../types';
import { Field, Icon } from '@ds';
import ConsoleListSkeleton from './ConsoleListSkeleton';

const EMPTY: Omit<ClubDigitosChallenge, 'id'> = {
  title: '', description: '', reward: '', startsAt: '', endsAt: '', active: true,
};

export default function ClubChallengesTab() {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
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
      addToast('success', editing ? t('challenges.updated') : t('challenges.created'));
      setShowForm(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save club challenge failed' });
      addToast('error', error instanceof Error ? error.message : t('challenges.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClubChallenge(id);
      setChallenges((prev) => prev.filter((c) => c.id !== id));
      addToast('success', t('challenges.deleted'));
    } catch {
      addToast('error', t('common.deleteError'));
    }
  };

  if (loading) return <ConsoleListSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openForm()} icon={<Icon name="plus" size={16} />}>{t('challenges.new')}</Button>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink">{editing ? t('challenges.editTitle') : t('challenges.newTitle')}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg text-ink-2 hover:text-ink-2 transition-colors"><Icon name="close" size={16} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field size="sm" label={t('challenges.titleLabel')} value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} placeholder={t('challenges.titlePlaceholder')} />
            </div>
            <div className="sm:col-span-2">
              <Field size="sm" label={t('challenges.descriptionLabel')} as="textarea" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} rows={3} placeholder={t('challenges.descriptionPlaceholder')} />
            </div>
            <Field size="sm" label={t('challenges.rewardLabel')} value={form.reward ?? ''} onChange={(v) => setForm((p) => ({ ...p, reward: v }))} placeholder={t('challenges.rewardPlaceholder')} />
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="ch-active" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="rounded" />
              <label htmlFor="ch-active" className="text-sm text-ink-2">{t('challenges.activeLabel')}</label>
            </div>
            <Field size="sm" label={t('challenges.startLabel')} type="date" value={form.startsAt} onChange={(v) => setForm((p) => ({ ...p, startsAt: v }))} />
            <Field size="sm" label={t('challenges.endLabel')} type="date" value={form.endsAt} onChange={(v) => setForm((p) => ({ ...p, endsAt: v }))} />
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.description.trim()} loading={saving} icon={<Icon name="save" size={16} />}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </Card>
      )}

      {challenges.length === 0 && !showForm ? (
        <Card><p className="text-center text-ink-2 py-8">{t('challenges.empty')}</p></Card>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <Card key={c.id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Icon name="trophy" size={16} className="text-transforme" />
                    <Badge variant={c.active ? 'success' : 'default'} size="sm">{c.active ? t('challenges.badgeActive') : t('challenges.badgeInactive')}</Badge>
                    {c.startsAt && c.endsAt && <span className="text-xs text-ink-2">{formatDate(c.startsAt)} → {formatDate(c.endsAt)}</span>}
                  </div>
                  <p className="font-bold text-ink mb-1">{c.title}</p>
                  <p className="text-sm text-ink-2 line-clamp-2">{c.description}</p>
                  {c.reward && <p className="text-xs text-transforme mt-1 font-semibold">🏆 {c.reward}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openForm(c)} className="p-1.5 rounded-lg text-ink-2 hover:text-forme hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] transition-colors"><Icon name="pencil" size={16} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-ink-2 hover:text-stop hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] transition-colors"><Icon name="trash" size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
