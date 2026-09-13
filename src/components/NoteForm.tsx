import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Check,
  X,
  Clock,
  Tag,
  LogIn,
  Building2,
  ChevronDown,
  MapPin
} from 'lucide-react';
import { Note, NoteCategory, AppUser, CATEGORIES, DEFAULT_CATEGORY } from '../types';
import { formatDateToISO } from '../utils/dateUtils';

interface NoteFormProps {
  selectedDate: string;
  editingNote: Note | null;
  currentUser: AppUser | null;
  divisions: string[];
  onSaveNote: (noteData: {
    content: string;
    date: string;
    time?: string;
    category?: NoteCategory;
    division?: string;
    location?: string;
  }) => Promise<void>;
  onCancelEdit: () => void;
}

export const NoteForm: FC<NoteFormProps> = ({
  selectedDate,
  editingNote,
  currentUser,
  divisions,
  onSaveNote,
  onCancelEdit
}) => {
  const [content, setContent] = useState('');
  const [dateStr, setDateStr] = useState(selectedDate || formatDateToISO(new Date()));
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<NoteCategory>(DEFAULT_CATEGORY);
  const [division, setDivision] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const divisionOptions = Array.from(
    new Set(division ? [division, ...divisions] : divisions)
  );

  // Synchronize when editing or when date is selected on calendar
  useEffect(() => {
    if (editingNote) {
      setContent(editingNote.content);
      setDateStr(editingNote.date);
      setTime(editingNote.time || '');
      setCategory(editingNote.category || DEFAULT_CATEGORY);
      setDivision(editingNote.division || '');
      setLocation(editingNote.location || '');
    } else {
      setContent('');
      setTime('');
      setCategory(DEFAULT_CATEGORY);
      setDivision('');
      setLocation('');
      if (selectedDate) {
        setDateStr(selectedDate);
      }
    }
    setError('');
  }, [editingNote, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Por favor, informe o texto da anotação.');
      return;
    }
    if (!dateStr) {
      setError('Por favor, selecione uma data válida.');
      return;
    }
    if (!division) {
      setError('Por favor, selecione a divisão da anotação.');
      return;
    }
    if (!category) {
      setError('Por favor, selecione a categoria do evento.');
      return;
    }
    if (!location.trim()) {
      setError('Por favor, informe o local (endereço) do evento.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveNote({
        content: content.trim(),
        date: dateStr,
        time: time.trim() || undefined,
        category,
        division: division.trim() || undefined,
        location: location.trim() || undefined
      });

      if (!editingNote) {
        setContent('');
        setTime('');
        setDivision('');
        setLocation('');
      }
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar no Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="note-form-container"
      className="flex flex-col rounded-2xl border border-zinc-800/80 bg-[#161619]/85 p-5 shadow-xl backdrop-blur-md transition-all"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            {editingNote ? 'Editar anotação' : 'Novo Evento'}
          </h3>
          {editingNote && (
            <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300">
              MODO EDIÇÃO
            </span>
          )}
        </div>

        {editingNote && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-amber-400 transition"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar edição
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Category select (required) */}
        <div>
          <label
            htmlFor="note-category-input"
            className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase text-zinc-500"
          >
            <Tag className="h-3 w-3" /> Categoria <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Tag className="h-4 w-4" />
            </div>
            <select
              id="note-category-input"
              aria-label="Categoria do evento"
              required
              value={category}
              onChange={(e) => {
                const value = e.target.value as NoteCategory | '';
                setCategory(value === '' ? DEFAULT_CATEGORY : value);
                if (error) setError('');
              }}
              className="w-full appearance-none cursor-pointer rounded-xl border border-zinc-700/80 bg-[#1a1a1e] py-2.5 pl-10 pr-9 text-base sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            >
              <option value="">Selecione a categoria</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#1a1a1e]">
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute inset-y-0 right-3 h-4 w-4 my-auto text-zinc-500" />
          </div>
        </div>

        {/* Division select (required) */}
        <div>
          <label
            htmlFor="note-division-input"
            className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase text-zinc-500"
          >
            <Building2 className="h-3 w-3" /> Divisão <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Building2 className="h-4 w-4" />
            </div>
            <select
              id="note-division-input"
              aria-label="Divisão da anotação"
              required
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
                if (error) setError('');
              }}
              className="w-full appearance-none cursor-pointer rounded-xl border border-zinc-700/80 bg-[#1a1a1e] py-2.5 pl-10 pr-9 text-base sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            >
              <option value="">Selecione a divisão</option>
              {divisionOptions.map((div) => (
                <option key={div} value={div} className="bg-[#1a1a1e]">
                  {div}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute inset-y-0 right-3 h-4 w-4 my-auto text-zinc-500" />
            {divisionOptions.length === 0 && (
              <span className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                <LogIn className="h-3 w-3" />
                Nenhuma divisão cadastrada. O administrador pode criar divisões no painel ADM.
              </span>
            )}
          </div>
        </div>

        {/* Primary Row: Date Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <input
              id="note-date-input"
              type="date"
              aria-label="Data da anotação"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full rounded-xl border border-zinc-700/80 bg-[#1a1a1e] py-2 pl-10 pr-3 text-base sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Clock className="h-4 w-4" />
            </div>
            <input
              id="note-time-input"
              type="time"
              aria-label="Horário da anotação"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="Horário (opcional)"
              className="w-full rounded-xl border border-zinc-700/80 bg-[#1a1a1e] py-2 pl-10 pr-3 text-base sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Content Textarea */}
        <div className="relative">
          <textarea
            id="note-content-input"
            rows={3}
            aria-label="Texto da anotação"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o texto do evento..."
            className="w-full resize-none rounded-xl border border-zinc-700/80 bg-[#1a1a1e] p-3 text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>

        {/* Local (Endereço do Evento) */}
        <div>
          <label
            htmlFor="note-location-input"
            className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase text-zinc-500"
          >
            <MapPin className="h-3 w-3" /> Local (Endereço do Evento) <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <MapPin className="h-4 w-4" />
            </div>
            <input
              id="note-location-input"
              type="text"
              aria-label="Local (Endereço do Evento)"
              required
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (error) setError('');
              }}
              placeholder="Local / endereço do evento..."
              className="w-full rounded-xl border border-zinc-700/80 bg-[#1a1a1e] py-2.5 pl-10 pr-3 text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-medium px-1">{error}</p>
        )}

        {/* Author info notice */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          {currentUser ? (
            <span>
              Publicando como:{' '}
              <strong className="text-slate-200">
                {currentUser.displayName || currentUser.email}
              </strong>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400">
              <LogIn className="h-3 w-3" />
              Você está publicando como convidado. Entre com Gmail para assinar.
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-1 flex flex-wrap gap-2">
          <button
            id="note-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-900/40 transition hover:from-amber-500 hover:to-amber-400 active:scale-[0.99] disabled:opacity-60"
          >
            {editingNote ? (
              <>
                <Check className="h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 stroke-[3]" />
                {isSubmitting ? 'Salvando...' : 'Salvar Evento'}
              </>
            )}
          </button>

          {editingNote && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
