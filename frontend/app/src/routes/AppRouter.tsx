import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { AuthPage } from "../features/auth/AuthPage";
import { CapturePage } from "../features/capture/CapturePage";
import { CollectionPage } from "../features/collection/CollectionPage";
import { DiscoverPage } from "../features/discover/DiscoverPage";
import { LensLibraryPage } from "../features/lenses/LensLibraryPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { ReadingResultPage } from "../features/readings/ReadingResultPage";
import { useSessionStore } from "../stores/sessionStore";

function RequireSession({ children }: { children: React.ReactNode }) {
  const accessToken = useSessionStore((state) => state.accessToken);
  return accessToken ? children : <Navigate to="/auth" replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<RequireSession><AppShell /></RequireSession>}>
        <Route index element={<Navigate to="/collection" replace />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/capture" element={<CapturePage />} />
        <Route path="/result" element={<ReadingResultPage />} />
        <Route path="/lenses" element={<LensLibraryPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/collection" replace />} />
    </Routes>
  );
}
