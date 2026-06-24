import { useTranslation } from 'react-i18next';
import { Plus, X, Save, Pencil, Trash2, Loader2, ExternalLink, Users, CheckCircle, Image as ImageIcon } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { inputCls } from '../hooks/useAdminClub';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosEvent, ClubEventRegistration } from '../../../types';

interface ClubEventsTabProps {
  events: ClubDigitosEvent[];
  showEventForm: boolean;
  setShowEventForm: React.Dispatch<React.SetStateAction<boolean>>;
  editEvent: ClubDigitosEvent | null;
  eventForm: Omit<ClubDigitosEvent, 'id' | 'createdAt'>;
  setEventForm: React.Dispatch<React.SetStateAction<Omit<ClubDigitosEvent, 'id' | 'createdAt'>>>;
  savingEvent: boolean;
  uploadingEventImage: boolean;
  eventImagePreview: string;
  setEventImagePreview: React.Dispatch<React.SetStateAction<string>>;
  setEventImageFile: React.Dispatch<React.SetStateAction<File | null>>;
  eventImageInputRef: React.RefObject<HTMLInputElement>;
  openEventForm: (event?: ClubDigitosEvent) => void;
  handleEventImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveEvent: () => Promise<void>;
  handleDeleteEvent: (id: string) => Promise<void>;
  eventRegs: Record<string, ClubEventRegistration[]>;
  openEventRegs: string | null;
  loadingRegs: string | null;
  handleLoadEventRegs: (eventId: string) => Promise<void>;
}

export default function ClubEventsTab({
  events, showEventForm, setShowEventForm, editEvent, eventForm, setEventForm,
  savingEvent, uploadingEventImage, eventImagePreview, setEventImagePreview,
  setEventImageFile, eventImageInputRef,
  openEventForm, handleEventImageSelect, handleSaveEvent, handleDeleteEvent,
  eventRegs, openEventRegs, loadingRegs, handleLoadEventRegs,
}: ClubEventsTabProps) {
  const { t } = useTranslation('adminClub');
  const { locale } = useFormat();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openEventForm()} icon={<Plus className="w-4 h-4" />}>{t('events.new')}</Button>
      </div>

      {showEventForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-900 dark:text-white">{editEvent ? t('events.editTitle') : t('events.newTitle')}</h3>
            <button onClick={() => setShowEventForm(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-500">{t('events.titleLabel')}</label>
              <input value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} placeholder={t('events.titlePlaceholder')} className={inputCls} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-neutral-500">{t('events.descriptionLabel')}</label>
              <textarea value={eventForm.description} onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))} rows={3} className={`${inputCls} resize-y`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">{t('events.dateLabel')}</label>
              <input type="date" value={eventForm.date} onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">{t('events.timeLabel')}</label>
              <input type="time" value={eventForm.time} onChange={(e) => setEventForm((p) => ({ ...p, time: e.target.value }))} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">{t('events.locationLabel')}</label>
              <input value={eventForm.location} onChange={(e) => setEventForm((p) => ({ ...p, location: e.target.value }))} placeholder={t('events.locationPlaceholder')} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">{t('events.typeLabel')}</label>
              <select value={eventForm.type} onChange={(e) => setEventForm((p) => ({ ...p, type: e.target.value as 'online' | 'physical' }))} className={inputCls}>
                <option value="online">{t('events.typeOnline')}</option>
                <option value="physical">{t('events.typePhysical')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">{t('events.statusLabel')}</label>
              <select value={eventForm.status} onChange={(e) => setEventForm((p) => ({ ...p, status: e.target.value as 'upcoming' | 'past' }))} className={inputCls}>
                <option value="upcoming">{t('events.statusUpcoming')}</option>
                <option value="past">{t('events.statusPast')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">{t('events.linkLabel')}</label>
              <input type="url" value={eventForm.link} onChange={(e) => setEventForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." className={inputCls} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-neutral-500">{t('events.imageLabel')}</label>
              <input type="file" accept="image/*" ref={eventImageInputRef} onChange={handleEventImageSelect} className="hidden" />
              {eventImagePreview ? (
                <div className="relative w-full max-w-xs">
                  <img src={eventImagePreview} alt="flyer preview" className="rounded-xl w-full object-cover max-h-48" />
                  <button type="button" onClick={() => { setEventImageFile(null); setEventImagePreview(''); setEventForm((p) => ({ ...p, imageUrl: '' })); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => eventImageInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 text-sm text-neutral-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                  <ImageIcon className="w-4 h-4" /> {t('events.importImage')}
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowEventForm(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveEvent} disabled={savingEvent || uploadingEventImage || !eventForm.title.trim() || !eventForm.date} icon={(savingEvent || uploadingEventImage) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
              {uploadingEventImage ? t('common.uploading') : savingEvent ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </Card>
      )}

      {events.length === 0 && !showEventForm ? (
        <Card><p className="text-center text-neutral-400 py-8">{t('events.empty')}</p></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {events.map((event) => (
            <Card key={event.id} hover padding="none">
              {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover rounded-t-2xl" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={event.status === 'upcoming' ? 'success' : 'default'} size="sm">
                      {event.status === 'upcoming' ? t('events.statusUpcoming') : t('events.statusPast')}
                    </Badge>
                    <Badge variant={event.type === 'online' ? 'brand' : 'warning'} size="sm">
                      {event.type === 'online' ? t('events.typeOnline') : t('events.typePhysical')}
                    </Badge>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEventForm(event)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="font-bold text-neutral-900 dark:text-white mb-1">{event.title}</p>
                <p className="text-xs text-neutral-500 mb-2 line-clamp-2">{event.description}</p>
                <div className="text-xs text-neutral-400 space-y-0.5 mb-3">
                  <p>📅 {new Date(event.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}{event.time && ` à ${event.time}`}</p>
                  <p>📍 {event.location}</p>
                  {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-500 hover:underline"><ExternalLink className="w-3 h-3" /> {t('events.link')}</a>}
                </div>
                <button
                  onClick={() => handleLoadEventRegs(event.id)}
                  className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {loadingRegs === event.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                  {t('events.registrations')} {eventRegs[event.id] ? `(${eventRegs[event.id].length})` : ''}
                </button>
                {openEventRegs === event.id && (
                  <div className="mt-2 space-y-1">
                    {(eventRegs[event.id] ?? []).length === 0 ? (
                      <p className="text-xs text-neutral-400">{t('events.noRegistrations')}</p>
                    ) : (
                      (eventRegs[event.id] ?? []).map((r) => (
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
