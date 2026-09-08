import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Clock,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  ArrowLeft,
  Filter,
  AlertTriangle,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';
import { UserProfile, UserRole, UserStatus } from '../types';
import {
  subscribeToAllUsers,
  approveUser,
  rejectUser,
  updateUserDetails,
  deleteUser
} from '../services/userService';
import { isUserAdmin } from '../firebase';

interface UserManagementDashboardProps {
  currentAdminEmail: string;
  onBackToAgenda: () => void;
  onShowToast: (msg: string) => void;
}

export function UserManagementDashboard({
  currentAdminEmail,
  onBackToAgenda,
  onShowToast
}: UserManagementDashboardProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editStatus, setEditStatus] = useState<UserStatus>('pending');
  const [editDivision, setEditDivision] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Subscribe to real-time users from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((userList) => {
      setUsers(userList);
    });
    return () => unsubscribe();
  }, []);

  // Quick Approve
  const handleApprove = async (user: UserProfile) => {
    setIsProcessing(user.uid);
    try {
      await approveUser(user.uid, currentAdminEmail);
      onShowToast(`Usuário ${user.displayName || user.email} aprovado com sucesso!`);
    } catch (err) {
      console.error('Error approving user:', err);
      onShowToast('Erro ao aprovar usuário no Firebase.');
    } finally {
      setIsProcessing(null);
    }
  };

  // Quick Reject
  const handleReject = async (user: UserProfile) => {
    if (isUserAdmin(user.email)) {
      onShowToast('Não é possível recusar o Administrador Master.');
      return;
    }
    setIsProcessing(user.uid);
    try {
      await rejectUser(user.uid);
      onShowToast(`Acesso de ${user.displayName || user.email} foi recusado.`);
    } catch (err) {
      console.error('Error rejecting user:', err);
      onShowToast('Erro ao recusar usuário.');
    } finally {
      setIsProcessing(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.displayName || '');
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditDivision(user.division || 'Norte do Paraná');
    setEditNotes(user.notes || '');
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Protection: do not demote Sidnei
    const isMaster = isUserAdmin(editingUser.email);
    const finalRole: UserRole = isMaster ? 'admin' : editRole;
    const finalStatus: UserStatus = isMaster ? 'approved' : editStatus;

    setIsProcessing(editingUser.uid);
    try {
      await updateUserDetails(editingUser.uid, {
        displayName: editName.trim() || editingUser.email?.split('@')[0] || 'Membro',
        role: finalRole,
        status: finalStatus,
        division: editDivision.trim() || 'Norte do Paraná',
        notes: editNotes.trim()
      });
      onShowToast(`Dados de ${editName || editingUser.email} atualizados com sucesso!`);
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      onShowToast('Erro ao salvar dados do usuário no Firestore.');
    } finally {
      setIsProcessing(null);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (isUserAdmin(userToDelete.email)) {
      onShowToast('O Administrador Master não pode ser excluído.');
      setUserToDelete(null);
      return;
    }

    setIsProcessing(userToDelete.uid);
    try {
      await deleteUser(userToDelete.uid);
      onShowToast(`Usuário ${userToDelete.displayName || userToDelete.email} foi excluído.`);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      onShowToast('Erro ao excluir usuário do Firestore.');
    } finally {
      setIsProcessing(null);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    // Search match
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (u.displayName?.toLowerCase().includes(search) ?? false) ||
      (u.email?.toLowerCase().includes(search) ?? false) ||
      (u.division?.toLowerCase().includes(search) ?? false);

    if (!matchesSearch) return false;

    // Tab match
    if (activeTab === 'pending') return u.status === 'pending';
    if (activeTab === 'approved') return u.status === 'approved';
    if (activeTab === 'rejected') return u.status === 'rejected';
    return true;
  });

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const approvedCount = users.filter((u) => u.status === 'approved').length;
  const rejectedCount = users.filter((u) => u.status === 'rejected').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div id="user-management-dashboard" className="flex flex-col gap-6">
      {/* Top Bar with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <button
              id="back-to-agenda-btn"
              onClick={onBackToAgenda}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar para a Agenda</span>
            </button>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-400">
              <Shield className="h-3.5 w-3.5" />
              Painel ADM
            </span>
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-black text-white tracking-tight">
            Gestão de Usuários e Aprovações
          </h2>
          <p className="text-xs text-zinc-400">
            Aprove quem pode acessar a Agenda Norte do Paraná, edite permissões e gerencie integrantes.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-xs">
          <div className="flex flex-col text-right">
            <span className="text-[11px] text-zinc-400">Logado como ADM:</span>
            <span className="font-mono font-bold text-amber-400 text-xs">
              {currentAdminEmail}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Users */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Total de Cadastros</span>
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{users.length}</p>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            pendingCount > 0
              ? 'border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-950/20 hover:bg-amber-500/15'
              : 'border-zinc-800 bg-zinc-900/60'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold flex items-center gap-1">
              {pendingCount > 0 && <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />}
              Pendentes
            </span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-300">{pendingCount}</p>
        </div>

        {/* Approved Members */}
        <div
          onClick={() => setActiveTab('approved')}
          className="cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-emerald-500/40 transition"
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Aprovados</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-300">{approvedCount}</p>
        </div>

        {/* Admins */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-medium">Administradores</span>
            <Shield className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-400">{adminCount}</p>
        </div>
      </div>

      {/* Search & Tabs Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-3 h-4 w-4 my-auto text-zinc-400" />
          <input
            id="search-users-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cidade..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 py-2 pl-9 pr-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'all'
                ? 'bg-zinc-700 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-amber-400'
            }`}
          >
            <span>Pendentes</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-400/30 text-amber-200 px-1.5 py-0.2 text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'approved'
                ? 'bg-emerald-700 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-emerald-400'
            }`}
          >
            Aprovados ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'rejected'
                ? 'bg-rose-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-rose-400'
            }`}
          >
            Recusados ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="flex flex-col gap-3">
        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-400">
            <Users className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-300">Nenhum usuário encontrado</p>
            <p className="text-xs text-zinc-500 mt-1">
              {activeTab === 'pending'
                ? 'Não há solicitações pendentes de aprovação no momento.'
                : 'Nenhum cadastro corresponde ao filtro ou busca selecionada.'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isMaster = isUserAdmin(user.email);
            const isPending = user.status === 'pending';
            const isApproved = user.status === 'approved';
            const isRejected = user.status === 'rejected';

            return (
              <div
                key={user.uid}
                id={`user-card-${user.uid}`}
                className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                  isPending
                    ? 'border-amber-500/50 bg-amber-950/15 hover:bg-amber-950/25'
                    : 'border-zinc-800 bg-[#161619]/90 hover:border-zinc-700'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuário'}
                      className="h-12 w-12 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-base flex-shrink-0">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">
                        {user.displayName || 'Membro sem nome'}
                      </span>

                      {/* Role Badge */}
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                          <Shield className="h-3 w-3" />
                          ADM
                        </span>
                      ) : (
                        <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                          Membro
                        </span>
                      )}

                      {/* Status Badge */}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          <Check className="h-3 w-3" />
                          Aprovado
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                          <X className="h-3 w-3" />
                          Recusado
                        </span>
                      )}
                    </div>

                    {/* Email and Meta info */}
                    <span className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                      {user.email}
                    </span>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 mt-1">
                      {user.division && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <MapPin className="h-3 w-3 text-amber-400" />
                          {user.division}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Cadastrado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      {user.approvedBy && (
                        <span className="text-zinc-400">
                          Aprovado por: {user.approvedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                  {/* Approve button */}
                  {isPending && (
                    <button
                      id={`approve-user-${user.uid}`}
                      onClick={() => handleApprove(user)}
                      disabled={isProcessing === user.uid}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>Aprovar Acesso</span>
                    </button>
                  )}

                  {/* Reject button for pending or approved */}
                  {!isMaster && (isPending || isApproved) && (
                    <button
                      id={`reject-user-${user.uid}`}
                      onClick={() => handleReject(user)}
                      disabled={isProcessing === user.uid}
                      className="flex items-center gap-1 rounded-xl border border-rose-900/60 bg-rose-950/30 hover:bg-rose-950/60 px-2.5 py-2 text-xs font-semibold text-rose-300 transition active:scale-95 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{isPending ? 'Recusar' : 'Bloquear'}</span>
                    </button>
                  )}

                  {/* If rejected, allow re-approving */}
                  {isRejected && (
                    <button
                      onClick={() => handleApprove(user)}
                      disabled={isProcessing === user.uid}
                      className="flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Reaprovar</span>
                    </button>
                  )}

                  {/* Edit User Button */}
                  <button
                    id={`edit-user-${user.uid}`}
                    onClick={() => openEditModal(user)}
                    className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition"
                    title="Editar informações do usuário"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Editar</span>
                  </button>

                  {/* Delete User Button (not allowed for Master Admin) */}
                  {!isMaster && (
                    <button
                      id={`delete-user-${user.uid}`}
                      onClick={() => setUserToDelete(user)}
                      className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-rose-950/50 hover:border-rose-800/80 p-2 text-zinc-400 hover:text-rose-400 transition"
                      title="Excluir usuário permanentemente"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-amber-400" />
                Editar Usuário
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome Completo / Apelido no Clube
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  E-mail Google (Vinculado)
                </label>
                <input
                  type="text"
                  value={editingUser.email || ''}
                  disabled
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-500 font-mono cursor-not-allowed"
                />
              </div>

              {/* Division / Cidade */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Regional / Subdivisão / Cidade
                </label>
                <input
                  type="text"
                  value={editDivision}
                  onChange={(e) => setEditDivision(e.target.value)}
                  placeholder="Ex: Londrina, Maringá, Apucarana, etc."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Status and Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Status de Acesso
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                    disabled={isUserAdmin(editingUser.email)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-xs sm:text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="approved">Aprovado (Permitido)</option>
                    <option value="pending">Pendente (Aguardando)</option>
                    <option value="rejected">Recusado / Bloqueado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Cargo / Nível
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    disabled={isUserAdmin(editingUser.email)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-xs sm:text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="member">Membro</option>
                    <option value="admin">Administrador (ADM)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Observações Internas (opcional)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Integrante com colete, padrinho, etc."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing === editingUser.uid}
                  className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {isProcessing === editingUser.uid ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-rose-900/60 bg-[#141417] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-950/60 border border-rose-900">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Excluir Usuário</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Tem certeza que deseja excluir o cadastro de{' '}
              <strong className="text-white">{userToDelete.displayName || userToDelete.email}</strong>?
            </p>
            <p className="mt-2 text-[11px] text-zinc-400">
              O registro deste usuário será removido do Firebase Firestore. Caso ele tente entrar novamente com o Google, voltará para a fila de solicitação pendente.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isProcessing === userToDelete.uid}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50"
              >
                {isProcessing === userToDelete.uid ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
