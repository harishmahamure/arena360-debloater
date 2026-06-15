use tauri::{AppHandle, State};

use crate::engine::models::ScanReport;
use crate::engine::scanner::Scanner;
use crate::state::AppState;

#[tauri::command]
pub async fn scan_system(app: AppHandle, state: State<'_, AppState>) -> Result<ScanReport, String> {
    let catalog = {
        let guard = state.inner.lock().map_err(|e| e.to_string())?;
        guard.catalog.clone()
    };
    Scanner::scan(&app, &catalog).map_err(|e| e.to_string())
}
