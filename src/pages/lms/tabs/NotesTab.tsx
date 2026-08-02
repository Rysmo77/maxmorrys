import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Plus, X, Edit3, Trash2, FileText, Save, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useFormat } from '../../../hooks/useFormat';
import type { Note } from '../../../lib/firestore';
import { staggerContainer, staggerItem } from '../../../lib/animations';

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

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

  return (
    <div className="space-y-4">
      {showNoteForm ? (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-neutral-900 dark:text-white">{editingNote ? t('notes.editTitle') : t('notes.newTitle')}</h3>
          <input
            value={noteForm.title}
            onChange={(e) => setNoteForm((p) => ({ ...p, title: e.target.value }))}
            placeholder={t('notes.titlePlaceholder')}
            maxLength={200}
            className={inputCls}
          />
          <textarea
            value={noteForm.content}
            onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))}
            placeholder={t('notes.contentPlaceholder')}
            rows={8}
            className={`${inputCls} resize-y font-mono`}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowNoteForm(false)} icon={<X className="w-4 h-4" />}>{t('notes.cancel')}</Button>
            <Button onClick={handleSave} disabled={savingNote || !noteForm.title.trim()} icon={savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
              {savingNote ? t('notes.saving') : t('notes.save')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={noteSearch} onChange={(e) => setNoteSearch(e.target.value)} placeholder={t('notes.searchPlaceholder')} className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
            </div>
            <Button size="sm" className="w-full sm:w-auto" onClick={openNewNote} icon={<Plus className="w-4 h-4" />}>{t('notes.newNote')}</Button>
          </div>
          {loadingNotes ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-50 dark:from-accent-900/40 dark:to-accent-900/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-accent-500" />
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{t('notes.emptyTitle')}</h4>
              <p className="text-sm text-neutral-500 mb-4 max-w-xs mx-auto">
                {t('notes.emptyText')}
              </p>
              <Button size="sm" onClick={openNewNote} icon={<Plus className="w-4 h-4" />}>{t('notes.createFirst')}</Button>
            </div>
          ) : (
            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredNotes.map((note) => (
                <motion.div key={note.id} variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 group hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm line-clamp-1">{note.title}</h4>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEditNote(note)} className="p-1 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(note.id)} className="p-1 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-3 mb-3">{note.content}</p>
                  <p className="text-xs text-neutral-400">{formatDate(note.updatedAt)}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
