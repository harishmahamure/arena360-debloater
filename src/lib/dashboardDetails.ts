import type { ResourceEntry, ScanReport, Tweak } from "./types";

export type DashboardDetailId =
  | "bloat_apps"
  | "services"
  | "telemetry"
  | "reclaimable"
  | "debloat_score"
  | "resource_cpu"
  | "resource_ram"
  | "resource_disk"
  | "resource_network"
  | "high_usage";

export interface DashboardDetailItem {
  id: string;
  title: string;
  subtitle?: string;
  metric?: string;
}

export interface DashboardDetailView {
  id: DashboardDetailId;
  title: string;
  description: string;
  emptyMessage: string;
  items: DashboardDetailItem[];
  actionLabel?: string;
  actionTab?: "apps" | "services" | "privacy" | "cleanup" | "background_usage";
}

const TELEMETRY_IDS = new Set([
  "disable-diagtrack",
  "disable-advertising-id",
  "disable-activity-history",
  "disable-tailored-experiences",
  "disable-location-tracking",
  "disable-ceip-task",
  "disable-feedback-task",
]);

const CLEANUP_ESTIMATE_MB: Record<string, number> = {
  "clear-temp-files": 512,
  "clear-update-cache": 1024,
  "dism-component-cleanup": 768,
  "clear-delivery-optimization": 256,
};

function applicableTweaks(report: ScanReport, tweaks: Tweak[], filter: (t: Tweak) => boolean) {
  const byId = new Map(tweaks.map((t) => [t.id, t]));
  return report.tweakStatuses
    .filter((s) => s.applicable && byId.has(s.id) && filter(byId.get(s.id)!))
    .map((s) => byId.get(s.id)!);
}

function tweakItems(tweaks: Tweak[], metric?: (t: Tweak) => string): DashboardDetailItem[] {
  return tweaks.map((t) => ({
    id: t.id,
    title: t.name,
    subtitle: t.description,
    metric: metric?.(t),
  }));
}

function resourceItems(
  entries: ResourceEntry[],
  sortKey: "cpuPercent" | "ramMb" | "diskMbps" | "networkConnections",
  formatMetric: (e: ResourceEntry) => string,
  min = 0,
): DashboardDetailItem[] {
  return [...entries]
    .filter((e) => {
      const val =
        sortKey === "diskMbps"
          ? (e.diskMbps ?? 0)
          : sortKey === "networkConnections"
            ? (e.networkConnections ?? 0)
            : e[sortKey];
      return typeof val === "number" && val >= min;
    })
    .sort((a, b) => {
      const av =
        sortKey === "diskMbps"
          ? (a.diskMbps ?? 0)
          : sortKey === "networkConnections"
            ? (a.networkConnections ?? 0)
            : a[sortKey];
      const bv =
        sortKey === "diskMbps"
          ? (b.diskMbps ?? 0)
          : sortKey === "networkConnections"
            ? (b.networkConnections ?? 0)
            : b[sortKey];
      return (bv as number) - (av as number);
    })
    .map((e) => ({
      id: e.id,
      title: e.displayName,
      subtitle: `${e.processName} · PID ${e.processId}${e.isProtected ? " · protected" : ""}`,
      metric: formatMetric(e),
    }));
}

