import { Plus, X, Save, Pencil, Trash2, Loader2, ExternalLink, Users, CheckCircle, Image as ImageIcon } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { inputCls } from '../hooks/useAdminClub';
import type { ClubDigitosSession, ClubSessionRegistration } from '../../../types';

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
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openSessionForm()} icon={<Plus className="w-4 h-4" />}>Nouvelle session</Button>
      </div>

      {showSessionForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-900 dark:text-white">{editSession ? 'Modifier la session' : 'Nouvelle session live'}</h3>
            <button onClick={() => setShowSessionForm(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Titre *</label>
              <input value={sessionForm.title} onChange={(e) => setSessionForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Session Q&A mensuelle" className={inputCls} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Description</label>
              <textarea value={sessionForm.description} onChange={(e) => setSessionForm((p) => ({ ...p, description: e.target.value }))} rows={3} className={`${inputCls} resize-y`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Date & Heure *</label>
              <input type="datetime-local" value={sessionForm.scheduledAt} onChange={(e) => setSessionForm((p) => ({ ...p, scheduledAt: e.target.value }))} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Durée prévue</label>
              <input value={sessionForm.duration} onChange={(e) => setSessionForm((p) => ({ ...p, duration: e.target.value }))} placeholder="Ex: 1h30" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Statut</label>
              <select value={sessionForm.status} onChange={(e) => setSessionForm((p) => ({ ...p, status: e.target.value as 'upcoming' | 'past' }))} className={inputCls}>
                <option value="upcoming">À venir</option>
                <option value="past">Passée</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Lien de connexion</label>
              <input type="url" value={sessionForm.link} onChange={(e) => setSessionForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://meet.google.com/..." className={inputCls} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-neutral-500">Image / Créa de la session Live</label>
              <input type="file" accept="image/*" ref={sessionImageInputRef} onChange={handleSessionImageSelect} className="hidden" />
              {sessionImagePreview ? (
                <div className="relative w-full max-w-xs">
                  <img src={sessionImagePreview} alt="session preview" className="rounded-xl w-full object-cover max-h-48" />
                  <button type="button" onClick={() => { setSessionImageFile(null); setSessionImagePreview(''); setSessionForm((p) => ({ ...p, imageUrl: '' })); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => sessionImageInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 text-sm text-neutral-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                  <ImageIcon className="w-4 h-4" /> Importer une créa / affiche Live
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowSessionForm(false)}>Annuler</Button>
            <Button onClick={handleSaveSession} disabled={savingSession || uploadingSessionImage || !sessionForm.title.trim() || !sessionForm.scheduledAt} icon={(savingSession || uploadingSessionImage) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
              {uploadingSessionImage ? 'Upload...' : savingSession ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </Card>
      )}

      {sessions.length === 0 && !showSessionForm ? (
        <Card><p className="text-center text-neutral-400 py-8">Aucune session live créée.</p></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <Card key={session.id} hover padding="none">
              {session.imageUrl && <img src={session.imageUrl} alt={session.title} className="w-full h-40 object-cover rounded-t-2xl" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={session.status === 'upcoming' ? 'brand' : 'default'} size="sm">
                    {session.status === 'upcoming' ? 'Prochaine' : 'Passée'}
                  </Badge>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openSessionForm(session)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteSession(session.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="font-bold text-neutral-900 dark:text-white mb-1">{session.title}</p>
                <p className="text-xs text-neutral-500 mb-2 line-clamp-2">{session.description}</p>
                <div className="text-xs text-neutral-400 space-y-0.5 mb-3">
                  <p>🕐 {new Date(session.scheduledAt).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  {session.duration && <p>⏱ {session.duration}</p>}
                  {session.link && <a href={session.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-500 hover:underline"><ExternalLink className="w-3 h-3" /> Lien de connexion</a>}
                </div>
                <button
                  onClick={() => handleLoadSessionRegs(session.id)}
                  className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {loadingRegs === session.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                  Inscriptions {sessionRegs[session.id] ? `(${sessionRegs[session.id].length})` : ''}
                </button>
                {openSessionRegs === session.id && (
                  <div className="mt-2 space-y-1">
                    {(sessionRegs[session.id] ?? []).length === 0 ? (
                      <p className="text-xs text-neutral-400">Aucune inscription.</p>
                    ) : (
                      (sessionRegs[session.id] ?? []).map((r) => (
                        <div key={r.userId} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg px-2 py-1">
                          <CheckCircle className="w-3 h-3 text-success-500 flex-shrink-0" />
                          <span>{r.userName}</span>
                          {r.userEmail && <span className="text-neutral-400">· {r.userEmail}</span>}
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
