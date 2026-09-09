import type { FC } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Note, NoteCategory } from '../types';
import {
  MONTH_NAMES_PT,
  WEEKDAYS_PT,
  getCalendarDays,
  formatDateToISO
} from '../utils/dateUtils';
import { Watermark } from './Watermark';
import { getCategoryStyle } from '../utils/categoryStyles';

interface CalendarProps {
  currentDate: Date;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onChangeMonth: (increment: number) => void;
  onChangeYear?: (increment: number) => void;
  onGoToToday: () => void;
  notes: Note[];
}

export const Calendar: FC<CalendarProps> = ({
  currentDate,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  onChangeYear,
  onGoToToday,
  notes
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = getCalendarDays(year, month, selectedDate, notes);
  const monthTitle = `${MONTH_NAMES_PT[month]}`;

  const todayStr = formatDateToISO(new Date());

  return (
    <div
      id="calendar-container"
      className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#161619]/85 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all"
    >
      {/* Background Watermark */}
      <Watermark />

      {/* Calendar Header */}
      <div className="relative z-10 mb-4 flex items-start justify-between px-1">
        <button
          id="prev-month-btn"
          onClick={() => onChangeMonth(-1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-100 active:scale-95"
          title="Mês anterior"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center">
          <h2 key="month-title" className="text-base sm:text-lg font-bold tracking-wide text-zinc-100">
            {monthTitle}
          </h2>
          {/* Year navigation */}
          <div className="mt-0.5 flex items-center gap-1">
            {onChangeYear && (
              <button
                onClick={() => onChangeYear(-1)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200 active:scale-95"
                title="Ano anterior"
                aria-label="Ano anterior"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
            )}
            <span className="min-w-[52px] text-center text-xs font-bold text-zinc-300 tabular-nums">
              {year}
            </span>
            {onChangeYear && (
              <button
                onClick={() => onChangeYear(1)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200 active:scale-95"
                title="Próximo ano"
                aria-label="Próximo ano"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <button
          id="next-month-btn"
          onClick={() => onChangeMonth(1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-100 active:scale-95"
          title="Próximo mês"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers: Seg, Ter, Qua, Qui, Sex, Sáb, Dom */}
      <div className="relative z-10 grid grid-cols-7 mb-2 text-center">
        {WEEKDAYS_PT.map((dayName) => (
          <div
            key={dayName}
            className="py-1 text-xs font-semibold text-zinc-400 tracking-tight"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Days Grid (animated on month/year change) */}
      <motion.div
        key={`${year}-${month}`}
        className="relative z-10 grid grid-cols-7 gap-1 sm:gap-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {calendarDays.map((day, idx) => {
          if (!day.isCurrentMonth) {
            // Keep empty slot for clean layout matching screenshot
            return <div key={`empty-${idx}`} className="h-12 sm:h-13 w-full" />;
          }

          const isSelected = day.isSelected;
          const isToday = day.dateString === todayStr;
          const dayNotes = notes.filter((note) => note.date === day.dateString);
          const categoryKeys: NoteCategory[] = Array.from(
            new Set(dayNotes.map((note) => note.category || 'Geral'))
          );
          const primaryCategory = dayNotes[0]?.category || 'Geral';
          const calendarCategoryStyle = getCategoryStyle(primaryCategory);

          return (
            <button
              key={day.dateString}
              id={`calendar-day-${day.dateString}`}
              onClick={() => onSelectDate(day.dateString)}
              className={`group relative flex h-12 sm:h-13 w-full flex-col items-center justify-center rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? 'border-2 border-amber-500 bg-amber-950/40 text-amber-200 shadow-md shadow-amber-900/30'
                  : isToday
                  ? 'bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30 hover:bg-amber-500/30'
                  : day.hasNotes
                  ? `${calendarCategoryStyle.calendar} border-2 font-semibold shadow-lg hover:brightness-125`
                  : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white'
              }`}
            >
              <span className="leading-none">{day.dayNumber}</span>

              {/* Category markers */}
              {day.hasNotes && (
                <span className="mt-1 flex items-center gap-0.5" title={`${day.notesCount} anotação(ões)`}>
                  {categoryKeys.slice(0, 3).map((category) => (
                    <span
                      key={category}
                      className={`h-1.5 w-1.5 rounded-full ring-1 ring-black/30 ${getCategoryStyle(category).active.split(' ')[1]}`}
                    />
                  ))}
                  {day.notesCount > 3 && <span className="text-[8px] font-bold">+</span>}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Bottom Footer: "Hoje" button */}
      <div className="relative z-10 mt-3 flex justify-end px-1">
        <button
          id="calendar-today-btn"
          onClick={onGoToToday}
          className="text-xs font-semibold text-zinc-400 transition hover:text-amber-400"
        >
          Hoje
        </button>
      </div>
    </div>
  );
};