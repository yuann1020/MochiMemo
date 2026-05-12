import { create } from 'zustand';

import type { ExtractedExpense } from '@/types/ai';
import type { ExpenseReviewDraft, LocalRecordingStatus } from '@/services/audio/recorder';

interface RecordingState {
  status: LocalRecordingStatus;
  audioUri: string | null;
  durationSeconds: number;
  transcript: string | null;
  reviewDraft: ExpenseReviewDraft | null;
  pendingExpenses: ExtractedExpense[];
  clarificationQuestion: string | null;
  errorMessage: string | null;
  extractionErrorMessage: string | null;

  setStatus: (status: LocalRecordingStatus) => void;
  setAudioUri: (uri: string | null) => void;
  setDurationSeconds: (seconds: number) => void;
  setTranscript: (transcript: string | null) => void;
  setReviewDraft: (draft: ExpenseReviewDraft | null) => void;
  updateReviewDraft: (patch: Partial<ExpenseReviewDraft>) => void;
  markReviewSaved: () => void;
  setPendingExpenses: (expenses: ExtractedExpense[]) => void;
  updatePendingExpense: (id: string, patch: Partial<ExtractedExpense>) => void;
  removePendingExpense: (id: string) => void;
  setClarificationQuestion: (question: string | null) => void;
  setError: (message: string | null) => void;
  setExtractionError: (message: string | null) => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as LocalRecordingStatus,
  audioUri: null,
  durationSeconds: 0,
  transcript: null,
  reviewDraft: null,
  pendingExpenses: [],
  clarificationQuestion: null,
  errorMessage: null,
  extractionErrorMessage: null,
};

export const useRecordingStore = create<RecordingState>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),
  setAudioUri: (audioUri) => set({ audioUri }),
  setDurationSeconds: (durationSeconds) => set({ durationSeconds }),
  setTranscript: (transcript) => set({ transcript }),
  setReviewDraft: (reviewDraft) => set({ reviewDraft }),
  updateReviewDraft: (patch) =>
    set((state) => ({
      reviewDraft: state.reviewDraft ? { ...state.reviewDraft, ...patch } : state.reviewDraft,
    })),
  markReviewSaved: () =>
    set((state) => ({
      reviewDraft: state.reviewDraft ? { ...state.reviewDraft, saved: true } : state.reviewDraft,
    })),
  setPendingExpenses: (pendingExpenses) => set({ pendingExpenses }),

  updatePendingExpense: (id, patch) =>
    set((state) => ({
      pendingExpenses: state.pendingExpenses.map((expense) =>
        expense.id === id ? { ...expense, ...patch } : expense,
      ),
    })),

  removePendingExpense: (id) =>
    set((state) => ({
      pendingExpenses: state.pendingExpenses.filter((expense) => expense.id !== id),
    })),

  setClarificationQuestion: (clarificationQuestion) => set({ clarificationQuestion }),
  setError: (errorMessage) =>
    set(errorMessage ? { errorMessage, status: 'error' } : { errorMessage }),
  setExtractionError: (extractionErrorMessage) => set({ extractionErrorMessage }),
  reset: () => set(initialState),
}));
