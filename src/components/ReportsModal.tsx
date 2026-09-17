import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import {
  BarChart3,
  X,
  FileText,
  CalendarDays
} from 'lucide-react';
import { Note, DEFAULT_CATEGORY } from '../types';
import { formatDateToBR, formatDateToISO, MONTH_NAMES_PT } from '../utils/dateUtils';
import { Modal } from './Modal';

interface ReportsModalProps {
  notes: Note[];
  categories?: string[];
  isOpen: boolean;
  onClose: () => void;
  notify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  generatorName?: string;
  generatorEmail?: string;
}

type JsPDF = import('jspdf').jsPDF;

const BLACK: [number, number, number] = [0, 0, 0];

const MARGIN = 14;
const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const BOTTOM_LIMIT = PAGE_HEIGHT - 17;
const COL_DATA = MARGIN + 4;
const COL_DIVISAO = MARGIN + 24;
const COL_CATEGORIA = MARGIN + 58;
const COL_HORA = MARGIN + 82;
const COL_EVENTO = MARGIN + 94;
const COL_AUTOR = PAGE_WIDTH - MARGIN - 60;

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

async function loadImageAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function drawTitleHeader(pdf: JsPDF, reportTitle: string) {
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.setFontSize(13);
  pdf.text('AGENDA NORTE DO PARANÁ', MARGIN + 12, 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text('Relatório de eventos da regional', MARGIN + 12, 18.5);

  try {
    const logoDataUrl = await loadImageAsDataUrl('/insanos.png');
    pdf.addImage(logoDataUrl, 'PNG', MARGIN, 5, 10, 10);
  } catch {
    // ignore: report still works without the emblem
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(reportTitle, PAGE_WIDTH - MARGIN, 13, { align: 'right' });

  const now = new Date();
  const dateBR = formatDateToBR(now.toISOString().slice(0, 10));
  const timeHHMM = now.toTimeString().slice(0, 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(`Gerado em ${dateBR} às ${timeHHMM}`, PAGE_WIDTH - MARGIN, 18.5, { align: 'right' });

  pdf.setDrawColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, 22.2, PAGE_WIDTH - MARGIN, 22.2);
}

function drawContinuationHeader(pdf: JsPDF, reportTitle: string) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text('AGENDA NORTE DO PARANÁ', MARGIN, 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(reportTitle, PAGE_WIDTH - MARGIN, 12, { align: 'right' });

  pdf.setDrawColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, 14.5, PAGE_WIDTH - MARGIN, 14.5);
}

const DEFAULT_SIGNATURE = 'Siluar (Sid imc.sidnei@gmail.com)';

function drawReportFooter(
  pdf: JsPDF,
  signature: string = DEFAULT_SIGNATURE,
  pageNumber?: number,
  totalPages?: number
) {
  pdf.setDrawColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, PAGE_HEIGHT - 13, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text('Agenda Norte do Paraná', MARGIN, PAGE_HEIGHT - 8);

  pdf.text(`Gerado por ${signature}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 8, { align: 'center' });

  if (pageNumber !== undefined && totalPages !== undefined) {
    pdf.text(`Página ${pageNumber} de ${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, {
      align: 'right'
    });
  }
}

function applyPageFooters(pdf: JsPDF, signature: string = DEFAULT_SIGNATURE) {
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    drawReportFooter(pdf, signature, i, total);
  }
  pdf.setPage(total);
}

function drawColumnHeader(pdf: JsPDF, y: number) {
  pdf.setDrawColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, y + 7, PAGE_WIDTH - MARGIN, y + 7);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text('DATA', COL_DATA, y + 4);
  pdf.text('DIVISÃO', COL_DIVISAO, y + 4);
  pdf.text('CATEGORIA', COL_CATEGORIA, y + 4);
  pdf.text('HORA', COL_HORA, y + 4);
  pdf.text('EVENTO', COL_EVENTO, y + 4);
  pdf.text('AUTOR', COL_AUTOR, y + 4);
}

