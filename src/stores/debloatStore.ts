import { create } from "zustand";
import { api } from "../lib/tauri";
import type {
  ApplyResult,
  CleanupSummary,
  InstalledAppsReport,
  Preset,
  PreviewAppUninstall,
  PreviewResourceItem,
  ResourceAction,
  ResourceScanReport,
  ScanReport,
  TabId,
  TasksStartupReport,
  Tweak,
} from "../lib/types";
import {
  buildAppCleanupSummary,
  buildPresetCleanupSummary,
  buildResourceCleanupSummary,
  buildTweakCleanupSummary,
} from "../lib/cleanupSummary";

let runScanInFlight: Promise<void> | null = null;
let scanResourcesInFlight: Promise<void> | null = null;

interface DebloatState {
  activeTab: TabId;
  elevated: boolean;
  loading: boolean;
  error: string | null;
  scanReport: ScanReport | null;
  resourceReport: ResourceScanReport | null;
  installedAppsReport: InstalledAppsReport | null;
  tweaks: Tweak[];
  selectedIds: Set<string>;
  selectedResourceIds: Set<string>;
  selectedAppIds: Set<string>;
  presets: Preset[];
  currentSession: string | null;
  lastApplyResult: ApplyResult | null;
  lastCleanupSummary: CleanupSummary | null;
  tasksReport: TasksStartupReport | null;
  setTab: (tab: TabId) => void;
  init: () => Promise<void>;
  loadCatalog: (category?: string) => Promise<void>;
  loadPresets: () => Promise<void>;
  runScan: () => Promise<void>;
  scanResources: () => Promise<void>;
  toggleSelection: (id: string) => void;
  toggleResourceSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  selectAllResources: (ids: string[]) => void;
  clearSelection: () => void;
  ensureElevated: () => Promise<boolean>;
  applySelected: () => Promise<void>;
  applyPresetById: (presetId: string) => Promise<void>;
  previewResourceAction: (action: ResourceAction) => Promise<PreviewResourceItem[]>;
  applyResourceAction: (
    action: ResourceAction,
    preview?: PreviewResourceItem[],
  ) => Promise<void>;
  toggleAppSelection: (id: string) => void;
  selectAllApps: (ids: string[]) => void;
  scanInstalledApps: () => Promise<void>;
  previewAppUninstall: () => Promise<PreviewAppUninstall[]>;
  bulkUninstallApps: (preview?: PreviewAppUninstall[]) => Promise<void>;
  clearCleanupSummary: () => void;
  revertCurrentSession: () => Promise<void>;
  loadTasksReport: () => Promise<void>;
}

