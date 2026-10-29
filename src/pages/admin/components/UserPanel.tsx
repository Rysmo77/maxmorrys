import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Num } from '@ds';
import { ConsoleCard, ConsoleStatus } from '../../../components/console';
import { useFormat } from '../../../hooks/useFormat';
import { tutorName } from '../../../lib/naming';
import type { User } from '../../../types';
import type { EditTab } from '../hooks/useAdminUsers';
import { CBtn, HonestEmpty } from './ConsoleParts';
import { initialsOf } from './consoleUtils';

/**
 * LA FICHE DU COMPTE SÉLECTIONNÉ — colonne de droite de `Console-Comptes`.
 *
 * Identité, pastilles d'état, deux relevés lus sur le compte, puis les actions de la
 * maquette. Chaque action ouvre ce qui EXISTE déjà : la fiche complète sur le bon onglet
 * (formations, quota Rysmo), l'écran Rôles, le journal. « Suspendre » n'a pas de
 * producteur : le bouton existe, désactivé. Les tuiles « Missions relues » et
 * « Signalements reçus » de la maquette ne sont pas relevées par compte : elles ne sont
 * pas posées.
 */
interface UserPanelProps {
  user: User | null;
  loading: boolean;
  asOf: Date;
  club?: ReactNode;
  hasClub?: boolean;
  onOpenFull: () => void;
  onOpenTab: (tab: EditTab) => void;
}

export default function UserPanel({ user, loading, asOf, club, hasClub, onOpenFull, onOpenTab }: UserPanelProps) {
  const { t } = useTranslation('admin');
  const { t: te } = useTranslation('admin');
  const k = (s: string, o?: Record<string, unknown>) => te(`p2.accounts.${s}`, o);
  const { formatDate } = useFormat();

  if (loading) {
    return <ConsoleCard as="section"><p className="m-0 text-meta-2 text-ink-2">{t('users.panelLoading')}</p></ConsoleCard>;
  }
  if (!user) {
    return <ConsoleCard as="section"><HonestEmpty icon="user" title={t('users.panelNone')} /></ConsoleCard>;
  }

  const name = user.displayName || user.email || t('users.noName');
  const roleLabel = user.role === 'admin' ? t('users.roleAdmin') : user.role === 'support' ? t('users.roleSupport') : t('users.roleStudent');

  return (
    <ConsoleCard as="section" aria-label={t('users.panelEyebrow')}>
      <div className="flex items-center gap-3">
        {user.photoURL
          ? <img src={user.photoURL} alt="" className="h-[52px] w-[52px] flex-none rounded-full object-cover" />
          : (
            <span className="mm-avatar flex-none" style={{ width: 52, height: 52, fontSize: 17, background: 'linear-gradient(135deg, var(--mm-bleu-f), var(--mm-violet-f))' }}>
              {initialsOf(name)}
            </span>
          )}
        <div className="min-w-0">
          <b className="block truncate text-[17px]">{name}</b>
          <span className="text-[12.5px] text-ink-3">
            {user.email}
            {user.createdAt && <> · {k('createdOn')} <Num value={formatDate(user.createdAt)} source="db" asOf={asOf} /></>}
          </span>
        </div>
      </div>

      <div className="my-3.5 flex flex-wrap gap-1.5">
        <ConsoleStatus tone={user.role === 'student' ? 'mute' : 'club'}>{roleLabel}</ConsoleStatus>
        {hasClub && club}
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-2">
        <div className="rounded-m p-3" style={{ background: 'var(--paper-2)' }}>
          <span className="text-[11.5px] text-ink-3">{t('users.docCity')}</span>
          <b className="mt-1 block text-[15px]">{user.city || <Num value={null} source="db" asOf={asOf} />}</b>
        </div>
        <div className="rounded-m p-3" style={{ background: 'var(--paper-2)' }}>
          <span className="text-[11.5px] text-ink-3">{t('users.docTutor')}</span>
          <b className="mt-1 block truncate text-[15px]">{tutorName(user)}</b>
        </div>
      </div>

      <b className="text-[13px]">{k('actions')}</b>
      <div className="mt-2.5 flex flex-col gap-2">
        <CBtn onClick={() => onOpenTab('formations')}>{k('aGrant')}</CBtn>
        <CBtn onClick={() => onOpenTab('rysmo')}>{k('aRysmo')}</CBtn>
        <CBtn href="/admin/roles">{k('aRole')}</CBtn>
        <CBtn href="/admin/journal">{k('aTraces')}</CBtn>
        <CBtn onClick={onOpenFull}>{t('users.panelOpenFull')}</CBtn>
        <CBtn tone="stop" disabled title={k('noBackend')}>{k('aSuspend')}</CBtn>
      </div>
      <p className="m-0 mt-3 text-[12px] leading-[1.5] text-ink-3">{k('panelNote')}</p>
    </ConsoleCard>
  );
}
