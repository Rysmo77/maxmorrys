import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Icon, Num, SearchPill, Skeleton, Tag } from '@ds';
import { useFormat } from '../../../hooks/useFormat';
import { openRysmo } from '../../../lib/rysmo/conversation';
import type { Note } from '../../../lib/firestore';
import { CardEmpty, EduCard, EduHead, EduPage } from '../../../components/edu/g4/EduParts';

interface NotesTabProps {
  notes: Note[];
  filteredNotes: Note[];
  loadingNotes: boolean;
  showNoteForm: boolean;
  editingNote: Note | null;
  noteForm: { title: string; content: string };
  savingNote: boolean;
  noteSearch: string;
  setNoteSearch: (v: string) => void;
  setNoteForm: React.Dispatch<React.SetStateAction<{ title: string; content: string }>>;
  openNewNote: () => void;
  openEditNote: (note: Note) => void;
  setShowNoteForm: (v: boolean) => void;
  onSaveNote: () => Promise<{ success: boolean; edited: boolean } | undefined>;
  onDeleteNote: (noteId: string) => Promise<boolean | undefined>;
  addToast: (type: 'success' | 'error', message: string) => void;
}

/**
 * MES NOTES — maquette `Edu-Notes` (+ `-mobile`), passe 2 lot B.
 *
 * Trois colonnes au bureau : la liste (recherche + compte), la note ouverte (ou le
 * formulaire, à la même place), et le panneau « Cette note ». Sous 1080 px, les colonnes
 * s'empilent : liste, note, panneau.
 *
 * Écarts assumés à la maquette, faute de producteur : pas d'onglets par thème (une note
 * ne porte pas de thème en base), pas d'horodatage vidéo, ni « Partager au Club », ni
 * « Exporter » — des boutons qui ne feraient rien. « Demander à Rysmo IA de relire » est
 * réel : il ouvre l'assistant avec la note en question.
 */
