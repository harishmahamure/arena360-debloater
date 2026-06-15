import { useEffect } from "react";
import { TweakChecklist } from "../components/TweakChecklist";
import { useDebloatStore } from "../stores/debloatStore";

export function CategoryPage({
  category,
  title,
  description,
  groupByRisk = false,
}: {
  category: string;
  title: string;
  description: string;
  groupByRisk?: boolean;
}) {
  const {
    tweaks,
    scanReport,
    selectedIds,
    toggleSelection,
    selectAll,
    loadCatalog,
    applySelected,
    loading,
  } = useDebloatStore();

  useEffect(() => {
    loadCatalog(category);
  }, [category, loadCatalog]);

  const applicableIds = tweaks
    .filter((t) => {
      const status = scanReport?.tweakStatuses.find((s) => s.id === t.id);
      return !status?.applied;
    })
    .map((t) => t.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
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
        groupByRisk={groupByRisk}
      />
    </div>
  );
}
