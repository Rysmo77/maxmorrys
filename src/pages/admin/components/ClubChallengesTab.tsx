import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Field, Icon, LessonRow, Switch, Tag, useToast } from '@ds';
import { ConsoleFilter, ConsoleList, ConsoleScope } from '../../../components/console';
import ConsoleSheet from './ConsoleSheet';
import { useFormat } from '../../../hooks/useFormat';
import { getClubChallenges, saveClubChallenge, deleteClubChallenge } from '../../../lib/firestore';
import { captureError } from '../../../lib/sentry';
import type { ClubDigitosChallenge } from '../../../types';
import ConsoleListSkeleton from './ConsoleListSkeleton';

/**
 * ── DÉFIS — le seul des neuf onglets dont le kit dicte la file ──────────────────────
 *
 * `PipelinesRestants` l'écrit en toutes lettres : `Défis : tout · en cours · clos`. Elle
 * n'existait pas. `active` est pourtant un booléen écrit en base et lu par l'écran public du
 * Club : un défi « inactif » n'y apparaît plus. Autrement dit, l'état qui décide de ce que
 * voient les membres n'était pas filtrable par celui qui le règle.
 *
 * « CLOS » ET NON « INACTIF ». Le mot vient du kit, et il est plus juste : un défi a un début
 * et une fin, il se termine, il ne se « désactive » pas. Le libellé de l'interrupteur, lui,
 * reste « défi en cours » — c'est ce qu'on règle, pas ce qu'on lit.
 *
 * ZONE 2 · Deux `<button>` nus par ligne — modifier, supprimer — deviennent une ligne qui
 * ouvre sa fiche. Le formulaire ET la suppression y vivent, avec la consigne du défi et sa
 * récompense sous les yeux.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
const EMPTY: Omit<ClubDigitosChallenge, 'id'> = {
  title: '', description: '', reward: '', startsAt: '', endsAt: '', active: true,
};

type Stage = 'all' | 'open' | 'closed';

const STAGES: Stage[] = ['all', 'open', 'closed'];

export default function ClubChallengesTab() {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  const { addToast } = useToast();
  const [challenges, setChallenges] = useState<ClubDigitosChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>('all');
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
      setShowForm(false);
      addToast('success', t('challenges.deleted'));
    } catch {
      addToast('error', t('common.deleteError'));
    }
  };

  const bar = useMemo(() => STAGES.map((s) => {
    const label = t(`challenges.stages.${s}`);
    const n = s === 'all' ? challenges.length : challenges.filter((c) => (s === 'open' ? c.active : !c.active)).length;
    return { key: s, text: `${label} ${n}` };
  }), [challenges, t]);

  const filtered = useMemo(
    () => challenges.filter((c) => stage === 'all' || (stage === 'open' ? c.active : !c.active)),
    [challenges, stage],
  );

  if (loading) return <ConsoleListSkeleton label={t('challenges.listLabel')} />;

  return (
    <div>
      <ConsoleFilter
        stages={bar.map((s) => s.text)}
        active={bar.find((s) => s.key === stage)?.text}
        onSelect={(text) => {
          const hit = bar.find((s) => s.text === text);
          if (hit) setStage(hit.key);
        }}
        label={t('challenges.pipelineLabel')}
      />

      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={() => openForm()}>
          <Icon name="plus" size={15} /> {t('challenges.new')}
        </Button>
      </div>

      <div className="mt-3">
        {filtered.length === 0 ? (
          <EmptyState
            glyph={<Icon name="trophy" size={26} color="var(--mm-violet)" />}
            glyphBackground="color-mix(in srgb, var(--mm-violet) 20%, transparent)"
            title={t('challenges.empty')}
            body={t('challenges.emptyBody')}
            action={<Button size="sm" onClick={() => openForm()}>{t('challenges.new')}</Button>}
          />
        ) : (
          <ConsoleList label={t('challenges.listLabel')}>
            {filtered.map((c, i) => (
              <li key={c.id}>
                <LessonRow
                  onClick={() => openForm(c)}
                  icon={<Icon name="trophy" size={14} color={`var(${c.active ? '--ok' : '--ink-2'})`} />}
                  iconBackground={`color-mix(in srgb, var(${c.active ? '--ok' : '--ink-2'}) 20%, transparent)`}
                  title={c.title}
                  meta={[
                    c.startsAt && c.endsAt ? `${formatDate(c.startsAt)} → ${formatDate(c.endsAt)}` : null,
                    c.reward || null,
                  ].filter(Boolean).join(' · ')}
                  trailing={(
                    <Tag tone={c.active ? 'ok' : 'neutral'}>
                      {t(`challenges.stages.${c.active ? 'open' : 'closed'}`)}
                    </Tag>
                  )}
                  last={i === filtered.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}
      </div>

      <ConsoleScope title={t('common.sectionScopeTitle')}>{t('challenges.scope')}</ConsoleScope>

      <ConsoleSheet
        open={showForm}
        onClose={() => setShowForm(false)}
        closeLabel={t('common.close')}
        eyebrow={t('page.tabs.challenges')}
        title={editing ? t('challenges.editTitle') : t('challenges.newTitle')}
        footer={(
          <>
            {editing && (
              <Button size="sm" tone="quiet" onClick={() => { void handleDelete(editing.id); }} style={{ marginRight: 'auto' }}>
                {t('challenges.delete')}
              </Button>
            )}
            <Button size="sm" tone="quiet" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            <Button
              size="sm"
              onClick={() => { void handleSave(); }}
              loading={saving}
              disabled={!form.title.trim() || !form.description.trim()}
            >
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </>
        )}
      >
        <Field size="sm" label={t('challenges.titleLabel')} value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} placeholder={t('challenges.titlePlaceholder')} />
        <Field size="sm" as="textarea" rows={3} label={t('challenges.descriptionLabel')} value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} placeholder={t('challenges.descriptionPlaceholder')} />
        <Field size="sm" label={t('challenges.rewardLabel')} value={form.reward ?? ''} onChange={(v) => setForm((p) => ({ ...p, reward: v }))} placeholder={t('challenges.rewardPlaceholder')} />
        <div className="grid grid-cols-2 gap-4">
          <Field size="sm" label={t('challenges.startLabel')} type="date" value={form.startsAt} onChange={(v) => setForm((p) => ({ ...p, startsAt: v }))} />
          <Field size="sm" label={t('challenges.endLabel')} type="date" value={form.endsAt} onChange={(v) => setForm((p) => ({ ...p, endsAt: v }))} />
        </div>
        {/* La case à cocher nue et son `<label htmlFor>` deviennent l'interrupteur du système :
            même contrat d'accessibilité, mais l'état se lit à distance et la cible fait 44 px. */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="m-0 text-meta font-semibold text-ink">{t('challenges.activeLabel')}</p>
            <p className="m-0 mt-1 text-meta-2 text-ink-2">{t('challenges.activeHint')}</p>
          </div>
          <Switch on={form.active} label={t('challenges.activeLabel')} onChange={(on) => setForm((p) => ({ ...p, active: on }))} />
        </div>
      </ConsoleSheet>
    </div>
  );
}
