import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createExpense,
  createExpenses,
  deleteExpense,
  getExpenseById,
  getExpenseStats,
  getExpensesByDateRange,
  getMonthlyExpenses,
  getRecentExpenses,
  updateExpense,
} from '@/services/supabase/expenses';
import type { NewExpense, UpdateExpense } from '@/types/expense';

export const expenseQueryKeys = {
  all: ['expenses'] as const,
  stats: (monthKey: string) => [...expenseQueryKeys.all, 'stats', monthKey] as const,
  recent: (limit: number) => [...expenseQueryKeys.all, 'recent', limit] as const,
  monthly: (monthKey: string) => [...expenseQueryKeys.all, 'monthly', monthKey] as const,
  range: (start: string, end: string) => [...expenseQueryKeys.all, 'range', start, end] as const,
  detail: (id: string) => [...expenseQueryKeys.all, 'detail', id] as const,
};

export function useExpenseStats(date = new Date()) {
  const monthKey = getMonthKey(date);

  return useQuery({
    queryKey: expenseQueryKeys.stats(monthKey),
    queryFn: () => getExpenseStats(date),
  });
}

export function useRecentExpenses(limit = 3) {
  return useQuery({
    queryKey: expenseQueryKeys.recent(limit),
    queryFn: () => getRecentExpenses(limit),
  });
}

export function useMonthlyExpenses(date = new Date()) {
  const monthKey = getMonthKey(date);

  return useQuery({
    queryKey: expenseQueryKeys.monthly(monthKey),
    queryFn: () => getMonthlyExpenses(date),
  });
}

export function useExpensesByDateRange(start: Date, end: Date) {
  return useQuery({
    queryKey: expenseQueryKeys.range(start.toISOString(), end.toISOString()),
    queryFn: () => getExpensesByDateRange(start, end),
  });
}

export function useExpense(id: string | null) {
  return useQuery({
    queryKey: expenseQueryKeys.detail(id ?? 'missing'),
    queryFn: () => (id ? getExpenseById(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expense: NewExpense) => createExpense(expense),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all }),
  });
}

export function useCreateExpenses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenses: NewExpense[]) => createExpenses(expenses),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all }),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateExpense }) => updateExpense(id, patch),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.detail(expense.id) });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all }),
  });
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
