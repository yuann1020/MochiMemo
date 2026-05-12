import { AudioModule, setAudioModeAsync } from 'expo-audio';

import type { ExtractedExpense } from '@/types/ai';

export type LocalRecordingStatus =
  | 'idle'
  | 'requestingPermission'
  | 'recording'
  | 'stopped'
  | 'error';

export type ExpenseInputMode = 'voice' | 'type';

export interface ExpenseReviewDraft {
  id: string;
  sourceMode: ExpenseInputMode;
  inputText: string;
  transcript: string | null;
  audioUri: string | null;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  date: string;
  note: string;
  confidence: number;
  saved: boolean;
}

export interface RecordingResult {
  uri: string;
  durationSeconds: number;
}

export async function requestMicrophonePermission(): Promise<boolean> {
  const permission = await AudioModule.requestRecordingPermissionsAsync();
  return permission.granted;
}

export async function configureRecordingAudioMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'doNotMix',
  });
}

export function formatRecordingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function createVoiceReviewDraft(audioUri: string | null, durationSeconds: number): ExpenseReviewDraft {
  const transcript = 'I spent RM18 on bubble tea';

  return {
    id: createLocalId(),
    sourceMode: 'voice',
    inputText: transcript,
    transcript,
    audioUri,
    amount: 18,
    currency: 'MYR',
    merchant: 'Bubble Tea',
    category: 'Food & Drinks',
    date: formatDisplayDate(new Date()),
    note: durationSeconds > 0 ? `Voice note, ${formatRecordingTime(durationSeconds)}` : 'Voice note',
    confidence: 96,
    saved: false,
  };
}

export function createTypedReviewDraft(inputText: string): ExpenseReviewDraft {
  const normalized = inputText.trim();
  const amount = parseFirstRinggitAmount(normalized) ?? 0;
  const merchant = parseMerchant(normalized) ?? 'Expense';
  const category = inferCategory(normalized, merchant);

  return {
    id: createLocalId(),
    sourceMode: 'type',
    inputText: normalized,
    transcript: null,
    audioUri: null,
    amount,
    currency: 'MYR',
    merchant,
    category,
    date: formatDisplayDate(new Date()),
    note: normalized,
    confidence: amount > 0 ? 82 : 45,
    saved: false,
  };
}

export function createReviewDraftFromExtractedExpense({
  sourceMode,
  inputText,
  transcript,
  audioUri,
  expense,
}: {
  sourceMode: ExpenseInputMode;
  inputText: string;
  transcript: string | null;
  audioUri: string | null;
  expense: ExtractedExpense;
}): ExpenseReviewDraft {
  return {
    id: createLocalId(),
    sourceMode,
    inputText,
    transcript,
    audioUri,
    amount: expense.amount,
    currency: expense.currency,
    merchant: expense.merchant,
    category: expense.category,
    date: expense.date,
    note: expense.note,
    confidence: toConfidencePercent(expense.confidence),
    saved: false,
  };
}

function parseFirstRinggitAmount(text: string): number | null {
  const match = text.match(/\bRM\s?(\d+(?:\.\d{1,2})?)/i);
  return match ? Number(match[1]) : null;
}

function parseMerchant(text: string): string | null {
  const beforeAmount = text.split(/\bRM\s?\d+(?:\.\d{1,2})?/i)[0]?.trim();
  const cleaned = beforeAmount
    ?.replace(/^i\s+(spent|paid|bought)\s+/i, '')
    .replace(/^spent\s+/i, '')
    .replace(/^on\s+/i, '')
    .replace(/\s+on\s*$/i, '')
    .replace(/[,.]$/g, '')
    .trim();

  if (cleaned) return toTitleCase(cleaned);

  if (/bubble\s*tea/i.test(text)) return 'Bubble Tea';
  if (/parking/i.test(text)) return 'Parking';
  if (/lunch/i.test(text)) return 'Lunch';

  return null;
}

function inferCategory(text: string, merchant: string): string {
  const source = `${text} ${merchant}`.toLowerCase();

  if (/bubble|tea|coffee|lunch|dinner|food|restaurant|cafe/.test(source)) return 'Food & Drinks';
  if (/parking|grab|train|bus|taxi|petrol|transport/.test(source)) return 'Transport';
  if (/grocery|groceries|shopping|mall|shirt|shoes/.test(source)) return 'Shopping';
  if (/bill|utility|subscription|phone|electric/.test(source)) return 'Bills';

  return 'Others';
}

function formatDisplayDate(date: Date): string {
  return `Today, ${date.toLocaleTimeString('en-MY', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function createLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toConfidencePercent(confidence: number): number {
  const normalized = confidence > 1 ? confidence : confidence * 100;
  return Math.round(Math.max(0, Math.min(100, normalized)));
}
