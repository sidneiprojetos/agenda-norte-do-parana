import type { FC } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Eye } from 'lucide-react';
import { Note } from '../types';
import { formatDateToBR } from '../utils/dateUtils';
import { getCategoryStyle } from '../utils/categoryStyles';
import { Modal } from './Modal';

interface DayEventsModalProps {
  date: string | null;
  notes: Note[];
  isOpen: boolean;
  onClose: () => void;
  onViewNote: (note: Note) => void;
}

export const DayEventsModal: FC<DayEventsModalProps> = ({
  date,
  notes,
  isOpen,
  onClose,
  onViewNote
}) => {
  const dayNotes = date
    ? notes.filter((note) => note.date === date).sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      })
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={`Eventos do dia ${date ? formatDateToBR(date) : ''}`}
      maxWidthClass="max-w-md"
    >
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
            <CalendarIcon className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Eventos do Dia
            </h2>
            <p className="text-xs text-zinc-400">
              {date ? formatDateToBR(date) : ''}
            </p>
          </div>
        </div>

        {dayNotes.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-[#1a1a1e] p-6 text-center">
            <p className="text-sm text-zinc-400">Nenhum evento encontrado para este dia.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {dayNotes.map((note) => {
              const categoryStyle = getCategoryStyle(note.category || 'Geral');
              return (
                <button
                  key={note.id}
                  onClick={() => onViewNote(note)}
                  className={`flex items-start gap-3 rounded-xl border ${categoryStyle.border} bg-[#1a1a1e] p-3.5 text-left transition hover:brightness-125 active:scale-[0.98]`}
                >
                  <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${categoryStyle.active.split(' ')[1]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{note.title}</span>
                      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${categoryStyle.badge}`}>
                        {note.category || 'Geral'}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px] text-zinc-400">
                      {note.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {note.time}h
                        </span>
                      )}
                      {note.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{note.location}</span>
                        </span>
                      )}
                    </div>
                    {note.content && (
                      <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{note.content}</p>
                    )}
                  </div>
                  <Eye className="h-4 w-4 shrink-0 mt-1 text-zinc-500" />
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex justify-end">
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
