import { LogOut } from 'lucide-react';
import Toggle from '../../../components/ui/Toggle';

interface SettingsTabProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onSignOut: () => void;
}

export default function SettingsTab({ theme, setTheme, onSignOut }: SettingsTabProps) {
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
        <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Compte</h3>
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-error-300 dark:border-error-700 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