export function buildDashboardDetail(
  id: DashboardDetailId,
  report: ScanReport,
  tweaks: Tweak[],
  resourceEntries?: ResourceEntry[],
): DashboardDetailView {
  switch (id) {
    case "bloat_apps": {
      const list = applicableTweaks(report, tweaks, (t) => t.category === "apps");
      return {
        id,
        title: "Removable bloat apps",
        description: "Store apps that can still be removed with one-click tweaks.",
        emptyMessage: "No removable app tweaks pending — you're up to date.",
        items: tweakItems(list),
        actionLabel: "Open Apps",
        actionTab: "apps",
      };
    }
    case "services": {
      const list = applicableTweaks(report, tweaks, (t) => t.category === "services");
      return {
        id,
        title: "Unnecessary services",
        description: "Services that can be disabled to reduce background overhead.",
        emptyMessage: "No optional service tweaks pending.",
        items: tweakItems(list),
        actionLabel: "Open Services",
        actionTab: "services",
      };
    }
    case "telemetry": {
      const list = applicableTweaks(
        report,
        tweaks,
        (t) => t.category === "privacy" || TELEMETRY_IDS.has(t.id),
      );
      return {
        id,
        title: report.telemetryEnabled ? "Telemetry still active" : "Telemetry status",
        description: report.telemetryEnabled
          ? "Privacy and telemetry tweaks that are not applied yet."
          : "DiagTrack appears disabled. Remaining privacy tweaks below.",
        emptyMessage: "No pending telemetry or privacy tweaks.",
        items: tweakItems(list),
        actionLabel: "Open Privacy",
        actionTab: "privacy",
      };
    }
    case "reclaimable": {
      const list = applicableTweaks(report, tweaks, (t) => t.category === "cleanup");
      return {
        id,
        title: "Reclaimable disk space",
        description: "Cleanup actions that can free space on your system.",
        emptyMessage: "No cleanup tweaks pending.",
        items: tweakItems(list, (t) => {
          const mb = CLEANUP_ESTIMATE_MB[t.id] ?? 64;
          return `~${mb} MB`;
        }),
        actionLabel: "Open Cleanup",
        actionTab: "cleanup",
      };
    }
    case "debloat_score": {
      const list = applicableTweaks(report, tweaks, () => true);
      return {
        id,
        title: "Pending debloat tweaks",
        description: `${list.length} of ${tweaks.length} tweaks are not applied yet (${report.debloatScore}% opportunity).`,
        emptyMessage: "All catalog tweaks are applied.",
        items: tweakItems(list, (t) => t.category.replace("_", " ")),
      };
    }
    case "resource_cpu":
      return {
        id,
        title: "Background CPU usage",
        description: "Processes ranked by sampled CPU load (5s window).",
        emptyMessage: "No background CPU data. Run Scan now to refresh.",
        items: resourceEntries
          ? resourceItems(resourceEntries, "cpuPercent", (e) => `${e.cpuPercent.toFixed(1)}%`)
          : [],
        actionLabel: "Manage in Background Usage",
        actionTab: "background_usage",
      };
    case "resource_ram":
      return {
        id,
        title: "Background RAM usage",
        description: "Processes ranked by working set memory.",
        emptyMessage: "No background RAM data. Run Scan now to refresh.",
        items: resourceEntries
          ? resourceItems(resourceEntries, "ramMb", (e) => `${e.ramMb.toFixed(0)} MB`)
          : [],
        actionLabel: "Manage in Background Usage",
        actionTab: "background_usage",
      };
    case "resource_disk":
      return {
        id,
        title: "Background disk I/O",
        description: "Processes ranked by read + write throughput.",
        emptyMessage: "No disk I/O data. Run Scan now to refresh.",
        items: resourceEntries
          ? resourceItems(
              resourceEntries,
              "diskMbps",
              (e) => `${(e.diskMbps ?? 0).toFixed(2)} MB/s`,
              0.01,
            )
          : [],
        actionLabel: "Manage in Background Usage",
        actionTab: "background_usage",
      };
    case "resource_network":
      return {
        id,
        title: "Network connections by process",
        description: "Active TCP (established) and UDP endpoints per process — not bandwidth.",
        emptyMessage: "No network connection data. Run Scan now to refresh.",
        items: resourceEntries
          ? resourceItems(
              resourceEntries,
              "networkConnections",
              (e) => `${e.networkConnections ?? 0} conns`,
              1,
            )
          : [],
        actionLabel: "Manage in Background Usage",
        actionTab: "background_usage",
      };
    case "high_usage":
      return {
        id,
        title: "High-usage background items",
        description: "All processes flagged by the background resource scan.",
        emptyMessage: "No high-usage items. Run Scan now to refresh.",
        items: resourceEntries
          ? [...resourceEntries]
              .sort(
                (a, b) =>
                  b.cpuPercent +
                  b.ramMb / 100 +
                  (b.diskMbps ?? 0) * 10 +
                  (b.networkConnections ?? 0) / 5 -
                  (a.cpuPercent +
                    a.ramMb / 100 +
                    (a.diskMbps ?? 0) * 10 +
                    (a.networkConnections ?? 0) / 5),
              )
              .map((e) => ({
                id: e.id,
                title: e.displayName,
                subtitle: `${e.processName} · PID ${e.processId}`,
                metric: [
                  e.cpuPercent > 0 ? `${e.cpuPercent.toFixed(1)}% CPU` : null,
                  e.ramMb > 0 ? `${e.ramMb.toFixed(0)} MB` : null,
                  (e.diskMbps ?? 0) > 0 ? `${(e.diskMbps ?? 0).toFixed(2)} MB/s disk` : null,
                  (e.networkConnections ?? 0) > 0 ? `${e.networkConnections} conns` : null,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))
          : [],
        actionLabel: "Open Background Usage",
        actionTab: "background_usage",
      };
  }
}
