export type ExpenseCategoryId =
  | 'food_drink'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'utilities'
  | 'education'
  | 'other';

export interface ExpenseCategory {
  id: ExpenseCategoryId;
  name: string;
  emoji: string;
  color: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  categoryId: ExpenseCategoryId;
  description: string;
  rawTranscript?: string;
  aiConfidence?: number;
  recordedAt: string;
  createdAt: string;
}

export type NewExpense = Omit<Expense, 'id' | 'userId' | 'createdAt'>;
