import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { LibraryPage } from "./pages/LibraryPage";
import { StudioPage } from "./pages/StudioPage";
import { SystemPage } from "./pages/SystemPage";
import { useWorkspace } from "./lib/useWorkspace";

export default function App() {
  const workspace = useWorkspace();
  return (
    <AppShell serviceState={workspace.serviceState} activeCount={workspace.metrics.active}>
      <Routes>
        <Route path="/" element={<StudioPage workspace={workspace} />} />
        <Route path="/library" element={<LibraryPage workspace={workspace} />} />
        <Route path="/system" element={<SystemPage workspace={workspace} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