export const useDebloatStore = create<DebloatState>((set, get) => ({
  activeTab: "dashboard",
  elevated: false,
  loading: false,
  error: null,
  scanReport: null,
  resourceReport: null,
  installedAppsReport: null,
  tweaks: [],
  selectedIds: new Set(),
  selectedResourceIds: new Set(),
  selectedAppIds: new Set(),
  presets: [],
  currentSession: null,
  lastApplyResult: null,
  lastCleanupSummary: null,
  tasksReport: null,

  setTab: (tab) => set({ activeTab: tab }),

  init: async () => {
    try {
      const elevated = await api.isElevated();
      set({ elevated });
      await get().loadPresets();
      const session = await api.getCurrentSession();
      set({ currentSession: session });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  loadCatalog: async (category) => {
    set({ loading: true, error: null });
    try {
      const tweaks = await api.getCatalog(category);
      set({ tweaks, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  loadPresets: async () => {
    try {
      const presets = await api.getPresets();
      set({ presets });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  runScan: async () => {
    if (runScanInFlight) return runScanInFlight;

    runScanInFlight = (async () => {
      set({ loading: true, error: null });
      try {
        const [scanReport, tweaks, resourceReport] = await Promise.all([
          api.scanSystem(),
          api.getCatalog(),
          api.scanResourceUsage({ sampleSecs: 5 }).catch(() => null),
        ]);
        set({
          scanReport,
          tweaks,
          resourceReport: resourceReport ?? get().resourceReport,
          selectedResourceIds: new Set(),
          loading: false,
        });
      } catch (e) {
        set({ error: String(e), loading: false });
      }
    })();

    try {
      await runScanInFlight;
    } finally {
      runScanInFlight = null;
    }
  },

  scanResources: async () => {
    if (scanResourcesInFlight) return scanResourcesInFlight;

    scanResourcesInFlight = (async () => {
      set({ loading: true, error: null });
      try {
        const resourceReport = await api.scanResourceUsage({ sampleSecs: 5 });
        set({ resourceReport, loading: false, selectedResourceIds: new Set() });
      } catch (e) {
        set({ error: String(e), loading: false });
      }
    })();

    try {
      await scanResourcesInFlight;
    } finally {
      scanResourcesInFlight = null;
    }
  },

  toggleSelection: (id) => {
    const next = new Set(get().selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ selectedIds: next });
  },

  toggleResourceSelection: (id) => {
    const next = new Set(get().selectedResourceIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ selectedResourceIds: next });
  },

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  selectAllResources: (ids) => set({ selectedResourceIds: new Set(ids) }),

  clearSelection: () => set({ selectedIds: new Set() }),

  ensureElevated: async () => {
    if (get().elevated) return true;
    const ok = window.confirm(
      "Applying debloat changes requires Administrator privileges. Restart the app as Administrator now?",
    );
    if (!ok) return false;
    try {
      await api.requestElevation();
    } catch (e) {
      set({ error: String(e) });
    }
    return false;
  },

  applySelected: async () => {
    const ids = Array.from(get().selectedIds);
    if (ids.length === 0) return;
    if (!(await get().ensureElevated())) return;
    set({ loading: true, error: null });
    try {
      const preview = await api.previewChanges(ids);
      const advanced = preview.some((p) => p.risk === "advanced");
      if (advanced) {
        const ok = window.confirm(
          "You selected advanced tweaks that may affect system stability. Continue?",
        );
        if (!ok) {
          set({ loading: false });
          return;
        }
      }
      const result = await api.applyTweaks(ids, true);
      set({
        lastApplyResult: result,
        lastCleanupSummary: buildTweakCleanupSummary(result, preview),
        currentSession: result.sessionId,
        loading: false,
        selectedIds: new Set(),
      });
      await get().runScan();
      await get().scanResources();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  applyPresetById: async (presetId) => {
    if (!(await get().ensureElevated())) return;
    set({ loading: true, error: null });
    try {
      const preset = get().presets.find((p) => p.id === presetId);
      const allTweaks = await api.getCatalog();
      const result = await api.applyPreset(presetId, true);
      set({
        lastApplyResult: result,
        lastCleanupSummary: preset
          ? buildPresetCleanupSummary(result, preset, allTweaks)
          : buildTweakCleanupSummary(result, [], `${presetId} applied`),
        currentSession: result.sessionId,
        loading: false,
      });
      await get().runScan();
      await get().scanResources();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  previewResourceAction: async (action) => {
    const ids = Array.from(get().selectedResourceIds);
    return api.previewResourceActions(ids, action);
  },

  applyResourceAction: async (action, previewItems) => {
    const ids = Array.from(get().selectedResourceIds);
    if (ids.length === 0) return;
    if (!(await get().ensureElevated())) return;
    set({ loading: true, error: null });
    try {
      const preview = previewItems ?? (await api.previewResourceActions(ids, action));
      const entries =
        get().resourceReport?.entries.filter((e) => ids.includes(e.id)) ?? [];
      const result = await api.applyResourceActions(ids, action, true);
      set({
        lastApplyResult: result,
        lastCleanupSummary: buildResourceCleanupSummary(result, action, preview, entries),
        currentSession: result.sessionId,
        loading: false,
        selectedResourceIds: new Set(),
      });
      await get().scanResources();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  toggleAppSelection: (id) => {
    const next = new Set(get().selectedAppIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ selectedAppIds: next });
  },

  selectAllApps: (ids) => set({ selectedAppIds: new Set(ids) }),

  scanInstalledApps: async () => {
    set({ loading: true, error: null });
    try {
      const installedAppsReport = await api.scanInstalledApps();
      set({ installedAppsReport, loading: false, selectedAppIds: new Set() });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  previewAppUninstall: async () => {
    const ids = Array.from(get().selectedAppIds);
    return api.previewAppUninstall(ids);
  },

  bulkUninstallApps: async (previewItems) => {
    const ids = Array.from(get().selectedAppIds);
    if (ids.length === 0) return;
    if (!(await get().ensureElevated())) return;
    set({ loading: true, error: null });
    try {
      const preview = previewItems ?? (await api.previewAppUninstall(ids));
      const apps =
        get().installedAppsReport?.apps.filter((a) => ids.includes(a.id)) ?? [];
      const result = await api.bulkUninstallApps(ids, true);
      set({
        lastApplyResult: result,
        lastCleanupSummary: buildAppCleanupSummary(result, preview, apps),
        currentSession: result.sessionId,
        loading: false,
        selectedAppIds: new Set(),
      });
      await get().scanInstalledApps();
      await get().runScan();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  clearCleanupSummary: () => set({ lastCleanupSummary: null }),

  revertCurrentSession: async () => {
    const sessionId = get().currentSession;
    if (!sessionId) return;
    set({ loading: true, error: null });
    try {
      await api.revertSession(sessionId);
      set({ currentSession: null, lastCleanupSummary: null, loading: false });
      await get().runScan();
      await get().scanResources();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  loadTasksReport: async () => {
    set({ loading: true, error: null });
    try {
      const tasksReport = await api.scanTasksStartup();
      set({ tasksReport, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },
}));
