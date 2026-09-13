const DIVISION_PALETTES = [
  { badge: 'border-teal-500/40 bg-teal-950/40 text-teal-300', dot: 'bg-teal-400' },
  { badge: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300', dot: 'bg-cyan-400' },
  { badge: 'border-indigo-500/40 bg-indigo-950/40 text-indigo-300', dot: 'bg-indigo-400' },
  { badge: 'border-lime-600/40 bg-lime-950/40 text-lime-300', dot: 'bg-lime-400' },
  { badge: 'border-orange-500/40 bg-orange-950/40 text-orange-300', dot: 'bg-orange-400' }
];

const DIVISION_RGB: [number, number, number][] = [
  [45, 212, 191],
  [34, 211, 238],
  [129, 140, 248],
  [163, 230, 53],
  [251, 146, 60]
];

function divisionHash(division: string): number {
  let hash = 0;
  for (const char of division) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export interface DivisionStyle {
  badge: string;
  dot: string;
}

export function getDivisionStyle(division?: string): DivisionStyle {
  if (!division) {
    return { badge: '', dot: 'bg-zinc-500' };
  }
  return DIVISION_PALETTES[divisionHash(division) % DIVISION_PALETTES.length];
}

/** RGB color for a division, used in PDF reports (zinc for missing division). */
export function getDivisionRgb(division?: string): [number, number, number] {
  if (!division) return [113, 113, 122];
  return DIVISION_RGB[divisionHash(division) % DIVISION_RGB.length];
}