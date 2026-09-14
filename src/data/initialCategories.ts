import { CategoryColor } from '../types';

export interface InitialCategory {
  name: string;
  color: CategoryColor;
}

export const INITIAL_CATEGORIES: InitialCategory[] = [
  { name: 'Reunião', color: 'sky' },
  { name: 'Pub', color: 'emerald' },
  { name: 'Coletamento', color: 'violet' },
  { name: 'Ação Social', color: 'rose' }
];
