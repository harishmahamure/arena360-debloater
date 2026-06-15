use std::collections::HashMap;
use std::path::PathBuf;

use chrono::Utc;
use tauri::AppHandle;

use super::error::EngineError;
use super::models::{ResourceEntry, ResourceScanReport, RiskLevel};
use super::paths;
use super::powershell::{self};
use super::protected::ProtectedRegistry;

pub struct ResourceScanner;

#[derive(Debug, serde::Deserialize)]
struct ScanPayload {
    entries: Vec<ResourceEntry>,
    #[serde(rename = "scannedAt")]
    scanned_at: String,
    #[serde(rename = "sampleSecs")]
    sample_secs: u32,
}

impl ResourceScanner {
    pub fn scan(
        app: &AppHandle,
        sample_secs: u32,
        min_cpu: f64,
        min_ram_mb: f64,
    ) -> Result<ResourceScanReport, EngineError> {
        if !powershell::is_windows() {
            return Ok(mock_report());
        }

        let script = paths::scripts_dir(app).join("scan/resource-usage.ps1");
        let output = run_script_with_args(
            &script,
            &[
                "-SampleSecs",
                &sample_secs.to_string(),
                "-MinCpu",
                &min_cpu.to_string(),
                "-MinRamMb",
                &min_ram_mb.to_string(),
            ],
        )?;

        if !output.success && output.stdout.is_empty() {
            return Err(EngineError::Script(output.stderr));
        }

        let payload: ScanPayload = serde_json::from_str(&output.stdout)
            .map_err(|e| EngineError::Script(format!("invalid scan JSON: {e}")))?;

        let mut entries = payload.entries;
        let protected_path = paths::resources_root(app).join("protected.json");
        if let Ok(registry) = ProtectedRegistry::load(&protected_path) {
            registry.apply_resources(&mut entries);
        }

        let high_usage_count = entries.len() as u32;

        Ok(ResourceScanReport {
            entries,
            scanned_at: payload.scanned_at,
            sample_secs: payload.sample_secs,
            high_usage_count,
        })
    }
}

fn run_script_with_args(
    script: &PathBuf,
    args: &[&str],
) -> Result<super::powershell::ScriptResult, EngineError> {
    if !script.exists() {
        return Err(EngineError::Script(format!(
            "script not found: {}",
            script.display()
        )));
    }

    if !powershell::is_windows() {
        return Ok(super::powershell::ScriptResult {
            success: true,
            stdout: String::new(),
            stderr: String::new(),
            exit_code: 0,
        });
    }

    let script_str = script.to_string_lossy();
    let mut cmd_args = vec![
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        script_str.as_ref(),
    ];
    cmd_args.extend_from_slice(args);

    let output = std::process::Command::new("powershell")
        .args(&cmd_args)
        .output()
        .map_err(|e| EngineError::Script(format!("failed to spawn powershell: {e}")))?;

    Ok(super::powershell::ScriptResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

fn mock_report() -> ResourceScanReport {
    ResourceScanReport {
        entries: vec![
            ResourceEntry {
                id: "proc:4400|pkg:Microsoft.YourPhone".into(),
                display_name: "Phone Link".into(),
                entry_type: "app".into(),
                process_name: "YourPhoneApp".into(),
                process_id: 4400,
                service_names: vec![],
                package_name: Some("Microsoft.YourPhone".into()),
                publisher: "Microsoft Corporation".into(),
                cpu_percent: 2.4,
                ram_mb: 312.5,
                gpu_percent: 0.8,
                can_stop: true,
                can_uninstall: true,
                is_protected: false,
                risk: RiskLevel::Safe,
                warning: None,
            },
            ResourceEntry {
                id: "proc:2200|svc:DiagTrack".into(),
                display_name: "DiagTrack".into(),
                entry_type: "service".into(),
                process_name: "svchost".into(),
                process_id: 2200,
                service_names: vec!["DiagTrack".into()],
                package_name: None,
                publisher: "Microsoft Corporation".into(),
                cpu_percent: 1.2,
                ram_mb: 85.0,
                gpu_percent: 0.0,
                can_stop: true,
                can_uninstall: false,
                is_protected: false,
                risk: RiskLevel::Advanced,
                warning: Some("Telemetry service".into()),
            },
            ResourceEntry {
                id: "proc:1100".into(),
                display_name: "OneDrive".into(),
                entry_type: "app".into(),
                process_name: "OneDrive".into(),
                process_id: 1100,
                service_names: vec![],
                package_name: None,
                publisher: "Microsoft Corporation".into(),
                cpu_percent: 0.8,
                ram_mb: 210.0,
                gpu_percent: 0.0,
                can_stop: true,
                can_uninstall: false,
                is_protected: false,
                risk: RiskLevel::Moderate,
                warning: None,
            },
        ],
        scanned_at: Utc::now().to_rfc3339(),
        sample_secs: 5,
        high_usage_count: 3,
    }
}

pub fn entries_map(entries: &[ResourceEntry]) -> HashMap<String, ResourceEntry> {
    entries.iter().map(|e| (e.id.clone(), e.clone())).collect()
}
