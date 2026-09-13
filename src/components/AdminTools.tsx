import { useRef } from 'react';
import type { ChangeEvent, FC } from 'react';
import { ArrowLeft, Database, Download, ShieldCheck, Upload } from 'lucide-react';
import { AppUser } from '../types';

interface AdminToolsProps {
  currentUser: AppUser;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onBackToAgenda: () => void;
}

export const AdminTools: FC<AdminToolsProps> = ({
  onExportData,
  onImportData,
  onBackToAgenda
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBackToAgenda}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-700/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar à agenda</span>
        </button>
        <div className="flex flex-col gap-1 text-right">
          <h2 className="text-sm font-bold text-zinc-100">Ferramentas ADM</h2>
          <div className="flex items-center justify-end gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              PAINEL ADM
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Firestore Tempo Real
            </span>
          </div>
        </div>
      </div>

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