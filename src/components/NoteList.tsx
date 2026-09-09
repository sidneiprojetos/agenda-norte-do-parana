import type { FC } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  Search,
  FilterX,
  Eye
} from 'lucide-react';
import { Note, NoteCategory, AppUser } from '../types';
import { formatDateToBR, formatDateTimeBR } from '../utils/dateUtils';
import { isUserAdmin } from '../firebase';
import { getCategoryStyle } from '../utils/categoryStyles';

interface NoteListProps {
  notes: Note[];
  selectedDate: string;
  isDateFilterActive: boolean;
  searchQuery: string;
  selectedCategory: string;
  currentUser: AppUser | null;
  onSearchChange: (q: string) => void;
  onCategoryChange: (cat: string) => void;
  onClearDateFilter: () => void;
  onViewNote: (note: Note) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
}

const CATEGORIES: (NoteCategory | 'Todas')[] = [
  'Todas',
  'Reunião',
  'Pub',
  'Evento',
  'Ação Social',
  'Geral'
];

export const NoteList: FC<NoteListProps> = ({
  notes,
  selectedDate,
  isDateFilterActive,
  searchQuery,
  selectedCategory,
  currentUser,
  onSearchChange,
  onCategoryChange,
  onClearDateFilter,
  onViewNote,
  onEditNote,
  onDeleteNote
}) => {
  const canModify = (note: Note): boolean => {
    if (!currentUser) return true; // Allows local guest interaction fallback
    if (currentUser.isAdmin) return true;
    if (currentUser.email && note.authorEmail === currentUser.email) return true;
    if (currentUser.uid && note.authorId === currentUser.uid) return true;
    return false;
  };

  return (
    <div id="note-list-section" className="mt-8 flex flex-col gap-3.5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            AGENDA COMPARTILHADA ({notes.length})
          </h2>

          {isDateFilterActive && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 px-2.5 py-0.5 text-xs text-amber-300">
              <span>Dia {formatDateToBR(selectedDate)}</span>
              <button
                onClick={onClearDateFilter}
                className="ml-1 text-slate-400 hover:text-white"
                title="Mostrar todas as datas"
              >
                <FilterX className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-auto">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-zinc-400 my-auto" />
          <input
            id="search-notes-input"
            type="text"
            aria-label="Buscar anotações"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar anotações..."
            className="w-full sm:w-64 rounded-xl border border-zinc-700/60 bg-[#1a1a1e] py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="text-[11px] font-medium text-zinc-400 mr-1">Filtrar:</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              selectedCategory === cat
                ? cat === 'Todas'
                  ? 'border-amber-500 bg-amber-600 text-white shadow-sm font-semibold'
                  : `${getCategoryStyle(cat).active} font-semibold`
                : 'border-transparent bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List Cards */}
      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800/80 bg-[#141416]/50 p-8 text-center">
          <CalendarIcon className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhuma anotação encontrada
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {isDateFilterActive
              ? `Não há anotações para o dia ${formatDateToBR(selectedDate)}. Crie uma nova acima ou veja todas.`
              : 'Utilize o formulário acima para adicionar um novo compromisso ou anotação.'}
          </p>
          {isDateFilterActive && (
            <button
              onClick={onClearDateFilter}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:underline"
            >
              Ver todas as anotações
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {notes.map((note) => {
            const hasPermission = canModify(note);
            const isNoteByAdmin =
              isUserAdmin(note.authorEmail) ||
              isUserAdmin(note.createdBy);

            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                id={`note-card-${note.id}`}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-[#161619]/80 p-4 transition-all hover:border-zinc-700 hover:bg-[#1f1f23]"
              >
                {/* Note Content & Details */}
                <div
                  className="flex items-start gap-3.5 cursor-pointer flex-1"
                  onClick={() => onViewNote(note)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver detalhes de ${note.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onViewNote(note);
                    }
                  }}
                  title="Clique para ver detalhes completos"
                >
                  <div className="flex flex-col min-w-0">
                    {/* Title and Date Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                        {note.title}
                      </h3>
                      <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm">
                        {formatDateToBR(note.date)}
                      </span>
                      {note.time && (
                        <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
                          {note.time}h
                        </span>
                      )}
                      {note.category && (
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getCategoryStyle(note.category).badge}`}>
                          {note.category}
                        </span>
                      )}
                    </div>

                    {/* Content / description */}
                    {note.content && (
                      <p className="mt-1 text-xs sm:text-sm text-slate-300 line-clamp-2">
                        {note.content}
                      </p>
                    )}

                    {note.location && (
                      <p className="mt-1 text-xs text-slate-400">
                        <span>{note.location}</span>
                      </p>
                    )}

                    {/* Author and Timestamp with ADM tag */}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                      <span>Criado em {formatDateTimeBR(note.createdAt)} por</span>
                      <span className="text-slate-200 font-medium">
                        {note.authorName || note.authorEmail || note.createdBy}
                      </span>
                      {isNoteByAdmin && (
                        <span className="rounded bg-amber-500/20 text-amber-300 px-1 py-0.2 text-[9px] font-bold">
                          ADM
                        </span>
                      )}
                      {note.updatedAt && (
                        <span className="text-slate-500 ml-1">
                          (Editado em {formatDateTimeBR(note.updatedAt)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <button
                    id={`view-note-${note.id}`}
                    onClick={() => onViewNote(note)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                    title="Ver detalhes da anotação"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Ver</span>
                  </button>

                  {hasPermission && (
                    <>
                      <button
                        id={`edit-note-${note.id}`}
                        onClick={() => onEditNote(note)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-amber-400"
                        title="Editar esta anotação"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        id={`delete-note-${note.id}`}
                        onClick={() => onDeleteNote(note)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-rose-950/40 hover:text-rose-400"
                        title="Excluir esta anotação"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Excluir</span>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
