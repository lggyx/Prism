import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { BrowserRouter } from "react-router-dom";
import { setupNativeChrome } from "../capacitor/system";
import { resolveDeviceId } from "../capacitor/device";
import { useAppStore } from "../stores/appStore";
import { useSessionStore } from "../stores/sessionStore";

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false
      }
    }
  }), []);
  const theme = useAppStore((state) => state.theme);
  const setDeviceId = useSessionStore((state) => state.setDeviceId);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    setupNativeChrome(theme);
  }, [theme]);

  useEffect(() => {
    resolveDeviceId().then((deviceId) => {
      if (deviceId) setDeviceId(deviceId);
    });
  }, [setDeviceId]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}
