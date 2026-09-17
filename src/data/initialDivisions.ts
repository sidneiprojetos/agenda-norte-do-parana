import type { Division } from '../types';

export const INITIAL_DIVISIONS: Pick<Division, 'name' | 'color'>[] = [
  { name: 'Norte do Paraná', color: 'teal' },
  { name: 'Londrina', color: 'cyan' },
  { name: 'Maringá', color: 'indigo' },
  { name: 'Apucarana', color: 'lime' }
];