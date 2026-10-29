import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { Field, Num, Skeleton, useToast } from '@ds';
import { ConsoleCard, ConsoleStatus } from '../../components/console';
import UserPanel from './components/UserPanel';
import { Pagination } from '@/components/dialogs';
import { usePagination } from '../../hooks/usePagination';
import { useFormat } from '../../hooks/useFormat';
import { useAdminUsers, type EditTab } from './hooks/useAdminUsers';
import { UserEditModal, CreateUserModal } from './components/UserEditModal';
import { getAllClubSubscriptions } from '../../lib/firestore';
import { captureError } from '../../lib/sentry';
import type { ClubDigitosSubscription, User } from '../../types';
import {
  CBtn, ConsoleChips, ConsoleGrid, ConsoleScreen, ConsoleToolbar, HonestEmpty,
} from './components/ConsoleParts';
import { initialsOf } from './components/consoleUtils';

/**
 * COMPTES — maquette `Console-Comptes` (+ `-mobile`), passe 2, lot D.
 *
 * « Créer un compte » en tête · la carte « Comptes » (puces de filtre comptées, table
 * Compte / Rôle / Club) · à droite la fiche du compte sélectionné, collante.
 *
 * Les colonnes « Cohorte » et « Dernière action » de la maquette ne sont pas posées :
 * aucune des deux n'est relevée par compte (pas de cohortes en base, pas de journal).
 * La colonne « Inscription » les remplace, parce qu'elle est lue. Le statut Club vient
 * des abonnements (`clubSubscriptions`), lus une fois.
 */

type Chip = 'all' | 'admin' | 'student' | 'support' | 'clubActive' | 'clubPending';