export default function NotesTab({
  notes,
  filteredNotes,
  loadingNotes,
  showNoteForm,
  editingNote,
  noteForm,
  savingNote,
  noteSearch,
  setNoteSearch,
  setNoteForm,
  openNewNote,
  openEditNote,
  setShowNoteForm,
  onSaveNote,
  onDeleteNote,
  addToast,
}: NotesTabProps) {
  const { t } = useTranslation('lmsTabs');
  const { formatDate } = useFormat();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const asOf = new Date();

  const selected = filteredNotes.find((n) => n.id === selectedId) ?? filteredNotes[0] ?? null;

  const handleSave = async () => {
    const result = await onSaveNote();
    if (result?.success) {
      addToast('success', result.edited ? t('notes.toastUpdated') : t('notes.toastCreated'));
    } else if (result && !result.success) {
      addToast('error', t('notes.toastSaveError'));
    }
  };

  const handleDelete = async (noteId: string) => {
    const success = await onDeleteNote(noteId);
    if (success) {
      addToast('success', t('notes.toastDeleted'));
      setSelectedId(null);
    } else if (success === false) addToast('error', t('notes.toastDeleteError'));
  };

  const askRysmo = (note: Note) => {
    openRysmo(t('notes.askRysmoPrompt', { title: note.title, content: note.content.slice(0, 1200) }));
  };

  /* ── Colonne 1 : la liste ─────────────────────────────────────────────── */
  const list = (
    <section className="mm-card" style={{ padding: 14 }}>
      <SearchPill
        label={t('notes.searchLabel')}
        labelHidden
        placeholder={t('notes.searchPlaceholder')}
        value={noteSearch}
        onChange={setNoteSearch}
        height={44}
        icon={<Icon name="search" size={16} strokeWidth={2.4} />}
      />
      <div className="mm-tabs mb-[10px] mt-[10px] flex" role="group" aria-label={t('notes.searchLabel')}>
        <button type="button" aria-pressed="true" style={{ flex: 1 }}>
          {t('notes.allTab')} · <Num value={loadingNotes ? null : notes.length} source="db" asOf={asOf} />
        </button>
      </div>
      {loadingNotes ? (
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} height={58} radius="var(--r-m)" label={t('notes.loadingLabel')} />)}
        </div>
      ) : filteredNotes.length === 0 ? (
        <p className="m-0 px-2 py-3 text-[13px] text-ink-2">{noteSearch ? t('notes.noMatch') : t('notes.emptyTitle')}</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {filteredNotes.map((note) => {
            const on = !showNoteForm && selected?.id === note.id;
            return (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => { setSelectedId(note.id); setShowNoteForm(false); }}
                  aria-current={on ? 'true' : undefined}
                  className="block w-full rounded-m border-0 p-[14px] text-left text-ink"
                  style={{ background: on ? 'var(--mm-bleu-c)' : 'transparent', cursor: 'pointer' }}
                >
                  <b className="block text-[14.5px]">{note.title}</b>
                  <span className="text-[12.5px] text-ink-2">{formatDate(note.updatedAt)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  /* ── Colonne 2 : la note ouverte, ou le formulaire ────────────────────── */
  const center = showNoteForm ? (
    <section className="mm-card" style={{ padding: 30 }}>
      <h2 className="mm-d mb-4 text-[28px] stack:text-[36px]">{editingNote ? t('notes.editTitle') : t('notes.newTitle')}</h2>
      <Field
        label={t('notes.titleLabel')}
        value={noteForm.title}
        onChange={(v) => setNoteForm((p) => ({ ...p, title: v }))}
        placeholder={t('notes.titlePlaceholder')}
        maxLength={200}
        style={{ marginTop: 0 }}
      />
      <Field
        as="textarea"
        label={t('notes.contentLabel')}
        value={noteForm.content}
        onChange={(v) => setNoteForm((p) => ({ ...p, content: v }))}
        placeholder={t('notes.contentPlaceholder')}
        rows={12}
      />
      <div className="mt-[17px] flex gap-2">
        <Button tone="quiet" fullWidth={false} onClick={() => setShowNoteForm(false)}>{t('notes.cancel')}</Button>
        <Button
          tone="forme"
          fullWidth={false}
          onClick={() => void handleSave()}
          disabled={savingNote || !noteForm.title.trim()}
          loading={savingNote}
        >
          {savingNote ? t('notes.saving') : t('notes.save')}
        </Button>
      </div>
    </section>
  ) : selected ? (
    <article className="mm-card wide:min-h-[620px]" style={{ padding: 30 }}>
      <div className="mb-[18px] flex flex-wrap items-center gap-2">
        <Tag>{t('notes.privateTag')}</Tag>
        <span className="ml-auto text-[12px] text-ink-3">
          {t('notes.savedLabel')} · {formatDate(selected.updatedAt)}
        </span>
      </div>
      <h2 className="mm-d mb-4 text-[28px] stack:text-[36px]">{selected.title}</h2>
      <div className="whitespace-pre-wrap text-[16px] leading-[1.7]" style={{ maxWidth: '62ch' }}>{selected.content}</div>
    </article>
  ) : (
    <section className="mm-card wide:min-h-[620px]" style={{ padding: 30 }}>
      <CardEmpty
        icon="comment"
        title={t('notes.emptyTitle')}
        body={t('notes.emptyText')}
        action={<Button tone="forme" size="sm" fullWidth={false} onClick={openNewNote}>{t('notes.createFirst')}</Button>}
      />
    </section>
  );

  /* ── Colonne 3 : cette note ───────────────────────────────────────────── */
  const aside = (
    <>
      {selected && !showNoteForm && (
        <EduCard title={t('notes.thisNote')}>
          <div className="flex flex-col gap-2">
            <button type="button" className="mm-btn is-sm" style={{ background: 'var(--mm-violet-f)', color: 'var(--paper-fixed)' }} onClick={() => askRysmo(selected)}>
              {t('notes.askRysmo')}
            </button>
            <button type="button" className="mm-btn is-sm is-quiet" onClick={() => openEditNote(selected)}>
              <Icon name="pencil" size={15} /> {t('notes.edit')}
            </button>
            <button type="button" className="mm-btn is-sm is-quiet" style={{ color: 'var(--stop)' }} onClick={() => void handleDelete(selected.id)}>
              <Icon name="trash" size={15} /> {t('notes.delete')}
            </button>
          </div>
        </EduCard>
      )}
      <EduCard style={{ background: 'var(--paper-2)' }}>
        <h3 style={{ fontSize: 16 }}>{t('notes.truthTitle')}</h3>
        <p className="m-0 mt-2 text-[13.5px] text-ink-2">{t('notes.truthBody')}</p>
      </EduCard>
    </>
  );

  return (
    <EduPage>
      <EduHead
        eyebrow={t('notes.eyebrow')}
        title={t('notes.screenTitle')}
        aside={
          <button type="button" className="mm-pill is-sm" onClick={openNewNote}>
            {t('notes.newNote')}
            <i><Icon name="plus" size={15} /></i>
          </button>
        }
      />
      <div className="grid grid-cols-1 items-start gap-5 wide:[grid-template-columns:300px_minmax(0,1fr)_300px]">
        {list}
        {center}
        <div className="flex flex-col gap-5">{aside}</div>
      </div>
    </EduPage>
  );
}
