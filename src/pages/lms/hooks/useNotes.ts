import { useState, useEffect, useMemo } from 'react';
import { getUserNotes, saveNote, deleteNote } from '../../../lib/firestore';
import type { Note } from '../../../lib/firestore';
import { addXP } from '../../../lib/gamification';
import { XP_REWARDS } from '../../../types/gamification';

export function useNotes(userId: string | undefined, active: boolean) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSearch, setNoteSearch] = useState('');

  useEffect(() => {
    if (!userId || !active) return;
    setLoadingNotes(true);
    getUserNotes(userId)
      .then((data) => {
        setNotes(data);
        setLoadingNotes(false);
      })
      .catch(() => {
        setLoadingNotes(false);
      });
  }, [userId, active]);

  const openNewNote = () => {
    setEditingNote(null);
    setNoteForm({ title: '', content: '' });
    setShowNoteForm(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({ title: note.title, content: note.content });
    setShowNoteForm(true);
  };

  const handleSaveNote = async () => {
    if (!userId || !noteForm.title.trim()) return;
    setSavingNote(true);
    try {
      const now = new Date().toISOString();
      await saveNote(
        userId,
        {
          title: noteForm.title.trim(),
          content: noteForm.content,
          createdAt: editingNote?.createdAt ?? now,
          updatedAt: now,
        },
        editingNote?.id
      );
      // XP à la création seulement : rééditer une note ne doit rien rapporter.
      if (!editingNote) {
        addXP(userId, XP_REWARDS.createNote).catch(() => null);
      }
      const updatedNotes = await getUserNotes(userId);
      setNotes(updatedNotes);
      setShowNoteForm(false);
      return { success: true, edited: !!editingNote };
    } catch {
      return { success: false, edited: false };
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!userId) return;
    try {
      await deleteNote(userId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      return true;
    } catch {
      return false;
    }
  };

  const filteredNotes = useMemo(
    () =>
      notes.filter(
        (n) =>
          n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
          n.content.toLowerCase().includes(noteSearch.toLowerCase())
      ),
    [notes, noteSearch]
  );

  return {
    notes,
    loadingNotes,
    editingNote,
    noteForm,
    setNoteForm,
    showNoteForm,
    setShowNoteForm,
    savingNote,
    noteSearch,
    setNoteSearch,
    filteredNotes,
    openNewNote,
    openEditNote,
    handleSaveNote,
    handleDeleteNote,
  };
}
