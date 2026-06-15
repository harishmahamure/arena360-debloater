import { useDebloatStore } from "../stores/debloatStore";
import { ScanSummary } from "../components/ScanSummary";

export function DashboardPage() {
  const {
    scanReport,
    resourceReport,
    loading,
    runScan,
    selectedIds,
    applySelected,
    lastApplyResult,
    error,
    setTab,
  } = useDebloatStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">System Scan</h2>
          <p className="text-sm text-slate-400">
            Scan your system to see debloat opportunities before applying changes.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => runScan()}
            disabled={loading}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Scan now"}
          </button>
          <button
            type="button"
            onClick={() => applySelected()}
            disabled={loading || selectedIds.size === 0}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-sky-500 disabled:opacity-50"
          >
            Apply selected ({selectedIds.size})
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {scanReport ? (
        <>
          <ScanSummary
            report={scanReport}
            highUsageCount={resourceReport?.highUsageCount}
            onViewBackgroundUsage={() => setTab("background_usage")}
          />
          <p className="text-xs text-slate-500">
            Last scanned: {new Date(scanReport.scannedAt).toLocaleString()}
          </p>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
          Run a scan to see your system debloat report.
        </div>
      )}

      {lastApplyResult && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="font-medium text-emerald-200">
            Applied {lastApplyResult.successCount} tweak(s) successfully
          </p>
          {lastApplyResult.requiresReboot && (
            <p className="mt-1 text-sm text-amber-200">A system reboot is recommended.</p>
          )}
        </div>
      )}
    </div>
  );
}
