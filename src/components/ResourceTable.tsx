import { useEffect, useMemo, useState } from "react";
import type { ResourceEntry } from "../lib/types";
import { RiskBadge } from "./RiskBadge";

type SortKey =
  | "displayName"
  | "cpuPercent"
  | "ramMb"
  | "gpuPercent"
  | "gpuCopyPercent"
  | "diskMbps"
  | "networkConnections"
  | "entryType";

export type ResourceFilterMode = "all" | "cpu" | "ram" | "network" | "disk" | "gaming";

const FILTER_LABELS: Record<ResourceFilterMode, string> = {
  all: "all processes",
  cpu: "CPU heavy",
  ram: "RAM heavy",
  network: "network active",
  disk: "disk I/O heavy",
  gaming: "gaming GPU",
};

const DEFAULT_SORT: Record<ResourceFilterMode, SortKey> = {
  all: "cpuPercent",
  cpu: "cpuPercent",
  ram: "ramMb",
  network: "networkConnections",
  disk: "diskMbps",
  gaming: "gpuCopyPercent",
};

interface Props {
  entries: ResourceEntry[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  filterMode?: ResourceFilterMode;
}

function gpuEngineLoad(entry: ResourceEntry): number {
  return Math.max(
    entry.gpuCopyPercent ?? 0,
    entry.gpu3dPercent ?? 0,
    entry.gpuVideoPercent ?? 0,
    entry.gpuPercent,
  );
}

function matchesFilter(entry: ResourceEntry, filterMode: ResourceFilterMode): boolean {
  if (filterMode === "all") return true;
  if (entry.isProtected) return false;
  switch (filterMode) {
    case "cpu":
      return entry.cpuPercent >= 1;
    case "ram":
      return entry.ramMb >= 200;
    case "network":
      return (entry.networkConnections ?? 0) >= 5;
    case "disk":
      return (entry.diskMbps ?? 0) >= 0.5;
    case "gaming":
      return gpuEngineLoad(entry) >= 1;
    default:
      return true;
  }
}

function sortValue(entry: ResourceEntry, key: SortKey): string | number {
  if (key === "diskMbps") return entry.diskMbps ?? 0;
  if (key === "networkConnections") return entry.networkConnections ?? 0;
  if (key === "gpuCopyPercent") return entry.gpuCopyPercent ?? 0;
  return entry[key] as string | number;
}

function emptyMessage(filterMode: ResourceFilterMode): string {
  switch (filterMode) {
    case "cpu":
      return "No unprotected processes above 1% CPU. Try scanning again or switch to All.";
    case "ram":
      return "No unprotected processes above 200 MB RAM. Try scanning again or switch to All.";
    case "network":
      return "No unprotected processes with 5+ active connections. Try scanning again or switch to All.";
    case "disk":
      return "No unprotected processes above 0.5 MB/s disk I/O. Try scanning again or switch to All.";
    case "gaming":
      return "No unprotected processes with GPU Copy/3D/Video above 1%. Try scanning again or switch to All.";
    default:
      return "No high-usage background items found. Try scanning again.";
  }
}

export function ResourceTable({
  entries,
  selectedIds,
  onToggle,
  onSelectAll,
  filterMode = "all",
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT[filterMode]);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    setSortKey(DEFAULT_SORT[filterMode]);
    setSortAsc(false);
  }, [filterMode]);

  const filtered = useMemo(
    () => entries.filter((e) => matchesFilter(e, filterMode)),
    [entries, filterMode],
  );

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return list;
  }, [filtered, sortKey, sortAsc]);

  const selectableIds = filtered.filter((e) => !e.isProtected).map((e) => e.id);
  const colSpan = filterMode === "gaming" ? 11 : 10;

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
        <span className="text-sm text-slate-400">
          {filtered.length} background items
          {filterMode !== "all" ? ` (${FILTER_LABELS[filterMode]})` : ""}
        </span>
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
              {header("Disk MB/s", "diskMbps")}
              {header("Net conns", "networkConnections")}
              {filterMode === "gaming" && header("Copy %", "gpuCopyPercent")}
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Publisher
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => {
              const hot = filterMode !== "all" && matchesFilter(entry, filterMode);
              return (
                <tr
                  key={entry.id}
                  className={`border-t border-slate-800 ${
                    entry.isProtected
                      ? "opacity-50"
                      : hot
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : "hover:bg-slate-900/40"
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
                    {entry.gpuPercent > 0 ? (
                      <span>
                        {entry.gpuPercent.toFixed(1)}
                        {entry.gpuTopEngine ? (
                          <span className="ml-1 text-xs text-slate-500">{entry.gpuTopEngine}</span>
                        ) : null}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {(entry.diskMbps ?? 0) > 0 ? (entry.diskMbps ?? 0).toFixed(2) : "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {(entry.networkConnections ?? 0) > 0
                      ? entry.networkConnections
                      : "—"}
                  </td>
                  {filterMode === "gaming" && (
                    <td className="px-3 py-2 text-slate-200">
                      {(entry.gpuCopyPercent ?? 0) > 0
                        ? (entry.gpuCopyPercent ?? 0).toFixed(1)
                        : "—"}
                    </td>
                  )}
                  <td className="px-3 py-2 text-slate-400">{entry.publisher || "—"}</td>
                  <td className="px-3 py-2">
                    <RiskBadge risk={entry.risk} />
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage(filterMode)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
