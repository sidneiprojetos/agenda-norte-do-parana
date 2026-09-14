import { useState, useRef } from 'react';
import type { ChangeEvent, FC } from 'react';
import {
  ArrowLeft,
  Building2,
  Database,
  Download,
  ScrollText,
  ShieldCheck,
  Upload,
  Users,
  Tags
} from 'lucide-react';
import { AppUser, Category, Division, Note } from '../types';
import { UserManagementDashboard } from './UserManagementDashboard';
import { CategoryManager } from './CategoryManager';
import { AuditDashboard } from './AuditDashboard';
import { DivisionManagerModal } from './DivisionManagerModal';

interface AdminToolsProps {
  currentUser: AppUser;
  isOwner: boolean;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onBackToAgenda: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  categories: Category[];
  divisions: Division[];
  notes: Note[];
  pendingUsersCount?: number;
}

type AdmTab = 'usuarios' | 'categorias' | 'auditoria' | 'divisoes' | 'ferramentas';

export const AdminTools: FC<AdminToolsProps> = ({
  currentUser,
  isOwner,
  onExportData,
  onImportData,
  onBackToAgenda,
  onShowToast,
  categories,
  divisions,
  notes,
  pendingUsersCount = 0
}) => {
  const [activeTab, setActiveTab] = useState<AdmTab>('usuarios');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      e.target.value = '';
    }
  };

  const tabs: { key: AdmTab; label: string; icon: typeof Users; show: boolean }[] = [
    { key: 'usuarios', label: 'Usuários', icon: Users, show: true },
    { key: 'auditoria', label: 'Auditoria', icon: ScrollText, show: true },
    { key: 'categorias', label: 'Categorias', icon: Tags, show: true },
    { key: 'divisoes', label: 'Divisões', icon: Building2, show: true },
    { key: 'ferramentas', label: 'Backup', icon: Database, show: isOwner }
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToAgenda}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-700/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar à agenda</span>
          </button>
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            PAINEL ADMINISTRATIVO
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Firestore Tempo Real
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1">
        {tabs.filter((t) => t.show).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const badgeCount = tab.key === 'usuarios' ? pendingUsersCount : 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {badgeCount > 0 && (
                <span className="rounded-full bg-amber-400 text-black px-1.5 py-px text-[10px] font-black">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'usuarios' && (
        <UserManagementDashboard
          currentAdminEmail={currentUser.email || ''}
          onBackToAgenda={onBackToAgenda}
          onShowToast={onShowToast}
          embedded
        />
      )}

      {activeTab === 'auditoria' && (
        <AuditDashboard onBackToAgenda={onBackToAgenda} embedded />
      )}

      {activeTab === 'categorias' && (
        <CategoryManager
          categories={categories}
          notes={notes}
          currentUser={currentUser}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'divisoes' && (
        <DivisionManagerModal
          isOpen
          onClose={onBackToAgenda}
          divisions={divisions}
          notes={notes}
          currentUser={currentUser}
          onShowToast={onShowToast}
          embedded
        />
      )}

      {activeTab === 'ferramentas' && isOwner && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              id="admin-export-btn"
              onClick={onExportData}
              title="Exportar anotações em arquivo JSON"
              className="flex flex-col items-start gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-800/40 p-4 text-left transition hover:bg-zinc-700/60 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 text-sky-300">
                <Download className="h-5 w-5" />
                <span className="text-sm font-bold">Exportar dados</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Baixa um arquivo <strong className="text-zinc-300">.json</strong> com todas as
                anotações como backup.
              </p>
            </button>

            <button
              id="admin-import-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Importar anotações de backup JSON"
              className="flex flex-col items-start gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-800/40 p-4 text-left transition hover:bg-zinc-700/60 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 text-amber-300">
                <Upload className="h-5 w-5" />
                <span className="text-sm font-bold">Importar dados</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Restaura um backup <strong className="text-zinc-300">.json</strong> previamente
                exportado.
              </p>
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#161619]/60 px-3 py-2.5 text-[11px] text-zinc-500">
            <Database className="h-3.5 w-3.5 shrink-0" />
            <span>
              Os dados são sincronizados em tempo real com o Firestore do projeto.
            </span>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
    </div>
  );
};
