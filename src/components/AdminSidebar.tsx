import type { FC } from 'react';
import { Users, ScrollText, Building2, BarChart3, CalendarDays } from 'lucide-react';
import { AppUser } from '../types';

interface AdminSidebarProps {
  currentUser: AppUser | null;
  pendingUsersCount?: number;
  onOpenReports?: () => void;
  onOpenUserManagement?: () => void;
  onOpenAudit?: () => void;
  onOpenDivisions?: () => void;
  onViewSchedule?: () => void;
  isViewingUserManagement?: boolean;
  isViewingAudit?: boolean;
  isViewingSchedule?: boolean;
}

export const AdminSidebar: FC<AdminSidebarProps> = ({
  currentUser,
  pendingUsersCount = 0,
  onOpenReports,
  onOpenUserManagement,
  onOpenAudit,
  onOpenDivisions,
  onViewSchedule,
  isViewingUserManagement = false,
  isViewingAudit = false,
  isViewingSchedule = false
}) => {
  if (!currentUser) return null;

  return (
    <nav className="lg:sticky lg:top-4 flex flex-row lg:flex-col gap-1.5 rounded-2xl border border-zinc-800/80 bg-[#161619]/85 p-2 shadow-xl backdrop-blur-md lg:p-2.5">
      <span className="hidden lg:flex items-center gap-1.5 px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        Painéis
      </span>

      {currentUser.isAdmin && onOpenUserManagement && (
        <button
          id="admin-user-management-btn"
          onClick={onOpenUserManagement}
          className={`flex flex-1 lg:flex-none items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${
            isViewingUserManagement
              ? 'border-amber-500 bg-amber-500/20 text-amber-300'
              : pendingUsersCount > 0
              ? 'border-amber-500/80 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-950/40 animate-pulse'
              : 'border-zinc-700 bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700'
          }`}
        >
          <Users className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="whitespace-nowrap">Gestão de Usuários</span>
          {pendingUsersCount > 0 && (
            <span className="ml-auto rounded-full bg-amber-400 text-black px-1.5 py-0.2 text-[10px] font-black">
              {pendingUsersCount}
            </span>
          )}
        </button>
      )}

      {currentUser.isAdmin && onOpenAudit && (
        <button
          id="admin-audit-btn"
          onClick={onOpenAudit}
          title="Verificar quem criou, editou, excluiu e acessou as anotações"
          className={`flex flex-1 lg:flex-none items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${
            isViewingAudit
              ? 'border-violet-500 bg-violet-500/20 text-violet-300'
              : 'border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'
          }`}
        >
          <ScrollText className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Auditoria</span>
        </button>
      )}

      {currentUser.isAdmin && onOpenDivisions && (
        <button
          id="admin-divisions-btn"
          onClick={onOpenDivisions}
          title="Gerenciar as divisões disponíveis nas anotações"
          className="flex flex-1 lg:flex-none items-center gap-2.5 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-300 transition hover:bg-teal-500/20 active:scale-95"
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Divisões</span>
        </button>
      )}

      {onOpenReports && (
        <button
          id="admin-reports-btn"
          onClick={onOpenReports}
          title="Abrir relatórios com filtros"
          className="flex flex-1 lg:flex-none items-center gap-2.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 active:scale-95"
        >
          <BarChart3 className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Relatórios</span>
        </button>
      )}

      {onViewSchedule && (
        <button
          id="view-schedule-btn"
          onClick={onViewSchedule}
          title="Visualizar toda a agenda"
          className={`flex flex-1 lg:flex-none items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${
            isViewingSchedule
              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          }`}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Visualizar Agenda</span>
        </button>
      )}
    </nav>
  );
};