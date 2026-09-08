import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Note } from '../types';
import {
  MONTH_NAMES_PT,
  WEEKDAYS_PT,
  getCalendarDays,
  formatDateToISO
} from '../utils/dateUtils';
import { Watermark } from './Watermark';

interface CalendarProps {
  currentDate: Date;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onChangeMonth: (increment: number) => void;
  onGoToToday: () => void;
  notes: Note[];
}

export const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  onGoToToday,
  notes
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = getCalendarDays(year, month, selectedDate, notes);
  const monthTitle = `${MONTH_NAMES_PT[month]} De ${year}`;

  const todayStr = formatDateToISO(new Date());

  return (
    <div
      id="calendar-container"
      className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#161619]/85 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all"
    >
      {/* Background Watermark */}
      <Watermark />

      {/* Calendar Header */}
      <div className="relative z-10 mb-4 flex items-center justify-between px-1">
        <button
          id="prev-month-btn"
          onClick={() => onChangeMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-100"
          title="Mês anterior"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <h2 className="text-base sm:text-lg font-bold tracking-wide text-zinc-100">
          {monthTitle}
        </h2>

        <button
          id="next-month-btn"
          onClick={() => onChangeMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-100"
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

      {/* Days Grid */}
      <div className="relative z-10 grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendarDays.map((day, idx) => {
          if (!day.isCurrentMonth) {
            // Keep empty slot for clean layout matching screenshot
            return <div key={`empty-${idx}`} className="h-10 sm:h-12 w-full" />;
          }

          const isSelected = day.isSelected;
          const isToday = day.dateString === todayStr;

          return (
            <button
              key={day.dateString}
              id={`calendar-day-${day.dateString}`}
              onClick={() => onSelectDate(day.dateString)}
              className={`group relative flex h-10 sm:h-12 w-full flex-col items-center justify-center rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? 'border-2 border-amber-500 bg-amber-950/40 text-amber-200 shadow-md shadow-amber-900/30'
                  : isToday
                  ? 'bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30 hover:bg-amber-500/30'
                  : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white'
              }`}
            >
              <span className="leading-none">{day.dayNumber}</span>

              {/* Event Marker Dot */}
              {day.hasNotes && (
                <span
                  className={`mt-1 h-1.5 w-1.5 rounded-full ${
                    isSelected
                      ? 'bg-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-amber-500'
                  }`}
                  title={`${day.notesCount} anotação(ões)`}
                />
              )}
            </button>
          );
        })}
      </div>

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
