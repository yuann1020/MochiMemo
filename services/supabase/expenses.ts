import { supabase } from './client';
import type { Expense, NewExpense } from '@/types/expense';

export async function saveExpenses(expenses: NewExpense[]): Promise<Expense[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const rows = expenses.map((e) => ({
    user_id:        user.id,
    amount:         e.amount,
    currency:       e.currency,
    category_id:    e.categoryId,
    description:    e.description,
    raw_transcript: e.rawTranscript ?? null,
    ai_confidence:  e.aiConfidence ?? null,
    recorded_at:    e.recordedAt,
  }));

  const { data, error } = await supabase.from('expenses').insert(rows).select();
  if (error) throw error;

  return data.map(rowToExpense);
}

export async function getExpenses(limit = 20, offset = 0): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('recorded_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data.map(rowToExpense);
}

export async function getMonthlyTotal(year: number, month: number): Promise<number> {
  const start = new Date(year, month - 1, 1).toISOString();
  const end   = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .gte('recorded_at', start)
    .lte('recorded_at', end);

  if (error) throw error;
  return data.reduce((sum, row) => sum + Number(row.amount), 0);
}

function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id:            row.id as string,
    userId:        row.user_id as string,
    amount:        Number(row.amount),
    currency:      row.currency as string,
    categoryId:    row.category_id as Expense['categoryId'],
    description:   row.description as string,
    rawTranscript: row.raw_transcript as string | undefined,
    aiConfidence:  row.ai_confidence != null ? Number(row.ai_confidence) : undefined,
    recordedAt:    row.recorded_at as string,
    createdAt:     row.created_at as string,
  };
}
