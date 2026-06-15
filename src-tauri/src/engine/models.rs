use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Safe,
    Moderate,
    Advanced,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TweakCategory {
    Apps,
    Privacy,
    Ui,
    Services,
    Cleanup,
    WindowsUpdate,
    Tasks,
}

impl TweakCategory {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Apps => "apps",
            Self::Privacy => "privacy",
            Self::Ui => "ui",
            Self::Services => "services",
            Self::Cleanup => "cleanup",
            Self::WindowsUpdate => "windows_update",
            Self::Tasks => "tasks",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "apps" => Some(Self::Apps),
            "privacy" => Some(Self::Privacy),
            "ui" => Some(Self::Ui),
            "services" => Some(Self::Services),
            "cleanup" => Some(Self::Cleanup),
            "windows_update" => Some(Self::WindowsUpdate),
            "tasks" => Some(Self::Tasks),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tweak {
    pub id: String,
    pub name: String,
    pub category: String,
    pub risk: RiskLevel,
    pub requires_reboot: bool,
    pub win11_build_min: u32,
    pub description: String,
    pub warning: Option<String>,
    pub detect_script: String,
    pub apply_script: String,
    pub revert_script: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TweakStatus {
    pub id: String,
    pub applied: bool,
    pub applicable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanReport {
    pub bloat_app_count: u32,
    pub bloat_app_size_mb: f64,
    pub unnecessary_service_count: u32,
    pub telemetry_enabled: bool,
    pub reclaimable_space_mb: f64,
    pub debloat_score: u32,
    pub tweak_statuses: Vec<TweakStatus>,
    pub scanned_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewItem {
    pub tweak_id: String,
    pub name: String,
    pub category: String,
    pub risk: RiskLevel,
    pub action: String,
    pub script_path: String,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyResultItem {
    pub tweak_id: String,
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyResult {
    pub session_id: String,
    pub items: Vec<ApplyResultItem>,
    pub success_count: u32,
    pub failure_count: u32,
    pub requires_reboot: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RevertResult {
    pub session_id: String,
    pub reverted_count: u32,
    pub failed_count: u32,
    pub items: Vec<ApplyResultItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresetSummary {
    pub apps: u32,
    pub services: u32,
    pub privacy: u32,
    pub ui: u32,
    pub cleanup: u32,
    pub windows_update: u32,
    pub tasks: u32,
    pub total: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Preset {
    pub id: String,
    pub name: String,
    pub description: String,
    pub target_user: String,
    pub tweak_ids: Vec<String>,
    pub summary: PresetSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeLogSnapshot {
    pub script_stdout: Option<String>,
    pub script_stderr: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_snapshot: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangeLogEntry {
    pub tweak_id: String,
    pub applied_at: String,
    pub method: String,
    pub snapshot: ChangeLogSnapshot,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionLog {
    pub session_id: String,
    pub created_at: String,
    pub restore_point_created: bool,
    pub entries: Vec<ChangeLogEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartupEntry {
    pub name: String,
    pub command: String,
    pub location: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledTaskEntry {
    pub name: String,
    pub path: String,
    pub state: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TasksStartupReport {
    pub startup_entries: Vec<StartupEntry>,
    pub scheduled_tasks: Vec<ScheduledTaskEntry>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ResourceAction {
    Stop,
    Uninstall,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceEntry {
    pub id: String,
    pub display_name: String,
    pub entry_type: String,
    pub process_name: String,
    pub process_id: u32,
    pub service_names: Vec<String>,
    pub package_name: Option<String>,
    pub publisher: String,
    pub cpu_percent: f64,
    pub ram_mb: f64,
    pub gpu_percent: f64,
    pub can_stop: bool,
    pub can_uninstall: bool,
    pub is_protected: bool,
    pub risk: RiskLevel,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceScanReport {
    pub entries: Vec<ResourceEntry>,
    pub scanned_at: String,
    pub sample_secs: u32,
    pub high_usage_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewResourceItem {
    pub entry_id: String,
    pub display_name: String,
    pub action: String,
    pub description: String,
    pub risk: RiskLevel,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    pub id: String,
    pub display_name: String,
    pub publisher: String,
    pub app_type: String,
    pub package_name: Option<String>,
    pub uninstall_key: Option<String>,
    pub size_mb: f64,
    pub can_uninstall: bool,
    pub is_protected: bool,
    pub is_bloat: bool,
    pub risk: RiskLevel,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledAppsReport {
    pub apps: Vec<InstalledApp>,
    pub scanned_at: String,
    pub total_count: u32,
    pub bloat_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewAppUninstall {
    pub app_id: String,
    pub display_name: String,
    pub app_type: String,
    pub action: String,
    pub risk: RiskLevel,
    pub warning: Option<String>,
}

