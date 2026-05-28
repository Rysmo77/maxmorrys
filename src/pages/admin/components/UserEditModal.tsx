import {
  Loader2, X, Save, Trash2, BookOpen, CheckCircle, Crown, Plus, Bot, RotateCcw,
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
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
  return (
    <Modal open={!!editUser} onClose={onClose} title="Gestion de l'utilisateur">
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
              <p className="font-semibold text-neutral-900 dark:text-white">{editUser.displayName || '—'}</p>
              <p className="text-sm text-neutral-500">{editUser.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
            {([
              { id: 'info', label: 'Informations' },
              { id: 'formations', label: 'Formations' },
              { id: 'club', label: 'Club des Digitos', icon: Crown },
              { id: 'rysmo', label: 'Tokens IA', icon: Bot },
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
                  <label className="text-xs font-semibold text-neutral-500">Prénom</label>
                  <input value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="Prénom" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Nom</label>
                  <input value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Nom" className={inputCls} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Nom affiché</label>
                <input value={editForm.displayName} onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))} placeholder="Nom affiché" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Email</label>
                <input value={editForm.email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Téléphone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+221 77 000 00 00" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">WhatsApp</label>
                  <input value={editForm.whatsapp} onChange={(e) => setEditForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="+221 77 000 00 00" className={inputCls} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">LinkedIn</label>
                <input type="url" value={editForm.linkedin} onChange={(e) => setEditForm((p) => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Date de naissance</label>
                <input type="date" value={editForm.birthDate} onChange={(e) => setEditForm((p) => ({ ...p, birthDate: e.target.value }))} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Biographie</label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))} rows={2} placeholder="Biographie..." className={`${inputCls} resize-none`} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Rôle</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as User['role'] }))}
                  className={inputCls}
                >
                  <option value="student">Étudiant</option>
                  <option value="support">Support</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Button variant="outline" onClick={onClose}>Annuler</Button>
                <Button onClick={handleSaveUser} disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
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
                  <option value="">— Sélectionner une formation —</option>
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
                  Activer
                </Button>
              </div>

              {/* Enrolled list */}
              {loadingEnrollments ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
              ) : userEnrollments.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
                  <BookOpen className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Aucune formation activée.</p>
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
                          <p className="text-xs text-neutral-400">Progression : {enrollment.progress}%</p>
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
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">Club des Digitos</p>
                        <p className={`text-xs font-semibold ${
                          clubSub?.status === 'active' ? 'text-yellow-600 dark:text-yellow-400' :
                          clubSub?.status === 'pending' ? 'text-warning-600 dark:text-warning-400' :
                          'text-neutral-400'
                        }`}>
                          {!clubSub ? 'Aucun abonnement' :
                           clubSub.status === 'active' ? 'Actif' :
                           clubSub.status === 'pending' ? 'En attente de paiement' :
                           clubSub.status === 'expired' ? 'Expiré' : 'Annulé'}
                        </p>
                      </div>
                    </div>

                    {clubSub && (
                      <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400 mb-0">
                        <p>Début : {new Date(clubSub.startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p>Expiration : {new Date(clubSub.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p>Renouvellement : {clubSub.autoRenew ? 'Automatique' : 'Manuel'}</p>
                        <p>Montant : {clubSub.amount?.toLocaleString()} FCFA</p>
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
                        {togglingClub ? 'Activation...' : 'Accorder l\'accès Club (1 an)'}
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
                          Renouveler (+ 1 an)
                        </Button>
                        <button
                          onClick={() => handleRevokeClub('cancelled')}
                          disabled={togglingClub}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-error-300 dark:border-error-700 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {togglingClub ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                          Révoquer l'accès
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
                        {togglingClub ? 'Activation...' : 'Confirmer paiement & activer'}
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-neutral-400 text-center">
                    L'activation manuelle bypasse le paiement. Utiliser uniquement après confirmation de paiement hors-plateforme.
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
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">Tokens IA — Rysmo</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Quota du répétiteur IA</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/60 dark:bg-neutral-800/40 p-3">
                        <p className="text-xs text-neutral-500">Utilisées aujourd'hui</p>
                        <p className="text-xl font-black text-neutral-900 dark:text-white">{rysmoQuota?.dayCount ?? 0}</p>
                      </div>
                      <div className="rounded-xl bg-white/60 dark:bg-neutral-800/40 p-3">
                        <p className="text-xs text-neutral-500">Tokens prépayés</p>
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
                    Réinitialiser le compteur du jour
                  </button>

                  {/* Add tokens */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500">Offrir des tokens (ajout au solde prépayé)</label>
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
                        Ajouter
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
                    Les tokens ajoutés sont consommés en priorité et n'expirent pas.
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
  return (
    <Modal open={open} onClose={onClose} title="Ajouter un utilisateur">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Prénom</label>
            <input value={addForm.firstName} onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="Prénom" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Nom</label>
            <input value={addForm.lastName} onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Nom" className={inputCls} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Nom affiché <span className="text-error-500">*</span></label>
          <input value={addForm.displayName} onChange={(e) => setAddForm((p) => ({ ...p, displayName: e.target.value }))} placeholder="Nom affiché" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Email <span className="text-error-500">*</span></label>
          <input type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@exemple.com" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Mot de passe provisoire <span className="text-error-500">*</span></label>
          <input type="password" value={addForm.password} onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))} placeholder="Min. 6 caractères" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Téléphone</label>
          <input type="tel" value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+221 77 000 00 00" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Rôle</label>
          <select value={addForm.role} onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value as AddForm['role'] }))} className={inputCls}>
            <option value="student">Étudiant</option>
            <option value="support">Support</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <p className="text-xs text-neutral-400">L'utilisateur pourra changer son mot de passe après connexion.</p>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose} icon={<X className="w-4 h-4" />}>Annuler</Button>
          <Button
            onClick={handleCreateUser}
            disabled={creatingUser}
            icon={creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          >
            {creatingUser ? 'Création...' : 'Créer l\'utilisateur'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
