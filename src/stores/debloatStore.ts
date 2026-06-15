import { create } from "zustand";
import { api } from "../lib/tauri";
import type {
  ApplyResult,
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
  applySelected: () => Promise<void>;
  applyPresetById: (presetId: string) => Promise<void>;
  previewResourceAction: (action: ResourceAction) => Promise<PreviewResourceItem[]>;
  applyResourceAction: (action: ResourceAction) => Promise<void>;
  toggleAppSelection: (id: string) => void;
  selectAllApps: (ids: string[]) => void;
  scanInstalledApps: () => Promise<void>;
  previewAppUninstall: () => Promise<PreviewAppUninstall[]>;
  bulkUninstallApps: () => Promise<void>;
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
    set({ loading: true, error: null });
    try {
      const scanReport = await api.scanSystem();
      set({ scanReport, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  scanResources: async () => {
    set({ loading: true, error: null });
    try {
      const resourceReport = await api.scanResourceUsage({ sampleSecs: 5 });
      set({ resourceReport, loading: false, selectedResourceIds: new Set() });
    } catch (e) {
      set({ error: String(e), loading: false });
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

  applySelected: async () => {
    const ids = Array.from(get().selectedIds);
    if (ids.length === 0) return;
    set({ loading: true, error: null });
    try {
      await api.createRestorePoint("Debloater Session");
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
    set({ loading: true, error: null });
    try {
      await api.createRestorePoint(`Debloater Preset: ${presetId}`);
      const result = await api.applyPreset(presetId, true);
      set({
        lastApplyResult: result,
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

  applyResourceAction: async (action) => {
    const ids = Array.from(get().selectedResourceIds);
    if (ids.length === 0) return;
    set({ loading: true, error: null });
    try {
      await api.createRestorePoint("Debloater Resource Action");
      const result = await api.applyResourceActions(ids, action, true);
      set({
        lastApplyResult: result,
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

  bulkUninstallApps: async () => {
    const ids = Array.from(get().selectedAppIds);
    if (ids.length === 0) return;
    set({ loading: true, error: null });
    try {
      const result = await api.bulkUninstallApps(ids, true);
      set({
        lastApplyResult: result,
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

  revertCurrentSession: async () => {
    const sessionId = get().currentSession;
    if (!sessionId) return;
    set({ loading: true, error: null });
    try {
      await api.revertSession(sessionId);
      set({ currentSession: null, loading: false });
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
