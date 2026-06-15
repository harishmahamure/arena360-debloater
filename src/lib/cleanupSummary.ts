import type {
  ApplyResult,
  CleanupSummary,
  CleanupSummaryItem,
  InstalledApp,
  PreviewAppUninstall,
  PreviewItem,
  PreviewResourceItem,
  Preset,
  ResourceAction,
  ResourceEntry,
  Tweak,
} from "./types";

function mergeResultItems(
  result: ApplyResult,
  rows: Omit<CleanupSummaryItem, "success" | "detail">[],
): CleanupSummaryItem[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return result.items.map((item) => {
    const row = byId.get(item.tweakId);
    return {
      id: item.tweakId,
      name: row?.name ?? item.tweakId,
      action: row?.action ?? "Applied",
      benefit: row?.benefit ?? "System optimization applied",
      success: item.success,
      detail: item.success ? undefined : item.message,
    };
  });
}

function resourceBenefit(entry: ResourceEntry, action: ResourceAction): string {
  const metrics: string[] = [];
  if (entry.cpuPercent >= 0.5) metrics.push(`${entry.cpuPercent.toFixed(1)}% CPU`);
  if (entry.ramMb >= 50) metrics.push(`${entry.ramMb.toFixed(0)} MB RAM`);
  if (entry.gpuPercent >= 1) metrics.push(`${entry.gpuPercent.toFixed(1)}% GPU`);
  if ((entry.diskMbps ?? 0) >= 0.5) metrics.push(`${(entry.diskMbps ?? 0).toFixed(2)} MB/s disk`);
  if ((entry.networkConnections ?? 0) >= 5) {
    metrics.push(`${entry.networkConnections} active connections`);
  }

  const freed =
    metrics.length > 0 ? `Frees ~${metrics.join(", ")} in the background` : null;

  if (action === "stop") {
    return freed
      ? `${freed} — fewer stutters and smoother frame times while gaming`
      : "Stops the process and blocks it from auto-starting again";
  }
  return freed
    ? `${freed} — removes the app completely`
    : "Removes the app and its provisioned copy for new users";
}

function aggregateResourceBenefits(
  entries: ResourceEntry[],
  action: ResourceAction,
): string[] {
  const benefits: string[] = [];
  let cpu = 0;
  let ram = 0;
  let gpu = 0;
  let disk = 0;
  let connections = 0;

  for (const entry of entries) {
    cpu += entry.cpuPercent;
    ram += entry.ramMb;
    gpu += entry.gpuPercent;
    disk += entry.diskMbps ?? 0;
    connections += entry.networkConnections ?? 0;
  }

  if (cpu >= 1) {
    benefits.push(`~${cpu.toFixed(1)}% total CPU load removed from background processes`);
  }
  if (ram >= 50) {
    benefits.push(`~${ram.toFixed(0)} MB RAM freed for games and active apps`);
  }
  if (gpu >= 1) {
    benefits.push(`~${gpu.toFixed(1)}% GPU compositing load reduced (Copy/3D engines)`);
  }
  if (disk >= 0.5) {
    benefits.push(`~${disk.toFixed(2)} MB/s disk I/O reduced from background processes`);
  }
  if (connections >= 5) {
    benefits.push(`${connections} fewer active network connections from background apps`);
  }

  if (action === "stop") {
    benefits.push("Stopped items won't restart until you revert the last session");
  } else {
    benefits.push("Uninstalled Store apps stay removed for current and new users");
  }

  if (benefits.length === 0) {
    benefits.push("Less background noise — smoother system responsiveness");
  }

  return benefits;
}

