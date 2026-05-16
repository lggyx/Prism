import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Observer } from "../schemas/domain";

type SessionState = {
  deviceId: string;
  accessToken: string | null;
  refreshToken: string | null;
  observer: Observer | null;
  setDeviceId: (deviceId: string) => void;
  setAuth: (accessToken: string, refreshToken: string, observer: Observer) => void;
  clearAuth: () => void;
};

function createDeviceId() {
  return `web_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      deviceId: createDeviceId(),
      accessToken: null,
      refreshToken: null,
      observer: null,
      setDeviceId: (deviceId) => set({ deviceId }),
      setAuth: (accessToken, refreshToken, observer) => set({ accessToken, refreshToken, observer }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, observer: null })
    }),
    { name: "prism-session" }
  )
);
