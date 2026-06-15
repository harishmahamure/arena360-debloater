use tauri::{AppHandle, State};

use crate::engine::models::RevertResult;
use crate::engine::reverter::Reverter;
use crate::state::AppState;

#[tauri::command]
pub async fn revert_session(
    app: AppHandle,
    session_id: String,
    state: State<'_, AppState>,
) -> Result<RevertResult, String> {
    let catalog = {
        let guard = state.inner.lock().map_err(|e| e.to_string())?;
        guard.catalog.clone()
    };
    let result = Reverter::revert_session(&app, &catalog, &session_id)
        .map_err(|e| e.to_string())?;
    if let Ok(mut guard) = state.inner.lock() {
        if guard.current_session.as_deref() == Some(session_id.as_str()) {
            guard.current_session = None;
        }
    }
    Ok(result)
}

#[tauri::command]
pub async fn get_current_session(state: State<'_, AppState>) -> Result<Option<String>, String> {
    let guard = state.inner.lock().map_err(|e| e.to_string())?;
    Ok(guard.current_session.clone())
}
