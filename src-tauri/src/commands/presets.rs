use tauri::{AppHandle, State};

use crate::engine::executor::Executor;
use crate::engine::models::{ApplyResult, Preset, TasksStartupReport};
use crate::engine::powershell;
use crate::state::AppState;

#[tauri::command]
pub fn get_presets(state: State<'_, AppState>) -> Result<Vec<Preset>, String> {
    let guard = state.inner.lock().map_err(|e| e.to_string())?;
    Ok(guard.presets.all())
}

#[tauri::command]
pub async fn apply_preset(
    app: AppHandle,
    preset_id: String,
    create_restore: bool,
    state: State<'_, AppState>,
) -> Result<ApplyResult, String> {
    let (catalog, tweak_ids) = {
        let guard = state.inner.lock().map_err(|e| e.to_string())?;
        let preset = guard.presets.get(&preset_id).map_err(|e| e.to_string())?;
        (guard.catalog.clone(), preset.tweak_ids.clone())
    };
    let result = Executor::apply_preset(&app, &catalog, &tweak_ids, create_restore)
        .map_err(|e| e.to_string())?;
    if let Ok(mut guard) = state.inner.lock() {
        guard.current_session = Some(result.session_id.clone());
    }
    Ok(result)
}

#[tauri::command]
pub async fn scan_tasks_startup() -> Result<TasksStartupReport, String> {
    let json = powershell::scan_startup_and_tasks().map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}
