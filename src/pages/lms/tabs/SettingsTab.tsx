import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Download, Trash2, Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import Toggle from '../../../components/ui/Toggle';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { functions } from '../../../config/firebase';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../contexts/AuthContext';

const exportUserData = httpsCallable<Record<string, never>, { downloadUrl: string; expiresInHours: number }>(
  functions,
  'exportUserData',
);
const deleteUserAccount = httpsCallable<{ confirmation: string }, { success: boolean }>(
  functions,
  'deleteUserAccount',
);

interface SettingsTabProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onSignOut: () => void;
}

export default function SettingsTab({ theme, setTheme, onSignOut }: SettingsTabProps) {
  const { addToast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportUserData({});
      const url = result.data.downloadUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
      addToast('success', 'Export genere. Le telechargement devrait demarrer.');
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : "Erreur lors de l'export.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== 'SUPPRIMER') {
      addToast('error', 'Tape SUPPRIMER pour confirmer.');
      return;
    }
    setDeleting(true);
    try {
      await deleteUserAccount({ confirmation: 'SUPPRIMER' });
      await signOut();
      addToast('success', 'Compte supprime.');
      navigate('/');
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : 'Erreur lors de la suppression.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
        <h3 className="font-bold text-neutral-900 dark:text-white mb-5">Apparence</h3>
        <Toggle
          checked={theme === 'dark'}
          onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          label="Mode sombre"
          description="Réduit la fatigue oculaire dans les environnements sombres"
        />
      </div>

      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
        <h3 className="font-bold text-neutral-900 dark:text-white mb-2">Mes donnees</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Exerce tes droits RGPD : exporter ou supprimer tes donnees personnelles.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-sm font-medium transition-colors disabled:opacity-50 mb-3"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Export en cours...' : 'Exporter mes donnees (JSON)'}
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-error-300 dark:border-error-700 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 text-sm font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Supprimer mon compte
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
        <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Compte</h3>
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-error-300 dark:border-error-700 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
        onConfirm={handleDelete}
        title="Supprimer definitivement mon compte"
        confirmLabel={deleting ? 'Suppression...' : 'Supprimer definitivement'}
        variant="danger"
        loading={deleting}
      >
        <div className="space-y-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Cette action est <strong>irreversible</strong>. Tes donnees seront supprimees :
          </p>
          <ul className="list-disc list-inside text-xs text-neutral-500 space-y-1">
            <li>Ton profil et ton compte d'authentification</li>
            <li>Tes inscriptions aux formations et tes certificats</li>
            <li>Tes notes, messages et notifications</li>
            <li>Ton historique de transactions</li>
          </ul>
          <div className="pt-2">
            <label htmlFor="confirm-delete" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Pour confirmer, tape <span className="font-mono font-bold">SUPPRIMER</span>
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-error-500/20 focus:border-error-500"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
