import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, EmptyState, Field, Icon, LessonRow, Num, Tag } from '@ds';
import { ConsoleFilter, ConsoleList, ConsoleScope } from '../../../components/console';
import ConsoleSheet from './ConsoleSheet';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosSession, ClubSessionRegistration } from '../../../types';

/**
 * ── SESSIONS LIVE — motif de console ────────────────────────────────────────────────
 *
 * ZONE 1 · `PipelinesRestants` ne dessine pas les sessions, mais elles portent EXACTEMENT
 * le même champ que les événements — `status: 'upcoming' | 'past'` — et le même usage : ce
 * qui attend d'un côté, ce qui est derrière de l'autre. La file du kit pour les événements
 * s'applique telle quelle ; l'inventer aurait été le contraire de ce qu'on fait ici.
 *
 * ZONE 2 · Trois actions par ligne — crayon, poubelle, « inscriptions » — deviennent une
 * ligne qui ouvre sa fiche. Les trois y sont, nommées.
 *
 * LES DEUX ÉMOJIS SONT PARTIS (🕐 et ⏱). L'horaire et la durée sont maintenant des `DocLine`
 * nommées dans la fiche et de la méta sur la ligne : ils n'ont plus besoin d'un pictogramme
 * pour dire ce qu'ils sont.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
type Stage = 'all' | ClubDigitosSession['status'];

const STAGES: Stage[] = ['all', 'upcoming', 'past'];

interface ClubSessionsTabProps {
  sessions: ClubDigitosSession[];
  showSessionForm: boolean;
  setShowSessionForm: React.Dispatch<React.SetStateAction<boolean>>;
  editSession: ClubDigitosSession | null;
  sessionForm: Omit<ClubDigitosSession, 'id' | 'createdAt'>;
  setSessionForm: React.Dispatch<React.SetStateAction<Omit<ClubDigitosSession, 'id' | 'createdAt'>>>;
  savingSession: boolean;
  uploadingSessionImage: boolean;
  sessionImagePreview: string;
  setSessionImagePreview: React.Dispatch<React.SetStateAction<string>>;
  setSessionImageFile: React.Dispatch<React.SetStateAction<File | null>>;
  sessionImageInputRef: React.RefObject<HTMLInputElement>;
  openSessionForm: (session?: ClubDigitosSession) => void;
  handleSessionImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveSession: () => Promise<void>;
  handleDeleteSession: (id: string) => Promise<void>;
  sessionRegs: Record<string, ClubSessionRegistration[]>;
  /** Date de relevé PROPRE à chaque liste d'inscriptions — voir `useAdminClub`. */
  sessionRegsAt: Record<string, Date>;
  openSessionRegs: string | null;
  loadingRegs: string | null;
  handleLoadSessionRegs: (sessionId: string) => Promise<void>;
}

