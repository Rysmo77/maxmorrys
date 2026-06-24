import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Trash2, Eye, EyeOff, Pencil, Check, MapPin } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { getAllClubProfiles, adminUpdateClubProfile, deleteClubProfile } from '../../../lib/firestore';
import { captureError } from '../../../lib/sentry';
import { inputCls } from '../hooks/useAdminClub';
import type { ClubMemberProfile } from '../../../types';

const initialsOf = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

export default function ClubMembersAdminTab() {
  const { t } = useTranslation('adminClub');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [profiles, setProfiles] = useState<ClubMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ headline: '', skills: '', city: '' });
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); getAllClubProfiles().then((p) => { setProfiles(p); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggleVisible = async (p: ClubMemberProfile) => {
    setProfiles((prev) => prev.map((x) => x.id === p.id ? { ...x, visible: !x.visible } : x));
    try { await adminUpdateClubProfile(p.userId, { visible: !p.visible }); }
    catch { addToast('error', t('common.genericError')); load(); }
  };

  const openEdit = (p: ClubMemberProfile) => { setEditId(p.id); setForm({ headline: p.headline ?? '', skills: (p.skills ?? []).join(', '), city: p.city ?? '' }); };

  const saveEdit = async (p: ClubMemberProfile) => {
    setSaving(true);
    try {
      const skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
      await adminUpdateClubProfile(p.userId, { headline: form.headline.trim(), skills, city: form.city.trim() });
      setProfiles((prev) => prev.map((x) => x.id === p.id ? { ...x, headline: form.headline.trim(), skills, city: form.city.trim() } : x));
      setEditId(null);
      addToast('success', t('members.updated'));
    } catch (error: unknown) {
      captureError(error, { context: 'Admin update club profile failed' });
      addToast('error', t('members.updateError'));
    } finally { setSaving(false); }
  };

  const handleDelete = (p: ClubMemberProfile) => {
    confirm.requestConfirm(t('members.deleteConfirm', { name: p.displayName }), async () => {
      try {
        await deleteClubProfile(p.userId);
        setProfiles((prev) => prev.filter((x) => x.id !== p.id));
        addToast('success', t('members.deleted'));
      } catch { addToast('error', t('common.deleteError')); }
      confirm.closeConfirm();
    });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  if (profiles.length === 0) return <Card><p className="text-center text-neutral-400 py-8">{t('members.empty')}</p></Card>;

  return (
    <div className="space-y-3">
      {profiles.map((p) => (
        <Card key={p.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-plum-600 dark:text-plum-400">{initialsOf(p.displayName)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">{p.displayName}</p>
                  <Badge variant={p.visible ? 'default' : 'warning'} size="sm">{p.visible ? t('members.badgeVisible') : t('members.badgeHidden')}</Badge>
                  {p.available && <Badge variant="success" size="sm">{t('members.badgeAvailable')}</Badge>}
                </div>
                {editId === p.id ? (
                  <div className="space-y-2 mt-2">
                    <input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} placeholder={t('members.headlinePlaceholder')} className={inputCls} />
                    <input value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} placeholder={t('members.skillsPlaceholder')} className={inputCls} />
                    <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder={t('members.cityPlaceholder')} className={inputCls} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(p)} disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}>{t('members.save')}</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}>{t('members.cancel')}</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {p.headline && <p className="text-xs text-neutral-500">{p.headline}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {p.city && <span className="text-xs text-neutral-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}</span>}
                      {p.skills.slice(0, 4).map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-plum-50 dark:bg-plum-900/20 text-plum-700 dark:text-plum-300">{s}</span>)}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => toggleVisible(p)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label={t('members.visibilityAria')}>{p.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
              <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label={t('members.editAria')}><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors" aria-label={t('members.deleteAria')}><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </Card>
      ))}
      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('members.deleteTitle')} message={confirm.message} confirmLabel={t('members.confirmLabel')} />
    </div>
  );
}
