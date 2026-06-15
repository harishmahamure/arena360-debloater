import { useEffect, useState } from "react";
import { ResourceActionBar } from "../components/ResourceActionBar";
import { ResourceTable } from "../components/ResourceTable";
import type { PreviewResourceItem, ResourceAction } from "../lib/types";
import { useDebloatStore } from "../stores/debloatStore";

export function BackgroundUsagePage() {
  const {
    resourceReport,
    selectedResourceIds,
    toggleResourceSelection,
    selectAllResources,
    scanResources,
    applyResourceAction,
    loading,
    error,
  } = useDebloatStore();

  const [preview, setPreview] = useState<PreviewResourceItem[] | null>(null);
  const [pendingAction, setPendingAction] = useState<ResourceAction | null>(null);

  useEffect(() => {
    scanResources();
  }, [scanResources]);

  const startAction = async (action: ResourceAction) => {
    const ids = Array.from(selectedResourceIds);
    if (ids.length === 0) return;
    try {
      const items = await useDebloatStore.getState().previewResourceAction(action);
      setPreview(items);
      setPendingAction(action);
    } catch (e) {
      useDebloatStore.setState({ error: String(e) });
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    await applyResourceAction(pendingAction);
    setPreview(null);
    setPendingAction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Background Usage</h2>
          <p className="text-sm text-slate-400">
            Live scan of CPU, RAM, and GPU usage by background services and apps.
          </p>
        </div>
        <button
          type="button"
          onClick={() => scanResources()}
          disabled={loading}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {loading ? "Scanning (5s sample)..." : "Scan now"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {resourceReport && (
        <p className="text-xs text-slate-500">
          Found {resourceReport.highUsageCount} high-usage items — scanned at{" "}
          {new Date(resourceReport.scannedAt).toLocaleString()} ({resourceReport.sampleSecs}s sample)
        </p>
      )}

      <ResourceActionBar
        selectedCount={selectedResourceIds.size}
        loading={loading}
        onStop={() => startAction("stop")}
        onUninstall={() => startAction("uninstall")}
      />

      <ResourceTable
        entries={resourceReport?.entries ?? []}
        selectedIds={selectedResourceIds}
        onToggle={toggleResourceSelection}
        onSelectAll={selectAllResources}
      />

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-slate-100">Confirm changes</h3>
            <p className="mt-1 text-sm text-slate-400">
              A restore point will be created before applying.
            </p>
            <ul className="mt-4 space-y-3">
              {preview.map((item) => (
                <li key={item.entryId} className="rounded-lg bg-slate-800/60 p-3 text-sm">
                  <div className="font-medium text-slate-200">{item.displayName}</div>
                  <div className="text-slate-400">{item.description}</div>
                  {item.warning && (
                    <div className="mt-1 text-xs text-amber-300">{item.warning}</div>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setPendingAction(null);
                }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmAction()}
                disabled={loading}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
