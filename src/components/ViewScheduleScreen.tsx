import { useState, useMemo, type FC } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  FileText,
  Pencil,
  Trash2,
  Search,
  Eye,
  CalendarDays
} from 'lucide-react';
import { Note, NoteCategory, AppUser } from '../types';
import { formatDateToBR, formatDateToISO, formatDateTimeBR } from '../utils/dateUtils';
import { getCategoryStyle } from '../utils/categoryStyles';
import { getDivisionStyle } from '../utils/divisionStyles';
import { isUserAdmin } from '../firebase';

interface ViewScheduleScreenProps {
  notes: Note[];
  currentUser: AppUser | null;
  onBack: () => void;
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

export const ViewScheduleScreen: FC<ViewScheduleScreenProps> = ({
  notes,
  currentUser,
  onBack,
  onViewNote,
  onEditNote,
  onDeleteNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | 'Todas'>('Todas');

  const todayISO = formatDateToISO(new Date());

  const upcomingNotes = useMemo(
    () => notes.filter((n) => n.date >= todayISO),
    [notes, todayISO]
  );

  const filteredNotes = useMemo(() => {
    return upcomingNotes.filter((n) => {
      if (selectedCategory !== 'Todas' && n.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = n.content.toLowerCase().includes(q);
        const matchAuthor = (n.authorName || n.authorEmail || n.createdBy || '').toLowerCase().includes(q);
        const matchLocation = n.location?.toLowerCase().includes(q) || false;
        const matchDivision = n.division?.toLowerCase().includes(q) || false;
        return matchTitle || matchContent || matchAuthor || matchLocation || matchDivision;
      }
      return true;
    });
  }, [upcomingNotes, searchQuery, selectedCategory]);

  const canModify = (note: Note): boolean => {
    if (!currentUser) return true;
    if (currentUser.isAdmin) return true;
    if (currentUser.email && note.authorEmail === currentUser.email) return true;
    if (currentUser.uid && note.authorId === currentUser.uid) return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-700 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <CalendarDays className="h-4 w-4 text-emerald-400" />
              VISUALIZAR AGENDA
            </h2>
            <p className="text-[11px] text-zinc-400">
              {filteredNotes.length} de {upcomingNotes.length} anotações
            </p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-zinc-400 my-auto" />
          <input
            type="text"
            aria-label="Buscar anotações"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar anotações..."
            className="w-full rounded-xl border border-zinc-700/60 bg-[#1a1a1e] py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="text-[11px] font-medium text-zinc-400 mr-1">Filtrar:</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
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
      {filteredNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800/80 bg-[#141416]/50 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
          <p className="text-sm font-medium text-zinc-300">Nenhuma anotação encontrada</p>
          <p className="text-xs text-zinc-500 mt-1">Ajuste os filtros para encontrar anotações.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredNotes.map((note) => {
            const hasPermission = canModify(note);
            const isNoteByAdmin = isUserAdmin(note.authorEmail) || isUserAdmin(note.createdBy);

            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                id={`schedule-note-card-${note.id}`}
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
                  <div className="flex flex-col min-w-0 w-full">
                    {/* Title and Badges */}
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
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getDivisionStyle(note.division).badge}`}>
                      {note.division || 'Sem divisão'}
                    </span>
                      {note.priority === 'alta' && (
                        <span className="rounded-md border border-red-500/40 bg-red-950/40 px-2 py-0.5 text-[10px] font-bold text-red-300">
                          ALTA
                        </span>
                      )}
                    </div>

                    {/* Full content */}
                    {note.content && (
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap break-words">
                        {note.content}
                      </p>
                    )}

                    {note.location && (
                      <p className="mt-1 text-xs text-slate-400">
                        <span>📍 {note.location}</span>
                      </p>
                    )}

                    {/* Author and Timestamp with ADM tag */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
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
                        onClick={() => onEditNote(note)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-amber-400"
                        title="Editar esta anotação"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
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