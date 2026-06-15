import { useMemo, useState } from "react";
import type { ResourceEntry } from "../lib/types";
import { RiskBadge } from "./RiskBadge";

type SortKey = "displayName" | "cpuPercent" | "ramMb" | "gpuPercent" | "entryType";

interface Props {
  entries: ResourceEntry[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}

export function ResourceTable({ entries, selectedIds, onToggle, onSelectAll }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("cpuPercent");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const list = [...entries];
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return list;
  }, [entries, sortKey, sortAsc]);

  const selectableIds = entries.filter((e) => !e.isProtected).map((e) => e.id);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const header = (label: string, key: SortKey) => (
    <th
      key={key}
      className="cursor-pointer px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-300"
      onClick={() => toggleSort(key)}
    >
      {label}
      {sortKey === key ? (sortAsc ? " ^" : " v") : ""}
    </th>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700">
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/80 px-4 py-2">
        <span className="text-sm text-slate-400">{entries.length} background items</span>
        <button
          type="button"
          onClick={() => onSelectAll(selectableIds)}
          className="text-xs text-sky-400 hover:text-sky-300"
        >
          Select all unprotected
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60">
            <tr>
              <th className="px-3 py-2" />
              {header("Name", "displayName")}
              {header("Type", "entryType")}
              {header("CPU %", "cpuPercent")}
              {header("RAM MB", "ramMb")}
              {header("GPU %", "gpuPercent")}
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Publisher
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <tr
                key={entry.id}
                className={`border-t border-slate-800 ${
                  entry.isProtected ? "opacity-50" : "hover:bg-slate-900/40"
                }`}
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-sky-500"
                    checked={selectedIds.has(entry.id)}
                    disabled={entry.isProtected}
                    onChange={() => onToggle(entry.id)}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-100">{entry.displayName}</div>
                  <div className="text-xs text-slate-500">
                    {entry.processName} (PID {entry.processId})
                    {entry.isProtected && " — protected"}
                  </div>
                </td>
                <td className="px-3 py-2 capitalize text-slate-400">{entry.entryType}</td>
                <td className="px-3 py-2 text-slate-200">{entry.cpuPercent.toFixed(1)}</td>
                <td className="px-3 py-2 text-slate-200">{entry.ramMb.toFixed(0)}</td>
                <td className="px-3 py-2 text-slate-200">
                  {entry.gpuPercent > 0 ? entry.gpuPercent.toFixed(1) : "—"}
                </td>
                <td className="px-3 py-2 text-slate-400">{entry.publisher || "—"}</td>
                <td className="px-3 py-2">
                  <RiskBadge risk={entry.risk} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No high-usage background items found. Try scanning again.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
