import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Num, Skeleton } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import { ConsoleCard, ConsoleStatus } from '../../components/console';
import { getAllRedirects } from '../../lib/firestore';
import { captureError } from '../../lib/sentry';
import type { Redirect } from '../../types';
import {
  CBtn, ConsoleScreen, ConsoleStack, EmptyTable, HonestEmpty,
} from './components/ConsoleParts';

/**
 * INFRASTRUCTURE — maquette `Console-Infra` (+ `-mobile`), passe 2, lot D.
 *
 * Deux colonnes égales : Domaines · Redirections · Sauvegarde, puis Workers (version
 * servie contre `main`) · Tâches planifiées réellement déclarées.
 *
 *  · DOMAINES : la plateforme vit sur UN domaine (aucun sous-domaine — décision tenue
 *    par la passe 2). Les usages sont des faits de configuration ; l'état (HTTPS, accès)
 *    n'est pas sondé, la colonne le dit au lieu d'allumer un voyant.
 *  · REDIRECTIONS : lues en base (`redirects`), les cinq plus récentes actives ; l'écran
 *    complet reste `/admin/redirections`.
 *  · SAUVEGARDE, WORKERS, TÂCHES : aucun relevé côté console. `wrangler.jsonc` ne dit pas
 *    ce qui est en service (seul `wrangler versions view` le dit) : afficher sa liste serait
 *    affirmer ce que la maquette reproche à l'ancienne console. États vides honnêtes.
 */
const DOMAINS = [
  { host: 'maxmorrys.me', use: 'useSite' },
  { host: 'maxmorrys.me/apprendre', use: 'useEdu' },
  { host: 'maxmorrys.me/club-des-digitos', use: 'useClub' },
  { host: 'maxmorrys.me/admin', use: 'useConsole' },
] as const;

export default function AdminInfra() {
  const { t } = useTranslation('ecrans');
  const k = (s: string) => t(`console.infraScreen.${s}`);
  const [redirects, setRedirects] = useState<Redirect[] | null>(null);
  const [readAt, setReadAt] = useState(() => new Date());

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
          <ConsoleCard as="section" title={k('domainsTitle')}>
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
                      <td><ConsoleStatus tone="mute">{k('notProbed')}</ConsoleStatus></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ConsoleCard>

          <ConsoleCard as="section" title={k('redirectsTitle')} aside={<CBtn href="/admin/redirections" icon="plus">{k('add')}</CBtn>}>
            {redirects === null ? <Skeleton height={60} /> : redirects.length === 0 ? (
              <HonestEmpty icon="route" title={k('redirectsEmpty')} />
            ) : redirects.slice(0, 5).map((r) => (
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
