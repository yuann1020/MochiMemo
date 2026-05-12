export interface AIExtractedExpensePayload {
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  date: string;
  note: string;
  confidence: number;
}

export interface ExtractedExpense extends AIExtractedExpensePayload {
  id: string;
}

export interface AIExtractionResponse {
  expenses: AIExtractedExpensePayload[];
  needsClarification: boolean;
  clarificationQuestion: string | null;
}

export interface AIExtractionResult {
  expenses: ExtractedExpense[];
  needsClarification: boolean;
  clarificationQuestion: string | null;
  source: 'openai' | 'mock';
  errorMessage: string | null;
}

export interface TranscriptionResult {
  transcript: string;
  model?: string;
  durationMs?: number;
  error?: string;
  source: 'openai' | 'mock';
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

export type InsightTone = 'positive' | 'neutral' | 'warning';
export type InsightSeverity = 'info' | 'positive' | 'warning';

export interface InsightSummary {
  headline: string;
  description: string;
  tone: InsightTone;
}

export interface InsightCard {
  title: string;
  value: string;
  description: string;
  severity: InsightSeverity;
}

export interface InsightRecommendation {
  title: string;
  description: string;
  estimatedImpact: string;
}

export interface SpendingPattern {
  title: string;
  description: string;
}

export interface AIInsightsResult {
  summary: InsightSummary;
  cards: InsightCard[];
  recommendations: InsightRecommendation[];
  patterns: SpendingPattern[];
  generatedAt: string;
}
