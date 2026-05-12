import { AudioModule, setAudioModeAsync } from 'expo-audio';

import type { ExtractedExpense } from '@/types/ai';

export type LocalRecordingStatus =
  | 'idle'
  | 'requestingPermission'
  | 'recording'
  | 'stopped'
  | 'transcribing'
  | 'extracting'
  | 'readyForReview'
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
  transcriptionModel?: string | null;
  transcriptionError?: string | null;
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

export function createVoiceReviewDraft({
  audioUri,
  durationSeconds,
  transcript,
  transcriptionModel = null,
  transcriptionError = null,
}: {
  audioUri: string | null;
  durationSeconds: number;
  transcript: string;
  transcriptionModel?: string | null;
  transcriptionError?: string | null;
}): ExpenseReviewDraft {
  return {
    id: createLocalId(),
    sourceMode: 'voice',
    inputText: transcript,
    transcript,
    audioUri,
    amount: 0,
    currency: 'MYR',
    merchant: '',
    category: '',
    date: formatDisplayDate(new Date()),
    note: durationSeconds > 0 ? `Voice note, ${formatRecordingTime(durationSeconds)}` : transcript,
    confidence: 0,
    transcriptionModel,
    transcriptionError,
    saved: false,
  };
}

export function createTypedReviewDraft(inputText: string): ExpenseReviewDraft {
  const normalized = inputText.trim();

  return {
    id: createLocalId(),
    sourceMode: 'type',
    inputText: normalized,
    transcript: null,
    audioUri: null,
    amount: 0,
    currency: 'MYR',
    merchant: '',
    category: '',
    date: formatDisplayDate(new Date()),
    note: normalized,
    confidence: 0,
    transcriptionModel: null,
    transcriptionError: null,
    saved: false,
  };
}

export function createReviewDraftFromExtractedExpense({
  sourceMode,
  inputText,
  transcript,
  audioUri,
  expense,
  transcriptionModel = null,
  transcriptionError = null,
}: {
  sourceMode: ExpenseInputMode;
  inputText: string;
  transcript: string | null;
  audioUri: string | null;
  expense: ExtractedExpense;
  transcriptionModel?: string | null;
  transcriptionError?: string | null;
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
    transcriptionModel,
    transcriptionError,
    saved: false,
  };
}

function formatDisplayDate(date: Date): string {
  return `Today, ${date.toLocaleTimeString('en-MY', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;
}

function createLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toConfidencePercent(confidence: number): number {
  const normalized = confidence > 1 ? confidence : confidence * 100;
  return Math.round(Math.max(0, Math.min(100, normalized)));
}
