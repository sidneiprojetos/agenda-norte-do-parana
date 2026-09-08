import React from 'react';
import {
  FileText,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Tag,
  User,
  Pencil,
  Trash2,
  X,
  ShieldCheck
} from 'lucide-react';
import { Note, AppUser } from '../types';
import { formatDateToBR, formatDateTimeBR } from '../utils/dateUtils';
import { ADMIN_EMAIL, isUserAdmin } from '../firebase';

interface ViewNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  currentUser: AppUser | null;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export const ViewNoteModal: React.FC<ViewNoteModalProps> = ({
  note,
  isOpen,
  currentUser,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!isOpen || !note) return null;

  const canModify = !currentUser
    ? true
    : currentUser.isAdmin ||
      note.authorEmail === currentUser.email ||
      note.authorId === currentUser.uid;

  const isNoteByAdmin =
    isUserAdmin(note.authorEmail) ||
    isUserAdmin(note.createdBy);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#141417] p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          {note.authorPhoto ? (
            <img
              src={note.authorPhoto}
              alt={note.authorName || 'Autor'}
              referrerPolicy="no-referrer"
              className="h-12 w-12 shrink-0 rounded-2xl object-cover border border-amber-500/40"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <FileText className="h-6 w-6" />
            </div>
          )}

          <div className="flex flex-col pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {note.title}
              </h2>
              {note.category && (
                <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-semibold text-amber-300">
                  {note.category}
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatDateToBR(note.date)}
              </span>

              {note.time && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {note.time}h
                </span>
              )}

              {note.location && (
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {note.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="rounded-xl border border-zinc-800 bg-[#1a1a1e] p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap min-h-[90px]">
          {note.content || <span className="text-zinc-500 italic">Sem descrição adicional.</span>}
        </div>

        {/* Metadata & Audit Trail */}
        <div className="mt-4 flex flex-col gap-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3 text-[11px] text-zinc-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3 text-amber-400" />
              Publicado por:{' '}
              <strong className="text-slate-200">
                {note.authorName ? `${note.authorName} (${note.authorEmail || note.createdBy})` : (note.authorEmail || note.createdBy)}
              </strong>
            </span>
            {isNoteByAdmin ? (
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-600/30 text-amber-300 px-1.5 py-0.2 font-mono text-[10px]">
                <ShieldCheck className="h-3 w-3" /> ADM
              </span>
            ) : (
              <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.2 text-[10px]">
                Membro
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Criado em: {formatDateTimeBR(note.createdAt)}</span>
            {note.updatedAt && (
              <span>Atualizado em: {formatDateTimeBR(note.updatedAt)}</span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between pt-2 border-t border-slate-800">
          {canModify ? (
            <button
              type="button"
              onClick={() => onDelete(note)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-900/50 bg-rose-950/30 hover:bg-rose-900/50 px-3 py-2 text-xs font-semibold text-rose-300 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">Visualização somente leitura</span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 transition"
            >
              Fechar
            </button>
            {canModify && (
              <button
                type="button"
                onClick={() => onEdit(note)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-amber-900/30 transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
