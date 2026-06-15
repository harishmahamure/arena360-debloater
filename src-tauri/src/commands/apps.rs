use tauri::{AppHandle, State};

use crate::engine::app_uninstaller::AppUninstaller;
use crate::engine::installed_app_scanner::{self, InstalledAppScanner};
use crate::engine::models::{ApplyResult, InstalledApp, PreviewAppUninstall};
use crate::state::AppState;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkUninstallOptions {
    pub app_ids: Vec<String>,
    pub create_restore: bool,
}

#[tauri::command]
pub async fn scan_installed_apps(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<crate::engine::models::InstalledAppsReport, String> {
    let report = InstalledAppScanner::scan(&app).map_err(|e| e.to_string())?;

    if let Ok(mut guard) = state.inner.lock() {
        guard.installed_apps = installed_app_scanner::apps_map(&report.apps);
    }

    Ok(report)
}

#[tauri::command]
pub async fn preview_app_uninstall(
    app_ids: Vec<String>,
    state: State<'_, AppState>,
) -> Result<Vec<PreviewAppUninstall>, String> {
    let apps = resolve_apps(&state, &app_ids)?;
    Ok(AppUninstaller::preview(&apps))
}

#[tauri::command]
pub async fn bulk_uninstall_apps(
    app: AppHandle,
    options: BulkUninstallOptions,
    state: State<'_, AppState>,
) -> Result<ApplyResult, String> {
    let apps = resolve_apps(&state, &options.app_ids)?;
    let result = AppUninstaller::bulk_uninstall(&app, &apps, options.create_restore)
        .map_err(|e| e.to_string())?;

    if let Ok(mut guard) = state.inner.lock() {
        guard.current_session = Some(result.session_id.clone());
    }

    Ok(result)
}

fn resolve_apps(state: &State<'_, AppState>, app_ids: &[String]) -> Result<Vec<InstalledApp>, String> {
    let guard = state.inner.lock().map_err(|e| e.to_string())?;
    let mut apps = Vec::new();
    for id in app_ids {
        let app = guard
            .installed_apps
            .get(id)
            .cloned()
            .ok_or_else(|| format!("app not found: {id}. Run scan first."))?;
        apps.push(app);
    }
    Ok(apps)
}
