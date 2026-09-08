import React, { useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Download,
  MapPin,
  Search,
  User,
  X
} from 'lucide-react';
import { Note, NoteCategory } from '../types';
import { formatDateToBR } from '../utils/dateUtils';
import { getCategoryStyle } from '../utils/categoryStyles';

interface ReportsModalProps {
  notes: Note[];
  isOpen: boolean;
  onClose: () => void;
  onViewNote: (note: Note) => void;
}

const CATEGORIES: NoteCategory[] = ['Reunião', 'Passeio', 'Evento', 'Aviso', 'Geral'];

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
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
  const [reportFormat, setReportFormat] = useState<'detalhado' | 'por-data'>('por-data');

  if (!isOpen) return null;

  const authors: string[] = Array.from(
    new Set<string>(notes.map((note) => note.authorName || note.authorEmail || note.createdBy).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b));
  const locations: string[] = Array.from(
    new Set<string>(notes.map((note) => note.location).filter((value): value is string => Boolean(value)))
  ).sort((a, b) => a.localeCompare(b));

  const filteredNotes = notes.filter((note) => {
    const query = search.trim().toLowerCase();
    const searchable = [
      note.title,
      note.content,
      note.location || '',
      note.authorName || '',
      note.authorEmail || '',
      note.createdBy
    ].join(' ').toLowerCase();

    if (query && !searchable.includes(query)) return false;
    if (startDate && note.date < startDate) return false;
    if (endDate && note.date > endDate) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(note.category || 'Geral')) return false;
    if (author !== 'Todos' && (note.authorName || note.authorEmail || note.createdBy) !== author) return false;
    if (location !== 'Todos' && note.location !== location) return false;
    if (priority !== 'Todas' && (note.priority || 'normal') !== priority) return false;
    return true;
  });

  const categoryTotals = CATEGORIES.map((category) => ({
    category,
    total: filteredNotes.filter((note) => (note.category || 'Geral') === category).length
  }));

  const toggleCategory = (category: NoteCategory) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setSelectedCategories([]);
    setAuthor('Todos');
    setLocation('Todos');
    setPriority('Todas');
  };

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const dateOrder = a.date.localeCompare(b.date);
    if (dateOrder !== 0) return dateOrder;
    return (a.time || '').localeCompare(b.time || '');
  });

  const exportReport = () => {
    const header = ['Título', 'Data', 'Horário', 'Categoria', 'Prioridade', 'Local', 'Autor', 'Descrição'];
    const rows = filteredNotes.map((note) => [
      note.title,
      note.date,
      note.time || '',
      note.category || 'Geral',
      note.priority || 'normal',
      note.location || '',
      note.authorName || note.authorEmail || note.createdBy,
      note.content
    ]);
    const csv = [header, ...rows].map((row) => row.map((value) => escapeCsv(value)).join(';')).join('\r\n');
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
    let y = 18;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Relatório de eventos', 14, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Gerado em ${formatDateToBR(new Date().toISOString().slice(0, 10))}`, 14, y);
    pdf.text(`Total: ${filteredNotes.length}`, pageWidth - 14, y, { align: 'right' });
    y += 10;

    pdf.setDrawColor(210, 210, 214);
    pdf.line(14, y, pageWidth - 14, y);
    y += 8;
    pdf.setFontSize(10);

    if (filteredNotes.length === 0) {
      pdf.text('Nenhuma anotação corresponde aos filtros selecionados.', 14, y);
    } else {
      for (const note of sortedNotes) {
        const line = `${formatDateToBR(note.date)}${note.time ? ` | ${note.time}` : ''} | ${note.title}`;
        const lines = pdf.splitTextToSize(line, pageWidth - 28) as string[];
        if (y + lines.length * 6 > 282) {
          pdf.addPage();
          y = 18;
        }
        pdf.text(lines, 14, y);
        y += lines.length * 6;
      }
    }

    pdf.save(`relatorio_eventos_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reports-title"
      className="report-modal fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5"
    >
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#121215] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
              <BarChart3 className="h-5 w-5" />
            </div>
                    <div>
              <h2 id="reports-title" className="text-base font-bold text-white sm:text-lg">Relatórios da agenda</h2>
              <p className="text-[11px] text-zinc-400">Filtros combináveis sobre os dados do Firestore</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar relatório" className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="report-content overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar título, descrição, autor ou local" className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] py-2.5 pl-10 pr-3 text-xs text-zinc-100 outline-none focus:border-sky-500" />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">Data inicial</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500" />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">Data final</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500" />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">Autor</span>
              <select value={author} onChange={(event) => setAuthor(event.target.value)} className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500">
                <option>Todos</option>
                {authors.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">Local</span>
              <select value={location} onChange={(event) => setLocation(event.target.value)} className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500">
                <option>Todos</option>
                {locations.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">Prioridade</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value)} className="w-full rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-sky-500">
                <option>Todas</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-4">
            <span className="mr-1 text-[10px] font-semibold uppercase text-zinc-500">Categorias</span>
            {CATEGORIES.map((category) => (
              <button key={category} onClick={() => toggleCategory(category)} className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${selectedCategories.includes(category) ? getCategoryStyle(category).active : `${getCategoryStyle(category).badge} opacity-70 hover:opacity-100`}`}>
                {category}
              </button>
            ))}
            <button onClick={clearFilters} className="ml-auto text-[11px] font-semibold text-zinc-400 underline-offset-2 hover:text-white hover:underline">Limpar filtros</button>
          </div>

          <div className="report-format mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-semibold uppercase text-zinc-500">Formato</span>
            <button onClick={() => setReportFormat('detalhado')} className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${reportFormat === 'detalhado' ? 'border-sky-500 bg-sky-600 text-white' : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'}`}>Detalhado</button>
            <button onClick={() => setReportFormat('por-data')} className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${reportFormat === 'por-data' ? 'border-sky-500 bg-sky-600 text-white' : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'}`}>Evento por data</button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-xl border border-zinc-800 bg-[#18181b] p-3 lg:col-span-1">
              <span className="text-[10px] uppercase text-zinc-500">Resultado</span>
              <strong className="mt-1 block text-2xl text-white">{filteredNotes.length}</strong>
            </div>
            {categoryTotals.map(({ category, total }) => (
              <div key={category} className={`rounded-xl border bg-[#18181b] p-3 ${getCategoryStyle(category).badge}`}>
                <span className="text-[10px] uppercase opacity-80">{category}</span>
                <strong className="mt-1 block text-xl text-white">{total}</strong>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-[#18181b] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200"><CalendarDays className="h-4 w-4 text-sky-300" />Detalhamento</div>
              <div className="flex items-center gap-2">
                <button onClick={exportPdfReport} disabled={filteredNotes.length === 0} className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-3.5 w-3.5" />PDF</button>
                <button onClick={exportReport} disabled={filteredNotes.length === 0} className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 px-2.5 py-1.5 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-3.5 w-3.5" />CSV</button>
              </div>
            </div>
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">Nenhuma anotação corresponde aos filtros selecionados.</div>
            ) : reportFormat === 'por-data' ? (
              <div className="divide-y divide-zinc-800/80">
                {sortedNotes.map((note) => (
                  <button key={note.id} onClick={() => onViewNote(note)} className="block w-full truncate px-4 py-2.5 text-left text-xs transition hover:bg-zinc-800/40">
                    <span className="font-semibold text-sky-300">{formatDateToBR(note.date)}</span>
                    <span className="text-zinc-500">{note.time ? ` | ${note.time}` : ''}</span>
                    <span className="text-zinc-500">{' | '}</span>
                    <strong className="text-zinc-100">{note.title}</strong>
                  </button>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {filteredNotes.map((note) => (
                  <button key={note.id} onClick={() => onViewNote(note)} className="flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-zinc-800/40 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <strong className="block truncate text-xs text-zinc-100">{note.title}</strong>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500"><span>{formatDateToBR(note.date)}{note.time ? ` às ${note.time}` : ''}</span><span className={`rounded border px-1.5 py-0.5 ${getCategoryStyle(note.category).badge}`}>{note.category || 'Geral'}</span></span>
                    </span>
                    <span className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400"><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{note.location || 'Sem local'}</span><span className="flex items-center gap-1"><User className="h-3 w-3" />{note.authorName || note.authorEmail || note.createdBy}</span></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
