import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Num, Skeleton } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import { ConsoleCard, ConsoleStatus } from '../../components/console';
import { getAllRedirects } from '../../lib/firestore';
import { captureError } from '../../lib/sentry';
import type { Redirect } from '../../types';
import { DOMAINE, origineEspace } from '../../lib/espaces';
import {
  compareBundles, currentBundle, probeHost, servedBundle,
  type HostProbe, type VersionProbe,
} from '../../lib/admin/infraProbes';
import {
  CBtn, ConsoleScreen, ConsoleStack, EmptyTable, HonestEmpty,
} from './components/ConsoleParts';

/**
 * INFRASTRUCTURE — maquette `Console-Infra` (+ `-mobile`), passe 2, lot D.
 *
 * Deux colonnes égales : Domaines · Redirections · Sauvegarde, puis Workers (version
 * servie contre `main`) · Tâches planifiées réellement déclarées.
 *
 *  · DOMAINES : le hub, l'Edu et le Club sont TROIS HÔTES (`edu.maxmorrys.me`,
 *    `club.maxmorrys.me`), la console un chemin du hub. Les hôtes sont DÉRIVÉS de
 *    `lib/espaces` — ils étaient écrits en chemins (`maxmorrys.me/apprendre`), ce que l'audit
 *    du 03/11/2026 (X16) a relevé. L'état est SONDÉ depuis ce navigateur
 *    (`lib/admin/infraProbes.ts`) : code HTTP lisible sur le hub, « répond » seulement
 *    ailleurs (pas de CORS, réponse opaque) — la colonne dit lequel des deux.
 *  · VERSION : bundle servi par le hub contre bundle de cet onglet (X16).
 *  · REDIRECTIONS : lues en base (`redirects`), TOUTES les actives, avec leur nombre — la
 *    coupe à cinq en affichait cinq sur huit sans le dire (X16).
 *  · SAUVEGARDE : il n'en existe AUCUNE automatique (vérifié le 03/11/2026) — l'écran le dit ;
 *    le plan est dans `_bmad-output/implementation-artifacts/deferred-work.md`.
 *  · WORKERS, TÂCHES : aucun relevé côté console. `wrangler.jsonc` ne dit pas
 *    ce qui est en service (seul `wrangler versions view` le dit) : afficher sa liste serait
 *    affirmer ce que la maquette reproche à l'ancienne console. États vides honnêtes.
 */