function drawGroupHeader(pdf: JsPDF, y: number, label: string, count: number) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(label.toUpperCase(), MARGIN + 4.5, y);

  pdf.setFontSize(8.5);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(`${count} evento(s)`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
}

interface NoteRowMetrics {
  titleLines: string[];
  categoryLines: string[];
  authorLines: string[];
  divisionLine: string;
  divisionLines: string[];
  rowHeight: number;
}

function measureNoteRow(pdf: JsPDF, note: Note): NoteRowMetrics {
  const category = note.category || DEFAULT_CATEGORY;
  const author = noteAuthor(note) || '—';
  const titleLines = pdf.splitTextToSize(
    note.content,
    COL_AUTOR - COL_EVENTO - 6
  ) as string[];
  const categoryLines = pdf.splitTextToSize(
    category,
    COL_HORA - COL_CATEGORIA - 2
  ) as string[];
  const authorLines = (
    pdf.splitTextToSize(
      author,
      PAGE_WIDTH - MARGIN - COL_AUTOR - 4
    ) as string[]
  ).slice(0, 2);
  const divisionLine = note.division ? note.division : '';
  const divisionLines = divisionLine
    ? (pdf.splitTextToSize(divisionLine, COL_CATEGORIA - COL_DIVISAO - 1) as string[])
    : [];
  const titleBlock = titleLines.length * 6 + 5;
  const categoryBlock = categoryLines.length * 5;
  const authorBlock = authorLines.length * 5;
  const divisionBlock = divisionLines.length * 6 + 1.5;
  const rowHeight = Math.max(16, titleBlock, categoryBlock, authorBlock, divisionBlock) + 3;
  return { titleLines, categoryLines, authorLines, divisionLine, divisionLines, rowHeight };
}

