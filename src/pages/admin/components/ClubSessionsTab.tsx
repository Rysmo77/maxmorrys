import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosSession, ClubSessionRegistration } from '../../../types';
import { Field, Icon } from '@ds';

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
  openSessionRegs: string | null;
  loadingRegs: string | null;
  handleLoadSessionRegs: (sessionId: string) => Promise<void>;
}

export default function ClubSessionsTab({
  sessions, showSessionForm, setShowSessionForm, editSession, sessionForm, setSessionForm,
  savingSession, uploadingSessionImage, sessionImagePreview, setSessionImagePreview,
  setSessionImageFile, sessionImageInputRef,
  openSessionForm, handleSessionImageSelect, handleSaveSession, handleDeleteSession,
  sessionRegs, openSessionRegs, loadingRegs, handleLoadSessionRegs,
}: ClubSessionsTabProps) {
  const { t } = useTranslation('adminClub');
  const { locale } = useFormat();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openSessionForm()} icon={<Icon name="plus" size={16} />}>{t('sessions.new')}</Button>
      </div>

      {showSessionForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink">{editSession ? t('sessions.editTitle') : t('sessions.newTitle')}</h3>
            <button onClick={() => setShowSessionForm(false)} className="p-1 rounded-lg text-ink-2 hover:text-ink-2 transition-colors"><Icon name="close" size={16} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field size="sm" label={t('sessions.titleLabel')} value={sessionForm.title} onChange={(v) => setSessionForm((p) => ({ ...p, title: v }))} placeholder={t('sessions.titlePlaceholder')} />
            </div>
            <div className="sm:col-span-2">
              <Field size="sm" label={t('sessions.descriptionLabel')} as="textarea" value={sessionForm.description} onChange={(v) => setSessionForm((p) => ({ ...p, description: v }))} rows={3} />
            </div>
            <Field size="sm" label={t('sessions.datetimeLabel')} type="datetime-local" value={sessionForm.scheduledAt} onChange={(v) => setSessionForm((p) => ({ ...p, scheduledAt: v }))} />
            <Field size="sm" label={t('sessions.durationLabel')} value={sessionForm.duration} onChange={(v) => setSessionForm((p) => ({ ...p, duration: v }))} placeholder={t('sessions.durationPlaceholder')} />
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
            {/* Un GROUPE, pas un champ : l'`<input type="file">` est masqué et déclenché par
                le bouton, l'aperçu et le retrait vivent à côté. Un `<label>` n'a donc aucun
                contrôle unique à cibler — c'est `role="group"` + `aria-labelledby` qui nomme
                l'ensemble, et le libellé reste un `<span>`. */}
            <div className="sm:col-span-2 space-y-2" role="group" aria-labelledby="session-image-label">
              <span id="session-image-label" className="block text-xs font-semibold text-ink-2">{t('sessions.imageLabel')}</span>
              <input type="file" accept="image/*" ref={sessionImageInputRef} onChange={handleSessionImageSelect} className="hidden" />
              {sessionImagePreview ? (
                <div className="relative w-full max-w-xs">
                  <img src={sessionImagePreview} alt="session preview" className="rounded-xl w-full object-cover max-h-48" />
                  <button type="button" onClick={() => { setSessionImageFile(null); setSessionImagePreview(''); setSessionForm((p) => ({ ...p, imageUrl: '' })); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"><Icon name="close" size={12} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => sessionImageInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[color:var(--line)] text-sm text-ink-2 hover:border-forme hover:text-forme transition-colors">
                  <Icon name="image" size={16} /> {t('sessions.importImage')}
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowSessionForm(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveSession} disabled={savingSession || uploadingSessionImage || !sessionForm.title.trim() || !sessionForm.scheduledAt} loading={savingSession || uploadingSessionImage} icon={<Icon name="save" size={16} />}>
              {uploadingSessionImage ? t('common.uploading') : savingSession ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </Card>
      )}

      {sessions.length === 0 && !showSessionForm ? (
        <Card><p className="text-center text-ink-2 py-8">{t('sessions.empty')}</p></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <Card key={session.id} hover padding="none">
              {session.imageUrl && <img src={session.imageUrl} alt={session.title} className="w-full h-40 object-cover rounded-t-2xl" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={session.status === 'upcoming' ? 'brand' : 'default'} size="sm">
                    {session.status === 'upcoming' ? t('sessions.badgeUpcoming') : t('sessions.badgePast')}
                  </Badge>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openSessionForm(session)} className="p-1.5 rounded-lg text-ink-2 hover:text-forme hover:bg-[color-mix(in_srgb,var(--mm-bleu)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--mm-bleu)_20%,transparent)] transition-colors"><Icon name="pencil" size={14} /></button>
                    <button onClick={() => handleDeleteSession(session.id)} className="p-1.5 rounded-lg text-ink-2 hover:text-stop hover:bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--stop)_20%,transparent)] transition-colors"><Icon name="trash" size={14} /></button>
                  </div>
                </div>
                <p className="font-bold text-ink mb-1">{session.title}</p>
                <p className="text-xs text-ink-2 mb-2 line-clamp-2">{session.description}</p>
                <div className="text-xs text-ink-2 space-y-0.5 mb-3">
                  <p>🕐 {new Date(session.scheduledAt).toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  {session.duration && <p>⏱ {session.duration}</p>}
                  {session.link && <a href={session.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-forme hover:underline"><Icon name="external" size={12} /> {t('sessions.connectionLink')}</a>}
                </div>
                {/* Le chargement des inscriptions porte `.mm-loading` — un liseré qui balaie le
                    bouton — au lieu d'échanger le glyphe contre un rond. Le libellé et le
                    compte RESTENT lisibles : c'est ce qu'on est venu chercher. */}
                <button
                  onClick={() => handleLoadSessionRegs(session.id)}
                  aria-busy={loadingRegs === session.id || undefined}
                  className={`flex items-center gap-1.5 text-xs text-forme hover:underline${loadingRegs === session.id ? ' mm-loading' : ''}`}
                >
                  <Icon name="users" size={12} />
                  {t('sessions.registrations')} {sessionRegs[session.id] ? `(${sessionRegs[session.id].length})` : ''}
                </button>
                {openSessionRegs === session.id && (
                  <div className="mt-2 space-y-1">
                    {(sessionRegs[session.id] ?? []).length === 0 ? (
                      <p className="text-xs text-ink-2">{t('sessions.noRegistrations')}</p>
                    ) : (
                      (sessionRegs[session.id] ?? []).map((r) => (
                        <div key={r.userId} className="flex items-center gap-2 text-xs text-ink-2 bg-[color:var(--fill-1)] dark:bg-[color-mix(in_srgb,var(--night-3)_50%,transparent)] rounded-lg px-2 py-1">
                          <Icon name="check-circle" size={12} className="text-ok flex-shrink-0" />
                          <span>{r.userName}</span>
                          {r.userEmail && <span className="text-ink-2">· {r.userEmail}</span>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
