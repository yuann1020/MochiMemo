import type { ExpenseCategory } from '@/types/expense';

export const APP_NAME = 'MochiMemo';
export const DEFAULT_CURRENCY = 'MYR';
export const MAX_RECORDING_SECONDS = 60;
export const RECORDING_WARNING_SECONDS = 50;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'food_drink',     name: 'Food & Drink',    emoji: '🍜', color: '#F472B6' },
  { id: 'transport',      name: 'Transport',        emoji: '🚗', color: '#60A5FA' },
  { id: 'shopping',       name: 'Shopping',         emoji: '🛍️', color: '#A78BFA' },
  { id: 'entertainment',  name: 'Entertainment',    emoji: '🎮', color: '#34D399' },
  { id: 'health',         name: 'Health',           emoji: '💊', color: '#F87171' },
  { id: 'utilities',      name: 'Utilities',        emoji: '💡', color: '#FACC15' },
  { id: 'education',      name: 'Education',        emoji: '📚', color: '#818CF8' },
  { id: 'other',          name: 'Other',            emoji: '📦', color: '#94A3B8' },
];

export const CATEGORY_MAP = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.id, c]),
) as Record<ExpenseCategory['id'], ExpenseCategory>;
