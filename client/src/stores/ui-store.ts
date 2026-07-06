import { create } from 'zustand';

type UiState = {
  debugOpen: boolean;
  toggleDebug: () => void;
};

export const useUiStore = create<UiState>()((set) => ({
  debugOpen: false,
  toggleDebug: () => {
    set((s) => ({ debugOpen: !s.debugOpen }));
  },
}));
