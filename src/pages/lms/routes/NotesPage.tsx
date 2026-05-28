import { useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import NotesTab from '../tabs/NotesTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

export default function NotesPage() {
  const ctx = useOutletContext<StudentLayoutContext>();
  const [params, setParams] = useSearchParams();
  const n = ctx.notesHook;

  // Deep-link: /mon-espace/notes?new=1 → open empty note form
  useEffect(() => {
    if (params.get('new') === '1') {
      n.openNewNote();
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams, n]);

  return (
    <NotesTab
      notes={n.notes}
      filteredNotes={n.filteredNotes}
      loadingNotes={n.loadingNotes}
      showNoteForm={n.showNoteForm}
      editingNote={n.editingNote}
      noteForm={n.noteForm}
      savingNote={n.savingNote}
      noteSearch={n.noteSearch}
      setNoteSearch={n.setNoteSearch}
      setNoteForm={n.setNoteForm}
      openNewNote={n.openNewNote}
      openEditNote={n.openEditNote}
      setShowNoteForm={n.setShowNoteForm}
      onSaveNote={n.handleSaveNote}
      onDeleteNote={n.handleDeleteNote}
      addToast={ctx.addToast}
    />
  );
}
