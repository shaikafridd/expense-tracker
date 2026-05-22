export type Category = 'Food' | 'Travel' | 'Bills' | 'Fun';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string; // ISO string
}

export interface Budget {
  monthly: number;
}

export const CATEGORIES: Category[] = ['Food', 'Travel', 'Bills', 'Fun'];

export const CATEGORY_CONFIG: Record<
  Category,
  { color: string; bg: string; hex: string; emoji: string; gradient: string }
> = {
  Food:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.13)',  hex: '#f59e0b', emoji: '🍔', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  Travel: { color: '#06b6d4', bg: 'rgba(6,182,212,0.13)',   hex: '#06b6d4', emoji: '✈️', gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
  Bills:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', hex: '#a78bfa', emoji: '📑', gradient: 'linear-gradient(135deg,#a78bfa,#7c3aed)' },
  Fun:    { color: '#ec4899', bg: 'rgba(236,72,153,0.13)',  hex: '#ec4899', emoji: '🎉', gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
};
