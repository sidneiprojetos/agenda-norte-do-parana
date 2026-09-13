import { useMemo, useState } from 'react';
import type { FC } from 'react';
import {
  BarChart3,
  X,
  FileText,
  CalendarDays,
  Tags,
  Building2
} from 'lucide-react';
import { Note, NoteCategory, CATEGORIES, DEFAULT_CATEGORY } from '../types';
import { formatDateToBR, formatDateToISO, MONTH_NAMES_PT } from '../utils/dateUtils';
import { getDivisionRgb } from '../utils/divisionStyles';
import { Modal } from './Modal';

interface ReportsModalProps {
  notes: Note[];
  isOpen: boolean;
  onClose: () => void;
  notify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  generatorName?: string;
  generatorEmail?: string;
}

type JsPDF = import('jspdf').jsPDF;

const PDF_CATEGORY_COLORS: Record<NoteCategory, [number, number, number]> = {
  Reunião: [2, 132, 199],
  Pub: [5, 150, 105],
  Coletamento: [124, 58, 237],
  'Ação Social': [225, 29, 72]
};

const ACCENT = [14, 165, 233];
const SLATE_900 = [15, 23, 42];
const SLATE_600 = [71, 85, 105];
const SLATE_500 = [100, 116, 139];
const SLATE_300 = [203, 213, 225];

