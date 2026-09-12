import React, { useState } from 'react';
import type { FC } from 'react';
import { Building2, Trash2, Plus, ShieldCheck, FileText } from 'lucide-react';
import { Division, Note, AppUser } from '../types';
import { ToastType } from './Toast';
import { createDivision, deleteDivision } from '../services/divisionService';
import { getDivisionStyle } from '../utils/divisionStyles';
import { formatDateTimeBR } from '../utils/dateUtils';
import { Modal } from './Modal';

interface DivisionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  divisions: Division[];
  notes: Note[];
  currentUser: AppUser | null;
  onShowToast?: (msg: string, type?: ToastType) => void;
}

export const DivisionManagerModal: FC<DivisionManagerModalProps> = ({
  isOpen,
  onClose,
  divisions,
  notes,
  currentUser,
  onShowToast
}) => {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const actor = {
    uid: currentUser?.uid || 'admin-default',
    name: currentUser?.displayName || undefined,
    email: currentUser?.email || undefined
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Informe o nome da divisão.');
      return;
    }
    const exists = divisions.some(
      (d) => d.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError('Já existe uma divisão com esse nome.');
      return;
    }

    setIsCreating(true);
    try {
      await createDivision(trimmed, actor);
      setName('');
      setError('');
      onShowToast?.(`Divisão "${trimmed}" criada com sucesso!`, 'success');
    } catch (err) {
      console.error('Error creating division:', err);
      onShowToast?.('Erro ao criar divisão no Firebase.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (division: Division) => {
    const usedByCount = notes.filter((note) => note.division === division.name).length;
    const confirmed = window.confirm(
      usedByCount > 0
        ? `A divisão "${division.name}" está vinculada a ${usedByCount} anotação(ões). Excluí-la não remove as anotações, apenas deixa de aparecer na lista. Continuar?`
        : `Excluir a divisão "${division.name}"?`
    );
    if (!confirmed) return;

    if (division.id.startsWith('div-default-')) {
      onShowToast?.(
        'Esta divisão é padrão do sistema e ainda não foi salva no Firebase. Crie-a novamente para poder gerenciá-la.',
        'info'
      );
      return;
    }

    try {
      await deleteDivision(division.id, division.name, actor);
      onShowToast?.(`Divisão "${division.name}" excluída.`, 'success');
    } catch (err) {
      console.error('Error deleting division:', err);
      onShowToast?.('Erro ao excluir divisão do Firebase.', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Gestão de divisões"
      maxWidthClass="max-w-lg"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/30">
            <Building2 className="h-5 w-5 text-teal-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Gestão de Divisões</h2>
            <p className="text-xs text-zinc-400">
              Crie as divisões disponíveis para selecionar nas anotações.
            </p>
          </div>
        </div>

        {/* Create form (admin only) */}
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="division-name-input"
              type="text"
              aria-label="Nome da nova divisão"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex: Londrina, Maringá, Apucarana..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Criando...' : 'Criar Divisão'}
            </button>
          </div>
          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        </form>

        {/* Divisions list */}
        <div className="mt-5 flex flex-col gap-2 max-h-[45vh] overflow-y-auto pr-1">
          {divisions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-[#141416]/50 p-8 text-center">
              <FileText className="mx-auto h-7 w-7 text-zinc-600 mb-2" />
              <p className="text-sm font-medium text-zinc-300">Nenhuma divisão cadastrada</p>
              <p className="text-xs text-zinc-500 mt-1">
                Crie a primeira divisão usando o formulário acima.
              </p>
            </div>
          ) : (
            divisions.map((division) => {
              const style = getDivisionStyle(division.name);
              const usedByCount = notes.filter((note) => note.division === division.name).length;
              return (
                <div
                  key={division.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-[#161619]/80 p-3 transition-all hover:border-zinc-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-zinc-100 truncate">
                        {division.name}
                      </span>
                      <span className="text-[11px] text-zinc-500 truncate">
                        {usedByCount > 0
                          ? `${usedByCount} anotação(ões) • `
                          : ''}
                        {division.createdByName || division.createdBy
                          ? `Criada por ${division.createdByName || division.createdBy}`
                          : ''}
                        {division.createdAt ? ` • ${formatDateTimeBR(division.createdAt)}` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    id={`delete-division-${division.id}`}
                    onClick={() => handleDelete(division)}
                    title="Excluir divisão"
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-rose-950/50 hover:border-rose-800/80 p-2 text-zinc-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
            <ShieldCheck className="h-3 w-3 text-amber-400" />
            Apenas administradores podem criar ou excluir divisões.
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};