export default function ClubSessionsTab({
  sessions, showSessionForm, setShowSessionForm, editSession, sessionForm, setSessionForm,
  savingSession, uploadingSessionImage, sessionImagePreview, setSessionImagePreview,
  setSessionImageFile, sessionImageInputRef,
  openSessionForm, handleSessionImageSelect, handleSaveSession, handleDeleteSession,
  sessionRegs, sessionRegsAt, openSessionRegs, loadingRegs, handleLoadSessionRegs,
}: ClubSessionsTabProps) {
  const { t } = useTranslation('adminClub');
  const { locale } = useFormat();
  const [stage, setStage] = useState<Stage>('all');

  const when = (iso: string) => new Date(iso).toLocaleString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const bar = useMemo(() => STAGES.map((s) => {
    const label = t(`sessions.stages.${s}`);
    const n = s === 'all' ? sessions.length : sessions.filter((x) => x.status === s).length;
    return { key: s, text: `${label} ${n}` };
  }), [sessions, t]);

  const filtered = useMemo(
    () => sessions.filter((s) => stage === 'all' || s.status === stage),
    [sessions, stage],
  );

  const regs = editSession ? (sessionRegs[editSession.id] ?? null) : null;
  const regsAt = editSession ? sessionRegsAt[editSession.id] : undefined;

  return (
    <div>
      <ConsoleFilter
        stages={bar.map((s) => s.text)}
        active={bar.find((s) => s.key === stage)?.text}
        onSelect={(text) => {
          const hit = bar.find((s) => s.text === text);
          if (hit) setStage(hit.key);
        }}
        label={t('sessions.pipelineLabel')}
      />

      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={() => openSessionForm()}>
          <Icon name="plus" size={15} /> {t('sessions.new')}
        </Button>
      </div>

      <div className="mt-3">
        {filtered.length === 0 ? (
          <EmptyState
            glyph={<Icon name="video" size={26} color="var(--mm-violet)" />}
            glyphBackground="color-mix(in srgb, var(--mm-violet) 20%, transparent)"
            title={t('sessions.empty')}
            body={t('sessions.emptyBody')}
            action={<Button size="sm" onClick={() => openSessionForm()}>{t('sessions.new')}</Button>}
          />
        ) : (
          <ConsoleList label={t('sessions.listLabel')}>
            {filtered.map((session, i) => (
              <li key={session.id}>
                <LessonRow
                  onClick={() => openSessionForm(session)}
                  icon={<Icon name="video" size={14} color={`var(${session.status === 'upcoming' ? '--ok' : '--ink-2'})`} />}
                  iconBackground={`color-mix(in srgb, var(${session.status === 'upcoming' ? '--ok' : '--ink-2'}) 20%, transparent)`}
                  title={session.title}
                  meta={[when(session.scheduledAt), session.duration || null].filter(Boolean).join(' · ')}
                  trailing={(
                    <Tag tone={session.status === 'upcoming' ? 'ok' : 'neutral'}>
                      {session.status === 'upcoming' ? t('sessions.badgeUpcoming') : t('sessions.badgePast')}
                    </Tag>
                  )}
                  last={i === filtered.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}
      </div>

      <ConsoleScope title={t('common.sectionScopeTitle')}>{t('sessions.scope')}</ConsoleScope>

      <ConsoleSheet
        open={showSessionForm}
        onClose={() => setShowSessionForm(false)}
        closeLabel={t('common.close')}
        eyebrow={t('page.tabs.sessions')}
        title={editSession ? t('sessions.editTitle') : t('sessions.newTitle')}
        footer={(
          <>
            {editSession && (
              <Button size="sm" tone="quiet" onClick={() => { void handleDeleteSession(editSession.id).then(() => setShowSessionForm(false)); }} style={{ marginRight: 'auto' }}>
                {t('sessions.delete')}
              </Button>
            )}
            <Button size="sm" tone="quiet" onClick={() => setShowSessionForm(false)}>{t('common.cancel')}</Button>
            <Button
              size="sm"
              onClick={() => { void handleSaveSession(); }}
              loading={savingSession || uploadingSessionImage}
              disabled={!sessionForm.title.trim() || !sessionForm.scheduledAt}
            >
              {uploadingSessionImage ? t('common.uploading') : savingSession ? t('common.saving') : t('common.save')}
            </Button>
          </>
        )}
      >
        <Field size="sm" label={t('sessions.titleLabel')} value={sessionForm.title} onChange={(v) => setSessionForm((p) => ({ ...p, title: v }))} placeholder={t('sessions.titlePlaceholder')} />
        <Field size="sm" as="textarea" rows={3} label={t('sessions.descriptionLabel')} value={sessionForm.description} onChange={(v) => setSessionForm((p) => ({ ...p, description: v }))} />
        <div className="grid grid-cols-2 gap-4">
          <Field size="sm" label={t('sessions.datetimeLabel')} type="datetime-local" value={sessionForm.scheduledAt} onChange={(v) => setSessionForm((p) => ({ ...p, scheduledAt: v }))} />
          <Field size="sm" label={t('sessions.durationLabel')} value={sessionForm.duration} onChange={(v) => setSessionForm((p) => ({ ...p, duration: v }))} placeholder={t('sessions.durationPlaceholder')} />
        </div>
        <Field
          size="sm"
          as="select"
          label={t('sessions.statusLabel')}
          value={sessionForm.status}
          onChange={(v) => setSessionForm((p) => ({ ...p, status: v as 'upcoming' | 'past' }))}
          options={[
            { value: 'upcoming', label: t('sessions.statusUpcoming') },
            { value: 'past', label: t('sessions.statusPast') },
          ]}
        />
        <Field size="sm" label={t('sessions.linkLabel')} type="url" value={sessionForm.link} onChange={(v) => setSessionForm((p) => ({ ...p, link: v }))} placeholder="https://meet.google.com/..." />

        {/* Un GROUPE, pas un champ — même raison que sur les événements : l'`<input
            type="file">` est masqué, aucun `<label>` n'a de contrôle unique à cibler. */}
        <div className="space-y-2" role="group" aria-labelledby="session-image-label">
          <span id="session-image-label" className="block text-meta-2 font-semibold text-ink-2">{t('sessions.imageLabel')}</span>
          <input type="file" accept="image/*" ref={sessionImageInputRef} onChange={handleSessionImageSelect} className="hidden" />
          {sessionImagePreview ? (
            <div className="w-full max-w-xs">
              <img src={sessionImagePreview} alt="" className="max-h-48 w-full rounded-m object-cover" />
              <div className="mt-2">
                <Button
                  size="sm"
                  tone="quiet"
                  onClick={() => { setSessionImageFile(null); setSessionImagePreview(''); setSessionForm((p) => ({ ...p, imageUrl: '' })); }}
                >
                  {t('sessions.removeImage')}
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" tone="quiet" onClick={() => sessionImageInputRef.current?.click()}>
              <Icon name="image" size={15} /> {t('sessions.importImage')}
            </Button>
          )}
        </div>

        {editSession && (
          <div>
            <DocLine label={t('sessions.datetimeLabel')} value={when(editSession.scheduledAt)} />
            <DocLine
              label={t('sessions.registrations')}
              value={(
                <Num
                  value={regs ? regs.length : null}
                  source="db"
                  asOf={regsAt ?? new Date()}
                  fallback={t('sessions.regsNotLoaded')}
                />
              )}
              last
            />
            <div className="mt-2">
              <Button
                size="sm"
                tone="quiet"
                onClick={() => { void handleLoadSessionRegs(editSession.id); }}
                loading={loadingRegs === editSession.id}
              >
                <Icon name="users" size={15} />
                {openSessionRegs === editSession.id ? t('sessions.hideRegistrations') : t('sessions.showRegistrations')}
              </Button>
            </div>
            {openSessionRegs === editSession.id && (
              <ul className="m-0 mt-3 list-none space-y-1 p-0" aria-label={t('sessions.registrations')}>
                {(regs ?? []).length === 0 ? (
                  <li className="text-meta-2 text-ink-2">{t('sessions.noRegistrations')}</li>
                ) : (
                  (regs ?? []).map((r) => (
                    <li key={r.userId} className="flex items-center gap-2 rounded-m bg-[color:var(--fill-1)] px-2 py-1 text-meta-2 text-ink-2">
                      <Icon name="check-circle" size={12} className="shrink-0 text-ok" />
                      <span>{r.userName}</span>
                      {r.userEmail && <span>· {r.userEmail}</span>}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        )}
      </ConsoleSheet>
    </div>
  );
}
