import { CategoryColor } from '../types';
import { COLOR_STYLES } from './categoryStyles';

const FALLBACK_COLORS: CategoryColor[] = [
  'sky', 'emerald', 'violet', 'rose', 'amber', 'teal', 'cyan', 'fuchsia',
  'blue', 'green', 'red', 'orange', 'lime', 'indigo', 'pink', 'yellow', 'purple'
];

const COLOR_RGB: Record<CategoryColor, [number, number, number]> = {
  sky: [56, 189, 248],
  blue: [59, 130, 246],
  indigo: [129, 140, 248],
  violet: [167, 139, 250],
  purple: [168, 85, 247],
  fuchsia: [232, 121, 249],
  pink: [244, 114, 182],
  rose: [251, 113, 133],
  red: [239, 68, 68],
  orange: [251, 146, 60],
  amber: [251, 191, 36],
  yellow: [250, 204, 21],
  lime: [163, 230, 53],
  green: [34, 197, 94],
  emerald: [52, 211, 153],
  teal: [45, 212, 191],
  cyan: [34, 211, 238]
};

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

const divisionColorRegistry = new Map<string, CategoryColor>();

export function registerDivisionColors(
  divisions: { name: string; color?: CategoryColor }[]
) {
  divisionColorRegistry.clear();
  for (const d of divisions) {
    if (d.color) {
      divisionColorRegistry.set(d.name, d.color);
    }
  }
}

export function getDivisionStyle(division?: string): DivisionStyle {
  if (!division) {
    return { badge: '', dot: 'bg-zinc-500' };
  }
  const registered = divisionColorRegistry.get(division);
  const color = registered && COLOR_STYLES[registered]
    ? registered
    : FALLBACK_COLORS[divisionHash(division) % FALLBACK_COLORS.length];
  const style = COLOR_STYLES[color];
  return { badge: style.badge, dot: style.dot };
}

/** RGB color for a division, used in PDF reports (zinc for missing division). */
export function getDivisionRgb(division?: string): [number, number, number] {
  if (!division) return [113, 113, 122];
  const registered = divisionColorRegistry.get(division);
  const color = registered && COLOR_RGB[registered]
    ? registered
    : FALLBACK_COLORS[divisionHash(division) % FALLBACK_COLORS.length];
  return COLOR_RGB[color];
}