export default function AdminUsers() {
  const { t } = useTranslation('admin');
  const { t: te } = useTranslation('admin');
  const k = (s: string, o?: Record<string, unknown>) => te(`p2.accounts.${s}`, o);
  const { locale } = useFormat();
  const { addToast } = useToast();
  const state = useAdminUsers(addToast);

  const roleLabels: Record<User['role'], string> = {
    admin: t('users.roleAdmin'),
    support: t('users.roleSupport'),
    student: t('users.roleStudent'),
  };

  const {
    users, loading, search, setSearch, filtered,
    setEditUser, openEditUser, showAddUser, setShowAddUser,
  } = state;

  const [chip, setChip] = useState<Chip>('all');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [subs, setSubs] = useState<Map<string, ClubDigitosSubscription> | null>(null);
  /* L'onglet de la fiche à ouvrir APRÈS que la fiche a son compte : l'action « Octroi
     gracieux » ouvre la fiche sur ses formations, « quota Rysmo » sur son quota. */
  const [pendingTab, setPendingTab] = useState<EditTab | null>(null);
  const isWide = useMediaQuery('(min-width: 1080px)');

  const [asOf, setAsOf] = useState(() => new Date());
  useEffect(() => { if (!loading) setAsOf(new Date()); }, [users, loading]);

  useEffect(() => {
    getAllClubSubscriptions()
      .then((list) => {
        /* Le dernier abonnement de chaque personne fait foi. */
        const m = new Map<string, ClubDigitosSubscription>();
        [...list].sort((a, b) => (a.startedAt ?? '').localeCompare(b.startedAt ?? '')).forEach((s) => m.set(s.userId, s));
        setSubs(m);
      })
      .catch((e: unknown) => { captureError(e); setSubs(null); });
  }, []);

  useEffect(() => {
    if (pendingTab && state.editUser) {
      state.handleEditTabChange(pendingTab);
      setPendingTab(null);
    }
  }, [pendingTab, state]);

  const clubOf = (u: User) => subs?.get(u.uid) ?? null;
  const match = (u: User, c: Chip) => {
    if (c === 'all') return true;
    if (c === 'clubActive') return clubOf(u)?.status === 'active';
    if (c === 'clubPending') return clubOf(u)?.status === 'pending';
    return u.role === c;
  };

  const counts = useMemo(() => {
    const out = {} as Record<Chip, number>;
    (['all', 'admin', 'student', 'support', 'clubActive', 'clubPending'] as Chip[]).forEach((c) => {
      out[c] = users.filter((u) => match(u, c)).length;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, subs]);

  const shown = useMemo(() => filtered.filter((u) => match(u, chip)), [filtered, chip, subs]); // eslint-disable-line react-hooks/exhaustive-deps
  const { paged, page, totalPages, setPage } = usePagination(shown);
  const selected = shown.find((u) => u.uid === selectedUid) ?? paged[0] ?? null;

  const chips: { id: Chip; label: string; count?: ReactNode }[] = ([
    { id: 'all', label: k('chipAll') },
    { id: 'admin', label: k('chipAdmins') },
    { id: 'student', label: k('chipStudents') },
    { id: 'support', label: k('chipSupport') },
    ...(subs ? [
      { id: 'clubActive' as const, label: k('chipClubActive') },
      { id: 'clubPending' as const, label: k('chipClubPending') },
    ] : []),
  ] as { id: Chip; label: string }[]).map((c) => ({ ...c, count: loading ? undefined : <Num value={counts[c.id]} source="db" asOf={asOf} /> }));

  const roleTag = (u: User) => (
    <ConsoleStatus tone={u.role === 'student' ? 'mute' : 'club'}>{roleLabels[u.role]}</ConsoleStatus>
  );
  const clubTag = (u: User) => {
    const s = clubOf(u);
    if (!subs) return <Num value={null} source="db" asOf={asOf} />;
    if (!s) return <span className="text-ink-3">—</span>;
    const tone = s.status === 'active' ? 'ok' : s.status === 'pending' ? 'warn' : 'mute';
    const until = s.status === 'active' && s.expiresAt ? ` · ${new Date(s.expiresAt).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })}` : '';
    return <ConsoleStatus tone={tone}>{k(`club.${s.status}`)}{until}</ConsoleStatus>;
  };
  const avatar = (name: string, size: number) => (
    <span className="mm-avatar flex-none" style={{ width: size, height: size, fontSize: Math.round(size / 3), background: 'linear-gradient(135deg, var(--mm-bleu-f), var(--mm-teal-f))' }}>
      {initialsOf(name)}
    </span>
  );
  const nameOf = (u: User) => u.displayName || u.email || t('users.noName');
  const select = (u: User) => (isWide ? setSelectedUid(u.uid) : openEditUser(u));

  return (
    <div>
      <ConsoleScreen label={k('title')}>
        <ConsoleToolbar>
          <CBtn onClick={state.load} disabled={loading}>{t('users.refresh')}</CBtn>
          <CBtn tone="ink" icon="plus" onClick={() => setShowAddUser(true)}>{k('create')}</CBtn>
        </ConsoleToolbar>

        <ConsoleGrid side={360}>
          <ConsoleCard as="section" title={k('title')} aside={<span className="hidden stack:inline">{k('sortedBy')}</span>}>
            <ConsoleChips<Chip> label={k('chipsLabel')} items={chips} value={chip} onChange={(c) => { setChip(c); setPage(1); }} />
            <div className="mb-3 max-w-sm">
              <Field
                as="input"
                type="search"
                label={t('users.searchLabel')}
                hideLabel
                value={search}
                onChange={setSearch}
                placeholder={t('users.searchPlaceholder')}
                inputMode="search"
              />
            </div>

            {loading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={48} label={i === 0 ? t('users.loading') : undefined} />)}
              </div>
            ) : shown.length === 0 ? (
              <HonestEmpty icon="users" title={t('users.emptyTitle')} body={t('users.emptyBody')} />
            ) : (
              <>
                <div className="hidden overflow-x-auto stack:block">
                  <table className="mm-ctable" aria-label={t('users.listLabel')}>
                    <thead>
                      <tr>
                        <th scope="col">{k('colAccount')}</th>
                        <th scope="col">{k('colRole')}</th>
                        <th scope="col">{k('colClub')}</th>
                        <th scope="col">{k('colSignup')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((u) => (
                        <tr
                          key={u.uid}
                          className={isWide && selected?.uid === u.uid ? 'is-sel cursor-pointer' : 'cursor-pointer'}
                          onClick={() => select(u)}
                        >
                          <td>
                            <button type="button" onClick={() => select(u)} className="flex min-w-0 items-center gap-2.5 border-0 bg-transparent p-0 text-left text-ink">
                              {avatar(nameOf(u), 34)}
                              <span className="min-w-0">
                                <b className="block truncate">{nameOf(u)}</b>
                                {u.email && <small className="block truncate">{u.email}</small>}
                              </span>
                            </button>
                          </td>
                          <td>{roleTag(u)}</td>
                          <td>{clubTag(u)}</td>
                          <td className="text-ink-3">
                            <Num value={u.createdAt ? new Date(u.createdAt).toLocaleDateString(locale) : null} source="db" asOf={asOf} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="stack:hidden">
                  {paged.map((u) => (
                    <button key={u.uid} type="button" onClick={() => select(u)} className="mm-mrow w-full border-x-0 border-t-0 bg-transparent text-left">
                      {avatar(nameOf(u), 36)}
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-[14px]">{nameOf(u)}</b>
                        <span className="mt-1 flex flex-wrap gap-1.5">{roleTag(u)}{clubOf(u) && clubTag(u)}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex justify-center">
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </>
            )}
          </ConsoleCard>

          {isWide && (
            <div className="wide:sticky wide:top-5">
              <UserPanel
                user={selected}
                loading={loading}
                asOf={asOf}
                club={selected ? clubTag(selected) : null}
                hasClub={Boolean(selected && clubOf(selected))}
                onOpenFull={() => selected && openEditUser(selected)}
                onOpenTab={(tab) => { if (selected) { openEditUser(selected); setPendingTab(tab); } }}
              />
            </div>
          )}
        </ConsoleGrid>
      </ConsoleScreen>

      {/* ── Fiche d'édition ── */}
      <UserEditModal
        editUser={state.editUser}
        onClose={() => setEditUser(null)}
        editTab={state.editTab}
        editForm={state.editForm}
        setEditForm={state.setEditForm}
        saving={state.saving}
        handleEditTabChange={state.handleEditTabChange}
        handleSaveUser={state.handleSaveUser}
        userEnrollments={state.userEnrollments}
        allFormations={state.allFormations}
        loadingEnrollments={state.loadingEnrollments}
        addFormationId={state.addFormationId}
        setAddFormationId={state.setAddFormationId}
        addingFormation={state.addingFormation}
        removingId={state.removingId}
        unenrolledFormations={state.unenrolledFormations}
        handleAddEnrollment={state.handleAddEnrollment}
        handleRemoveEnrollment={state.handleRemoveEnrollment}
        clubSub={state.clubSub}
        loadingClubSub={state.loadingClubSub}
        togglingClub={state.togglingClub}
        handleGrantClub={state.handleGrantClub}
        handleRevokeClub={state.handleRevokeClub}
        rysmoQuota={state.rysmoQuota}
        loadingRysmo={state.loadingRysmo}
        togglingRysmo={state.togglingRysmo}
        addTokenAmount={state.addTokenAmount}
        setAddTokenAmount={state.setAddTokenAmount}
        handleResetRysmo={state.handleResetRysmo}
        handleAddRysmoTokens={state.handleAddRysmoTokens}
      />

      {/* ── Création de compte ── */}
      <CreateUserModal
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        addForm={state.addForm}
        setAddForm={state.setAddForm}
        creatingUser={state.creatingUser}
        handleCreateUser={state.handleCreateUser}
      />
    </div>
  );
}
