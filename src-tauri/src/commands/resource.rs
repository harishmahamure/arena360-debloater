use tauri::{AppHandle, State};

use crate::engine::models::{
    ApplyResult, PreviewResourceItem, ResourceAction, ResourceEntry, ResourceScanReport,
};
use crate::engine::resource_remover::ResourceRemover;
use crate::engine::resource_scanner::{self, ResourceScanner};
use crate::state::AppState;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResourceOptions {
    pub sample_secs: Option<u32>,
    pub min_cpu: Option<f64>,
    pub min_ram_mb: Option<f64>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyResourceOptions {
    pub entry_ids: Vec<String>,
    pub action: ResourceAction,
    pub create_restore: bool,
}

#[tauri::command]
pub async fn scan_resource_usage(
    app: AppHandle,
    options: Option<ScanResourceOptions>,
    state: State<'_, AppState>,
) -> Result<ResourceScanReport, String> {
    let opts = options.unwrap_or(ScanResourceOptions {
        sample_secs: None,
        min_cpu: None,
        min_ram_mb: None,
    });

    let report = ResourceScanner::scan(
        &app,
        opts.sample_secs.unwrap_or(5),
        opts.min_cpu.unwrap_or(0.5),
        opts.min_ram_mb.unwrap_or(50.0),
    )
    .map_err(|e| e.to_string())?;

    if let Ok(mut guard) = state.inner.lock() {
        guard.resource_entries = resource_scanner::entries_map(&report.entries);
    }

    Ok(report)
}

#[tauri::command]
pub async fn preview_resource_actions(
    entry_ids: Vec<String>,
    action: ResourceAction,
    state: State<'_, AppState>,
) -> Result<Vec<PreviewResourceItem>, String> {
    let entries = resolve_entries(&state, &entry_ids)?;
    Ok(ResourceRemover::preview(&entries, action))
}

#[tauri::command]
pub async fn apply_resource_actions(
    app: AppHandle,
    options: ApplyResourceOptions,
    state: State<'_, AppState>,
) -> Result<ApplyResult, String> {
    let entries = resolve_entries(&state, &options.entry_ids)?;
    let result = ResourceRemover::apply(
        &app,
        &entries,
        options.action,
        options.create_restore,
    )
    .map_err(|e| e.to_string())?;

    if let Ok(mut guard) = state.inner.lock() {
        guard.current_session = Some(result.session_id.clone());
    }

    Ok(result)
}

fn resolve_entries(
    state: &State<'_, AppState>,
    entry_ids: &[String],
) -> Result<Vec<ResourceEntry>, String> {
    let guard = state.inner.lock().map_err(|e| e.to_string())?;
    let mut entries = Vec::new();
    for id in entry_ids {
        let entry = guard
            .resource_entries
            .get(id)
            .cloned()
            .ok_or_else(|| format!("resource entry not found: {id}. Run scan first."))?;
        entries.push(entry);
    }
    Ok(entries)
}
