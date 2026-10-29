import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/seo/SEOHead';
import { ConsoleCard, ConsoleStatus } from '../../components/console';
import type { AdminSpace } from '../../lib/admin/consoleNav';
import {
  CBtn, ConsoleGrid, ConsoleScreen, ConsoleStack, ConsoleToolbar, EmptyTable, HonestEmpty,
} from './components/ConsoleParts';
import { spaceLabels, type SpaceFilterValue } from './components/consoleUtils';

/**
 * RÔLES ET ACCÈS — maquette `Console-Roles` (+ `-mobile`), passe 2, lot D.
 *
 * Trois cartes, comme la maquette : la matrice « Qui peut faire quoi » (composant
 * `RoleMatrix` du kit), « Rôles accordés récemment », et à droite « Accorder un rôle ».
 *
 * ⚠️ CE QUE L'ÉCRAN N'AFFIRME PAS :
 *  · la matrice est le PÉRIMÈTRE CIBLE du PRD rév. 6 (six rôles). En base, seuls `admin`
 *    et `support` existent aujourd'hui ; la carte le dit en clair sous la légende ;
 *  · « Rôles accordés récemment » lit le journal d'audit, qui n'a pas de producteur :
 *    état vide honnête ;
 *  · « Accorder un rôle » exige une callable serveur (`accorderRole`) qui n'existe pas.
 *    Le formulaire garde la forme de la maquette, désactivé : aucun écran n'écrit
 *    `users/{uid}.role` depuis le navigateur (règle 1 de `03-console-superadmin`).
 */

type Cell = 'y' | 'p' | 'n';
const ROLES = ['super', 'edu', 'club', 'mod', 'conception', 'support'] as const;
type Role = typeof ROLES[number];

const MATRIX: { id: string; space: AdminSpace | null; cells: Cell[] }[] = [
  { id: 'accounts',     space: null,         cells: ['y', 'n', 'n', 'n', 'n', 'n'] },
  { id: 'eduCourses',   space: 'edu',        cells: ['y', 'y', 'n', 'n', 'n', 'n'] },
  { id: 'eduCohorts',   space: 'edu',        cells: ['y', 'y', 'n', 'n', 'n', 'n'] },
  { id: 'clubSessions', space: 'club',       cells: ['y', 'n', 'y', 'n', 'n', 'n'] },
  { id: 'clubRanking',  space: 'club',       cells: ['y', 'n', 'y', 'n', 'n', 'n'] },
  { id: 'clubReports',  space: 'club',       cells: ['y', 'n', 'y', 'y', 'n', 'n'] },
  { id: 'conception',   space: 'conception', cells: ['y', 'n', 'n', 'n', 'y', 'p'] },
  { id: 'money',        space: null,         cells: ['y', 'p', 'p', 'n', 'p', 'n'] },
  { id: 'messages',     space: 'hub',        cells: ['y', 'n', 'n', 'n', 'p', 'y'] },
  { id: 'system',       space: null,         cells: ['y', 'n', 'n', 'n', 'n', 'n'] },
];

export default function AdminRoles() {
  const { t } = useTranslation('ecrans');
  const k = (s: string) => t(`console.rolesScreen.${s}`);
  const [space, setSpace] = useState<SpaceFilterValue>('all');

  const rows = MATRIX.filter((r) => space === 'all' || r.space === null || r.space === space);
  const roleName = (r: Role) => k(`role.${r}`);
  const chk = (c: Cell) => (
    <span className={`mm-chk ${c}`} aria-label={k(`cell.${c}`)}>{c === 'y' ? '✓' : c === 'p' ? k('readShort') : '—'}</span>
  );

  return (
    <ConsoleScreen label={t('console.roles.title')}>
      <SEOHead title={t('console.roles.title')} description={t('console.roles.empty')} noIndex />
      <ConsoleToolbar space={space} onSpace={setSpace} labels={spaceLabels(t, 'console.common')} hideSpacesOnPhone />

      <ConsoleGrid side={340}>
        <ConsoleStack>
          <ConsoleCard as="section" title={k('matrixTitle')} aside={<span className="hidden stack:inline">{k('matrixAside')}</span>}>
            {/* Bureau : la matrice du kit. */}
            <div className="hidden overflow-x-auto stack:block">
              <table className="mm-ctable" aria-label={k('matrixTitle')}>
                <thead>
                  <tr>
                    <th scope="col" className="whitespace-normal text-center leading-[1.3]">{k('colPermission')}</th>
                    {ROLES.map((r) => (
                      <th key={r} scope="col" className="whitespace-normal text-center leading-[1.3]">{roleName(r)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="min-w-[230px]"><b>{k(`perm.${row.id}`)}</b></td>
                      {row.cells.map((c, i) => <td key={i} className="text-center">{chk(c)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile : une ligne par permission, les rôles en pastilles (maquette mobile). */}
            <div className="stack:hidden">
              {rows.map((row) => (
                <div key={row.id} className="mm-mrow flex-col items-stretch gap-2">
                  <b className="text-[13.5px]">{k(`perm.${row.id}`)}</b>
                  <div className="flex flex-wrap gap-1.5">
                    {row.cells.map((c, i) => c === 'n' ? null : (
                      <ConsoleStatus key={i} tone={c === 'y' ? 'ok' : 'warn'} style={{ height: 22, fontSize: 11 }}>
                        {c === 'y' ? roleName(ROLES[i]) : `${roleName(ROLES[i])} · ${k('readLong')}`}
                      </ConsoleStatus>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 hidden flex-wrap gap-3.5 text-[12px] text-ink-2 stack:flex">
              <span>{chk('y')} {k('legendY')}</span>
              <span>{chk('p')} {k('legendP')}</span>
              <span>{chk('n')} {k('legendN')}</span>
            </div>
            <p className="m-0 mt-3 text-[12px] leading-[1.5] text-ink-3">{k('targetNote')}</p>
          </ConsoleCard>

          <ConsoleCard as="section" title={k('recentTitle')} className="hidden stack:block">
            <EmptyTable cols={[k('colWhen'), k('colBy'), k('colRole'), k('colTo'), k('colReason'), '']}>
              <HonestEmpty icon="shield" title={k('recentEmpty')} body={k('recentEmptyBody')} />
            </EmptyTable>
          </ConsoleCard>
        </ConsoleStack>

        <ConsoleCard as="section" title={k('grantTitle')}>
          <HonestEmpty icon="lock" title={k('grantOff')} body={k('grantOffBody')} />
          <div className="mt-1 flex flex-col gap-3" aria-disabled="true">
            {(['fRole', 'fSpace', 'fReason', 'fExpiry'] as const).map((f) => (
              <div key={f} className="mm-cfield">
                {k(f)}
                <span className={f === 'fReason' ? 'area' : undefined} style={{ color: 'var(--ink-3)' }}>{k(`${f}Ph`)}</span>
              </div>
            ))}
          </div>
          <CBtn tone="ink" disabled className="mt-3.5 h-[42px] w-full">{k('grantCta')}</CBtn>
          <p className="m-0 mt-2.5 text-[12px] leading-[1.5] text-ink-3">{k('grantNote')}</p>
        </ConsoleCard>
      </ConsoleGrid>
    </ConsoleScreen>
  );
}
