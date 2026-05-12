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
