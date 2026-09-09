import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Download,
  MapPin,
  Search,
  User,
  X,
  TrendingUp,
  History,
  AlertTriangle,
  LayoutGrid,
  List as ListIcon,
  FilterX,
  CalendarX2
} from 'lucide-react';
import { Note, NoteCategory } from '../types';
import { formatDateToBR, formatDateToISO, MONTH_NAMES_PT } from '../utils/dateUtils';
import { getCategoryStyle } from '../utils/categoryStyles';
import { Modal } from './Modal';

interface ReportsModalProps {
  notes: Note[];
  isOpen: boolean;
  onClose: () => void;
  onViewNote: (note: Note) => void;
}

const CATEGORIES: NoteCategory[] = ['Reunião', 'Passeio', 'Evento', 'Aviso', 'Geral'];

const CATEGORY_BAR: Record<NoteCategory, string> = {
  Reunião: 'bg-sky-500',
  Passeio: 'bg-emerald-500',
  Evento: 'bg-violet-500',
  Aviso: 'bg-rose-500',
  Geral: 'bg-amber-500'
};

const PRIORITY_LABEL: Record<string, string> = {
  normal: 'Normal',
  alta: 'Alta'
};

function escapeCsv(value: unknown): string {
  const text = (value ?? '').toString();
  return `"${text.replace(/"/g, '""')}"`;
}

