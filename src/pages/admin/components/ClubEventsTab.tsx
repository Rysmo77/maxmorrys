import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, EmptyState, Field, Icon, LessonRow, Num, Tag } from '@ds';
import { ConsoleFilter, ConsoleList, ConsoleScope } from '../../../components/console';
import ConsoleSheet from './ConsoleSheet';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosEvent, ClubEventRegistration } from '../../../types';

/**
 * ── ÉVÉNEMENTS — motif de console ───────────────────────────────────────────────────
 *
 * ZONE 1 · LA FILE VIENT DU KIT, MOT POUR MOT : `Événements : tout · à venir · passés`
 * (`PipelinesRestants`). `status: 'upcoming' | 'past'` existait déjà en base et pilotait
 * déjà l'affichage public ; il n'était simplement pas filtrable ici. Sur une grille de
 * cartes à deux colonnes, un événement d'il y a huit mois occupait la même place qu'un
 * événement de samedi.
 *
 * ZONE 2 · TROIS ACTIONS PAR LIGNE DEVIENNENT UNE. Le crayon, la poubelle et « voir les
 * inscriptions » vivaient tous les trois sur la carte, les deux premiers en `<button>` nus
 * de quatorze pixels et sans libellé accessible. La ligne ouvre maintenant sa fiche ; la
 * fiche porte le formulaire, la liste des inscrits et la suppression.
 *
 * LES DEUX ÉMOJIS SONT PARTIS. La date et le lieu étaient introduits par 📅 et 📍 — « aucun
 * emoji, nulle part », et le système livre un jeu de glyphes à trait pour exactement cet
 * usage. Ici, ils ne sont même plus nécessaires : `DocLine` nomme ses champs.
 *
 * LE COMPTE D'INSCRITS PASSE PAR `<Num>`, avec SA PROPRE date de relevé — les inscriptions
 * se chargent à la demande, longtemps après la page, et les dater du chargement de l'écran
 * serait faux.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
type Stage = 'all' | ClubDigitosEvent['status'];

const STAGES: Stage[] = ['all', 'upcoming', 'past'];

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
  /** Date de relevé PROPRE à chaque liste d'inscriptions — voir `useAdminClub`. */
  eventRegsAt: Record<string, Date>;
  openEventRegs: string | null;
  loadingRegs: string | null;
  handleLoadEventRegs: (eventId: string) => Promise<void>;
}

