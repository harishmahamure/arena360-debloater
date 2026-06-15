import { useMemo, useState } from "react";
import type { ResourceEntry, ScanReport, TabId, Tweak } from "../lib/types";
import {
  buildDashboardDetail,
  type DashboardDetailId,
} from "../lib/dashboardDetails";
import { aggregateResourceUsage } from "../lib/resourceStats";
import { DashboardDetailPanel } from "./DashboardDetailPanel";

interface Props {
  report: ScanReport;
  tweaks: Tweak[];
  highUsageCount?: number;
  resourceEntries?: ResourceEntry[];
  onViewBackgroundUsage?: () => void;
  onNavigate?: (tab: TabId) => void;
}

type CardConfig = {
  detailId: DashboardDetailId;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "default" | "violet" | "amber";
};

export function ScanSummary({
  report,
  tweaks,
  highUsageCount,
  resourceEntries,
  onViewBackgroundUsage,
  onNavigate,
}: Props) {
  const [activeDetail, setActiveDetail] = useState<DashboardDetailId | null>(null);

  const resourceTotals = resourceEntries?.length
    ? aggregateResourceUsage(resourceEntries)
    : null;

  const cards: CardConfig[] = [
    {
      detailId: "bloat_apps",
      label: "Bloat apps",
      value: report.bloatAppCount,
      sub: `${report.bloatAppSizeMb.toFixed(0)} MB`,
    },
    {
      detailId: "services",
      label: "Unnecessary services",
      value: report.unnecessaryServiceCount,
    },
    {
      detailId: "telemetry",
      label: "Telemetry",
      value: report.telemetryEnabled ? "On" : "Off",
    },
    {
      detailId: "reclaimable",
      label: "Reclaimable space",
      value: `${report.reclaimableSpaceMb.toFixed(0)} MB`,
    },
    {
      detailId: "debloat_score",
      label: "Debloat score",
      value: `${report.debloatScore}%`,
    },
  ];

  const resourceCards: CardConfig[] = resourceTotals
    ? [
        {
          detailId: "resource_cpu",
          label: "Background CPU",
          value: `${resourceTotals.totalCpuPercent.toFixed(1)}%`,
          sub: "sampled load",
          accent: "violet",
        },
        {
          detailId: "resource_ram",
          label: "Background RAM",
          value: `${resourceTotals.totalRamMb.toFixed(0)} MB`,
          sub: "working set",
          accent: "violet",
        },
        {
          detailId: "resource_disk",
          label: "Background disk I/O",
          value: `${resourceTotals.totalDiskMbps.toFixed(2)} MB/s`,
          sub: "read + write",
          accent: "violet",
        },
        {
          detailId: "resource_network",
          label: "Network connections",
          value: resourceTotals.totalNetworkConnections,
          sub: "active TCP/UDP",
          accent: "violet",
        },
      ]
    : [];

  const detailView = useMemo(
    () =>
      activeDetail
        ? buildDashboardDetail(activeDetail, report, tweaks, resourceEntries)
        : null,
    [activeDetail, report, tweaks, resourceEntries],
  );

  const cardClass = (accent: CardConfig["accent"], selected: boolean) => {
    const base =
      "w-full rounded-xl border p-4 text-left transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-sky-500/50";
    if (accent === "violet") {
      return `${base} border-violet-500/30 bg-violet-500/10 ${selected ? "ring-2 ring-violet-400/60" : ""}`;
    }
    if (accent === "amber") {
      return `${base} border-amber-500/30 bg-amber-500/10 ${selected ? "ring-2 ring-amber-400/60" : ""}`;
    }
    return `${base} border-slate-700 bg-slate-900/70 ${selected ? "ring-2 ring-sky-400/60" : ""}`;
  };

  const renderCard = (card: CardConfig) => (
    <button
      key={card.detailId}
      type="button"
      onClick={() =>
        setActiveDetail((prev) => (prev === card.detailId ? null : card.detailId))
      }
      className={cardClass(card.accent, activeDetail === card.detailId)}
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{card.value}</p>
      {card.sub && <p className="text-xs text-slate-400">{card.sub}</p>}
      <p className="mt-2 text-xs text-sky-400/80">Click for details</p>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(renderCard)}</div>

      {resourceCards.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
            Background resource usage
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {resourceCards.map(renderCard)}
          </div>
        </div>
      )}

      {highUsageCount !== undefined && (
        <button
          type="button"
          onClick={() => {
            setActiveDetail((prev) => (prev === "high_usage" ? null : "high_usage"));
          }}
          className={cardClass("amber", activeDetail === "high_usage")}
        >
          <div className="flex w-full items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-xs uppercase tracking-wide text-amber-300/80">
                High-usage background items
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-100">{highUsageCount}</p>
              {!resourceTotals && (
                <p className="mt-1 text-xs text-amber-200/70">
                  Run Scan now for CPU, RAM, disk, and network breakdown
                </p>
              )}
            </div>
            <span className="text-sm text-amber-200">Click for list</span>
          </div>
        </button>
      )}

      <DashboardDetailPanel
        detail={detailView}
        onClose={() => setActiveDetail(null)}
        onNavigate={(tab) => {
          setActiveDetail(null);
          if (tab === "background_usage") {
            onViewBackgroundUsage?.();
          } else {
            onNavigate?.(tab);
          }
        }}
      />
    </div>
  );
}
