export type ExpenseSource = 'manual' | 'type' | 'voice';

export interface ExpenseCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Profile {
  id: string;
  displayName: string | null;
  currency: string;
  monthlyBudget: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Expense {
  id: string;
  profileId: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  note: string | null;
  spentAt: string;
  source: ExpenseSource;
  confidence: number | null;
  rawInput: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NewExpense {
  profileId?: string | null;
  amount: number;
  currency?: string;
  merchant: string;
  category: string;
  note?: string | null;
  spentAt?: string;
  source?: ExpenseSource;
  confidence?: number | null;
  rawInput?: string | null;
}

export type UpdateExpense = Partial<Omit<NewExpense, 'profileId'>>;

export interface ExpenseCategoryTotal {
  category: string;
  total: number;
  count: number;
  percent: number;
  color: string;
}

export interface WeeklyExpenseTotal {
  label: string;
  total: number;
  percent: number;
}

export interface ExpenseStats {
  profile: Profile | null;
  monthlyBudget: number;
  monthlySpent: number;
  remainingBudget: number;
  budgetPercentUsed: number;
  categoryTotals: ExpenseCategoryTotal[];
  weeklyTotals: WeeklyExpenseTotal[];
  recentExpenses: Expense[];
}
