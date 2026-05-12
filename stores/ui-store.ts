import { create } from 'zustand';

interface UIState {
  isConfirmSheetOpen: boolean;
  isGlobalLoading: boolean;
  globalLoadingMessage: string | null;

  openConfirmSheet: () => void;
  closeConfirmSheet: () => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isConfirmSheetOpen: false,
  isGlobalLoading: false,
  globalLoadingMessage: null,

  openConfirmSheet: () => set({ isConfirmSheetOpen: true }),
  closeConfirmSheet: () => set({ isConfirmSheetOpen: false }),

  setGlobalLoading: (isGlobalLoading, message) =>
    set({ isGlobalLoading, globalLoadingMessage: message ?? null }),
}));
