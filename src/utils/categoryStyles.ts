import { NoteCategory } from '../types';

type CategoryStyle = {
  badge: string;
  active: string;
  selected: string;
  calendar: string;
};

const CATEGORY_STYLES: Record<NoteCategory, CategoryStyle> = {
  Reunião: {
    badge: 'border-sky-500/40 bg-sky-950/40 text-sky-300',
    active: 'border-sky-500 bg-sky-600 text-white shadow-sm',
    selected: 'border-sky-500/50 bg-sky-600 text-white shadow-sm',
    calendar: 'border-sky-400/70 bg-sky-950/75 text-sky-100'
  },
  Pub: {
    badge: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
    active: 'border-emerald-500 bg-emerald-600 text-white shadow-sm',
    selected: 'border-emerald-500/50 bg-emerald-600 text-white shadow-sm',
    calendar: 'border-emerald-400/70 bg-emerald-950/75 text-emerald-100'
  },
  Evento: {
    badge: 'border-violet-500/40 bg-violet-950/40 text-violet-300',
    active: 'border-violet-500 bg-violet-600 text-white shadow-sm',
    selected: 'border-violet-500/50 bg-violet-600 text-white shadow-sm',
    calendar: 'border-violet-400/70 bg-violet-950/75 text-violet-100'
  },
  'Ação Social': {
    badge: 'border-rose-500/40 bg-rose-950/40 text-rose-300',
    active: 'border-rose-500 bg-rose-600 text-white shadow-sm',
    selected: 'border-rose-500/50 bg-rose-600 text-white shadow-sm',
    calendar: 'border-rose-400/70 bg-rose-950/75 text-rose-100'
  },
  Geral: {
    badge: 'border-amber-500/40 bg-amber-950/40 text-amber-300',
    active: 'border-amber-500 bg-amber-600 text-white shadow-sm',
    selected: 'border-amber-500/50 bg-amber-600 text-white shadow-sm',
    calendar: 'border-amber-400/70 bg-amber-950/75 text-amber-100'
  }
};

export function getCategoryStyle(category?: NoteCategory): CategoryStyle {
  return CATEGORY_STYLES[category || 'Geral'];
}