import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { getAllClubProfiles, adminUpdateClubProfile, deleteClubProfile } from '../../../lib/firestore';
import { captureError } from '../../../lib/sentry';
import type { ClubMemberProfile } from '../../../types';
import { Field, Icon } from '@ds';
import ConsoleListSkeleton from './ConsoleListSkeleton';

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

  if (loading) return <ConsoleListSkeleton />;
  if (profiles.length === 0) return <Card><p className="text-center text-ink-2 py-8">{t('members.empty')}</p></Card>;

  return (
    <div className="space-y-3">
      {profiles.map((p) => (
        <Card key={p.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[color-mix(in_srgb,var(--mm-violet)_5%,transparent)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-transforme">{initialsOf(p.displayName)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-semibold text-ink">{p.displayName}</p>
                  <Badge variant={p.visible ? 'default' : 'warning'} size="sm">{p.visible ? t('members.badgeVisible') : t('members.badgeHidden')}</Badge>
                  {p.available && <Badge variant="success" size="sm">{t('members.badgeAvailable')}</Badge>}
                </div>
                {editId === p.id ? (
                  <div className="space-y-2 mt-2">
                    {/* `hideLabel` et non « pas de libellé » : l'édition en ligne d'une fiche
                        membre est compacte, mais un champ dont le seul nom est son texte
                        indicatif PERD son nom dès qu'on commence à y écrire. Le libellé existe,
                        il est lié au contrôle, il n'est simplement pas peint. */}
                    <Field size="sm" hideLabel label={t('members.headlineLabel')} value={form.headline} onChange={(v) => setForm((f) => ({ ...f, headline: v }))} placeholder={t('members.headlinePlaceholder')} style={{ marginTop: 0 }} />
                    <Field size="sm" hideLabel label={t('members.skillsLabel')} value={form.skills} onChange={(v) => setForm((f) => ({ ...f, skills: v }))} placeholder={t('members.skillsPlaceholder')} style={{ marginTop: 0 }} />
                    <Field size="sm" hideLabel label={t('members.cityLabel')} value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} placeholder={t('members.cityPlaceholder')} style={{ marginTop: 0 }} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(p)} disabled={saving} loading={saving} icon={<Icon name="check" size={16} />}>{t('members.save')}</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}>{t('members.cancel')}</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {p.headline && <p className="text-xs text-ink-2">{p.headline}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {p.city && <span className="text-xs text-ink-2 flex items-center gap-1"><Icon name="pin" size={12} /> {p.city}</span>}
                      {p.skills.slice(0, 4).map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--mm-violet)_4%,transparent)] text-transforme">{s}</span>)}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => toggleVisible(p)} className="p-1.5 rounded-lg text-ink-2 hover:text-forme hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] transition-colors" aria-label={t('members.visibilityAria')}>{p.visible ? <Icon name="eye" size={16} /> : <Icon name="eye-off" size={16} />}</button>
              <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-ink-2 hover:text-forme hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] transition-colors" aria-label={t('members.editAria')}><Icon name="pencil" size={16} /></button>
              <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg text-ink-2 hover:text-stop hover:bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--stop)_20%,transparent)] transition-colors" aria-label={t('members.deleteAria')}><Icon name="trash" size={16} /></button>
            </div>
          </div>
        </Card>
      ))}
      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('members.deleteTitle')} message={confirm.message} confirmLabel={t('members.confirmLabel')} />
    </div>
  );
}