const MARGIN = 14;
const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const BOTTOM_LIMIT = PAGE_HEIGHT - 17;
const COL_DATA = MARGIN + 4;
const COL_DIVISAO = MARGIN + 22;
const COL_CATEGORIA = MARGIN + 46;
const COL_HORA = MARGIN + 74;
const COL_EVENTO = MARGIN + 86;
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
  pdf.setTextColor(SLATE_900[0], SLATE_900[1], SLATE_900[2]);
  pdf.setFontSize(13);
  pdf.text('AGENDA NORTE DO PARANÁ', MARGIN + 12, 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(SLATE_600[0], SLATE_600[1], SLATE_600[2]);
  pdf.text('Relatório de eventos da região', MARGIN + 12, 18.5);

  try {
    const logoDataUrl = await loadImageAsDataUrl('/insanos.png');
    pdf.addImage(logoDataUrl, 'PNG', MARGIN, 5, 10, 10);
  } catch {
    // ignore: report still works without the emblem
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  pdf.text(reportTitle, PAGE_WIDTH - MARGIN, 13, { align: 'right' });

  const now = new Date();
  const dateBR = formatDateToBR(now.toISOString().slice(0, 10));
  const timeHHMM = now.toTimeString().slice(0, 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(SLATE_500[0], SLATE_500[1], SLATE_500[2]);
  pdf.text(`Gerado em ${dateBR} às ${timeHHMM}`, PAGE_WIDTH - MARGIN, 18.5, { align: 'right' });

  pdf.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  pdf.rect(MARGIN, 21.5, PAGE_WIDTH - MARGIN * 2, 1.4, 'F');
}

function drawContinuationHeader(pdf: JsPDF, reportTitle: string) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(SLATE_900[0], SLATE_900[1], SLATE_900[2]);
  pdf.text('AGENDA NORTE DO PARANÁ', MARGIN, 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(SLATE_500[0], SLATE_500[1], SLATE_500[2]);
  pdf.text(reportTitle, PAGE_WIDTH - MARGIN, 12, { align: 'right' });

  pdf.setDrawColor(SLATE_300[0], SLATE_300[1], SLATE_300[2]);
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
  pdf.setDrawColor(SLATE_300[0], SLATE_300[1], SLATE_300[2]);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, PAGE_HEIGHT - 13, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(SLATE_500[0], SLATE_500[1], SLATE_500[2]);
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
  pdf.setFillColor(SLATE_900[0], SLATE_900[1], SLATE_900[2]);
  pdf.rect(MARGIN, y - 2, PAGE_WIDTH - MARGIN * 2, 9, 'F');

  pdf.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  pdf.rect(MARGIN, y - 2, 1.4, 9, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('DATA', COL_DATA, y + 4);
  pdf.text('DIVISÃO', COL_DIVISAO, y + 4);
  pdf.text('CATEGORIA', COL_CATEGORIA, y + 4);
  pdf.text('HORA', COL_HORA, y + 4);
  pdf.text('EVENTO', COL_EVENTO, y + 4);
  pdf.text('AUTOR', COL_AUTOR, y + 4);
}

function drawGroupHeader(pdf: JsPDF, y: number, label: string, count: number) {
  pdf.setFillColor(241, 245, 249);
  pdf.rect(MARGIN, y - 3.2, PAGE_WIDTH - MARGIN * 2, 7.4, 'F');

  pdf.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  pdf.rect(MARGIN, y - 3.2, 1.5, 7.4, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(SLATE_900[0], SLATE_900[1], SLATE_900[2]);
  pdf.text(label.toUpperCase(), MARGIN + 4.5, y);

  pdf.setFontSize(8.5);
  pdf.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  pdf.text(`${count} evento(s)`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
}

interface NoteRowMetrics {
  titleLines: string[];
  contentLines: string[];
  divisionLine: string;
  divisionLines: string[];
  rowHeight: number;
}

function measureNoteRow(pdf: JsPDF, note: Note): NoteRowMetrics {
  const titleLines = pdf.splitTextToSize(
    note.title,
    COL_AUTOR - COL_EVENTO - 6
  ) as string[];
  const contentLines = note.content
    ? (pdf.splitTextToSize(note.content, PAGE_WIDTH - MARGIN - COL_EVENTO) as string[])
    : [];
  const divisionLine = note.division ? note.division : '';
  const divisionLines = divisionLine
    ? (pdf.splitTextToSize(divisionLine, COL_CATEGORIA - COL_DIVISAO - 1) as string[])
    : [];
  const titleBlock = titleLines.length * 5 + 2;
  const contentBlock = contentLines.length * 4;
  const divisionBlock = divisionLines.length * 5 + 1;
  const rowHeight = Math.max(9, titleBlock + contentBlock, divisionBlock);
  return { titleLines, contentLines, divisionLine, divisionLines, rowHeight };
}

function renderNoteRow(pdf: JsPDF, note: Note, y: number, zebra: boolean, metrics: NoteRowMetrics) {
  const category = note.category || DEFAULT_CATEGORY;
  const [cRed, cGreen, cBlue] = PDF_CATEGORY_COLORS[category];
  const { titleLines, contentLines, divisionLine, divisionLines, rowHeight } = metrics;

  if (zebra) {
    pdf.setFillColor(246, 248, 251);
    pdf.rect(MARGIN, y - 0.6, PAGE_WIDTH - MARGIN * 2, rowHeight + 1.2, 'F');
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(SLATE_600[0], SLATE_600[1], SLATE_600[2]);
  pdf.text(formatDateToBR(note.date), COL_DATA, y + 2);

  if (divisionLine) {
    const divColor = getDivisionRgb(divisionLine);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(divColor[0], divColor[1], divColor[2]);
    pdf.text(divisionLines, COL_DIVISAO, y + 2);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(cRed, cGreen, cBlue);
  pdf.text(category, COL_CATEGORIA, y + 2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(SLATE_500[0], SLATE_500[1], SLATE_500[2]);
  pdf.text(note.time || '—', COL_HORA, y + 2);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(cRed, cGreen, cBlue);
  pdf.text(titleLines, COL_EVENTO, y + 2);

  const authorLine = (
    pdf.splitTextToSize(
      noteAuthor(note) || '—',
      PAGE_WIDTH - MARGIN - COL_AUTOR - 2
    ) as string[]
  ).slice(0, 1);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(SLATE_600[0], SLATE_600[1], SLATE_600[2]);
  pdf.text(authorLine, COL_AUTOR, y + 2);

  if (contentLines.length > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(60, 72, 88);
    pdf.text(contentLines, COL_EVENTO, y + titleLines.length * 5 + 2);
  }

  pdf.setDrawColor(SLATE_300[0], SLATE_300[1], SLATE_300[2]);
  pdf.setLineWidth(0.25);
  pdf.line(MARGIN + 2, y + rowHeight - 0.3, PAGE_WIDTH - MARGIN - 2, y + rowHeight - 0.3);
}

interface NoteGroup {
  key: string;
  label: string;
  notes: Note[];
}

function buildGroups(
  notes: Note[],
  keyOf: (note: Note) => string,
  labelOf: (key: string) => string
): NoteGroup[] {
  const map = new Map<string, Note[]>();
  notes.forEach((note) => {
    const key = keyOf(note);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(note);
  });
  return Array.from(map.entries()).map(([key, groupNotes]) => ({
    key,
    label: labelOf(key),
    notes: groupNotes
  }));
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
  const [isExporting, setIsExporting] = useState<
    'detalhado' | 'data' | 'categoria' | 'divisao' | null
  >(null);

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

  const dateGroups = useMemo(
    () => buildGroups(sortedNotes, (note) => note.date, (key) => formatDateToBR(key)),
    [sortedNotes]
  );

  const categoryGroups = useMemo(() => {
    const categoryOrder: Record<string, number> = {};
    CATEGORIES.forEach((category, index) => {
      categoryOrder[category] = index;
    });
    return buildGroups(
      sortedNotes,
      (note) => note.category || DEFAULT_CATEGORY,
      (key) => key
    ).sort(
      (a, b) =>
        (categoryOrder[a.key] ?? 99) - (categoryOrder[b.key] ?? 99) ||
        a.label.localeCompare(b.label)
    );
  }, [sortedNotes]);

  const divisionGroups = useMemo(
    () =>
      buildGroups(
        sortedNotes,
        (note) => note.division || 'Sem divisão',
        (key) => key
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [sortedNotes]
  );

  const generateReport = async (type: 'detalhado' | 'data' | 'categoria' | 'divisao', run: () => Promise<void>) => {
    if (isExporting) return;
    setIsExporting(type);
    try {
      await run();
    } finally {
      setIsExporting(null);
    }
  };

  const exportPdfDetailed = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      await drawTitleHeader(pdf, 'Relatório Detalhado');

      let y = 29;
      drawColumnHeader(pdf, y);
      y += 13;

      if (sortedNotes.length === 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(SLATE_500[0], SLATE_500[1], SLATE_500[2]);
        pdf.text('Nenhuma anotação na agenda para este relatório.', MARGIN, y);
      } else {
        let lastMonthKey = '';
        let lastDivision: string | null = null;
        let zebraBand = false;
        for (const note of sortedNotes) {
          const monthKey = monthKeyOf(note.date);
          if (monthKey !== lastMonthKey) {
            lastMonthKey = monthKey;
            if (y + 9 > BOTTOM_LIMIT) {
              const next = startNewPage(pdf, 'Relatório Detalhado');
              y = next.y;
              drawColumnHeader(pdf, y);
              y += 13;
            }
            const monthCount = sortedNotes.filter((n) => monthKeyOf(n.date) === monthKey).length;
            drawGroupHeader(pdf, y, monthLabel(monthKey), monthCount);
            y += 8;
          }

          const metrics = measureNoteRow(pdf, note);
          if (y + metrics.rowHeight > BOTTOM_LIMIT) {
            const next = startNewPage(pdf, 'Relatório Detalhado');
            y = next.y;
            drawColumnHeader(pdf, y);
            y += 13;
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

  const exportGroupedPdf = async (groups: NoteGroup[], fileNamePrefix: string, reportTitle: string) => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      await drawTitleHeader(pdf, reportTitle);

      let y = 29;

      if (groups.length === 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(SLATE_500[0], SLATE_500[1], SLATE_500[2]);
        pdf.text('Nenhuma anotação na agenda para este relatório.', MARGIN, y);
      } else {
        for (const group of groups) {
          if (y + 9 > BOTTOM_LIMIT) {
            const next = startNewPage(pdf, reportTitle);
            y = next.y;
            drawColumnHeader(pdf, y);
            y += 13;
          }
          drawGroupHeader(pdf, y, group.label, group.notes.length);
          y += 8;

          drawColumnHeader(pdf, y);
          y += 13;

          let lastDivision: string | null = null;
          let zebraBand = false;
          for (const note of group.notes) {
            const metrics = measureNoteRow(pdf, note);
            if (y + metrics.rowHeight > BOTTOM_LIMIT) {
              const next = startNewPage(pdf, reportTitle);
              y = next.y;
              drawColumnHeader(pdf, y);
              y += 13;
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
      }

      applyPageFooters(pdf, generatorLabel);
      pdf.save(`${fileNamePrefix}_${new Date().toISOString().slice(0, 10)}.pdf`);
      notify?.('Relatório PDF gerado com sucesso.', 'success');
    } catch (error) {
      console.error('Erro ao gerar relatório agrupado:', error);
      notify?.('Não foi possível gerar o relatório. Veja o console para mais detalhes.', 'error');
    }
  };

  const reportOptions = [
    {
      id: 'detalhado' as const,
      title: 'Relatório detalhado',
      description: 'Listagem completa dos eventos com data, divisão, categoria e autor.',
      icon: FileText,
      generate: () => generateReport('detalhado', exportPdfDetailed)
    },
    {
      id: 'data' as const,
      title: 'Relatório por data',
      description: 'Eventos agrupados por data para acompanhamento diário.',
      icon: CalendarDays,
      generate: () =>
        generateReport('data', () =>
          exportGroupedPdf(dateGroups, 'relatorio_por_data', 'Relatório por Data')
        )
    },
    {
      id: 'categoria' as const,
      title: 'Relatório por categoria',
      description: 'Eventos agrupados por categoria: Reunião, Pub, Coletamento e Ação Social.',
      icon: Tags,
      generate: () =>
        generateReport('categoria', () =>
          exportGroupedPdf(categoryGroups, 'relatorio_por_categoria', 'Relatório por Categoria')
        )
    },
    {
      id: 'divisao' as const,
      title: 'Relatório por divisão',
      description: 'Eventos agrupados por divisão regional.',
      icon: Building2,
      generate: () =>
        generateReport('divisao', () =>
          exportGroupedPdf(divisionGroups, 'relatorio_por_divisao', 'Relatório por Divisão')
        )
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Relatórios da agenda"
      maxWidthClass="max-w-3xl"
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
              Escolha um tipo de relatório para gerar o PDF
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
          <div className="grid gap-3 sm:grid-cols-2">
            {reportOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.generate}
                disabled={isExporting !== null || sortedNotes.length === 0}
                className="group flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-[#18181b] p-5 text-left transition hover:border-sky-500/50 hover:bg-zinc-800/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                    <option.icon className="h-5 w-5" />
                  </span>
                  {isExporting === option.id ? (
                    <span className="text-[11px] font-semibold text-sky-300">Gerando...</span>
                  ) : (
                    <FileText className="h-4 w-4 text-zinc-600 transition group-hover:text-sky-300" />
                  )}
                </div>
                <span>
                  <span className="block text-sm font-bold text-white">{option.title}</span>
                  <span className="mt-1 block text-xs text-zinc-400">{option.description}</span>
                </span>
                <span className="text-[11px] font-semibold text-sky-300">
                  Gerar PDF <span className="transition group-hover:translate-x-0.5 inline-block">→</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};