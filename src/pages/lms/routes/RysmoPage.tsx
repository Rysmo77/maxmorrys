import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Bot, Zap, Brain } from 'lucide-react';
import RysmoStoreTab from '../tabs/RysmoStoreTab';
import RysmoMemoryTab from '../tabs/RysmoMemoryTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

type RysmoSubTab = 'tokens' | 'memoire';

const TABS: { id: RysmoSubTab; label: string; icon: typeof Zap }[] = [
  { id: 'tokens', label: 'Tokens & abonnements', icon: Zap },
  { id: 'memoire', label: 'Mémoire', icon: Brain },
];

export default function RysmoPage() {
  const ctx = useOutletContext<StudentLayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const active: RysmoSubTab = searchParams.get('tab') === 'memoire' ? 'memoire' : 'tokens';

  const setActive = (tab: RysmoSubTab) => {
    setSearchParams(tab === 'tokens' ? {} : { tab }, { replace: true });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">Rysmo</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Ton répétiteur IA : tokens, abonnements et mémoire.</p>
        </div>
      </div>

      {/* Sous-onglets */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 max-w-md">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              active === tab.id
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'tokens' ? (
        <RysmoStoreTab />
      ) : (
        <RysmoMemoryTab enrolledFormations={ctx.enrolledFormations} />
      )}
    </div>
  );
}
