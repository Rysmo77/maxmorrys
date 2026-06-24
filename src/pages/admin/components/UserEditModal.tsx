import { useTranslation } from 'react-i18next';
import {
  Loader2, X, Save, Trash2, BookOpen, CheckCircle, Crown, Plus, Bot, RotateCcw,
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { useFormat } from '../../../hooks/useFormat';
import type { User, Enrollment, Formation, ClubDigitosSubscription } from '../../../types';
import type { EditTab, EditForm, AddForm } from '../hooks/useAdminUsers';
import { inputCls } from '../hooks/useAdminUsers';

/* ── Edit User Modal ── */

interface UserEditModalProps {
  editUser: User | null;
  onClose: () => void;
  editTab: EditTab;
  editForm: EditForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditForm>>;
  saving: boolean;
  handleEditTabChange: (tab: EditTab) => void;
  handleSaveUser: () => void;
  // Formations tab
  userEnrollments: Enrollment[];
  allFormations: Formation[];
  loadingEnrollments: boolean;
  addFormationId: string;
  setAddFormationId: (id: string) => void;
  addingFormation: boolean;
  removingId: string | null;
  unenrolledFormations: Formation[];
  handleAddEnrollment: () => void;
  handleRemoveEnrollment: (enrollment: { id: string; formationId: string }) => void;
  // Club tab
  clubSub: ClubDigitosSubscription | null;
  loadingClubSub: boolean;
  togglingClub: boolean;
  handleGrantClub: () => void;
  handleRevokeClub: (status: ClubDigitosSubscription['status']) => void;
  // Rysmo (tokens IA) tab
  rysmoQuota: { dayKey: string | null; dayCount: number; packBalance: number } | null;
  loadingRysmo: boolean;
  togglingRysmo: boolean;
  addTokenAmount: string;
  setAddTokenAmount: (v: string) => void;
  handleResetRysmo: () => void;
  handleAddRysmoTokens: () => void;
}

export function UserEditModal({
  editUser, onClose, editTab, editForm, setEditForm, saving,
  handleEditTabChange, handleSaveUser,
  userEnrollments, allFormations, loadingEnrollments,
  addFormationId, setAddFormationId, addingFormation, removingId,
  unenrolledFormations, handleAddEnrollment, handleRemoveEnrollment,
  clubSub, loadingClubSub, togglingClub, handleGrantClub, handleRevokeClub,
  rysmoQuota, loadingRysmo, togglingRysmo, addTokenAmount, setAddTokenAmount,
  handleResetRysmo, handleAddRysmoTokens,
}: UserEditModalProps) {
  // Only an admin may grant the 'admin' role. Firestore rules enforce this
  // server-side too; gating the option avoids a misleading affordance for support.
  const { t } = useTranslation('adminClub');
  const { locale } = useFormat();
  const { userData } = useAuth();
  const canAssignAdmin = userData?.role === 'admin';
  return (
    <Modal open={!!editUser} onClose={onClose} title={t('userEdit.title')}>
      {editUser && (
        <div className="space-y-4">
          {/* User header */}
          <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {editUser.photoURL ? (
                <img src={editUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                  {(editUser.displayName || editUser.email || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">{editUser.displayName || t('userEdit.noName')}</p>
              <p className="text-sm text-neutral-500">{editUser.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
            {([
              { id: 'info', label: t('userEdit.tabs.info') },
              { id: 'formations', label: t('userEdit.tabs.formations') },
              { id: 'club', label: t('userEdit.tabs.club'), icon: Crown },
              { id: 'rysmo', label: t('userEdit.tabs.rysmo'), icon: Bot },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleEditTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  editTab === tab.id
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {'icon' in tab && <tab.icon className="w-3.5 h-3.5 text-yellow-500" />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Info tab */}
          {editTab === 'info' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">{t('userEdit.info.firstName')}</label>
                  <input value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} placeholder={t('userEdit.info.firstName')} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">{t('userEdit.info.lastName')}</label>
                  <input value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} placeholder={t('userEdit.info.lastName')} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('userEdit.info.displayName')}</label>
                <input value={editForm.displayName} onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))} placeholder={t('userEdit.info.displayName')} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('userEdit.info.email')}</label>
                <input value={editForm.email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">{t('userEdit.info.phone')}</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder={t('userEdit.info.phonePlaceholder')} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">{t('userEdit.info.whatsapp')}</label>
                  <input value={editForm.whatsapp} onChange={(e) => setEditForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder={t('userEdit.info.phonePlaceholder')} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('userEdit.info.linkedin')}</label>
                <input type="url" value={editForm.linkedin} onChange={(e) => setEditForm((p) => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('userEdit.info.birthDate')}</label>
                <input type="date" value={editForm.birthDate} onChange={(e) => setEditForm((p) => ({ ...p, birthDate: e.target.value }))} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('userEdit.info.bio')}</label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))} rows={2} placeholder={t('userEdit.info.bioPlaceholder')} className={`${inputCls} resize-none`} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">{t('userEdit.info.role')}</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as User['role'] }))}
                  className={inputCls}
                >
                  <option value="student">{t('userEdit.info.roleStudent')}</option>
                  <option value="support">{t('userEdit.info.roleSupport')}</option>
                  {(canAssignAdmin || editForm.role === 'admin') && <option value="admin">{t('userEdit.info.roleAdmin')}</option>}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Button variant="outline" onClick={onClose}>{t('userEdit.info.cancel')}</Button>
                <Button onClick={handleSaveUser} disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                  {saving ? t('userEdit.info.saving') : t('userEdit.info.save')}
                </Button>
              </div>
            </div>
          )}

          {/* Formations tab */}
          {editTab === 'formations' && (
            <div className="space-y-4">
              {/* Add formation */}
              <div className="flex gap-2">
                <select
                  value={addFormationId}
                  onChange={(e) => setAddFormationId(e.target.value)}
                  className={`${inputCls} flex-1`}
                >
                  <option value="">{t('userEdit.formations.selectPlaceholder')}</option>
                  {unenrolledFormations.map((f) => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleAddEnrollment}
                  disabled={!addFormationId || addingFormation}
                  icon={addingFormation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                >
                  {t('userEdit.formations.activate')}
                </Button>
              </div>

              {/* Enrolled list */}
              {loadingEnrollments ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
              ) : userEnrollments.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
                  <BookOpen className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">{t('userEdit.formations.empty')}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userEnrollments.map((enrollment) => {
                    const formation = allFormations.find((f) => f.id === enrollment.formationId);
                    return (
                      <div key={enrollment.id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${enrollment.progress === 100 ? 'text-success-500' : 'text-neutral-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                            {formation?.title ?? enrollment.formationId}
                          </p>
                          <p className="text-xs text-neutral-400">{t('userEdit.formations.progress', { progress: enrollment.progress })}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveEnrollment(enrollment)}
                          disabled={removingId === enrollment.id}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors flex-shrink-0"
                        >
                          {removingId === enrollment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Club des Digitos tab */}
          {editTab === 'club' && (
            <div className="space-y-4">
              {loadingClubSub ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
              ) : (
                <>
                  {/* Status card */}
                  <div className={`rounded-2xl p-5 border ${
                    clubSub?.status === 'active'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : clubSub?.status === 'pending'
                      ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                      : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        clubSub?.status === 'active'
                          ? 'bg-yellow-200 dark:bg-yellow-800/50'
                          : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}>
                        <Crown className={`w-5 h-5 ${clubSub?.status === 'active' ? 'text-yellow-600 dark:text-yellow-400' : 'text-neutral-400'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">{t('userEdit.club.title')}</p>
                        <p className={`text-xs font-semibold ${
                          clubSub?.status === 'active' ? 'text-yellow-600 dark:text-yellow-400' :
                          clubSub?.status === 'pending' ? 'text-warning-600 dark:text-warning-400' :
                          'text-neutral-400'
                        }`}>
                          {!clubSub ? t('userEdit.club.noSubscription') :
                           clubSub.status === 'active' ? t('userEdit.club.statusActive') :
                           clubSub.status === 'pending' ? t('userEdit.club.statusPending') :
                           clubSub.status === 'expired' ? t('userEdit.club.statusExpired') : t('userEdit.club.statusCancelled')}
                        </p>
                      </div>
                    </div>

                    {clubSub && (
                      <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400 mb-0">
                        <p>{t('userEdit.club.start', { date: new Date(clubSub.startedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}</p>
                        <p>{t('userEdit.club.expiration', { date: new Date(clubSub.expiresAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}</p>
                        <p>{t('userEdit.club.renewal', { value: clubSub.autoRenew ? t('userEdit.club.renewalAuto') : t('userEdit.club.renewalManual') })}</p>
                        <p>{t('userEdit.club.amount', { amount: clubSub.amount?.toLocaleString(locale) ?? '' })}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {(!clubSub || clubSub.status !== 'active') && (
                      <Button
                        className="w-full"
                        onClick={handleGrantClub}
                        disabled={togglingClub}
                        icon={togglingClub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                      >
                        {togglingClub ? t('userEdit.club.granting') : t('userEdit.club.grant')}
                      </Button>
                    )}

                    {clubSub?.status === 'active' && (
                      <>
                        <Button
                          className="w-full"
                          onClick={() => {
                            // Renew 1 more year from now
                            handleGrantClub();
                          }}
                          disabled={togglingClub}
                          variant="outline"
                          icon={togglingClub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                        >
                          {t('userEdit.club.renew')}
                        </Button>
                        <button
                          onClick={() => handleRevokeClub('cancelled')}
                          disabled={togglingClub}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-error-300 dark:border-error-700 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {togglingClub ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                          {t('userEdit.club.revoke')}
                        </button>
                      </>
                    )}

                    {clubSub?.status === 'pending' && (
                      <Button
                        className="w-full"
                        onClick={() => handleRevokeClub('active')}
                        disabled={togglingClub}
                        icon={togglingClub ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      >
                        {togglingClub ? t('userEdit.club.granting') : t('userEdit.club.confirmPayment')}
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-neutral-400 text-center">
                    {t('userEdit.club.note')}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Tokens IA (Rysmo) tab */}
          {editTab === 'rysmo' && (
            <div className="space-y-4">
              {loadingRysmo ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
              ) : (
                <>
                  {/* Status card */}
                  <div className="rounded-2xl p-5 border bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-200 dark:bg-teal-800/50 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">{t('userEdit.rysmo.title')}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('userEdit.rysmo.subtitle')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/60 dark:bg-neutral-800/40 p-3">
                        <p className="text-xs text-neutral-500">{t('userEdit.rysmo.usedToday')}</p>
                        <p className="text-xl font-black text-neutral-900 dark:text-white">{rysmoQuota?.dayCount ?? 0}</p>
                      </div>
                      <div className="rounded-xl bg-white/60 dark:bg-neutral-800/40 p-3">
                        <p className="text-xs text-neutral-500">{t('userEdit.rysmo.prepaid')}</p>
                        <p className="text-xl font-black text-teal-600 dark:text-teal-400">{rysmoQuota?.packBalance ?? 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reset daily counter */}
                  <button
                    onClick={handleResetRysmo}
                    disabled={togglingRysmo}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {togglingRysmo ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    {t('userEdit.rysmo.reset')}
                  </button>

                  {/* Add tokens */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500">{t('userEdit.rysmo.addLabel')}</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={addTokenAmount}
                        onChange={(e) => setAddTokenAmount(e.target.value)}
                        className={`${inputCls} flex-1`}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddRysmoTokens}
                        disabled={togglingRysmo}
                        icon={togglingRysmo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      >
                        {t('userEdit.rysmo.add')}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {['30', '100', '300'].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setAddTokenAmount(preset)}
                          className="flex-1 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:border-teal-400 hover:text-teal-600 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 text-center">
                    {t('userEdit.rysmo.note')}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ── Create User Modal ── */

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  addForm: AddForm;
  setAddForm: React.Dispatch<React.SetStateAction<AddForm>>;
  creatingUser: boolean;
  handleCreateUser: () => void;
}

export function CreateUserModal({
  open, onClose, addForm, setAddForm, creatingUser, handleCreateUser,
}: CreateUserModalProps) {
  const { t } = useTranslation('adminClub');
  return (
    <Modal open={open} onClose={onClose} title={t('userCreate.title')}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">{t('userCreate.firstName')}</label>
            <input value={addForm.firstName} onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))} placeholder={t('userCreate.firstName')} className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">{t('userCreate.lastName')}</label>
            <input value={addForm.lastName} onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))} placeholder={t('userCreate.lastName')} className={inputCls} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">{t('userCreate.displayName')} <span className="text-error-500">*</span></label>
          <input value={addForm.displayName} onChange={(e) => setAddForm((p) => ({ ...p, displayName: e.target.value }))} placeholder={t('userCreate.displayName')} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">{t('userCreate.email')} <span className="text-error-500">*</span></label>
          <input type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder={t('userCreate.emailPlaceholder')} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">{t('userCreate.password')} <span className="text-error-500">*</span></label>
          <input type="password" value={addForm.password} onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))} placeholder={t('userCreate.passwordPlaceholder')} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">{t('userCreate.phone')}</label>
          <input type="tel" value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))} placeholder={t('userCreate.phonePlaceholder')} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">{t('userCreate.role')}</label>
          {/* No 'admin' option: the adminCreateUser Cloud Function never creates
              admins (it forces student/support). Promote to admin via the edit modal. */}
          <select value={addForm.role} onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value as AddForm['role'] }))} className={inputCls}>
            <option value="student">{t('userCreate.roleStudent')}</option>
            <option value="support">{t('userCreate.roleSupport')}</option>
          </select>
        </div>
        <p className="text-xs text-neutral-400">{t('userCreate.passwordNote')}</p>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose} icon={<X className="w-4 h-4" />}>{t('userCreate.cancel')}</Button>
          <Button
            onClick={handleCreateUser}
            disabled={creatingUser}
            icon={creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          >
            {creatingUser ? t('userCreate.creating') : t('userCreate.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
