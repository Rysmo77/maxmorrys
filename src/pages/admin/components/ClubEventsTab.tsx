import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosEvent, ClubEventRegistration } from '../../../types';
import { Field, Icon } from '@ds';

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
        <Button size="sm" onClick={() => openEventForm()} icon={<Icon name="plus" size={16} />}>{t('events.new')}</Button>
      </div>

      {showEventForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink">{editEvent ? t('events.editTitle') : t('events.newTitle')}</h3>
            <button onClick={() => setShowEventForm(false)} className="p-1 rounded-lg text-ink-2 hover:text-ink-2 transition-colors"><Icon name="close" size={16} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field size="sm" label={t('events.titleLabel')} value={eventForm.title} onChange={(v) => setEventForm((p) => ({ ...p, title: v }))} placeholder={t('events.titlePlaceholder')} />
            </div>
            <div className="sm:col-span-2">
              <Field size="sm" label={t('events.descriptionLabel')} as="textarea" value={eventForm.description} onChange={(v) => setEventForm((p) => ({ ...p, description: v }))} rows={3} />
            </div>
            <Field size="sm" label={t('events.dateLabel')} type="date" value={eventForm.date} onChange={(v) => setEventForm((p) => ({ ...p, date: v }))} />
            <Field size="sm" label={t('events.timeLabel')} type="time" value={eventForm.time} onChange={(v) => setEventForm((p) => ({ ...p, time: v }))} />
            <Field size="sm" label={t('events.locationLabel')} value={eventForm.location} onChange={(v) => setEventForm((p) => ({ ...p, location: v }))} placeholder={t('events.locationPlaceholder')} />
            <Field
              size="sm"
              as="select"
              label={t('events.typeLabel')}
              value={eventForm.type}
              onChange={(v) => setEventForm((p) => ({ ...p, type: v as 'online' | 'physical' }))}
              options={[
                { value: 'online', label: t('events.typeOnline') },
                { value: 'physical', label: t('events.typePhysical') },
              ]}
            />
            <Field
              size="sm"
              as="select"
              label={t('events.statusLabel')}
              value={eventForm.status}
              onChange={(v) => setEventForm((p) => ({ ...p, status: v as 'upcoming' | 'past' }))}
              options={[
                { value: 'upcoming', label: t('events.statusUpcoming') },
                { value: 'past', label: t('events.statusPast') },
              ]}
            />
            <Field size="sm" label={t('events.linkLabel')} type="url" value={eventForm.link} onChange={(v) => setEventForm((p) => ({ ...p, link: v }))} placeholder="https://..." />
            {/* Un GROUPE, pas un champ : l'`<input type="file">` est masqué et déclenché par
                le bouton, l'aperçu et le retrait vivent à côté. Un `<label>` n'a donc aucun
                contrôle unique à cibler — c'est `role="group"` + `aria-labelledby` qui nomme
                l'ensemble, et le libellé reste un `<span>`. */}
            <div className="sm:col-span-2 space-y-2" role="group" aria-labelledby="event-image-label">
              <span id="event-image-label" className="block text-xs font-semibold text-ink-2">{t('events.imageLabel')}</span>
              <input type="file" accept="image/*" ref={eventImageInputRef} onChange={handleEventImageSelect} className="hidden" />
              {eventImagePreview ? (
                <div className="relative w-full max-w-xs">
                  <img src={eventImagePreview} alt="flyer preview" className="rounded-xl w-full object-cover max-h-48" />
                  <button type="button" onClick={() => { setEventImageFile(null); setEventImagePreview(''); setEventForm((p) => ({ ...p, imageUrl: '' })); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"><Icon name="close" size={12} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => eventImageInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[color:var(--line)] text-sm text-ink-2 hover:border-forme hover:text-forme transition-colors">
                  <Icon name="image" size={16} /> {t('events.importImage')}
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowEventForm(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveEvent} disabled={savingEvent || uploadingEventImage || !eventForm.title.trim() || !eventForm.date} loading={savingEvent || uploadingEventImage} icon={<Icon name="save" size={16} />}>
              {uploadingEventImage ? t('common.uploading') : savingEvent ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </Card>
      )}

      {events.length === 0 && !showEventForm ? (
        <Card><p className="text-center text-ink-2 py-8">{t('events.empty')}</p></Card>
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
                    <button onClick={() => openEventForm(event)} className="p-1.5 rounded-lg text-ink-2 hover:text-forme hover:bg-[color-mix(in_srgb,var(--mm-bleu)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--mm-bleu)_20%,transparent)] transition-colors"><Icon name="pencil" size={14} /></button>
                    <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 rounded-lg text-ink-2 hover:text-stop hover:bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--stop)_20%,transparent)] transition-colors"><Icon name="trash" size={14} /></button>
                  </div>
                </div>
                <p className="font-bold text-ink mb-1">{event.title}</p>
                <p className="text-xs text-ink-2 mb-2 line-clamp-2">{event.description}</p>
                <div className="text-xs text-ink-2 space-y-0.5 mb-3">
                  <p>📅 {new Date(event.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}{event.time && ` à ${event.time}`}</p>
                  <p>📍 {event.location}</p>
                  {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-forme hover:underline"><Icon name="external" size={12} /> {t('events.link')}</a>}
                </div>
                {/* Le chargement des inscriptions porte `.mm-loading` — un liseré qui balaie le
                    bouton — au lieu d'échanger le glyphe contre un rond. Le libellé et le
                    compte RESTENT lisibles : c'est ce qu'on est venu chercher. */}
                <button
                  onClick={() => handleLoadEventRegs(event.id)}
                  aria-busy={loadingRegs === event.id || undefined}
                  className={`flex items-center gap-1.5 text-xs text-forme hover:underline${loadingRegs === event.id ? ' mm-loading' : ''}`}
                >
                  <Icon name="users" size={12} />
                  {t('events.registrations')} {eventRegs[event.id] ? `(${eventRegs[event.id].length})` : ''}
                </button>
                {openEventRegs === event.id && (
                  <div className="mt-2 space-y-1">
                    {(eventRegs[event.id] ?? []).length === 0 ? (
                      <p className="text-xs text-ink-2">{t('events.noRegistrations')}</p>
                    ) : (
                      (eventRegs[event.id] ?? []).map((r) => (
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
