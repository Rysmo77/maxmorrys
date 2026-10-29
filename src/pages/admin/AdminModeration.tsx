import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Num, Skeleton, useToast } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import { ConfirmDialog } from '@/components/dialogs';
import { ConsoleCard, ConsoleStatus } from '../../components/console';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { deleteDmMessage, getDmReports, getUserById, updateDmReportStatus } from '../../lib/firestore';
import { captureError } from '../../lib/sentry';
import type { DmReport } from '../../types';
import {
  CBtn, ConsoleGrid, ConsoleScreen, ConsoleTabs, ConsoleToolbar, HonestEmpty,
} from './components/ConsoleParts';
import { ageOf, initialsOf, spaceLabels, type SpaceFilterValue } from './components/consoleUtils';

/**
 * CLUB · MODÉRATION — maquette `Console-Moderation` (+ `-mobile`), passe 2, lot D.
 *
 * Onglets (Ouverts · Blocages · Publications masquées · Traités), la file de signalements
 * à gauche, la fiche de décision à droite (440 px).
 *
 * DONNÉES RÉELLES : les signalements de messages privés (`dmReports`, déjà lus et traités
 * par l'onglet Signalements de l'écran Club). Les deux gestes branchés sont ceux qui
 * existaient déjà : « Masquer les messages » (suppression du message + classement) et
 * « Classer sans suite ». AUCUNE nouvelle écriture.
 *
 * SANS PRODUCTEUR : blocages, publications masquées, signalements de profils et
 * d'opportunités, avertissement et suspension, motif tracé au journal. Les onglets et les
 * boutons existent, désactivés, et la fiche dit pourquoi.
 */
type Tab = 'open' | 'blocks' | 'hidden' | 'done';

