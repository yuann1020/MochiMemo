import { DEFAULT_CURRENCY } from '@/constants/config';
import { getCurrentSession } from '@/services/supabase/auth';
import { supabase } from '@/services/supabase/client';
import {
  DEFAULT_MONTHLY_BUDGET,
  getProfile,
} from '@/services/supabase/profiles';
import type { Database } from '@/types/database';
import type {
  Expense,
  ExpenseCategoryTotal,
  ExpenseSource,
  ExpenseStats,
  NewExpense,
  Profile,
  UpdateExpense,
  WeeklyExpenseTotal,
} from '@/types/expense';
import { getCategoryColor, normalizeCategoryLabel } from '@/utils/expense-display';

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

export async function getCurrentProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  return userId ? getProfile(userId) : null;
}

export async function createExpense(expense: NewExpense): Promise<Expense> {
  const created = await createExpenses([expense]);
  return created[0];
}

export async function createExpenses(expenses: NewExpense[]): Promise<Expense[]> {
  if (expenses.length === 0) return [];

  const userId = await requireCurrentUserId();
  const rows = expenses.map((expense) => newExpenseToInsert(expense, userId));
  const { data, error } = await supabase
    .from('expenses')
    .insert(rows)
    .select('*')
    .order('spent_at', { ascending: false });

  if (error) throw error;
  return data.map(rowToExpense);
}

