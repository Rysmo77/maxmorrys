import {
  Search, Mail, Calendar, Shield, Loader2, UserCog, Plus,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
import { usePagination } from '../../hooks/usePagination';
import { useAdminUsers, roleLabels, roleVariants } from './hooks/useAdminUsers';
import { UserEditModal, CreateUserModal } from './components/UserEditModal';

export default function AdminUsers() {
  const { addToast } = useToast();
  const state = useAdminUsers(addToast);

  const {
    users, loading, search, setSearch, filtered, load,
    setEditUser,
    openEditUser,
    showAddUser, setShowAddUser,
  } = state;

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Utilisateurs</h1>
          <p className="text-sm text-neutral-500">
            {loading ? 'Chargement...' : `${users.length} utilisateur${users.length !== 1 ? 's' : ''} inscrit${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            Actualiser
          </Button>
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddUser(true)}>
            Ajouter un utilisateur
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden sm:table-cell">Rôle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">Inscription</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Aucun utilisateur trouvé.</td>
                  </tr>
                ) : (
                  paged.map((u) => (
                    <tr key={u.uid} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                                {(u.displayName || u.email || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{u.displayName || '—'}</p>
                            <p className="text-xs text-neutral-400 flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 flex-shrink-0" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={roleVariants[u.role]} size="sm">
                          <Shield className="w-3 h-3 mr-1" />
                          {roleLabels[u.role]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500 hidden md:table-cell">
                        {u.createdAt ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                          title="Gérer l'utilisateur"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex justify-center mt-4">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* ── Edit User Modal ── */}
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

      {/* ── Add User Modal ── */}
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
