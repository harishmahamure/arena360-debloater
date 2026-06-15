import { useEffect } from "react";
import { TweakChecklist } from "../components/TweakChecklist";
import { useDebloatStore } from "../stores/debloatStore";

export function TasksStartupPage() {
  const {
    tasksReport,
    loadTasksReport,
    tweaks,
    scanReport,
    selectedIds,
    toggleSelection,
    applySelected,
    loadCatalog,
    loading,
  } = useDebloatStore();

  useEffect(() => {
    loadCatalog("tasks");
    loadTasksReport();
  }, [loadCatalog, loadTasksReport]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Tasks & Startup</h2>
        <p className="text-sm text-slate-400">
          Review startup programs and telemetry scheduled tasks, then apply task tweaks.
        </p>
      </div>

      {tasksReport && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <h3 className="mb-3 font-medium text-slate-200">Startup programs</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {tasksReport.startupEntries.length === 0 && <li>None detected</li>}
              {tasksReport.startupEntries.map((entry) => (
                <li key={`${entry.location}-${entry.name}`} className="rounded bg-slate-800/60 p-2">
                  <span className="text-slate-200">{entry.name}</span>
                  <p className="truncate text-xs">{entry.command}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <h3 className="mb-3 font-medium text-slate-200">Scheduled tasks</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {tasksReport.scheduledTasks.length === 0 && <li>None detected</li>}
              {tasksReport.scheduledTasks.map((task) => (
                <li key={`${task.path}-${task.name}`} className="rounded bg-slate-800/60 p-2">
                  <span className="text-slate-200">{task.name}</span>
                  <p className="text-xs">
                    {task.path} — {task.state}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => applySelected()}
          disabled={loading || selectedIds.size === 0}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Apply selected tasks ({selectedIds.size})
        </button>
      </div>

      <TweakChecklist
        tweaks={tweaks}
        statuses={scanReport?.tweakStatuses}
        selectedIds={selectedIds}
        onToggle={toggleSelection}
      />
    </div>
  );
}