function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES_PT[Number(month) - 1]} ${year}`;
}

function noteAuthor(note: Note): string {
  return note.authorName || note.authorEmail || note.createdBy || 'Anônimo';
}

interface MonthGroup {
  key: string;
  label: string;
  count: number;
  notes: Note[];
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  notes,
  isOpen,
  onClose,
  onViewNote
}) => {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<NoteCategory[]>([]);
  const [author, setAuthor] = useState('Todos');
  const [location, setLocation] = useState('Todos');
  const [priority, setPriority] = useState('Todas');
  const [view, setView] = useState<'geral' | 'lista'>('geral');

  const todayISO = formatDateToISO(new Date());

  const authors = useMemo(
    () =>
      Array.from(
        new Set<string>(
          notes.map((note) => noteAuthor(note)).filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [notes]
  );

  const locations = useMemo(
    () =>
      Array.from(
        new Set<string>(
          notes.map((note) => note.location).filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [notes]
  );

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes.filter((note) => {
      if (query) {
        const searchable = [
          note.title,
          note.content,
          note.location || '',
          note.authorName || '',
          note.authorEmail || '',
          note.createdBy
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      if (startDate && note.date < startDate) return false;
      if (endDate && note.date > endDate) return false;
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(note.category || 'Geral')
      ) {
        return false;
      }
      if (author !== 'Todos' && noteAuthor(note) !== author) return false;
      if (location !== 'Todos' && note.location !== location) return false;
      if (priority !== 'Todas' && (note.priority || 'normal') !== priority) return false;
      return true;
    });
  }, [notes, search, startDate, endDate, selectedCategories, author, location, priority]);

  const sortedNotes = useMemo(
    () =>
      [...filteredNotes].sort((a, b) => {
        const dateOrder = a.date.localeCompare(b.date);
        if (dateOrder !== 0) return dateOrder;
        return (a.time || '').localeCompare(b.time || '');
      }),
    [filteredNotes]
  );

  const upcomingCount = filteredNotes.filter((note) => note.date >= todayISO).length;
  const completedCount = filteredNotes.length - upcomingCount;
  const highPriorityCount = filteredNotes.filter((note) => note.priority === 'alta').length;

  const categoryStats = useMemo(
    () =>
      CATEGORIES.map((category) => {
        const total = filteredNotes.filter((note) => (note.category || 'Geral') === category).length;
        return {
          category,
          total,
          pct: filteredNotes.length === 0 ? 0 : Math.round((total / filteredNotes.length) * 100)
        };
      }),
    [filteredNotes]
  );

  const authorStats = useMemo(() => {
    const counts = new Map<string, number>();
    filteredNotes.forEach((note) => {
      const name = noteAuthor(note);
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const sorted = Array.from(counts.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    const top = sorted.slice(0, 5);
    const rest = sorted.slice(5).reduce((acc, item) => acc + item.total, 0);
    return rest > 0 ? [...top, { name: 'Outros', total: rest }] : top;
  }, [filteredNotes]);

  const maxAuthorCount = Math.max(1, ...authorStats.map((item) => item.total));

  const monthStats = useMemo(() => {
    const counts = new Map<string, number>();
    filteredNotes.forEach((note) => {
      const key = monthKeyOf(note.date);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredNotes]);

  const maxMonthCount = Math.max(1, ...monthStats.map((item) => item.count));

  const monthGroups: MonthGroup[] = useMemo(() => {
    const groups = new Map<string, Note[]>();
    sortedNotes.forEach((note) => {
      const key = monthKeyOf(note.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(note);
    });
    return Array.from(groups.entries()).map(([key, groupNotes]) => ({
      key,
      label: monthLabel(key),
      count: groupNotes.length,
      notes: groupNotes
    }));
  }, [sortedNotes]);

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (startDate || endDate ? 1 : 0) +
    selectedCategories.length +
    (author !== 'Todos' ? 1 : 0) +
    (location !== 'Todos' ? 1 : 0) +
    (priority !== 'Todas' ? 1 : 0);

  const clearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setSelectedCategories([]);
    setAuthor('Todos');
    setLocation('Todos');
    setPriority('Todas');
  };

  const toggleCategory = (category: NoteCategory) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const exportCsv = () => {
    const header = [
      'Título',
      'Data',
      'Horário',
      'Categoria',
      'Prioridade',
      'Local',
      'Autor',
      'Descrição'
    ];
    const rows = sortedNotes.map((note) => [
      note.title,
      note.date,
      note.time || '',
      note.category || 'Geral',
      note.priority || 'normal',
      note.location || '',
      noteAuthor(note),
      note.content
    ]);
    const totalsRow = ['', '', '', '', '', '', '', `Total: ${sortedNotes.length}`];
    const csv = [header, ...rows, totalsRow]
      .map((row) => row.map((value) => escapeCsv(value)).join(';'))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `relatorio_agenda_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdfReport = async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const categoryColors: Record<NoteCategory, [number, number, number]> = {
      Reunião: [14, 116, 144],
      Passeio: [5, 150, 105],
      Evento: [124, 58, 237],
      Aviso: [225, 29, 72],
      Geral: [217, 119, 6]
    };

    const drawFooter = (pageNumber: number, totalPages: number) => {
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, pageHeight - 7, {
        align: 'right'
      });
    };

    // Header band
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 32, 'F');
    pdf.setFillColor(14, 165, 233);
    pdf.rect(0, 29, pageWidth, 3, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Agenda Norte do Paraná', margin, 21);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(186, 230, 253);
    pdf.text(
      `Gerado em ${formatDateToBR(new Date().toISOString().slice(0, 10))}`,
      pageWidth - margin,
      21,
      { align: 'right' }
    );

    let y = 46;

    // KPI cards
    const kpis = [
      { label: 'Total', value: filteredNotes.length },
      { label: 'Futuros / Hoje', value: upcomingCount },
      { label: 'Realizados', value: completedCount },
      { label: 'Prioridade alta', value: highPriorityCount }
    ];
    const cardGap = 3;
    const cardWidth = (contentWidth - cardGap * 3) / 4;
    kpis.forEach((kpi, index) => {
      const x = margin + index * (cardWidth + cardGap);
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(x, y, cardWidth, 20, 2, 2, 'FD');
      pdf.setFillColor(14, 165, 233);
      pdf.roundedRect(x, y, 2.5, 20, 1, 1, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text(kpi.label.toUpperCase(), x + 6, y + 8);
      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42);
      pdf.text(String(kpi.value), x + 6, y + 17);
    });
    y += 29;

    // Table header
    pdf.setFillColor(15, 23, 42);
    pdf.roundedRect(margin, y, contentWidth, 8.5, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('DATA', margin + 4, y + 6);
    pdf.text('HORA', margin + 27, y + 6);
    pdf.text('EVENTO', margin + 45, y + 6);
    pdf.text('CATEGORIA', pageWidth - margin - 102, y + 6);
    pdf.text('LOCAL / AUTOR', pageWidth - margin - 40, y + 6);
    y += 12;

    const colData = margin + 4;
    const colHora = margin + 27;
    const colEvento = margin + 45;
    const colCategoria = pageWidth - margin - 102;
    const colLocalAutor = pageWidth - margin - 40;

    if (filteredNotes.length === 0) {
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Nenhuma anotação corresponde aos filtros selecionados.', margin, y);
    } else {
      let lastMonthKey = '';
      for (const note of sortedNotes) {
        const monthKey = monthKeyOf(note.date);
        if (monthKey !== lastMonthKey) {
          lastMonthKey = monthKey;
          if (y > pageHeight - 40) {
            drawFooter(pdf.getCurrentPageInfo().pageNumber, 0);
            pdf.addPage();
            y = 20;
          }
          pdf.setFillColor(241, 245, 249);
          pdf.rect(margin, y - 4, contentWidth, 8, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(30, 41, 59);
          pdf.text(monthLabel(monthKey), margin + 4, y + 1);
          pdf.setTextColor(148, 163, 184);
          pdf.setFont('helvetica', 'normal');
          y += 9;
        }

        const category = note.category || 'Geral';
        const [red, green, blue] = categoryColors[category];
        const title = `${note.title}`;
        const titleLines = pdf.splitTextToSize(title, colCategoria - colEvento - 6) as string[];
        const subLine = [note.time || '', note.location || '', noteAuthor(note)]
          .filter(Boolean)
          .join(' • ');
        const subLines = subLine
          ? (pdf.splitTextToSize(subLine, colCategoria - colEvento - 6) as string[])
          : [];
        const rowHeight = Math.max(10, titleLines.length * 5 + (subLines.length ? 3 : 1) + 3);

        if (y + rowHeight > pageHeight - 20) {
          drawFooter(pdf.getCurrentPageInfo().pageNumber, 0);
          pdf.addPage();
          y = 20;
        }

        if (Math.floor((y - 100) / 11) % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, y - 4, contentWidth, rowHeight, 'F');
        }

        // Data
        pdf.setTextColor(30, 41, 59);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.text(formatDateToBR(note.date), colData, y + 2);
        // Hora
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text(note.time || '—', colHora, y + 2);
        // Evento
        pdf.setTextColor(30, 41, 59);
        pdf.text(titleLines, colEvento, y + 2);
        if (subLines.length) {
          pdf.setFontSize(7);
          pdf.setTextColor(148, 163, 184);
          pdf.text(subLines, colEvento, y + 2 + titleLines.length * 5);
          pdf.setFontSize(8.5);
        }
        // Categoria badge
        pdf.setFillColor(red, green, blue);
        pdf.roundedRect(colCategoria - 1, y - 2, 30, 6, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.text(category, colCategoria + 14, y + 2, { align: 'center' });
        // Local/Autor
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text(subLine.slice(0, 38) || '—', colLocalAutor, y + 2);

        y += rowHeight;
      }

      // Totals row
      pdf.setFillColor(15, 23, 42);
      pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text(`TOTAL: ${filteredNotes.length} anotação(ões)`, margin + 4, y + 5.5);
      pdf.text(`Futuros: ${upcomingCount}  •  Realizados: ${completedCount}  •  Alta prioridade: ${highPriorityCount}`, pageWidth - margin - 4, y + 5.5, { align: 'right' });
      y += 8;
      drawFooter(pdf.getCurrentPageInfo().pageNumber, 0);
    }

    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      drawFooter(i, totalPages);
    }

    pdf.save(`relatorio_agenda_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Relatórios da agenda"
      maxWidthClass="max-w-6xl"
      showCloseButton={false}
      panelClassName="flex max-h-[94vh] flex-col overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#121215] shadow-2xl"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 id="reports-title" className="text-base font-bold text-white sm:text-lg">
              Relatórios da agenda
            </h2>
            <p className="text-[11px] text-zinc-400">
              Estatísticas e listagem baseadas nos dados do Firestore
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar relatório"
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="report-content overflow-y-auto p-5 sm:p-6">
        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar título, descrição, autor ou local"
              className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] py-2.5 pl-10 pr-3 text-xs text-zinc-100 outline-none focus:border-sky-500"
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">
              Data inicial
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500"
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">
              Data final
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500"
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">
              Autor
            </span>
            <select
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500"
            >
              <option>Todos</option>
              {authors.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">
              Local
            </span>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500"
            >
              <option>Todos</option>
              {locations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">
              Prioridade
            </span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500"
            >
              <option>Todas</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-4">
          <span className="mr-1 text-[10px] font-semibold uppercase text-zinc-500">Categorias</span>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                selectedCategories.includes(category)
                  ? getCategoryStyle(category).active
                  : `${getCategoryStyle(category).badge} opacity-70 hover:opacity-100`
              }`}
            >
              {category}
            </button>
          ))}
          <button
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-zinc-400 underline-offset-2 transition hover:text-white hover:underline disabled:opacity-40 disabled:no-underline"
          >
            <FilterX className="h-3 w-3" />
            Limpar filtros ({activeFilterCount})
          </button>
        </div>

        {/* View toggle + exports */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setView('geral')}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                view === 'geral'
                  ? 'border-sky-500 bg-sky-600 text-white'
                  : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <LayoutGrid className="h-3 w-3" /> Visão geral
              </span>
            </button>
            <button
              onClick={() => setView('lista')}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                view === 'lista'
                  ? 'border-sky-500 bg-sky-600 text-white'
                  : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ListIcon className="h-3 w-3" /> Listagem detalhada
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPdfReport}
              disabled={filteredNotes.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
            <button
              onClick={exportCsv}
              disabled={filteredNotes.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 px-2.5 py-1.5 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          </div>
        </div>

        {view === 'geral' ? (
          <div className="mt-5 flex flex-col gap-5">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-[#18181b] p-3">
                <span className="text-[10px] uppercase text-zinc-500">Total (filtrados)</span>
                <strong className="mt-1 block text-2xl text-white">{filteredNotes.length}</strong>
                <span className="text-[10px] text-zinc-500">de {notes.length} no Firestore</span>
              </div>
              <div className="rounded-xl border border-sky-800/60 bg-sky-950/30 p-3">
                <span className="flex items-center gap-1 text-[10px] uppercase text-sky-300">
                  <TrendingUp className="h-3 w-3" /> Futuros / Hoje
                </span>
                <strong className="mt-1 block text-2xl text-white">{upcomingCount}</strong>
                <span className="text-[10px] text-sky-400/80">
                  {filteredNotes.length === 0
                    ? '0%'
                    : `${Math.round((upcomingCount / filteredNotes.length) * 100)}%`}{' '}
                  do total
                </span>
              </div>
              <div className="rounded-xl border border-violet-800/60 bg-violet-950/30 p-3">
                <span className="flex items-center gap-1 text-[10px] uppercase text-violet-300">
                  <History className="h-3 w-3" /> Realizados
                </span>
                <strong className="mt-1 block text-2xl text-white">{completedCount}</strong>
                <span className="text-[10px] text-violet-400/80">
                  {filteredNotes.length === 0
                    ? '0%'
                    : `${Math.round((completedCount / filteredNotes.length) * 100)}%`}{' '}
                  do total
                </span>
              </div>
              <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 p-3">
                <span className="flex items-center gap-1 text-[10px] uppercase text-rose-300">
                  <AlertTriangle className="h-3 w-3" /> Prioridade alta
                </span>
                <strong className="mt-1 block text-2xl text-white">{highPriorityCount}</strong>
                <span className="text-[10px] text-rose-400/80">
                  {filteredNotes.length === 0
                    ? '0%'
                    : `${Math.round((highPriorityCount / filteredNotes.length) * 100)}%`}{' '}
                  do total
                </span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Category breakdown */}
              <div className="rounded-xl border border-zinc-800 bg-[#18181b] p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Distribuição por categoria
                </h3>
                {categoryStats.filter((item) => item.total > 0).length === 0 ? (
                  <p className="text-xs text-zinc-500">Sem dados no intervalo atual.</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {categoryStats
                      .filter((item) => item.total > 0)
                      .map(({ category, total, pct }) => (
                        <div key={category}>
                          <div className="mb-1 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-zinc-200">{category}</span>
                            <span className="text-zinc-400">
                              {total} • {pct}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className={`h-full rounded-full ${CATEGORY_BAR[category]}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Author breakdown */}
              <div className="rounded-xl border border-zinc-800 bg-[#18181b] p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Distribuição por autor
                </h3>
                {authorStats.length === 0 ? (
                  <p className="text-xs text-zinc-500">Sem dados no intervalo atual.</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {authorStats.map(({ name, total }) => (
                      <div key={name}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                          <span className="min-w-0 truncate font-semibold text-zinc-200">
                            {name}
                          </span>
                          <span className="text-zinc-400">
                            {total} •{' '}
                            {filteredNotes.length === 0
                              ? '0'
                              : Math.round((total / filteredNotes.length) * 100)}
                            %
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-sky-500"
                            style={{ width: `${Math.round((total / maxAuthorCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly breakdown */}
            <div className="rounded-xl border border-zinc-800 bg-[#18181b] p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-300">
                Eventos por mês
              </h3>
              {monthStats.length === 0 ? (
                <p className="text-xs text-zinc-500">Sem dados no intervalo atual.</p>
              ) : (
                <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {monthStats.map(({ key, count }) => (
                    <div key={key} className="flex items-center gap-2 text-[11px]">
                      <span className="w-24 shrink-0 font-semibold text-zinc-200">
                        {monthLabel(key)}
                      </span>
                      <div className="flex h-5 flex-1 items-center overflow-hidden rounded bg-zinc-800">
                        <div
                          className="flex h-full items-center rounded bg-sky-500/90 px-1.5 text-[9px] font-bold text-white"
                          style={{ width: `${Math.max(8, (count / maxMonthCount) * 100)}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-[#141416]/50 p-10 text-center">
                <CalendarX2 className="h-8 w-8 text-zinc-600" />
                <p className="text-sm font-medium text-zinc-300">
                  Nenhuma anotação corresponde aos filtros selecionados.
                </p>
                <p className="text-xs text-zinc-500">
                  Ajuste os filtros acima ou clique em "Limpar filtros".
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-[#18181b] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <CalendarDays className="h-4 w-4 text-sky-300" />
                    Listagem detalhada
                    <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] text-sky-300">
                      {filteredNotes.length} evento(s)
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-zinc-800/80">
                  {monthGroups.map((group) => (
                    <div key={group.key}>
                      <div className="flex items-center justify-between bg-zinc-900/70 px-4 py-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                          {group.label}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {group.count} evento(s)
                        </span>
                      </div>
                      <div className="divide-y divide-zinc-800/60">
                        {group.notes.map((note) => (
                          <button
                            key={note.id}
                            onClick={() => onViewNote(note)}
                            className="flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-zinc-800/40 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-xs text-zinc-100">
                                {note.time && (
                                  <span className="mr-2 rounded bg-zinc-700/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                                    {note.time}
                                  </span>
                                )}
                                <strong>{note.title}</strong>
                                {note.priority === 'alta' && (
                                  <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-rose-600/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-300">
                                    <AlertTriangle className="h-2.5 w-2.5" /> Alta
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                                <span className="text-sky-300">{formatDateToBR(note.date)}</span>
                                <span
                                  className={`rounded border px-1.5 py-0.5 ${getCategoryStyle(note.category).badge}`}
                                >
                                  {note.category || 'Geral'}
                                </span>
                              </span>
                            </span>
                            <span className="flex shrink-0 flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                              {note.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {note.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {noteAuthor(note)}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};