const hostOf = (espace: 'hub' | 'edu' | 'club') =>
  origineEspace(espace, `https://${DOMAINE}`).replace(/^https?:\/\//, '');

const DOMAINS = [
  { host: hostOf('hub'), use: 'useSite' },
  { host: hostOf('edu'), use: 'useEdu' },
  { host: hostOf('club'), use: 'useClub' },
  { host: `${hostOf('hub')}/admin`, use: 'useConsole' },
  { host: `media.${DOMAINE}`, use: 'useMedia' },
] as const;

const urlOf = (host: string) => `https://${host}${host.includes('/') ? '' : '/'}`;

function ProbeCell({ probe, k }: { probe: HostProbe | undefined; k: (s: string) => string }) {
  if (!probe) return <ConsoleStatus tone="mute">{k('probing')}</ConsoleStatus>;
  switch (probe.state) {
    case 'ok': return <ConsoleStatus tone="ok">{`HTTP ${probe.status}`}</ConsoleStatus>;
    case 'http-error': return <ConsoleStatus tone="stop">{`HTTP ${probe.status}`}</ConsoleStatus>;
    case 'reachable': return <ConsoleStatus tone="ok"><span title={k('reachableHint')}>{k('reachable')}</span></ConsoleStatus>;
    default: return <ConsoleStatus tone="stop">{k('unreachable')}</ConsoleStatus>;
  }
}

export default function AdminInfra() {
  const { t } = useTranslation('ecrans');
  const k = (s: string) => t(`console.infraScreen.${s}`);
  const [redirects, setRedirects] = useState<Redirect[] | null>(null);
  const [readAt, setReadAt] = useState(() => new Date());
  const [probes, setProbes] = useState<Record<string, HostProbe>>({});
  const [version, setVersion] = useState<VersionProbe | null>(null);
  const [probedAt, setProbedAt] = useState<Date | null>(null);

  const runProbes = useCallback(() => {
    setProbes({});
    setVersion(null);
    void Promise.all(DOMAINS.map(async (d) => {
      const p = await probeHost(urlOf(d.host));
      setProbes((prev) => ({ ...prev, [d.host]: p }));
    })).then(() => setProbedAt(new Date()));
    servedBundle()
      .then((served) => setVersion(compareBundles(served, currentBundle())))
      .catch((e: unknown) => { captureError(e, { context: 'Infra version probe failed' }); setVersion({ state: 'unknown' }); });
  }, []);

  useEffect(() => { runProbes(); }, [runProbes]);

  useEffect(() => {
    getAllRedirects()
      .then((r) => { setRedirects(r.filter((x) => x.active)); setReadAt(new Date()); })
      .catch((e: unknown) => { captureError(e); setRedirects([]); });
  }, []);

  return (
    <ConsoleScreen label={t('console.infra.title')}>
      <SEOHead title={t('console.infra.title')} description={t('console.infra.body')} noIndex />

      <div className="grid min-w-0 items-start gap-3 wide:grid-cols-2 wide:gap-3.5">
        <ConsoleStack>
          <ConsoleCard
            as="section"
            title={k('domainsTitle')}
            aside={<CBtn icon="rotate" onClick={runProbes}>{k('reprobe')}</CBtn>}
          >
            <div className="overflow-x-auto">
              <table className="mm-ctable">
                <thead>
                  <tr>
                    <th scope="col">{k('colDomain')}</th>
                    <th scope="col" className="hidden stack:table-cell">{k('colUse')}</th>
                    <th scope="col">{k('colState')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DOMAINS.map((d) => (
                    <tr key={d.host}>
                      <td><code className="text-[12.5px]">{d.host}</code></td>
                      <td className="hidden text-ink-2 stack:table-cell">{k(d.use)}</td>
                      <td><ProbeCell probe={probes[d.host]} k={k} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="m-0 mt-2 text-[12px] leading-[1.5] text-ink-3">
              {k('probeNote')}
              {probedAt && <> · <Num value={probedAt.toLocaleTimeString()} source={{ cite: k('probeSource') }} asOf={probedAt} /></>}
            </p>
          </ConsoleCard>

          <ConsoleCard as="section" title={k('versionTitle')}>
            {version === null ? <Skeleton height={40} /> : (
              <>
                <div className="mm-mrow">
                  <span className="min-w-0 flex-1 text-ink-2">{k('versionServed')}</span>
                  <code className="truncate text-[12.5px]">{version.state === 'unknown' ? '—' : version.served ?? '—'}</code>
                </div>
                <div className="mm-mrow">
                  <span className="min-w-0 flex-1 text-ink-2">{k('versionRunning')}</span>
                  <code className="truncate text-[12.5px]">{version.state === 'same' || version.state === 'differs' ? version.running : '—'}</code>
                </div>
                <div className="mt-2">
                  {version.state === 'same' && <ConsoleStatus tone="ok">{k('versionSame')}</ConsoleStatus>}
                  {version.state === 'differs' && <ConsoleStatus tone="warn">{k('versionDiffers')}</ConsoleStatus>}
                  {version.state === 'dev' && <ConsoleStatus tone="mute">{k('versionDev')}</ConsoleStatus>}
                  {version.state === 'unknown' && <ConsoleStatus tone="stop">{k('versionUnknown')}</ConsoleStatus>}
                </div>
              </>
            )}
          </ConsoleCard>

          <ConsoleCard
            as="section"
            title={<>{k('redirectsTitle')}{redirects && redirects.length > 0 && <> · <Num value={redirects.length} source="db" asOf={readAt} /></>}</>}
            aside={<CBtn href="/admin/redirections" icon="plus">{k('add')}</CBtn>}
          >
            {redirects === null ? <Skeleton height={60} /> : redirects.length === 0 ? (
              <HonestEmpty icon="route" title={k('redirectsEmpty')} />
            ) : redirects.map((r) => (
              <div key={r.id} className="mm-mrow">
                <code className="min-w-0 flex-1 truncate text-[12.5px]">{r.source}</code>
                <span className="text-ink-3" aria-hidden="true">→</span>
                <code className="min-w-0 flex-1 truncate text-[12.5px]">{r.target}</code>
                <ConsoleStatus tone="mute"><Num value={String(r.code)} source="db" asOf={readAt} /></ConsoleStatus>
              </div>
            ))}
          </ConsoleCard>

          <ConsoleCard as="section" title={k('backupTitle')}>
            <HonestEmpty icon="save" title={k('backupEmpty')} body={k('backupEmptyBody')} />
          </ConsoleCard>
        </ConsoleStack>

        <ConsoleStack>
          <ConsoleCard as="section" title={k('workersTitle')}>
            <EmptyTable cols={[k('colWorker'), k('colServed'), 'main', k('colState')]}>
              <HonestEmpty icon="monitor" title={k('workersEmpty')} body={k('workersEmptyBody')} />
            </EmptyTable>
          </ConsoleCard>

          <ConsoleCard as="section" title={k('cronTitle')} aside={<span className="hidden stack:inline">{k('cronAside')}</span>}>
            <HonestEmpty icon="clock" title={k('cronEmpty')} body={k('cronEmptyBody')} />
          </ConsoleCard>
        </ConsoleStack>
      </div>
    </ConsoleScreen>
  );
}
