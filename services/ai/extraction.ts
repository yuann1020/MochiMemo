import { DEFAULT_CURRENCY } from '@/constants/config';
import { supabase } from '@/services/supabase/client';
import type {
  AIExtractionResponse,
  AIExtractionResult,
  ExtractedExpense,
} from '@/types/ai';

const EXTRACTION_FUNCTION = 'extract-expense';
const LOW_CONFIDENCE_THRESHOLD = 0.75;

export async function extractExpenses(
  text: string,
  currency = DEFAULT_CURRENCY,
): Promise<AIExtractionResult> {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return {
      expenses: [],
      needsClarification: true,
      clarificationQuestion: 'What did you spend, and how much was it?',
      source: 'mock',
      errorMessage: null,
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke<AIExtractionResponse>(
      EXTRACTION_FUNCTION,
      {
        body: {
          text: normalizedText,
          currency: normalizeCurrency(currency),
        },
      },
    );

    if (error) {
      throw new Error(error.message || 'Expense extraction failed.');
    }

    return normalizeExtractionResult(data, 'openai', null);
  } catch (error) {
    const fallback = mockExtractExpenses(normalizedText, currency);
    return {
      ...fallback,
      errorMessage:
        error instanceof Error
          ? `AI extraction failed. Using local mock parsing instead. ${error.message}`
          : 'AI extraction failed. Using local mock parsing instead.',
    };
  }
}

export function mockExtractExpenses(
  text: string,
  currency = DEFAULT_CURRENCY,
): AIExtractionResult {
  const clauses = text
    .split(/\s*(?:,|;|\band\b)\s*/i)
    .map((clause) => clause.trim())
    .filter(Boolean);

  const expenses = clauses
    .map((clause) => parseMockExpenseClause(clause, currency))
    .filter((expense): expense is ExtractedExpense => expense !== null);

  const needsClarification =
    expenses.length === 0 ||
    expenses.some((expense) => expense.confidence < LOW_CONFIDENCE_THRESHOLD);

  return {
    expenses,
    needsClarification,
    clarificationQuestion: needsClarification
      ? 'Can you confirm the missing amount or merchant?'
      : null,
    source: 'mock',
    errorMessage: null,
  };
}

function normalizeExtractionResult(
  value: unknown,
  source: AIExtractionResult['source'],
  errorMessage: string | null,
): AIExtractionResult {
  const raw = isRecord(value) ? value : {};
  const rawExpenses = Array.isArray(raw.expenses) ? raw.expenses : [];
  const expenses = rawExpenses
    .map(normalizeExpense)
    .filter((expense): expense is ExtractedExpense => expense !== null);

  const hasLowConfidence = expenses.some(
    (expense) => expense.confidence < LOW_CONFIDENCE_THRESHOLD,
  );
  const needsClarification =
    raw.needsClarification === true || expenses.length === 0 || hasLowConfidence;
  const clarificationQuestion =
    typeof raw.clarificationQuestion === 'string' && raw.clarificationQuestion.trim()
      ? raw.clarificationQuestion.trim()
      : needsClarification
        ? 'Can you confirm the missing expense details?'
        : null;

  return {
    expenses,
    needsClarification,
    clarificationQuestion,
    source,
    errorMessage,
  };
}

function normalizeExpense(value: unknown): ExtractedExpense | null {
  if (!isRecord(value)) return null;

  const amount = safeNumber(value.amount);
  if (amount <= 0) return null;

  return {
    id: createExpenseId(),
    amount,
    currency: normalizeCurrency(value.currency),
    merchant: safeText(value.merchant, 'Unknown'),
    category: normalizeCategory(value.category),
    date: safeText(value.date, 'today'),
    note: safeText(value.note, 'Expense'),
    confidence: normalizeConfidence(value.confidence),
  };
}

