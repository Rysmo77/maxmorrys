import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Field, GlassPanel, Icon, IconButton, LessonRow, Num, SearchPill, Skeleton, Tag } from '@ds';
import { useFormat } from '../../../hooks/useFormat';
import type { Note } from '../../../lib/firestore';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN « MES NOTES » — le cinquième des écrans qui portent la barre d'onglets.
 *
 * Recomposé sur `ui_kits/plateforme/ScreensNotes.js` § MesNotes : un compte en tête, une
 * étiquette qui dit qui les lit, la liste en lignes, et l'encart de vérité en pied.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A DISPARU, ET POURQUOI
 *
 * · « LA PRISE DE NOTES AUGMENTE LA RÉTENTION DE 40 % ». Un chiffre d'étude que le produit ne
 *   mesure pas, ne cite pas, et ne peut pas prouver. Il est remplacé par ce que les notes
 *   font réellement ici : elles survivent au cours et suivent d'un appareil à l'autre.
 *
 * · LES DEUX COMMANDES AU SURVOL. Modifier et supprimer n'apparaissaient qu'au survol
 *   (`opacity-0 group-hover:opacity-100`) : sur un écran tactile, où il n'y a pas de survol,
 *   les deux commandes étaient invisibles et atteintes par accident. Elles sont désormais
 *   posées en permanence, à la taille de cible exigée.
 *
 * POURQUOI LA LIGNE N'EST PAS CLIQUABLE. Le contrat de <LessonRow> demande de ne pas mettre
 * de contrôle dans son `trailing` ; le kit en met un lui-même sur l'écran de mémoire. Il est
 * tranché ici par le HTML : une ligne cliquable est un `<button>`, et un bouton de
 * suppression à l'intérieur d'un bouton est invalide. La ligne reste donc inerte, et porte
 * ses deux commandes nommées.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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

  /* La date du relevé : l'instant de la lecture qui a produit cette liste. */
  const asOf = new Date();

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
    if (success) addToast('success', t('notes.toastDeleted'));
    else if (success === false) addToast('error', t('notes.toastDeleteError'));
  };

  /* ── Le formulaire prend tout l'écran : écrire une note n'est pas une tâche de côté. ── */
  if (showNoteForm) {
    return (
      <div className="mx-auto max-w-4xl px-[18px] py-6">
        <p className="mm-eyebrow m-0">{t('notes.screenTitle')}</p>
        {/* <h2> et non <h1> : le titre de la page reste « Mes notes », porté par la barre
            haute. Celui-ci nomme la SECTION ouverte par-dessus la liste. */}
        <h2 className="mt-[6px] font-display text-dsp-xs text-ink">
          {editingNote ? t('notes.editTitle') : t('notes.newTitle')}
        </h2>

        <GlassPanel level="hero" padding={22} className="mt-[18px]">
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
            rows={10}
          />
          <div className="mt-[17px] flex gap-[8px]">
            <Button tone="quiet" onClick={() => setShowNoteForm(false)}>{t('notes.cancel')}</Button>
            <Button
              tone="forme"
              onClick={() => void handleSave()}
              disabled={savingNote || !noteForm.title.trim()}
              loading={savingNote}
            >
              {savingNote ? t('notes.saving') : t('notes.save')}
            </Button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-[18px] py-6">
      {/* Le titre de l'écran est celui de la barre haute de `AppShell`, alimentée par
          `titleMap` — donc pour chaque route sans exception. En rendre un second ici donnait
          DEUX <h1> par écran et le même mot écrit deux fois à quinze centimètres d'intervalle.
          C'est la décision déjà prise pour les dix-neuf écrans de console (`ConsolePage`). */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-meta-2" style={{ color: 'var(--text-muted)' }}>
            <Num value={notes.length} source="db" asOf={asOf} /> {t('notes.countLabel')}
          </p>
        </div>
        <Tag>{t('notes.privateTag')}</Tag>
      </div>

      <div className="mt-[14px] flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <SearchPill
            label={t('notes.searchLabel')}
            labelHidden
            placeholder={t('notes.searchPlaceholder')}
            value={noteSearch}
            onChange={setNoteSearch}
            height={48}
            icon={<Icon name="search" size={17} strokeWidth={2.4} />}
          />
        </div>
        <Button tone="forme" size="sm" fullWidth={false} onClick={openNewNote}>{t('notes.newNote')}</Button>
      </div>

      {loadingNotes ? (
        <div className="mt-[14px] grid gap-[8px]">
          {[0, 1, 2].map((i) => <Skeleton key={i} height={62} radius="var(--r-m)" label={t('notes.loadingLabel')} />)}
        </div>
      ) : filteredNotes.length === 0 ? (
        <GlassPanel level="hero" padding={22} className="mt-[14px]">
          <EmptyState
            glyph={<Icon name="comment" size={26} style={{ color: 'var(--mm-bleu)' }} />}
            glyphBackground="color-mix(in srgb, var(--mm-bleu) 14%, transparent)"
            title={t('notes.emptyTitle')}
            body={t('notes.emptyText')}
            action={<Button tone="forme" onClick={openNewNote}>{t('notes.createFirst')}</Button>}
          />
        </GlassPanel>
      ) : (
        <GlassPanel level="flat" padding="6px 18px" className="mt-[14px]">
          {filteredNotes.map((note, i) => (
            <LessonRow
              key={note.id}
              state="plain"
              icon={<Icon name="comment" size={14} />}
              title={note.title}
              meta={formatDate(note.updatedAt)}
              last={i === filteredNotes.length - 1}
              trailing={
                <span className="flex flex-shrink-0 gap-[8px]">
                  <IconButton label={`${t('notes.edit')} : ${note.title}`} onClick={() => openEditNote(note)}>
                    <Icon name="pencil" size={15} />
                  </IconButton>
                  <IconButton label={`${t('notes.delete')} : ${note.title}`} onClick={() => void handleDelete(note.id)}>
                    <Icon name="trash" size={15} style={{ color: 'var(--stop)' }} />
                  </IconButton>
                </span>
              }
            />
          ))}
        </GlassPanel>
      )}

      {/* L'encart de vérité du kit : un sourcil, un paragraphe, aucun chiffre. */}
      <GlassPanel level="truth" className="mt-[16px]">
        <p className="mm-eyebrow m-0 mb-[6px]">{t('notes.truthTitle')}</p>
        <p className="m-0 text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>{t('notes.truthBody')}</p>
      </GlassPanel>
    </div>
  );
}
