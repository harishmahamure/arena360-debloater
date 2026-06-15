use tauri::State;

use crate::engine::models::Tweak;
use crate::state::AppState;

#[tauri::command]
pub fn get_catalog(
    category: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<Tweak>, String> {
    let guard = state.inner.lock().map_err(|e| e.to_string())?;
    let tweaks = if let Some(cat) = category {
        guard.catalog.by_category(&cat)
    } else {
        guard.catalog.all()
    };
    Ok(tweaks)
}
