import { CategoryColor } from '../types';

type CategoryStyle = {
  badge: string;
  active: string;
  selected: string;
  calendar: string;
  border: string;
  dot: string;
};

const COLOR_STYLES: Record<CategoryColor, CategoryStyle> = {
  sky: {
    badge: 'border-sky-500/40 bg-sky-950/40 text-sky-300',
    active: 'border-sky-500 bg-sky-600 text-white shadow-sm',
    selected: 'border-sky-500/50 bg-sky-600 text-white shadow-sm',
    calendar: 'border-sky-400/70 bg-sky-950/75 text-sky-100',
    border: 'border-sky-500/40',
    dot: 'bg-sky-400'
  },
  emerald: {
    badge: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
    active: 'border-emerald-500 bg-emerald-600 text-white shadow-sm',
    selected: 'border-emerald-500/50 bg-emerald-600 text-white shadow-sm',
    calendar: 'border-emerald-400/70 bg-emerald-950/75 text-emerald-100',
    border: 'border-emerald-500/40',
    dot: 'bg-emerald-400'
  },
  violet: {
    badge: 'border-violet-500/40 bg-violet-950/40 text-violet-300',
    active: 'border-violet-500 bg-violet-600 text-white shadow-sm',
    selected: 'border-violet-500/50 bg-violet-600 text-white shadow-sm',
    calendar: 'border-violet-400/70 bg-violet-950/75 text-violet-100',
    border: 'border-violet-500/40',
    dot: 'bg-violet-400'
  },
  rose: {
    badge: 'border-rose-500/40 bg-rose-950/40 text-rose-300',
    active: 'border-rose-500 bg-rose-600 text-white shadow-sm',
    selected: 'border-rose-500/50 bg-rose-600 text-white shadow-sm',
    calendar: 'border-rose-400/70 bg-rose-950/75 text-rose-100',
    border: 'border-rose-500/40',
    dot: 'bg-rose-400'
  },
  amber: {
    badge: 'border-amber-500/40 bg-amber-950/40 text-amber-300',
    active: 'border-amber-500 bg-amber-600 text-white shadow-sm',
    selected: 'border-amber-500/50 bg-amber-600 text-white shadow-sm',
    calendar: 'border-amber-400/70 bg-amber-950/75 text-amber-100',
    border: 'border-amber-500/40',
    dot: 'bg-amber-400'
  },
  teal: {
    badge: 'border-teal-500/40 bg-teal-950/40 text-teal-300',
    active: 'border-teal-500 bg-teal-600 text-white shadow-sm',
    selected: 'border-teal-500/50 bg-teal-600 text-white shadow-sm',
    calendar: 'border-teal-400/70 bg-teal-950/75 text-teal-100',
    border: 'border-teal-500/40',
    dot: 'bg-teal-400'
  },
  cyan: {
    badge: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300',
    active: 'border-cyan-500 bg-cyan-600 text-white shadow-sm',
    selected: 'border-cyan-500/50 bg-cyan-600 text-white shadow-sm',
    calendar: 'border-cyan-400/70 bg-cyan-950/75 text-cyan-100',
    border: 'border-cyan-500/40',
    dot: 'bg-cyan-400'
  },
  fuchsia: {
    badge: 'border-fuchsia-500/40 bg-fuchsia-950/40 text-fuchsia-300',
    active: 'border-fuchsia-500 bg-fuchsia-600 text-white shadow-sm',
    selected: 'border-fuchsia-500/50 bg-fuchsia-600 text-white shadow-sm',
    calendar: 'border-fuchsia-400/70 bg-fuchsia-950/75 text-fuchsia-100',
    border: 'border-fuchsia-500/40',
    dot: 'bg-fuchsia-400'
  }
};

export const CATEGORY_COLOR_OPTIONS: { key: CategoryColor; label: string }[] = [
  { key: 'sky', label: 'Azul' },
  { key: 'emerald', label: 'Verde' },
  { key: 'violet', label: 'Violeta' },
  { key: 'rose', label: 'Rosa' },
  { key: 'amber', label: 'Amarelo' },
  { key: 'teal', label: 'Teal' },
  { key: 'cyan', label: 'Ciano' },
  { key: 'fuchsia', label: 'Fúcsia' }
];

const categoryColorRegistry = new Map<string, CategoryColor>();

export function registerCategoryColors(categories: { name: string; color: CategoryColor }[]) {
  categoryColorRegistry.clear();
  for (const c of categories) {
    categoryColorRegistry.set(c.name, c.color);
  }
}

function categoryHash(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

const FALLBACK_COLORS: CategoryColor[] = ['sky', 'emerald', 'violet', 'rose', 'amber', 'teal', 'cyan', 'fuchsia'];

export function getCategoryStyle(category?: string): CategoryStyle {
  if (!category) {
    return COLOR_STYLES[FALLBACK_COLORS[0]];
  }
  const color = categoryColorRegistry.get(category);
  if (color && COLOR_STYLES[color]) {
    return COLOR_STYLES[color];
  }
  const fallback = FALLBACK_COLORS[categoryHash(category) % FALLBACK_COLORS.length];
  return COLOR_STYLES[fallback];
}
