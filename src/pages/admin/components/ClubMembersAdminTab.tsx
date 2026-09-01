import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, DocLine, EmptyState, Field, Icon, LessonRow, Switch, Tag } from '@ds';
import { ConsoleFilter, ConsoleList, ConsoleScope } from '../../../components/console';
import ConsoleSheet from './ConsoleSheet';
import { useToast } from '../../../components/ui/Toast';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { getAllClubProfiles, adminUpdateClubProfile, deleteClubProfile } from '../../../lib/firestore';
import { captureError } from '../../../lib/sentry';
import type { ClubMemberProfile } from '../../../types';
import ConsoleListSkeleton from './ConsoleListSkeleton';

/**
 * ── PROFILS MEMBRES — motif de console ──────────────────────────────────────────────
 *
 * TROIS `<button>` NUS PAR LIGNE, dont deux sans libellé lisible et un destructeur : c'est
 * ce que rendait cet écran. Les `aria-label` existaient, donc un lecteur d'écran s'en
 * sortait ; l'œil, lui, avait un œil barré, un crayon et une poubelle de seize pixels, à
 * quatre pixels d'écart. Supprimer un profil et masquer un profil ne se rattrapent pas de
 * la même façon : l'un se rallume d'un clic, l'autre efface une fiche écrite par quelqu'un.
 *
 * ZONE 1 · `visible` est un état réel, écrit en base, et c'est celui qui compte : un profil
 * masqué n'apparaît pas dans l'annuaire du Club. La file l'expose ; elle ne l'inventait pas.
 * `available` (« ouvert aux missions ») reste en méta : c'est une disponibilité déclarée par
 * le membre, pas une file d'attente pour l'opérateur.
 *
 * ZONE 2 · La ligne ouvre la fiche. Visibilité, édition et suppression y vivent ensemble,
 * avec le titre, la ville et les compétences sous les yeux.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
const initialsOf = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

type Stage = 'all' | 'visible' | 'hidden';

const STAGES: Stage[] = ['all', 'visible', 'hidden'];

export default function ClubMembersAdminTab() {
  const { t } = useTranslation('adminClub');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [profiles, setProfiles] = useState<ClubMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ headline: '', skills: '', city: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAllClubProfiles().then((p) => { setProfiles(p); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openSheet = (p: ClubMemberProfile) => {
    setOpenId(p.id);
    setForm({ headline: p.headline ?? '', skills: (p.skills ?? []).join(', '), city: p.city ?? '' });
  };

  const toggleVisible = async (p: ClubMemberProfile) => {
    setProfiles((prev) => prev.map((x) => x.id === p.id ? { ...x, visible: !x.visible } : x));
    try { await adminUpdateClubProfile(p.userId, { visible: !p.visible }); }
    catch { addToast('error', t('common.genericError')); load(); }
  };

  const saveEdit = async (p: ClubMemberProfile) => {
    setSaving(true);
    try {
      const skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
      await adminUpdateClubProfile(p.userId, { headline: form.headline.trim(), skills, city: form.city.trim() });
      setProfiles((prev) => prev.map((x) => x.id === p.id ? { ...x, headline: form.headline.trim(), skills, city: form.city.trim() } : x));
      setOpenId(null);
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
        setOpenId(null);
        addToast('success', t('members.deleted'));
      } catch { addToast('error', t('common.deleteError')); }
      confirm.closeConfirm();
    });
  };

  const bar = useMemo(() => STAGES.map((s) => {
    const label = t(`members.stages.${s}`);
    const n = s === 'all' ? profiles.length : profiles.filter((p) => (s === 'visible' ? p.visible : !p.visible)).length;
    return { key: s, text: `${label} ${n}` };
  }), [profiles, t]);

  const filtered = useMemo(
    () => profiles.filter((p) => stage === 'all' || (stage === 'visible' ? p.visible : !p.visible)),
    [profiles, stage],
  );

  const sheet = profiles.find((p) => p.id === openId) ?? null;

  if (loading) return <ConsoleListSkeleton label={t('members.listLabel')} />;

  return (
    <div>
      <ConsoleFilter
        stages={bar.map((s) => s.text)}
        active={bar.find((s) => s.key === stage)?.text}
        onSelect={(text) => {
          const hit = bar.find((s) => s.text === text);
          if (hit) setStage(hit.key);
        }}
        label={t('members.pipelineLabel')}
      />

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            glyph={<Icon name="users" size={26} color="var(--mm-violet)" />}
            glyphBackground="color-mix(in srgb, var(--mm-violet) 20%, transparent)"
            title={t('members.empty')}
            body={t('members.emptyBody')}
          />
        ) : (
          <ConsoleList label={t('members.listLabel')}>
            {filtered.map((p, i) => (
              <li key={p.id}>
                <LessonRow
                  onClick={() => openSheet(p)}
                  icon={p.photoURL
                    ? <img src={p.photoURL} alt="" className="h-[30px] w-[30px] rounded-full object-cover" />
                    : <Avatar initials={initialsOf(p.displayName)} size={30} />}
                  iconBackground="transparent"
                  title={p.displayName}
                  meta={[
                    p.visible ? t('members.badgeVisible') : t('members.badgeHidden'),
                    p.available ? t('members.badgeAvailable') : null,
                    p.city || null,
                    p.headline || null,
                  ].filter(Boolean).join(' · ')}
                  trailing={(
                    <Tag tone={p.visible ? 'ok' : 'warn'}>
                      {p.visible ? t('members.badgeVisible') : t('members.badgeHidden')}
                    </Tag>
                  )}
                  last={i === filtered.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}
      </div>

      <ConsoleScope title={t('common.sectionScopeTitle')}>{t('members.scope')}</ConsoleScope>

      <ConsoleSheet
        open={Boolean(sheet)}
        onClose={() => setOpenId(null)}
        closeLabel={t('common.close')}
        eyebrow={sheet ? (sheet.visible ? t('members.badgeVisible') : t('members.badgeHidden')) : undefined}
        title={sheet?.displayName ?? ''}
        footer={sheet && (
          <>
            <Button size="sm" tone="quiet" onClick={() => handleDelete(sheet)} style={{ marginRight: 'auto' }}>
              {t('members.delete')}
            </Button>
            <Button size="sm" tone="quiet" onClick={() => setOpenId(null)}>{t('members.cancel')}</Button>
            <Button size="sm" onClick={() => { void saveEdit(sheet); }} loading={saving}>{t('members.save')}</Button>
          </>
        )}
      >
        {sheet && (
          <div className="space-y-4">
            {/* La visibilité est un ÉTAT, pas une action : elle se règle par un interrupteur
                nommé, jamais par un œil barré de seize pixels posé à côté d'une poubelle. */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="m-0 text-meta font-semibold text-ink">{t('members.visibilityLabel')}</p>
                <p className="m-0 mt-1 text-meta-2 text-ink-2">{t('members.visibilityHint')}</p>
              </div>
              <Switch
                on={sheet.visible}
                label={t('members.visibilityLabel')}
                onChange={() => { void toggleVisible(sheet); }}
              />
            </div>

            <div>
              <DocLine
                label={t('members.availableLabel')}
                value={sheet.available ? t('members.badgeAvailable') : t('members.notAvailable')}
              />
              <DocLine label={t('members.skillsLabel')} value={sheet.skills.join(', ') || t('members.noSkills')} last />
            </div>

            <Field
              size="sm"
              label={t('members.headlineLabel')}
              value={form.headline}
              onChange={(v) => setForm((f) => ({ ...f, headline: v }))}
              placeholder={t('members.headlinePlaceholder')}
            />
            <Field
              size="sm"
              label={t('members.skillsLabel')}
              value={form.skills}
              onChange={(v) => setForm((f) => ({ ...f, skills: v }))}
              placeholder={t('members.skillsPlaceholder')}
            />
            <Field
              size="sm"
              label={t('members.cityLabel')}
              value={form.city}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              placeholder={t('members.cityPlaceholder')}
            />
          </div>
        )}
      </ConsoleSheet>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('members.deleteTitle')}
        message={confirm.message}
        confirmLabel={t('members.confirmLabel')}
      />
    </div>
  );
}
