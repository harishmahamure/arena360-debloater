import { invoke } from "@tauri-apps/api/core";
import type {
  ApplyResult,
  InstalledAppsReport,
  Preset,
  PreviewAppUninstall,
  PreviewItem,
  PreviewResourceItem,
  ResourceAction,
  ResourceScanReport,
  RevertResult,
  ScanReport,
  TasksStartupReport,
  Tweak,
} from "./types";

export const api = {
  isElevated: () => invoke<boolean>("is_elevated"),
  requestElevation: () => invoke<void>("request_elevation"),
  getCatalog: (category?: string) =>
    invoke<Tweak[]>("get_catalog", { category: category ?? null }),
  scanSystem: () => invoke<ScanReport>("scan_system"),
  previewChanges: (tweakIds: string[]) =>
    invoke<PreviewItem[]>("preview_changes", { tweakIds }),
  createRestorePoint: (label: string) =>
    invoke<boolean>("create_restore_point", { label }),
  applyTweaks: (tweakIds: string[], createRestore: boolean) =>
    invoke<ApplyResult>("apply_tweaks", { tweakIds, createRestore }),
  revertSession: (sessionId: string) =>
    invoke<RevertResult>("revert_session", { sessionId }),
  getCurrentSession: () => invoke<string | null>("get_current_session"),
  getPresets: () => invoke<Preset[]>("get_presets"),
  applyPreset: (presetId: string, createRestore: boolean) =>
    invoke<ApplyResult>("apply_preset", { presetId, createRestore }),
  scanTasksStartup: () => invoke<TasksStartupReport>("scan_tasks_startup"),
  scanResourceUsage: (options?: {
    sampleSecs?: number;
    minCpu?: number;
    minRamMb?: number;
  }) => invoke<ResourceScanReport>("scan_resource_usage", { options: options ?? null }),
  previewResourceActions: (entryIds: string[], action: ResourceAction) =>
    invoke<PreviewResourceItem[]>("preview_resource_actions", { entryIds, action }),
  applyResourceActions: (
    entryIds: string[],
    action: ResourceAction,
    createRestore: boolean,
  ) =>
    invoke<ApplyResult>("apply_resource_actions", {
      options: { entryIds, action, createRestore },
    }),
  scanInstalledApps: () => invoke<InstalledAppsReport>("scan_installed_apps"),
  previewAppUninstall: (appIds: string[]) =>
    invoke<PreviewAppUninstall[]>("preview_app_uninstall", { appIds }),
  bulkUninstallApps: (appIds: string[], createRestore: boolean) =>
    invoke<ApplyResult>("bulk_uninstall_apps", {
      options: { appIds, createRestore },
    }),
};
