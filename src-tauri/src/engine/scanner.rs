use chrono::Utc;
use tauri::AppHandle;

use super::catalog::TweakCatalog;
use super::error::EngineError;
use super::models::{ScanReport, TweakStatus};
use super::paths;
use super::powershell::{self, run_detect};

pub struct Scanner;

impl Scanner {
    pub fn scan(app: &AppHandle, catalog: &TweakCatalog) -> Result<ScanReport, EngineError> {
        let mut tweak_statuses = Vec::new();
        let mut bloat_app_count = 0u32;
        let mut unnecessary_service_count = 0u32;
        let mut telemetry_enabled = false;
        let mut reclaimable_space_mb = 0.0f64;

        for tweak in catalog.all() {
            let script_path = paths::resolve_script(app, &tweak.detect_script);
            let applied = run_detect(&script_path).unwrap_or(false);
            let applicable = !applied;

            if tweak.category == "apps" && applicable {
                bloat_app_count += 1;
            }
            if tweak.category == "services" && applicable {
                unnecessary_service_count += 1;
            }
            if tweak.id == "disable-diagtrack" && applicable {
                telemetry_enabled = true;
            }
            if tweak.category == "cleanup" && applicable {
                reclaimable_space_mb += estimate_cleanup_mb(&tweak.id);
            }

            tweak_statuses.push(TweakStatus {
                id: tweak.id.clone(),
                applied,
                applicable,
            });
        }

        let applicable_count = tweak_statuses.iter().filter(|s| s.applicable).count() as u32;
        let total = tweak_statuses.len().max(1) as u32;
        let debloat_score = ((applicable_count as f64 / total as f64) * 100.0).round() as u32;

        if !powershell::is_windows() {
            bloat_app_count = 8;
            unnecessary_service_count = 4;
            telemetry_enabled = true;
            reclaimable_space_mb = 2048.0;
        }

        Ok(ScanReport {
            bloat_app_count,
            bloat_app_size_mb: bloat_app_count as f64 * 120.0,
            unnecessary_service_count,
            telemetry_enabled,
            reclaimable_space_mb,
            debloat_score,
            tweak_statuses,
            scanned_at: Utc::now().to_rfc3339(),
        })
    }
}

fn estimate_cleanup_mb(tweak_id: &str) -> f64 {
    match tweak_id {
        "clear-temp-files" => 512.0,
        "clear-update-cache" => 1024.0,
        "dism-component-cleanup" => 768.0,
        "clear-delivery-optimization" => 256.0,
        _ => 64.0,
    }
}