export function buildTweakCleanupSummary(
  result: ApplyResult,
  preview: PreviewItem[],
  title = "Debloat complete",
): CleanupSummary {
  const items = mergeResultItems(
    result,
    preview.map((p) => ({
      id: p.tweakId,
      name: p.name,
      action: p.action.replace(/^Run apply script: /, "Applied"),
      benefit: p.description,
    })),
  );

  const categories = new Set(
    preview.filter((p) => result.items.some((i) => i.tweakId === p.tweakId && i.success)).map((p) => p.category),
  );
  const benefits: string[] = [];
  if (categories.has("gaming")) {
    benefits.push("Gaming tweaks applied — lower capture overhead and better power delivery");
  }
  if (categories.has("privacy")) {
    benefits.push("Reduced telemetry and tracking in the background");
  }
  if (categories.has("apps")) {
    benefits.push("Preinstalled bloat apps removed — cleaner Start menu and less disk use");
  }
  if (categories.has("services") || categories.has("tasks")) {
    benefits.push("Fewer services and startup tasks competing for CPU and RAM");
  }
  if (categories.has("cleanup")) {
    benefits.push("Temporary files and caches cleared — more reclaimable disk space");
  }
  if (categories.has("performance")) {
    benefits.push("Less indexing, upload, and maintenance overhead — smoother CPU, RAM, network, and disk");
  }
  if (benefits.length === 0) {
    benefits.push("System is leaner with fewer background overheads");
  }
  if (result.requiresReboot) {
    benefits.push("Reboot recommended for all changes to take full effect");
  }

  return { kind: "tweaks", title, result, items, benefits };
}

export function buildPresetCleanupSummary(
  result: ApplyResult,
  preset: Preset,
  tweaks: Tweak[],
): CleanupSummary {
  const tweakById = new Map(tweaks.map((t) => [t.id, t]));
  const preview: PreviewItem[] = preset.tweakIds.map((id) => {
    const tweak = tweakById.get(id);
    return {
      tweakId: id,
      name: tweak?.name ?? id,
      category: tweak?.category ?? "unknown",
      risk: tweak?.risk ?? "safe",
      action: "Applied via preset",
      description: tweak?.description ?? "Preset tweak applied",
      scriptPath: "",
      warning: tweak?.warning ?? null,
    };
  });

  const summary = buildTweakCleanupSummary(result, preview, `${preset.name} applied`);
  summary.kind = "preset";
  summary.benefits = [preset.description, ...summary.benefits];
  return summary;
}

export function buildResourceCleanupSummary(
  result: ApplyResult,
  action: ResourceAction,
  preview: PreviewResourceItem[],
  entries: ResourceEntry[],
): CleanupSummary {
  const entryById = new Map(entries.map((e) => [e.id, e]));
  const actionLabel = action === "stop" ? "Stopped" : "Uninstalled";

  const items = mergeResultItems(
    result,
    preview.map((p) => {
      const entry = entryById.get(p.entryId);
      return {
        id: p.entryId,
        name: p.displayName,
        action: p.action,
        benefit: entry ? resourceBenefit(entry, action) : p.description,
      };
    }),
  ).map((item) => ({
    ...item,
    action: item.success ? actionLabel : item.action,
  }));

  const successfulEntries = entries.filter((e) =>
    result.items.some((i) => i.tweakId === e.id && i.success),
  );

  return {
    kind: "resources",
    title: action === "stop" ? "Background cleanup complete" : "Uninstall complete",
    result,
    items,
    benefits: aggregateResourceBenefits(successfulEntries, action),
  };
}

export function buildAppCleanupSummary(
  result: ApplyResult,
  preview: PreviewAppUninstall[],
  apps: InstalledApp[],
): CleanupSummary {
  const appById = new Map(apps.map((a) => [a.id, a]));
  const items = mergeResultItems(
    result,
    preview.map((p) => {
      const app = appById.get(p.appId);
      const sizePart =
        app && app.sizeMb > 0 ? `Reclaims ~${app.sizeMb.toFixed(0)} MB disk space` : null;
      return {
        id: p.appId,
        name: p.displayName,
        action: p.action,
        benefit: sizePart
          ? `${sizePart} — removes unused preinstalled app clutter`
          : "Removes unused preinstalled app clutter",
      };
    }),
  );

  const freedMb = preview.reduce((sum, p) => sum + (appById.get(p.appId)?.sizeMb ?? 0), 0);
  const benefits = [
    `${result.successCount} app(s) removed from your system`,
    freedMb > 0 ? `~${freedMb.toFixed(0)} MB disk space reclaimed` : null,
    "Fewer Store apps updating and running in the background",
    "Cleaner Start menu and app list",
  ].filter((b): b is string => Boolean(b));

  return {
    kind: "apps",
    title: "App uninstall complete",
    result,
    items,
    benefits,
  };
}