function renderNoteRow(pdf: JsPDF, note: Note, y: number, _zebra: boolean, metrics: NoteRowMetrics) {
  const {
    titleLines,
    categoryLines,
    authorLines,
    divisionLine,
    divisionLines,
    rowHeight
  } = metrics;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(formatDateToBR(note.date), COL_DATA, y + 5);

  if (divisionLine) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
    pdf.text(divisionLines, COL_DIVISAO, y + 5);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(categoryLines, COL_CATEGORIA, y + 5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(note.time || '—', COL_HORA, y + 5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(titleLines, COL_EVENTO, y + 5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.text(authorLines, COL_AUTOR, y + 5);

  pdf.setDrawColor(BLACK[0], BLACK[1], BLACK[2]);
  pdf.setLineWidth(0.25);
  pdf.line(MARGIN + 2, y + rowHeight - 1, PAGE_WIDTH - MARGIN - 2, y + rowHeight - 1);
}

function startNewPage(pdf: JsPDF, reportTitle: string) {
  pdf.addPage();
  drawContinuationHeader(pdf, reportTitle);
  return { y: 20, hasColumnHeader: false };
}

export const ReportsModal: FC<ReportsModalProps> = ({
  notes,
  isOpen,
  onClose,
  notify,
  generatorName,
  generatorEmail
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  const todayISO = formatDateToISO(new Date());

  const generatorLabel =
    generatorName && generatorEmail
      ? `${generatorName} (${generatorEmail})`
      : generatorEmail || DEFAULT_SIGNATURE;

  const sortedNotes = useMemo(
    () =>
      notes
        .filter((note) => note.date >= todayISO)
        .sort((a, b) => {
          const dateOrder = a.date.localeCompare(b.date);
          if (dateOrder !== 0) return dateOrder;
          return (a.time || '').localeCompare(b.time || '');
        }),
    [notes, todayISO]
  );

  const exportPdfDetailed = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      await drawTitleHeader(pdf, 'Relatório Detalhado');

      let y = 29;
      drawColumnHeader(pdf, y);
      y += 14;

      if (sortedNotes.length === 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
        pdf.text('Nenhuma anotação na agenda para este relatório.', MARGIN, y);
      } else {
        let lastMonthKey = '';
        let lastDivision: string | null = null;
        let zebraBand = false;
        for (const note of sortedNotes) {
          const monthKey = monthKeyOf(note.date);
          if (monthKey !== lastMonthKey) {
            lastMonthKey = monthKey;
            if (y + 16 > BOTTOM_LIMIT) {
              const next = startNewPage(pdf, 'Relatório Detalhado');
              y = next.y;
              drawColumnHeader(pdf, y);
              y += 14;
            } else {
              y += 4;
            }
            const monthCount = sortedNotes.filter((n) => monthKeyOf(n.date) === monthKey).length;
            drawGroupHeader(pdf, y, monthLabel(monthKey), monthCount);
            y += 9;
          }

          const metrics = measureNoteRow(pdf, note);
          if (y + metrics.rowHeight > BOTTOM_LIMIT) {
            const next = startNewPage(pdf, 'Relatório Detalhado');
            y = next.y;
            drawColumnHeader(pdf, y);
            y += 14;
          }

          const noteDivision = note.division || '';
          if (noteDivision !== lastDivision) {
            lastDivision = noteDivision;
            zebraBand = !zebraBand;
          }
          renderNoteRow(pdf, note, y, zebraBand, metrics);
          y += metrics.rowHeight;
        }
      }

      applyPageFooters(pdf, generatorLabel);
      pdf.save(`relatorio_detalhado_${new Date().toISOString().slice(0, 10)}.pdf`);
      notify?.('Relatório detalhado gerado com sucesso.', 'success');
    } catch (error) {
      console.error('Erro ao gerar PDF detalhado:', error);
      notify?.('Não foi possível gerar o PDF detalhado. Veja o console para mais detalhes.', 'error');
    }
  };

  const generateDetailed = async () => {
    if (isExporting) return;
    setReportDone(false);
    setIsExporting(true);
    try {
      await exportPdfDetailed();
      setReportDone(true);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setReportDone(false);
      setIsExporting(false);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Relatórios da agenda"
      maxWidthClass="max-w-3xl"
      showCloseButton={false}
      panelClassName="flex max-h-[94vh] flex-col overflow-hidden rounded-t-2xl rounded-b-none sm:rounded-2xl border border-zinc-700/80 bg-[#121215] shadow-2xl"
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
              Confirme para gerar a Agenda em PDF
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
        {notes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-[#141416]/50 p-10 text-center">
            <CalendarDays className="h-8 w-8 text-zinc-600" />
            <p className="text-sm font-medium text-zinc-300">
              Não há eventos cadastrados para gerar relatórios.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-[#18181b] p-8 text-center">
            {isExporting ? (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                  <FileText className="h-5 w-5 animate-pulse" />
                </span>
                <p className="text-sm font-bold text-white">Gerando relatório detalhado...</p>
                <p className="text-xs text-zinc-400">
                  Aguarde enquanto o PDF com todos os eventos é gerado.
                </p>
              </>
            ) : reportDone ? (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                  <FileText className="h-5 w-5" />
                </span>
                <p className="text-sm font-bold text-white">
                  Relatório detalhado gerado com sucesso.
                </p>
                <p className="text-xs text-zinc-400">
                  O download do PDF foi iniciado automaticamente.
                </p>
                <button
                  onClick={generateDetailed}
                  disabled={isExporting}
                  className="mt-1 rounded-xl bg-sky-500/15 px-4 py-2 text-xs font-bold text-sky-300 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Gerar novamente
                </button>
              </>
            ) : (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                  <FileText className="h-5 w-5" />
                </span>
                <p className="text-sm font-bold text-white">
                  Deseja gerar a Agenda em PDF?
                </p>
                <p className="text-xs text-zinc-400">
                  Será baixado um arquivo PDF com todos os eventos a partir de hoje.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={generateDetailed}
                    disabled={isExporting}
                    className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-900/30 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sim, gerar
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-5 py-2 text-xs font-bold text-zinc-200 transition hover:bg-zinc-700"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};