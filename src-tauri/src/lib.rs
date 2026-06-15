mod commands;
mod engine;
mod state;

use engine::{load_catalog, load_presets};
use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let catalog = load_catalog(app.handle())
                .expect("failed to load tweak catalog");
            let presets = load_presets(app.handle(), &catalog)
                .expect("failed to load presets");
            app.manage(AppState::new(catalog, presets));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::elevation::is_elevated,
            commands::elevation::request_elevation,
            commands::catalog::get_catalog,
            commands::scan::scan_system,
            commands::apply::preview_changes,
            commands::apply::create_restore_point,
            commands::apply::apply_tweaks,
            commands::revert::revert_session,
            commands::revert::get_current_session,
            commands::presets::get_presets,
            commands::presets::apply_preset,
            commands::presets::scan_tasks_startup,
            commands::resource::scan_resource_usage,
            commands::resource::preview_resource_actions,
            commands::resource::apply_resource_actions,
            commands::apps::scan_installed_apps,
            commands::apps::preview_app_uninstall,
            commands::apps::bulk_uninstall_apps,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
