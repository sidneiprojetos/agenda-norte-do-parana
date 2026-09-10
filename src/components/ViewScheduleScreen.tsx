import { useState, useMemo, type FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { Note, NoteCategory } from '../types';
import { formatDateToBR, formatDateTimeBR } from '../utils/dateUtils';
import { getCategoryStyle } from '../utils/categoryStyles';
import { isUserAdmin } from '../firebase';

interface ViewScheduleScreenProps {
  notes: Note[];
  onBack: () => void;
  onViewNote: (note: Note) => void;
}

const CATEGORIES: (NoteCategory | 'Todas')[] = [
  'Todas',
  'Reunião',
  'Pub',
  'Evento',
  'Ação Social',
  'Geral'
];

const PRIORITIES = ['Todas', 'alta', 'normal'] as const;

export const ViewScheduleScreen: FC<ViewScheduleScreenProps> = ({
  notes,
  onBack,
  onViewNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | 'Todas'>('Todas');
  const [selectedPriority, setSelectedPriority] = useState<string>('Todas');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.location?.toLowerCase().includes(q) ||
          (n.authorName || n.authorEmail || '').toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'Todas') {
      result = result.filter((n) => n.category === selectedCategory);
    }

    if (selectedPriority !== 'Todas') {
      result = result.filter((n) => n.priority === selectedPriority);
    }

    result.sort((a, b) => {
      const dateA = a.date + (a.time || '99:99');
      const dateB = b.date + (b.time || '99:99');
      return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    });

    return result;
  }, [notes, searchQuery, selectedCategory, selectedPriority, sortOrder]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Note[]> = {};
    for (const note of filteredNotes) {
      if (!groups[note.date]) {
        groups[note.date] = [];
      }
      groups[note.date].push(note);
    }
    return groups;
  }, [filteredNotes]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDates(new Set(Object.keys(groupedByDate)));
  };

  const collapseAll = () => {
    setExpandedDates(new Set());
  };

  const totalByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of notes) {
      const cat = note.category || 'Geral';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [notes]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-700 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-amber-400" />
              Visualizar Agenda
            </h2>
            <p className="text-xs text-zinc-400">
              {filteredNotes.length} de {notes.length} anotações
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
          >
            <ChevronDown className="h-3 w-3" />
            Expandir
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
          >
            <ChevronUp className="h-3 w-3" />
            Recolher
          </button>
          <button
            onClick={() => setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
          >
            <Filter className="h-3 w-3" />
            {sortOrder === 'asc' ? 'Mais antigo primeiro' : 'Mais recente primeiro'}
          </button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
          <span
            key={cat}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium ${getCategoryStyle(cat).badge}`}
          >
            {cat}
            <span className="font-bold">{totalByCategory[cat] || 0}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
          Total: <span className="font-bold">{notes.length}</span>
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-zinc-400 my-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, conteúdo, local ou autor..."
            className="w-full rounded-xl border border-zinc-700/60 bg-[#1a1a1e] py-2 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                selectedCategory === cat
                  ? cat === 'Todas'
                    ? 'border-amber-500 bg-amber-600 text-white'
                    : `${getCategoryStyle(cat).active} font-semibold`
                  : 'border-transparent bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="rounded-xl border border-zinc-700/60 bg-[#1a1a1e] px-3 py-1.5 text-[11px] text-zinc-300 focus:border-amber-500 focus:outline-none"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p === 'Todas' ? 'Todas prioridades' : p === 'alta' ? 'Alta prioridade' : 'Normal'}
            </option>
          ))}
        </select>
      </div>

      {/* Notes grouped by date */}
      {Object.keys(groupedByDate).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800/80 bg-[#141416]/50 p-8 text-center">
          <CalendarIcon className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-sm font-medium text-zinc-300">Nenhuma anotação encontrada</p>
          <p className="text-xs text-zinc-500 mt-1">Ajuste os filtros ou crie uma nova anotação.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(groupedByDate)
            .sort(([a], [b]) =>
              sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
            )
            .map(([date, dateNotes]) => {
              const isExpanded = expandedDates.has(date);
              return (
                <motion.div
                  key={date}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-zinc-800/80 bg-[#141416]/80 overflow-hidden"
                >
                  {/* Date Header */}
                  <button
                    onClick={() => toggleDate(date)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 bg-[#18181b]/80 hover:bg-[#1f1f23] transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
                        <CalendarIcon className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">{formatDateToBR(date)}</span>
                        <span className="ml-2 text-[11px] text-zinc-400">
                          {dateNotes.length} anotação{dateNotes.length !== 1 ? 'ões' : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Notes for this date */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col divide-y divide-zinc-800/60">
                          {dateNotes.map((note) => {
                            const isNoteAdmin = isUserAdmin(note.authorEmail) || isUserAdmin(note.createdBy);
                            return (
                              <div
                                key={note.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 hover:bg-[#1a1a1e]/60 transition"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-semibold text-slate-100">
                                      {note.title}
                                    </h3>
                                    {note.time && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
                                        <Clock className="h-3 w-3" />
                                        {note.time}h
                                      </span>
                                    )}
                                    {note.category && (
                                      <span
                                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getCategoryStyle(note.category).badge}`}
                                      >
                                        {note.category}
                                      </span>
                                    )}
                                    {note.priority === 'alta' && (
                                      <span className="rounded-md border border-red-500/40 bg-red-950/40 px-2 py-0.5 text-[10px] font-bold text-red-300">
                                        ALTA
                                      </span>
                                    )}
                                    {isNoteAdmin && (
                                      <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[9px] font-bold">
                                        ADM
                                      </span>
                                    )}
                                  </div>
                                  {note.content && (
                                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{note.content}</p>
                                  )}
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                    {note.location && (
                                      <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {note.location}
                                      </span>
                                    )}
                                    <span>
                                      {note.authorName || note.authorEmail || note.createdBy}
                                    </span>
                                    <span>{formatDateTimeBR(note.createdAt)}</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => onViewNote(note)}
                                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white active:scale-95"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Detalhes
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
};
