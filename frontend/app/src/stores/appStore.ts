import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CaptureAsset, Lens, Reading } from "../schemas/domain";

export type PrismTheme = "night" | "light";

type AppState = {
  theme: PrismTheme;
  capture: CaptureAsset | null;
  selectedLens: Lens | null;
  reading: Reading | null;
  setTheme: (theme: PrismTheme) => void;
  setCapture: (capture: CaptureAsset | null) => void;
  setSelectedLens: (lens: Lens | null) => void;
  setReading: (reading: Reading | null) => void;
  resetFlow: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "night",
      capture: null,
      selectedLens: null,
      reading: null,
      setTheme: (theme) => set({ theme }),
      setCapture: (capture) => set({ capture }),
      setSelectedLens: (selectedLens) => set({ selectedLens }),
      setReading: (reading) => set({ reading }),
      resetFlow: () => set({ capture: null, selectedLens: null, reading: null })
    }),
    {
      name: "prism-app",
      partialize: (state) => ({
        theme: state.theme,
        capture: state.capture,
        selectedLens: state.selectedLens,
        reading: state.reading
      })
    }
  )
);
