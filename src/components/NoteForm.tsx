import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  FileText,
  Calendar as CalendarIcon,
  Plus,
  Check,
  X,
  Clock,
  MapPin,
  Tag,
  LogIn
} from 'lucide-react';
import { Note, NoteCategory, AppUser, CATEGORIES } from '../types';
import { formatDateToISO } from '../utils/dateUtils';
import { getCategoryStyle } from '../utils/categoryStyles';

interface NoteFormProps {
  selectedDate: string;
  editingNote: Note | null;
  currentUser: AppUser | null;
  onSaveNote: (noteData: {
    title: string;
    content: string;
    date: string;
    time?: string;
    location?: string;
    category?: NoteCategory;
  }) => Promise<void>;
  onCancelEdit: () => void;
}

export const NoteForm: FC<NoteFormProps> = ({
  selectedDate,
  editingNote,
  currentUser,
  onSaveNote,
  onCancelEdit
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dateStr, setDateStr] = useState(selectedDate || formatDateToISO(new Date()));
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<NoteCategory>('Geral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Synchronize when editing or when date is selected on calendar
  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setDateStr(editingNote.date);
      setTime(editingNote.time || '');
      setLocation(editingNote.location || '');
      setCategory(editingNote.category || 'Geral');
    } else {
      setTitle('');
      setContent('');
      setTime('');
      setLocation('');
      setCategory('Geral');
      if (selectedDate) {
        setDateStr(selectedDate);
      }
    }
    setError('');
  }, [editingNote, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe o título da anotação.');
      return;
    }
    if (!dateStr) {
      setError('Por favor, selecione uma data válida.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveNote({
        title: title.trim(),
        content: content.trim(),
        date: dateStr,
        time: time.trim() || undefined,
        location: location.trim() || undefined,
        category
      });

      if (!editingNote) {
        setTitle('');
        setContent('');
        setTime('');
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
            {editingNote ? 'Editar anotação' : 'Nova anotação'}
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
        {/* Title Input with Icon */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <FileText className="h-4 w-4" />
          </div>
          <input
            id="note-title-input"
            type="text"
            aria-label="Título da anotação"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="Título da anotação"
            className="w-full rounded-xl border border-zinc-700/80 bg-[#1a1a1e] py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>

        {/* Content Textarea */}
        <div className="relative">
          <textarea
            id="note-content-input"
            rows={3}
            aria-label="Descrição da anotação"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o texto da anotação..."
            className="w-full resize-none rounded-xl border border-zinc-700/80 bg-[#1a1a1e] p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
          />
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
              className="w-full rounded-xl border border-zinc-700/80 bg-[#1a1a1e] py-2 pl-10 pr-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
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
              className="w-full rounded-xl border border-zinc-700/80 bg-[#1a1a1e] py-2 pl-10 pr-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Category selector chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1">
            <Tag className="h-3 w-3" /> Categoria:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                category === cat
                  ? `${getCategoryStyle(cat).selected} font-semibold`
                  : 'border-transparent bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Location input (Optional) */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <input
            id="note-location-input"
            type="text"
            aria-label="Localização ou link da anotação"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Localização / Link (opcional)"
            className="w-full rounded-xl border border-zinc-700/80 bg-[#1a1a1e] py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
          />
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
                {isSubmitting ? 'Publicando...' : 'Adicionar'}
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
