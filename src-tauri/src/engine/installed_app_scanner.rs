use std::collections::HashMap;

use chrono::Utc;
use tauri::AppHandle;

use super::error::EngineError;
use super::models::{InstalledApp, InstalledAppsReport, RiskLevel};
use super::paths;
use super::powershell;
use super::protected::ProtectedRegistry;

pub struct InstalledAppScanner;

#[derive(Debug, serde::Deserialize)]
struct ScanPayload {
    apps: Vec<InstalledApp>,
    #[serde(rename = "scannedAt")]
    scanned_at: String,
    #[serde(rename = "totalCount")]
    total_count: u32,
    #[serde(rename = "bloatCount")]
    bloat_count: u32,
}

impl InstalledAppScanner {
    pub fn scan(app: &AppHandle) -> Result<InstalledAppsReport, EngineError> {
        if !powershell::is_windows() {
            return Ok(mock_report());
        }

        let script = paths::scripts_dir(app).join("scan/list-installed-apps.ps1");
        let output = powershell::run_script(&script, 120)?;

        if !output.success && output.stdout.is_empty() {
            return Err(EngineError::Script(output.stderr));
        }

        let mut payload: ScanPayload = serde_json::from_str(&output.stdout)
            .map_err(|e| EngineError::Script(format!("invalid apps JSON: {e}")))?;

        let protected_path = paths::resources_root(app).join("protected.json");
        if let Ok(registry) = ProtectedRegistry::load(&protected_path) {
            registry.apply_apps(&mut payload.apps);
        }

        Ok(InstalledAppsReport {
            apps: payload.apps,
            scanned_at: payload.scanned_at,
            total_count: payload.total_count,
            bloat_count: payload.bloat_count,
        })
    }
}

pub fn apps_map(apps: &[InstalledApp]) -> HashMap<String, InstalledApp> {
    apps.iter().map(|a| (a.id.clone(), a.clone())).collect()
}

fn mock_report() -> InstalledAppsReport {
    let apps = vec![
        InstalledApp {
            id: "appx:Microsoft.YourPhone|pkg:Microsoft.YourPhone".into(),
            display_name: "Phone Link".into(),
            publisher: "Microsoft Corporation".into(),
            app_type: "appx".into(),
            package_name: Some("Microsoft.YourPhone".into()),
            uninstall_key: None,
            size_mb: 312.5,
            can_uninstall: true,
            is_protected: false,
            is_bloat: true,
            risk: RiskLevel::Safe,
            warning: None,
        },
        InstalledApp {
            id: "appx:Microsoft.MicrosoftEdge.Stable|pkg:Microsoft.MicrosoftEdge.Stable".into(),
            display_name: "Microsoft Edge".into(),
            publisher: "Microsoft Corporation".into(),
            app_type: "appx".into(),
            package_name: Some("Microsoft.MicrosoftEdge.Stable".into()),
            uninstall_key: None,
            size_mb: 450.0,
            can_uninstall: false,
            is_protected: true,
            is_bloat: false,
            risk: RiskLevel::Advanced,
            warning: Some("Protected system application".into()),
        },
        InstalledApp {
            id: "win32:7-Zip|key:HKLM:\\...".into(),
            display_name: "7-Zip".into(),
            publisher: "Igor Pavlov".into(),
            app_type: "win32".into(),
            package_name: None,
            uninstall_key: Some("HKLM:\\SOFTWARE\\...".into()),
            size_mb: 5.2,
            can_uninstall: true,
            is_protected: false,
            is_bloat: false,
            risk: RiskLevel::Safe,
            warning: None,
        },
        InstalledApp {
            id: "appx:Clipchamp.Clipchamp|pkg:Clipchamp.Clipchamp".into(),
            display_name: "Clipchamp".into(),
            publisher: "Microsoft Corp.".into(),
            app_type: "appx".into(),
            package_name: Some("Clipchamp.Clipchamp".into()),
            uninstall_key: None,
            size_mb: 180.0,
            can_uninstall: true,
            is_protected: false,
            is_bloat: true,
            risk: RiskLevel::Safe,
            warning: None,
        },
    ];
    InstalledAppsReport {
        total_count: apps.len() as u32,
        bloat_count: 2,
        scanned_at: Utc::now().to_rfc3339(),
        apps,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mock_report_has_apps() {
        let report = mock_report();
        assert!(report.total_count >= 3);
        assert!(report.bloat_count >= 1);
        let map = apps_map(&report.apps);
        assert_eq!(map.len(), report.apps.len());
    }
}
