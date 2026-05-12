import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createExpense,
  createExpenses,
  deleteAllUserExpenses,
  deleteExpense,
  getExpenseById,
  getExpenseStats,
  getExpensesByDateRange,
  getMonthlyExpenses,
  getRecentExpenses,
  updateExpense,
} from '@/services/supabase/expenses';
import { useAuth } from '@/hooks/use-auth';
import type { UpdateProfileInput } from '@/services/supabase/profiles';
import type { NewExpense, UpdateExpense } from '@/types/expense';

export const expenseQueryKeys = {
  all: (userId?: string | null) => ['expenses', userId ?? 'anonymous'] as const,
  stats: (userId: string | null | undefined, monthKey: string) =>
    [...expenseQueryKeys.all(userId), 'stats', monthKey] as const,
  recent: (userId: string | null | undefined, limit: number) =>
    [...expenseQueryKeys.all(userId), 'recent', limit] as const,
  monthly: (userId: string | null | undefined, monthKey: string) =>
    [...expenseQueryKeys.all(userId), 'monthly', monthKey] as const,
  range: (userId: string | null | undefined, start: string, end: string) =>
    [...expenseQueryKeys.all(userId), 'range', start, end] as const,
  detail: (userId: string | null | undefined, id: string) =>
    [...expenseQueryKeys.all(userId), 'detail', id] as const,
};

export function useExpenseStats(date = new Date()) {
  const { initialized, user } = useAuth();
  const monthKey = getMonthKey(date);

  return useQuery({
    queryKey: expenseQueryKeys.stats(user?.id, monthKey),
    queryFn: () => getExpenseStats(date),
    enabled: initialized && Boolean(user),
  });
}

export function useRecentExpenses(limit = 3) {
  const { initialized, user } = useAuth();

  return useQuery({
    queryKey: expenseQueryKeys.recent(user?.id, limit),
    queryFn: () => getRecentExpenses(limit),
    enabled: initialized && Boolean(user),
  });
}

export function useMonthlyExpenses(date = new Date()) {
  const { initialized, user } = useAuth();
  const monthKey = getMonthKey(date);

  return useQuery({
    queryKey: expenseQueryKeys.monthly(user?.id, monthKey),
    queryFn: () => getMonthlyExpenses(date),
    enabled: initialized && Boolean(user),
  });
}

export function useExpensesByDateRange(start: Date, end: Date) {
  const { initialized, user } = useAuth();

  return useQuery({
    queryKey: expenseQueryKeys.range(user?.id, start.toISOString(), end.toISOString()),
    queryFn: () => getExpensesByDateRange(start, end),
    enabled: initialized && Boolean(user),
  });
}

export function useExpense(id: string | null) {
  const { initialized, user } = useAuth();

  return useQuery({
    queryKey: expenseQueryKeys.detail(user?.id, id ?? 'missing'),
    queryFn: () => (id ? getExpenseById(id) : null),
    enabled: initialized && Boolean(user) && Boolean(id),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (expense: NewExpense) => createExpense(expense),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all(user?.id) }),
  });
}

export function useCreateExpenses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (expenses: NewExpense[]) => createExpenses(expenses),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all(user?.id) }),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateExpense }) => updateExpense(id, patch),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all(user?.id) });
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.detail(user?.id, expense.id) });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all(user?.id) }),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user, updateProfile } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all(user?.id) }),
  });
}

export function useDeleteAllExpenses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => deleteAllUserExpenses(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all(user?.id) }),
  });
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
