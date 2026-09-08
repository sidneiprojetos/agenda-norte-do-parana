import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Note } from '../types';
import { formatDateToBR } from '../utils/dateUtils';

interface DeleteConfirmModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  note,
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !note) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-rose-900/60 bg-[#141417] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="flex flex-col">
            <h3 className="text-base font-bold text-white">
              Confirmar Exclusão (ADM)
            </h3>
            <p className="mt-1 text-xs text-zinc-300">
              Tem certeza que deseja excluir esta anotação da agenda? Esta ação não pode ser desfeita.
            </p>

            {/* Note preview box */}
            <div className="mt-3 rounded-xl border border-zinc-800 bg-[#1a1a1e] p-3 text-xs text-zinc-300">
              <p className="font-semibold text-amber-400">{note.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Data: {formatDateToBR(note.date)} {note.time ? `às ${note.time}h` : ''}
              </p>
              {note.content && (
                <p className="mt-1 text-slate-400 italic line-clamp-2">
                  "{note.content}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="confirm-delete-button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-900/40 transition active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Excluir Definitivamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
