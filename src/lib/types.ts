export type RiskLevel = "safe" | "moderate" | "advanced";

export interface Tweak {
  id: string;
  name: string;
  category: string;
  risk: RiskLevel;
  requiresReboot: boolean;
  win11BuildMin: number;
  description: string;
  warning: string | null;
  detectScript: string;
  applyScript: string;
  revertScript: string;
}

export interface TweakStatus {
  id: string;
  applied: boolean;
  applicable: boolean;
}

export interface ScanReport {
  bloatAppCount: number;
  bloatAppSizeMb: number;
  unnecessaryServiceCount: number;
  telemetryEnabled: boolean;
  reclaimableSpaceMb: number;
  debloatScore: number;
  tweakStatuses: TweakStatus[];
  scannedAt: string;
}

export interface PreviewItem {
  tweakId: string;
  name: string;
  category: string;
  risk: RiskLevel;
  action: string;
  description: string;
  scriptPath: string;
  warning: string | null;
}

export interface ApplyResultItem {
  tweakId: string;
  success: boolean;
  message: string;
}

export interface ApplyResult {
  sessionId: string;
  items: ApplyResultItem[];
  successCount: number;
  failureCount: number;
  requiresReboot: boolean;
}

export type CleanupKind = "tweaks" | "preset" | "resources" | "apps";

export interface CleanupSummaryItem {
  id: string;
  name: string;
  action: string;
  benefit: string;
  success: boolean;
  detail?: string;
}

export interface CleanupSummary {
  kind: CleanupKind;
  title: string;
  result: ApplyResult;
  items: CleanupSummaryItem[];
  benefits: string[];
}

export interface RevertResult {
  sessionId: string;
  revertedCount: number;
  failedCount: number;
  items: ApplyResultItem[];
}

export interface PresetSummary {
  apps: number;
  services: number;
  privacy: number;
  ui: number;
  cleanup: number;
  windowsUpdate: number;
  tasks: number;
  gaming: number;
  performance: number;
  total: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  targetUser: string;
  tweakIds: string[];
  summary: PresetSummary;
}

export interface StartupEntry {
  name: string;
  command: string;
  location: string;
  enabled: boolean;
}

export interface ScheduledTaskEntry {
  name: string;
  path: string;
  state: string;
  description: string;
}

export interface TasksStartupReport {
  startupEntries: StartupEntry[];
  scheduledTasks: ScheduledTaskEntry[];
}

export type TabId =
  | "dashboard"
  | "apps"
  | "privacy"
  | "services"
  | "cleanup"
  | "gaming"
  | "performance"
  | "presets"
  | "windows_update"
  | "tasks"
  | "background_usage";

export type ResourceAction = "stop" | "uninstall";

export interface ResourceEntry {
  id: string;
  displayName: string;
  entryType: string;
  processName: string;
  processId: number;
  serviceNames: string[];
  packageName: string | null;
  publisher: string;
  cpuPercent: number;
  ramMb: number;
  gpuPercent: number;
  gpuCopyPercent?: number;
  gpu3dPercent?: number;
  gpuVideoPercent?: number;
  gpuTopEngine?: string | null;
  diskMbps?: number;
  diskReadMbps?: number;
  diskWriteMbps?: number;
  networkConnections?: number;
  canStop: boolean;
  canUninstall: boolean;
  isProtected: boolean;
  risk: RiskLevel;
  warning: string | null;
}

export interface ResourceScanReport {
  entries: ResourceEntry[];
  scannedAt: string;
  sampleSecs: number;
  highUsageCount: number;
}

export interface PreviewResourceItem {
  entryId: string;
  displayName: string;
  action: string;
  description: string;
  risk: RiskLevel;
  warning: string | null;
}

export interface InstalledApp {
  id: string;
  displayName: string;
  publisher: string;
  appType: string;
  packageName: string | null;
  uninstallKey: string | null;
  sizeMb: number;
  canUninstall: boolean;
  isProtected: boolean;
  isBloat: boolean;
  risk: RiskLevel;
  warning: string | null;
}

export interface InstalledAppsReport {
  apps: InstalledApp[];
  scannedAt: string;
  totalCount: number;
  bloatCount: number;
}

export interface PreviewAppUninstall {
  appId: string;
  displayName: string;
  appType: string;
  action: string;
  risk: RiskLevel;
  warning: string | null;
}
