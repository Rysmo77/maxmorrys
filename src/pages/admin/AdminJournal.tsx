import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/seo/SEOHead';
import { ConsoleCard, ConsoleStatus } from '../../components/console';
import {
  CBtn, ConsoleNote, ConsoleScreen, ConsoleToolbar, EmptyTable, HonestEmpty,
} from './components/ConsoleParts';
import { spaceLabels, type SpaceFilterValue } from './components/consoleUtils';

/**
 * JOURNAL D'AUDIT — maquette `Console-Audit` (+ `-mobile`), passe 2, lot D.
 *
 * La maquette pose : filtre d'espace · carte « Toutes les actions » (état « en direct »,
 * Exporter) · quatre filtres (acteur, action, espace, période) · la table Quand / Acteur /
 * Action / Cible / Espace / Motif · la note « le journal ne s'efface pas ».
 *
 * ⚠️ LE JOURNAL N'A PAS DE PRODUCTEUR. Aucune action de console n'est encore écrite côté
 * serveur (FR-063 / FR-267). L'écran garde donc la forme exacte de la maquette, mais :
 * le statut dit « non branché » au lieu de « en direct », les filtres et l'export sont
 * désactivés, et la table porte un état vide honnête. Aucune ligne d'exemple.
 */
export default function AdminJournal() {
  const { t } = useTranslation('ecrans');
  const k = (s: string) => t(`console.audit.${s}`);
  const [space, setSpace] = useState<SpaceFilterValue>('all');

  const filters = ['fActor', 'fAction', 'fSpace', 'fPeriod'];

  return (
    <ConsoleScreen label={t('console.journal.title')}>
      <SEOHead title={t('console.journal.title')} description={t('console.journal.empty')} noIndex />
      <ConsoleToolbar space={space} onSpace={setSpace} labels={spaceLabels(t, 'console.common')} hideSpacesOnPhone />

      {/* Mobile : les filtres d'abord, puis la carte du jour (maquette mobile). */}
      <div className="flex gap-2 overflow-x-auto stack:hidden">
        {filters.map((f) => <CBtn key={f} disabled className="h-8 flex-none">{k(f)}</CBtn>)}
      </div>

      <ConsoleCard
        as="section"
        title={<><span className="hidden stack:inline">{k('allTitle')}</span><span className="stack:hidden">{k('todayTitle')}</span></>}
        aside={<>
          <ConsoleStatus tone="mute">{k('notWired')}</ConsoleStatus>
          <CBtn icon="download" disabled className="hidden stack:inline-flex" title={k('exportOff')}>{k('export')}</CBtn>
        </>}
      >
        <div className="mb-3 hidden flex-wrap gap-2 stack:flex">
          {filters.map((f) => <CBtn key={f} disabled className="h-8">{k(f)}</CBtn>)}
        </div>
        <div className="hidden stack:block">
          <EmptyTable cols={[k('colWhen'), k('colActor'), k('colAction'), k('colTarget'), k('colSpace'), k('colReason')]}>
            <HonestEmpty icon="shield" title={t('console.journal.empty')} body={t('console.journal.body')} />
          </EmptyTable>
        </div>
        <div className="stack:hidden">
          <HonestEmpty icon="shield" title={t('console.journal.empty')} body={t('console.journal.body')} />
        </div>
      </ConsoleCard>

      <ConsoleNote>{k('note')}</ConsoleNote>
    </ConsoleScreen>
  );
}