export default function ClubEventsTab({
  events, showEventForm, setShowEventForm, editEvent, eventForm, setEventForm,
  savingEvent, uploadingEventImage, eventImagePreview, setEventImagePreview,
  setEventImageFile, eventImageInputRef,
  openEventForm, handleEventImageSelect, handleSaveEvent, handleDeleteEvent,
  eventRegs, eventRegsAt, openEventRegs, loadingRegs, handleLoadEventRegs,
}: ClubEventsTabProps) {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  const [stage, setStage] = useState<Stage>('all');

  const bar = useMemo(() => STAGES.map((s) => {
    const label = t(`events.stages.${s}`);
    const n = s === 'all' ? events.length : events.filter((e) => e.status === s).length;
    return { key: s, text: `${label} ${n}` };
  }), [events, t]);

  const filtered = useMemo(
    () => events.filter((e) => stage === 'all' || e.status === stage),
    [events, stage],
  );

  const regs = editEvent ? (eventRegs[editEvent.id] ?? null) : null;
  const regsAt = editEvent ? eventRegsAt[editEvent.id] : undefined;

  return (
    <div>
      <ConsoleFilter
        stages={bar.map((s) => s.text)}
        active={bar.find((s) => s.key === stage)?.text}
        onSelect={(text) => {
          const hit = bar.find((s) => s.text === text);
          if (hit) setStage(hit.key);
        }}
        label={t('events.pipelineLabel')}
      />

      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={() => openEventForm()}>
          <Icon name="plus" size={15} /> {t('events.new')}
        </Button>
      </div>

      <div className="mt-3">
        {filtered.length === 0 ? (
          <EmptyState
            glyph={<Icon name="calendar" size={26} color="var(--mm-bleu)" />}
            glyphBackground="color-mix(in srgb, var(--mm-bleu) 20%, transparent)"
            title={t('events.empty')}
            body={t('events.emptyBody')}
            action={<Button size="sm" onClick={() => openEventForm()}>{t('events.new')}</Button>}
          />
        ) : (
          <ConsoleList label={t('events.listLabel')}>
            {filtered.map((event, i) => (
              <li key={event.id}>
                <LessonRow
                  onClick={() => openEventForm(event)}
                  icon={<Icon name="calendar" size={14} color={`var(${event.status === 'upcoming' ? '--ok' : '--ink-2'})`} />}
                  iconBackground={`color-mix(in srgb, var(${event.status === 'upcoming' ? '--ok' : '--ink-2'}) 20%, transparent)`}
                  title={event.title}
                  meta={[
                    event.type === 'online' ? t('events.typeOnline') : t('events.typePhysical'),
                    event.time ? `${formatDate(event.date)} · ${event.time}` : formatDate(event.date),
                    event.location || null,
                  ].filter(Boolean).join(' · ')}
                  trailing={(
                    <Tag tone={event.status === 'upcoming' ? 'ok' : 'neutral'}>
                      {event.status === 'upcoming' ? t('events.statusUpcoming') : t('events.statusPast')}
                    </Tag>
                  )}
                  last={i === filtered.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}
      </div>

      <ConsoleScope title={t('common.sectionScopeTitle')}>{t('events.scope')}</ConsoleScope>

      <ConsoleSheet
        open={showEventForm}
        onClose={() => setShowEventForm(false)}
        closeLabel={t('common.close')}
        eyebrow={t('page.tabs.events')}
        title={editEvent ? t('events.editTitle') : t('events.newTitle')}
        footer={(
          <>
            {editEvent && (
              <Button size="sm" tone="quiet" onClick={() => { void handleDeleteEvent(editEvent.id).then(() => setShowEventForm(false)); }} style={{ marginRight: 'auto' }}>
                {t('events.delete')}
              </Button>
            )}
            <Button size="sm" tone="quiet" onClick={() => setShowEventForm(false)}>{t('common.cancel')}</Button>
            <Button
              size="sm"
              onClick={() => { void handleSaveEvent(); }}
              loading={savingEvent || uploadingEventImage}
              disabled={!eventForm.title.trim() || !eventForm.date}
            >
              {uploadingEventImage ? t('common.uploading') : savingEvent ? t('common.saving') : t('common.save')}
            </Button>
          </>
        )}
      >
        <Field size="sm" label={t('events.titleLabel')} value={eventForm.title} onChange={(v) => setEventForm((p) => ({ ...p, title: v }))} placeholder={t('events.titlePlaceholder')} />
        <Field size="sm" as="textarea" rows={3} label={t('events.descriptionLabel')} value={eventForm.description} onChange={(v) => setEventForm((p) => ({ ...p, description: v }))} />
        <div className="grid grid-cols-2 gap-4">
          <Field size="sm" label={t('events.dateLabel')} type="date" value={eventForm.date} onChange={(v) => setEventForm((p) => ({ ...p, date: v }))} />
          <Field size="sm" label={t('events.timeLabel')} type="time" value={eventForm.time} onChange={(v) => setEventForm((p) => ({ ...p, time: v }))} />
        </div>
        <Field size="sm" label={t('events.locationLabel')} value={eventForm.location} onChange={(v) => setEventForm((p) => ({ ...p, location: v }))} placeholder={t('events.locationPlaceholder')} />
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <Field size="sm" label={t('events.linkLabel')} type="url" value={eventForm.link} onChange={(v) => setEventForm((p) => ({ ...p, link: v }))} placeholder="https://..." />

        {/* Un GROUPE, pas un champ : l'`<input type="file">` est masqué et déclenché par
            le bouton, l'aperçu et le retrait vivent à côté. Un `<label>` n'a donc aucun
            contrôle unique à cibler — c'est `role="group"` + `aria-labelledby` qui nomme
            l'ensemble, et le libellé reste un `<span>`. */}
        <div className="space-y-2" role="group" aria-labelledby="event-image-label">
          <span id="event-image-label" className="block text-meta-2 font-semibold text-ink-2">{t('events.imageLabel')}</span>
          <input type="file" accept="image/*" ref={eventImageInputRef} onChange={handleEventImageSelect} className="hidden" />
          {eventImagePreview ? (
            <div className="w-full max-w-xs">
              <img src={eventImagePreview} alt="" className="max-h-48 w-full rounded-m object-cover" />
              <div className="mt-2">
                <Button
                  size="sm"
                  tone="quiet"
                  onClick={() => { setEventImageFile(null); setEventImagePreview(''); setEventForm((p) => ({ ...p, imageUrl: '' })); }}
                >
                  {t('events.removeImage')}
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" tone="quiet" onClick={() => eventImageInputRef.current?.click()}>
              <Icon name="image" size={15} /> {t('events.importImage')}
            </Button>
          )}
        </div>

        {editEvent && (
          <div>
            <DocLine
              label={t('events.registrations')}
              value={(
                /* Un zéro DATÉ est une valeur ; un compte jamais relevé n'en est pas une —
                   `<Num>` rend alors « non relevé », jamais un zéro fabriqué. */
                <Num
                  value={regs ? regs.length : null}
                  source="db"
                  asOf={regsAt ?? new Date()}
                  fallback={t('events.regsNotLoaded')}
                />
              )}
              last
            />
            <div className="mt-2">
              <Button
                size="sm"
                tone="quiet"
                onClick={() => { void handleLoadEventRegs(editEvent.id); }}
                loading={loadingRegs === editEvent.id}
              >
                <Icon name="users" size={15} />
                {openEventRegs === editEvent.id ? t('events.hideRegistrations') : t('events.showRegistrations')}
              </Button>
            </div>
            {openEventRegs === editEvent.id && (
              <ul className="m-0 mt-3 list-none space-y-1 p-0" aria-label={t('events.registrations')}>
                {(regs ?? []).length === 0 ? (
                  <li className="text-meta-2 text-ink-2">{t('events.noRegistrations')}</li>
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
