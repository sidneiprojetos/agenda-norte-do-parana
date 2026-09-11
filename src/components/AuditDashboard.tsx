import { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import {
  ArrowLeft,
  Shield,
  Search,
  Eye,
  Pencil,
  Trash2,
  Plus,
  LogIn,
  Download,
  Upload,
  RotateCcw,
  UserCheck,
  Ban,
  UserX,
  Activity,
  type LucideIcon
} from 'lucide-react';
import { AuditLog } from '../types';
import { subscribeToAuditLogs } from '../services/auditService';
import { formatDateTimeBR } from '../utils/dateUtils';

interface AuditDashboardProps {
  onBackToAgenda: () => void;
}

type FilterKey = 'all' | 'create' | 'update' | 'delete' | 'view' | 'login' | 'user' | 'data';

interface ActionMeta {
  label: string;
  icon: LucideIcon;
  iconClass: string;
  chipClass: string;
}

const ACTION_META: Record<string, ActionMeta> = {
  create: {
    label: 'Criou anotação',
    icon: Plus,
    iconClass: 'text-emerald-400',
    chipClass: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
  },
  update: {
    label: 'Editou anotação',
    icon: Pencil,
    iconClass: 'text-sky-400',
    chipClass: 'bg-sky-500/10 border-sky-500/40 text-sky-300'
  },
  delete: {
    label: 'Excluiu anotação',
    icon: Trash2,
    iconClass: 'text-rose-400',
    chipClass: 'bg-rose-500/10 border-rose-500/40 text-rose-300'
  },
  view: {
    label: 'Visualizou anotação',
    icon: Eye,
    iconClass: 'text-violet-400',
    chipClass: 'bg-violet-500/10 border-violet-500/40 text-violet-300'
  },
  login: {
    label: 'Acesso ao sistema',
    icon: LogIn,
    iconClass: 'text-amber-400',
    chipClass: 'bg-amber-500/10 border-amber-500/40 text-amber-300'
  },
  logout: {
    label: 'Saiu do sistema',
    icon: LogIn,
    iconClass: 'text-zinc-400',
    chipClass: 'bg-zinc-500/10 border-zinc-500/40 text-zinc-300'
  },
  export: {
    label: 'Exportou backup',
    icon: Download,
    iconClass: 'text-sky-400',
    chipClass: 'bg-sky-500/10 border-sky-500/40 text-sky-300'
  },
  import: {
    label: 'Importou backup',
    icon: Upload,
    iconClass: 'text-orange-400',
    chipClass: 'bg-orange-500/10 border-orange-500/40 text-orange-300'
  },
  reset: {
    label: 'Restaurou dados padrão',
    icon: RotateCcw,
    iconClass: 'text-orange-400',
    chipClass: 'bg-orange-500/10 border-orange-500/40 text-orange-300'
  },
  approve: {
    label: 'Aprovou usuário',
    icon: UserCheck,
    iconClass: 'text-emerald-400',
    chipClass: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
  },
  reject: {
    label: 'Recusou usuário',
    icon: Ban,
    iconClass: 'text-rose-400',
    chipClass: 'bg-rose-500/10 border-rose-500/40 text-rose-300'
  },
  block: {
    label: 'Bloqueou usuário',
    icon: Ban,
    iconClass: 'text-rose-400',
    chipClass: 'bg-rose-500/10 border-rose-500/40 text-rose-300'
  },
  user_update: {
    label: 'Editou usuário',
    icon: Pencil,
    iconClass: 'text-sky-400',
    chipClass: 'bg-sky-500/10 border-sky-500/40 text-sky-300'
  },
  user_delete: {
    label: 'Excluiu usuário',
    icon: UserX,
    iconClass: 'text-rose-400',
    chipClass: 'bg-rose-500/10 border-rose-500/40 text-rose-300'
  }
};

const USER_ACTIONS = ['approve', 'reject', 'block', 'user_update', 'user_delete'];
const DATA_ACTIONS = ['export', 'import', 'reset'];

function describeLog(log: AuditLog): { title: string; detail: string } {
  const actor = log.actorName || log.actorEmail || log.actorUid || 'Usuário desconhecido';
  const entity = log.entityTitle ? `"${log.entityTitle}"` : log.entityId || 'registro';
  const meta = ACTION_META[log.action];

  switch (log.action) {
    case 'create':
    case 'update':
    case 'delete':
    case 'view':
      return {
        title: meta?.label || log.action,
        detail: `${entity} • por ${actor}`
      };
    case 'login':
    case 'logout':
    case 'export':
    case 'import':
    case 'reset':
      return {
        title: meta?.label || log.action,
        detail: `por ${actor}`
      };
    case 'approve':
    case 'reject':
    case 'block':
    case 'user_update':
    case 'user_delete':
      return {
        title: meta?.label || log.action,
        detail: `${entity} • por ${actor}`
      };
    default:
      return { title: log.action, detail: `por ${actor}` };
  }
}

export const AuditDashboard: FC<AuditDashboardProps> = ({ onBackToAgenda }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [isLive, setIsLive] = useState(true);

  // Subscribe to latest audit logs in real-time
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    subscribeToAuditLogs((auditLogs) => {
      if (cancelled) return;
      setLogs(auditLogs);
      setIsLive(true);
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribe = unsub;
    });
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: logs.length,
      create: logs.filter((l) => l.action === 'create').length,
      update: logs.filter((l) => l.action === 'update').length,
      delete: logs.filter((l) => l.action === 'delete').length,
      view: logs.filter((l) => l.action === 'view').length,
      login: logs.filter((l) => l.action === 'login').length,
      user: logs.filter((l) => USER_ACTIONS.includes(l.action)).length,
      data: logs.filter((l) => DATA_ACTIONS.includes(l.action)).length
    }),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeFilter === 'create' && log.action !== 'create') return false;
      if (activeFilter === 'update' && log.action !== 'update') return false;
      if (activeFilter === 'delete' && log.action !== 'delete') return false;
      if (activeFilter === 'view' && log.action !== 'view') return false;
      if (activeFilter === 'login' && log.action !== 'login') return false;
      if (activeFilter === 'user' && !USER_ACTIONS.includes(log.action)) return false;
      if (activeFilter === 'data' && !DATA_ACTIONS.includes(log.action)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesActor =
          (log.actorName?.toLowerCase().includes(q) ?? false) ||
          (log.actorEmail?.toLowerCase().includes(q) ?? false) ||
          (log.actorUid?.toLowerCase().includes(q) ?? false);
        const matchesEntity =
          (log.entityTitle?.toLowerCase().includes(q) ?? false) ||
          (log.entityId?.toLowerCase().includes(q) ?? false) ||
          (log.details?.toLowerCase().includes(q) ?? false);
        return matchesActor || matchesEntity;
      }
      return true;
    });
  }, [logs, activeFilter, searchTerm]);

  const filterTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: counts.all },
    { key: 'create', label: 'Criações', count: counts.create },
    { key: 'update', label: 'Edições', count: counts.update },
    { key: 'delete', label: 'Exclusões', count: counts.delete },
    { key: 'view', label: 'Visualizações', count: counts.view },
    { key: 'login', label: 'Acessos', count: counts.login },
    { key: 'user', label: 'Usuários', count: counts.user },
    { key: 'data', label: 'Dados', count: counts.data }
  ];

  return (
    <div id="audit-dashboard" className="flex flex-col gap-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <button
              id="back-to-agenda-audit-btn"
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
            Auditoria de Atividades
          </h2>
          <p className="text-xs text-zinc-400">
            Acompanhe quem criou, editou, visualizou ou excluiu anotações e os acessos ao sistema.
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-xs">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${
                isLive ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'
              } opacity-75`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isLive ? 'bg-emerald-400' : 'bg-zinc-500'
              }`}
            />
          </span>
          <span className="text-zinc-300 font-semibold">Tempo real</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Registros</span>
            <Activity className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{counts.all}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Criações</span>
            <Plus className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-300">{counts.create}</p>
        </div>

        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-xs font-medium">Edições</span>
            <Pencil className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-sky-300">{counts.update}</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-medium">Exclusões</span>
            <Trash2 className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-300">{counts.delete}</p>
        </div>

        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4">
          <div className="flex items-center justify-between text-violet-400">
            <span className="text-xs font-medium">Visualizações</span>
            <Eye className="h-4 w-4 text-violet-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-violet-300">{counts.view}</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-medium">Acessos</span>
            <LogIn className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-300">{counts.login}</p>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-3 h-4 w-4 my-auto text-zinc-400" />
          <input
            id="search-audit-input"
            type="text"
            aria-label="Buscar por usuário, anotação ou ação"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuário, anotação ou ação..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 py-2 pl-9 pr-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium transition ${
                activeFilter === tab.key
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeFilter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log List */}
      <div className="flex flex-col gap-2.5">
        {filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-400">
            <Activity className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-300">Nenhum registro de auditoria</p>
            <p className="text-xs text-zinc-500 mt-1">
              As atividades de criação, edição, exclusão, visualização e acesso aparecerão aqui.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const meta = ACTION_META[log.action] || ACTION_META.create;
            const ActorIcon = meta.icon;
            const desc = describeLog(log);
            const actorLabel = log.actorName || log.actorEmail || 'Sem identificação';

            return (
              <div
                key={log.id}
                id={`audit-log-${log.id}`}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl border border-zinc-800/80 bg-[#161619]/80 p-3.5 transition-all hover:border-zinc-700"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 border border-zinc-700/80">
                    <ActorIcon className={`h-4 w-4 ${meta.iconClass}`} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100">{desc.title}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${meta.chipClass}`}
                      >
                        {log.action}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{desc.detail}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-500 mt-1">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <span className="font-medium">{actorLabel}</span>
                      </span>
                      {log.details && <span className="text-zinc-400">{log.details}</span>}
                      <span>{formatDateTimeBR(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};