function parseMockExpenseClause(
  clause: string,
  currency: string,
): ExtractedExpense | null {
  const amountMatch = clause.match(/\bRM\s*([0-9]+(?:\.[0-9]{1,2})?)\b/i);
  if (!amountMatch || amountMatch.index === undefined) return null;

  const amount = Number(amountMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const merchant = parseMerchant(clause, amountMatch.index, amountMatch[0].length);
  const category = inferCategory(`${clause} ${merchant ?? ''}`);
  const confidence = merchant ? 0.82 : 0.58;
  const displayMerchant = merchant ?? 'Unknown';

  return {
    id: createExpenseId(),
    amount,
    currency: normalizeCurrency(currency),
    merchant: displayMerchant,
    category,
    date: 'today',
    note:
      displayMerchant === 'Unknown'
        ? clause
        : `${displayMerchant} ${category === 'Transport' ? 'expense' : 'purchase'}`,
    confidence,
  };
}

function parseMerchant(
  clause: string,
  amountStart: number,
  amountLength: number,
): string | null {
  const beforeAmount = clause.slice(0, amountStart);
  const afterAmount = clause.slice(amountStart + amountLength);

  const afterAt = afterAmount.match(/\bat\s+([a-z0-9&' -]+?)(?:\s+(?:today|yesterday|this|morning|afternoon|evening|tonight)\b|[,.]|$)/i);
  if (afterAt?.[1]) return toTitleCase(afterAt[1]);

  const afterOn = afterAmount.match(/\bon\s+([a-z0-9&' -]+?)(?:\s+(?:today|yesterday|this|morning|afternoon|evening|tonight)\b|[,.]|$)/i);
  if (afterOn?.[1]) return toTitleCase(afterOn[1]);

  const beforeCleaned = cleanMerchantText(beforeAmount);
  if (beforeCleaned) return toTitleCase(beforeCleaned);

  const afterCleaned = cleanMerchantText(afterAmount);
  return afterCleaned ? toTitleCase(afterCleaned) : null;
}

function cleanMerchantText(value: string): string {
  return value
    .replace(/\b(i|just)\b/gi, ' ')
    .replace(/\b(spent|paid|bought|buy|got|grabbed)\b/gi, ' ')
    .replace(/\b(was|were|is|for|on|at)\b/gi, ' ')
    .replace(/\b(today|yesterday|this|morning|afternoon|evening|tonight)\b/gi, ' ')
    .replace(/[^a-z0-9&' -]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCategory(value: string): string {
  const source = value.toLowerCase();

  if (/parking|grab|ride|train|bus|taxi|petrol|fuel|transport/.test(source)) {
    return 'Transport';
  }

  if (/grocery|groceries|lotus|market|mall|shirt|shoes|shopping/.test(source)) {
    return 'Shopping';
  }

  if (/movie|game|cinema|concert|netflix|spotify/.test(source)) {
    return 'Entertainment';
  }

  if (/clinic|doctor|medicine|pharmacy|health/.test(source)) {
    return 'Health';
  }

  if (/bill|utility|utilities|phone|electric|water|internet/.test(source)) {
    return 'Utilities';
  }

  if (/book|course|tuition|school|education/.test(source)) {
    return 'Education';
  }

  if (/bubble|tea|coffee|lunch|dinner|breakfast|food|restaurant|cafe|meal/.test(source)) {
    return 'Food & Drinks';
  }

  return 'Other';
}

function normalizeCategory(value: unknown): string {
  const text = safeText(value, 'Other');
  if (/^food\s*&\s*drink$/i.test(text)) return 'Food & Drinks';

  const known = [
    'Food & Drinks',
    'Transport',
    'Shopping',
    'Entertainment',
    'Health',
    'Utilities',
    'Education',
    'Other',
  ];

  return known.includes(text) ? text : 'Other';
}

function normalizeCurrency(value: unknown): string {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'RM') return 'MYR';
    if (/^[A-Z]{3}$/.test(normalized)) return normalized;
  }

  return DEFAULT_CURRENCY;
}

function normalizeConfidence(value: unknown): number {
  const confidence = safeNumber(value);
  const decimal = confidence > 1 ? confidence / 100 : confidence;
  return Math.max(0, Math.min(1, decimal));
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function createExpenseId(): string {
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
