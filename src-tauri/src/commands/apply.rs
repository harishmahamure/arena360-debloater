use tauri::{AppHandle, State};

use crate::engine::executor::Executor;
use crate::engine::models::{ApplyResult, PreviewItem};
use crate::state::AppState;

#[tauri::command]
pub async fn preview_changes(
    app: AppHandle,
    tweak_ids: Vec<String>,
    state: State<'_, AppState>,
) -> Result<Vec<PreviewItem>, String> {
    let catalog = {
        let guard = state.inner.lock().map_err(|e| e.to_string())?;
        guard.catalog.clone()
    };
    Executor::preview(&app, &catalog, &tweak_ids).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_restore_point(label: String) -> Result<bool, String> {
    Executor::create_restore_point(&label).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn apply_tweaks(
    app: AppHandle,
    tweak_ids: Vec<String>,
    create_restore: bool,
    state: State<'_, AppState>,
) -> Result<ApplyResult, String> {
    let catalog = {
        let guard = state.inner.lock().map_err(|e| e.to_string())?;
        guard.catalog.clone()
    };
    let result = Executor::apply(&app, &catalog, &tweak_ids, create_restore)
        .map_err(|e| e.to_string())?;
    if let Ok(mut guard) = state.inner.lock() {
        guard.current_session = Some(result.session_id.clone());
    }
    Ok(result)
}
