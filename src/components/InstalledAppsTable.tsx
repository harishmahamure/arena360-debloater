import { useMemo, useState } from "react";
import type { InstalledApp } from "../lib/types";
import { RiskBadge } from "./RiskBadge";

type SortKey = "displayName" | "publisher" | "sizeMb" | "appType" | "risk";
type AppFilter = "all" | "bloat" | "appx" | "win32";

interface Props {
  apps: InstalledApp[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onSelectAllBloat: (ids: string[]) => void;
}

function riskOrder(risk: InstalledApp["risk"]) {
  if (risk === "advanced") return 2;
  if (risk === "moderate") return 1;
  return 0;
}

export function InstalledAppsTable({
  apps,
  selectedIds,
  onToggle,
  onSelectAll,
  onSelectAllBloat,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AppFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("displayName");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter((app) => {
      if (filter === "bloat" && !app.isBloat) return false;
      if (filter === "appx" && app.appType !== "appx") return false;
      if (filter === "win32" && app.appType !== "win32") return false;
      if (!q) return true;
      return (
        app.displayName.toLowerCase().includes(q) ||
        app.publisher.toLowerCase().includes(q) ||
        (app.packageName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [apps, search, filter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      if (sortKey === "risk") {
        const diff = riskOrder(a.risk) - riskOrder(b.risk);
        return sortAsc ? diff : -diff;
      }
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
  }, [filtered, sortKey, sortAsc]);

  const selectableIds = apps.filter((a) => !a.isProtected && a.canUninstall).map((a) => a.id);
  const bloatIds = apps.filter((a) => a.isBloat && !a.isProtected && a.canUninstall).map((a) => a.id);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === "displayName" || key === "publisher");
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search apps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as AppFilter)}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="all">All apps</option>
          <option value="bloat">Bloat only</option>
          <option value="appx">Appx / Store</option>
          <option value="win32">Win32</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-slate-900/80 px-4 py-2">
          <span className="text-sm text-slate-400">
            {filtered.length} of {apps.length} applications
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onSelectAllBloat(bloatIds)}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              Select all bloat
            </button>
            <button
              type="button"
              onClick={() => onSelectAll(selectableIds)}
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              Select all unprotected
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="px-3 py-2" />
                {header("Name", "displayName")}
                {header("Publisher", "publisher")}
                {header("Size", "sizeMb")}
                {header("Type", "appType")}
                {header("Risk", "risk")}
              </tr>
            </thead>
            <tbody>
              {sorted.map((app) => (
                <tr
                  key={app.id}
                  className={`border-t border-slate-800 ${
                    app.isProtected ? "opacity-50" : "hover:bg-slate-900/40"
                  }`}
                >
                  <td className="px-3 py-2">
                    {app.isProtected ? (
                      <span className="text-slate-500" title="Protected">
                        🔒
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-sky-500"
                        checked={selectedIds.has(app.id)}
                        disabled={!app.canUninstall}
                        onChange={() => onToggle(app.id)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-100">{app.displayName}</div>
                    <div className="text-xs text-slate-500">
                      {app.isBloat && (
                        <span className="mr-2 text-amber-400">Bloat</span>
                      )}
                      {app.isProtected && "Protected"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-400">{app.publisher || "—"}</td>
                  <td className="px-3 py-2 text-slate-200">
                    {app.sizeMb > 0 ? `${app.sizeMb.toFixed(1)} MB` : "—"}
                  </td>
                  <td className="px-3 py-2 capitalize text-slate-400">{app.appType}</td>
                  <td className="px-3 py-2">
                    <RiskBadge risk={app.risk} />
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {apps.length === 0
                      ? "No apps loaded. Click Scan apps to inventory installed applications."
                      : "No apps match your search or filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
