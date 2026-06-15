import { useEffect, useState } from "react";
import { InstalledAppsTable } from "../components/InstalledAppsTable";
import { TweakChecklist } from "../components/TweakChecklist";
import type { PreviewAppUninstall } from "../lib/types";
import { useDebloatStore } from "../stores/debloatStore";

export function InstalledAppsPage() {
  const {
    tweaks,
    scanReport,
    selectedIds,
    toggleSelection,
    selectAll,
    loadCatalog,
    applySelected,
    installedAppsReport,
    selectedAppIds,
    toggleAppSelection,
    selectAllApps,
    scanInstalledApps,
    bulkUninstallApps,
    loading,
    error,
  } = useDebloatStore();

  const [preview, setPreview] = useState<PreviewAppUninstall[] | null>(null);

  useEffect(() => {
    loadCatalog("apps");
  }, [loadCatalog]);

  const applicableIds = tweaks
    .filter((t) => {
      const status = scanReport?.tweakStatuses.find((s) => s.id === t.id);
      return !status?.applied;
    })
    .map((t) => t.id);

  const startUninstall = async () => {
    if (selectedAppIds.size === 0) return;
    try {
      const items = await useDebloatStore.getState().previewAppUninstall();
      setPreview(items);
    } catch (e) {
      useDebloatStore.setState({ error: String(e) });
    }
  };

  const confirmUninstall = async () => {
    if (!preview) return;
    await bulkUninstallApps(preview);
    setPreview(null);
  };

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">Quick Bloat Removal</h2>
            <p className="text-sm text-slate-400">
              Remove common preinstalled Microsoft Store and provisioned apps.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => selectAll(applicableIds)}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-sky-500"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => applySelected()}
              disabled={loading || selectedIds.size === 0}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              Apply selected ({selectedIds.size})
            </button>
          </div>
        </div>
        <TweakChecklist
          tweaks={tweaks}
          statuses={scanReport?.tweakStatuses}
          selectedIds={selectedIds}
          onToggle={toggleSelection}
        />
      </section>

      <section className="space-y-6 border-t border-slate-800 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">All Installed Applications</h2>
            <p className="text-sm text-slate-400">
              Full inventory of Store (Appx) and Win32 apps. Bulk uninstall in one session.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scanInstalledApps()}
              disabled={loading}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-sky-500 disabled:opacity-50"
            >
              {loading ? "Scanning..." : "Scan apps"}
            </button>
            <button
              type="button"
              onClick={() => startUninstall()}
              disabled={loading || selectedAppIds.size === 0}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
            >
              Uninstall selected ({selectedAppIds.size})
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {installedAppsReport && (
          <p className="text-xs text-slate-500">
            {installedAppsReport.totalCount} apps — {installedAppsReport.bloatCount} flagged as
            bloat — scanned at{" "}
            {new Date(installedAppsReport.scannedAt).toLocaleString()}
          </p>
        )}

        <InstalledAppsTable
          apps={installedAppsReport?.apps ?? []}
          selectedIds={selectedAppIds}
          onToggle={toggleAppSelection}
          onSelectAll={selectAllApps}
          onSelectAllBloat={(ids) => selectAllApps(ids)}
        />
      </section>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-slate-100">Confirm uninstall</h3>
            <p className="mt-1 text-sm text-slate-400">
              A restore point will be created. Uninstalled apps must be reinstalled manually to
              revert.
            </p>
            <ul className="mt-4 space-y-3">
              {preview.map((item) => (
                <li key={item.appId} className="rounded-lg bg-slate-800/60 p-3 text-sm">
                  <div className="font-medium text-slate-200">{item.displayName}</div>
                  <div className="text-slate-400">{item.action}</div>
                  {item.warning && (
                    <div className="mt-1 text-xs text-amber-300">{item.warning}</div>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmUninstall()}
                disabled={loading}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
              >
                Uninstall {preview.length} app{preview.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
