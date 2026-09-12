import React, { useRef, useState } from 'react';
import type { FC } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Plus,
  LogOut,
  Users,
  BarChart3,
  CalendarDays,
  ScrollText,
  Building2
} from 'lucide-react';
import { AppUser } from '../types';
import { loginWithGoogle, logoutUser, getAuthErrorMessage } from '../firebase';

interface AdminHeaderProps {
  currentUser: AppUser | null;
  totalNotes: number;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onResetData: () => void;
  onOpenCreateForm: () => void;
  onOpenReports?: () => void;
  onOpenUserManagement?: () => void;
  onViewSchedule?: () => void;
  onOpenAudit?: () => void;
  onOpenDivisions?: () => void;
  pendingUsersCount?: number;
  isViewingUserManagement?: boolean;
  isViewingSchedule?: boolean;
  isViewingAudit?: boolean;
}

export const AdminHeader: FC<AdminHeaderProps> = ({
  currentUser,
  totalNotes,
  onExportData,
  onImportData,
  onResetData,
  onOpenCreateForm,
  onOpenReports,
  onOpenUserManagement,
  onViewSchedule,
  onOpenAudit,
  onOpenDivisions,
  pendingUsersCount = 0,
  isViewingUserManagement = false,
  isViewingSchedule = false,
  isViewingAudit = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      e.target.value = '';
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
    } catch (err) {
      console.error('Erro no login com Google:', getAuthErrorMessage(err));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-slate-800/80 pb-5">
      {/* Top row: Title and Authentication / Profile status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand and Subtitle */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white truncate">
              Agenda Norte do Paraná
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {currentUser?.isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                PAINEL ADM
              </span>
            )}
            {/* Realtime sync badge */}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Firestore Tempo Real
            </span>
          </div>
        </div>

        {/* User Account / Gmail Login Card */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-3 rounded-2xl bg-[#18181b]/90 border border-zinc-700/80 p-1.5 pr-3 shadow-md">
              <div className="flex flex-col text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-zinc-100 max-w-[110px] sm:max-w-[160px] truncate">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  {currentUser.isAdmin ? (
                    <span className="rounded bg-amber-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                      ADM
                    </span>
                  ) : (
                    <span className="rounded bg-zinc-700 px-1.5 py-0.2 text-[9px] font-medium text-zinc-300">
                      Membro
                    </span>
                  )}
                </div>
                <span className="hidden sm:block text-[11px] text-zinc-400 font-mono max-w-[170px] truncate">
                  {currentUser.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Sair da conta"
                className="ml-1 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              id="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 rounded-2xl border border-zinc-700/80 bg-[#222226] hover:bg-[#2c2c31] px-3.5 py-2 text-xs font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingIn ? 'Entrando...' : 'Entrar com Gmail'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Action Bar (CRUD Tools, Export/Import, Reset) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="admin-create-note-btn"
            onClick={onOpenCreateForm}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-2.5 sm:px-3.5 py-2 text-xs font-semibold shadow-md shadow-amber-900/30 transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Nova Anotação</span>
          </button>

          {currentUser?.isAdmin && onOpenUserManagement && (
            <button
              id="admin-user-management-btn"
              onClick={onOpenUserManagement}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${
                isViewingUserManagement
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : pendingUsersCount > 0
                  ? 'border-amber-500/80 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-950/40 animate-pulse'
                  : 'border-zinc-700 bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span>Gestão de Usuários</span>
              {pendingUsersCount > 0 && (
                <span className="rounded-full bg-amber-400 text-black px-1.5 py-0.2 text-[10px] font-black">
                  {pendingUsersCount}
                </span>
              )}
            </button>
          )}

          {currentUser?.isAdmin && onOpenAudit && (
            <button
              id="admin-audit-btn"
              onClick={onOpenAudit}
              title="Verificar quem criou, editou, excluiu e acessou as anotações"
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${
                isViewingAudit
                  ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                  : 'border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'
              }`}
            >
              <ScrollText className="h-3.5 w-3.5" />
              <span>Auditoria</span>
            </button>
          )}

          {currentUser?.isAdmin && onOpenDivisions && (
            <button
              id="admin-divisions-btn"
              onClick={onOpenDivisions}
              title="Gerenciar as divisões disponíveis nas anotações"
              className="flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-300 transition hover:bg-teal-500/20 active:scale-95"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Divisões</span>
            </button>
          )}

          {onOpenReports && (
            <button
              id="admin-reports-btn"
              onClick={onOpenReports}
              title="Abrir relatórios com filtros"
              className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 active:scale-95"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Relatórios</span>
            </button>
          )}

          {onViewSchedule && (
            <button
              id="view-schedule-btn"
              onClick={onViewSchedule}
              title="Visualizar toda a agenda"
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${
                isViewingSchedule
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Visualizar Agenda</span>
            </button>
          )}

          <span className="text-xs text-zinc-400 px-1 whitespace-nowrap">
            Total: <strong className="text-zinc-200">{totalNotes}</strong>
          </span>

          {!currentUser && (
            <span className="text-[11px] text-zinc-400 hidden md:inline">
              (Admin registrado: <strong className="text-amber-400">imc.sidnei@gmail.com</strong> • Conecte com o Gmail para ativar o Painel ADM)
            </span>
          )}
        </div>

        {/* CRUD Database/Storage options for ADM */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            id="admin-export-btn"
            onClick={onExportData}
            title="Exportar anotações em arquivo JSON"
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/60 hover:bg-zinc-700/80 px-2.5 py-1.5 text-xs text-zinc-300 transition"
          >
            <Download className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {currentUser?.isAdmin && (
            <>
              <button
                id="admin-import-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Importar anotações de backup JSON"
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/60 hover:bg-zinc-700/80 px-2.5 py-1.5 text-xs text-zinc-300 transition"
              >
                <Upload className="h-3.5 w-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Importar</span>
              </button>

              <button
                id="admin-reset-btn"
                onClick={onResetData}
                title="Restaurar dados padrão no Firebase"
                className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Restaurar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