export default function AdminModeration() {
  const { t, i18n } = useTranslation('ecrans');
  const k = (s: string, o?: Record<string, unknown>) => t(`console.mod.${s}`, o);
  /* Les messages des gestes (toasts, confirmation) reprennent ceux de l'onglet Signalements
     de l'écran Club, recopiés dans `ecrans` : la route ne charge que ce namespace. */
  const { addToast } = useToast();
  const confirm = useConfirmDialog();

  const [reports, setReports] = useState<DmReport[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [readAt, setReadAt] = useState(() => new Date());
  const [tab, setTab] = useState<Tab>('open');
  const [space, setSpace] = useState<SpaceFilterValue>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getDmReports()
      .then(async (r) => {
        if (!alive) return;
        setReports(r);
        setReadAt(new Date());
        setLoading(false);
        /* Le nom de la personne signalée : lu sur son compte, un à un (la file est courte). */
        const ids = [...new Set(r.map((x) => x.reportedUserId).filter(Boolean))];
        const pairs = await Promise.all(ids.map((id) => getUserById(id).then((u) => [id, u?.displayName || u?.email || ''] as const).catch(() => [id, ''] as const)));
        if (alive) setNames(Object.fromEntries(pairs.filter(([, n]) => n)));
      })
      .catch((e: unknown) => { captureError(e); if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const open = useMemo(() => reports.filter((r) => r.status === 'open').sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [reports]);
  const done = useMemo(() => reports.filter((r) => r.status === 'resolved').sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [reports]);
  /* Tous les signalements relevés sont du Club : un autre espace n'a rien à modérer ici. */
  const list = space !== 'all' && space !== 'club' ? [] : tab === 'open' ? open : tab === 'done' ? done : [];
  const selected = list.find((r) => r.id === selectedId) ?? list[0] ?? null;
  const nameOf = (r: DmReport) => names[r.reportedUserId] || k('unknownMember');
  const age = (r: DmReport) => ageOf(r.createdAt, readAt, i18n.language);

  const resolve = async (r: DmReport) => {
    setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'resolved' } : x)));
    try { await updateDmReportStatus(r.id, 'resolved'); addToast('success', k('resolved')); }
    catch { addToast('error', k('genericError')); }
  };
  const hideMessage = (r: DmReport) => {
    confirm.requestConfirm(k('deleteMessageConfirm'), async () => {
      try {
        await deleteDmMessage(r.convId, r.messageId);
        await updateDmReportStatus(r.id, 'resolved').catch(() => null);
        setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'resolved' } : x)));
        addToast('success', k('messageDeleted'));
      } catch (error: unknown) {
        captureError(error, { context: 'Delete reported DM message failed' });
        addToast('error', k('messageDeleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const avatar = (name: string, size: number) => (
    <span className="mm-avatar flex-none" style={{ width: size, height: size, fontSize: Math.round(size / 3), background: 'linear-gradient(135deg, var(--mm-bleu-f), var(--mm-violet-f))' }}>
      {initialsOf(name)}
    </span>
  );

  return (
    <ConsoleScreen label={t('console.moderation.title')}>
      <SEOHead title={t('console.moderation.title')} description={t('console.moderation.body')} noIndex />
      <ConsoleToolbar space={space} onSpace={setSpace} labels={spaceLabels(t, 'console.common')} hideSpacesOnPhone />

      <ConsoleTabs<Tab>
        label={k('tabsLabel')}
        value={tab}
        onChange={(v) => { setTab(v); setSelectedId(null); }}
        items={[
          { id: 'open', label: k('tabOpen'), count: loading ? undefined : <Num value={open.length} source="db" asOf={readAt} /> },
          { id: 'blocks', label: k('tabBlocks'), disabled: true },
          { id: 'hidden', label: k('tabHidden'), disabled: true },
          { id: 'done', label: k('tabDone'), count: loading ? undefined : <Num value={done.length} source="db" asOf={readAt} /> },
        ]}
      />

      <ConsoleGrid side={440}>
        <ConsoleCard
          as="section"
          title={<>
            <span className="hidden stack:inline">{k('queueTitle')}</span>
            <span className="stack:hidden">{k(tab === 'done' ? 'doneCount' : 'openCount', { count: list.length })}</span>
          </>}
          aside={<span className="hidden stack:inline">{k(tab === 'done' ? 'newestFirst' : 'oldestFirst')}</span>}
        >
          {loading ? <Skeleton height={140} label={k('loading')} /> : list.length === 0 ? (
            <HonestEmpty icon="check" title={t('console.moderation.empty')} body={k('emptyBody')} />
          ) : (
            <>
              <div className="hidden overflow-x-auto stack:block">
                <table className="mm-ctable" aria-label={k('queueTitle')}>
                  <thead>
                    <tr>
                      <th scope="col">{k('colType')}</th>
                      <th scope="col">{k('colWho')}</th>
                      <th scope="col">{k('colWhy')}</th>
                      <th scope="col">{k('colAge')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => (
                      <tr
                        key={r.id}
                        className={selected?.id === r.id ? 'is-sel cursor-pointer' : 'cursor-pointer'}
                        onClick={() => setSelectedId(r.id)}
                      >
                        <td><ConsoleStatus tone="stop">{k('typeDm')}</ConsoleStatus></td>
                        <td>
                          <button type="button" className="flex items-center gap-2 border-0 bg-transparent p-0 text-left font-semibold text-ink" onClick={() => setSelectedId(r.id)}>
                            {avatar(nameOf(r), 30)}{nameOf(r)}
                          </button>
                        </td>
                        <td className="max-w-[320px] truncate text-ink-2">« {r.text} »</td>
                        <td className="text-[12px] text-ink-3"><Num value={age(r)} source="db" asOf={readAt} fallback="—" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="stack:hidden">
                {list.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className="mm-mrow w-full border-x-0 border-t-0 bg-transparent text-left"
                  >
                    {avatar(nameOf(r), 34)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <ConsoleStatus tone="stop">{k('typeDm')}</ConsoleStatus>
                        <Num value={age(r)} source="db" asOf={readAt} fallback="" className="text-[11px] text-ink-3" />
                      </div>
                      <span className="mt-1 block truncate text-[12.5px] text-ink-2">« {r.text} »</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </ConsoleCard>

        <ConsoleCard
          as="section"
          title={k('sheetTitle')}
          aside={selected ? (
            <ConsoleStatus tone={selected.status === 'open' ? 'stop' : 'mute'}>
              {selected.status === 'open' ? k('stOpen') : k('stDone')}
              {age(selected) && <> · <Num value={age(selected)} source="db" asOf={readAt} /></>}
            </ConsoleStatus>
          ) : undefined}
        >
          {!selected ? (
            <HonestEmpty icon="flag" title={k('sheetNone')} body={k('sheetNoneBody')} />
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-m p-3" style={{ background: 'var(--paper-2)' }}>
                {avatar(nameOf(selected), 42)}
                <div className="min-w-0 flex-1">
                  <b className="block truncate">{nameOf(selected)}</b>
                  <span className="text-[12px] text-ink-3">{k('reportedMember')}</span>
                </div>
                <CBtn href="/admin/utilisateurs">{k('seeProfile')}</CBtn>
              </div>

              <b className="mb-2 mt-4 block text-[13px]">{k('whatTitle')}</b>
              <div className="rounded-m border border-[color:var(--line)] px-3.5 py-3 text-[13.5px] leading-[1.5]">
                « {selected.text} »
                <span className="mt-1.5 block text-[11.5px] text-ink-3">{k('whatMeta')}</span>
              </div>

              <div className="mm-cfield mt-4">
                {k('reason')}
                <span className="area">{k('reasonOff')}</span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 stack:grid-cols-2">
                <CBtn disabled title={k('noBackend')}>{k('aWarn')}</CBtn>
                <CBtn disabled={selected.status !== 'open'} onClick={() => hideMessage(selected)}>{k('aHide')}</CBtn>
                <CBtn tone="stop" disabled title={k('noBackend')}>{k('aSuspend')}</CBtn>
                <CBtn disabled={selected.status !== 'open'} onClick={() => resolve(selected)}>{k('aDismiss')}</CBtn>
              </div>
              <p className="m-0 mt-3 text-[12px] leading-[1.5] text-ink-3">{k('sheetNote')}</p>
            </>
          )}
        </ConsoleCard>
      </ConsoleGrid>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={k('confirmTitle')}
        message={confirm.message}
        confirmLabel={k('confirmLabel')}
      />
    </ConsoleScreen>
  );
}
