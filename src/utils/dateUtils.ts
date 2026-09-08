import { Note, DayInfo } from '../types';

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

export const WEEKDAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateToBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format ISO created timestamp to "DD/MM/YYYY, HH:mm"
 */
export function formatDateTimeBR(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

/**
 * Generates calendar grid for a given year and month (0-indexed).
 * Starts week on Monday (Segunda-feira).
 */
export function getCalendarDays(
  year: number,
  month: number,
  selectedDateStr: string,
  notes: Note[]
): DayInfo[] {
  const today = new Date();
  const todayISO = formatDateToISO(today);

  // Map notes count by date
  const notesByDate: Record<string, number> = {};
  for (const note of notes) {
    notesByDate[note.date] = (notesByDate[note.date] || 0) + 1;
  }

  // First day of target month
  const firstDayOfMonth = new Date(year, month, 1);
  // Get day of week: Sunday is 0, Monday is 1, ..., Saturday is 6
  let startingDayOfWeek = firstDayOfMonth.getDay();
  // Adjust so Monday is 0, Sunday is 6
  let mondayStartIndex = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  // Total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: DayInfo[] = [];

  // Padding days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = mondayStartIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const date = new Date(year, month - 1, dayNum);
    const dateString = formatDateToISO(date);
    days.push({
      date,
      dateString,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateString === todayISO,
      isSelected: dateString === selectedDateStr,
      hasNotes: !!notesByDate[dateString],
      notesCount: notesByDate[dateString] || 0
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateString = formatDateToISO(date);
    days.push({
      date,
      dateString,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateString === todayISO,
      isSelected: dateString === selectedDateStr,
      hasNotes: !!notesByDate[dateString],
      notesCount: notesByDate[dateString] || 0
    });
  }

  // Trailing padding days to fill 5 or 6 weeks (grid of multiples of 7)
  const totalSlots = days.length <= 35 ? 35 : 42;
  const remainingSlots = totalSlots - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    const date = new Date(year, month + 1, i);
    const dateString = formatDateToISO(date);
    days.push({
      date,
      dateString,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: dateString === todayISO,
      isSelected: dateString === selectedDateStr,
      hasNotes: !!notesByDate[dateString],
      notesCount: notesByDate[dateString] || 0
    });
  }

  return days;
}
