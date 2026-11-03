import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Num, Skeleton } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import { ConsoleCard, ConsoleStatus } from '../../components/console';
import { getAuditLog, type AuditEntry } from '../../lib/admin/auditLog';
import { captureError } from '../../lib/sentry';
import {
  CBtn, ConsoleNote, ConsoleScreen, ConsoleToolbar, EmptyTable, HonestEmpty,
} from './components/ConsoleParts';
import { SPACE_TONE, spaceLabels, type SpaceFilterValue } from './components/consoleUtils';

/**
 * JOURNAL D'AUDIT — maquette `Console-Audit` (+ `-mobile`).
 *
 * ⭐ BRANCHÉ le 03/11/2026 (audit UI/UX, A1) sur la collection `audit_log`, écrite par le
 * helper unique `lib/admin/auditLog.ts` dans le même lot que chaque action. Les règles la
 * rendent append-only (ni modification, ni effacement) et refusent une suppression ou un
 * changement de rôle sans son entrée : ce que la table montre n'a pas pu être retouché
 * depuis la console.
 *
 * Les filtres acteur / action / période restent inactifs : la lecture rend les 200 dernières
 * actions, et le filtre d'espace de la barre suffit à ce volume. L'export produit un CSV.
 */
const MAX = 200;

function csvCell(v: string): string {
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export default function AdminJournal() {
  const { t, i18n } = useTranslation('ecrans');
  const k = (s: string) => t(`console.audit.${s}`);
  const [space, setSpace] = useState<SpaceFilterValue>('all');
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [readAt, setReadAt] = useState(() => new Date());

  useEffect(() => {
    let alive = true;
    getAuditLog(MAX)
      .then((rows) => { if (alive) { setEntries(rows); setReadAt(new Date()); } })
      .catch((e: unknown) => {
        captureError(e, { context: 'getAuditLog()' });
        if (alive) { setEntries([]); setFailed(true); }
      });
    return () => { alive = false; };
  }, []);

  const loc = i18n.language.startsWith('en') ? 'en-GB' : 'fr-FR';
  const when = (d: Date | null) => (d
    ? d.toLocaleString(loc, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null);
  const actor = (e: AuditEntry) => `${e.actorRole} · ${e.actorUid.slice(0, 8)}`;
  const target = (e: AuditEntry) => `${e.targetCollection}/${e.targetId}${e.summary ? ` — ${e.summary}` : ''}`;

  const shown = useMemo(
    () => (entries ?? []).filter((e) => space === 'all' || e.space === space),
    [entries, space],
  );

  const exportCsv = () => {
    const head = [k('colWhen'), k('colActor'), k('colAction'), k('colTarget'), k('colSpace'), k('colReason')];
    const lines = shown.map((e) => [
      e.at ? e.at.toISOString() : '', `${e.actorRole} ${e.actorUid}`, e.action,
      target(e), e.space ?? '', e.reason ?? '',
    ].map(csvCell).join(';'));
    const blob = new Blob([[head.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filters = ['fActor', 'fAction', 'fSpace', 'fPeriod'];
  const cols = [k('colWhen'), k('colActor'), k('colAction'), k('colTarget'), k('colSpace'), k('colReason')];
  const empty = failed
    ? <HonestEmpty icon="alert" title={k('loadError')} />
    : <HonestEmpty icon="shield" title={t('console.journal.empty')} body={t('console.journal.body')} />;

  return (
    <ConsoleScreen label={t('console.journal.title')}>
      <SEOHead title={t('console.journal.title')} description={t('console.journal.body')} noIndex />
      <ConsoleToolbar space={space} onSpace={setSpace} labels={spaceLabels(t, 'console.common')} hideSpacesOnPhone />

      {/* Mobile : les filtres d'abord, puis la carte (maquette mobile). */}
      <div className="flex gap-2 overflow-x-auto stack:hidden">
        {filters.map((f) => <CBtn key={f} disabled className="h-8 flex-none">{k(f)}</CBtn>)}
      </div>

      <ConsoleCard
        as="section"
        title={k('allTitle')}
        aside={<>
          <ConsoleStatus tone={entries === null || failed ? 'mute' : 'ok'}>{k(failed ? 'notWired' : 'live')}</ConsoleStatus>
          <CBtn
            icon="download"
            disabled={shown.length === 0}
            onClick={exportCsv}
            className="hidden stack:inline-flex"
            title={shown.length === 0 ? k('exportOff') : undefined}
          >
            {k('export')}
          </CBtn>
        </>}
      >
        <div className="mb-3 hidden flex-wrap gap-2 stack:flex">
          {filters.map((f) => <CBtn key={f} disabled className="h-8">{k(f)}</CBtn>)}
        </div>

        {entries === null ? <Skeleton height={120} label={t('console.journal.title')} /> : shown.length === 0 ? (
          <>
            <div className="hidden stack:block"><EmptyTable cols={cols}>{empty}</EmptyTable></div>
            <div className="stack:hidden">{empty}</div>
          </>
        ) : (
          <>
            <div className="hidden overflow-x-auto stack:block">
              <table className="mm-ctable">
                <thead><tr>{cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap"><Num value={when(e.at)} source="server" asOf={readAt} /></td>
                      <td className="text-ink-2"><code className="text-[12px]">{actor(e)}</code></td>
                      <td><code className="text-[12px]">{e.action}</code></td>
                      <td className="max-w-[320px] truncate" title={target(e)}>{target(e)}</td>
                      <td>{e.space ? <ConsoleStatus tone={SPACE_TONE[e.space]}>{t(`console.common.spaces.${e.space}`)}</ConsoleStatus> : null}</td>
                      <td className="text-ink-2">{e.reason ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="stack:hidden">
              {shown.map((e) => (
                <div key={e.id} className="mm-mrow">
                  <div className="min-w-0 flex-1">
                    <b className="block text-[13px]"><code>{e.action}</code></b>
                    <span className="block truncate text-[12px] text-ink-2">{target(e)}</span>
                    <span className="block text-[11.5px] text-ink-3">{actor(e)}</span>
                  </div>
                  <Num value={when(e.at)} source="server" asOf={readAt} className="flex-none text-[11.5px]" />
                </div>
              ))}
            </div>
          </>
        )}
      </ConsoleCard>

      <ConsoleNote>{k('note')}</ConsoleNote>
    </ConsoleScreen>
  );
}
