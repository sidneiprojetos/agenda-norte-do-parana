import { useState } from 'react';
import type { FC } from 'react';
import {
  BarChart3,
  CalendarDays,
  Settings,
  LogOut,
  Plus
} from 'lucide-react';
import { AppUser } from '../types';
import { logoutUser } from '../firebase';

interface AdminSidebarProps {
  currentUser: AppUser | null;
  pendingUsersCount?: number;
  onOpenCreateForm?: () => void;
  onOpenReports?: () => void;
  onViewSchedule?: () => void;
  onOpenAdmTools?: () => void;
  isViewingSchedule?: boolean;
  isViewingAdmTools?: boolean;
}

export const AdminSidebar: FC<AdminSidebarProps> = ({
  currentUser,
  pendingUsersCount = 0,
  onOpenCreateForm,
  onOpenReports,
  onViewSchedule,
  onOpenAdmTools,
  isViewingSchedule = false,
  isViewingAdmTools = false
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!currentUser) return null;

  const initials = (currentUser.displayName || currentUser.email || 'U')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navBtnBase =
    'flex flex-1 lg:flex-none items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95';

  return (
    <nav className="lg:sticky lg:top-4 flex flex-row flex-wrap lg:flex-col lg:flex-nowrap gap-1.5 rounded-2xl border border-zinc-800/80 bg-[#161619]/85 p-2 shadow-xl backdrop-blur-md lg:p-2.5">
      {/* Novo Evento: right after the top */}
      {onOpenCreateForm && (
        <button
          id="admin-create-note-btn"
          onClick={onOpenCreateForm}
          className="flex flex-1 lg:flex-none items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-2.5 text-xs font-bold shadow-md shadow-amber-900/30 transition active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Novo Evento</span>
        </button>
      )}

      <span className="hidden lg:flex items-center gap-1.5 px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        Painéis
      </span>

      {currentUser.isAdmin && onOpenAdmTools && (
        <button
          id="admin-adm-tools-btn"
          onClick={onOpenAdmTools}
          title="Painel administrativo: gestão de usuários, categorias e backup"
          className={`${navBtnBase} ${
            isViewingAdmTools
              ? 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300'
              : pendingUsersCount > 0
              ? 'border-fuchsia-500/80 bg-fuchsia-500/20 text-fuchsia-300 shadow-md shadow-fuchsia-950/40 animate-pulse'
              : 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300 hover:bg-fuchsia-500/20'
          }`}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Acesso Administrativo</span>
          {pendingUsersCount > 0 && (
            <span className="rounded-full bg-amber-400 text-black px-1.5 py-px text-[10px] font-black">
              {pendingUsersCount}
            </span>
          )}
        </button>
      )}

      {onViewSchedule && (
        <button
          id="view-schedule-btn"
          onClick={onViewSchedule}
          title="Visualizar toda a agenda"
          className={`${navBtnBase} ${
            isViewingSchedule
              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          }`}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Visualizar Agenda</span>
        </button>
      )}

      {onOpenReports && (
        <button
          id="admin-reports-btn"
          onClick={onOpenReports}
          title="Gerar agenda em PDF"
          className={`${navBtnBase} border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20`}
        >
          <BarChart3 className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Gerar Agenda em PDF</span>
        </button>
      )}

      {/* Logged-in user card (below all buttons) */}
      <div className="mt-1 flex w-full lg:w-auto items-center gap-2.5 rounded-xl bg-[#18181b]/90 border border-zinc-700/80 p-2 pr-1.5 shadow-md">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-black text-white shadow-md shadow-amber-900/40">
          {initials}
        </div>
        <div className="flex flex-col text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-zinc-100 truncate max-w-[90px] lg:max-w-[110px]">
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
          <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[110px] lg:max-w-[130px]">
            {currentUser.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sair da conta"
          className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 transition"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};
