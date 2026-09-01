import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RysmoStoreTab from '../tabs/RysmoStoreTab';
import RysmoMemoryTab from '../tabs/RysmoMemoryTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';
import { Icon, type IconName } from '@ds';

type RysmoSubTab = 'tokens' | 'memoire';

const TABS: { id: RysmoSubTab; labelKey: string; icon: IconName }[] = [
  { id: 'tokens', labelKey: 'rysmoPage.tabTokens', icon: 'zap' },
  { id: 'memoire', labelKey: 'rysmoPage.tabMemory', icon: 'brain' },
];

export default function RysmoPage() {
  const { t } = useTranslation('lms');
  const ctx = useOutletContext<StudentLayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const active: RysmoSubTab = searchParams.get('tab') === 'memoire' ? 'memoire' : 'tokens';

  const setActive = (tab: RysmoSubTab) => {
    setSearchParams(tab === 'tokens' ? {} : { tab }, { replace: true });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/*
        LE TITRE A ÉTÉ RETIRÉ D'ICI, POUR DEUX RAISONS QUI SE CUMULAIENT.

        1 · Il écrivait « Rysmo » EN DUR. C'est le nom de l'APPLICATION, pas celui du
            répétiteur qui vit dedans — celui-là s'appelle « Répétiteur » par défaut et
            chaque personne peut le renommer (AD-12, `lib/naming`). `AppShell` rend déjà le
            titre de cette page depuis `titleMap['/mon-espace/repetiteur'] = tutorName(userData)` :
            quelqu'un qui avait appelé le sien « Coach » lisait donc « Coach » dans la barre
            haute et « Rysmo » quinze centimètres plus bas, sur le même écran.

        2 · C'était un SECOND `<h1>` sur la page. `NotesTab` et `DashboardTab` documentent
            tous deux avoir écarté le leur pour cette raison ; celui-ci avait survécu.

        Le glyphe et le sous-titre restent : ils situent l'écran sans le renommer.
      */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[image:var(--action-digitalise)] flex items-center justify-center shadow-md">
          <Icon name="bot" size={24} className="text-white" />
        </div>
        <p className="text-sm text-ink-2">{t('rysmoPage.subtitle')}</p>
      </div>

      {/* Sous-onglets */}
      <div className="flex gap-1 bg-[color:var(--fill-2)] rounded-xl p-1 max-w-md">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              active === tab.id
                ? 'bg-surface-sheet text-ink shadow-sm'
                : 'text-ink-2 hover:text-ink dark:hover:text-ink-2'
            }`}
          >
            <Icon name={tab.icon} size={14} />
            {t(tab.labelKey)}
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
