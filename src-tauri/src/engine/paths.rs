use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

pub fn resources_root(app: &AppHandle) -> PathBuf {
    if let Ok(dir) = app.path().resource_dir() {
        let bundled = dir.join("resources");
        if bundled.exists() {
            return bundled;
        }
        if dir.exists() {
            return dir;
        }
    }

    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources")
}

pub fn tweaks_dir(app: &AppHandle) -> PathBuf {
    resources_root(app).join("tweaks")
}

pub fn presets_dir(app: &AppHandle) -> PathBuf {
    resources_root(app).join("presets")
}

pub fn scripts_dir(app: &AppHandle) -> PathBuf {
    resources_root(app).join("scripts")
}

pub fn resolve_script(app: &AppHandle, relative: &str) -> PathBuf {
    scripts_dir(app).join(relative.trim_start_matches("scripts/"))
}

pub fn sessions_dir() -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("debloater").join("sessions")
}

pub fn session_path(session_id: &str) -> PathBuf {
    sessions_dir().join(format!("{session_id}.json"))
}

pub fn ensure_sessions_dir() -> std::io::Result<PathBuf> {
    let dir = sessions_dir();
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn script_exists(app: &AppHandle, relative: &str) -> bool {
    resolve_script(app, relative).exists()
}

pub fn validate_path_exists(path: &Path, label: &str) -> Result<(), String> {
    if path.exists() {
        Ok(())
    } else {
        Err(format!("{label} not found: {}", path.display()))
    }
}
