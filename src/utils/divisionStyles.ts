const DIVISION_PALETTES = [
  { badge: 'border-teal-500/40 bg-teal-950/40 text-teal-300', dot: 'bg-teal-400' },
  { badge: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300', dot: 'bg-cyan-400' },
  { badge: 'border-indigo-500/40 bg-indigo-950/40 text-indigo-300', dot: 'bg-indigo-400' },
  { badge: 'border-lime-600/40 bg-lime-950/40 text-lime-300', dot: 'bg-lime-400' },
  { badge: 'border-orange-500/40 bg-orange-950/40 text-orange-300', dot: 'bg-orange-400' }
];

export interface DivisionStyle {
  badge: string;
  dot: string;
}

export function getDivisionStyle(division?: string): DivisionStyle {
  if (!division) {
    return { badge: '', dot: 'bg-zinc-500' };
  }
  let hash = 0;
  for (const char of division) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return DIVISION_PALETTES[hash % DIVISION_PALETTES.length];
}