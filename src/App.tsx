import { useEffect } from "react";
import { api } from "./lib/tauri";
import { useDebloatStore } from "./stores/debloatStore";
import { DashboardPage } from "./pages/Dashboard";
import {
  AppsPage,
  CleanupPage,
  PrivacyPage,
  ServicesPage,
  WindowsUpdatePage,
} from "./pages/Tabs";
import { PresetsPage } from "./pages/Presets";
import { TasksStartupPage } from "./pages/TasksStartup";
import { BackgroundUsagePage } from "./pages/BackgroundUsage";
import type { TabId } from "./lib/types";

const NAV: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "background_usage", label: "Background Usage" },
  { id: "apps", label: "Apps" },
  { id: "privacy", label: "Privacy" },
  { id: "services", label: "Services" },
  { id: "cleanup", label: "Cleanup" },
  { id: "presets", label: "Presets" },
  { id: "windows_update", label: "Windows Update" },
  { id: "tasks", label: "Tasks & Startup" },
];

function App() {
  const {
    activeTab,
    setTab,
    init,
    elevated,
    currentSession,
    revertCurrentSession,
    loading,
    runScan,
    scanResources,
  } = useDebloatStore();

  useEffect(() => {
    init().then(() => {
      runScan();
      scanResources();
    });
  }, [init, runScan, scanResources]);

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage />;
      case "apps":
        return <AppsPage />;
      case "privacy":
        return <PrivacyPage />;
      case "services":
        return <ServicesPage />;
      case "cleanup":
        return <CleanupPage />;
      case "presets":
        return <PresetsPage />;
      case "windows_update":
        return <WindowsUpdatePage />;
      case "tasks":
        return <TasksStartupPage />;
      case "background_usage":
        return <BackgroundUsagePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-slate-800 bg-slate-950 p-4">
        <h1 className="text-lg font-bold text-sky-400">Debloater</h1>
        <p className="text-xs text-slate-500">Windows 11</p>
        <nav className="mt-6 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                activeTab === item.id
                  ? "bg-sky-600/20 text-sky-300"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
          <div className="flex items-center gap-3 text-sm">
            {elevated ? (
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-300">
                Running as Administrator
              </span>
            ) : (
              <button
                type="button"
                onClick={() => api.requestElevation()}
                className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-200 hover:bg-amber-500/30"
              >
                Elevate for system changes
              </button>
            )}
          </div>
          {currentSession && (
            <button
              type="button"
              disabled={loading}
              onClick={() => revertCurrentSession()}
              className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-500/10 disabled:opacity-50"
            >
              Revert last session
            </button>
          )}
        </header>
        <main className="flex-1 overflow-auto p-6">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
