use crate::engine::elevation;

#[tauri::command]
pub fn is_elevated() -> bool {
    elevation::is_elevated()
}

#[tauri::command]
pub fn request_elevation() -> Result<(), String> {
    elevation::request_elevation()
}