export async function getRecentExpenses(limit = 3): Promise<Expense[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('profile_id', userId)
    .order('spent_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map(rowToExpense);
}

export async function getMonthlyExpenses(date = new Date()): Promise<Expense[]> {
  const { start, end } = getMonthRange(date);
  return getExpensesByDateRange(start, end);
}

export async function getExpensesByDateRange(start: Date, end: Date): Promise<Expense[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('profile_id', userId)
    .gte('spent_at', start.toISOString())
    .lte('spent_at', end.toISOString())
    .order('spent_at', { ascending: false });

  if (error) throw error;
  return data.map(rowToExpense);
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .eq('profile_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToExpense(data) : null;
}

export async function updateExpense(id: string, patch: UpdateExpense): Promise<Expense> {
  const userId = await requireCurrentUserId();
  const row = updateExpenseToRow(patch);
  const { data, error } = await supabase
    .from('expenses')
    .update(row)
    .eq('id', id)
    .eq('profile_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return rowToExpense(data);
}

export async function deleteExpense(id: string): Promise<void> {
  const userId = await requireCurrentUserId();
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('profile_id', userId);

  if (error) throw error;
}

export async function getExpenseStats(date = new Date()): Promise<ExpenseStats> {
  const userId = await getCurrentUserId();
  if (!userId) return emptyExpenseStats(date);

  const [profile, monthlyExpenses, recentExpenses] = await Promise.all([
    getProfile(userId),
    getMonthlyExpenses(date),
    getRecentExpenses(3),
  ]);

  const monthlyBudget = profile?.monthlyBudget ?? DEFAULT_MONTHLY_BUDGET;
  const monthlySpent = sumExpenses(monthlyExpenses);
  const remainingBudget = monthlyBudget - monthlySpent;
  const budgetPercentUsed = monthlyBudget > 0
    ? Math.min(100, Math.round((monthlySpent / monthlyBudget) * 100))
    : 0;

  return {
    profile,
    monthlyBudget,
    monthlySpent,
    remainingBudget,
    budgetPercentUsed,
    categoryTotals: buildCategoryTotals(monthlyExpenses),
    weeklyTotals: buildWeeklyTotals(monthlyExpenses, date),
    recentExpenses,
  };
}

export function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    profileId: row.profile_id,
    amount: toNumber(row.amount),
    currency: row.currency ?? DEFAULT_CURRENCY,
    merchant: row.merchant,
    category: normalizeCategory(row.category),
    note: row.note,
    spentAt: row.spent_at,
    source: normalizeSource(row.source),
    confidence: row.confidence == null ? null : toNumber(row.confidence),
    rawInput: row.raw_input,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function newExpenseToInsert(expense: NewExpense, userId: string): ExpenseInsert {
  return {
    profile_id: userId,
    amount: expense.amount,
    currency: expense.currency ?? DEFAULT_CURRENCY,
    merchant: expense.merchant.trim() || 'Unknown',
    category: normalizeCategory(expense.category),
    note: expense.note?.trim() || null,
    spent_at: expense.spentAt ?? new Date().toISOString(),
    source: expense.source ?? 'manual',
    confidence: expense.confidence ?? null,
    raw_input: expense.rawInput?.trim() || null,
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.user.id ?? null;
}

async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Please log in before saving expenses.');
  }

  return userId;
}

function emptyExpenseStats(date: Date): ExpenseStats {
  return {
    profile: null,
    monthlyBudget: DEFAULT_MONTHLY_BUDGET,
    monthlySpent: 0,
    remainingBudget: DEFAULT_MONTHLY_BUDGET,
    budgetPercentUsed: 0,
    categoryTotals: [],
    weeklyTotals: buildWeeklyTotals([], date),
    recentExpenses: [],
  };
}

function updateExpenseToRow(expense: UpdateExpense): ExpenseUpdate {
  const row: ExpenseUpdate = {};

  if (expense.amount != null) row.amount = expense.amount;
  if (expense.currency != null) row.currency = expense.currency;
  if (expense.merchant != null) row.merchant = expense.merchant.trim() || 'Unknown';
  if (expense.category != null) row.category = normalizeCategory(expense.category);
  if (expense.note !== undefined) row.note = expense.note?.trim() || null;
  if (expense.spentAt != null) row.spent_at = expense.spentAt;
  if (expense.source != null) row.source = expense.source;
  if (expense.confidence !== undefined) row.confidence = expense.confidence;
  if (expense.rawInput !== undefined) row.raw_input = expense.rawInput?.trim() || null;

  return row;
}

function buildCategoryTotals(expenses: Expense[]): ExpenseCategoryTotal[] {
  const monthlySpent = sumExpenses(expenses);
  const totals = expenses.reduce<Record<string, { total: number; count: number }>>((acc, expense) => {
    const category = normalizeCategory(expense.category);
    acc[category] ??= { total: 0, count: 0 };
    acc[category].total += expense.amount;
    acc[category].count += 1;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([category, value]) => ({
      category,
      total: value.total,
      count: value.count,
      percent: monthlySpent > 0 ? Math.round((value.total / monthlySpent) * 100) : 0,
      color: getCategoryColor(category),
    }))
    .sort((a, b) => b.total - a.total);
}

function buildWeeklyTotals(expenses: Expense[], date: Date): WeeklyExpenseTotal[] {
  const weeks = [
    { label: 'Week 1', start: 1, end: 7 },
    { label: 'Week 2', start: 8, end: 14 },
    { label: 'Week 3', start: 15, end: 21 },
    { label: 'Week 4', start: 22, end: 31 },
  ];
  const totals = weeks.map((week) => ({
    label: week.label,
    total: expenses
      .filter((expense) => {
        const spentAt = new Date(expense.spentAt);
        return (
          spentAt.getFullYear() === date.getFullYear() &&
          spentAt.getMonth() === date.getMonth() &&
          spentAt.getDate() >= week.start &&
          spentAt.getDate() <= week.end
        );
      })
      .reduce((sum, expense) => sum + expense.amount, 0),
  }));
  const maxTotal = Math.max(1, ...totals.map((week) => week.total));

  return totals.map((week) => ({
    ...week,
    percent: Math.min(100, Math.round((week.total / maxTotal) * 100)),
  }));
}

function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function normalizeSource(value: string): ExpenseSource {
  if (value === 'type' || value === 'voice' || value === 'manual') return value;
  return 'manual';
}

function normalizeCategory(value: string): string {
  return normalizeCategoryLabel(value);
}

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}
